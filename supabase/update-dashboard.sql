-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Adds the settings and time/mileage tables used by the admin Dashboard.
create table if not exists business_settings (
  id int primary key default 1 check (id = 1),
  totes_owned int not null default 50,
  tote_cost_total numeric not null default 377.79,
  dollies_owned int not null default 4,
  dolly_cost_total numeric not null default 146.13,
  mpg numeric not null default 18.23,
  gas_price numeric not null default 3.58,
  hourly_rate numeric not null default 20,
  fee_pct numeric not null default 2.9,
  fee_flat numeric not null default 0.30
);
insert into business_settings (id) values (1) on conflict (id) do nothing;

create table if not exists trip_log (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) on delete set null,
  kind text not null default 'other',   -- delivery | pickup | other
  minutes int not null default 0,
  miles numeric not null default 0,
  note text,
  logged_on date not null default current_date,
  created_at timestamptz not null default now()
);

alter table business_settings enable row level security;
alter table trip_log enable row level security;
