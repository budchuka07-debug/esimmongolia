-- Cloudinary image fields (cover_image_url, gallery_image_urls, room_image_urls)

alter table esm_countries add column if not exists cover_image_url text;

alter table esm_cities add column if not exists cover_image_url text;
update esm_cities set cover_image_url = hero_image where cover_image_url is null and hero_image is not null;

alter table esm_hotels add column if not exists cover_image_url text;
alter table esm_hotels add column if not exists gallery_image_urls jsonb not null default '[]';
alter table esm_hotels add column if not exists room_image_urls jsonb not null default '[]';
update esm_hotels set cover_image_url = cover_image where cover_image_url is null and cover_image is not null;
update esm_hotels set gallery_image_urls = images where gallery_image_urls = '[]'::jsonb and images is not null and images != '[]'::jsonb;
update esm_hotels set room_image_urls = room_images where room_image_urls = '[]'::jsonb and room_images is not null and room_images != '[]'::jsonb;

alter table attractions add column if not exists cover_image_url text;
update attractions set cover_image_url = image_url where cover_image_url is null and image_url is not null;

create table if not exists esm_hotel_rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references esm_hotels(id) on delete cascade,
  room_name text not null,
  room_type text,
  capacity int default 2,
  beds text,
  breakfast_included boolean default false,
  free_cancel boolean default false,
  final_price_mnt int,
  cover_image_url text,
  gallery_image_urls jsonb not null default '[]',
  room_image_urls jsonb not null default '[]',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists esm_long_stay_rentals (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references esm_countries(id) on delete set null,
  city_id uuid references esm_cities(id) on delete set null,
  area text,
  property_type text,
  bedrooms int default 1,
  monthly_price_usd numeric,
  monthly_price_mnt int,
  deposit_info_mn text,
  utilities_info_mn text,
  internet_info_mn text,
  distance_to_beach text,
  distance_to_center text,
  description_mn text,
  amenities jsonb not null default '[]',
  suitable_for jsonb not null default '[]',
  min_stay_months int default 1,
  cover_image_url text,
  gallery_image_urls jsonb not null default '[]',
  supplier_reference jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_esm_hotel_rooms_hotel on esm_hotel_rooms(hotel_id);
create index if not exists idx_esm_rentals_city on esm_long_stay_rentals(city_id);

alter table esm_hotel_rooms enable row level security;
alter table esm_long_stay_rentals enable row level security;
