/**
 * Travel catalog — countries, cities, location search (esm_* tables)
 * GET /.netlify/functions/travel-catalog
 *   ?all=1           — full catalog for bootstrap
 *   ?q=shanghai      — location autocomplete
 *   ?districts=slug  — hotel districts for city
 */
const { getSupabase } = require("./lib/supabase-client");
const {
  mapCountry, mapCity, buildCityIndex, normalizeCityInput, countrySlug
} = require("./lib/travel-data-lib");
const { pickCover, FALLBACK } = require("./lib/travel-images");

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };
}

function json(status, body) {
  return { statusCode: status, headers: { ...cors(), "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

async function loadCatalog(sb) {
  const [{ data: countries }, { data: cities }] = await Promise.all([
    sb.from("esm_countries").select("*").eq("active", true).order("sort_order"),
    sb.from("esm_cities").select("*, esm_countries(iso_code, slug, flag_emoji, name_mn)").eq("active", true).order("sort_order")
  ]);

  const countryMap = {};
  (countries || []).forEach((c) => { countryMap[c.id] = c; });

  const mappedCountries = (countries || []).map(mapCountry);
  const mappedCities = (cities || []).map((c) => {
    const co = countryMap[c.country_id] || c.esm_countries;
    return mapCity(c, co);
  });

  return { countries: mappedCountries, cities: mappedCities, countryMap, rawCities: cities || [] };
}

function locationSearch(q, catalog, opts) {
  const { aliasIndex, bySlug } = buildCityIndex(catalog.cities);
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

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors(), body: "" };
  if (event.httpMethod !== "GET") return json(405, { error: "GET only" });

  const sb = getSupabase();
  if (!sb) return json(503, { error: "Supabase not configured", countries: [], cities: [] });

  const params = event.queryStringParameters || {};

  try {
    const catalog = await loadCatalog(sb);

    if (params.districts) {
      const citySlug = normalizeCityInput(params.districts, buildCityIndex(catalog.cities).aliasIndex) || params.districts;
      const city = catalog.cities.find((c) => c.id === citySlug);
      if (!city) return json(200, { districts: [], areas: [] });
      const { data: hotels } = await sb.from("esm_hotels")
        .select("district, area_name")
        .eq("city_id", city.uuid)
        .eq("active", true);
      const districts = [...new Set((hotels || []).map((h) => h.district).filter(Boolean))];
      const areas = [...new Set((hotels || []).map((h) => h.area_name).filter(Boolean))];
      return json(200, { districts, areas, city_id: citySlug });
    }

    if (params.q != null || params.search != null) {
      const list = locationSearch(params.q || params.search || "", catalog, {
        types: (params.types || "city,country,airport").split(","),
        country_id: params.country_id || null,
        limit: params.limit || 10,
        showMyLocation: params.my_location === "1"
      });
      return json(200, { results: list });
    }

    if (params.all === "1" || params.bootstrap === "1") {
      const cn = catalog.countries.find((c) => c.iso_code === "CN" || c.id === "china");
      const chinaCities = catalog.cities
        .filter((c) => c.country_id === "china" && c.popular)
        .map(async (c) => {
          const { data: atts } = await sb.from("esm_attractions")
            .select("name_mn")
            .eq("city_id", c.uuid)
            .eq("active", true)
            .limit(4);
          return {
            id: c.id,
            name: c.name_mn,
            cn: c.local || c.name_local || "",
            img: c.hero_image || pickCover({ cover_image_url: c.cover_image_url, hero_image: c.hero_image }, FALLBACK.city),
            attractions: (atts || []).map((a) => a.name_mn),
            transport: c.transport_mn || "",
            budget: c.budget_hint_mn || "",
            map: c.map_url || "#",
            route: c.route_url || `/china-route.html#${c.id}`,
            esim: "/?plan=CN"
          };
        });
      const chinaCards = await Promise.all(chinaCities);

      const destinations = catalog.countries
        .filter((c) => c.is_featured)
        .map((c) => ({
          code: c.iso_code,
          name: c.name_mn,
          flag: c.flag,
          img: c.cover_image || pickCover(c, FALLBACK.country),
          href: c.id === "china" ? "/china/" : `/${c.id}-route.html`
        }));

      return json(200, {
        countries: catalog.countries,
        cities: catalog.cities,
        destinations,
        chinaCities: chinaCards,
        source: "supabase"
      });
    }

    return json(200, { countries: catalog.countries, cities: catalog.cities });
  } catch (err) {
    console.error("[travel-catalog]", err);
    return json(500, { error: err.message || "catalog_error" });
  }
};
