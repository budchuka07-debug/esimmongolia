/**
 * AI Travel Agent — Supabase Edge Function → OpenAI (production)
 * MVP: conversational Mongolian replies + optional CTAs (no auto-booking)
 */
const { randomUUID } = require("crypto");
const consultant = require("./lib/ai-consultant");
const latin = require("./lib/mongolian-latin");

let CHINA_DEST;
try {
  CHINA_DEST = require("../../data/china-destinations.js");
} catch {
  CHINA_DEST = null;
}

const INTD_DESTINATIONS = [
  { keys: ["эрээн", "erenhot", "eren hot", "erian", "erlen", "erlen hot"], country: "Хятад", city: "Эрээн", city_id: "erenhot" },
  { keys: ["солонгос", "solongos", "korea", "south korea"], country: "Солонгос", city: null, city_id: null },
  { keys: ["сеул", "seoul", "soul", "incheon"], country: "Солонгос", city: "Сөүл", city_id: "seoul" },
  { keys: ["пусан", "busan", "pusan"], country: "Солонгос", city: "Пусан", city_id: "busan" },
  { keys: ["япон", "yapon", "japan"], country: "Япон", city: null, city_id: null },
  { keys: ["токио", "tokyo", "tokio"], country: "Япон", city: "Токио", city_id: "tokyo" },
  { keys: ["осака", "osaka"], country: "Япон", city: "Осака", city_id: "osaka" },
  { keys: ["тайланд", "tailand", "thailand", "tai land"], country: "Тайланд", city: null, city_id: null },
  { keys: ["бангкок", "bangkok", "bankok"], country: "Тайланд", city: "Бангкок", city_id: "bangkok" },
  { keys: ["пхукет", "phuket"], country: "Тайланд", city: "Пхукет", city_id: "phuket" },
  { keys: ["вьетнам", "vietnam", "viet nam"], country: "Вьетнам", city: null, city_id: null },
  { keys: ["ханой", "hanoi", "ha noi"], country: "Вьетнам", city: "Ханой", city_id: "hanoi" },
  { keys: ["хошимин", "ho chi minh", "hochiminh", "saigon"], country: "Вьетнам", city: "Хошимин", city_id: "ho_chi_minh" },
  { keys: ["сингапур", "singapore", "singapor"], country: "Сингапур", city: "Сингапур", city_id: "singapore" },
  { keys: ["бали", "bali"], country: "Индонез", city: "Бали", city_id: "bali" },
  { keys: ["турк", "turk", "turkey"], country: "Турк", city: null, city_id: null },
  { keys: ["стамбул", "istanbul", "stambul"], country: "Турк", city: "Стамбул", city_id: "istanbul" },
  { keys: ["дубай", "dubai", "dubay"], country: "ОАЭ", city: "Дубай", city_id: "dubai" },
  { keys: ["хятад", "hyatad", "khyatad", "china"], country: "Хятад", city: null, city_id: null }
];

let DESTINATIONS;
try {
  DESTINATIONS = [
    ...(CHINA_DEST?.buildAiDestinations?.() || []),
    ...INTD_DESTINATIONS
  ];
} catch (err) {
  console.error("[ai-travel-agent] destination seed failed", err);
  DESTINATIONS = [...INTD_DESTINATIONS];
}

function getChinaProfile(cityId) {
  return cityId && CHINA_DEST?.getCity ? CHINA_DEST.getCity(cityId) : null;
}

function normalizeInput(text) {
  return latin.normalizeLatinMongolian(text, CHINA_DEST);
}

function matchDestination(text) {
  const hay = latin.searchBlob(text, CHINA_DEST);
  let best = null;
  let bestLen = 0;
  for (const d of DESTINATIONS) {
    for (const k of d.keys || []) {
      const key = String(k).toLowerCase();
      if (!key || key.length < 2) continue;
      if (hay.includes(key) && key.length > bestLen) {
        best = d;
        bestLen = key.length;
      }
    }
  }
  return best;
}

function parseIntent(text) {
  const t = normalizeInput(text);
  const hay = latin.searchBlob(text, CHINA_DEST);

  const dest = matchDestination(text);
  const country = dest?.country || null;
  const city = dest?.city || null;
  const city_id = dest?.city_id || null;

  const days = (t.match(/(\d+)\s*хоног/) || hay.match(/(\d+)\s*хоног/) || [])[1] || null;
  const people = (t.match(/(\d+)\s*хүн/) || hay.match(/(\d+)\s*хүн/) || [])[1] || null;
  const month = (t.match(/(\d{1,2})\s*сар/) || hay.match(/(\d{1,2})\s*сар/) || [])[1] || null;
  const day = (t.match(/(\d{1,2})\s*-?нд/) || t.match(/сарын\s*(\d{1,2})/) || [])[1] || null;
  const budget = (t.match(/(\d+)\s*(сая|мянга|төгрөг|mnt|юань|cny)/i) ||
    hay.match(/(\d+)\s*(сая|мянга|төгрөг|mnt|юань|cny)/i) || [])[1] || null;

  return {
    country,
    city,
    city_id,
    days: days ? Number(days) : null,
    people: people ? Number(people) : null,
    month,
    day,
    budget,
    wantsDisney: /disneyland|дисней/i.test(hay),
    wantsEsim: /esim|интернэт|интернет/i.test(hay),
    wantsFlight: /нислэг|нисэх|flight/i.test(hay),
    wantsHotel: /буудал|hotel|зочид/i.test(hay),
    wantsTrain: /галт тэрэг|train|12306/i.test(hay),
    wantsVisa: /виз|visa/i.test(hay),
    wantsFood: /хоол|food/i.test(hay),
    wantsTransport: /метро|тээвэр|transport/i.test(hay),
    wantsCost: /зардал|төсөв|cost|price|үн|une/i.test(hay),
    wantsInsurance: /даатгал|insurance/i.test(hay),
    hasChildren: /хүүхэд|child|kids/i.test(hay),
    hasElderly: /ахмад|том хүн|elderly/i.test(hay),
    hotelLevel: /5 од|5 star|luxury/i.test(hay) ? 5 :
      /4 од|4 star|mid/i.test(hay) ? 4 :
      /2 од|budget|хямд/i.test(hay) ? 2 : null,
    purpose: /худалдаа|business|бизнес/i.test(hay) ? "бизнес" :
      /сургалт|study/i.test(hay) ? "сургалт" :
      /гэр бүл|family/i.test(hay) ? "гэр бүл" : "аялал"
  };
}

