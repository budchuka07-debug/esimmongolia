/**
 * Shared hotel seed logic — used by generate-travel-seed + assign-hotel-images
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

export const BEACH_CITY_SLUGS = new Set([
  "da_nang", "phuket", "krabi", "nha_trang", "pattaya", "bali", "koh_samui",
  "phu_quoc", "langkawi", "sanya", "hua_hin", "vung_tau", "jeju", "lombok",
  "hoi_an", "ha_long", "penang", "kota_kinabalu", "okinawa", "sentosa"
]);

const HOTEL_PREFIXES = ["Inn", "Express", "Metro", "Budget", "Central", "Garden", "City", "Comfort", "Smart", "Stay"];
const HOTEL_SUFFIXES = ["Hotel", "Inn", "Suites", "Lodge", "Residence"];
const AREAS = ["Downtown", "Station Area", "Business District", "Old Town", "Airport Road", "Metro Hub", "Market Street", "Riverside"];
const AMENITY_POOLS = [
  ["wifi", "breakfast", "metro_nearby"],
  ["wifi", "parking", "24h_front"],
  ["wifi", "breakfast", "gym"],
  ["wifi", "metro_nearby", "laundry"],
  ["wifi", "restaurant", "airport_shuttle"],
  ["wifi", "breakfast", "family_friendly"]
];

function pickStars(i) {
  const r = i % 10;
  if (r < 6) return 3;
  if (r < 8) return 4;
  return 5;
}

function priceFor(stars, cc, seed = 0) {
  const base = {
    CN: [180000, 320000, 480000], TH: [150000, 280000, 450000], VN: [140000, 260000, 420000],
    ID: [160000, 300000, 480000], JP: [220000, 380000, 650000], KR: [200000, 350000, 580000],
    MN: [120000, 220000, 380000], SG: [280000, 450000, 750000], MY: [150000, 270000, 440000],
    AE: [250000, 420000, 720000]
  };
  const tier = stars - 3;
  const [lo, mid, hi] = base[cc] || base.CN;
  const vals = [lo, mid, hi];
  return vals[Math.min(Math.max(tier, 0), 2)] + (seed % 7) * 12000;
}

export function loadCityDefs() {
  const path = join(__dir, "hotel-seed-data.json");
  return JSON.parse(readFileSync(path, "utf8")).cities;
}

export function generateHotels(cityDefs = loadCityDefs()) {
  const hotels = [];
  let idx = 0;
  const weights = cityDefs.map((c) => (c.pri ? 8 : 3));
  const totalW = weights.reduce((a, b) => a + b, 0);

  cityDefs.forEach((city, ci) => {
    const count = Math.max(1, Math.round((weights[ci] / totalW) * 500));
    for (let j = 0; j < count && hotels.length < 500; j++) {
      idx++;
      const stars = pickStars(idx);
      const prefix = HOTEL_PREFIXES[idx % HOTEL_PREFIXES.length];
      const suffix = HOTEL_SUFFIXES[(idx + j) % HOTEL_SUFFIXES.length];
      const area = AREAS[j % AREAS.length];
      const name = `${city.en} ${prefix} ${suffix}${j > 0 ? ` ${j + 1}` : ""}`.trim();
      hotels.push({
        seed_key: `SEED-${city.slug.toUpperCase()}-${String(idx).padStart(4, "0")}`,
        city_slug: city.slug,
        cc: city.cc,
        official_name: name,
        name_mn: `${city.mn} ${stars} од`,
        stars,
        district: area,
        area_name: area,
        address: `${area}, ${city.en}`,
        lat: city.lat + (j * 0.008 - 0.02),
        lng: city.lng + (j * 0.006 - 0.015),
        description_mn: `${city.mn} хотын ${area} бүсэд байрлах ${stars} одтой буудал. Метро/тээвэр ойрхон.`,
        amenities: AMENITY_POOLS[idx % AMENITY_POOLS.length],
        price: priceFor(stars, city.cc, idx) + j * 8000
      });
    }
  });

  while (hotels.length < 500) {
    const city = cityDefs[hotels.length % cityDefs.length];
    idx++;
    hotels.push({
      seed_key: `SEED-BUD-${String(idx).padStart(4, "0")}`,
      city_slug: city.slug,
      cc: city.cc,
      official_name: `${city.en} Budget Stay ${hotels.length}`,
      name_mn: `${city.mn} хямд буудал`,
      stars: 3,
      district: "Budget Zone",
      area_name: "Station Area",
      address: `Station Rd, ${city.en}`,
      lat: city.lat,
      lng: city.lng,
      description_mn: `Хямд 3 одтой буудал — ${city.mn}.`,
      amenities: ["wifi", "breakfast"],
      price: priceFor(3, city.cc, idx)
    });
  }
  return hotels.slice(0, 500);
}

export function pickCoverCategory(hotel) {
  const beach = BEACH_CITY_SLUGS.has(hotel.city_slug);
  const stars = hotel.stars || 3;
  if (beach && stars >= 4) return "beach";
  if (stars >= 5) return "luxury";
  if (stars === 4) return "midrange";
  if (stars <= 3) return beach ? "beach" : "budget";
  return "city";
}

export function pickGalleryPlan(hotel) {
  const coverCat = pickCoverCategory(hotel);
  const beach = BEACH_CITY_SLUGS.has(hotel.city_slug);
  const stars = hotel.stars || 3;
  return {
    cover: coverCat,
    lobby: "lobby",
    room: "room",
    bathroom: "bathroom",
    extra: beach ? "beach" : stars >= 4 ? "business" : "city"
  };
}

export function pickFromPool(pool, index, offset = 0) {
  if (!pool?.length) return null;
  return pool[(index + offset) % pool.length];
}

export function assignHotelImages(hotel, cloudinaryImages, hotelIndex) {
  const plan = pickGalleryPlan(hotel);
  const cover = pickFromPool(cloudinaryImages[plan.cover], hotelIndex, 0);
  const lobby = pickFromPool(cloudinaryImages[plan.lobby], hotelIndex, 1);
  const room = pickFromPool(cloudinaryImages[plan.room], hotelIndex, 2);
  const bathroom = pickFromPool(cloudinaryImages[plan.bathroom], hotelIndex, 3);
  const extra = pickFromPool(cloudinaryImages[plan.extra], hotelIndex, 4);

  const gallery = [...new Set([cover, lobby, room, bathroom, extra].filter(Boolean))];
  const coverUrl = cover || gallery[0] || null;

  return {
    seed_key: hotel.seed_key,
    city_slug: hotel.city_slug,
    official_name: hotel.official_name,
    stars: hotel.stars,
    cover_image_url: coverUrl,
    gallery_image_urls: gallery,
    room_image_urls: room ? [room] : [],
    image_urls: gallery,
    gallery_urls: gallery,
    image_source: "placeholder",
    image_plan: plan
  };
}
