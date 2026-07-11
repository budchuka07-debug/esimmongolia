/**
 * Travel catalog — countries, cities, location search (esm_* tables)
 * GET /.netlify/functions/travel-catalog
 * Always returns HTTP 200 with { success, error, ... } — never 503.
 */
const { getSupabase } = require("./lib/supabase-client");
const {
  mapCountry, mapCity, buildCityIndex, normalizeCityInput
} = require("./lib/travel-data-lib");
const { pickCover, resolveGallery, FALLBACK, cdnUrl } = require("./lib/travel-images");
const { getFallbackCatalog } = require("./lib/asia-catalog-fallback");

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
  return respond({ success: false, error: error || "unknown_error", ...data });
}

async function loadCatalog(sb) {
  const [{ data: countries, error: cErr }, { data: cities, error: cityErr }] = await Promise.all([
    sb.from("esm_countries").select("*").eq("active", true).order("sort_order"),
    sb.from("esm_cities").select("*, esm_countries(iso_code, slug, flag_emoji, name_mn)").eq("active", true).order("sort_order")
  ]);

  if (cErr) throw new Error(cErr.message);
  if (cityErr) throw new Error(cityErr.message);

  const countryMap = {};
  (countries || []).forEach((c) => { countryMap[c.id] = c; });

  const mappedCountries = (countries || []).map(mapCountry);
  const mappedCities = (cities || []).map((c) => {
    const co = countryMap[c.country_id] || c.esm_countries;
    return mapCity(c, co);
  });

  return { countries: mappedCountries, cities: mappedCities, countryMap, rawCities: cities || [], source: "supabase" };
}

function locationSearch(q, catalog, opts) {
  const query = String(q || "").trim().toLowerCase();
  const limit = Number(opts.limit) || 10;
  const types = opts.types || ["city", "country", "airport"];
  const results = [];

  if (opts.showMyLocation && !query) {
    results.push({
      special: "my_location",
      flag: "📍",
      title: "Миний байршил",
      subtitle: "Ойролцоо хот санал болгох"
    });
  }

  if (types.includes("country")) {
    catalog.countries.forEach((c) => {
      if (opts.country_id && c.id !== opts.country_id) return;
      const hay = `${c.name_mn} ${c.name_en} ${c.id}`.toLowerCase();
      if (!query || hay.includes(query)) {
        results.push({
          type: "country",
          flag: c.flag,
          title: c.name_mn,
          subtitle: c.name_en,
          country_id: c.id
        });
      }
    });
  }

  catalog.cities.forEach((c) => {
    if (opts.country_id && c.country_id !== opts.country_id) return;
    const hay = `${c.name_mn} ${c.name_en} ${c.local} ${(c.aliases || []).join(" ")}`.toLowerCase();
    if (query && !hay.includes(query) && !c.id.includes(query)) return;

    if (types.includes("city")) {
      results.push({
        type: "city",
        flag: catalog.countries.find((x) => x.id === c.country_id)?.flag || "🏙",
        title: c.local ? `${c.name_mn} (${c.local})` : c.name_mn,
        subtitle: catalog.countries.find((x) => x.id === c.country_id)?.name_mn || "",
        city_id: c.id,
        country_id: c.country_id
      });
    }

    if (types.includes("airport")) {
      (c.airport_codes || []).forEach((code) => {
        if (query && !code.toLowerCase().includes(query) && !hay.includes(query)) return;
        results.push({
          type: "airport",
          flag: "✈️",
          title: `${code} — ${c.name_mn}`,
          subtitle: "Нисэх буудал",
          city_id: c.id,
          country_id: c.country_id,
          airport_code: code
        });
      });
    }
  });

  return results.slice(0, limit);
}

async function buildChinaCards(sb, catalog) {
  const chinaCities = catalog.cities
    .filter((c) => c.country_id === "china" && c.popular)
    .map(async (c) => {
      let attractions = [];
      if (sb && c.uuid && !String(c.uuid).startsWith("local-")) {
        const { data: atts } = await sb.from("attractions")
          .select("name, name_mn")
          .eq("city", c.id)
          .eq("active", true)
          .limit(4);
        attractions = (atts || []).map((a) => a.name_mn || a.name);
      }
      return {
        id: c.id,
        name: c.name_mn,
        cn: c.local || c.name_local || "",
        img: cdnUrl(c.hero_image || pickCover({ cover_image_url: c.cover_image_url, hero_image: c.hero_image }, FALLBACK.city), { size: "hero", fallback: FALLBACK.city }),
        attractions,
        transport: c.transport_mn || "",
        budget: c.budget_hint_mn || "",
        map: c.map_url || "#",
        route: c.route_url || `/china-route.html#${c.id}`,
        esim: "/?plan=CN"
      };
    });
  return Promise.all(chinaCities);
}

async function handleWithCatalog(catalog, sb, params) {
  if (params.districts) {
    const citySlug = normalizeCityInput(params.districts, buildCityIndex(catalog.cities).aliasIndex) || params.districts;
    const city = catalog.cities.find((c) => c.id === citySlug);
    if (!city) return ok({ districts: [], areas: [], city_id: citySlug });

    let districts = [];
    let areas = [];
    if (sb && city.uuid && !String(city.uuid).startsWith("local-")) {
      const { data: hotels } = await sb.from("esm_hotels")
        .select("district, area_name")
        .eq("city_id", city.uuid)
        .eq("active", true);
      districts = [...new Set((hotels || []).map((h) => h.district).filter(Boolean))];
      areas = [...new Set((hotels || []).map((h) => h.area_name).filter(Boolean))];
    }
    return ok({ districts, areas, city_id: citySlug });
  }

  if (params.q != null || params.search != null) {
    const list = locationSearch(params.q || params.search || "", catalog, {
      types: (params.types || "city,country,airport").split(","),
      country_id: params.country_id || null,
      limit: params.limit || 10,
      showMyLocation: params.my_location === "1"
    });
    return ok({ results: list, source: catalog.source });
  }

  if (params.all === "1" || params.bootstrap === "1") {
    const chinaCards = await buildChinaCards(sb, catalog);
    const destinations = catalog.countries
      .filter((c) => c.is_featured)
      .map((c) => ({
        code: c.iso_code,
        name: c.name_mn,
        flag: c.flag,
        img: cdnUrl(c.cover_image || pickCover(c, FALLBACK.country), { size: "card", fallback: FALLBACK.country }),
        href: c.id === "china" ? "/china/" : `/${c.id}-route.html`
      }));

    return ok({
      countries: catalog.countries,
      cities: catalog.cities,
      destinations,
      chinaCities: chinaCards,
      source: catalog.source
    });
  }

  return ok({ countries: catalog.countries, cities: catalog.cities, source: catalog.source });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors(), body: "" };
  if (event.httpMethod !== "GET") {
    return respond({ success: false, error: "method_not_allowed", countries: [], cities: [] });
  }

  const params = event.queryStringParameters || {};
  const sb = getSupabase("travel-catalog");

  if (!sb) {
    console.warn("[travel-catalog] Supabase unavailable — using local fallback");
    const fallback = getFallbackCatalog();
    return handleWithCatalog({ ...fallback, source: "local_fallback" }, null, params);
  }

  try {
    const catalog = await loadCatalog(sb);
    return handleWithCatalog(catalog, sb, params);
  } catch (err) {
    console.error("[travel-catalog]", err.message || err);
    const fallback = getFallbackCatalog();
    const body = await handleWithCatalog({ ...fallback, source: "local_fallback" }, null, params);
    const parsed = JSON.parse(body.body);
    return respond({ ...parsed, warning: err.message || "supabase_error" });
  }
};
