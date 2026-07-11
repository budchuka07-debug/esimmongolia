/**
 * Travel AI tool handlers — Supabase + hybrid mock + catalog.
 */
const { getSupabase } = require("./supabase-client");
const { buildCityIndex, normalizeCityInput, countrySlug, mapFlight } = require("./travel-data-lib");
const { hybridHotelSearch, sortHotels, getHotelTargetForCity, TARGET_MAJOR } = require("./hotel-search-lib");
const { hybridAttractionSearch, TARGET_TOTAL: ATTRACTION_TARGET, PAGE_SIZE_DEFAULT: ATTRACTION_PAGE_SIZE } = require("./attraction-search-lib");
const { NEEDS_CHECK_MSG: ATTRACTION_CHECK_MSG, categoryLabelMn } = require("./attraction-mock");
const { NEEDS_CHECK_MSG } = require("./hotel-mock");
const { buildOfflineSearchCtx, resolveOfflineCitySlug } = require("./asia-catalog-fallback");
const consultant = require("./ai-consultant");
const { getChinaPlans } = require("../china-plans");

const AI_DISPLAY_HOTELS = 5;
const AI_DISPLAY_ATTRACTIONS = 5;
const UI_PAGE_SIZE = TARGET_MAJOR;

async function buildSearchCtxFast(sb, citySlug, cityInput) {
  const slug = citySlug || resolveOfflineCitySlug(cityInput);
  if (!slug) return null;

  const offline = buildOfflineSearchCtx(slug);
  if (!offline) return null;

  if (!sb) return { ...offline, resolvedSlug: slug };

  try {
    const { data: city, error } = await withTimeout(
      sb.from("esm_cities")
        .select("id, slug, name_mn, name_en, name_local, country_id, aliases, esm_countries(*)")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle(),
      1500
    );

    if (!error && city) {
      const country = city.esm_countries;
      return {
        rawCities: [city],
        countryById: country ? { [city.country_id]: country } : offline.countryById,
        aliasIndex: offline.aliasIndex,
        cityRow: city,
        countryRow: country || offline.countryRow,
        resolvedSlug: slug
      };
    }
  } catch (err) {
    console.warn("[travel-ai-tools] fast city lookup:", err.message);
  }

  return { ...offline, resolvedSlug: slug };
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
  ]);
}

async function loadCityMaps(sb) {
  const { data: cities } = await sb.from("esm_cities").select("*, esm_countries(*)");
  const { data: countries } = await sb.from("esm_countries").select("*");
  const countryById = {};
  (countries || []).forEach((c) => { countryById[c.id] = c; });
  const byUuid = {};
  (cities || []).map((c) => {
    const co = countryById[c.country_id] || c.esm_countries;
    const m = { uuid: c.id, slug: c.slug, name_mn: c.name_mn, name_en: c.name_en, country_id: co ? countrySlug(co) : null };
    byUuid[c.id] = m;
    return m;
  });
  const { aliasIndex } = buildCityIndex(
    (cities || []).map((c) => {
      const co = countryById[c.country_id];
      return {
        id: c.slug,
        slug: c.slug,
        name_mn: c.name_mn,
        name_en: c.name_en,
        local: c.name_local,
        aliases: c.aliases || []
      };
    })
  );
  return { byUuid, aliasIndex, rawCities: cities || [], countryById };
}

function mapHotelForAi(h) {
  const isMock = h.is_mock || h.source === "mock" || h.source === "ai_mock";
  return {
    id: h.id,
    name: h.name || h.name_en,
    country: h.country || h.country_name_mn,
    city: h.city || h.city_name_mn || h.city_id,
    district: h.district || h.area_name,
    stars: h.stars,
    price_per_night: h.price_per_night ?? h.final_price_mnt,
    currency: "MNT",
    facilities: h.facilities || h.amenities || [],
    description: h.description || h.description_mn || "",
    image_url: h.image_url || h.cover_image || h.image,
    source: isMock ? "mock" : "supabase",
    is_mock: isMock,
    availability_status: "check_on_request",
    needs_check_message: isMock ? NEEDS_CHECK_MSG : undefined
  };
}

