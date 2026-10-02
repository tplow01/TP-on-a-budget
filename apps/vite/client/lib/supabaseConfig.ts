/**
 * Supabase connection settings.
 *
 * Either set these in `apps/vite/.env.local`:
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 * or paste them into the fallback strings below.
 *
 * The anon (public) key is safe to ship in the browser — Row Level Security
 * in `apps/vite/supabase/schema.sql` is what keeps each user's budget private.
 * Never put the service_role key here.
 */
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || ""
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
