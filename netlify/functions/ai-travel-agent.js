/**
 * AI Travel Agent — Supabase Edge Function → OpenAI (production)
 * MVP: conversational Mongolian replies + optional CTAs (no auto-booking)
 */
const { randomUUID } = require("crypto");

const DESTINATIONS = [
  { keys: ["шанхай", "shanghai"], country: "Хятад", city: "Шанхай" },
  { keys: ["бээжин", "beijing"], country: "Хятад", city: "Бээжин" },
  { keys: ["гуанжоу", "guangzhou"], country: "Хятад", city: "Гуанжоу" },
  { keys: ["шэньжэнь", "shenzhen"], country: "Хятад", city: "Шэньжэнь" },
  { keys: ["солонгос", "korea", "сеул", "seoul"], country: "Солонгос", city: "Сөүл" },
  { keys: ["япон", "japan", "tokyo", "токио"], country: "Япон", city: "Токио" },
  { keys: ["тайланд", "thailand", "bangkok", "бангкок"], country: "Тайланд", city: "Бангкок" },
  { keys: ["вьетнам", "vietnam", "hanoi", "ханой"], country: "Вьетнам", city: "Ханой" },
  { keys: ["сингапур", "singapore"], country: "Сингапур", city: "Сингапур" },
  { keys: ["турк", "turkey", "istanbul"], country: "Турк", city: "Стамбул" },
  { keys: ["дубай", "dubai"], country: "ОАЭ", city: "Дубай" },
  { keys: ["хятад", "china"], country: "Хятад", city: null }
];

