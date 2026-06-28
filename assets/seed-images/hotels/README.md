# Hotel placeholder seed images

Licensed **local stock photos** copied from `/images/hotels/` (project assets — not scraped from Google/Trip/Booking).

## Categories

| Folder | Use |
|--------|-----|
| `budget/` | 2–3★ city hotels |
| `midrange/` | 4★ hotels |
| `luxury/` | 5★ hotels |
| `beach/` | Beach/resort cities |
| `city/` | Urban exterior |
| `business/` | Business district |
| `room/` | Guest rooms |
| `lobby/` | Lobby |
| `bathroom/` | Bathroom |
| `restaurant/` | Dining (gallery extra) |

## Pipeline

```bash
# 1. Copy local files into category folders
node scripts/setup-hotel-seed-assets.mjs

# 2. Upload to Cloudinary (esimmongolia/hotel-placeholders/{category}/)
#    Requires CLOUDINARY_CLOUD_NAME + CLOUDINARY_UPLOAD_PRESET
node scripts/upload-hotel-placeholders.mjs

# 3. Assign images to 500 hotels → SQL seed
node scripts/assign-hotel-images.mjs
```

Outputs:
- `data/cloudinary-hotel-images.json` — Cloudinary `secure_url` by category
- `data/hotel-image-assignments.json` — per-hotel cover + gallery
- `supabase/seed/003_hotel_cloudinary_images.sql` — UPDATE statements

Apply on Supabase after `002_bulk_inventory.sql`.

## Replace later

Admin → Hotels → upload real images → set **Image source** to `official`.
