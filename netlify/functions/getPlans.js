// netlify/functions/getPlans.js
// Supports:
//   /.netlify/functions/getPlans?code=CN
//   /.netlify/functions/getPlans?group=asia
//   /.netlify/functions/getPlans?group=global

const BASE = "https://api.airhubapp.com";

const GROUP_CODES = {
  asia: ["KH", "ID", "MY", "SG", "TH", "VN", "HK", "TW"],
  global: ["US", "GB", "DE", "FR", "JP", "KR", "SG", "AE", "AU", "CA"]
};

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
  const token = j?.token || j?.data?.token || j?.data?.Token || j?.Token;
  if (!r.ok || !token) return { ok: false, status: r.status, data: j };
  return { ok: true, token, raw: j };
}

function extractPlans(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of ["getInformation", "GetInformation", "data", "Data", "plans", "Plans", "result", "Result"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  for (const key of Object.keys(payload)) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
}

function normalizeText(v) {
  return String(v || "").trim().toLowerCase();
}

function matchesGroup(plan, group) {
  const text = [
    plan?.countryName,
    plan?.Country,
    plan?.country,
    plan?.areaName,
    plan?.regionName,
    plan?.zoneName,
    plan?.packageName,
    plan?.planName,
    plan?.name,
    plan?.title,
    plan?.operatorName,
  ].filter(Boolean).join(" ").toLowerCase();

  if (group === "asia") {
    return text.includes("asia") || text.includes("asia pacific") || text.includes("asia-pacific");
  }
  if (group === "global") {
    return text.includes("global") || text.includes("world");
  }
  return false;
}

exports.handler = async (event) => {
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
  const group = normalizeText(event.queryStringParameters?.group);

  if (!code && !group) {
    return res(400, {
      error: "Missing query",
      examples: [
        "/.netlify/functions/getPlans?code=CN",
        "/.netlify/functions/getPlans?group=asia",
        "/.netlify/functions/getPlans?group=global"
      ]
    });
  }

  const requestedCodes = code ? [code] : (GROUP_CODES[group] || []);
  if (!requestedCodes.length) {
    return res(400, { error: "Unsupported group", group });
  }

  try {
    const login = await airhubLogin(USERNAME, PASSWORD);
    if (!login.ok) return res(401, { error: "Airhub login failed", details: login.data });

    const body = {
      partnerCode: Number(PARTNER_CODE),
      flag: 6,
      countryCode: "",
      multiplecountrycode: requestedCodes,
    };

    const planRes = await fetch(`${BASE}/api/ESIM/GetPlanInformation`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${login.token}` },
      body: JSON.stringify(body),
    });

    const planJson = await planRes.json().catch(() => ({}));
    if (!planRes.ok) {
      return res(planRes.status, {
        error: "GetPlanInformation failed",
        sent: body,
        details: planJson,
      });
    }

    const plans = extractPlans(planJson);
    if (!group) {
      return res(200, { ok: true, mode: "code", code, plans, raw: planJson });
    }

    const filtered = plans.filter((p) => matchesGroup(p, group));
    return res(200, {
      ok: true,
      mode: "group",
      group,
      requestedCodes,
      count: filtered.length,
      plans: filtered,
      raw: planJson,
    });
  } catch (e) {
    return res(500, { error: "Server error", message: String(e) });
  }
};
