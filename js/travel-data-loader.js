/**
 * Travel data bootstrap — local Asia catalog + travel-ai for hotel search.
 * Frontend does NOT call travel-catalog directly.
 */
(function (root) {
  const TRAVEL_AI_URL = "/.netlify/functions/travel-ai";
  const SEARCH_URL = "/.netlify/functions/travel-search";

  async function parseJsonResponse(res) {
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text().catch(() => "");
      console.error("[TravelSearch] non-JSON response", res.status, text.slice(0, 200));
      return { success: false, error: "non_json_response", status: res.status };
    }
    try {
      return await res.json();
    } catch (err) {
      console.error("[TravelSearch] JSON parse failed", err);
      return { success: false, error: "invalid_json" };
    }
  }

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

  async function bootstrap() {
    mergeAsiaFallback();
    rebuildIndex();
    return {
      countries,
      cities,
      destinations: buildLocalDestinations(),
      chinaCities: buildLocalChinaCities()
    };
  }

  function buildLocalDestinations() {
    const featured = ["china", "thailand", "japan", "korea", "singapore"];
    return countries
      .filter((c) => featured.includes(c.id))
      .map((c) => ({
        code: c.iso_code || c.id?.toUpperCase()?.slice(0, 2),
        name: c.name_mn,
        flag: c.flag,
        img: "/images/china/guide/route-asia.jpg",
        href: c.id === "china" ? "/china/" : `/marshrut.html?country=${c.id}`
      }));
  }

  function buildLocalChinaCities() {
    return cities
      .filter((c) => c.country_id === "china")
      .slice(0, 8)
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
  }
  let dataSource = "local_fallback";

  function mergeAsiaFallback() {
    const asia = root.ASIA_DESTINATIONS;
    if (!asia) return;
    countries = asia.getCountries();
    cities = asia.getCities();
    dataSource = "local_fallback";
  }

  root.TravelCatalog = {
    countries: () => countries,
    cities: () => cities,
    hotelCountries: () => {
      const ids = root.ASIA_DESTINATIONS?.HOTEL_COUNTRY_IDS || [];
      const byId = Object.fromEntries(countries.map((c) => [c.id, c]));
      return ids.map((id) => byId[id]).filter(Boolean);
    },
    citiesByCountry: (countryId) => {
      const asia = root.ASIA_DESTINATIONS;
      const order = asia?.COUNTRY_DEFS?.find((c) => c.id === countryId)?.cityIds;
      const remote = cities.filter((c) => c.country_id === countryId);
      if (order?.length) {
        const remoteById = Object.fromEntries(remote.map((c) => [c.id, c]));
        return order.map((id) => remoteById[id] || asia?.getCity(id)).filter(Boolean);
      }
      return remote.length ? remote : (asia?.getCitiesByCountry(countryId) || []);
    },
    getDataSource: () => dataSource,
    ready: bootstrap().catch((err) => {
      console.error("[TravelCatalog]", err);
      mergeAsiaFallback();
      rebuildIndex();
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
    async fetchDistricts() {
      return [];
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
    if (type === "hotel") {
      try {
        const res = await fetch(TRAVEL_AI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "search_hotels", ...(formData || {}) })
        });
        const data = await parseJsonResponse(res);
        if (!res.ok || data.success === false) {
          return {
            results: [],
            meta: {
              error: data.error || (res.ok ? "hotel_search_failed" : `http_${res.status}`),
              real_count: data.real_count ?? 0,
              mock_count: data.mock_count ?? 0,
              source: data.source || "error",
              ...(data.meta || {})
            }
          };
        }
        const raw = data.hotels || data.results || [];
        const results = raw.map((item) => {
          if (item.final_price_mnt != null && item.final_price_mnt > 0) return item;
          if (item.price_per_night != null && item.price_per_night > 0) {
            return { ...item, final_price_mnt: item.price_per_night };
          }
          return root.TRAVEL_DATA.priceItem(item);
        });
        return {
          results,
          meta: {
            ...(data.meta || {}),
            source: data.source || data.meta?.source || "travel-ai",
            real_count: data.real_count ?? data.meta?.real_count ?? 0,
            mock_count: data.mock_count ?? data.meta?.mock_count ?? 0,
            supabase_count: data.real_count ?? data.meta?.supabase_count ?? 0
          }
        };
      } catch (err) {
        console.error("[TravelSearch] hotel via travel-ai failed", err);
        return { results: [], meta: { error: "hotel_search_error" } };
      }
    }

    const params = new URLSearchParams({ type });
    Object.entries(formData || {}).forEach(([k, v]) => {
      if (v != null && v !== "") params.set(k, v);
    });
    const res = await fetch(`${SEARCH_URL}?${params}`);
    const data = await parseJsonResponse(res);
    if (!res.ok || data.success === false) {
      return {
        results: [],
        meta: { error: data.error || `http_${res.status}`, ...(data.meta || {}) }
      };
    }
    const results = (data.results || []).map((item) => {
      if (item.final_price_mnt != null && item.final_price_mnt > 0) return item;
      return root.TRAVEL_DATA.priceItem(item);
    });
    return { results, meta: data.meta || {} };
  }

  root.TravelSearch = { apiSearch };
})(typeof window !== "undefined" ? window : globalThis);
