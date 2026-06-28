-- Travel guides, health guides (insurance/vaccine/hospital), image URL aliases

alter table esm_hotels add column if not exists image_urls jsonb not null default '[]';
alter table esm_hotels add column if not exists gallery_urls jsonb not null default '[]';

update esm_hotels set gallery_urls = gallery_image_urls
  where gallery_urls = '[]'::jsonb and gallery_image_urls is not null and gallery_image_urls != '[]'::jsonb;
update esm_hotels set image_urls = gallery_image_urls
  where image_urls = '[]'::jsonb and gallery_image_urls is not null and gallery_image_urls != '[]'::jsonb;

alter table esm_attractions add column if not exists image_urls jsonb not null default '[]';
alter table esm_attractions add column if not exists gallery_image_urls jsonb not null default '[]';

update esm_attractions set image_urls = '[]'::jsonb where image_urls is null;

-- esm_travel_guides
create table if not exists esm_travel_guides (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references esm_countries(id) on delete set null,
  city_id uuid references esm_cities(id) on delete set null,
  slug text not null,
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
  updated_at timestamptz not null default now(),
  unique (slug)
);

-- esm_health_guides (insurance, vaccine, hospital)
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
