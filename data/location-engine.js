/**
 * Global location search engine — Trip.com / Google Flights style.
 * Search by city_id; supports lazy chunks for 100k+ scale.
 */
(function (root) {
  const norm = (s) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[''`]/g, "")
      .replace(/\s+/g, " ");

  const cities = new Map();
  const countries = new Map();
  const airports = new Map();
  const tokenIndex = new Map();
  const chunksLoaded = new Set();

  function addToken(token, ref) {
    const t = norm(token);
    if (!t || t.length < 1) return;
    if (!tokenIndex.has(t)) tokenIndex.set(t, new Set());
    tokenIndex.get(t).add(ref);
    if (t.length >= 2) {
      for (let i = 0; i < t.length - 1; i++) {
        const bi = t.slice(i, i + 2);
        if (!tokenIndex.has(bi)) tokenIndex.set(bi, new Set());
        tokenIndex.get(bi).add(ref);
      }
    }
  }

  function indexRef(ref, tokens) {
    tokens.forEach((tok) => addToken(tok, ref));
  }

  function countryFlag(countryId) {
    const reg = root.COUNTRIES_REGISTRY?.get?.(countryId);
    if (reg?.flag) return reg.flag;
    const tc = root.TRAVEL_CITIES?.getCountry?.(countryId);
    return tc?.flag || "🏳️";
  }

  function countryNames(countryId) {
    const reg = root.COUNTRIES_REGISTRY?.get?.(countryId);
    const tc = root.TRAVEL_CITIES?.getCountry?.(countryId);
    return {
      name_mn: reg?.name_mn || tc?.name_mn || countryId,
      name_en: reg?.name_en || tc?.name_en || countryId
    };
  }

  function upsertCity(row) {
    if (!row?.city_id) return;
    const existing = cities.get(row.city_id) || {};
    const merged = {
      city_id: row.city_id,
      country_id: row.country_id || existing.country_id,
      name_mn: row.name_mn || existing.name_mn,
      name_en: row.name_en || existing.name_en,
      name_local: row.name_local || row.local || existing.name_local || "",
      aliases: [...new Set([...(existing.aliases || []), ...(row.aliases || [])])],
      airport_codes: [...new Set([...(existing.airport_codes || []), ...(row.airport_codes || [])])],
      railway_station_names: [...new Set([...(existing.railway_station_names || []), ...(row.railway_station_names || [])])]
    };
    const iataAliases = merged.aliases
      .map((a) => String(a).trim().toUpperCase())
      .filter((a) => /^[A-Z]{3}$/.test(a));
    merged.airport_codes = [...new Set([...merged.airport_codes, ...iataAliases])];
    cities.set(row.city_id, merged);

    const cn = countryNames(merged.country_id);
    const ref = `city:${merged.city_id}`;
    indexRef(ref, [
      merged.city_id,
      merged.name_mn,
      merged.name_en,
      merged.name_local,
      ...merged.aliases,
      ...merged.airport_codes,
      ...merged.railway_station_names
    ]);

    (merged.airport_codes || []).forEach((code) => {
      if (!code || code.length !== 3) return;
      registerAirport({
        airport_code: code.toUpperCase(),
        city_id: merged.city_id,
        country_id: merged.country_id,
        name_en: `${merged.name_en} (${code})`,
        name_mn: `${merged.name_mn} (${code})`
      });
    });
  }

  function upsertCountry(row) {
    if (!row?.country_id) return;
    countries.set(row.country_id, row);
    const ref = `country:${row.country_id}`;
    indexRef(ref, [row.country_id, row.name_mn, row.name_en, row.name_local, ...(row.aliases || [])]);
  }

  function registerAirport(ap) {
    const code = String(ap.airport_code || ap.code || "").toUpperCase();
    if (!code) return;
    airports.set(code, { ...ap, airport_code: code });
    const ref = `airport:${code}`;
    indexRef(ref, [code, ap.name_en, ap.name_mn, ap.city_id, ...(ap.aliases || [])]);
  }

  function ingestTravelCities() {
    const tc = root.TRAVEL_CITIES;
    if (!tc?.CITIES) return;
    Object.values(tc.CITIES).forEach((c) => {
      upsertCity({
        city_id: c.id,
        country_id: c.country_id,
        name_mn: c.name_mn,
        name_en: c.name_en,
        name_local: c.local,
        aliases: c.aliases || []
      });
    });
    Object.values(tc.COUNTRIES || {}).forEach((c) => {
      upsertCountry({
        country_id: c.id,
        name_mn: c.name_mn,
        name_en: c.name_en,
        name_local: c.name_en,
        flag: c.flag,
        aliases: [c.id, c.name_mn, c.name_en]
      });
    });
  }

  function ingestChinaDestinations() {
    const cd = root.CHINA_DESTINATIONS;
    if (!cd?.getCity) return;
    const ids = [...(cd.TIER1 || []), ...(cd.TIER2 || [])];
    ids.forEach((id) => {
      const p = cd.getCity(id);
      if (!p) return;
      const apCodes = [];
      if (p.airport?.primary) apCodes.push(p.airport.primary);
      if (p.airport?.secondary) apCodes.push(p.airport.secondary);
      upsertCity({
        city_id: p.city_id || id,
        country_id: p.country_id || "china",
        name_mn: p.name_mn,
        name_en: p.name_en,
        name_local: p.name_zh,
        aliases: cd.aliasesForCity?.(id) || [],
        airport_codes: apCodes,
        railway_station_names: p.railway_station || []
      });
      if (p.airport?.primary) {
        registerAirport({
          airport_code: p.airport.primary,
          city_id: p.city_id || id,
          country_id: "china",
          name_en: p.airport.name || `${p.name_en} Airport`,
          name_mn: `${p.name_mn} нисэх буудал`
        });
      }
      if (p.airport?.secondary) {
        const sec = p.airport.secondary;
        const secName = sec === "PKX" ? "Beijing Daxing International Airport"
          : sec === "SHA" ? "Shanghai Hongqiao Airport"
          : `${p.name_en} (${sec})`;
        registerAirport({
          airport_code: sec,
          city_id: p.city_id || id,
          country_id: "china",
          name_en: secName,
          name_mn: `${p.name_mn} (${sec})`
        });
      }
    });
  }

  function ingestWorldSeed() {
    const seed = root.LOCATIONS_WORLD_SEED?.getCities?.() || [];
    seed.forEach(upsertCity);
  }

  function ingestCountriesRegistry() {
    (root.COUNTRIES_REGISTRY?.list?.() || []).forEach(upsertCountry);
  }

  function loadChunk(payload, tag) {
    if (tag) chunksLoaded.add(tag);
    if (Array.isArray(payload?.cities)) payload.cities.forEach(upsertCity);
    if (Array.isArray(payload?.countries)) payload.countries.forEach(upsertCountry);
    if (Array.isArray(payload?.airports)) payload.airports.forEach(registerAirport);
    if (typeof payload === "string") {
      root.LOCATIONS_WORLD_SEED?.parseLines?.(payload.split("\n"))?.forEach(upsertCity);
    }
    return { cities: cities.size, countries: countries.size, airports: airports.size };
  }

  async function loadChunkUrl(url, tag) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Chunk load failed: ${url}`);
    const data = await res.json();
    return loadChunk(data, tag || url);
  }

  function scoreMatch(query, text, kind) {
    const q = norm(query);
    const t = norm(text);
    if (!q || !t) return 0;
    if (t === q) return kind === "iata" ? 120 : 100;
    if (t.startsWith(q)) return 80;
    if (q.length >= 3 && t.includes(q)) return 55;
    if (q.length >= 2 && t.includes(q)) return 40;
    return 0;
  }

  function buildResult(type, payload, score, query) {
    const countryId = payload.country_id;
    const cn = countryNames(countryId);
    const flag = countryFlag(countryId);
    let title = "";
    let subtitle = "";
    let airportCode = "";
    let cityId = payload.city_id || null;

    if (type === "country") {
      title = payload.name_mn || payload.name_en;
      subtitle = payload.name_en;
    } else if (type === "city") {
      title = payload.name_mn || payload.name_en;
      subtitle = cn.name_en;
      airportCode = (payload.airport_codes || [])[0] || "";
    } else if (type === "airport") {
      cityId = payload.city_id;
      airportCode = payload.airport_code;
      const city = cities.get(cityId);
      title = payload.name_mn || payload.name_en || airportCode;
      subtitle = city ? `${city.name_en}, ${cn.name_en}` : cn.name_en;
    } else if (type === "district" || type === "landmark") {
      title = payload.name;
      subtitle = payload.district || payload.city_label || "";
      cityId = payload.city_id;
    }

    return {
      type,
      city_id: cityId,
      country_id: countryId,
      airport_code: airportCode,
      flag,
      title,
      subtitle,
      label: type === "country" ? `${flag} ${title}` : `${flag} ${title}${airportCode ? " · " + airportCode : ""}`,
      score,
      raw: payload
    };
  }

  function search(query, opts) {
    const q = String(query || "").trim();
    const options = opts || {};
    const limit = options.limit ?? 12;
    const types = options.types || ["city", "country", "airport", "district", "landmark"];
    const countryFilter = options.country_id || options.countryId || null;
    const cityContext = options.city_id || options.cityId || null;

    if (!q && options.includeDefaults) {
      const defs = [];
      if (options.defaultCityId && cities.has(options.defaultCityId)) {
        defs.push(buildResult("city", cities.get(options.defaultCityId), 100, ""));
      }
      if (options.showMyLocation) {
        defs.push({
          type: "special",
          special: "my_location",
          flag: "📍",
          title: "Миний байршил",
          subtitle: "GPS (coming soon) — одоогоор Улаанбаатар",
          city_id: "ulanbaatar",
          country_id: "mongolia",
          label: "📍 Миний байршил",
          score: 200
        });
      }
      return defs.slice(0, limit);
    }

    if (!q) return [];

    if (cityContext && types.some((t) => t === "district" || t === "landmark")) {
      const areaResults = searchAreas(cityContext, q, limit);
      if (areaResults.length) return areaResults;
    }

    const qn = norm(q);
    const hits = new Map();

    function consider(ref, baseScore) {
      if (!ref || baseScore <= 0) return;
      const prev = hits.get(ref) || 0;
      if (baseScore > prev) hits.set(ref, baseScore);
    }

    tokenIndex.forEach((refs, token) => {
      if (token.includes(qn) || qn.includes(token)) {
        refs.forEach((ref) => consider(ref, scoreMatch(q, token, ref.startsWith("airport:") ? "iata" : "text")));
      }
    });

    if (qn.length === 3 && airports.has(q.toUpperCase())) {
      consider(`airport:${q.toUpperCase()}`, 120);
    }

    const results = [];

    hits.forEach((score, ref) => {
      const [kind, id] = ref.split(":");
      if (kind === "city" && types.includes("city")) {
        const c = cities.get(id);
        if (!c) return;
        if (countryFilter && c.country_id !== countryFilter) return;
        results.push(buildResult("city", c, score, q));
      } else if (kind === "country" && types.includes("country")) {
        const c = countries.get(id);
        if (c) results.push(buildResult("country", c, score, q));
      } else if (kind === "airport" && types.includes("airport")) {
        const a = airports.get(id);
        if (!a) return;
        if (countryFilter && a.country_id !== countryFilter) return;
        results.push(buildResult("airport", a, score, q));
      }
    });

    cities.forEach((c) => {
      if (!types.includes("city")) return;
      if (countryFilter && c.country_id !== countryFilter) return;
      const s = Math.max(
        scoreMatch(q, c.name_mn),
        scoreMatch(q, c.name_en),
        scoreMatch(q, c.name_local),
        ...(c.aliases || []).map((a) => scoreMatch(q, a))
      );
      if (s > 0) results.push(buildResult("city", c, s, q));
    });

    countries.forEach((c) => {
      if (!types.includes("country")) return;
      const s = Math.max(
        scoreMatch(q, c.name_mn),
        scoreMatch(q, c.name_en),
        ...(c.aliases || []).map((a) => scoreMatch(q, a))
      );
      if (s > 0) results.push(buildResult("country", c, s, q));
    });

    airports.forEach((a) => {
      if (!types.includes("airport")) return;
      if (countryFilter && a.country_id !== countryFilter) return;
      const s = Math.max(scoreMatch(q, a.airport_code, "iata"), scoreMatch(q, a.name_en), scoreMatch(q, a.name_mn));
      if (s > 0) results.push(buildResult("airport", a, s, q));
    });

    const dedup = new Map();
    results.forEach((r) => {
      const key = `${r.type}:${r.city_id || ""}:${r.airport_code || ""}:${r.title}`;
      const prev = dedup.get(key);
      if (!prev || r.score > prev.score) dedup.set(key, r);
    });

    return [...dedup.values()]
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, limit);
  }

  function searchAreas(cityId, query, limit) {
    const areas = root.HOTEL_AREAS?.getAreas?.(cityId) || [];
    const q = norm(query);
    if (!q) return [];
    const city = cities.get(cityId);
    const cityLabel = city?.name_mn || cityId;
    const out = [];

    areas.forEach((a) => {
      const tokens = [a.name, a.district, ...(a.landmarks || []), ...(a.aliases || [])];
      let score = 0;
      tokens.forEach((t) => {
        score = Math.max(score, scoreMatch(query, t));
      });
      if (score > 0) {
        out.push(buildResult(a.landmarks?.includes(a.name) ? "landmark" : "district", {
          city_id: cityId,
          country_id: city?.country_id,
          name: a.name,
          district: a.district,
          city_label: cityLabel,
          area_id: a.id
        }, score, query));
      }
    });

    return out.sort((a, b) => b.score - a.score).slice(0, limit || 10);
  }

  function resolve(query, opts) {
    const q = String(query || "").trim();
    if (!q) return null;
    const list = search(q, { ...(opts || {}), limit: 5 });
    const cityHit = list.find((r) => r.type === "city" || r.type === "airport");
    if (cityHit?.city_id) return cityHit.city_id;
    const countryHit = list.find((r) => r.type === "country");
    if (countryHit) return { country_id: countryHit.country_id, type: "country" };
    return root.TRAVEL_CITIES?.normalizeCity?.(q) || null;
  }

  function getCity(cityId) {
    return cities.get(cityId) || null;
  }

  function getCountry(countryId) {
    return countries.get(countryId) || null;
  }

  function stats() {
    return {
      cities: cities.size,
      countries: countries.size,
      airports: airports.size,
      tokens: tokenIndex.size,
      chunks: [...chunksLoaded]
    };
  }

  function init() {
    if (init._done) return stats();
    ingestCountriesRegistry();
    ingestTravelCities();
    ingestChinaDestinations();
    ingestWorldSeed();
    upsertCountry({
      country_id: "mongolia",
      name_mn: "Монгол",
      name_en: "Mongolia",
      name_local: "Монгол",
      flag: "🇲🇳",
      aliases: ["Монгол", "Mongolia", "MN"]
    });
    registerAirport({
      airport_code: "UBN",
      city_id: "ulanbaatar",
      country_id: "mongolia",
      name_en: "Ulaanbaatar Chinggis Khaan International Airport",
      name_mn: "Улаанбаатар Chinggis Khaan нисэх буудал",
      aliases: ["UB", "Ulaanbaatar Airport"]
    });
    registerAirport({
      airport_code: "ICN",
      city_id: "incheon",
      country_id: "korea",
      name_en: "Seoul Incheon International Airport",
      name_mn: "Сөүл Incheon нисэх буудал",
      aliases: ["Incheon", "Seoul Airport"]
    });
    init._done = true;
    return stats();
  }

  const api = {
    init,
    search,
    searchAreas,
    resolve,
    getCity,
    getCountry,
    loadChunk,
    loadChunkUrl,
    stats,
    norm
  };

  root.LOCATION_ENGINE = api;

  if (root.TRAVEL_CITIES) {
    const orig = root.TRAVEL_CITIES.normalizeCity.bind(root.TRAVEL_CITIES);
    root.TRAVEL_CITIES.normalizeCity = function (input) {
      init();
      const r = resolve(input);
      if (typeof r === "string") return r;
      if (r && typeof r === "object" && r.city_id) return r.city_id;
      return orig(input);
    };
  }
})(typeof window !== "undefined" ? window : globalThis);