function parseIntent(text) {
  const t = String(text || "").toLowerCase();
  let country = null;
  let city = null;
  for (const d of DESTINATIONS) {
    if (d.keys.some((k) => t.includes(k))) {
      country = d.country;
      city = d.city;
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
  if (!intent.days && !intent.month) m.push("dates");
  if (!intent.people) m.push("people");
  return m;
}

function defaultCtas(intent) {
  const ctas = [
    { id: "route_plan", label: "Энэ маршрутаар төлөвлөх" },
    { id: "flight_check", label: "Нислэгийн боломж шалгах" },
    { id: "hotel_suggest", label: "Буудлын санал авах" },
    { id: "ticket_suggest", label: "Тасалбарын санал авах" },
    { id: "esim_view", label: "eSIM санал харах" },
    { id: "create_booking", label: "Захиалга үүсгэх" }
  ];
  if (intent.country === "Хятад" || intent.wantsVisa) {
    ctas.splice(5, 0, { id: "visa_info", label: "Визийн мэдээлэл" });
  }
  return ctas;
}

function buildFollowUp(intent, missing) {
  if (missing.includes("destination")) {
    return "Хаашаа явах вэ? Жишээ нь Шанхай, Бээжин, Сөүл, Бангкок гэж бичээрэй — тэгвэл илүү нарийвчилсан зөвлөгөө өгнө.";
  }
  if (missing.includes("dates")) {
    const dest = intent.city || intent.country || "тэнд";
    return `${dest} руу хэзээ, хэдэн хоног явах вэ? Огноо эсвэл сар, хоногийн тоогоо бичээрэй.`;
  }
  if (missing.includes("people")) {
    return "Хэдэн хүнтэй явах вэ? Гэр бүл, хүүхэдтэй эсэхийг хэлвэл буудал, маршрутыг илүү зөв санна.";
  }
  return null;
}

function buildFullReply(intent) {
  const city = intent.city || (intent.country === "Хятад" ? "Бээжин" : intent.country || "таны сонгосон хот");
  const country = intent.country || "гадаад";
  const days = intent.days || 5;
  const people = intent.people || 2;
  const dateHint = intent.month
    ? `${intent.month} сар${intent.day ? "ын " + intent.day : ""}`
    : "удахгүй";

  let r = `${country}${intent.city ? " / " + city : ""} — ${days} хоног, ${people} хүний аяллын санал (${dateHint}):\n\n`;

  r += `🗺 Маршрут:\n`;
  r += `• 1-р өдөр: ${city} ирэх, буудал руу шилжих, ойролцоох дурсгалт газар\n`;
  for (let d = 2; d < days; d++) {
    r += `• ${d}-р өдөр: Үзэх газар, хоол, амралт\n`;
  }
  r += `• ${days}-р өдөр: Буцах бэлтгэл\n\n`;

  if (intent.wantsDisney || city === "Шанхай") {
    r += `🎢 Үзвэр: Disneyland Shanghai — 1 өдөр (~450–600 CNY/хүн), Klook-оор урьдчилан захиалахад тохиромжтой.\n\n`;
  }

  r += `✈️ Нислэг: Улаанбаатар → ${city} шууд ~2–3 цаг (улсаас хамаарна). Өглөө/оройн нислэг их байдаг.\n`;
  r += `🏨 Буудал: Метро, гол дурсгалт ойр — өдөрт ~250–600 CNY (${people} хүн).\n`;
  r += `🚄 Галт тэрэг: Хятад дотор 12306 апп; Хөх хот→Бээжин ~2 цаг.\n`;
  r += `🚇 Нийтийн тээвэр: Метро + Alipay/WeChat; Google Maps-д VPN шаардлагатай.\n`;
  r += `📶 eSIM: ${country === "Хятад" ? "China eSIM 7–" + days + " хоног" : "Тухайн улсын eSIM"} — доорх «eSIM санал харах» эсвэл сайтын eSIM хэсэг.\n`;

  const low = days * 280 * people;
  const high = days * 620 * people;
  r += `💰 Төсөв (ойролцоо): ${low}–${high} CNY — нислэг, буудал, хоол, тасалбар орно.\n`;

  if (country === "Хятад") {
    r += `🛂 Виз: Монгол иргэд L виз — visaforchina.org\n`;
  }

  r += `\nӨөр нарийвчилсан зүйл асуугаарай — чөлөөтэй бичиж болно. Захиалахыг хүсвэл доорх товчоос сонгоно уу.`;

  return r;
}

function buildTopicReply(intent, message) {
  const t = message.toLowerCase();
  const city = intent.city || "Шанхай";

  if (intent.wantsFlight || /нислэг/i.test(t)) {
    return `✈️ ${city} руу нислэг:\n• Улаанбаатар–${city} шууд ~2–3 цаг\n• China Southern, MIAT, Air China ихэвчлэн\n• 7–14 хоногийн өмнө захиалбал хямд байдаг\n\nӨөр асуулт байвал бичээрэй. Захиалах бол «Захиалга үүсгэх» → Нислэг сонгоно.`;
  }
  if (intent.wantsHotel || /буудал/i.test(t)) {
    return `🏨 ${city} буудлын бүс:\n• The Bund / төв — аялалд тохиромжтой\n• Метротой ойр — өдөрт ~300–700 CNY\n• Trip.com, Booking.com-оор харьцуулна\n\nДэлгэрэнгүй хүсвэл хоног, төсвөө бичээрэй.`;
  }
  if (intent.wantsTrain || /галт тэрэг/i.test(t)) {
    return `🚄 Галт тэрэг:\n• 12306 апп (паспортын дугаар)\n• Хөх хот→Бээжин ~2 цаг, ~200 CNY\n• Бээжин→Шанхай ~4.5–6 цаг\n\nТасалбар захиалахыг хүсвэл «Захиалга үүсгэх» дарна уу.`;
  }
  if (intent.wantsEsim || /esim/i.test(t)) {
    return `📶 eSIM санал:\n• Хятад: 7/14/30 хоног, 1GB–Unlimited\n• WeChat/Alipay VPN-гүй\n• Google/FB-д VPN тусад нь\n\nДоорх «eSIM санал харах» дарж багцаа сонгоорой — ямар ч form бөглөх шаардлагагүй.`;
  }
  if (intent.wantsTransport || /метро|тээвэр/i.test(t)) {
    return `🚇 ${city} нийтийн тээвэр:\n• Метро — Alipay/WeChat QR\n• Didi (WeChat мини-апп)\n• Amap газрын зураг (Google-ийн оронд)\n\nТаксид бэлэн юань бэлэн байлга.`;
  }
  if (intent.wantsVisa || /виз/i.test(t)) {
    return `🛂 Виз (Монгол иргэн):\n• Хятад: L виз, ЭСЯ-наас\n• eVisa одоогоор байхгүй\n• Нислэг + буудлын захиалга хавсаргана\n\nДэлгэрэнгүй: esimmongolia.com/china/#visa`;
  }
  return null;
}

function buildReply(message, history) {
  const intent = mergeIntent(history, message);

  if (isGreeting(message)) {
    return {
      reply: "Сайн байна уу! Би eSIM Mongolia AI аяллын зөвлөх. Хаашаа, хэзээ, хэдэн хоног явах вэ — чөлөөтэй асуугаарай. Маршрут, нислэг, буудал, eSIM, тээвэр, төсөв бүгдийг Монгол хэлээр хариулна.",
      ctas: [],
      context: intent
    };
  }

  const topic = buildTopicReply(intent, message);
  if (topic && !intent.days && !/маршрут|төлөвлө/i.test(message)) {
    return {
      reply: topic,
      ctas: defaultCtas(intent),
      context: intent
    };
  }

  const missing = missingFields(intent);
  if ((isVague(message) || missing.length >= 2) && missing.length > 0) {
    const follow = buildFollowUp(intent, missing);
    if (follow) {
      return { reply: follow, ctas: [], context: intent };
    }
  }

  if (missing.includes("destination") && message.length < 40) {
    return {
      reply: buildFollowUp(intent, ["destination"]),
      ctas: [],
      context: intent
    };
  }

  return {
    reply: buildFullReply(intent),
    ctas: defaultCtas(intent),
    context: intent
  };
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

  // TODO: OpenAI Responses API when OPENAI_API_KEY is set
  const { reply, ctas, context } = buildReply(message, history);

  console.log("[ai-travel-agent]", { sessionId, len: message.length });

  return json(200, {
    sessionId,
    reply,
    ctas,
    context,
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
