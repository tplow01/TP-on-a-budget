-- Diagnostic log for failed Plaid syncs — lets us see what Plaid actually
-- returned without relying on Edge Function console logs.
create table if not exists public.sync_errors (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  item_id    text,
  action     text not null,
  message    text,
  code       text,
  created_at timestamptz not null default now()
);
alter table public.sync_errors enable row level security;

drop policy if exists "sync_errors_select_own" on public.sync_errors;
create policy "sync_errors_select_own" on public.sync_errors
  for select to authenticated using ((select auth.uid()) = user_id);