function enrichHotelResults(results) {
  return (results || []).map((h) => {
    const isMock = h.is_mock || h.source === "mock" || h.source === "ai_mock";
    if (!isMock) return h;
    return {
      ...h,
      source: "mock",
      is_mock: true,
      availability_status: "check_on_request",
      needs_check_message: NEEDS_CHECK_MSG
    };
  });
}

function intentToSearchParams(intent) {
  const params = {
    city_id: intent.city_id,
    city: intent.city,
    country: intent.country,
    days: intent.nights || 5,
    district: intent.district || "",
    minStars: intent.stars || "",
    priceMinMnt: intent.budget_min || "",
    priceMaxMnt: intent.budget_max || "",
    minTarget: getHotelTargetForCity(intent.city_id || intent.city),
    page: 1,
    pageSize: AI_DISPLAY_HOTELS,
    sort: intent.wants_cheaper ? "price_asc" : "recommended"
  };
  if (intent.facilities?.includes("metro_nearby")) params.nearMetro = "1";
  if (intent.facilities?.includes("breakfast")) params.breakfast = "1";
  if (intent.facilities?.includes("near_attraction")) params.nearAttraction = "1";
  if (intent.wants_disney && !params.district) params.district = "Disneyland";
  return params;
}

async function buildSearchCtx(sb, citySlug, cityInput) {
  return buildSearchCtxFast(sb, citySlug, cityInput);
}

function formToSearchParams(form) {
  return {
    city_id: form.city_id || "",
    city: form.city || "",
    country: form.country || form.country_id || "",
    days: Number(form.days || form.checkin_days || 5),
    guests: Number(form.guests || 2),
    district: form.district || form.area || "",
    area: form.area || "",
    keyword: form.keyword || "",
    minStars: form.minStars || "",
    priceMinMnt: form.priceMinMnt || "",
    priceMaxMnt: form.priceMaxMnt || "",
    nearMetro: form.nearMetro || "",
    nearAirport: form.nearAirport || "",
    nearAttraction: form.nearAttraction || "",
    breakfast: form.breakfast || "",
    freeCancellation: form.freeCancellation || "",
    familyFriendly: form.familyFriendly || "",
    nearLandmark: form.nearLandmark || "",
    sort: form.sort || "recommended",
    page: Number(form.page || 1),
    pageSize: Number(form.pageSize || UI_PAGE_SIZE),
    minTarget: getHotelTargetForCity(form.city_id || form.city)
  };
}

function mapAttractionForAi(a) {
  const isMock = a.is_mock || a.source === "local_mock" || a.source === "mock";
  return {
    id: a.id,
    name: a.name_mn || a.name_en || a.name,
    country: a.country || a.country_name_mn,
    city: a.city || a.city_name_mn || a.city_id,
    district: a.district,
    category: a.category,
    category_label_mn: a.category_label_mn || categoryLabelMn(a.category),
    short_description: a.short_description || a.description_mn || "",
    image_url: a.image_url || a.cover_image_url,
    estimated_price: a.estimated_price ?? a.final_price_mnt,
    currency: "MNT",
    opening_hours: a.opening_hours,
    recommended_duration: a.recommended_duration,
    family_friendly: !!a.family_friendly,
    free_entry: !!a.free_entry,
    source: isMock ? "local_mock" : "supabase",
    is_mock: isMock,
    verification_status: isMock ? "check_before_booking" : "verified",
    needs_check_message: isMock ? ATTRACTION_CHECK_MSG : undefined
  };
}

function enrichAttractionResults(results) {
  return (results || []).map((a) => {
    const isMock = a.is_mock || a.source === "local_mock" || a.source === "mock";
    if (!isMock) return a;
    return {
      ...a,
      source: "local_mock",
      is_mock: true,
      verification_status: "check_before_booking",
      needs_check_message: ATTRACTION_CHECK_MSG
    };
  });
}

