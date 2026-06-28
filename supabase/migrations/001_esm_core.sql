-- eSIM Mongolia — initial esm_* schema (001)
-- Supabase project: esimmongolia (dedicated)

-- See ../schema.sql for full documented version (keep in sync).

create extension if not exists "pgcrypto";

create table if not exists esm_countries (
  id uuid primary key default gen_random_uuid(),
  iso_code char(2) not null unique,
  name_mn text not null,
  name_en text,
  name_local text,
  flag_emoji text,
  currency char(3),
  language text,
  timezone text,
  visa_summary_mn text,
  is_featured boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists esm_cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references esm_countries(id) on delete restrict,
  slug text not null,
  name_mn text not null,
  name_en text,
  name_local text,
  aliases jsonb not null default '[]',
  province text,
  airport_codes jsonb not null default '[]',
  railway_stations jsonb not null default '[]',
  lat numeric(10, 6),
  lng numeric(10, 6),
  hero_image text,
  description_mn text,
  map_url text,
  route_url text,
  budget_hint_mn text,
  transport_mn text,
  popular boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, slug)
);

create table if not exists esm_hotels (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references esm_countries(id) on delete set null,
  city_id uuid references esm_cities(id) on delete set null,
  official_name text not null,
  name_mn_optional text,
  stars smallint check (stars between 1 and 5),
  district text,
  area_name text,
  address text,
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  description_mn text,
  cover_image text,
  images jsonb not null default '[]',
  room_images jsonb not null default '[]',
  amenities jsonb not null default '[]',
  nearby_metro text,
  nearby_landmarks jsonb not null default '[]',
  final_price_mnt int,
  supplier_reference jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists esm_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique,
  status text not null default 'new'
    check (status in (
      'new', 'quoted', 'awaiting_payment', 'paid', 'processing',
      'booked', 'completed', 'cancelled', 'sold_out'
    )),
  service_type text not null,
  customer_name text,
  customer_phone text,
  customer_email text,
  destination_country text,
  destination_city text,
  city_id text,
  hotel_official_name text,
  hotel_id text,
  room_type text,
  check_in date,
  check_out date,
  guest_count int,
  people_count int,
  travel_date date,
  selected_item text,
  extra_notes text,
  budget_mnt int,
  original_price numeric,
  currency text default 'CNY',
  exchange_rate numeric,
  markup_percent numeric,
  service_fee_mnt int default 0,
  final_price_mnt int,
  supplier_internal jsonb,
  availability_status text default 'pending'
    check (availability_status in ('pending', 'available', 'sold_out')),
  internal_notes text,
  voucher_url text,
  voucher_sent_at timestamptz,
  last_checked_at timestamptz,
  quoted_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists esm_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references esm_bookings(id) on delete set null,
  provider text not null default 'qpay',
  order_id text not null,
  invoice_id text,
  amount_mnt int not null,
  paid_amount_mnt int,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_id text,
  qpay_response jsonb,
  raw_callback jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists esm_ai_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  user_phone text,
  locale text not null default 'mn',
  context jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists esm_ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references esm_ai_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_esm_cities_country on esm_cities(country_id);
create index if not exists idx_esm_hotels_city on esm_hotels(city_id);
create index if not exists idx_esm_hotels_country on esm_hotels(country_id);
create index if not exists idx_esm_bookings_status on esm_bookings(status);
create index if not exists idx_esm_bookings_created on esm_bookings(created_at desc);
create index if not exists idx_esm_bookings_city on esm_bookings(city_id);
create index if not exists idx_esm_bookings_hotel on esm_bookings(hotel_id);
create index if not exists idx_esm_payments_booking on esm_payments(booking_id);
create index if not exists idx_esm_payments_order on esm_payments(order_id);
create index if not exists idx_esm_ai_messages_session on esm_ai_messages(session_id, created_at);

alter table esm_countries enable row level security;
alter table esm_cities enable row level security;
alter table esm_hotels enable row level security;
alter table esm_bookings enable row level security;
alter table esm_payments enable row level security;
alter table esm_ai_sessions enable row level security;
alter table esm_ai_messages enable row level security;
