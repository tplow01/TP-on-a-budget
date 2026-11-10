-- User-chosen category for one transaction, overriding the automatic guess.
-- Just a label (not a financial action), so the client can read/write its own
-- rows directly with the anon key — no Edge Function needed.
create table if not exists public.transaction_categories (
  transaction_id text primary key references public.transactions (transaction_id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  category        text not null,
  updated_at      timestamptz not null default now()
);
alter table public.transaction_categories enable row level security;

drop policy if exists "transaction_categories_select_own" on public.transaction_categories;
create policy "transaction_categories_select_own" on public.transaction_categories
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "transaction_categories_insert_own" on public.transaction_categories;
create policy "transaction_categories_insert_own" on public.transaction_categories
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "transaction_categories_update_own" on public.transaction_categories;
create policy "transaction_categories_update_own" on public.transaction_categories
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "transaction_categories_delete_own" on public.transaction_categories;
create policy "transaction_categories_delete_own" on public.transaction_categories
  for delete to authenticated using ((select auth.uid()) = user_id);
