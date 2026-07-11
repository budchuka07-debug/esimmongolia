/**
 * Travel search — flights, trains, attractions from esm_* tables.
 * Hotel search moved to travel-ai (action: search_hotels).
 * Always returns HTTP 200 with { success, error, ... }.
 */
const { getSupabase } = require("./lib/supabase-client");
const {
  mapFlight, mapTransport, mapAttraction,
  buildCityIndex, normalizeCityInput, countrySlug
} = require("./lib/travel-data-lib");

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };
}

function respond(body) {
  return {
    statusCode: 200,
    headers: { ...cors(), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

function ok(data) {
  return respond({ success: true, error: null, ...data });
}

function fail(error, data = {}) {
  return respond({ success: false, error: error || "unknown_error", results: [], meta: {}, ...data });
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

function resolveCitySlug(input, cityIdParam, aliasIndex) {
  if (cityIdParam) return cityIdParam;
  return normalizeCityInput(input, aliasIndex);
}

async function searchFlights(sb, params, ctx) {
  const fromSlug = resolveCitySlug(params.from, params.from_city_id, ctx.aliasIndex) || "ulanbaatar";
  const toSlug = resolveCitySlug(params.city, params.city_id, ctx.aliasIndex) || "shanghai";
  const fromRow = ctx.rawCities.find((c) => c.slug === fromSlug);
  const toRow = ctx.rawCities.find((c) => c.slug === toSlug);

  let q = sb.from("esm_flights").select("*").eq("active", true);
  if (fromRow) q = q.eq("from_city_id", fromRow.id);
  if (toRow) q = q.eq("to_city_id", toRow.id);

  const { data, error } = await q.limit(20);
  if (error) throw new Error(error.message);

  const results = await Promise.all((data || []).map(async (f) => {
    const fc = ctx.byUuid[f.from_city_id] || fromRow;
    const tc = ctx.byUuid[f.to_city_id] || toRow;
    const tr = f.transfer_city_id ? ctx.byUuid[f.transfer_city_id] : null;
    const fromC = fc || ctx.rawCities.find((c) => c.id === f.from_city_id);
    const toC = tc || ctx.rawCities.find((c) => c.id === f.to_city_id);
    const trC = tr || (f.transfer_city_id ? ctx.rawCities.find((c) => c.id === f.transfer_city_id) : null);
    return mapFlight(f, fromC, toC, trC);
  }));

  const hasDirect = results.some((r) => r.is_direct);
  const fromName = fromRow?.name_mn || fromSlug;
  const toName = toRow?.name_mn || toSlug;
  return {
    results,
    meta: {
      fromId: fromSlug,
      toId: toSlug,
      has_direct: hasDirect,
      no_direct_message: !hasDirect && results.length
        ? `${fromName} → ${toName}: шууд нислэг байхгүй — дамжин сонголтууд доор.`
        : null
    }
  };
}

async function searchTransport(sb, params, ctx) {
  const fromSlug = resolveCitySlug(params.from, params.from_city_id, ctx.aliasIndex) || "erenhot";
  const toSlug = resolveCitySlug(params.city, params.city_id, ctx.aliasIndex) || "beijing";
  const fromRow = ctx.rawCities.find((c) => c.slug === fromSlug);
  const toRow = ctx.rawCities.find((c) => c.slug === toSlug);

  let q = sb.from("esm_transport_routes").select("*").eq("active", true);
  if (fromRow) q = q.eq("from_city_id", fromRow.id);
  if (toRow) q = q.eq("to_city_id", toRow.id);

  const { data, error } = await q.limit(30);
  if (error) throw new Error(error.message);

  const results = (data || []).map((r) => {
    const fc = ctx.rawCities.find((c) => c.id === r.from_city_id);
    const tc = ctx.rawCities.find((c) => c.id === r.to_city_id);
    const tr = r.transfer_city_id ? ctx.rawCities.find((c) => c.id === r.transfer_city_id) : null;
    return mapTransport(r, fc, tc, tr);
  });

  return { results, meta: { fromId: fromSlug, toId: toSlug, routeKey: `${fromSlug}-${toSlug}` } };
}

async function searchAttractions(sb, params, ctx) {
  const citySlug = resolveCitySlug(params.city, params.city_id, ctx.aliasIndex) || "shanghai";
  const cityRow = ctx.rawCities.find((c) => c.slug === citySlug);
  if (!cityRow) return { results: [], meta: { cityId: citySlug } };

  const { data, error } = await sb.from("esm_attractions")
    .select("*")
    .eq("city_id", cityRow.id)
    .eq("active", true)
    .limit(20);
  if (error) throw new Error(error.message);

  const results = (data || []).map((a) => mapAttraction(a, cityRow));
  return { results, meta: { cityId: citySlug } };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors(), body: "" };
  if (event.httpMethod !== "GET") {
    return respond({ success: false, error: "method_not_allowed", results: [], meta: {} });
  }

  const params = event.queryStringParameters || {};
  const type = params.type || "hotel";

  if (type === "hotel") {
    return fail("hotel_search_moved", {
      results: [],
      meta: {
        hint: "Use POST /.netlify/functions/travel-ai with action=search_hotels",
        redirect: "/.netlify/functions/travel-ai"
      }
    });
  }

  const sb = getSupabase("travel-search");
  if (!sb) {
    return fail("supabase_not_configured", {
      results: [],
      meta: { source: "unavailable" }
    });
  }

  try {
    const ctx = await loadCityMaps(sb);
    let payload;

    if (type === "flight") payload = await searchFlights(sb, params, ctx);
    else if (type === "train" || type === "transport") payload = await searchTransport(sb, params, ctx);
    else if (type === "attraction") payload = await searchAttractions(sb, params, ctx);
    else return fail("unknown_type", { results: [], meta: {} });

    return ok(payload);
  } catch (err) {
    console.error("[travel-search]", err);
    return fail(err.message || "search_error", { results: [], meta: {} });
  }
};
