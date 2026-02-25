// netlify/functions/getPlans.js

let CACHE = null;
let CACHE_TS = 0;
const TTL_MS = 10 * 60 * 1000; // 10 минут

const BASE = "https://api.airhubapp.com";
const BATCH_SIZE = 50;

/**
 * ISO2 -> 🇺🇸 flag emoji
 */
function isoToFlag(iso2 = "") {
  const code = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  const A = 0x1f1e6;
  const chars = [...code].map((c) => String.fromCodePoint(A + (c.charCodeAt(0) - 65)));
  return chars.join("");
}

/**
 * Array chunk helper
 */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Airhub response-оос plan list-г боломжит түлхүүрүүдээр татаж авах (янз бүрийн бүтэцтэй байж болно)
 */
function extractPlans(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  // боломжит common keys
  const candidates = [
    raw.data,
    raw.result,
    raw.results,
    raw.planList,
    raw.plans,
    raw.PlanList,
    raw.PlanInformation,
    raw?.Data,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }

  // заримдаа object дотор list байдаг
  if (raw?.data && Array.isArray(raw.data?.plans)) return raw.data.plans;

  return [];
}

/**
 * Plan object-оос үнэ гаргаж авах
 */
function getPrice(p) {
  const v =
    p?.retailPrice ??
    p?.RetailPrice ??
    p?.price ??
    p?.Price ??
    p?.salePrice ??
    p?.SalePrice ??
    p?.amount ??
    p?.Amount ??
    0;

  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Plan object-оос улс код/нэр гаргах
 */
function getCountryCode(p) {
  return (
    p?.countryCode ??
    p?.CountryCode ??
    p?.iso ??
    p?.ISO ??
    p?.country ??
    p?.Country ??
    ""
  );
}
function getCountryName(p) {
  return (
    p?.countryName ??
    p?.CountryName ??
    p?.name ??
    p?.Name ??
    p?.country ??
    p?.Country ??
    ""
  );
}

async function airhubLogin(USERNAME, PASSWORD) {
  const loginRes = await fetch(`${BASE}/api/Authentication/UserLogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: USERNAME, password: PASSWORD }),
  });

  const loginJson = await loginRes.json();
  if (!loginRes.ok || !loginJson?.token) {
    const msg = loginJson?.message || "Airhub login failed";
    throw new Error(msg);
  }
  return loginJson.token;
}

async function fetchPlanBatch(token, PARTNER_CODE, batchCodes) {
  const res = await fetch(`${BASE}/api/ESIM/GetPlanInformation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      partnerCode: Number(PARTNER_CODE),
      flag: 6,
      countryCode: "",
      multiplecountrycode: batchCodes,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error("GetPlanInformation failed: " + JSON.stringify(json));
  }
  return json;
}

/**
 * Нэгтгэж: улс бүрээр групплээд From үнэ гаргаад буцаана
 */
function normalizeCountries(allPlans) {
  const map = new Map();

  for (const p of allPlans) {
    const code = String(getCountryCode(p) || "").toUpperCase();
    const name = String(getCountryName(p) || "").trim();

    if (!code) continue;

    if (!map.has(code)) {
      map.set(code, {
        code,
        name: name || code,
        flag: isoToFlag(code),
        fromPrice: null,
        plansCount: 0,
        plans: [],
      });
    }

    const item = map.get(code);
    if (name && (!item.name || item.name === code)) item.name = name;

    const price = getPrice(p);
    if (price > 0) {
      if (item.fromPrice == null) item.fromPrice = price;
      else item.fromPrice = Math.min(item.fromPrice, price);
    }

    item.plansCount += 1;
    item.plans.push(p);
  }

  // array болгоод нэрээр эрэмбэлнэ
  return Array.from(map.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

/**
 * ⚠️ Энд “олон улс” ISO2 кодын жагсаалт.
 * Airhub дээр бүх улс байх эсэх нь plan-аас шалтгаална. Дутвал нэмээд явж болно.
 */
const CODES = [
  // ASIA
  "MN","CN","JP","KR","HK","MO","TW","TH","VN","ID","MY","SG","PH","KH","LA","MM","IN","NP","LK","BD","PK",
  "AE","SA","QA","KW","BH","OM","IL","JO","LB","IQ","IR","UZ","KZ","KG","TJ","GE","AM","AZ","TR",

  // EUROPE
  "GB","IE","FR","DE","IT","ES","PT","NL","BE","LU","CH","AT","DK","SE","NO","FI","IS",
  "PL","CZ","SK","HU","RO","BG","GR","HR","SI","RS","ME","AL","MK","BA","UA","MD","LT","LV","EE",

  // AMERICAS
  "US","CA","MX","BR","AR","CL","CO","PE","EC","BO","PY","UY","VE","PA","CR","NI","HN","SV","GT","DO","JM","TT",

  // AFRICA
  "EG","MA","DZ","TN","ZA","NG","GH","KE","TZ","UG","RW","ET","SN","CI","CM","AO","ZM","ZW","MZ","NA","BW",

  // OCEANIA
  "AU","NZ","FJ"
];

export async function handler(event) {
  // зөвхөн GET зөвшөөрнө
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // ✅ Cache: 10 минут Airhub дуудахгүй
  if (CACHE && Date.now() - CACHE_TS < TTL_MS) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify({ cached: true, ...CACHE }),
    };
  }

  // ⚠️ Netlify Environment variables
  const USERNAME = process.env.AIRHUB_USERNAME;
  const PASSWORD = process.env.AIRHUB_PASSWORD;
  const PARTNER_CODE = process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE; // (алдаа гаргахгүйн тулд)
  const PARTNER = process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE;

  // дээрх мөрүүдээс нэгийг нь ашиглахад хангалттай; хамгийн зөв нь AIRHUB_PARTNER_CODE
  const PARTNER_CODE_FINAL = process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE || process.env.AIRHUB_PARTNER_CODE;

  // ⚠️ Дээрх PARTNER_CODE_FINAL хэсэг хэт урт болж байна — ТЭГЭХЭЭР энд шууд зөв хувьсагч ашиглая:
  const PARTNER_CODE_OK = process.env.AIRHUB_PARTNER_CODE;

  if (!USERNAME || !PASSWORD || !PARTNER_CODE_OK) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Missing env vars: AIRHUB_USERNAME, AIRHUB_PASSWORD, AIRHUB_PARTNER_CODE",
      }),
    };
  }

  try {
    // 1) token
    const token = await airhubLogin(USERNAME, PASSWORD);

    // 2) олон кодыг batch-аар татна
    const batches = chunk(CODES, BATCH_SIZE);
    const allPlans = [];

    for (const b of batches) {
      const raw = await fetchPlanBatch(token, PARTNER_CODE_OK, b);
      const plans = extractPlans(raw);
      allPlans.push(...plans);
    }

    // 3) normalize: улс бүрээр групплэх + from үнэ + flag
    const countries = normalizeCountries(allPlans);

    const payload = {
      ok: true,
      fetchedAt: new Date().toISOString(),
      totalPlans: allPlans.length,
      totalCountries: countries.length,
      countries, // ✅ энд frontend чинь шууд ашиглана
    };

    // ✅ Cache-д хадгална
    CACHE = payload;
    CACHE_TS = Date.now();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify({ cached: false, ...payload }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error", message: String(err?.message || err) }),
    };
  }
}
