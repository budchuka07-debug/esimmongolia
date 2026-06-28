-- =============================================================================
-- eSIM Mongolia — Supabase project: esimmongolia (dedicated, separate DB)
-- =============================================================================
--   • Dedicated Supabase project — NOT shared with BookingMongolia.
--   • All app data uses esm_* tables only.
-- Apply: Supabase Dashboard (esimmongolia) → SQL Editor → paste & Run
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- esm_countries
-- ---------------------------------------------------------------------------
create table if not exists esm_countries (
  id uuid primary key default gen_random_uuid(),
  iso_code char(2) not null unique,
  slug text not null unique,
  name_mn text not null,
  name_en text,
  name_local text,
  flag_emoji text,
  currency char(3),
  language text,
  timezone text,
  visa_summary_mn text,
  cover_image_url text,
  is_featured boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- esm_cities
-- ---------------------------------------------------------------------------
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
  cover_image_url text,
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

-- ---------------------------------------------------------------------------
-- esm_hotels
-- ---------------------------------------------------------------------------
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
  cover_image_url text,
  gallery_image_urls jsonb not null default '[]',
  image_urls jsonb not null default '[]',
  gallery_urls jsonb not null default '[]',
  room_image_urls jsonb not null default '[]',
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

-- ---------------------------------------------------------------------------
-- esm_bookings
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- esm_payments
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- esm_ai_sessions
-- ---------------------------------------------------------------------------
create table if not exists esm_ai_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  user_phone text,
  locale text not null default 'mn',
  context jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- esm_ai_messages
-- ---------------------------------------------------------------------------
create table if not exists esm_ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references esm_ai_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Row level security (service role bypasses RLS; anon/authenticated denied)
-- ---------------------------------------------------------------------------
alter table esm_countries enable row level security;
alter table esm_cities enable row level security;
alter table esm_hotels enable row level security;
alter table esm_bookings enable row level security;
alter table esm_payments enable row level security;
alter table esm_ai_sessions enable row level security;
alter table esm_ai_messages enable row level security;

comment on table esm_countries is 'eSIM Mongolia (esimmongolia Supabase project)';
comment on table esm_cities is 'eSIM Mongolia — cities';
comment on table esm_hotels is 'eSIM Mongolia — hotels; supplier_reference is admin-only';
comment on table esm_bookings is 'eSIM Mongolia — travel/hotel/eSIM bookings';
comment on table esm_payments is 'eSIM Mongolia — QPay and other payments';
comment on table esm_ai_sessions is 'eSIM Mongolia — AI travel advisor sessions';
comment on table esm_ai_messages is 'eSIM Mongolia — AI chat message log';

-- ---------------------------------------------------------------------------
-- esm_flights
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- esm_transport_routes (train + bus)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- esm_attractions
-- ---------------------------------------------------------------------------
create table if not exists esm_attractions (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references esm_cities(id) on delete cascade,
  name_mn text not null,
  name_en text,
  description_mn text,
  cover_image_url text,
  image_url text,
  image_urls jsonb not null default '[]',
  gallery_image_urls jsonb not null default '[]',
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

comment on table esm_flights is 'eSIM Mongolia — flight inventory';
comment on table esm_transport_routes is 'eSIM Mongolia — train and bus routes';
comment on table esm_attractions is 'eSIM Mongolia — attractions and tickets';

-- ---------------------------------------------------------------------------
-- esm_hotel_rooms
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- esm_long_stay_rentals
-- ---------------------------------------------------------------------------
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

comment on table esm_hotel_rooms is 'eSIM Mongolia — hotel rooms; images on Cloudinary';
comment on table esm_long_stay_rentals is 'eSIM Mongolia — long stay rentals; images on Cloudinary';

-- ---------------------------------------------------------------------------
-- esm_travel_guides
-- ---------------------------------------------------------------------------
create table if not exists esm_travel_guides (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references esm_countries(id) on delete set null,
  city_id uuid references esm_cities(id) on delete set null,
  slug text not null unique,
  title_mn text not null,
  title_en text,
  summary_mn text,
  body_mn text,
  category text not null default 'general'
    check (category in ('general', 'visa', 'transport', 'food', 'culture', 'safety', 'budget', 'esim')),
  cover_image_url text,
  gallery_image_urls jsonb not null default '[]',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- esm_health_guides (insurance, vaccine, hospital)
-- ---------------------------------------------------------------------------
create table if not exists esm_health_guides (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references esm_countries(id) on delete set null,
  city_id uuid references esm_cities(id) on delete set null,
  guide_type text not null check (guide_type in ('insurance', 'vaccine', 'hospital')),
  title_mn text not null,
  description_mn text,
  address text,
  phone text,
  website text,
  hours_mn text,
  cover_image_url text,
  image_urls jsonb not null default '[]',
  metadata jsonb not null default '{}',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_esm_guides_country on esm_travel_guides(country_id);
create index if not exists idx_esm_guides_city on esm_travel_guides(city_id);
create index if not exists idx_esm_health_country on esm_health_guides(country_id);
create index if not exists idx_esm_health_city on esm_health_guides(city_id);
create index if not exists idx_esm_health_type on esm_health_guides(guide_type);

alter table esm_travel_guides enable row level security;
alter table esm_health_guides enable row level security;

comment on table esm_travel_guides is 'eSIM Mongolia — travel guides; images on Cloudinary';
comment on table esm_health_guides is 'eSIM Mongolia — insurance, vaccine, hospital guides';
