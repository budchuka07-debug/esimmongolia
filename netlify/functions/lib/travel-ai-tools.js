/**
 * Travel AI tool handlers — Supabase + hybrid mock + catalog.
 */
const { getSupabase } = require("./supabase-client");
const { buildCityIndex, normalizeCityInput, countrySlug, mapFlight } = require("./travel-data-lib");
const { hybridHotelSearch, sortHotels } = require("./hotel-search-lib");
const consultant = require("./ai-consultant");
const { getChinaPlans } = require("../china-plans");

const AI_MIN_HOTELS = 20;
const AI_DISPLAY_HOTELS = 5;

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
  const isMock = h.is_mock || h.source === "ai_mock";
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
    availability_status: isMock ? "check_on_request" : (h.availability_status || "check_on_request")
  };
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
    minTarget: AI_MIN_HOTELS,
    page: 1,
    pageSize: AI_MIN_HOTELS,
    sort: intent.wants_cheaper ? "price_asc" : "recommended"
  };
  if (intent.facilities?.includes("metro_nearby")) params.nearMetro = "1";
  if (intent.facilities?.includes("breakfast")) params.breakfast = "1";
  if (intent.facilities?.includes("near_attraction")) params.nearAttraction = "1";
  if (intent.wants_disney && !params.district) params.district = "Disneyland";
  return params;
}

async function searchHotels(intent, log) {
  const sb = getSupabase("travel-ai");
  if (!sb) {
    return { hotels: [], supabase_count: 0, mock_count: 0, error: "supabase_not_configured" };
  }

  const ctx = await loadCityMaps(sb);
  const citySlug = intent.city_id || normalizeCityInput(intent.city, ctx.aliasIndex);
  if (!citySlug) return { hotels: [], supabase_count: 0, mock_count: 0, error: "city_not_found" };

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
  if (!sb) return { flights: [], error: "supabase_not_configured" };

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
  return { flights, from: "Улаанбаатар", to: intent.city || toSlug };
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
  if (!sb) return { countries: [], cities: [], error: "supabase_not_configured" };

  const [{ data: countries }, { data: cities }] = await Promise.all([
    sb.from("esm_countries").select("slug, name_mn, name_en, iso_code").eq("active", true).order("sort_order"),
    sb.from("esm_cities").select("slug, name_mn, name_en, country_id").eq("active", true).order("sort_order").limit(120)
  ]);

  log.tool = "get_supabase_catalog";
  log.catalog_countries = (countries || []).length;
  log.catalog_cities = (cities || []).length;

  return {
    countries: (countries || []).map((c) => ({ id: c.slug || countrySlug(c), name: c.name_mn, iso: c.iso_code })),
    cities: (cities || []).map((c) => ({ id: c.slug, name: c.name_mn, name_en: c.name_en }))
  };
}

async function runTool(name, args, intent, log) {
  const payload = { ...intent, ...(args || {}) };
  switch (name) {
    case "search_hotels": return searchHotels(payload, log);
    case "search_flights": return searchFlights(payload, log);
    case "search_esim_plans": return searchEsimPlans(payload, log);
    case "create_itinerary": return createItinerary(payload, log);
    case "get_supabase_catalog": return getSupabaseCatalog(payload, log);
    default: return { error: `unknown_tool:${name}` };
  }
}

function hotelsToCards(hotelResult) {
  return (hotelResult.hotels || []).map((h) => ({
    type: "hotel",
    title: h.name,
    subtitle: `${h.city}${h.district ? ` · ${h.district}` : ""} · ${h.stars || 3}★`,
    detail: h.description?.slice(0, 120) || "Үнэ болон өрөөний боломж захиалга баталгаажуулах үед шалгагдана.",
    price: h.price_per_night ? `${Number(h.price_per_night).toLocaleString("mn-MN")}₮/шөнө` : "",
    badge: h.source === "supabase" ? "Баталгаажсан" : null
  }));
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

module.exports = {
  runTool,
  searchHotels,
  searchFlights,
  searchEsimPlans,
  createItinerary,
  getSupabaseCatalog,
  hotelsToCards,
  flightsToCards,
  esimToCards,
  AI_DISPLAY_HOTELS
};
