import { createHash } from 'node:crypto';
import {
  GOOGLE_CSS2_REQUEST_MAX_BYTES,
  serializeGoogleCss2Request,
  type FontLoadingPlan,
} from './font-loading-plan';

export const MANAGED_FONT_BLOCK_START = '<!-- mercury:managed-font-loading:start -->';
export const MANAGED_FONT_BLOCK_END = '<!-- mercury:managed-font-loading:end -->';
const MANAGED_PLAN_NAME = 'mercury:font-loading-plan';
const OWNERSHIP_TOKEN = 'mercury:managed-font-loading:';
const MAX_DEMO_TYPEKIT_STYLESHEET = 'https://use.typekit.net/bge7mjy.css';
const MAX_DEMO_TYPEKIT_FAMILIES = new Set(['peridot-pe-variable', 'reel-medium']);

export interface ManagedFontBlockResult {
  html: string;
  block: string;
  canonicalPlanJson: string;
  fontLoadingHash: string;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key, index) => key === keys[index]);
}

export function assertCanonicalFontLoadingPlan(value: unknown): asserts value is FontLoadingPlan {
  if (!value || typeof value !== 'object') throw new Error('managed font block plan is malformed');
  const plan = value as Record<string, unknown>;
  const legacyShape = hasExactKeys(plan, ['href', 'families']) && typeof plan.href === 'string';
  const currentShape = hasExactKeys(plan, ['hrefs', 'families']) && Array.isArray(plan.hrefs);
  if ((!legacyShape && !currentShape) || !Array.isArray(plan.families)) {
    throw new Error('managed font block plan is malformed');
  }
  let priorFamily = '';
  for (const family of plan.families) {
    if (!family || typeof family !== 'object') throw new Error('managed font block plan is malformed');
    const row = family as Record<string, unknown>;
    if (
      !hasExactKeys(row, ['cssFamilyName', 'faces']) ||
      typeof row.cssFamilyName !== 'string' ||
      row.cssFamilyName.length === 0 ||
      row.cssFamilyName !== row.cssFamilyName.normalize('NFC') ||
      row.cssFamilyName <= priorFamily ||
      !Array.isArray(row.faces) ||
      row.faces.length === 0
    ) {
      throw new Error('managed font block plan is malformed');
    }
    priorFamily = row.cssFamilyName;
    let priorFace = '';
    for (const face of row.faces) {
      if (!face || typeof face !== 'object') throw new Error('managed font block plan is malformed');
      const item = face as Record<string, unknown>;
      const faceKey = `${item.style === 'normal' ? '0' : '1'}:${String(item.weight).padStart(10, '0')}`;
      if (
        !hasExactKeys(item, ['weight', 'style']) ||
        typeof item.weight !== 'number' ||
        !Number.isInteger(item.weight) ||
        item.weight < 1 ||
        item.weight > 1000 ||
        (item.style !== 'normal' && item.style !== 'italic') ||
        faceKey <= priorFace
      ) {
        throw new Error('managed font block plan is malformed');
      }
      priorFace = faceKey;
    }
  }
  if (legacyShape) {
    const hrefBytes = Buffer.byteLength(plan.href as string, 'utf8');
    if (hrefBytes > GOOGLE_CSS2_REQUEST_MAX_BYTES) {
      throw new Error(
        `Google CSS2 request is ${hrefBytes} bytes; maximum is ${GOOGLE_CSS2_REQUEST_MAX_BYTES}.`,
      );
    }
    if (serializeGoogleCss2Request(plan.families as FontLoadingPlan['families']) !== plan.href) {
      throw new Error('managed font block plan is non-canonical');
    }
    return;
  }
  const hrefs = plan.hrefs as unknown[];
  if (hrefs.length === 0 || hrefs.length > 8 || new Set(hrefs).size !== hrefs.length) {
    throw new Error('managed font block plan is malformed');
  }
  for (const href of hrefs) {
    if (typeof href !== 'string' || Buffer.byteLength(href, 'utf8') > GOOGLE_CSS2_REQUEST_MAX_BYTES) {
      throw new Error('managed font block plan is malformed');
    }
  }
  const families = plan.families as FontLoadingPlan['families'];
  const googleFamilies = families.filter(
    (family) => !MAX_DEMO_TYPEKIT_FAMILIES.has(family.cssFamilyName),
  );
  const usesTypekit = googleFamilies.length !== families.length;
  const expectedHrefs = [
    ...(googleFamilies.length > 0 ? [serializeGoogleCss2Request(googleFamilies)] : []),
    ...(usesTypekit ? [MAX_DEMO_TYPEKIT_STYLESHEET] : []),
  ];
  if (JSON.stringify(hrefs) !== JSON.stringify(expectedHrefs)) {
    throw new Error('managed font block plan is non-canonical');
  }
}

function planHrefs(plan: FontLoadingPlan): string[] {
  return plan.hrefs ?? (plan.href ? [plan.href] : []);
}

