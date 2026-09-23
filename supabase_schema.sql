-- ============================================================
-- Spendly Cloud Database Schema
-- Copy and run this script in your Supabase SQL Editor
-- (https://supabase.com/dashboard/project/cpbadvkgajzpxojvhfdv/sql)
-- ============================================================

-- 1. Main Sync Snapshot table (Atomic backup for 1-click cloud sync & restore)
create table if not exists spendly_sync (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Structured tables (for direct querying in Supabase)
create table if not exists wallets (
  id bigint primary key,
  name text not null,
  type text not null,
  balance numeric not null default 0,
  color text,
  icon text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists categories (
  id bigint primary key,
  name text not null,
  type text not null,
  icon text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists transactions (
  id bigint primary key,
  type text not null,
  amount numeric not null,
  category_id bigint,
  wallet_id bigint not null,
  destination_wallet_id bigint,
  title text,
  date text not null,
  time text not null,
  notes text,
  created_at bigint,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists debts (
  id bigint primary key,
  type text not null,
  person_name text not null,
  amount numeric not null,
  date text not null,
  due_date text,
  notes text,
  settled boolean default false,
  settled_date text,
  created_at bigint,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists expense_templates (
  id bigint primary key,
  name text not null,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists custom_rekap_cards (
  id bigint primary key,
  name text not null,
  start_date text not null,
  end_date text not null,
  created_at bigint,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table spendly_sync enable row level security;
alter table wallets enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table debts enable row level security;
alter table expense_templates enable row level security;
alter table custom_rekap_cards enable row level security;

-- Allow anon public access policies
create policy "Allow all on spendly_sync" on spendly_sync for all using (true) with check (true);
create policy "Allow all on wallets" on wallets for all using (true) with check (true);
create policy "Allow all on categories" on categories for all using (true) with check (true);
create policy "Allow all on transactions" on transactions for all using (true) with check (true);
create policy "Allow all on debts" on debts for all using (true) with check (true);
create policy "Allow all on expense_templates" on expense_templates for all using (true) with check (true);
create policy "Allow all on custom_rekap_cards" on custom_rekap_cards for all using (true) with check (true);
