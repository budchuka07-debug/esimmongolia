/**
 * AI Travel Agent — MVP mock
 * Production: proxy to Supabase Edge Function + OpenAI Responses API
 * OPENAI_API_KEY must NOT be in frontend — only in Edge/Netlify env
 */
const { randomUUID } = require("crypto");

function parseIntent(text) {
  const t = String(text).toLowerCase();
  return {
    country: /шанхай|shanghai/.test(t) ? "Хятад / Шанхай" :
      /бээжин|beijing/.test(t) ? "Хятад / Бээжин" :
      /солонгос|korea/.test(t) ? "Солонгос" :
      /япон|japan|tokyo/.test(t) ? "Япон" : "Хятад",
    days: (t.match(/(\d+)\s*хоног/) || [])[1] || "5",
    people: (t.match(/(\d+)\s*хүн/) || [])[1] || "2",
    month: (t.match(/(\d+)\s*сар/) || [])[1] || null,
    wantsDisney: /disneyland|дисней/i.test(text),
    wantsFlight: /нислэг|flight/i.test(text),
    wantsHotel: /буудал|hotel/i.test(text)
  };
}

function buildReply(intent, raw) {
  const days = Number(intent.days);
  const people = Number(intent.people);
  const city = intent.country.includes("/") ? intent.country.split("/")[1].trim() : "Бээжин";

  let r = `Сайн байна уу! ${intent.country} руу ${days} хоног, ${people} хүний аяллын төлөвлөгөө:\n\n`;
  r += `📅 Маршрут:\n`;
  r += `• 1-р өдөр: ${city} ирэх, буудал руу шилжих\n`;
  for (let d = 2; d < days; d++) {
    r += `• ${d}-р өдөр: Үзэх газар, хоол, худалдаа\n`;
  }
  r += `• ${days}-р өдөр: Буцах бэлтгэл\n\n`;

  if (intent.wantsDisney) r += `🎢 Disneyland — 1 өдөр (~450–600 CNY/хүн). Klook эсвэл албан ёсны апп.\n\n`;

  r += `💰 Төсөв: ${days * 300 * people}–${days * 650 * people} CNY (дунд зэрэг)\n`;
  r += `✈️ Нислэг: Улаанбаатар–${city} шууд ~2 цаг\n`;
  r += `🏨 Буудал: Метротой төв — өдөрт ~250–500 CNY\n`;
  r += `📶 eSIM: China eSIM 7–${days} хоног — esimmongolia.com/china.html\n`;
  r += `🚇 Тээвэр: Метро + Alipay/WeChat; Google-д VPN\n`;
  r += `🛂 Виз: Монгол иргэд L виз — visaforchina.org\n\n`;
  r += `Бүрэн захиалах уу? «Захиалгын хүсэлт илгээх» товчийг дарна уу.`;

  return r;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(), body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "POST only" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const message = String(body.message || "").trim();
  if (!message) return json(400, { error: "message required" });

  const sessionId = body.sessionId || randomUUID();
  const intent = parseIntent(message);

  // TODO: if (process.env.OPENAI_API_KEY) { call OpenAI Responses API }
  // TODO: Supabase ai_travel_sessions + ai_travel_messages insert

  const reply = buildReply(intent, message);

  console.log("[ai-travel-agent]", { sessionId, message: message.slice(0, 120) });

  return json(200, {
    sessionId,
    reply,
    locale: "mn",
    intent,
    suggestedAction: "inquiry",
    _mvp: true
  });
};

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

function json(code, data) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json", ...cors() },
    body: JSON.stringify(data)
  };
}
