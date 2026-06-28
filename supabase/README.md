# eSIM Mongolia — Supabase (`esimmongolia`)

**Тусдаа Supabase project** — өгөгдлийн ганц эх сурвалж.

## Tables

| Table | Purpose |
|-------|---------|
| `esm_countries` | Улсууд |
| `esm_cities` | Хотууд |
| `esm_hotels` | Буудлууд |
| `esm_flights` | Нислэг |
| `esm_transport_routes` | Галт тэрэг / автобус |
| `esm_attractions` | Үзвэр |
| `esm_bookings` | Захиалга + travel inquiry |
| `esm_payments` | QPay төлбөр |
| `esm_ai_sessions` / `esm_ai_messages` | AI чат |

## Setup (шинэ project)

1. SQL Editor → `schema.sql` → Run
2. SQL Editor → `seed/001_demo_data.sql` → Run
3. Netlify env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

Хуучин schema ажиллуулсан бол: `migrations/003_esm_inventory.sql` → дараа нь seed.

## API (Netlify BFF)

| Endpoint | Data |
|----------|------|
| `GET /.netlify/functions/travel-catalog?all=1` | Countries, cities, destinations |
| `GET /.netlify/functions/travel-catalog?q=shanghai` | Location autocomplete |
| `GET /.netlify/functions/travel-search?type=hotel&city_id=shanghai` | Hotels |
| `GET /.netlify/functions/travel-search?type=flight&from_city_id=ulanbaatar&city_id=beijing` | Flights |
| `GET /.netlify/functions/travel-search?type=train&from=Эрээн&city=Бээжин` | Trains/buses |
| `GET /.netlify/functions/travel-search?type=attraction&city_id=shanghai` | Attractions |

Frontend: `js/travel-data-loader.js` — hardcoded `data/*.js` inventory **ашиглахгүй**.

Bookings: `travel-inquiry` → `esm_bookings`

## BookingMongolia

Энэ project BookingMongolia биш. `travel_requests` хүснэгт ашиглахгүй — бүх inquiry `esm_bookings` дээр.
