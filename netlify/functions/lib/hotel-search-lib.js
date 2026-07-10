/**
 * Hybrid hotel search — Supabase verified + deterministic mock fill
 */
const { mapHotel, countrySlug } = require("./travel-data-lib");
const {
  normalizeHotelKey,
  getMockPoolForCity,
  filterMockPool,
  NEEDS_CHECK_MSG
} = require("./hotel-mock");

const MIN_TARGET = 30;
const MAX_TOTAL = 48;
const DEFAULT_PAGE_SIZE = 12;

function enrichSupabaseHotel(mapped, nights, cityRow, country) {
  const amenities = mapped.amenities || [];
  const hash = mapped.id ? String(mapped.id).length * 17 : 42;
  const breakfast = amenities.some((a) => /breakfast/i.test(a));
  const freeCancellation = amenities.some((a) => /free_cancel|cancellation/i.test(a));
  const familyFriendly = amenities.some((a) => /family/i.test(a));
  const hasMetro = amenities.some((a) => /metro/i.test(a)) || !!mapped.nearby_metro;

  const distanceToMetro = mapped.distance_to_metro_m ?? (hasMetro ? 200 + (hash % 600) : 9999);
  const distanceToCenter = mapped.distance_to_center_km ?? Number((0.5 + (hash % 120) / 10).toFixed(1));
  const distanceToAirport = mapped.distance_to_airport_km ?? Number((5 + (hash % 200) / 10).toFixed(1));
  const distanceToAttraction = mapped.distance_to_attraction_km ?? Number((0.3 + (hash % 25) / 10).toFixed(1));
  const pricePerNight = mapped.final_price_mnt || 0;
  const recommendationScore = (mapped.stars || 3) * 20 + (hasMetro ? 10 : 0) + (breakfast ? 5 : 0);

  return {
    ...mapped,
    name: mapped.name_en || mapped.official_name,
    country: country?.name_mn || mapped.country_id,
    city: cityRow?.name_mn || mapped.city_id,
    city_name_mn: cityRow?.name_mn,
    country_name_mn: country?.name_mn,
    price_per_night: pricePerNight,
    currency: "MNT",
    facilities: amenities,
    description: mapped.description_mn || "",
    image_url: mapped.cover_image || mapped.image,
    source: "supabase",
    is_mock: false,
    availability_status: "available",
    verified: true,
    estimated: false,
    nights,
    breakfast,
    free_cancellation: freeCancellation,
    family_friendly: familyFriendly,
    distance_to_metro_m: distanceToMetro,
    distance_to_center_km: distanceToCenter,
    distance_to_airport_km: distanceToAirport,
    distance_to_attraction_km: distanceToAttraction,
    recommendation_score: recommendationScore
  };
}

function applyFacilityFilters(hotels, params) {
  let list = hotels.slice();
  if (params.nearMetro === "1" || params.nearMetro === true) {
    list = list.filter((h) => h.distance_to_metro_m <= 800);
  }
  if (params.nearAirport === "1" || params.nearAirport === true) {
    list = list.filter((h) => h.distance_to_airport_km <= 15);
  }
  if (params.nearAttraction === "1" || params.nearAttraction === true) {
    list = list.filter((h) => h.distance_to_attraction_km <= 2);
  }
  if (params.breakfast === "1" || params.breakfast === true) {
    list = list.filter((h) => h.breakfast);
  }
  if (params.freeCancellation === "1" || params.freeCancellation === true) {
    list = list.filter((h) => h.free_cancellation);
  }
  if (params.familyFriendly === "1" || params.familyFriendly === true) {
    list = list.filter((h) => h.family_friendly);
  }
  return list;
}

function applyPriceFilters(hotels, params) {
  let list = hotels.slice();
  const min = Number(params.priceMinMnt || 0);
  const max = Number(params.priceMaxMnt || 0);
  if (min > 0) list = list.filter((h) => (h.price_per_night ?? h.final_price_mnt) >= min);
  if (max > 0) list = list.filter((h) => (h.price_per_night ?? h.final_price_mnt) <= max);
  return list;
}

function sortHotels(hotels, sort) {
  const list = hotels.slice();
  if (sort === "price_asc") {
    list.sort((a, b) => (a.price_per_night ?? a.final_price_mnt) - (b.price_per_night ?? b.final_price_mnt));
  } else if (sort === "price_desc") {
    list.sort((a, b) => (b.price_per_night ?? b.final_price_mnt) - (a.price_per_night ?? a.final_price_mnt));
  } else if (sort === "stars_desc") {
    list.sort((a, b) => b.stars - a.stars);
  } else if (sort === "metro_asc" || sort === "center_asc") {
    list.sort((a, b) => (a.distance_to_center_km ?? 99) - (b.distance_to_center_km ?? 99));
  } else if (sort === "attraction_asc") {
    list.sort((a, b) => (a.distance_to_attraction_km ?? 99) - (b.distance_to_attraction_km ?? 99));
  } else {
    list.sort((a, b) => (b.recommendation_score ?? 0) - (a.recommendation_score ?? 0));
  }
  return list;
}

