# eSIM Mongolia — Supabase (`esimmongolia`)

**Тусдаа Supabase project** — өгөгдлийн ганц эх сурвалж. Зураг: **Cloudinary** (`secure_url` only). Supabase Storage ашиглахгүй.

## Tables

| Table | Purpose |
|-------|---------|
| `esm_countries` | 10 улс |
| `esm_cities` | 100 хот |
| `esm_hotels` | 500+ буудал |
| `esm_hotel_rooms` | Өрөө |
| `esm_attractions` | Үзвэр |
| `esm_long_stay_rentals` | Урт хугацааны түрээс |
| `esm_travel_guides` | Аяллын гарын авлага |
| `esm_health_guides` | Даатгал / вакцин / эмнэлэг |
| `esm_flights` / `esm_transport_routes` | Нислэг, галт тэрэг |
| `esm_bookings` / `esm_payments` | Захиалга, QPay |

### Image columns (Cloudinary `secure_url` only)

| Entity | Fields |
|--------|--------|
| Hotels | `cover_image_url`, `image_urls`, `gallery_urls`, `gallery_image_urls`, `room_image_urls` |
| Cities | `cover_image_url` (= hero) |
| Attractions | `cover_image_url`, `image_urls`, `gallery_image_urls` |
| Travel guides | `cover_image_url`, `gallery_image_urls` |
| Health guides | `cover_image_url`, `image_urls` |

## Setup

1. SQL Editor → `schema.sql` → Run
2. Migrations (хуучин DB): `001` → `003` → `004` → `005_guides_and_image_urls.sql`
3. Seed (demo): `seed/001_demo_data.sql`
4. Seed (bulk inventory):

```bash
node scripts/generate-travel-seed.mjs   # regenerates seed/002_bulk_inventory.sql
```

Then SQL Editor → `seed/002_bulk_inventory.sql` → Run (~500 hotels, 100 cities, etc.)

**Hotel placeholder images (Cloudinary MVP):**

```bash
node scripts/setup-hotel-seed-assets.mjs
node scripts/upload-hotel-placeholders.mjs
node scripts/assign-hotel-images.mjs
```

Then SQL Editor → `seed/003_hotel_cloudinary_images.sql` → Run (500 hotel image UPDATEs)

Requires migration `006_hotel_image_source.sql` for `image_source` column.

5. Netlify env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`

## Regenerate seed

```bash
node scripts/generate-travel-seed.mjs
```

Priority cities: China (Beijing, Shanghai, Hohhot, …), Thailand, Vietnam, Indonesia, Japan, Korea + budget 3★ hotels.

## API (Netlify BFF)

| Endpoint | Data |
|----------|------|
| `GET /.netlify/functions/travel-catalog?all=1` | Countries, cities, destinations |
| `GET /.netlify/functions/travel-search?type=hotel&city_id=shanghai` | Hotels from Supabase |
| `GET /.netlify/functions/travel-search?type=attraction&city_id=shanghai` | Attractions |

Frontend: `js/travel-data-loader.js` + `js/travel-images.js` — Cloudinary first, local fallback if missing.

Admin: `/admin.html` — Cloudinary upload per entity (hotels, cities, guides, …).

## BookingMongolia

Энэ project BookingMongolia биш. `travel_requests` ашиглахгүй — inquiry → `esm_bookings`.
