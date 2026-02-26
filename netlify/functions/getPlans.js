// netlify/functions/getPlans.js
// - /getPlans?code=TH  → зөвхөн тухайн улсын plan-ууд
// ⚠️ code байхгүй бол 400 буцаана (ингэснээр холилдох 100% зогсоно)

const BASE = "https://api.airhubapp.com";

function jsonRes(statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(bodyObj),
  };
}

async function airhubLogin(USERNAME, PASSWORD) {
  const loginRes = await fetch(`${BASE}/api/Authentication/UserLogin`, {
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

// ISO2 код plan дотроос найдвартай унших
function readCode(plan) {
  return String(
    plan.countryCode ||
      plan.CountryCode ||
      plan.country_code ||
      plan.countrycode ||
      plan.Countrycode ||
      plan.iso2 ||
      plan.ISO2 ||
      plan.countryIso2 ||
      plan.CountryIso2 ||
      ""
  )
    .toUpperCase()
    .trim();
}

// Airhub plan татах (single country)
async function fetchPlansOne(token, PARTNER_CODE, code) {
  const planRes = await fetch(`${BASE}/api/ESIM/GetPlanInformation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      partnerCode: Number(PARTNER_CODE),
      flag: 6,
      countryCode: "",            // Airhub заримдаа countryCode-аар буцаахгүй
      multiplecountrycode: [code],// ✅ 1 улсын кодыг энд өгнө
    }),
  });

  const planJson = await planRes.json().catch(() => ({}));
  return { ok: planRes.ok, status: planRes.status, data: planJson };
}

exports.handler = async function handler(event) {
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
    return jsonRes(405, { error: "Method Not Allowed" });
  }

  const USERNAME = process.env.AIRHUB_USERNAME;
  const PASSWORD = process.env.AIRHUB_PASSWORD;
  const PARTNER_CODE = process.env.AIRHUB_PARTNER_CODE;

  if (!USERNAME || !PASSWORD || !PARTNER_CODE) {
    return jsonRes(500, {
      error:
        "Missing env vars: AIRHUB_USERNAME, AIRHUB_PASSWORD, AIRHUB_PARTNER_CODE",
    });
  }

  const code = String(event.queryStringParameters?.code || "")
    .trim()
    .toUpperCase();

  // ✅ Гол хамгаалалт: code байхгүй бол холимог татахгүй
  if (!code) {
    return jsonRes(400, {
      error: "Missing required query: code",
      hint: "Use /.netlify/functions/getPlans?code=TH",
    });
  }

  try {
    const login = await airhubLogin(USERNAME, PASSWORD);
    if (!login.ok) {
      return jsonRes(401, {
        error: "Airhub login failed",
        details: login.data,
      });
    }

    const plans = await fetchPlansOne(login.token, PARTNER_CODE, code);
    if (!plans.ok) {
      return jsonRes(plans.status, {
        error: "GetPlanInformation failed",
        details: plans.data,
      });
    }

    // ✅ Нэмэлт хамгаалалт: Airhub буруу data өгсөн ч server дээрээс шүүж өгнө
    if (Array.isArray(plans.data?.getInformation)) {
      plans.data.getInformation = plans.data.getInformation.filter(
        (p) => readCode(p) === code
      );
    }

    return jsonRes(200, plans.data);
  } catch (err) {
    return jsonRes(500, { error: "Server error", message: String(err) });
  }
};
