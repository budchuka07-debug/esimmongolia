// netlify/functions/getCountries.js
// Улсуудын жагсаалт (card list) татах зориулалттай.
// 1) Airhub GetPlanInformation → бүх plan-ууд
// 2) plan.countryName-уудаас unique country list үүсгэнэ
// 3) ISO2 code-г RestCountries (public) -оос map хийнэ (flag/continent-д хэрэгтэй)

const AIRHUB_BASE = "https://api.airhubapp.com";
const RESTCOUNTRIES_ALL = "https://restcountries.com/v3.1/all?fields=cca2,name,altSpellings";

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

// ⚠️ Энд multiplecountrycode-г хоосон явуулахад (flag=6) Airhub бүх plan-аа буцаадаг гэж үзэж байгаа.
// Хэрвээ танайд limit тавьдаг бол энд codes list өгч paginate хийх хэрэг гарч магадгүй.
async function fetchAllPlans(token, PARTNER_CODE) {
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
      multiplecountrycode: [],
    }),
  });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: json };
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

// Continent detection by ISO2
function detectContinent(code) {
  const c = String(code || "").toUpperCase();

  const asia = new Set([
    "CN","JP","KR","MN","TW","HK","MO","SG","TH","VN","MY","PH","ID","IN","KH","LA","MM","BD","NP","LK","PK","KZ","UZ","KG","TJ","TM","AE","SA","QA","KW","OM","BH","IL","JO","IQ","IR","TR"
  ]);
  const europe = new Set([
    "FR","DE","IT","ES","PT","NL","BE","LU","IE","GB","UK","CH","AT","CZ","PL","HU","SK","SI","HR","RO","BG","GR","SE","NO","FI","DK","IS","EE","LV","LT","UA","MD","RS","BA","ME","AL","MK","CY","MT"
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

async function buildCountryCodeMap() {
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
}

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
    const login = await airhubLogin(USERNAME, PASSWORD);
    if (!login.ok) {
      return jsonRes(401, { error: "Airhub login failed", details: login.data });
    }

    const plansRes = await fetchAllPlans(login.token, PARTNER_CODE);
    if (!plansRes.ok) {
      return jsonRes(plansRes.status, { error: "GetPlanInformation failed", details: plansRes.data });
    }

    const plans = Array.isArray(plansRes.data?.getInformation) ? plansRes.data.getInformation : [];

    // RestCountries map (cca2)
    const rcMap = await buildCountryCodeMap();

    // Build countries
    const byName = new Map(); // name -> {name, code, fromPrice}
    for (const p of plans) {
      const name = String(p?.countryName || "").trim();
      if (!name) continue;

      const price = Number(p?.price ?? p?.Price ?? NaN);
      const key = normalizeName(name);

      // resolve ISO2
      const override = NAME_OVERRIDES[key];
      const iso2 = override || rcMap.get(key) || "";

      const entry = byName.get(key) || { name, code: iso2, fromPrice: null };

      // 최소 үнэ
      if (Number.isFinite(price)) {
        if (entry.fromPrice == null || price < entry.fromPrice) entry.fromPrice = price;
      }

      // code хоосон байвал дараа нь нөхнө
      if (!entry.code && iso2) entry.code = iso2;

      byName.set(key, entry);
    }

    const countries = [...byName.values()]
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
      // code байхгүй (map олдоогүй) улсуудыг хамгийн доор гаргах
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
      note: "code нь ISO2 (flag/continent-д). Хэрвээ зарим улс code хоосон байвал нэрийг override-д нэмээрэй.",
    });
  } catch (err) {
    return jsonRes(500, { error: "Server error", message: String(err) });
  }
}
