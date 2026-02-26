// netlify/functions/getPlans.js
// FEATURED (modal) plan татах зориулалттай.
// - /getPlans?code=CA  → тухайн улсын plan-ууд (Airhub raw response)
// - /getPlans          → default featured кодууд (China/Asia/Global гэх мэт)

const BASE = "https://api.airhubapp.com";

function jsonRes(statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
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

async function fetchPlans(token, PARTNER_CODE, codes) {
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
  return { ok: planRes.ok, status: planRes.status, data: planJson };
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
    return jsonRes(405, { error: "Method Not Allowed" });
  }

  const USERNAME = process.env.AIRHUB_USERNAME;
  const PASSWORD = process.env.AIRHUB_PASSWORD;
  const PARTNER_CODE = process.env.AIRHUB_PARTNER_CODE;

  if (!USERNAME || !PASSWORD || !PARTNER_CODE) {
    return jsonRes(500, {
      error: "Missing env vars: AIRHUB_USERNAME, AIRHUB_PASSWORD, AIRHUB_PARTNER_CODE",
    });
  }

  const code = (event.queryStringParameters?.code || "").trim().toUpperCase();

  // ✅ default featured list (чи хүсвэл энд нэм/хас)
  const defaultCodes = [
    "CN","KR","JP","TH","VN","MY","SG","ID","PH","TW","HK","MO",
    "US","CA","MX","TR","DE","FR","GB","IT","ES"
  ];

  const codes = code ? [code] : defaultCodes;

  try {
    const login = await airhubLogin(USERNAME, PASSWORD);
    if (!login.ok) {
      return jsonRes(401, { error: "Airhub login failed", details: login.data });
    }

    const plans = await fetchPlans(login.token, PARTNER_CODE, codes);
    if (!plans.ok) {
      return jsonRes(plans.status, { error: "GetPlanInformation failed", details: plans.data });
    }

    return jsonRes(200, plans.data);
  } catch (err) {
    return jsonRes(500, { error: "Server error", message: String(err) });
  }
}
