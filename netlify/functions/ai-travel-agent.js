/**
 * AI Travel Agent — Supabase Edge Function → OpenAI (production)
 * MVP: conversational Mongolian replies + optional CTAs (no auto-booking)
 */
const { randomUUID } = require("crypto");
const consultant = require("./lib/ai-consultant");

let CHINA_DEST;
try {
  CHINA_DEST = require("../../data/china-destinations.js");
} catch {
  CHINA_DEST = null;
}

const INTL_DESTINATIONS = [
  { keys: ["эрээн", "erenhot", "eren hot", "erian"], country: "Хятад", city: "Эрээн", city_id: "erenhot" },
  { keys: ["солонгос", "korea", "сеул", "seoul"], country: "Солонгос", city: "Сөүл", city_id: "seoul" },
  { keys: ["пусан", "busan"], country: "Солонгос", city: "Пусан", city_id: "busan" },
  { keys: ["япон", "japan", "tokyo", "токио"], country: "Япон", city: "Токио", city_id: "tokyo" },
  { keys: ["осака", "osaka"], country: "Япон", city: "Осака", city_id: "osaka" },
  { keys: ["тайланд", "thailand", "bangkok", "бангкок"], country: "Тайланд", city: "Бангкок", city_id: "bangkok" },
  { keys: ["пхукет", "phuket"], country: "Тайланд", city: "Пхукет", city_id: "phuket" },
  { keys: ["вьетнам", "vietnam", "hanoi", "ханой"], country: "Вьетнам", city: "Ханой", city_id: "hanoi" },
  { keys: ["хошимин", "ho chi minh", "saigon"], country: "Вьетнам", city: "Хошимин", city_id: "ho_chi_minh" },
  { keys: ["сингапур", "singapore"], country: "Сингапур", city: "Сингапур", city_id: "singapore" },
  { keys: ["бали", "bali"], country: "Индонез", city: "Бали", city_id: "bali" },
  { keys: ["турк", "turkey", "istanbul"], country: "Турк", city: "Стамбул", city_id: "istanbul" },
  { keys: ["дубай", "dubai"], country: "ОАЭ", city: "Дубай", city_id: "dubai" },
  { keys: ["хятад", "china"], country: "Хятад", city: null, city_id: null }
];

const DESTINATIONS = [
  ...(CHINA_DEST?.buildAiDestinations?.() || []),
  ...INTL_DESTINATIONS
];

function getChinaProfile(cityId) {
  return cityId && CHINA_DEST?.getCity ? CHINA_DEST.getCity(cityId) : null;
}

/** Latin keyboard Mongolian → Cyrillic hints for intent parsing */
function normalizeInput(text) {
  let t = String(text || "").toLowerCase();

  const cityAliases = [
    [/\bhoh?\s*ho?t\b/g, "хөх хот"],
    [/\bhuh\s*hot\b/g, "хөх хот"],
    [/\bbee\s*jin\b/g, "бээжин"],
    [/\bshan\s*xai\b/g, "шанхай"],
    [/\beren\s*hot\b/g, "эрээн"],
    [/\bgu[a-z]*\s*zhou\b/g, "гуанжоу"]
  ];
  for (const [re, repl] of cityAliases) t = t.replace(re, repl);

  t = t.replace(/(\d+)\s*h(ü|u{1,2}?)n\b/gi, "$1 хүн");
  t = t.replace(/(\d+)\s*hon?og\b/gi, "$1 хоног");
  t = t.replace(/(\d+)\s*khonog\b/gi, "$1 хоног");
  t = t.replace(/\b(zardal|zartal|zardaliin)\b/gi, "зардал");
  t = t.replace(/\b(tusev|tosov|tösöv)\b/gi, "төсөв");
  t = t.replace(/\b(yavah|yvah|yaah)\b/gi, "явах");
  t = t.replace(/\b(honog|khonog)\b/gi, "хоног");

  return t;
}

