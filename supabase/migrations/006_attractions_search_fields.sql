-- Attraction search fields — hybrid catalog + filters
alter table esm_attractions add column if not exists country_id uuid references esm_countries(id) on delete set null;
alter table esm_attractions add column if not exists district text;
alter table esm_attractions add column if not exists category text;
alter table esm_attractions add column if not exists short_description_mn text;
alter table esm_attractions add column if not exists latitude numeric(10, 6);
alter table esm_attractions add column if not exists longitude numeric(10, 6);
alter table esm_attractions add column if not exists address text;
alter table esm_attractions add column if not exists opening_hours text;
alter table esm_attractions add column if not exists recommended_duration text;
alter table esm_attractions add column if not exists family_friendly boolean not null default false;
alter table esm_attractions add column if not exists free_entry boolean not null default false;
alter table esm_attractions add column if not exists indoor boolean not null default true;
alter table esm_attractions add column if not exists booking_required boolean not null default false;
alter table esm_attractions add column if not exists official_url text;
alter table esm_attractions add column if not exists popularity_score int not null default 50;
alter table esm_attractions add column if not exists source text not null default 'supabase';
alter table esm_attractions add column if not exists gallery_urls jsonb not null default '[]';

create index if not exists idx_esm_attractions_category on esm_attractions(category);
create index if not exists idx_esm_attractions_country on esm_attractions(country_id);
