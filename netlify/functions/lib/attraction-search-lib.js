/**
 * Hybrid attraction search — Supabase + deterministic local mock fill.
 */
const { mapAttraction, countrySlug } = require("./travel-data-lib");
const { NEEDS_CHECK_MSG, getMockPoolForSearch, filterMockPool, normalizeCategory, ATTRACTION_CATEGORIES } = require("./attraction-mock");
const { buildOfflineSearchCtx } = require("./asia-catalog-fallback");

const SUPABASE_SUFFICIENT = 12;
const TARGET_TOTAL = 60;
const MAX_TOTAL = 60;
const PAGE_SIZE_DEFAULT = 12;
const SUPABASE_QUERY_MS = 2500;
const ATTRACTIONS_TABLE = "attractions";

function isMockAttraction(a) {
  return !!(a.is_mock || a.source === "local_mock" || a.source === "mock");
}

function enrichAttraction(mapped, cityRow, country) {
  const price = mapped.final_price_mnt ?? mapped.estimated_price ?? 0;
  const cat = normalizeCategory(mapped.category);
  const catMeta = ATTRACTION_CATEGORIES.find((c) => c.value === cat);
  return {
    ...mapped,
    category: cat,
    category_label_mn: catMeta?.label_mn || mapped.category,
    category_icon: catMeta?.icon || "🎫",
    name: mapped.name_mn || mapped.name_en || mapped.name,
    country: country?.name_mn || mapped.country_id,
    country_name_mn: country?.name_mn,
    city: cityRow?.name_mn || mapped.city_id,
    city_name_mn: cityRow?.name_mn,
    estimated_price: price,
    currency: mapped.currency || "MNT",
    source: mapped.source || "supabase",
    is_mock: false,
    verification_status: "verified",
    needs_check_message: NEEDS_CHECK_MSG,
    recommendation_score: mapped.popularity_score ?? mapped.recommendation_score ?? 50
  };
}

function isLikelyOpenNow(openingHours) {
  const h = String(openingHours || "");
  if (!h || /ойролцоо|check|шалг/i.test(h)) return null;
  const hour = new Date().getHours();
  const indoor = /10:00|11:00/.test(h);
  const start = indoor ? 10 : 8;
  const end = indoor ? 20 : 18;
  return hour >= start && hour < end;
}

function applyFilters(list, params) {
  let out = list.slice();
  const kw = String(params.keyword || params.attraction || "").trim().toLowerCase();
  if (kw) {
    out = out.filter((a) =>
      (a.name || "").toLowerCase().includes(kw) ||
      (a.name_mn || "").toLowerCase().includes(kw) ||
      (a.name_en || "").toLowerCase().includes(kw) ||
      (a.description || "").toLowerCase().includes(kw) ||
      (a.short_description || "").toLowerCase().includes(kw) ||
      (a.district || "").toLowerCase().includes(kw) ||
      (a.category || "").toLowerCase().includes(kw)
    );
  }
  if (params.category && params.category !== "all") {
    if (params.category === "family") out = out.filter((a) => a.family_friendly);
    else if (params.category === "free") out = out.filter((a) => a.free_entry);
    else out = out.filter((a) => normalizeCategory(a.category) === normalizeCategory(params.category));
  }
  if (params.district) {
    const d = params.district.toLowerCase();
    out = out.filter((a) => (a.district || "").toLowerCase().includes(d));
  }
  const minP = Number(params.priceMinMnt || params.budget_min || 0);
  const maxP = Number(params.priceMaxMnt || params.budget_max || 0);
  if (minP > 0) out = out.filter((a) => (a.estimated_price ?? a.final_price_mnt ?? 0) >= minP);
  if (maxP > 0) out = out.filter((a) => (a.estimated_price ?? a.final_price_mnt ?? 0) <= maxP);
  if (params.familyFriendly === "1" || params.family === "1") out = out.filter((a) => a.family_friendly);
  if (params.freeOnly === "1" || params.free_entry === "1") out = out.filter((a) => a.free_entry);
  if (params.indoor === "1") out = out.filter((a) => a.indoor);
  if (params.outdoor === "1") out = out.filter((a) => !a.indoor);
  if (params.bookingRequired === "1") out = out.filter((a) => a.booking_required);
  if (params.openNow === "1") {
    out = out.filter((a) => {
      const open = isLikelyOpenNow(a.opening_hours);
      return open === null ? true : open;
    });
  }
  const minPop = Number(params.minPopularity || params.popularityMin || 0);
  if (minPop > 0) out = out.filter((a) => (a.popularity_score ?? 0) >= minPop);
  return out;
}

