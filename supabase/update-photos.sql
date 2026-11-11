-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Adds photo lists to reservations and creates a PRIVATE storage bucket for equipment photos.
alter table reservations add column if not exists delivered_photos jsonb default '[]'::jsonb;
alter table reservations add column if not exists picked_up_photos jsonb default '[]'::jsonb;

insert into storage.buckets (id, name, public)
values ('equipment-photos', 'equipment-photos', false)
on conflict (id) do nothing;
