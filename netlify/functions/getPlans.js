// netlify/functions/getPlans.js  (CommonJS)

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

  // Таны одоогийн код j?.token гэж шалгаж байгаа
  // Airhub response өөр бүтэцтэй байж болох тул арай уян хатан шалгав
  const token =
    j?.token ||
    j?.data?.token ||
    j?.data?.Token ||
    j?.Token;

  if (!r.ok || !token) {
    return { ok: false, status: r.status, data: j };
  }

  return { ok: true, token, raw: j };
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
  const group = String(event.queryStringParameters?.group || "").trim().toLowerCase();

  if (!code && !group) {
    return res(400, {
      error: "Missing query",
      examples: [
        "/.netlify/functions/getPlans?code=CN",
        "/.netlify/functions/getPlans?group=asia",
        "/.netlify/functions/getPlans?group=global"
      ],
    });
  }

  try {
    // 1) login
    const login = await airhubLogin(USERNAME, PASSWORD);
    if (!login.ok) {
      return res(401, { error: "Airhub login failed", details: login.data });
    }

    // 2) plans
    const body = {
      partnerCode: Number(PARTNER_CODE),
      flag: 6,
      countryCode: "",
      multiplecountrycode: code ? [code] : [],
    };

    const planRes = await fetch(`${BASE}/api/ESIM/GetPlanInformation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${login.token}`,
      },
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

    // Airhub буцааж байгаа массивыг олно
    const rawPlans =
      planJson?.data ||
      planJson?.result ||
      planJson?.plans ||
      [];

    // 3) Asia / Global бол response дотроос шүүнэ
    if (group === "asia" || group === "global") {
      const filtered = rawPlans.filter((p) => {
        const text = [
          p?.countryName,
          p?.country,
          p?.areaName,
          p?.regionName,
          p?.zoneName,
          p?.packageName,
          p?.planName,
          p?.displayName,
          p?.title,
          p?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (group === "asia") {
          return text.includes("asia");
        }

        if (group === "global") {
          return text.includes("global") || text.includes("world");
        }

        return false;
      });

      return res(200, {
        ok: true,
        mode: group,
        count: filtered.length,
        data: filtered,
      });
    }

    // 4) Энгийн улс
    return res(200, {
      ok: true,
      mode: "code",
      code,
      data: rawPlans,
    });
  } catch (e) {
    return res(500, { error: "Server error", message: String(e) });
  }
};
