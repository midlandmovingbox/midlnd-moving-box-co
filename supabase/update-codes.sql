-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  source text,                                   -- who it was handed out to (partner, card, event)
  type text not null default 'percent',          -- percent | amount
  value numeric not null,
  applies_to text not null default 'total',      -- base (package price) | rentals (package + add-ons) | total (everything before tax); percent codes only
  max_uses int,                                  -- null = unlimited
  expires_on date,                               -- null = never
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table discount_codes enable row level security;

alter table reservations add column if not exists discount_code text;
alter table reservations add column if not exists discount_amount numeric not null default 0;
create index if not exists reservations_discount_code_idx on reservations (discount_code);

-- Referrers: the people/businesses who hand out codes (all fields optional except a name or company)
create table if not exists referrers (
  id uuid primary key default gen_random_uuid(),
  name text,
  company text,
  phone text,
  email text,
  cards_distributed text,
  notes text,
  created_at timestamptz not null default now()
);
alter table referrers enable row level security;
alter table discount_codes add column if not exists referrer_id uuid references referrers(id) on delete set null;
