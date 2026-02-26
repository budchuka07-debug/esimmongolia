// netlify/functions/getCountries.js
// Countries list builder (stable)
// - Uses SAME login as getPlans: POST /api/Authentication/UserLogin with { userName, password }
// - Uses POST /api/ESIM/GetPlanInformation with multiplecountrycode batches

const AIRHUB_BASE = "https://api.airhubapp.com";
const RESTCOUNTRIES_ALL =
  "https://restcountries.com/v3.1/all?fields=cca2,name,altSpellings";

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

function detectContinent(code) {
  const c = String(code || "").toUpperCase();
  const asia = new Set(["CN","JP","KR","MN","TW","HK","MO","SG","TH","VN","MY","PH","ID","IN","KH","LA","MM","BD","NP","LK","PK",
    "KZ","UZ","KG","TJ","TM","AE","SA","QA","KW","OM","BH","IL","JO","IQ","IR","TR"]);
  const europe = new Set(["FR","DE","IT","ES","PT","NL","BE","LU","IE","GB","CH","AT","CZ","PL","HU","SK","SI","HR","RO","BG",
    "GR","SE","NO","FI","DK","IS","EE","LV","LT","UA","MD","RS","BA","ME","AL","MK","CY","MT"]);
  const africa = new Set(["ZA","EG","MA","TN","DZ","NG","KE","TZ","UG","ET","GH","CI","SN","CM","ZW","ZM","MW","MZ","AO","GA","TD"]);
  const america = new Set(["US","CA","MX","BR","AR","CL","CO","PE","EC","UY","PY","BO","VE","GT","CR","PA","DO","JM","BS"]);
  const oceania = new Set(["AU","NZ","FJ","PG","SB","VU"]);

  if (asia.has(c)) return "Asia";
  if (europe.has(c)) return "Europe";
  if (africa.has(c)) return "Africa";
  if (america.has(c)) return "America";
  if (oceania.has(c)) return "Oceania";
  return "Other";
}

// ✅ plan дотроос ISO2 унших (хамгийн найдвартай)
function readIso2FromPlan(plan) {
  return String(
    plan?.countryCode ||
      plan?.CountryCode ||
      plan?.country_code ||
      plan?.iso2 ||
      plan?.ISO2 ||
      ""
  )
    .toUpperCase()
    .trim();
}

// ✅ SAME as getPlans
async function airhubLogin(USERNAME, PASSWORD) {
  const loginRes = await fetch(`${AIRHUB_BASE}/api/Authentication/UserLogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: USERNAME, password: PASSWORD }),
  });

  const loginJson = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok || !loginJson?.token) {
    return { ok: false, status: loginRes.status, data: loginJson };
  }
  return { ok: true, token: loginJson.token };
}

// ✅ Multi-country plan fetch (same API as getPlans, but batched)
async function fetchPlansMulti(token, PARTNER_CODE, codes) {
  const res = await fetch(`${AIRHUB_BASE}/api/ESIM/GetPlanInformation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      partnerCode: Number(PARTNER_CODE),
      flag: 6,
      countryCode: "",
      multiplecountrycode: codes,
    }),
  });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: json };
}

async function getRestCountriesMapAndIso2List() {
  const r = await fetch(RESTCOUNTRIES_ALL, { headers: { Accept: "application/json" } });
  const arr = await r.json();

  const nameToCca2 = new Map();
  const iso2Set = new Set();

  for (const c of Array.isArray(arr) ? arr : []) {
    const cca2 = String(c?.cca2 || "").toUpperCase();
    if (!/^[A-Z]{2}$/.test(cca2)) continue;
    iso2Set.add(cca2);

    const names = new Set();
    if (c?.name?.common) names.add(c.name.common);
    if (c?.name?.official) names.add(c.name.official);
    for (const a of c?.altSpellings || []) names.add(a);

    for (const n of names) {
      const key = normalizeName(n);
      if (key && !nameToCca2.has(key)) nameToCca2.set(key, cca2);
    }
  }

  return { nameToCca2, iso2List: Array.from(iso2Set).sort() };
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return corsPreflight();
  if (event.httpMethod !== "GET") return jsonRes(405, { error: "Method not allowed" });

  const USERNAME = process.env.AIRHUB_USERNAME;
  const PASSWORD = process.env.AIRHUB_PASSWORD;
  const PARTNER_CODE = process.env.AIRHUB_PARTNER_CODE;

  if (!USERNAME || !PASSWORD || !PARTNER_CODE) {
    return jsonRes(500, {
      error: "Missing env vars: AIRHUB_USERNAME, AIRHUB_PASSWORD, AIRHUB_PARTNER_CODE",
    });
  }

  try {
    const { nameToCca2, iso2List } = await getRestCountriesMapAndIso2List();

    const login = await airhubLogin(USERNAME, PASSWORD);
    if (!login.ok) {
      return jsonRes(401, { error: "Airhub login failed", details: login.data });
    }

    // Batch fetch plans
    const BATCH = 20;
    const allPlans = [];
    for (let i = 0; i < iso2List.length; i += BATCH) {
      const codes = iso2List.slice(i, i + BATCH);
      const r = await fetchPlansMulti(login.token, PARTNER_CODE, codes);
      if (r.ok && Array.isArray(r.data?.getInformation)) {
        allPlans.push(...r.data.getInformation);
      }
    }

    // Unique countries from plans
    const byKey = new Map(); // normalizedName -> { name, code, fromPrice }
    for (const p of allPlans) {
      const name = String(p?.countryName || "").trim();
      if (!name) continue;

      const key = normalizeName(name);
      const price = Number(p?.price ?? p?.Price ?? NaN);

      const fromPlan = readIso2FromPlan(p);
      const fromRest = nameToCca2.get(key) || "";
      const iso2 = (fromPlan || fromRest).toUpperCase();

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
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return jsonRes(200, { countries, total: countries.length });
  } catch (err) {
    return jsonRes(500, { error: "Server error", message: String(err?.message || err) });
  }
};
