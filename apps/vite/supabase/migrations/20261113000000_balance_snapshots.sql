-- One balance reading per account per day, written by the plaid Edge Function
-- (service role) on every sync. The client only reads its own rows.
create table if not exists public.balance_snapshots (
  user_id    uuid not null references auth.users (id) on delete cascade,
  account_id text not null,
  day        date not null,
  current    numeric,
  available  numeric,
  type       text,
  primary key (account_id, day)
);
alter table public.balance_snapshots enable row level security;

drop policy if exists "balance_snapshots_select_own" on public.balance_snapshots;
create policy "balance_snapshots_select_own" on public.balance_snapshots
  for select to authenticated using ((select auth.uid()) = user_id);
