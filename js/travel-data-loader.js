/**
 * Travel data bootstrap — Supabase only (esm_* tables via Netlify BFF)
 */
(function (root) {
  const CATALOG_URL = "/.netlify/functions/travel-catalog?all=1";
  const SEARCH_URL = "/.netlify/functions/travel-search";

  let countries = [];
  let cities = [];
  let cityById = {};
  let countryById = {};
  let aliasIndex = {};

  const SERVICES = [
    { id: "ai", icon: "🤖", title: "AI зөвлөх", desc: "Чат үнэгүй — form шаардлагагүй", img: "/images/china/guide/internet.jpg", action: "ai_chat" },
    { id: "flight", icon: "✈️", title: "Нислэг шалгах", desc: "Хямд нислэг хайх, захиалгын хүсэлт", img: "/images/routes/china/shanghai-bund.jpg", tab: "flight" },
    { id: "hotel", icon: "🏨", title: "Буудал хайх", desc: "Буудал, байршил, үнэ", img: "/images/hotels/exterior-01.jpg", tab: "hotel" },
    { id: "train", icon: "🚄", title: "Галт тэрэг / Автобус", desc: "12306, автобус", img: "/images/china/guide/transport-hsr.jpg", tab: "train" },
    { id: "attraction", icon: "🎫", title: "Үзвэр үйлчилгээ", desc: "Disneyland, музей, тур", img: "/images/routes/china/panda.jpg", tab: "attraction" },
    { id: "esim", icon: "📶", title: "eSIM", desc: "Хятад, Ази, Global дата", img: "/images/china/guide/internet.jpg", anchor: "#esim" },
    { id: "visa", icon: "🛂", title: "Визийн мэдээлэл", desc: "Материал, элчин сайд", img: "/images/china/guide/route-asia.jpg", tab: "visa" },
    { id: "route", icon: "🗺️", title: "Аяллын маршрут", desc: "Хот, маршрут, зөвлөгөө", img: "/images/china/guide/routes-all.jpg", href: "/marshrut.html" }
  ];

  function rebuildIndex() {
    cityById = {};
    countryById = {};
    aliasIndex = {};
    countries.forEach((c) => { countryById[c.id] = c; });
    cities.forEach((c) => {
      cityById[c.id] = c;
      const keys = new Set([c.id, c.slug, c.name_mn, c.name_en, c.local, ...(c.aliases || [])]);
      keys.forEach((k) => {
        const norm = String(k || "").trim().toLowerCase().replace(/[''`]/g, "").replace(/\s+/g, " ");
        if (norm) aliasIndex[norm] = c.id;
      });
    });
  }

  function normalizeKey(s) {
    return String(s || "").trim().toLowerCase().replace(/[''`]/g, "").replace(/\s+/g, " ");
  }

  const FALLBACK_ALIASES = {
    "улаанбаатар": "ulanbaatar", ulanbaatar: "ulanbaatar", ub: "ulanbaatar",
    "шанхай": "shanghai", shanghai: "shanghai",
    "бээжин": "beijing", beijing: "beijing", "北京": "beijing",
    "эрээн": "erenhot", erenhot: "erenhot", erlian: "erenhot",
    "хөх хот": "hohhot", hohhot: "hohhot",
    "гуанжоу": "guangzhou", guangzhou: "guangzhou",
    "бангкок": "bangkok", bangkok: "bangkok",
    "сөүл": "seoul", seoul: "seoul", "сеул": "seoul",
    "пусан": "busan", busan: "busan",
    "токио": "tokyo", tokyo: "tokyo",
    "осака": "osaka", osaka: "osaka",
    "сингапур": "singapore", singapore: "singapore",
    "дубай": "dubai", dubai: "dubai",
    "истанбул": "istanbul", istanbul: "istanbul",
    "ханой": "hanoi", hanoi: "hanoi",
    "хошимин": "ho_chi_minh", "хонконг": "hong_kong", hong_kong: "hong_kong"
  };

  function normalizeCity(input) {
    const key = normalizeKey(input);
    if (!key) return null;
    if (aliasIndex[key]) return aliasIndex[key];
    if (FALLBACK_ALIASES[key]) return FALLBACK_ALIASES[key];
    const partial = Object.entries(aliasIndex).find(([alias]) =>
      key.length >= 3 && (key.includes(alias) || alias.includes(key))
    );
    return partial ? partial[1] : null;
  }

  function normalizeCountry(input) {
    const key = normalizeKey(input);
    if (!key) return null;
    const hit = countries.find((c) =>
      [c.id, c.name_mn, c.name_en, c.iso_code?.toLowerCase()].some((n) => normalizeKey(n) === key)
    );
    return hit?.id || null;
  }

  async function fetchCatalog() {
    const res = await fetch(CATALOG_URL);
    if (!res.ok) throw new Error("catalog_http_" + res.status);
    return res.json();
  }

  async function bootstrap() {
    const data = await fetchCatalog();
    countries = data.countries || [];
    cities = data.cities || [];
    rebuildIndex();
    return data;
  }

  root.TravelCatalog = {
    countries: () => countries,
    cities: () => cities,
    ready: bootstrap().catch((err) => {
      console.error("[TravelCatalog]", err);
      return { countries: [], cities: [], destinations: [], chinaCities: [] };
    }),
    searchLocations(q, opts) {
      const query = normalizeKey(q);
      const limit = opts?.limit || 10;
      const types = opts?.types || ["city", "country", "airport"];
      const results = [];
      if (types.includes("country")) {
        countries.forEach((c) => {
          if (opts?.country_id && c.id !== opts.country_id) return;
          const hay = `${c.name_mn} ${c.name_en}`.toLowerCase();
          if (!query || hay.includes(query)) {
            results.push({ type: "country", flag: c.flag, title: c.name_mn, subtitle: c.name_en, country_id: c.id });
          }
        });
      }
      cities.forEach((c) => {
        if (opts?.country_id && c.country_id !== opts.country_id) return;
        const hay = `${c.name_mn} ${c.name_en} ${c.local} ${(c.aliases || []).join(" ")}`.toLowerCase();
        if (query && !hay.includes(query) && !c.id.includes(query)) return;
        if (types.includes("city")) {
          results.push({
            type: "city",
            flag: countryById[c.country_id]?.flag || "🏙",
            title: c.local ? `${c.name_mn} (${c.local})` : c.name_mn,
            subtitle: countryById[c.country_id]?.name_mn || "",
            city_id: c.id,
            country_id: c.country_id
          });
        }
        if (types.includes("airport")) {
          (c.airport_codes || []).forEach((code) => {
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
    },
    async fetchDistricts(citySlug) {
      const res = await fetch(`/.netlify/functions/travel-catalog?districts=${encodeURIComponent(citySlug)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.districts || [];
    }
  };

  root.TRAVEL_CITIES = {
    normalizeCity,
    normalizeCountry,
    getCity: (id) => cityById[id] || null,
    getCountry: (id) => countryById[id] || null,
    getCityLabel: (id) => {
      const c = cityById[id];
      return c?.local ? `${c.name_mn} (${c.local})` : (c?.name_mn || id || "");
    },
    getCityLabelMn: (id) => cityById[id]?.name_mn || String(id || ""),
    getCitiesByCountry: (countryId) => cities.filter((c) => c.country_id === countryId),
    cityMapUrl: (cityId) => {
      const c = cityById[cityId];
      return c?.map_url || `https://www.google.com/maps/search/${encodeURIComponent(c?.name_en || cityId)}`;
    },
    COUNTRIES: countryById,
    CITIES: cityById
  };

  root.LOCATION_ENGINE = {
    init() { /* catalog loaded via TravelCatalog.ready */ },
    search(q, opts) {
      return root.TravelCatalog.searchLocations(q, opts);
    },
    getCity(id) {
      return cityById[id];
    },
    resolve(input, opts) {
      const text = String(input || "").trim();
      if (!text) return null;
      const direct = normalizeCity(text);
      if (direct) return direct;
      const hits = root.TravelCatalog.searchLocations(text, { ...(opts || {}), limit: 1 });
      const hit = hits[0];
      if (hit?.city_id) return hit.city_id;
      if (hit?.type === "country" && hit.country_id) return hit.country_id;
      return null;
    }
  };

  const pricing = {
    defaultMarkupPercent: 15,
    exchangeRateCny: 540,
    exchangeRates: { CNY: 540, USD: 3680, THB: 110, VND: 0.21, JPY: 24, KRW: 2.7 }
  };

  root.TRAVEL_DATA = {
    destinations: [],
    chinaCities: [],
    services: SERVICES,
    pricing,
    initChinaCities() { return root.TRAVEL_DATA.chinaCities; },
    calcFinalPriceMnt(item) {
      const currency = item.currency || "CNY";
      const rate = Number(pricing.exchangeRates[currency] || pricing.exchangeRateCny || 540);
      const orig = Number(item.original_price || item.supplier_price || 0);
      const markupPct = pricing.defaultMarkupPercent / 100;
      const baseMnt = orig * rate * (1 + markupPct);
      return { final_price_mnt: Math.round(baseMnt / 100) * 100 };
    },
    priceItem(item) {
      const calc = root.TRAVEL_DATA.calcFinalPriceMnt(item);
      const out = { ...item, final_price_mnt: item.final_price_mnt ?? calc.final_price_mnt };
      delete out.supplier_reference;
      delete out.internal_supplier_reference;
      return out;
    },
    rateFootnote() {
      return "Төлөх эцсийн үнэ (₮)";
    },
    async loadDailyRates() {
      try {
        const res = await fetch("/.netlify/functions/exchange-rates");
        if (!res.ok) return false;
        const data = await res.json();
        if (data.rates) {
          Object.assign(pricing.exchangeRates, data.rates);
          if (data.rates.CNY) pricing.exchangeRateCny = data.rates.CNY;
        }
        return true;
      } catch {
        return false;
      }
    },
    applyDailyRates(payload) {
      if (!payload?.rates) return false;
      Object.assign(pricing.exchangeRates, payload.rates);
      if (payload.rates.CNY) pricing.exchangeRateCny = payload.rates.CNY;
      return true;
    }
  };

  root.TravelCatalog.ready.then((data) => {
    root.TRAVEL_DATA.destinations = data.destinations || [];
    root.TRAVEL_DATA.chinaCities = data.chinaCities || [];
    root.TRAVEL_CITIES.COUNTRIES = countryById;
    root.TRAVEL_CITIES.CITIES = cityById;
  });

  async function apiSearch(type, formData) {
    const params = new URLSearchParams({ type });
    Object.entries(formData || {}).forEach(([k, v]) => {
      if (v != null && v !== "") params.set(k, v);
    });
    const res = await fetch(`${SEARCH_URL}?${params}`);
    if (!res.ok) return { results: [], meta: { error: "api_error" } };
    const data = await res.json();
    const results = (data.results || []).map((item) => {
      if (item.final_price_mnt != null && item.final_price_mnt > 0) return item;
      return root.TRAVEL_DATA.priceItem(item);
    });
    return { results, meta: data.meta || {} };
  }

  root.TravelSearch = { apiSearch };
})(typeof window !== "undefined" ? window : globalThis);
