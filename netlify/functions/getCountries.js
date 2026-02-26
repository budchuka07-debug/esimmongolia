// netlify/functions/getCountries.js
// Улсуудын жагсаалт (card list) татах зориулалттай.
// 1) Airhub ESIM/GetPlanInformation → plan-ууд
// 2) plan.countryName-уудаас unique country list үүсгэнэ
// 3) ISO2 code-г RestCountries + MANUAL fallback-оор олно (flag/continent-д хэрэгтэй)

const AIRHUB_BASE = "https://api.airhubapp.com";
const RESTCOUNTRIES_ALL =
  "https://restcountries.com/v3.1/all?fields=cca2,name,altSpellings";

const MANUAL_ISO2 = {
  "andorra": "AD",
  "bahamas": "BS",
  "bolivia": "BO",
  "brazil": "BR",
  "british virgin islands": "VG",
  "cambodia": "KH",
  "chad": "TD",
  "gabon": "GA",
  "iceland": "IS",
  "india": "IN",
  "indonesia": "ID",
  "iraq": "IQ",
  "israel": "IL",
  "italy": "IT",
  "jersey": "JE",
  "jordan": "JO",
  "kenya": "KE",
  "kyrgyzstan": "KG",
  "laos": "LA",
  "malawi": "MW",
  "malaysia": "MY",
  "maldives": "MV",
  "mauritius": "MU",
  "mayotte": "YT",
  "montserrat": "MS",
  "mexico": "MX",
  "nepal": "NP",
  "netherlands": "NL",
  "nigeria": "NG",
  "norway": "NO",
  "philippines": "PH",
  "sint maarten": "SX",
  "south africa": "ZA",
  "taiwan": "TW",
  "tanzania": "TZ",
  "thailand": "TH",
  "tunisia": "TN",
  "turks and caicos islands": "TC",
  "uganda": "UG",
  "ukraine": "UA",
  "usa": "US",
  "united states": "US",
  "uzbekistan": "UZ",
  "venezuela": "VE",
  "vietnam": "VN",
  "zambia": "ZM",
};

const NAME_OVERRIDES = {
  "korea south": "KR",
  "south korea": "KR",
  "korea, republic of": "KR",
  "united states of america": "US",
  "united states": "US",
  "usa": "US",
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
  return cc.replace(/./g, (ch) =>
    String.fromCodePoint(127397 + ch.charCodeAt(0))
  );
}

