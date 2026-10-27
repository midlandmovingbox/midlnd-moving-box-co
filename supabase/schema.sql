-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  package text not null,
  totes int not null,
  addons jsonb default '{}'::jsonb,
  delivery_date date not null,
  pickup_date date not null,
  delivery_window text,
  location text,
  name text not null,
  phone text not null,
  email text,
  address text not null,
  notes text,
  subtotal numeric not null,
  tax numeric not null,
  total numeric not null,
  -- Square card-on-file details. The card is vaulted at request time;
  -- nothing is charged until an admin approves.
  square_customer_id text,
  square_card_id text,
  square_card_brand text,
  square_card_last4 text,
  square_payment_id text,          -- set once the initial rental is charged on approval
  status text not null default 'requested',  -- requested | confirmed | declined | returned
  created_at timestamptz not null default now()
);

-- Log of any charges made against the vaulted card AFTER the initial approval
-- (extra weeks, damage/overage, etc.)
create table if not exists charges (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) not null,
  amount numeric not null,
  note text,
  square_payment_id text,
  created_at timestamptz not null default now()
);

create index if not exists reservations_status_idx on reservations (status);
create index if not exists charges_reservation_idx on charges (reservation_id);

-- Locked down by default. The app only ever talks to these tables via the
-- server-side service role key, which bypasses RLS - no public policies needed.
alter table reservations enable row level security;
alter table charges enable row level security;

-- Added later: separate moving-from / moving-to addresses
alter table reservations add column if not exists from_address text;
alter table reservations add column if not exists to_address text;

-- Added later: zone surcharges and manual quotes for out-of-area addresses
alter table reservations add column if not exists delivery_surcharge numeric not null default 0;
alter table reservations add column if not exists pickup_surcharge numeric not null default 0;
alter table reservations add column if not exists needs_quote boolean not null default false;
alter table reservations add column if not exists quote_fee numeric not null default 0;
alter table reservations add column if not exists quote_sent_at timestamptz;

-- Added later: why a request was declined
alter table reservations add column if not exists decline_reason text;
alter table reservations add column if not exists decline_note text;
