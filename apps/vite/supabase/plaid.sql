-- Plaid bank connections — run once in Supabase: SQL Editor → New query → Run.

-- Access tokens for each linked bank ("item"). RLS is on with NO policies,
-- so the browser can never read these; only the Edge Function (service role) can.
create table if not exists public.plaid_items (
  item_id      text primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  access_token text not null,
  institution  text,
  created_at   timestamptz not null default now()
);
alter table public.plaid_items enable row level security;

-- Account names + balances. Users can read their own; only the Edge Function writes.
create table if not exists public.bank_accounts (
  account_id  text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  item_id     text not null references public.plaid_items (item_id) on delete cascade,
  institution text,
  name        text not null,
  mask        text,
  type        text not null,
  subtype     text,
  current     numeric,
  available   numeric,
  updated_at  timestamptz not null default now()
);
alter table public.bank_accounts enable row level security;

drop policy if exists "bank_accounts_select_own" on public.bank_accounts;
create policy "bank_accounts_select_own" on public.bank_accounts
  for select to authenticated using ((select auth.uid()) = user_id);

-- Transactions (for Actual vs plan + trends). Safe to run again on an existing project.
alter table public.plaid_items add column if not exists cursor text;

create table if not exists public.transactions (
  transaction_id    text primary key,
  user_id           uuid not null references auth.users (id) on delete cascade,
  item_id           text not null references public.plaid_items (item_id) on delete cascade,
  account_id        text not null,
  date              date not null,
  name              text,
  merchant_name     text,
  amount            numeric not null,
  iso_currency_code text,
  pfc_primary       text,
  pfc_detailed      text,
  pending           boolean not null default false
);
create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select to authenticated using ((select auth.uid()) = user_id);

-- Live updates: let the app hear about new balances/transactions instantly (Supabase Realtime).
do $$ begin
  alter publication supabase_realtime add table public.bank_accounts;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.transactions;
exception when duplicate_object then null; end $$;

-- Retention: delete transactions older than 24 months, every night at 03:00 UTC.
-- Needs the pg_cron extension (Database → Extensions → pg_cron → Enable) before running this part.
create extension if not exists pg_cron;
select cron.unschedule('purge-old-transactions') where exists (select 1 from cron.job where jobname = 'purge-old-transactions');
select cron.schedule('purge-old-transactions', '0 3 * * *',
  $$delete from public.transactions where date < (current_date - interval '24 months')$$);