function sortAttractions(list, sort) {
  const out = list.slice();
  if (sort === "price_asc" || sort === "price_low") {
    out.sort((a, b) => (a.estimated_price ?? a.final_price_mnt ?? 0) - (b.estimated_price ?? b.final_price_mnt ?? 0));
  } else if (sort === "price_desc" || sort === "price_high") {
    out.sort((a, b) => (b.estimated_price ?? b.final_price_mnt ?? 0) - (a.estimated_price ?? a.final_price_mnt ?? 0));
  } else if (sort === "popular" || sort === "popularity") {
    out.sort((a, b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0));
  } else if (sort === "family" || sort === "family_friendly") {
    out.sort((a, b) => Number(b.family_friendly) - Number(a.family_friendly));
  } else if (sort === "nearest") {
    out.sort((a, b) => (a.distance_km ?? 99) - (b.distance_km ?? 99));
  } else if (sort === "newest") {
    out.sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0) || (b.popularity_score ?? 0) - (a.popularity_score ?? 0));
  } else {
    out.sort((a, b) => {
      const aMock = isMockAttraction(a);
      const bMock = isMockAttraction(b);
      if (aMock !== bMock) return aMock ? 1 : -1;
      return (b.recommendation_score ?? b.popularity_score ?? 0) - (a.recommendation_score ?? a.popularity_score ?? 0);
    });
  }
  return out;
}

