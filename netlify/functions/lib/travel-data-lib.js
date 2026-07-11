/** Map esm_* rows → customer-safe API shapes (no supplier/markup) */

const { pickCover, resolveGallery, FALLBACK } = require("./travel-images");

const ISO_TO_SLUG = {
  MN: "mongolia", CN: "china", TH: "thailand", VN: "vietnam", JP: "japan",
  KR: "korea", SG: "singapore", MY: "malaysia", ID: "indonesia", AE: "uae", TR: "turkey"
};

function countrySlug(row) {
  return row.slug || ISO_TO_SLUG[row.iso_code] || String(row.iso_code || "").toLowerCase();
}

function mapCountry(row) {
  if (!row) return null;
  return {
    id: countrySlug(row),
    uuid: row.id,
    iso_code: row.iso_code,
    name_mn: row.name_mn,
    name_en: row.name_en,
    name_local: row.name_local,
    flag: row.flag_emoji,
    currency: row.currency,
    visa_summary_mn: row.visa_summary_mn,
    cover_image_url: row.cover_image_url || null,
    cover_image: pickCover(row, FALLBACK.country),
    is_featured: row.is_featured,
    active: row.active
  };
}

function mapCity(row, countryRow) {
  if (!row) return null;
  const country = countryRow ? countrySlug(countryRow) : null;
  const aliases = Array.isArray(row.aliases) ? row.aliases : [];
  const heroUrl = row.cover_image_url || row.hero_image || null;
  return {
    id: row.slug,
    uuid: row.id,
    slug: row.slug,
    country_id: country,
    name_mn: row.name_mn,
    name_en: row.name_en,
    local: row.name_local,
    name_local: row.name_local,
    aliases: [row.name_mn, row.name_en, row.name_local, ...aliases].filter(Boolean),
    airport_codes: row.airport_codes || [],
    railway_stations: row.railway_stations || [],
    lat: row.lat,
    lng: row.lng,
    cover_image_url: heroUrl,
    hero_image_url: heroUrl,
    hero_image: pickCover({ cover_image_url: heroUrl, hero_image: row.hero_image }, FALLBACK.city),
    description_mn: row.description_mn,
    map_url: row.map_url,
    route_url: row.route_url,
    budget_hint_mn: row.budget_hint_mn,
    transport_mn: row.transport_mn,
    popular: row.popular
  };
}

function mapHotel(row, cityRow, countryRow) {
  if (!row) return null;
  const gallery = row.gallery_urls?.length ? row.gallery_urls
    : (row.gallery_image_urls?.length ? row.gallery_image_urls : (row.images || []));
  const rooms = row.room_image_urls?.length ? row.room_image_urls : (row.room_images || []);
  const imageUrls = row.image_urls?.length ? row.image_urls : [];
  const cover = pickCover(row, FALLBACK.hotel);
  const cloudinaryImages = [...new Set([cover, ...gallery, ...rooms, ...imageUrls].filter(Boolean))]
    .filter((u) => /res\.cloudinary\.com/i.test(String(u)));
  return {
    type: "hotel",
    id: row.id,
    name_en: row.official_name,
    name_mn: row.name_mn_optional,
    official_name: row.official_name,
    city_id: cityRow?.slug || null,
    country_id: countryRow ? countrySlug(countryRow) : null,
    stars: row.stars || 3,
    district: row.district,
    area_name: row.area_name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    description_mn: row.description_mn,
    cover_image_url: row.cover_image_url || null,
    cover_image: cover,
    image: cover,
    image_urls: imageUrls.length ? imageUrls : resolveGallery(gallery, null).filter((u) => u !== FALLBACK.hotel),
    gallery_urls: gallery,
    gallery_image_urls: gallery,
    cloudinary_images: cloudinaryImages,
    room_image_urls: rooms,
    images: resolveGallery(gallery, FALLBACK.hotel),
    room_images: resolveGallery(rooms, FALLBACK.room),
    amenities: row.amenities || [],
    nearby_metro: row.nearby_metro,
    nearby_landmarks: row.nearby_landmarks || [],
    final_price_mnt: row.final_price_mnt,
    active: row.active
  };
}

function mapFlight(row, fromCity, toCity, transferCity) {
  return {
    type: "flight",
    id: row.id,
    airline: row.airline,
    from_city: fromCity?.name_mn || row.from_label || "",
    to_city: toCity?.name_mn || row.to_label || "",
    from_city_id: fromCity?.slug,
    to_city_id: toCity?.slug,
    transfer_city: transferCity?.name_mn || null,
    transfer_city_id: transferCity?.slug || null,
    is_direct: row.route_type === "direct",
    depart_time: row.departure_time,
    arrive_time: row.arrival_time,
    duration: row.duration,
    baggage: row.baggage_note_mn,
    final_price_mnt: row.final_price_mnt,
    data_confidence: row.data_confidence || "estimated"
  };
}

