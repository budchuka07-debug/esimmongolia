/**
 * Hybrid hotel search — Supabase verified + deterministic mock fill
 */
const { mapHotel, countrySlug } = require("./travel-data-lib");
const { normalizeHotelKey, getMockPoolForCity, filterMockPool, NEEDS_CHECK_MSG } = require("./hotel-mock");
const { buildOfflineSearchCtx } = require("./asia-catalog-fallback");
const { TARGET_MAJOR, TARGET_MINOR, getHotelTargetForCity } = require("./city-hotel-targets");

const SUPABASE_SUFFICIENT = 12;
const TARGET_TOTAL = TARGET_MINOR;
const MAX_TOTAL = TARGET_MAJOR;
const DEFAULT_PAGE_SIZE = TARGET_MAJOR;
const SUPABASE_QUERY_MS = 2500;

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
    availability_status: "check_on_request",
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

function isMockHotel(h) {
  return !!(h.is_mock || h.source === "mock" || h.source === "ai_mock");
}

function sortHotels(hotels, sort) {
  const list = hotels.slice();
  if (sort === "price_asc") {
    list.sort((a, b) => (a.price_per_night ?? a.final_price_mnt) - (b.price_per_night ?? b.final_price_mnt));
  } else if (sort === "price_desc") {
    list.sort((a, b) => (b.price_per_night ?? b.final_price_mnt) - (a.price_per_night ?? a.final_price_mnt));
  } else if (sort === "stars_desc") {
    list.sort((a, b) => b.stars - a.stars || (a.price_per_night ?? 0) - (b.price_per_night ?? 0));
  } else if (sort === "metro_asc" || sort === "center_asc") {
    list.sort((a, b) => (a.distance_to_center_km ?? 99) - (b.distance_to_center_km ?? 99));
  } else if (sort === "attraction_asc") {
    list.sort((a, b) => (a.distance_to_attraction_km ?? 99) - (b.distance_to_attraction_km ?? 99));
  } else {
    list.sort((a, b) => {
      const aMock = isMockHotel(a);
      const bMock = isMockHotel(b);
      if (aMock !== bMock) return aMock ? 1 : -1;
      const score = (b.recommendation_score ?? 0) - (a.recommendation_score ?? 0);
      if (score) return score;
      const stars = b.stars - a.stars;
      if (stars) return stars;
      return (a.distance_to_center_km ?? 99) - (b.distance_to_center_km ?? 99);
    });
  }
  return list;
}

function resolveTargetTotal(params, citySlug) {
  if (Number(params.minTarget) > 0) return Number(params.minTarget);
  return getHotelTargetForCity(citySlug);
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

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("supabase_timeout")), ms))
  ]);
}

async function mockOnlyHotelSearch(params, ctx) {
  const citySlug = params.city_id || params._resolvedCitySlug;
  const offlineCtx = ctx?.cityRow ? ctx : buildOfflineSearchCtx(citySlug);
  if (!offlineCtx?.cityRow) {
    return { results: [], meta: { error: "city_not_found", cityId: citySlug, success: false } };
  }

  const cityRow = offlineCtx.cityRow;
  const country = offlineCtx.countryRow;
  const countryId = country?.slug || cityRow.country_id?.replace(/^local-/, "") || null;
  const nights = Number(params.days || 5);
  const sort = params.sort || "recommended";
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.min(MAX_TOTAL, Math.max(1, Number(params.pageSize || DEFAULT_PAGE_SIZE)));
  const minTarget = resolveTargetTotal(params, citySlug);

  const mockCtx = {
    citySlug,
    cityRow: { name_mn: cityRow.name_mn, name_en: cityRow.name_en, slug: citySlug },
    countryRow: country,
    countrySlug: countryId
  };

  const { pool, generator } = getMockPoolForCity(mockCtx);
  let merged = filterMockPool(pool, params).slice(0, minTarget);
  merged = sortHotels(merged, sort);
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
      source: "local_mock",
      real_count: 0,
      mock_count: merged.length,
      supabase_count: 0,
      mock_generator: generator,
      total,
      page,
      pageSize,
      hasMore: start + pageSize < total,
      maxResults: minTarget,
      minTarget,
      city_tier: getHotelTargetForCity(citySlug) === TARGET_MAJOR ? "major" : "minor",
      filters: params,
      formData: params,
      subtitle: NEEDS_CHECK_MSG,
      offline: true
    }
  };
}

