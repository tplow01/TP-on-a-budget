import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  GOOGLE_CSS2_REQUEST_MAX_BYTES,
  serializeGoogleCss2Request,
  type FontLoadingPlan,
} from './font-loading-plan';
import { assertCanonicalFontLoadingPlan, renderManagedFontBlock } from './managed-font-block';

const fixtures = JSON.parse(
  readFileSync(new URL('./fixtures/font-loading-plan-cases.json', import.meta.url), 'utf8'),
) as {
  cases: Array<{
    name: string;
    families: FontLoadingPlan['families'];
    expectedHref: string;
  }>;
  requestLimit: { familyCount: number; familyNamePrefix: string };
};

describe('canonical font loading plan', () => {
  it('accepts a mixed Google and Adobe Fonts loading plan', () => {
    const families = [
      { cssFamilyName: 'Inter', faces: [{ weight: 400, style: 'normal' as const }] },
      { cssFamilyName: 'reel-medium', faces: [{ weight: 400, style: 'normal' as const }] },
    ];

    expect(() => assertCanonicalFontLoadingPlan({
      hrefs: [
        serializeGoogleCss2Request([families[0]!]),
        'https://use.typekit.net/bge7mjy.css',
      ],
      families,
    })).not.toThrow();
  });

  it('rejects an unapproved stylesheet provider', () => {
    expect(() => assertCanonicalFontLoadingPlan({
      hrefs: ['https://example.com/fonts.css'],
      families: [{ cssFamilyName: 'Example', faces: [{ weight: 400, style: 'normal' }] }],
    })).toThrow('non-canonical');
  });

  it('rejects a Google stylesheet that does not match the declared Google families', () => {
    expect(() => assertCanonicalFontLoadingPlan({
      hrefs: [
        'https://fonts.googleapis.com/css2?family=Other&display=swap',
        'https://use.typekit.net/bge7mjy.css',
      ],
      families: [
        { cssFamilyName: 'Inter', faces: [{ weight: 400, style: 'normal' }] },
        { cssFamilyName: 'reel-medium', faces: [{ weight: 400, style: 'normal' }] },
      ],
    })).toThrow('non-canonical');
  });

  it('rejects an unpinned Typekit kit', () => {
    expect(() => assertCanonicalFontLoadingPlan({
      hrefs: ['https://use.typekit.net/other.css'],
      families: [{ cssFamilyName: 'reel-medium', faces: [{ weight: 400, style: 'normal' }] }],
    })).toThrow('non-canonical');
  });

  it('adds Typekit preconnects only when the pinned kit participates', () => {
    const typekit = renderManagedFontBlock({
      hrefs: ['https://use.typekit.net/bge7mjy.css'],
      families: [{ cssFamilyName: 'reel-medium', faces: [{ weight: 400, style: 'normal' }] }],
    }).block;
    expect(typekit).toContain('<link rel="preconnect" href="https://use.typekit.net">');
    expect(typekit).toContain('<link rel="preconnect" href="https://p.typekit.net">');

    const googleFamilies = [
      { cssFamilyName: 'Inter', faces: [{ weight: 400, style: 'normal' as const }] },
    ];
    const google = renderManagedFontBlock({
      hrefs: [serializeGoogleCss2Request(googleFamilies)],
      families: googleFamilies,
    }).block;
    expect(google).not.toContain('typekit.net');
  });

  it.each(fixtures.cases)('serializes $name', (fixture) => {
    expect(serializeGoogleCss2Request(fixture.families)).toBe(fixture.expectedHref);
  });

  it('rejects an oversized request without dropping any family', () => {
    const { familyCount, familyNamePrefix } = fixtures.requestLimit;
    const families = Array.from({ length: familyCount }, (_, index) => ({
      cssFamilyName: `${familyNamePrefix}${String(index).padStart(3, '0')}`,
      faces: [{ weight: 400, style: 'normal' as const }],
    }));
    const href = serializeGoogleCss2Request(families);

    expect(Buffer.byteLength(href, 'utf8')).toBeGreaterThan(GOOGLE_CSS2_REQUEST_MAX_BYTES);
    expect(() => assertCanonicalFontLoadingPlan({ href, families })).toThrow(
      `maximum is ${GOOGLE_CSS2_REQUEST_MAX_BYTES}`,
    );
  });

  it.each([0, -1, 1001])('rejects out-of-range canonical plan weight %s', (weight) => {
    const families = [{
      cssFamilyName: 'Inter',
      faces: [{ weight, style: 'normal' as const }],
    }];

    expect(() => assertCanonicalFontLoadingPlan({
      href: serializeGoogleCss2Request(families),
      families,
    })).toThrow('managed font block plan is malformed');
  });

  it('accepts the inclusive canonical plan weight boundaries', () => {
    const families = [{
      cssFamilyName: 'Inter',
      faces: [
        { weight: 1, style: 'normal' as const },
        { weight: 1000, style: 'normal' as const },
      ],
    }];

    expect(() => assertCanonicalFontLoadingPlan({
      href: serializeGoogleCss2Request(families),
      families,
    })).not.toThrow();
  });
});