function deduplicateHotels(verified, mockCandidates) {
  const seen = new Set();
  verified.forEach((h) => {
    seen.add(normalizeHotelKey(h.name || h.name_en, h.city_id || h.city, h.district || h.area_name));
  });
  return mockCandidates.filter((h) => {
    const key = normalizeHotelKey(h.name || h.name_en, h.city_id || h.city, h.district || h.area_name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchSupabaseHotels(sb, params, ctx, cityRow, country) {
  let q = sb.from("esm_hotels").select("*").eq("city_id", cityRow.id).eq("active", true);

  if (country?.id) q = q.eq("country_id", country.id);
  if (params.district) q = q.ilike("district", `%${params.district}%`);
  if (params.area) q = q.ilike("area_name", `%${params.area}%`);
  if (params.minStars) q = q.gte("stars", Number(params.minStars));
  if (params.keyword) {
    q = q.or(`official_name.ilike.%${params.keyword}%,description_mn.ilike.%${params.keyword}%`);
  }

  const { data, error } = await q.limit(120);
  if (error) throw new Error(error.message);

  const nights = Number(params.days || 5);
  let results = (data || []).map((h) => enrichSupabaseHotel(mapHotel(h, cityRow, country), nights, cityRow, country));

  results = applyPriceFilters(results, params);
  results = applyFacilityFilters(results, params);

  if (params.nearLandmark) {
    const lm = params.nearLandmark.toLowerCase();
    results = results.filter((h) =>
      (h.description || "").toLowerCase().includes(lm) ||
      (h.area_name || "").toLowerCase().includes(lm) ||
      (h.district || "").toLowerCase().includes(lm) ||
      (h.nearby_landmarks || []).some((x) => String(x).toLowerCase().includes(lm))
    );
  }

  return results;
}

async function hybridHotelSearch(sb, params, ctx) {
  const citySlug = params.city_id || params._resolvedCitySlug;
  if (!citySlug) {
    return { results: [], meta: { error: "city_not_found", cityInput: params.city } };
  }

  const cityRow = ctx.rawCities.find((c) => c.slug === citySlug);
  if (!cityRow) {
    return { results: [], meta: { error: "city_not_found", cityId: citySlug } };
  }

  const country = ctx.countryById[cityRow.country_id];
  const countryId = country ? countrySlug(country) : null;

  if (params.country && countryId && params.country !== countryId) {
    return { results: [], meta: { error: "country_mismatch", cityId: citySlug, countryId } };
  }

  const nights = Number(params.days || 5);
  const sort = params.sort || "recommended";
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.min(DEFAULT_PAGE_SIZE, Number(params.pageSize || DEFAULT_PAGE_SIZE));

  const verified = await fetchSupabaseHotels(sb, params, ctx, cityRow, country);
  const supabaseCount = verified.length;

  const mockCtx = {
    citySlug,
    cityRow,
    countryRow: country,
    countrySlug: countryId
  };

  const { pool, generator } = await getMockPoolForCity(mockCtx);
  let mockFiltered = filterMockPool(pool, params);
  mockFiltered = deduplicateHotels(verified, mockFiltered);

  const needMock = Math.max(0, MIN_TARGET - verified.length);
  let mockSelected = mockFiltered.slice(0, Math.max(needMock, 0));

  let merged = [...verified, ...mockSelected];
  if (merged.length < MIN_TARGET && mockFiltered.length > mockSelected.length) {
    const extra = mockFiltered.slice(mockSelected.length, MIN_TARGET - verified.length + mockSelected.length);
    merged = [...verified, ...mockSelected, ...extra];
  }

  merged = sortHotels(merged, sort);
  merged = merged.slice(0, MAX_TOTAL);

  const mockCount = merged.filter((h) => h.is_mock).length;
  const total = merged.length;
  const start = (page - 1) * pageSize;
  const pageResults = merged.slice(start, start + pageSize);

  return {
    results: pageResults.map((h) => ({ ...h, nights })),
    meta: {
      cityId: citySlug,
      cityName: cityRow.name_mn || citySlug,
      cityInput: params.city,
      countryId,
      nights,
      source: "hybrid",
      supabase_count: supabaseCount,
      mock_count: mockCount,
      mock_generator: generator,
      total,
      page,
      pageSize,
      hasMore: start + pageSize < total,
      maxResults: MAX_TOTAL,
      minTarget: MIN_TARGET,
      filters: params,
      formData: params,
      subtitle: NEEDS_CHECK_MSG
    }
  };
}

module.exports = {
  hybridHotelSearch,
  MIN_TARGET,
  MAX_TOTAL,
  DEFAULT_PAGE_SIZE,
  enrichSupabaseHotel,
  sortHotels,
  deduplicateHotels
};
