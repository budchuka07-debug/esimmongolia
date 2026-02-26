// netlify/functions/getPlans.js
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
  return { ok: true, token: loginJson.token, raw: loginJson };
}

function readCode(plan) {
  return String(
    plan.countryCode ||
      plan.CountryCode ||
      plan.country_code ||
      plan.countrycode ||
      plan.iso2 ||
      plan.ISO2 ||
      plan.countryIso2 ||
      plan.CountryIso2 ||
      ""
  )
    .toUpperCase()
    .trim();
}

async function fetchPlansOne(token, PARTNER_CODE, code, flag) {
  const planRes = await fetch(`${BASE}/api/ESIM/GetPlanInformation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      partnerCode: Number(PARTNER_CODE),
      countryCode: code, // ✅ заавал 2 үсэгтэй код
      flag: flag,        // ✅ 1 эсвэл 2
    }),
  });

  const planJson = await planRes.json().catch(() => ({}));
  return { ok: planRes.ok, status: planRes.status, data: planJson };
}

exports.handler = async function handler(event) {
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

  if (!code) {
    return jsonRes(400, {
      error: "Missing required query: code",
      hint: "Use /.netlify/functions/getPlans?code=TH",
    });
  }

  try {
    const login = await airhubLogin(USERNAME, PASSWORD);
    if (!login.ok) {
      return jsonRes(401, { error: "Airhub login failed", details: login.data });
    }

    // ✅ эхлээд flag=1, хоосон бол flag=2
    let plans = await fetchPlansOne(login.token, PARTNER_CODE, code, 1);

    // Хэрвээ ok боловч хоосон байвал flag=2 гэж дахин туршина
    const list1 = Array.isArray(plans.data?.getInformation)
      ? plans.data.getInformation
      : [];

    if (plans.ok && list1.length === 0) {
      const plans2 = await fetchPlansOne(login.token, PARTNER_CODE, code, 2);
      const list2 = Array.isArray(plans2.data?.getInformation)
        ? plans2.data.getInformation
        : [];
      if (plans2.ok && list2.length > 0) plans = plans2;
    }

    if (!plans.ok) {
      return jsonRes(plans.status, {
        error: "GetPlanInformation failed",
        details: plans.data,
      });
    }

    // хамгаалалтын filter
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