function detectContinent(code) {
  const c = String(code || "").toUpperCase();

  const asia = new Set([
    "CN","JP","KR","MN","TW","HK","MO","SG","TH","VN","MY","PH","ID","IN","KH","LA","MM","BD","NP","LK","PK","KZ","UZ","KG","TJ","TM",
    "AE","SA","QA","KW","OM","BH","IL","JO","IQ","IR","TR"
  ]);
  const europe = new Set([
    "FR","DE","IT","ES","PT","NL","BE","LU","IE","GB","UK","CH","AT","CZ","PL","HU","SK","SI","HR","RO","BG","GR","SE","NO","FI","DK","IS",
    "EE","LV","LT","UA","MD","RS","BA","ME","AL","MK","CY","MT"
  ]);
  const africa = new Set([
    "ZA","EG","MA","TN","DZ","NG","KE","TZ","UG","ET","GH","CI","SN","CM","ZW","ZM","MW","MZ","AO","GA","TD"
  ]);
  const americas = new Set([
    "US","CA","MX","BR","AR","CL","CO","PE","EC","UY","PY","BO","VE","GT","CR","PA","DO","JM","BS"
  ]);
  const oceania = new Set(["AU","NZ","FJ","PG","SB","VU"]);

  if (asia.has(c)) return "Asia";
  if (europe.has(c)) return "Europe";
  if (africa.has(c)) return "Africa";
  if (americas.has(c)) return "Americas";
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

// ✅ зөв endpoint: /api/ESIM/GetPlanInformation (POST)
// Зарим аккаунт дээр [] ажиллахгүй байж болох тул 2 янзаар retry хийж байна.
async function fetchAllPlans(token, PARTNER_CODE) {
  const payloadA = {
    partnerCode: Number(PARTNER_CODE),
    flag: 6,
    countryCode: "",
    multiplecountrycode: [],
  };

  const payloadB = {
    partnerCode: Number(PARTNER_CODE),
    flag: 6,
    countryCode: "",
    multiplecountrycode: "",
  };

  const tryOnce = async (payload) => {
    const res = await fetch(`${AIRHUB_BASE}/api/ESIM/GetPlanInformation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json };
  };

  const a = await tryOnce(payloadA);
  if (a.ok) return a;

  const b = await tryOnce(payloadB);
  return b;
}

async function buildCountryCodeMap() {
  try {
    const res = await fetch(RESTCOUNTRIES_ALL, { method: "GET" });
    const arr = await res.json().catch(() => []);
    const map = new Map();

    for (const item of Array.isArray(arr) ? arr : []) {
      const cca2 = item?.cca2;
      if (!cca2) continue;

      const names = [];
      if (item?.name?.common) names.push(item.name.common);
      if (item?.name?.official) names.push(item.name.official);
      if (Array.isArray(item?.altSpellings)) names.push(...item.altSpellings);

      for (const n of names) {
        const key = normalizeName(n);
        if (key && !map.has(key)) map.set(key, cca2);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return corsPreflight();
  if (event.httpMethod !== "GET")
    return jsonRes(405, { error: "Method Not Allowed" });

  const USERNAME = process.env.AIRHUB_USERNAME;
  const PASSWORD = process.env.AIRHUB_PASSWORD;
  const PARTNER_CODE = process.env.AIRHUB_PARTNER_CODE;

  if (!USERNAME || !PASSWORD || !PARTNER_CODE) {
    return jsonRes(500, {
      error:
        "Missing env vars: AIRHUB_USERNAME, AIRHUB_PASSWORD, AIRHUB_PARTNER_CODE",
    });
  }

  try {
    const login = await airhubLogin(USERNAME, PASSWORD);
    if (!login.ok) {
      return jsonRes(401, { error: "Airhub login failed", details: login.data });
    }

    const plansRes = await fetchAllPlans(login.token, PARTNER_CODE);
    if (!plansRes.ok) {
      return jsonRes(plansRes.status, {
        error: "GetPlanInformation failed",
        details: plansRes.data,
      });
    }

    const plans = Array.isArray(plansRes.data?.getInformation)
      ? plansRes.data.getInformation
      : [];

    const rcMap = await buildCountryCodeMap();

    const byKey = new Map(); // normalizedName -> {name, code, fromPrice}
    for (const p of plans) {
      const name = String(p?.countryName || "").trim();
      if (!name) continue;

      const price = Number(p?.price ?? p?.Price ?? NaN);
      const key = normalizeName(name);

      const override = NAME_OVERRIDES[key];
      const manual = MANUAL_ISO2[key];
      const rc = rcMap.get(key);
      const iso2 = (override || manual || rc || "").toUpperCase();

      const prev = byKey.get(key) || { name, code: "", fromPrice: null };

      if (iso2 && !prev.code) prev.code = iso2;

      if (Number.isFinite(price)) {
        if (prev.fromPrice == null || price < prev.fromPrice) prev.fromPrice = price;
      }

      byKey.set(key, prev);
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
      totalPlans: plans.length,
      note:
        "Airhub ESIM/GetPlanInformation ашиглан country list үүсгэв. Хэрвээ зарим нэр ISO2 олдохгүй бол NAME_OVERRIDES/MANUAL_ISO2-д нэм.",
    });
  } catch (err) {
    return jsonRes(500, { error: "Server error", message: String(err) });
  }
}