function attractionFormToParams(form) {
  return {
    city_id: form.city_id || "",
    city: form.city || "",
    country: form.country || form.country_id || "",
    keyword: form.keyword || form.attraction || "",
    attraction: form.attraction || form.keyword || "",
    category: form.category || "all",
    visitors: Number(form.visitors || form.people || 2),
    visit_date: form.visit_date || form.date || "",
    priceMinMnt: form.priceMinMnt || form.budget_min || "",
    priceMaxMnt: form.priceMaxMnt || form.budget_max || "",
    budget_min: form.budget_min || form.priceMinMnt || "",
    budget_max: form.budget_max || form.priceMaxMnt || "",
    district: form.district || "",
    familyFriendly: form.familyFriendly || "",
    freeOnly: form.freeOnly || "",
    sort: form.sort || "recommended",
    page: Number(form.page || 1),
    pageSize: Number(form.pageSize || ATTRACTION_PAGE_SIZE),
    minTarget: ATTRACTION_TARGET
  };
}

async function searchAttractionsFull(form, log) {
  const sb = getSupabase("travel-ai");
  const params = attractionFormToParams(form);
  const ctx = await buildSearchCtx(sb, params.city_id, params.city);
  if (!ctx) {
    return {
      success: false,
      error: "city_not_found",
      attractions: [],
      results: [],
      meta: { error: "city_not_found", cityInput: params.city }
    };
  }

  params._resolvedCitySlug = ctx.resolvedSlug || params.city_id;
  params.city_id = params._resolvedCitySlug;

  const payload = await hybridAttractionSearch(sb, params, ctx);
  const attractions = enrichAttractionResults(payload.attractions || []);
  const realCount = payload.meta?.real_count ?? 0;
  const mockCount = payload.meta?.mock_count ?? attractions.filter((a) => a.is_mock).length;

  log.tool = "search_attractions_full";
  log.real_count = realCount;
  log.mock_count = mockCount;

  return {
    success: true,
    error: null,
    attractions,
    results: attractions,
    real_count: realCount,
    mock_count: mockCount,
    total: payload.meta?.total ?? attractions.length,
    source: payload.meta?.source || "local_mock",
    meta: { ...payload.meta, real_count: realCount, mock_count: mockCount }
  };
}

async function searchAttractions(intent, log) {
  const sb = getSupabase("travel-ai");
  const ctx = await buildSearchCtx(sb, intent.city_id, intent.city);
  const citySlug = ctx?.resolvedSlug || intent.city_id || resolveOfflineCitySlug(intent.city);
  if (!citySlug || !ctx) {
    return { attractions: [], real_count: 0, mock_count: 0, error: "city_not_found", success: false };
  }

  const params = {
    city_id: citySlug,
    city: intent.city,
    country: intent.country,
    keyword: intent.keyword || intent.attraction || "",
    attraction: intent.attraction || intent.keyword || "",
    category: intent.category || "all",
    visitors: intent.guests || intent.visitors || 2,
    priceMinMnt: intent.budget_min || "",
    priceMaxMnt: intent.budget_max || "",
    familyFriendly: intent.family_friendly ? "1" : "",
    freeOnly: intent.free_only ? "1" : "",
    sort: intent.sort || "recommended",
    page: 1,
    pageSize: AI_DISPLAY_ATTRACTIONS,
    minTarget: ATTRACTION_TARGET
  };
  params._resolvedCitySlug = citySlug;

  const payload = await hybridAttractionSearch(sb, params, ctx);
  let results = enrichAttractionResults(payload.attractions || []);
  const top = results.slice(0, AI_DISPLAY_ATTRACTIONS).map(mapAttractionForAi);

  log.tool = "search_attractions";
  log.real_count = payload.meta?.real_count ?? 0;
  log.mock_count = payload.meta?.mock_count ?? 0;

  return {
    success: true,
    error: null,
    attractions: top,
    total: payload.meta?.total || results.length,
    real_count: payload.meta?.real_count ?? 0,
    mock_count: payload.meta?.mock_count ?? 0,
    city: payload.meta?.cityName || intent.city,
    visitors: intent.guests || 2
  };
}