/** Parse only the exact byte representation emitted by the canonical resolver. */
export function parseCanonicalFontLoadingPlanJson(raw: string): FontLoadingPlan {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('resolved font loading plan JSON is malformed');
  }
  assertCanonicalFontLoadingPlan(parsed);
  if (raw !== JSON.stringify(parsed)) {
    throw new Error('resolved font loading plan JSON is non-canonical');
  }
  return parsed;
}

export function renderManagedFontBlock(plan: FontLoadingPlan): {
  block: string;
  canonicalPlanJson: string;
  fontLoadingHash: string;
} {
  assertCanonicalFontLoadingPlan(plan);
  const canonicalPlanJson = JSON.stringify(plan);
  const encodedPlan = Buffer.from(canonicalPlanJson, 'utf8').toString('base64url');
  const hrefs = planHrefs(plan);
  const hasGoogleFonts = hrefs.some((href) => href.startsWith('https://fonts.googleapis.com/'));
  const hasTypekit = hrefs.includes(MAX_DEMO_TYPEKIT_STYLESHEET);
  const block = [
    MANAGED_FONT_BLOCK_START,
    ...(hasGoogleFonts ? [
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    ] : []),
    ...(hasTypekit ? [
      '<link rel="preconnect" href="https://use.typekit.net">',
      '<link rel="preconnect" href="https://p.typekit.net">',
    ] : []),
    ...hrefs.map((href) => `<link rel="stylesheet" href="${escapeHtmlAttribute(href)}">`),
    `<meta name="${MANAGED_PLAN_NAME}" content="${encodedPlan}">`,
    MANAGED_FONT_BLOCK_END,
  ].join('\n');
  const fontLoadingHash = createHash('sha256')
    .update(canonicalPlanJson, 'utf8')
    .update('\0', 'utf8')
    .update(block, 'utf8')
    .digest('hex');
  return { block, canonicalPlanJson, fontLoadingHash };
}

function validateExistingBlock(block: string): void {
  const meta = /<meta name="mercury:font-loading-plan" content="([A-Za-z0-9_-]+)">/.exec(block);
  if (!meta || block.match(/<meta name="mercury:font-loading-plan"/g)?.length !== 1) {
    throw new Error('existing managed font block is malformed');
  }
  let decoded: string;
  let parsed: unknown;
  try {
    decoded = Buffer.from(meta[1]!, 'base64url').toString('utf8');
    parsed = JSON.parse(decoded);
  } catch {
    throw new Error('existing managed font block plan is malformed');
  }
  assertCanonicalFontLoadingPlan(parsed);
  const canonical = JSON.stringify(parsed);
  if (decoded !== canonical || Buffer.from(decoded, 'utf8').toString('base64url') !== meta[1]) {
    throw new Error('existing managed font block plan is non-canonical');
  }
  if (renderManagedFontBlock(parsed).block !== block) {
    throw new Error('existing managed font block is tampered');
  }
}

/** Insert or replace the single compiler-owned block without touching direct-edit links. */
export function updateManagedFontBlock(html: string, plan: FontLoadingPlan): ManagedFontBlockResult {
  const rendered = renderManagedFontBlock(plan);
  const starts: number[] = [];
  const ends: number[] = [];
  for (let index = html.indexOf(MANAGED_FONT_BLOCK_START); index >= 0; index = html.indexOf(MANAGED_FONT_BLOCK_START, index + 1)) starts.push(index);
  for (let index = html.indexOf(MANAGED_FONT_BLOCK_END); index >= 0; index = html.indexOf(MANAGED_FONT_BLOCK_END, index + 1)) ends.push(index);
  const ownershipMentions = html.split(OWNERSHIP_TOKEN).length - 1;
  if (ownershipMentions !== starts.length + ends.length || starts.length !== ends.length || starts.length > 1) {
    throw new Error('generated HTML contains malformed or duplicate managed font block markers');
  }

  let updated: string;
  if (starts.length === 1) {
    const start = starts[0]!;
    const end = ends[0]!;
    if (end < start) throw new Error('generated HTML contains nested managed font block markers');
    const afterEnd = end + MANAGED_FONT_BLOCK_END.length;
    const existing = html.slice(start, afterEnd);
    validateExistingBlock(existing);
    updated = html.slice(0, start) + rendered.block + html.slice(afterEnd);
  } else {
    const headClosers = [...html.matchAll(/<\/head\s*>/gi)];
    if (headClosers.length !== 1) {
      throw new Error('generated HTML must contain exactly one closing head tag');
    }
    const close = headClosers[0]!;
    const prefix = html.slice(0, close.index!);
    const separator = prefix.endsWith('\n') ? '' : '\n';
    updated = `${prefix}${separator}${rendered.block}\n${html.slice(close.index!)}`;
  }
  return { html: updated, ...rendered };
}
