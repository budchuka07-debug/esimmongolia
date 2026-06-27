-- eSIM Mongolia — Supabase schema (travel platform)
-- Apply via Supabase SQL editor when ready

create extension if not exists "pgcrypto";

-- Countries & cities
create table if not exists countries (
  id uuid primary key default gen_random_uuid(),
  code char(2) unique not null,
  name_mn text not null,
  name_en text,
  flag_emoji text,
  is_featured boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references countries(id) on delete cascade,
  slug text not null,
  name_mn text not null,
  name_local text,
  image_url text,
  description_mn text,
  map_url text,
  route_url text,
  budget_hint_mn text,
  transport_mn text,
  is_featured boolean default false,
  unique(country_id, slug)
);

create table if not exists attractions (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references cities(id) on delete cascade,
  name_mn text not null,
  name_en text,
  image_url text,
  map_embed_url text,
  price_cny numeric,
  open_hours_mn text,
  metro_mn text,
  tips_mn text,
  sort_order int default 0
);

create table if not exists transport_guides (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references cities(id) on delete cascade,
  type text not null, -- metro, bus, train, taxi
  title_mn text not null,
  body_mn text,
  map_url text
);

create table if not exists esim_plans (
  id uuid primary key default gen_random_uuid(),
  country_code char(2),
  plan_code text,
  name_mn text,
  days int,
  data_label text,
  original_price_usd numeric,
  markup_percent numeric default 40,
  sell_price_mnt int,
  active boolean default true
);

create table if not exists visa_guides (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null,
  title_mn text not null,
  body_mn text,
  official_url text,
  updated_at timestamptz default now()
);

-- Travel requests (inquiry / orders)
create table if not exists travel_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique,
  status text not null default 'new'
    check (status in ('new','quoted','awaiting_payment','paid','processing','completed','cancelled')),
  service_type text not null,
  customer_name text,
  customer_phone text,
  customer_email text,
  destination_country text,
  destination_city text,
  travel_date date,
  people_count int,
  budget_mnt int,
  extra_notes text,
  -- Pricing (admin fills after quote)
  original_price numeric,
  currency text default 'CNY',
  exchange_rate numeric,
  markup_percent numeric,
  service_fee_mnt int default 0,
  final_price_mnt int,
  quoted_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists supplier_search_results (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references travel_requests(id) on delete cascade,
  supplier text not null,
  product_type text not null,
  title text not null,
  meta jsonb,
  original_price numeric,
  currency text,
  exchange_rate numeric,
  markup_percent numeric,
  service_fee_mnt int,
  final_price_mnt int,
  raw_payload jsonb,
  created_at timestamptz default now()
);

-- QPay
create table if not exists qpay_invoices (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references travel_requests(id),
  order_id text not null,
  invoice_id text,
  amount_mnt int not null,
  status text default 'pending',
  qpay_response jsonb,
  created_at timestamptz default now()
);

create table if not exists qpay_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references qpay_invoices(id),
  paid_amount_mnt int,
  payment_id text,
  raw_callback jsonb,
  paid_at timestamptz default now()
);

-- AI sessions
create table if not exists ai_travel_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text unique not null,
  user_phone text,
  locale text default 'mn',
  context jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ai_travel_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references ai_travel_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz default now()
);

create table if not exists admin_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references travel_requests(id) on delete cascade,
  author text,
  note text not null,
  created_at timestamptz default now()
);

create index if not exists idx_travel_requests_status on travel_requests(status);
create index if not exists idx_travel_requests_created on travel_requests(created_at desc);
