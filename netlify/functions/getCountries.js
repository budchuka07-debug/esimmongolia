// netlify/functions/getCountries.js
// ✅ index.html-тэй таарах JSON: { countries: [...] } буцаана
// ✅ Эхлээд Airhub-аас 1 удаа бүх plan авахыг оролдож, болохгүй бол fallback batch хийнэ

const BASE = "https://api.airhubapp.com";

function jsonRes(statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
    body: JSON.stringify(bodyObj),
  };
}

async function airhubLogin(email, password) {
  const res = await fetch(`${BASE}/api/Account/Login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  const token = data?.data?.token;
  return { ok: !!token, token, raw: data };
}

async function fetchPlansMulti(token, partnerCode, codes) {
  const res = await fetch(`${BASE}/api/ESIM/GetPlanInformation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      partnerCode,
      multiplecountrycode: codes, // [] байвал зарим аккаунт дээр бүгдийг буцаадаг
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function uniqCountriesFromPlans(plans) {
  const m = new Map();
  for (const p of plans) {
    const code = String(p.countryCode || "").toUpperCase().trim();
    const name = String(p.countryName || "").trim();
    if (!code) continue;
    if (!m.has(code)) {
      m.set(code, { code, name: name || code });
    }
  }
  return Array.from(m.values()).sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

exports.handler = async () => {
  try {
    const EMAIL = process.env.AIRHUB_USERNAME || process.env.AIRHUB_EMAIL;
    const PASSWORD = process.env.AIRHUB_PASSWORD;
    const PARTNER_CODE = process.env.AIRHUB_PARTNER_CODE;

    if (!EMAIL || !PASSWORD || !PARTNER_CODE) {
      return jsonRes(500, { error: "Missing env vars", need: ["AIRHUB_USERNAME(or AIRHUB_EMAIL)", "AIRHUB_PASSWORD", "AIRHUB_PARTNER_CODE"] });
    }

    // 1) Login
    const login = await airhubLogin(EMAIL, PASSWORD);
    if (!login.ok) return jsonRes(500, { error: "Airhub login failed" });

    const token = login.token;

    // 2) Fast path: 1 удаа бүгдийг авах оролдлого
    const one = await fetchPlansMulti(token, PARTNER_CODE, []);
    let plans = Array.isArray(one?.data?.data?.getInformation) ? one.data.data.getInformation : [];

    // 3) Fallback: хэрвээ empty ирвэл (зарим аккаунт дээр [] ажиллахгүй)
    if (!plans.length) {
      // ⚠️ Timeout-аас хамгаалж цөөн batch-ээр (жишээ 120 код хүртэл)
      // Доорхи ISO жагсаалтыг хамгийн түгээмэлүүдээр эхлүүлж байна (чи хүсвэл өсгөж болно)
      const ISO = [
        "CN","KR","JP","TH","VN","SG","MY","ID","PH","HK","MO","TW","TR",
        "AE","SA","QA","KW","OM","BH","US","CA","GB","DE","FR","IT","ES",
        "NL","BE","CH","SE","NO","DK","FI","RU","KZ","AU","NZ"
      ];
      const BATCH = 15;
      const all = [];
      for (let i = 0; i < ISO.length; i += BATCH) {
        const codes = ISO.slice(i, i + BATCH);
        const r = await fetchPlansMulti(token, PARTNER_CODE, codes);
        const arr = Array.isArray(r?.data?.data?.getInformation) ? r.data.data.getInformation : [];
        all.push(...arr);
      }
      plans = all;
    }

    const countries = uniqCountriesFromPlans(plans);

    return jsonRes(200, {
      countries,
      totalCountries: countries.length,
      totalPlans: plans.length,
    });
  } catch (e) {
    return jsonRes(500, { error: "Server error", message: String(e) });
  }
};