async function searchHotelsFull(form, log) {
  const sb = getSupabase("travel-ai");
  const params = formToSearchParams(form);
  const ctx = await buildSearchCtx(sb, params.city_id, params.city);
  if (!ctx) {
    return {
      success: false,
      error: "city_not_found",
      results: [],
      meta: { error: "city_not_found", cityInput: params.city }
    };
  }

  params._resolvedCitySlug = ctx.resolvedSlug || params.city_id;
  params.city_id = params._resolvedCitySlug;
  const cityTarget = getHotelTargetForCity(params.city_id);
  params.page = Number(form.page || 1);
  params.pageSize = Math.max(Number(form.pageSize || cityTarget), cityTarget);
  params.minTarget = cityTarget;

  const payload = await hybridHotelSearch(sb, params, ctx);
  const hotels = enrichHotelResults(payload.results || []);
  const realCount = payload.meta?.real_count ?? payload.meta?.supabase_count ?? 0;
  const mockCount = payload.meta?.mock_count ?? hotels.filter((h) => h.is_mock).length;

  log.tool = "search_hotels_full";
  log.supabase_count = realCount;
  log.mock_count = mockCount;

  return {
    success: true,
    error: null,
    hotels,
    results: hotels,
    real_count: realCount,
    mock_count: mockCount,
    source: payload.meta?.source || "local_mock",
    meta: {
      ...payload.meta,
      real_count: realCount,
      mock_count: mockCount,
      supabase_count: realCount
    }
  };
}

async function searchHotels(intent, log) {
  const sb = getSupabase("travel-ai");
  const ctx = await buildSearchCtx(sb, intent.city_id, intent.city);
  const citySlug = ctx?.resolvedSlug || intent.city_id || resolveOfflineCitySlug(intent.city);
  if (!citySlug || !ctx) {
    return { hotels: [], supabase_count: 0, mock_count: 0, error: "city_not_found", success: false };
  }

  const params = intentToSearchParams({ ...intent, city_id: citySlug });
  params._resolvedCitySlug = citySlug;

  const payload = await hybridHotelSearch(sb, params, ctx);
  let results = payload.results || [];

  if (intent.wants_cheaper) {
    results = sortHotels(results, "price_asc");
  }

  const top = results.slice(0, AI_DISPLAY_HOTELS).map(mapHotelForAi);
  const supabase_count = payload.meta?.supabase_count ?? results.filter((h) => !h.is_mock).length;
  const mock_count = payload.meta?.mock_count ?? results.filter((h) => h.is_mock).length;

  log.tool = "search_hotels";
  log.supabase_count = supabase_count;
  log.mock_count = mock_count;

  return {
    success: true,
    error: null,
    hotels: top,
    total: payload.meta?.total || results.length,
    supabase_count,
    mock_count,
    city: payload.meta?.cityName || intent.city,
    nights: intent.nights || 5,
    guests: intent.guests || 2
  };
}

