// netlify/functions/getPlans.js

const BASE = "https://api.airhubapp.com";

function res(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(obj),
  };
}

async function airhubLogin(USERNAME, PASSWORD) {

  const r = await fetch(`${BASE}/api/Authentication/UserLogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: USERNAME,
      password: PASSWORD
    }),
  });

  const j = await r.json();
  const token =
    j?.token ||
    j?.data?.token ||
    j?.data?.Token ||
    j?.Token;

  if (!token) {
    return { ok: false };
  }

  return { ok: true, token };
}

function extractPlans(payload) {

  if (Array.isArray(payload)) return payload;

  if (!payload) return [];

  for (const k of ["getInformation","GetInformation","data","Data","plans","Plans"]) {
    if (Array.isArray(payload[k])) {
      return payload[k];
    }
  }

  return [];
}

exports.handler = async (event) => {

  const USERNAME = process.env.AIRHUB_USERNAME;
  const PASSWORD = process.env.AIRHUB_PASSWORD;
  const PARTNER_CODE = process.env.AIRHUB_PARTNER_CODE;

  const code = (event.queryStringParameters?.code || "").toUpperCase();
  const group = (event.queryStringParameters?.group || "").toLowerCase();

  try {

    const login = await airhubLogin(USERNAME, PASSWORD);

    if (!login.ok) {
      return res(401, { error: "Airhub login failed" });
    }

    let body;

    if (code) {

      body = {
        partnerCode: Number(PARTNER_CODE),
        flag: 6,
        countryCode: code,
        multiplecountrycode: []
      };

    } else {

      body = {
        partnerCode: Number(PARTNER_CODE),
        flag: 6,
        countryCode: "",
        multiplecountrycode: []
      };

    }

    const r = await fetch(`${BASE}/api/ESIM/GetPlanInformation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${login.token}`
      },
      body: JSON.stringify(body)
    });

    const j = await r.json();

    const plans = extractPlans(j);

    if (!group) {

      return res(200, {
        ok: true,
        plans
      });

    }

    const filtered = plans.filter(p => {

      const text = (
        p.countryName ||
        p.country ||
        p.areaName ||
        p.regionName ||
        p.zoneName ||
        p.packageName ||
        p.planName ||
        p.name ||
        p.title ||
        ""
      ).toLowerCase();

      if (group === "asia") {

        return (
          text.includes("asia") ||
          text.includes("asia pacific") ||
          text.includes("asia-pacific") ||
          text.includes("apac")
        );

      }

      if (group === "global") {

        return (
          text.includes("global") ||
          text.includes("world") ||
          text.includes("worldwide")
        );

      }

      return false;

    });

    return res(200, {
      ok: true,
      group,
      count: filtered.length,
      plans: filtered
    });

  } catch (e) {

    return res(500, {
      error: "Server error",
      message: String(e)
    });

  }

};