function mergeIntent(history, message) {
  const base = parseIntent(message);
  const all = (history || [])
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");
  const merged = parseIntent(`${all} ${message}`);
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
  return latin.latinGreeting(t) ||
    /^(сайн уу|сайн байна уу|сайн байна|hello|hi|hey|баярлалаа|thanks)[!.?\s]*$/i.test(t);
}

function isVague(msg) {
  return latin.latinVague(msg) || (() => {
    const t = normalizeInput(msg);
    return /яаж|юу хийх|төлөвлө|зөвлө|санал|тусла/i.test(t) && t.length < 80;
  })();
}

function enrichIntent(intent, message) {
  const out = { ...intent };
  const hay = latin.searchBlob(message, CHINA_DEST);
  if (!out.city_id) {
    const dest = matchDestination(message);
    if (dest) {
      out.country = dest.country || out.country;
      out.city = dest.city || out.city;
      out.city_id = dest.city_id || out.city_id;
    }
  }
  if (!out.days) {
    const dayMatch = hay.match(/(\d+)\s*хоног/) || message.match(/(\d+)\s*(honog|khonog)/i);
    if (dayMatch) out.days = Number(dayMatch[1]);
    else if (/\b(honog|khonog|хоног)\b/i.test(hay) && (out.city || out.city_id)) out.days = 5;
  }
  if (!out.month) {
    const monthMatch = hay.match(/(\d{1,2})\s*сар/) || message.match(/(\d{1,2})\s*(sar|sard|sariin)/i);
    if (monthMatch) out.month = monthMatch[1];
  }
  if (!out.people && (out.city || out.city_id)) {
    const peopleMatch = hay.match(/(\d+)\s*хүн/) || message.match(/(\d+)\s*(hun|khun|huun)/i);
    if (peopleMatch) out.people = Number(peopleMatch[1]);
    else out.people = 2;
  }
  if (!out.days && out.month && (out.city || out.city_id)) {
    out.days = 5;
  }
  return out;
}

function withDefaults(intent) {
  const out = {
    ...intent,
    days: Number(intent.days) || 5,
    people: Number(intent.people) || 2
  };
  if (out.city_id && !out.city) {
    const profile = getChinaProfile(out.city_id);
    if (profile?.name_mn) out.city = profile.name_mn;
  }
  return out;
}

function buildConsultantOrFollowUp(intent, message) {
  const resolved = withDefaults(intent);
  if (resolved.city_id || resolved.city) {
    const full = consultant.buildConsultantReply(resolved, message);
    if (full) return full;
  }
  const missing = missingFields(resolved);
  if (missing.length) return consultant.buildFollowUpReply(resolved, missing);
  return consultant.buildGreetingReply();
}

function missingFields(intent) {
  const m = [];
  if (!intent.country && !intent.city) m.push("destination");
  if (!intent.days && !intent.month && !intent.wantsCost) m.push("dates");
  if (!intent.people && !(intent.city && (intent.days || intent.month))) m.push("people");
  return m;
}

function buildReply(message, history) {
  const intent = enrichIntent(mergeIntent(history, message), message);
  const hay = latin.searchBlob(message, CHINA_DEST);

  if (isGreeting(message)) {
    return consultant.buildGreetingReply();
  }

  if (intent.wantsInsurance || /даатгал|insurance/i.test(hay)) {
    return consultant.buildInsuranceReply(intent);
  }

  const full = consultant.buildConsultantReply(withDefaults(intent), message);
  if (full) return full;

  const topic = consultant.buildTopicReply(intent, message);
  if (topic && !/маршрут|төлөвлө|marshrut|tuluvlolt|plan/i.test(hay)) {
    return topic;
  }

  const missing = missingFields(intent);
  if (missing.length > 0 && (isVague(message) || missing.length >= 2)) {
    return consultant.buildFollowUpReply(withDefaults(intent), missing);
  }

  return buildConsultantOrFollowUp(intent, message);
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

  let result;
  try {
    result = buildReply(message, history);
  } catch (err) {
    console.error("[ai-travel-agent] buildReply failed", err);
    result = consultant.buildGreetingReply();
    result.reply = `${result.reply}\n\n(Түр алдаа гарлаа — дахин асуугаарай.)`;
  }

  if (!result?.reply) {
    result = consultant.buildGreetingReply();
  }

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