async function searchFlights(intent, log) {
  const sb = getSupabase("travel-ai");
  if (!sb) {
    return { flights: [], error: "supabase_not_configured", success: false };
  }

  const ctx = await loadCityMaps(sb);
  const toSlug = intent.city_id || normalizeCityInput(intent.city, ctx.aliasIndex) || "shanghai";
  const fromRow = ctx.rawCities.find((c) => c.slug === "ulanbaatar");
  const toRow = ctx.rawCities.find((c) => c.slug === toSlug);

  let q = sb.from("esm_flights").select("*").eq("active", true);
  if (fromRow) q = q.eq("from_city_id", fromRow.id);
  if (toRow) q = q.eq("to_city_id", toRow.id);

  const { data, error } = await q.limit(8);
  if (error) throw new Error(error.message);

  const flights = (data || []).map((f) => {
    const fc = ctx.rawCities.find((c) => c.id === f.from_city_id);
    const tc = ctx.rawCities.find((c) => c.id === f.to_city_id);
    const mapped = mapFlight(f, fc, tc, null);
    return {
      airline: mapped.airline,
      from: mapped.from_city,
      to: mapped.to_city,
      depart: mapped.depart_time,
      arrive: mapped.arrive_time,
      price_mnt: mapped.final_price_mnt,
      is_direct: mapped.is_direct,
      availability_status: "check_on_request"
    };
  });

  log.tool = "search_flights";
  log.flight_count = flights.length;
  return { success: true, error: null, flights, from: "Улаанбаатар", to: intent.city || toSlug };
}

function searchEsimPlans(intent, log) {
  const days = intent.nights || intent.esim_days || 20;
  let plans = getChinaPlans();

  if (intent.country && intent.country !== "china") {
    plans = plans.filter((p) => false);
  }

  const matched = plans
    .filter((p) => {
      const d = Number(p.vaildity || p.daysNum || 0);
      return d >= days - 3 && d <= days + 10;
    })
    .sort((a, b) => a.sellPriceMnt - b.sellPriceMnt)
    .slice(0, 5);

  const fallback = matched.length ? matched : plans.slice(0, 5);

  log.tool = "search_esim_plans";
  log.esim_count = fallback.length;

  return {
    success: true,
    error: null,
    plans: fallback.map((p) => ({
      name: p.planName || p.dataLabel,
      days: p.daysLabel || p.vaildity,
      data: p.dataLabel,
      price_mnt: p.sellPriceMnt,
      country: "Хятад",
      availability_status: "available"
    })),
    requested_days: days
  };
}

function createItinerary(intent, log) {
  const cityId = intent.city_id || "shanghai";
  const days = intent.nights || 5;

  const reply = consultant.buildConsultantReply({
    city_id: cityId,
    city: intent.city,
    country: intent.country_mn || "Хятад",
    days,
    people: intent.guests || 2,
    month: intent.month,
    day: intent.day
  }, "");

  log.tool = "create_itinerary";

  if (reply?.reply) {
    const lines = reply.reply.split("\n").filter((l) => /^\d+-р өдөр:/.test(l.trim()));
    return {
      city: intent.city || cityId,
      days,
      itinerary: lines.length ? lines : reply.reply.split("\n").slice(0, days + 2),
      summary: `${intent.city || cityId} ${days} хоногийн маршрут`
    };
  }

  return {
    city: intent.city || cityId,
    days,
    itinerary: [
      "1-р өдөр: Ирэх, буудал, хотын төвөөр алхах",
      "2-р өдөр: Үндсэн үзвэр, метро ашиглан зорчих",
      "3-р өдөр: Shopping, орон нутгийн хоол амлах"
    ].slice(0, Math.max(3, days)),
    summary: `${intent.city || cityId} ${days} хоногийн ерөнхий маршрут`
  };
}

async function getSupabaseCatalog(intent, log) {
  const sb = getSupabase("travel-ai");
  if (!sb) {
    const { getFallbackCatalog } = require("./asia-catalog-fallback");
    const fb = getFallbackCatalog();
    log.tool = "get_supabase_catalog";
    return {
      success: true,
      error: null,
      countries: fb.countries.map((c) => ({ id: c.id, name: c.name_mn, iso: c.iso_code })),
      cities: fb.cities.map((c) => ({ id: c.id, name: c.name_mn, name_en: c.name_en })),
      source: "local_fallback"
    };
  }

  const [{ data: countries }, { data: cities }] = await Promise.all([
    sb.from("esm_countries").select("slug, name_mn, name_en, iso_code").eq("active", true).order("sort_order"),
    sb.from("esm_cities").select("slug, name_mn, name_en, country_id").eq("active", true).order("sort_order").limit(120)
  ]);

  log.tool = "get_supabase_catalog";
  log.catalog_countries = (countries || []).length;
  log.catalog_cities = (cities || []).length;

  return {
    success: true,
    error: null,
    countries: (countries || []).map((c) => ({ id: c.slug || countrySlug(c), name: c.name_mn, iso: c.iso_code })),
    cities: (cities || []).map((c) => ({ id: c.slug, name: c.name_mn, name_en: c.name_en })),
    source: "supabase"
  };
}

