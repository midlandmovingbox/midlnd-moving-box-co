-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  source text,                                   -- who it was handed out to (partner, card, event)
  type text not null default 'percent',          -- percent | amount
  value numeric not null,
  applies_to text not null default 'total',      -- base (package price) | total (everything before tax); percent codes only
  max_uses int,                                  -- null = unlimited
  expires_on date,                               -- null = never
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table discount_codes enable row level security;

alter table reservations add column if not exists discount_code text;
alter table reservations add column if not exists discount_amount numeric not null default 0;
create index if not exists reservations_discount_code_idx on reservations (discount_code);
