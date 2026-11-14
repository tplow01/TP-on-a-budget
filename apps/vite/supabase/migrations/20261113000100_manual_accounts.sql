-- Accounts the user tracks by hand (cash, investments, etc.) that Plaid doesn't cover.
create table if not exists public.manual_accounts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  type       text not null check (type in ('cash','investment','credit','other')),
  balance    numeric not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.manual_accounts enable row level security;

drop policy if exists "manual_accounts_select_own" on public.manual_accounts;
create policy "manual_accounts_select_own" on public.manual_accounts
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "manual_accounts_insert_own" on public.manual_accounts;
create policy "manual_accounts_insert_own" on public.manual_accounts
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "manual_accounts_update_own" on public.manual_accounts;
create policy "manual_accounts_update_own" on public.manual_accounts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "manual_accounts_delete_own" on public.manual_accounts;
create policy "manual_accounts_delete_own" on public.manual_accounts
  for delete to authenticated using ((select auth.uid()) = user_id);
