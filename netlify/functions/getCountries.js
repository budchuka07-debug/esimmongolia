// netlify/functions/getCountries.js
// Улсуудын жагсаалт (card list) татах зориулалттай.
// ✅ Найдвартай хувилбар:
// 1) RestCountries-оос ISO2 (cca2) жагсаалт авна
// 2) ISO2-г жижиг багцуудаар Airhub ESIM/GetPlanInformation руу явуулж plan-ууд татна
// 3) plan.countryName-оос unique country list үүсгэнэ + ISO2 map (flag/continent-д)
//
// Энэ нь /api/Plan/GetPlanInformation (GET) дээр унадаг асуудлыг бүрэн тойрдог.

const AIRHUB_BASE = "https://api.airhubapp.com";
const RESTCOUNTRIES_ALL = "https://restcountries.com/v3.1/all?fields=cca2,name,altSpellings";

// Зарим нэр Airhub дээр өөр хэлбэртэй ирдэг → override
const NAME_OVERRIDES = {
  "korea south": "KR",
  "south korea": "KR",
  "korea, republic of": "KR",
  "usa": "US",
  "united states": "US",
  "united states of america": "US",
  "uk": "GB",
  "united kingdom": "GB",
  "russia": "RU",
};

function jsonRes(statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(bodyObj),
  };
}

function corsPreflight() {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
    body: "",
  };
}

function normalizeName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[’']/g, "")
    .trim();
}

function flagFromCode(code) {
  const cc = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "";
  return cc.replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt()));
}

// ✅ UI дээр чинь "America" гэж байгаа тул "Americas" биш "America" буцаана
function detectContinent(code) {
  const c = String(code || "").toUpperCase();

  const asia = new Set([
    "CN","JP","KR","MN","TW","HK","MO","SG","TH","VN","MY","PH","ID","IN","KH","LA","MM","BD","NP","LK","PK",
    "KZ","UZ","KG","TJ","TM","AE","SA","QA","KW","OM","BH","IL","JO","IQ","IR","TR"
  ]);
  const europe = new Set([
    "FR","DE","IT","ES","PT","NL","BE","LU","IE","GB","UK","CH","AT","CZ","PL","HU","SK","SI","HR","RO","BG",
    "GR","SE","NO","FI","DK","IS","EE","LV","LT","UA","MD","RS","BA","ME","AL","MK","CY","MT"
  ]);
  const africa = new Set([
    "ZA","EG","MA","TN","DZ","NG","KE","TZ","UG","ET","GH","CI","SN","CM","ZW","ZM","MW","MZ","AO","GA","TD"
  ]);
  const america = new Set([
    "US","CA","MX","BR","AR","CL","CO","PE","EC","UY","PY","BO","VE","GT","CR","PA","DO","JM","BS"
  ]);
  const oceania = new Set(["AU","NZ","FJ","PG","SB","VU"]);

  if (asia.has(c)) return "Asia";
  if (europe.has(c)) return "Europe";
  if (africa.has(c)) return "Africa";
  if (america.has(c)) return "America";
  if (oceania.has(c)) return "Oceania";
  return "Other";
}

// ✅ хамгийн гол засвар: ISO2-г plan дотроос шууд унших (хоосон болохоос хамгаална)
function readIso2FromPlan(plan){
  return String(
    plan?.countryCode ||
    plan?.CountryCode ||
    plan?.country_code ||
    plan?.iso2 ||
    plan?.ISO2 ||
    ""
  ).toUpperCase().trim();
}

