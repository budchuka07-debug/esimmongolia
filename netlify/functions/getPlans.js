// netlify/functions/getPlans.js

export async function handler(event) {
  // зөвхөн GET зөвшөөрнө
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const BASE = "https://api.airhubapp.com";

  // ⚠️ Эднийг Netlify Environment variables дээр тавина
  const USERNAME = process.env.AIRHUB_USERNAME; // ж: budchuka07@gmail.com
  const PASSWORD = process.env.AIRHUB_PASSWORD; // Airhub password
  const PARTNER_CODE = process.env.AIRHUB_PARTNER_CODE; // ж: 776059345

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
    // 1) Login → token авах
    const loginRes = await fetch(`${BASE}/api/Authentication/UserLogin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: USERNAME, password: PASSWORD }),
    });

    const loginJson = await loginRes.json();
    if (!loginRes.ok || !loginJson?.token) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Airhub login failed",
          details: loginJson,
        }),
      };
    }

    const token = loginJson.token;

    // 2) Plans татах — энд хүссэн country codes-оо нэм/хасаж болно
    // “Бүгдийг” авах хамгийн зөв нь олон кодоор багцлах (API хязгаартай байж магадгүй)
    const codes = [
      "CN","KR","JP","TH","VN","MY","SG","ID","PH","TW","HK","MO",
      "US","CA","MX","TR","DE","FR"
    ];

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

    const planJson = await planRes.json();

    return {
      statusCode: planRes.ok ? 200 : planRes.status,
      headers: {
        "Content-Type": "application/json",
        // Static site-оос дуудах тул CORS нэмлээ
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify(planJson),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error", message: String(err) }),
    };
  }
}