async function hybridHotelSearch(sb, params, ctx) {
  const citySlug = params.city_id || params._resolvedCitySlug;
  if (!citySlug) {
    return { results: [], meta: { error: "city_not_found", cityInput: params.city, success: false } };
  }

  let cityRow = ctx?.rawCities?.find((c) => c.slug === citySlug);
  if (!cityRow && !sb) {
    return mockOnlyHotelSearch(params, ctx);
  }
  if (!cityRow) {
    const offline = buildOfflineSearchCtx(citySlug);
    if (!offline) {
      return { results: [], meta: { error: "city_not_found", cityId: citySlug, success: false } };
    }
    return mockOnlyHotelSearch(params, offline);
  }

  if (!sb) {
    return mockOnlyHotelSearch(params, ctx);
  }

  const country = ctx.countryById[cityRow.country_id];
  const countryId = country ? countrySlug(country) : (String(cityRow.country_id || "").replace(/^local-/, "") || null);

  if (params.country && countryId && params.country !== countryId) {
    return { results: [], meta: { error: "country_mismatch", cityId: citySlug, countryId, success: false } };
  }

  const nights = Number(params.days || 5);
  const sort = params.sort || "recommended";
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.min(MAX_TOTAL, Math.max(1, Number(params.pageSize || DEFAULT_PAGE_SIZE)));

  const verified = await withTimeout(
    fetchSupabaseHotels(sb, params, ctx, cityRow, country),
    SUPABASE_QUERY_MS
  ).catch((err) => {
    console.warn("[hotel-search] Supabase fetch skipped:", err.message);
    return [];
  });
  const supabaseCount = verified.length;
  const targetTotal = resolveTargetTotal(params, citySlug);

  if (supabaseCount >= SUPABASE_SUFFICIENT) {
    let merged = sortHotels(verified, sort);
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
        source: "supabase",
        real_count: supabaseCount,
        mock_count: 0,
        supabase_count: supabaseCount,
        mock_generator: null,
        total,
        page,
        pageSize,
        hasMore: start + pageSize < total,
        maxResults: total,
        minTarget: targetTotal,
        city_tier: getHotelTargetForCity(citySlug) === TARGET_MAJOR ? "major" : "minor",
        filters: params,
        formData: params,
        subtitle: NEEDS_CHECK_MSG
      }
    };
  }

  const mockCtx = {
    citySlug,
    cityRow,
    countryRow: country,
    countrySlug: countryId
  };

  const { pool, generator } = getMockPoolForCity(mockCtx);
  let mockFiltered = filterMockPool(pool, params);
  mockFiltered = deduplicateHotels(verified, mockFiltered);

  const needMock = Math.max(0, targetTotal - supabaseCount);
  const mockSelected = mockFiltered.slice(0, needMock);

  let merged = [...verified, ...mockSelected];
  merged = sortHotels(merged, sort);
  merged = merged.slice(0, targetTotal);

  const mockCount = merged.filter((h) => h.is_mock).length;
  const total = merged.length;
  const start = (page - 1) * pageSize;
  const pageResults = merged.slice(start, start + pageSize);
  const sourceLabel = supabaseCount > 0 ? "supabase+local_mock" : "local_mock";

  return {
    results: pageResults.map((h) => ({ ...h, nights })),
    meta: {
      cityId: citySlug,
      cityName: cityRow.name_mn || citySlug,
      cityInput: params.city,
      countryId,
      nights,
      source: sourceLabel,
      real_count: supabaseCount,
      mock_count: mockCount,
      supabase_count: supabaseCount,
      mock_generator: generator,
      total,
      page,
      pageSize,
      hasMore: start + pageSize < total,
      maxResults: targetTotal,
      city_tier: getHotelTargetForCity(citySlug) === TARGET_MAJOR ? "major" : "minor",
      minTarget: targetTotal,
      filters: params,
      formData: params,
      subtitle: NEEDS_CHECK_MSG
    }
  };
}

module.exports = {
  hybridHotelSearch,
  SUPABASE_SUFFICIENT,
  TARGET_TOTAL,
  TARGET_MAJOR,
  TARGET_MINOR,
  MAX_TOTAL,
  DEFAULT_PAGE_SIZE,
  SUPABASE_QUERY_MS,
  enrichSupabaseHotel,
  sortHotels,
  deduplicateHotels,
  getHotelTargetForCity,
  resolveTargetTotal,
  isMockHotel
};