async function airhubLogin(USERNAME, PASSWORD) {
  const loginRes = await fetch(`${AIRHUB_BASE}/api/Authentication/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const loginJson = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok) throw new Error(loginJson?.message || "Airhub login failed");
  const token = loginJson?.token || loginJson?.access_token || loginJson?.data?.token;
  if (!token) throw new Error("Airhub token not found in response");
  return token;
}

async function getRestCountriesMap() {
  const r = await fetch(RESTCOUNTRIES_ALL, { headers: { "Accept": "application/json" } });
  const arr = await r.json();

  const map = new Map(); // normalizedName -> cca2
  for (const c of (Array.isArray(arr) ? arr : [])) {
    const cca2 = String(c?.cca2 || "").toUpperCase();
    if (!/^[A-Z]{2}$/.test(cca2)) continue;

    const names = new Set();
    const common = c?.name?.common;
    const official = c?.name?.official;
    if (common) names.add(common);
    if (official) names.add(official);
    for (const a of (c?.altSpellings || [])) names.add(a);

    for (const n of names) {
      const key = normalizeName(n);
      if (!key) continue;
      if (!map.has(key)) map.set(key, cca2);
    }
  }
  return map;
}

async function fetchPlansByCode(token, iso2) {
  const url = `${AIRHUB_BASE}/api/ESIM/GetPlanInformation?countryCode=${encodeURIComponent(iso2)}`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `GetPlanInformation failed for ${iso2}`);
  const list = data?.getInformation || data?.GetInformation || data?.data || data?.plans || [];
  return Array.isArray(list) ? list : [];
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return corsPreflight();
  if (event.httpMethod !== "GET") return jsonRes(405, { error: "Method not allowed" });

  try {
    const USERNAME = process.env.AIRHUB_USERNAME;
    const PASSWORD = process.env.AIRHUB_PASSWORD;

    if (!USERNAME || !PASSWORD) {
      return jsonRes(500, { error: "Missing AIRHUB_USERNAME / AIRHUB_PASSWORD env vars" });
    }

    // 1) RestCountries map
    const nameToCca2 = await getRestCountriesMap();

    // 2) Airhub login
    const token = await airhubLogin(USERNAME, PASSWORD);

    // 3) ISO2 list (RestCountries-оос)
    const allIso2 = Array.from(new Set(Array.from(nameToCca2.values()))).sort();

    // 3.1) жижиг batch-аар plan-ууд татна
    const BATCH = 10;
    const allPlans = [];
    for (let i = 0; i < allIso2.length; i += BATCH) {
      const slice = allIso2.slice(i, i + BATCH);
      const chunk = await Promise.allSettled(slice.map((cc) => fetchPlansByCode(token, cc)));
      for (const r of chunk) {
        if (r.status === "fulfilled") allPlans.push(...r.value);
      }
    }

    // 4) Unique улс үүсгэх
    const byKey = new Map(); // normalizedName -> { name, code, fromPrice }
    for (const p of allPlans) {
      const name = String(p?.countryName || "").trim();
      if (!name) continue;

      const key = normalizeName(name);
      const price = Number(p?.price ?? p?.Price ?? NaN);

      // ✅ ISO2 resolve: plan -> override -> restcountries
      const fromPlan = readIso2FromPlan(p);
      const override = NAME_OVERRIDES[key];
      const fromRest = (nameToCca2.get(key) || "");
      const iso2 = (fromPlan || override || fromRest).toUpperCase();

      const entry = byKey.get(key) || { name, code: iso2, fromPrice: null };
      if (!entry.code && iso2) entry.code = iso2;

      if (Number.isFinite(price)) {
        if (entry.fromPrice == null || price < entry.fromPrice) entry.fromPrice = price;
      }

      byKey.set(key, entry);
    }

    const countries = [...byKey.values()]
      .map((c) => {
        const code = String(c.code || "").toUpperCase();
        return {
          code,
          name: c.name,
          continent: detectContinent(code),
          flag: flagFromCode(code),
          fromPrice: c.fromPrice,
        };
      })
      .sort((a, b) => {
        const aHas = a.code ? 0 : 1;
        const bHas = b.code ? 0 : 1;
        if (aHas !== bHas) return aHas - bHas;
        return (a.name || "").localeCompare(b.name || "");
      });

    return jsonRes(200, { countries, total: countries.length });
  } catch (err) {
    return jsonRes(500, { error: String(err?.message || err) });
  }
};