async function runTool(name, args, intent, log) {
  const payload = { ...intent, ...(args || {}) };
  switch (name) {
    case "search_hotels": return searchHotels(payload, log);
    case "search_attractions": return searchAttractions(payload, log);
    case "search_flights": return searchFlights(payload, log);
    case "search_esim_plans": return searchEsimPlans(payload, log);
    case "create_itinerary": return createItinerary(payload, log);
    case "get_supabase_catalog": return getSupabaseCatalog(payload, log);
    default: return { error: `unknown_tool:${name}` };
  }
}

function hotelsToCards(hotelResult) {
  return (hotelResult.hotels || []).map((h) => {
    const isMock = h.is_mock || h.source === "mock";
    return {
      type: "hotel",
      title: h.name,
      subtitle: `${h.city}${h.district ? ` · ${h.district}` : ""} · ${h.stars || 3}★`,
      detail: isMock
        ? NEEDS_CHECK_MSG
        : (h.description?.slice(0, 120) || NEEDS_CHECK_MSG),
      price: h.price_per_night ? `${Number(h.price_per_night).toLocaleString("mn-MN")}₮/шөнө` : "",
      badge: isMock ? null : "Баталгаажсан"
    };
  });
}

function flightsToCards(flightResult) {
  return (flightResult.flights || []).map((f) => ({
    type: "flight",
    title: f.airline,
    subtitle: `${f.from} → ${f.to}`,
    detail: `${f.depart || ""} – ${f.arrive || ""}`,
    price: f.price_mnt ? `${Number(f.price_mnt).toLocaleString("mn-MN")}₮` : "",
    badge: f.is_direct ? "Шууд" : "Дамжин"
  }));
}

function esimToCards(esimResult) {
  return (esimResult.plans || []).map((p) => ({
    type: "esim",
    title: p.name,
    subtitle: p.days,
    detail: p.data,
    price: p.price_mnt ? `${Number(p.price_mnt).toLocaleString("mn-MN")}₮` : "",
    badge: "eSIM"
  }));
}

function attractionsToCards(attractionResult) {
  return (attractionResult.attractions || []).map((a) => {
    const isMock = a.is_mock || a.source === "local_mock";
    return {
      type: "attraction",
      title: a.name,
      subtitle: `${a.city}${a.district ? ` · ${a.district}` : ""} · ${a.category_label_mn || a.category || ""}`,
      detail: isMock ? ATTRACTION_CHECK_MSG : (a.short_description?.slice(0, 120) || ATTRACTION_CHECK_MSG),
      price: a.estimated_price != null ? `${Number(a.estimated_price).toLocaleString("mn-MN")}₮` : "",
      badge: a.free_entry ? "Үнэгүй" : (a.family_friendly ? "Гэр бүлд" : null)
    };
  });
}

module.exports = {
  runTool,
  searchHotels,
  searchHotelsFull,
  searchAttractions,
  searchAttractionsFull,
  searchFlights,
  searchEsimPlans,
  createItinerary,
  getSupabaseCatalog,
  buildSearchCtx,
  buildSearchCtxFast,
  formToSearchParams,
  attractionFormToParams,
  hotelsToCards,
  attractionsToCards,
  flightsToCards,
  esimToCards,
  AI_DISPLAY_HOTELS,
  AI_DISPLAY_ATTRACTIONS
};
