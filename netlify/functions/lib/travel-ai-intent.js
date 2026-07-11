/**
 * Parse natural Mongolian travel questions into structured intent.
 */
const latin = require("./mongolian-latin");

let CHINA_DEST;
try {
  CHINA_DEST = require("../../../data/china-destinations.js");
} catch {
  CHINA_DEST = null;
}

const CITY_ALIASES = [
  { keys: ["шанхай", "shanghai", "shanhai"], city: "Шанхай", city_id: "shanghai", country: "china", country_mn: "Хятад" },
  { keys: ["бээжин", "beijing", "peking"], city: "Бээжин", city_id: "beijing", country: "china", country_mn: "Хятад" },
  { keys: ["хөх хот", "hohhot", "huhehaote"], city: "Хөх хот", city_id: "hohhot", country: "china", country_mn: "Хятад" },
  { keys: ["сөүл", "seoul", "soul"], city: "Сөүл", city_id: "seoul", country: "korea", country_mn: "Солонгос" },
  { keys: ["токио", "tokyo", "tokio"], city: "Токио", city_id: "tokyo", country: "japan", country_mn: "Япон" },
  { keys: ["бангкок", "bangkok"], city: "Бангкок", city_id: "bangkok", country: "thailand", country_mn: "Тайланд" },
  { keys: ["ханой", "hanoi"], city: "Ханой", city_id: "hanoi", country: "vietnam", country_mn: "Вьетнам" },
  { keys: ["сингапур", "singapore"], city: "Сингапур", city_id: "singapore", country: "singapore", country_mn: "Сингапур" }
];

function parseMntNumber(raw) {
  if (!raw) return null;
  const n = Number(String(raw).replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function matchCity(text) {
  const hay = latin.searchBlob(text, CHINA_DEST).toLowerCase();
  let best = null;
  let bestLen = 0;
  for (const c of CITY_ALIASES) {
    for (const k of c.keys) {
      if (hay.includes(k) && k.length > bestLen) {
        best = c;
        bestLen = k.length;
      }
    }
  }
  return best;
}

function parseBudget(text) {
  const range = text.match(/(\d[\d,\.]*)\s*[-–—]\s*(\d[\d,\.]*)\s*(?:төгрөг|₮|mnt)?/i);
  if (range) {
    return { budget_min: parseMntNumber(range[1]), budget_max: parseMntNumber(range[2]) };
  }
  const single = text.match(/(\d[\d,\.]*)\s*(?:төгрөг|₮|mnt)/i);
  if (single) return { budget_min: null, budget_max: parseMntNumber(single[1]) };
  return { budget_min: null, budget_max: null };
}

function buildCheckIn(month, day) {
  if (!month) return null;
  const y = new Date().getFullYear();
  const m = String(month).padStart(2, "0");
  const d = day ? String(day).padStart(2, "0") : "01";
  return `${y}-${m}-${d}`;
}

function detectIntent(text, partial) {
  const t = text.toLowerCase();
  if (/esim|интернет|интернэт|дата/i.test(t)) return "esim_search";
  if (/нислэг|нисэх|flight/i.test(t)) return "flight_search";
  if (/маршрут|төлөвлө|itinerary|өдөр өдр/i.test(t)) return "itinerary";
  if (/буудал|hotel|зочид|disneyland|дисней/i.test(t)) return "hotel_search";
  if (/арай хямд|хямд|үнэ бага|cheaper|budget/i.test(t) && (partial.city_id || partial.city)) return "hotel_search";
  if (partial.city_id && (partial.nights || partial.guests)) return "hotel_search";
  return "general";
}

function parseMessage(message) {
  const text = String(message || "").trim();
  const hay = latin.searchBlob(text, CHINA_DEST);
  const cityMatch = matchCity(text);

  const nights = Number((hay.match(/(\d+)\s*хоног/) || text.match(/(\d+)\s*(?:honog|khonog)/i) || [])[1]) || null;
  const guests = Number((hay.match(/(\d+)\s*хүн/) || text.match(/(\d+)\s*(?:hun|khun)/i) || [])[1]) || null;
  const month = (hay.match(/(\d{1,2})\s*сар/) || text.match(/(\d{1,2})\s*sar/i) || [])[1] || null;
  const day = (hay.match(/сарын\s*(\d{1,2})/) || hay.match(/(\d{1,2})\s*(?:нд|наас)/) || [])[1] || null;
  const stars = (hay.match(/(\d)\s*од/) || [])[1] ? Number((hay.match(/(\d)\s*од/) || [])[1]) : null;

  const budget = parseBudget(text);
  const district = /disneyland|дисней/i.test(hay) ? "Disneyland" :
    (text.match(/([A-Za-z\u0400-\u04ff\s]+)\s*(?:дүүрэг|бүс|district)/i) || [])[1]?.trim() || null;

  const facilities = [];
  if (/метро|metro/i.test(hay)) facilities.push("metro_nearby");
  if (/өглөөний цай|breakfast/i.test(hay)) facilities.push("breakfast");
  if (/disneyland|дисней/i.test(hay)) facilities.push("near_attraction");

  const partial = {
    country: cityMatch?.country || null,
    country_mn: cityMatch?.country_mn || null,
    city: cityMatch?.city || null,
    city_id: cityMatch?.city_id || null,
    check_in: buildCheckIn(month, day),
    nights,
    guests,
    stars,
    district,
    facilities,
    ...budget,
    month: month ? Number(month) : null,
    day: day ? Number(day) : null,
    wants_cheaper: /арай хямд|хямд|үнэ бага|cheaper/i.test(text),
    wants_disney: /disneyland|дисней/i.test(text)
  };
  partial.intent = detectIntent(text, partial);
  return partial;
}

function mergeIntent(prevContext, message) {
  const fresh = parseMessage(message);
  const prev = prevContext || {};
  const merged = {
    intent: fresh.intent !== "general" ? fresh.intent : (prev.intent || fresh.intent),
    country: fresh.country || prev.country || null,
    country_mn: fresh.country_mn || prev.country_mn || null,
    city: fresh.city || prev.city || null,
    city_id: fresh.city_id || prev.city_id || null,
    check_in: fresh.check_in || prev.check_in || null,
    nights: fresh.nights || prev.nights || null,
    guests: fresh.guests || prev.guests || null,
    budget_min: fresh.budget_min ?? prev.budget_min ?? null,
    budget_max: fresh.budget_max ?? prev.budget_max ?? null,
    stars: fresh.stars || prev.stars || null,
    district: fresh.district || prev.district || null,
    facilities: [...new Set([...(prev.facilities || []), ...(fresh.facilities || [])])],
    month: fresh.month || prev.month || null,
    day: fresh.day || prev.day || null,
    wants_cheaper: fresh.wants_cheaper || prev.wants_cheaper || false,
    wants_disney: fresh.wants_disney || prev.wants_disney || false
  };
  if (fresh.wants_cheaper) merged.intent = "hotel_search";
  return merged;
}

function historyToText(history) {
  return (history || [])
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");
}

function mergeFromHistory(history, message, prevContext) {
  const histText = historyToText(history);
  const fromHist = histText ? parseMessage(histText) : {};
  const base = mergeIntent(prevContext, message);
  return mergeIntent({ ...fromHist, ...prevContext }, message);
}

module.exports = {
  parseMessage,
  mergeIntent,
  mergeFromHistory,
  buildCheckIn
};
