// netlify/functions/getCountries.js
// Airhub → бүх улс/багц татаж (batch), frontend-д "countries" жагсаалт буцаана.
// Netlify environment variables хэрэгтэй:
// AIRHUB_USERNAME, AIRHUB_PASSWORD, AIRHUB_PARTNER_CODE

let _cache = null;
let _cacheAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 минут

const BASE = "https://api.airhubapp.com";

// ISO2 → 🇲🇳 гэх мэт flag
function codeToFlag(code) {
  const cc = String(code || "").toUpperCase();
  if (cc.length !== 2) return "";
  const A = 0x1F1E6;
  const first = cc.charCodeAt(0) - 65 + A;
  const second = cc.charCodeAt(1) - 65 + A;
  return String.fromCodePoint(first, second);
}

// Тивийн энгийн ангилал (ихэнх улс бүрэн хамрагдана)
const CONTINENT = {
  Asia: new Set([
    "AE","AF","AM","AZ","BD","BH","BN","BT","CN","CY","GE","HK","ID","IL","IN","IQ","IR","JO","JP","KG","KH","KP","KR","KW","KZ","LA","LB","LK","MO","MM","MN","MO","MV","MY","NP","OM","PH","PK","PS","QA","SA","SG","SY","TH","TJ","TL","TM","TR","TW","UZ","VN","YE"
  ]),
  Europe: new Set([
    "AD","AL","AT","AX","BA","BE","BG","BY","CH","CZ","DE","DK","EE","ES","FI","FO","FR","GB","GG","GI","GR","HR","HU","IE","IM","IS","IT","JE","LI","LT","LU","LV","MC","MD","ME","MK","MT","NL","NO","PL","PT","RO","RS","RU","SE","SI","SJ","SK","SM","UA","VA"
  ]),
  Africa: new Set([
    "AO","BF","BI","BJ","BW","CD","CF","CG","CI","CM","CV","DJ","DZ","EG","EH","ER","ET","GA","GH","GM","GN","GQ","GW","KE","KM","LR","LS","LY","MA","MG","ML","MR","MU","MW","MZ","NA","NE","NG","RE","RW","SC","SD","SH","SL","SN","SO","SS","ST","SZ","TD","TG","TN","TZ","UG","ZA","ZM","ZW"
  ]),
  Americas: new Set([
    "AG","AI","AR","AW","BB","BM","BO","BR","BS","BZ","CA","CL","CO","CR","CU","CW","DM","DO","EC","GD","GL","GP","GT","GY","HN","HT","JM","KN","KY","LC","MF","MQ","MS","MX","NI","PA","PE","PM","PR","PY","SR","SV","TC","TT","US","UY","VC","VE","VG","VI"
  ]),
  Oceania: new Set([
    "AS","AU","CK","FJ","FM","GU","KI","MH","MP","NC","NF","NR","NU","NZ","PF","PG","PN","PW","SB","TK","TO","TV","VU","WF","WS"
  ])
};

function getContinent(code) {
  const cc = String(code || "").toUpperCase();
  for (const [k, set] of Object.entries(CONTINENT)) {
    if (set.has(cc)) return k;
  }
  return "Other";
}

