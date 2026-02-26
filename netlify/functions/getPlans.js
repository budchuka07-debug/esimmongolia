// netlify/functions/getPlans.js  (CommonJS)
// GET /.netlify/functions/getPlans?code=CN

const BASE = "https://api.airhubapp.com";

function res(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(obj),
  };
}

async function airhubLogin(USERNAME, PASSWORD) {
  const r = await fetch(`${BASE}/api/Authentication/UserLogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: USERNAME, password: PASSWORD }),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.token) return { ok: false, status: r.status, data: j };
  return { ok: true, token: j.token, raw: j };
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") return res(200, { ok: true });

  if (event.httpMethod !== "GET") return res(405, { error: "Method Not Allowed" });

  const USERNAME = process.env.AIRHUB_USERNAME;
  const PASSWORD = process.env.AIRHUB_PASSWORD;
  const PARTNER_CODE = process.env.AIRHUB_PARTNER_CODE;

  if (!USERNAME || !PASSWORD || !PARTNER_CODE) {
    return res(500, {
      error: "Missing env vars",
      need: ["AIRHUB_USERNAME", "AIRHUB_PASSWORD", "AIRHUB_PARTNER_CODE"],
    });
  }

  const code = String(event.queryStringParameters?.code || "").trim().toUpperCase();
  if (!code) {
    return res(400, { error: "Missing query: code", example: "/getPlans?code=CN" });
  }

  try {
    // 1) login
    const login = await airhubLogin(USERNAME, PASSWORD);
    if (!login.ok) return res(401, { error: "Airhub login failed", details: login.data });

    // 2) plans
    const body = {
      partnerCode: Number(PARTNER_CODE),
      flag: 6,
      countryCode: "",
      multiplecountrycode: [code],
    };

    const planRes = await fetch(`${BASE}/api/ESIM/GetPlanInformation`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${login.token}` },
      body: JSON.stringify(body),
    });

    const planJson = await planRes.json().catch(() => ({}));

    // 🔥 хамгийн чухал: унасан үед Airhub юу гэж буцааж байгааг харуулна
    if (!planRes.ok) {
      return res(planRes.status, {
        error: "GetPlanInformation failed",
        sent: body,
        details: planJson,
      });
    }

    return res(200, planJson);
  } catch (e) {
    return res(500, { error: "Server error", message: String(e) });
  }
};
