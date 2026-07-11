/**
 * Server-side Asia catalog fallback — shared with frontend ASIA_DESTINATIONS.
 */
const asia = require("../../../data/asia-destinations.js");
const { buildCityIndex } = require("./travel-data-lib");

const ISO_BY_COUNTRY = {
  china: "CN", thailand: "TH", vietnam: "VN", japan: "JP", korea: "KR",
  singapore: "SG", malaysia: "MY", indonesia: "ID", philippines: "PH",
  taiwan: "TW", hongkong: "HK", macau: "MO", kazakhstan: "KZ", uzbekistan: "UZ",
  laos: "LA", cambodia: "KH", india: "IN", nepal: "NP", sri_lanka: "LK",
  maldives: "MV", uae: "AE", turkey: "TR"
};

function mapFallbackCountry(c) {
  return {
    id: c.id,
    uuid: `local-${c.id}`,
    iso_code: ISO_BY_COUNTRY[c.id] || c.id.toUpperCase().slice(0, 2),
    name_mn: c.name_mn,
    name_en: c.name_en,
    flag: c.flag,
    is_featured: ["china", "thailand", "japan", "korea", "singapore"].includes(c.id),
    active: true
  };
}

function mapFallbackCity(c) {
  return {
    id: c.id,
    uuid: `local-city-${c.id}`,
    slug: c.id,
    country_id: c.country_id,
    name_mn: c.name_mn,
    name_en: c.name_en,
    local: c.local || "",
    aliases: c.aliases || [],
    airport_codes: [],
    popular: ["beijing", "shanghai", "seoul", "tokyo", "bangkok"].includes(c.id),
    active: true
  };
}

function getFallbackCatalog() {
  const countries = asia.getCountries().map(mapFallbackCountry);
  const cities = asia.getCities().map(mapFallbackCity);
  const destinations = countries
    .filter((c) => c.is_featured)
    .map((c) => ({
      code: c.iso_code,
      name: c.name_mn,
      flag: c.flag,
      img: "/images/china/guide/route-asia.jpg",
      href: c.id === "china" ? "/china/" : `/marshrut.html?country=${c.id}`
    }));

  const chinaCities = cities
    .filter((c) => c.country_id === "china" && c.popular)
    .map((c) => ({
      id: c.id,
      name: c.name_mn,
      cn: c.local || "",
      img: "/images/routes/china/shanghai-bund.jpg",
      attractions: [],
      transport: "",
      budget: "",
      map: "#",
      route: `/china-route.html#${c.id}`,
      esim: "/?plan=CN"
    }));

  return { countries, cities, destinations, chinaCities, source: "local_fallback" };
}

function buildOfflineSearchCtx(citySlug) {
  const slug = citySlug || "shanghai";
  const city = asia.getCity(slug);
  if (!city) return null;

  const country = asia.getCountry(city.country_id);
  const cities = asia.getCities().map((c) => ({
    id: `local-city-${c.id}`,
    slug: c.id,
    name_mn: c.name_mn,
    name_en: c.name_en,
    name_local: c.local,
    country_id: `local-${c.country_id}`,
    aliases: c.aliases || []
  }));

  const countries = asia.getCountries().map((c) => ({
    id: `local-${c.id}`,
    slug: c.id,
    name_mn: c.name_mn,
    name_en: c.name_en,
    iso_code: ISO_BY_COUNTRY[c.id]
  }));

  const countryById = Object.fromEntries(countries.map((c) => [c.id, c]));
  const cityRow = cities.find((c) => c.slug === slug);
  const countryRow = countryById[`local-${city.country_id}`] || {
    id: `local-${city.country_id}`,
    slug: city.country_id,
    name_mn: country?.name_mn || city.country_id,
    name_en: country?.name_en || city.country_id
  };

  const mappedForIndex = cities.map((c) => ({
    id: c.slug,
    slug: c.slug,
    name_mn: c.name_mn,
    name_en: c.name_en,
    local: c.name_local,
    aliases: c.aliases
  }));
  const { aliasIndex } = buildCityIndex(mappedForIndex);

  return {
    rawCities: cities,
    countryById,
    aliasIndex,
    cityRow,
    countryRow,
    offline: true
  };
}

function resolveOfflineCitySlug(input, cityIdParam) {
  if (cityIdParam) return cityIdParam;
  return asia.normalizeCity(input) || null;
}

module.exports = {
  getFallbackCatalog,
  buildOfflineSearchCtx,
  resolveOfflineCitySlug,
  asia
};
