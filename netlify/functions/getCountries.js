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

// Airhub GetPlanInformation (multi-country)
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
     multiplecountrycode: Array.isArray(codes) ? codes.join(",") : String(codes || ""),
    }),
  });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: json };
}

async function buildRestCountriesMaps() {
  const res = await fetch(RESTCOUNTRIES_ALL, { method: "GET" });
  const arr = await res.json().catch(() => []);
  const nameToCca2 = new Map();
  const allCca2 = [];

  for (const item of Array.isArray(arr) ? arr : []) {
    const cca2 = item?.cca2;
    if (!cca2) continue;
    allCca2.push(cca2);

    const names = [];
    if (item?.name?.common) names.push(item.name.common);
    if (item?.name?.official) names.push(item.name.official);
    if (Array.isArray(item?.altSpellings)) names.push(...item.altSpellings);

    for (const n of names) {
      const key = normalizeName(n);
      if (key && !nameToCca2.has(key)) nameToCca2.set(key, cca2);
    }
  }

  return { nameToCca2, allCca2: [...new Set(allCca2)] };
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return corsPreflight();
  if (event.httpMethod !== "GET") return jsonRes(405, { error: "Method Not Allowed" });

  const USERNAME = process.env.AIRHUB_USERNAME;
  const PASSWORD = process.env.AIRHUB_PASSWORD;
  const PARTNER_CODE = process.env.AIRHUB_PARTNER_CODE;

  if (!USERNAME || !PASSWORD || !PARTNER_CODE) {
    return jsonRes(500, {
      error: "Missing env vars: AIRHUB_USERNAME, AIRHUB_PASSWORD, AIRHUB_PARTNER_CODE",
    });
  }

  try {
    // 1) ISO2 жагсаалт + нэр mapping
    const { nameToCca2, allCca2 } = await buildRestCountriesMaps();

    // ⚡ performance: бүх улсыг биш, эхний 220-г татна (ихэнхдээ хангалттай)
    // ⚡ performance + priority: чухал улсуудыг эхэнд нь авч гаргана
const PRIORITY = ["TH","US","GB","JP","KR","CN","VN","SG","HK","MY","TW","TR","PH","ID"];

const iso2List = allCca2.filter((c) => /^[A-Z]{2}$/.test(c));

    // 2) Airhub login
    const login = await airhubLogin(USERNAME, PASSWORD);
    if (!login.ok) {
      return jsonRes(401, { error: "Airhub login failed", details: login.data });
    }

    // 3) ISO2-г багцуудаар plan татах
    const chunks = chunkArray(iso2List, 40);
    let allPlans = [];

    for (const codes of chunks) {
      const plansRes = await fetchPlansMulti(login.token, PARTNER_CODE, codes);
      if (!plansRes.ok) continue;

      const plans = Array.isArray(plansRes.data?.getInformation) ? plansRes.data.getInformation : [];
      allPlans = allPlans.concat(plans);
    }

    // 4) Unique улс үүсгэх
    const byKey = new Map(); // normalizedName -> { name, code, fromPrice }
    for (const p of allPlans) {
      const name = String(p?.countryName || "").trim();
      if (!name) continue;
const iso =
  p.countryCode ||
  p.countrycode ||
  p.countryISO ||
  p.countryIso ||
  p.iso ||
  p.country ||
  "";
      const key = normalizeName(name);
      const price = Number(p?.price ?? p?.Price ?? NaN);

      // ISO2 resolve
      const override = NAME_OVERRIDES[key];
      const iso2 = (override || nameToCca2.get(key) || "").toUpperCase();

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
        return String(a.name).localeCompare(String(b.name));
      });

    return jsonRes(200, {
      countries,
      totalCountries: countries.length,
      totalPlans: allPlans.length,
      note: "getCountries: RestCountries ISO2-г багцуудаар Airhub GetPlanInformation руу явуулж country list үүсгэдэг.",
    });
  } catch (err) {
    return jsonRes(500, { error: "Server error", message: String(err) });
  }
}