// Airhub plan-уудаас үнэ унших (талбар нэр өөр байж болно)
function readPrice(plan) {
  const candidates = [
    plan.totalPrice, plan.price, plan.salePrice, plan.amount, plan.Amount, plan.unitPrice, plan.UnitPrice
  ];
  for (const v of candidates) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function readCode(plan) {
  return (plan.countryCode || plan.CountryCode || plan.country_code || "").toUpperCase();
}

function readName(plan) {
  return plan.countryName || plan.CountryName || plan.country || plan.Country || "";
}

// ISO2 бүх код (batch хийхэд ашиглана)
const ALL_ISO2 = [
  "AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ",
  "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ",
  "CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ",
  "DE","DJ","DK","DM","DO","DZ",
  "EC","EE","EG","EH","ER","ES","ET",
  "FI","FJ","FK","FM","FO","FR",
  "GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY",
  "HK","HM","HN","HR","HT","HU",
  "ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT",
  "JE","JM","JO","JP",
  "KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ",
  "LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY",
  "MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ",
  "NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ",
  "OM",
  "PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY",
  "QA",
  "RE","RO","RS","RU","RW",
  "SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ",
  "TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ",
  "UA","UG","UM","US","UY","UZ",
  "VA","VC","VE","VG","VI","VN","VU",
  "WF","WS",
  "YE","YT",
  "ZA","ZM","ZW"
];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function airhubLogin(USERNAME, PASSWORD) {
  const loginRes = await fetch(`${BASE}/api/Authentication/UserLogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: USERNAME, password: PASSWORD }),
  });
  const loginJson = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok || !loginJson?.token) {
    const err = new Error("Airhub login failed");
    err.details = loginJson;
    err.status = loginRes.status;
    throw err;
  }
  return loginJson.token;
}

async function fetchPlansBatch(token, PARTNER_CODE, codes) {
  const planRes = await fetch(`${BASE}/api/ESIM/GetPlanInformation`, {
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

  const planJson = await planRes.json().catch(() => ({}));
  if (!planRes.ok) {
    const err = new Error("Airhub GetPlanInformation failed");
    err.details = planJson;
    err.status = planRes.status;
    throw err;
  }
  return planJson;
}

function normalize(planJsonList) {
  // planJsonList: олон batch-ийн result массив
  const allPlans = [];
  for (const pj of planJsonList) {
    const list = pj?.getInformation || pj?.GetInformation || pj?.data || [];
    if (Array.isArray(list)) allPlans.push(...list);
  }

  // улсуудаар min price тооцоолно
  const byCode = new Map();
  for (const p of allPlans) {
    const code = readCode(p);
    const name = readName(p);
    if (!code && !name) continue;

    const key = code || name;
    if (!byCode.has(key)) {
      byCode.set(key, {
        code: code || "",
        name: name || key,
        continent: getContinent(code),
        flag: codeToFlag(code),
        fromPrice: null,
      });
    }
    const item = byCode.get(key);
    // name байхгүй үед нөхнө
    if (!item.name && name) item.name = name;
    if (!item.code && code) {
      item.code = code;
      item.flag = codeToFlag(code);
      item.continent = getContinent(code);
    }
    const price = readPrice(p);
    if (price > 0 && (item.fromPrice === null || price < item.fromPrice)) {
      item.fromPrice = price;
    }
  }

  const countries = Array.from(byCode.values())
    .map(c => ({ ...c, fromPrice: c.fromPrice ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { countries, totalCountries: countries.length, totalPlans: allPlans.length };
}

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
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

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // cache
  const now = Date.now();
  if (_cache && now - _cacheAt < CACHE_TTL_MS) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(_cache),
    };
  }

  const USERNAME = process.env.AIRHUB_USERNAME;
  const PASSWORD = process.env.AIRHUB_PASSWORD;
  const PARTNER_CODE = process.env.AIRHUB_PARTNER_CODE;

  if (!USERNAME || !PASSWORD || !PARTNER_CODE) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Missing env vars: AIRHUB_USERNAME, AIRHUB_PASSWORD, AIRHUB_PARTNER_CODE",
      }),
    };
  }

  try {
    const token = await airhubLogin(USERNAME, PASSWORD);

    // Airhub дээр "all countries" 1 удаа татахад хязгаар/timeout гарах магадлалтай.
    // Тиймээс ISO2 кодуудаа жижиг batch-ээр явуулна.
    const batches = chunk(ALL_ISO2, 25);

    const results = [];
    for (const b of batches) {
      // зарим улс Airhub дээр байхгүй байж болно — зүгээр л хоосон ирнэ
      const r = await fetchPlansBatch(token, PARTNER_CODE, b);
      results.push(r);
    }

    const payload = normalize(results);

    _cache = payload;
    _cacheAt = Date.now();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: JSON.stringify(payload),
    };
  } catch (err) {
    return {
      statusCode: err?.status || 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "getCountries failed",
        message: String(err?.message || err),
        details: err?.details || null,
      }),
    };
  }
}