function mapTransport(row, fromCity, toCity, transferCity) {
  const from = fromCity?.name_mn || "";
  const to = toCity?.name_mn || "";
  return {
    type: "transport",
    id: row.id,
    transport_type: row.transport_type,
    route_category: row.route_category || (row.transfer_city_id ? "transfer" : "direct"),
    from_city: from,
    to_city: to,
    from_city_id: fromCity?.slug,
    to_city_id: toCity?.slug,
    transfer_city: transferCity?.name_mn || null,
    transfer_required: !!row.transfer_city_id,
    train_no: row.train_no,
    train_mode: row.train_mode,
    departure_time: row.departure_time,
    departure_note: row.departure_note,
    arrival_time: row.arrival_time,
    duration: row.duration,
    price_cny_min: row.price_cny_min,
    price_cny_max: row.price_cny_max,
    original_price: row.price_cny_min,
    currency: row.currency || "CNY",
    class_prices: row.class_prices || {},
    notes_mn: row.notes_mn,
    source_name: row.source_name,
    source_url: row.source_url,
    data_confidence: row.data_confidence,
    final_price_mnt: row.final_price_mnt_from || row.final_price_mnt
  };
}

function mapAttraction(row, cityRow, countryRow, citySlugOverride) {
  const cover = pickCover(row, FALLBACK.attraction);
  const gallery = row.gallery_urls?.length ? row.gallery_urls
    : (row.image_urls?.length ? row.image_urls
      : (row.gallery_image_urls?.length ? row.gallery_image_urls : []));
  const displayName = row.name || row.name_mn || row.name_en || "";
  const description = row.description || row.description_mn || "";
  const shortDesc = row.short_description || row.short_description_mn || description;
  const price = Number(row.estimated_price ?? row.final_price_mnt ?? 0) ||
    (row.original_price ? Math.round(Number(row.original_price) * 500) : 0);
  const cityId = row.city || citySlugOverride || cityRow?.slug;
  const countryId = row.country || (countryRow ? countrySlug(countryRow) : null);

  return {
    type: "attraction",
    id: row.id,
    city_id: cityId,
    country_id: countryId,
    name: displayName,
    name_mn: row.name_mn || displayName,
    name_en: row.name_en || displayName,
    district: row.district,
    category: row.category || "history_culture",
    description,
    description_mn: row.description_mn || description,
    short_description: shortDesc,
    cover_image_url: row.cover_image_url || row.image_url || null,
    image_urls: gallery,
    gallery_urls: gallery,
    gallery_image_urls: gallery,
    image_url: cover,
    image: cover,
    images: resolveGallery(gallery.length ? gallery : [cover], FALLBACK.attraction),
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    estimated_price: price,
    original_price: row.original_price,
    currency: row.currency || "MNT",
    final_price_mnt: price,
    opening_hours: row.opening_hours,
    recommended_duration: row.recommended_duration,
    family_friendly: !!row.family_friendly,
    free_entry: !!row.free_entry,
    indoor: row.indoor !== false,
    booking_required: !!row.booking_required,
    official_url: row.official_url,
    popularity_score: row.popularity_score ?? 50,
    source: row.source || "supabase",
    verification_status: row.verification_status || "verified",
    active: row.active
  };
}

function mapTravelGuide(row, cityRow, countryRow) {
  const cover = pickCover(row, FALLBACK.country);
  return {
    id: row.id,
    slug: row.slug,
    city_id: cityRow?.slug,
    country_id: countryRow ? countrySlug(countryRow) : null,
    title_mn: row.title_mn,
    title_en: row.title_en,
    summary_mn: row.summary_mn,
    body_mn: row.body_mn,
    category: row.category,
    cover_image_url: row.cover_image_url || null,
    cover_image: cover,
    gallery_image_urls: row.gallery_image_urls || []
  };
}

function mapHealthGuide(row, cityRow, countryRow) {
  const cover = pickCover(row, FALLBACK.insurance);
  return {
    id: row.id,
    guide_type: row.guide_type,
    city_id: cityRow?.slug,
    country_id: countryRow ? countrySlug(countryRow) : null,
    title_mn: row.title_mn,
    description_mn: row.description_mn,
    address: row.address,
    phone: row.phone,
    website: row.website,
    cover_image_url: row.cover_image_url || null,
    cover_image: cover,
    image_urls: row.image_urls || []
  };
}

function buildCityIndex(cities) {
  const bySlug = {};
  const aliasIndex = {};
  cities.forEach((c) => {
    bySlug[c.id] = c;
    const keys = new Set([c.id, c.slug, c.name_mn, c.name_en, c.local, ...(c.aliases || [])]);
    keys.forEach((k) => {
      const norm = String(k || "").trim().toLowerCase().replace(/[''`]/g, "").replace(/\s+/g, " ");
      if (norm) aliasIndex[norm] = c.id;
    });
  });
  return { bySlug, aliasIndex };
}

function normalizeCityInput(input, aliasIndex) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  const key = raw.toLowerCase().replace(/[''`]/g, "").replace(/\s+/g, " ");
  if (aliasIndex[key]) return aliasIndex[key];
  const partial = Object.entries(aliasIndex).find(([alias]) =>
    key.length >= 3 && (key.includes(alias) || alias.includes(key))
  );
  return partial ? partial[1] : null;
}

module.exports = {
  ISO_TO_SLUG,
  countrySlug,
  mapCountry,
  mapCity,
  mapHotel,
  mapFlight,
  mapTransport,
  mapAttraction,
  mapTravelGuide,
  mapHealthGuide,
  buildCityIndex,
  normalizeCityInput
};
