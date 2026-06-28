-- Inventory tables + country slug (additive migration)

alter table esm_countries add column if not exists slug text;
update esm_countries set slug = 'china' where iso_code = 'CN' and slug is null;
update esm_countries set slug = 'thailand' where iso_code = 'TH' and slug is null;
update esm_countries set slug = 'vietnam' where iso_code = 'VN' and slug is null;
update esm_countries set slug = 'japan' where iso_code = 'JP' and slug is null;
update esm_countries set slug = 'korea' where iso_code = 'KR' and slug is null;
update esm_countries set slug = 'mongolia' where iso_code = 'MN' and slug is null;
update esm_countries set slug = lower(iso_code) where slug is null;
create unique index if not exists esm_countries_slug_idx on esm_countries(slug);

create table if not exists esm_flights (
  id uuid primary key default gen_random_uuid(),
  from_city_id uuid references esm_cities(id) on delete set null,
  to_city_id uuid references esm_cities(id) on delete set null,
  transfer_city_id uuid references esm_cities(id) on delete set null,
  airline text not null,
  route_type text not null default 'direct' check (route_type in ('direct', 'transfer')),
  departure_time text,
  arrival_time text,
  duration text,
  baggage_note_mn text,
  final_price_mnt int,
  data_confidence text default 'estimated',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists esm_transport_routes (
  id uuid primary key default gen_random_uuid(),
  transport_type text not null check (transport_type in ('train', 'bus')),
  route_category text default 'direct' check (route_category in ('direct', 'transfer')),
  from_city_id uuid references esm_cities(id) on delete set null,
  to_city_id uuid references esm_cities(id) on delete set null,
  transfer_city_id uuid references esm_cities(id) on delete set null,
  train_no text,
  train_mode text,
  departure_time text,
  departure_note text,
  arrival_time text,
  duration text,
  price_cny_min numeric,
  price_cny_max numeric,
  currency text default 'CNY',
  class_prices jsonb not null default '{}',
  final_price_mnt_from int,
  notes_mn text,
  source_name text,
  source_url text,
  data_confidence text default 'estimated',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists esm_attractions (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references esm_cities(id) on delete cascade,
  name_mn text not null,
  name_en text,
  description_mn text,
  image_url text,
  original_price numeric,
  currency text default 'CNY',
  final_price_mnt int,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_esm_flights_from on esm_flights(from_city_id);
create index if not exists idx_esm_flights_to on esm_flights(to_city_id);
create index if not exists idx_esm_transport_from on esm_transport_routes(from_city_id);
create index if not exists idx_esm_transport_to on esm_transport_routes(to_city_id);
create index if not exists idx_esm_attractions_city on esm_attractions(city_id);

alter table esm_flights enable row level security;
alter table esm_transport_routes enable row level security;
alter table esm_attractions enable row level security;