function parseIntent(text) {
  const t = normalizeInput(text);
  let country = null;
  let city = null;
  let city_id = null;
  for (const d of DESTINATIONS) {
    if (d.keys.some((k) => t.includes(k))) {
      country = d.country;
      city = d.city;
      city_id = d.city_id || null;
      break;
    }
  }
  const days = (t.match(/(\d+)\s*хоног/) || [])[1] || null;
  const people = (t.match(/(\d+)\s*хүн/) || [])[1] || null;
  const month = (t.match(/(\d{1,2})\s*сар/) || [])[1] || null;
  const day = (t.match(/(\d{1,2})\s*-?нд/) || t.match(/сарын\s*(\d{1,2})/) || [])[1] || null;
  const budget = (t.match(/(\d+)\s*(сая|мянга|төгрөг|mnt|юань|cny)/i) || [])[1] || null;

  return {
    country,
    city,
    city_id,
    days: days ? Number(days) : null,
    people: people ? Number(people) : null,
    month,
    day,
    budget,
    wantsDisney: /disneyland|дисней/i.test(t),
    wantsEsim: /esim|интернэт|интернет/i.test(t),
    wantsFlight: /нислэг|flight|нисэх/i.test(t),
    wantsHotel: /буудал|hotel|зочид/i.test(t),
    wantsTrain: /галт тэрэг|train|12306/i.test(t),
    wantsVisa: /виз|visa/i.test(t),
    wantsFood: /хоол|food/i.test(t),
    wantsTransport: /метро|тээвэр|transport/i.test(t),
    wantsCost: /зардал|төсөв|zardal|tusev|cost|price|une|үн/i.test(t),
    wantsInsurance: /даатгал|insurance/i.test(t),
    hasChildren: /хүүхэд|child|kids/i.test(t),
    hasElderly: /ахмад|tom hun|том хүн|elderly/i.test(t),
    hotelLevel: /5 од|5 star|luxury/i.test(t) ? 5 :
      /4 од|4 star|mid/i.test(t) ? 4 :
      /2 од|budget|хямд/i.test(t) ? 2 : null,
    purpose: /худалдаа|business|бизнес/i.test(t) ? "бизнес" :
      /сургалт|study/i.test(t) ? "сургалт" :
      /гэр бүл|family/i.test(t) ? "гэр бүл" : "аялал"
  };
}

function mergeIntent(history, message) {
  const base = parseIntent(message);
  const all = (history || [])
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");
  const merged = parseIntent(all + " " + message);
  return {
    country: base.country || merged.country,
    city: base.city || merged.city,
    city_id: base.city_id || merged.city_id,
    days: base.days || merged.days,
    people: base.people || merged.people,
    month: base.month || merged.month,
    day: base.day || merged.day,
    budget: base.budget || merged.budget,
    wantsDisney: base.wantsDisney || merged.wantsDisney,
    wantsEsim: base.wantsEsim || merged.wantsEsim,
    wantsFlight: base.wantsFlight || merged.wantsFlight,
    wantsHotel: base.wantsHotel || merged.wantsHotel,
    wantsTrain: base.wantsTrain || merged.wantsTrain,
    wantsVisa: base.wantsVisa || merged.wantsVisa,
    wantsFood: base.wantsFood || merged.wantsFood,
    wantsTransport: base.wantsTransport || merged.wantsTransport,
    wantsCost: base.wantsCost || merged.wantsCost,
    wantsInsurance: base.wantsInsurance || merged.wantsInsurance,
    hasChildren: base.hasChildren || merged.hasChildren,
    hasElderly: base.hasElderly || merged.hasElderly,
    hotelLevel: base.hotelLevel || merged.hotelLevel,
    purpose: base.purpose !== "аялал" ? base.purpose : merged.purpose
  };
}

function isGreeting(msg) {
  const t = msg.trim().toLowerCase();
  return /^(сайн уу|сайн байна уу|hello|hi|hey|баярлалаа|thanks)[!.?\s]*$/i.test(t) ||
    (t.length < 20 && /сайн уу|сайн байна/i.test(t));
}

function isVague(msg) {
  const t = msg.toLowerCase();
  return /яаж|юу хийх|төлөвлө|зөвлө|санал|help|тусла/i.test(t) && t.length < 80;
}

function missingFields(intent) {
  const m = [];
  if (!intent.country && !intent.city) m.push("destination");
  if (!intent.days && !intent.month && !intent.wantsCost) m.push("dates");
  if (!intent.people) m.push("people");
  return m;
}

function buildReply(message, history) {
  const intent = mergeIntent(history, message);

  if (isGreeting(message)) {
    return consultant.buildGreetingReply();
  }

  if (intent.wantsInsurance || /даатгал/i.test(message)) {
    return consultant.buildInsuranceReply(intent);
  }

  const full = consultant.buildConsultantReply(intent, message);
  if (full) return full;

  const topic = consultant.buildTopicReply(intent, message);
  if (topic && !/маршрут|төлөвлө/i.test(message)) {
    return topic;
  }

  const missing = missingFields(intent);
  if (missing.length > 0) {
    return consultant.buildFollowUpReply(intent, missing);
  }

  return consultant.buildConsultantReply(
    { ...intent, city: intent.city || "Шанхай", city_id: intent.city_id || "shanghai", days: intent.days || 5, people: intent.people || 2 },
    message
  ) || consultant.buildGreetingReply();
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
  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];

  const result = buildReply(message, history);

  console.log("[ai-travel-agent]", { sessionId, len: message.length });

  return json(200, {
    sessionId,
    reply: result.reply,
    ctas: result.ctas || [],
    quickReplies: result.quickReplies || [],
    cards: result.cards || [],
    context: result.context || {},
    locale: "mn",
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