function dedupeAttractions(verified, mockCandidates) {
  const seen = new Set();
  verified.forEach((a) => {
    seen.add(`${(a.name_mn || a.name || "").toLowerCase()}|${a.city_id}|${a.district || ""}`);
  });
  return mockCandidates.filter((a) => {
    const key = `${(a.name_mn || a.name || "").toLowerCase()}|${a.city_id}|${a.district || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchSupabaseAttractions(sb, params, cityRow, country) {
  const citySlug = cityRow?.slug || params.city_id || params._resolvedCitySlug;
  const countrySlugVal = params.country || (country ? countrySlug(country) : null);
  const cityIdIsUuid = cityRow?.id && !String(cityRow.id).startsWith("local-");

  let q = sb.from(ATTRACTIONS_TABLE).select("*").eq("active", true);

  if (citySlug) {
    q = q.eq("city", citySlug);
  } else if (cityIdIsUuid) {
    q = q.eq("city_id", cityRow.id);
  }

  if (countrySlugVal) {
    q = q.eq("country", countrySlugVal);
  } else if (country?.id && !String(country.id).startsWith("local-")) {
    q = q.eq("country_id", country.id);
  }

  if (params.category && params.category !== "all" && !["family", "free"].includes(params.category)) {
    q = q.eq("category", params.category);
  }
  if (params.category === "family") q = q.eq("family_friendly", true);
  if (params.category === "free") q = q.eq("free_entry", true);
  if (params.district) q = q.ilike("district", `%${params.district}%`);
  const kw = params.keyword || params.attraction;
  if (kw) {
    q = q.or(
      `name.ilike.%${kw}%,name_mn.ilike.%${kw}%,name_en.ilike.%${kw}%,` +
      `description.ilike.%${kw}%,description_mn.ilike.%${kw}%,` +
      `short_description.ilike.%${kw}%,district.ilike.%${kw}%`
    );
  }

  let { data, error } = await q.order("popularity_score", { ascending: false }).limit(120);
  if (error && /popularity_score|sort_order/i.test(error.message)) {
    ({ data, error } = await q.limit(120));
  }
  if (error) throw new Error(error.message);

  let results = (data || []).map((row) =>
    enrichAttraction(mapAttraction(row, cityRow, country, citySlug), cityRow, country)
  );
  results = applyFilters(results, params);
  return results;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("supabase_timeout")), ms))
  ]);
}

async function hybridAttractionSearch(sb, params, ctx) {
  const citySlug = params.city_id || params._resolvedCitySlug;
  if (!citySlug) {
    return { attractions: [], meta: { error: "city_not_found", success: false } };
  }

  let cityRow = ctx?.rawCities?.find((c) => c.slug === citySlug);
  if (!cityRow) {
    const offline = buildOfflineSearchCtx(citySlug);
    if (!offline) return { attractions: [], meta: { error: "city_not_found", cityId: citySlug, success: false } };
    cityRow = offline.cityRow;
    ctx = offline;
  }

  const country = ctx.countryById?.[cityRow.country_id] || ctx.countryRow;
  const countryId = country ? countrySlug(country) : String(cityRow.country_id || "").replace(/^local-/, "");

  if (params.country && countryId && params.country !== countryId) {
    return { attractions: [], meta: { error: "country_mismatch", cityId: citySlug, success: false } };
  }

  const sort = params.sort || "recommended";
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.min(MAX_TOTAL, Math.max(1, Number(params.pageSize || PAGE_SIZE_DEFAULT)));
  const targetTotal = Math.min(MAX_TOTAL, Number(params.minTarget) > 0 ? Number(params.minTarget) : TARGET_TOTAL);

  let verified = [];
  if (sb) {
    verified = await withTimeout(
      fetchSupabaseAttractions(sb, params, cityRow, country),
      SUPABASE_QUERY_MS
    ).catch((err) => {
      console.warn("[attraction-search] Supabase skipped:", err.message);
      return [];
    });
  }
  const supabaseCount = verified.length;

  if (supabaseCount >= SUPABASE_SUFFICIENT) {
    let merged = sortAttractions(verified, sort);
    const total = merged.length;
    const start = (page - 1) * pageSize;
    const pageResults = merged.slice(start, start + pageSize);
    return {
      attractions: pageResults,
      meta: {
        cityId: citySlug,
        cityName: cityRow.name_mn || citySlug,
        countryId,
        source: "supabase",
        real_count: supabaseCount,
        mock_count: 0,
        total,
        page,
        pageSize,
        hasMore: start + pageSize < total,
        maxResults: total,
        subtitle: NEEDS_CHECK_MSG,
        success: true
      }
    };
  }

  const mockCtx = {
    citySlug,
    cityRow,
    countryRow: country,
    countrySlug: countryId
  };

  const { pool, generator } = getMockPoolForSearch(mockCtx, params, targetTotal);
  let mockFiltered = dedupeAttractions(verified, pool);
  const needMock = Math.max(0, targetTotal - supabaseCount);
  mockFiltered = mockFiltered.slice(0, needMock);

  let merged = [...verified, ...mockFiltered];
  merged = sortAttractions(merged, sort);
  merged = merged.slice(0, targetTotal);

  if (!merged.length) {
    const fallback = getMockPoolForSearch(mockCtx, {}, targetTotal);
    merged = sortAttractions(dedupeAttractions([], fallback.pool).slice(0, targetTotal), sort);
  }

  const mockCount = merged.filter(isMockAttraction).length;
  const total = merged.length;
  const start = (page - 1) * pageSize;
  const pageResults = merged.slice(start, start + pageSize);
  const sourceLabel = supabaseCount > 0 ? "supabase+local_mock" : "local_mock";

  return {
    attractions: pageResults,
    meta: {
      cityId: citySlug,
      cityName: cityRow.name_mn || citySlug,
      countryId,
      source: sourceLabel,
      real_count: supabaseCount,
      mock_count: mockCount,
      mock_generator: generator,
      total,
      page,
      pageSize,
      hasMore: start + pageSize < total,
      maxResults: targetTotal,
      subtitle: NEEDS_CHECK_MSG,
      success: true
    }
  };
}

module.exports = {
  hybridAttractionSearch,
  ATTRACTIONS_TABLE,
  SUPABASE_SUFFICIENT,
  TARGET_TOTAL,
  MAX_TOTAL,
  PAGE_SIZE_DEFAULT,
  sortAttractions,
  applyFilters,
  isMockAttraction,
  NEEDS_CHECK_MSG
};
