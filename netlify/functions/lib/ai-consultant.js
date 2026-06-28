/**
 * AI Travel Consultant — detailed Mongolian responses (human agent tone)
 */
let CHINA_DEST;
try {
  CHINA_DEST = require("../../../data/china-destinations.js");
} catch {
  CHINA_DEST = null;
}

const MONTH_CLIMATE = {
  shanghai: {
    8: "8 сард Шанхай халуун, чийглэг байдаг тул метро ойр, төвийн байршилтай буудал сонговол илүү тухтай.",
    7: "7 сард зуны өндөр сезон — Disneyland, The Bund их завгүй. Тасалбар урьдчилж авбал сайн.",
    1: "1 сард зун хүйтэн биш ч салхитай байж болно. Дулаан хувцас, бага зэрэг хөнгөн гадуур хувцас авч яваарай."
  },
  beijing: {
    8: "8 сард Бээжин халуун, хуурай. Great Wall явахад нарны тос, ус их хэрэгтэй.",
    1: "1–2 сард маш хүйтэн. Дулаан хувцас заавал."
  },
  hohhot: {
    8: "8 сард Хөх хот дулаан, нар сайхан. Ирээдүйд Бээжин рүү HSR-ээр 2 цагт хүрнэ.",
    1: "1 сард маш хүйтэн (−15°C орчим). Өвлийн хувцас бүрэн бэлэн бай."
  }
};

const CITY_PLANS = {
  shanghai: {
    hotelAreas: [
      { area: "Nanjing Road / People's Square", why: "метро шууд, shopping, төв — анх удаа ирэгчид хамгийн тохиромжтой" },
      { area: "The Bund", why: "харагдац сайхан, гэхдээ үнэ 20–30% өндөр" },
      { area: "Lujiazui", why: "Pudong, бизнес эсвэл modern skyline-д тохирно" }
    ],
    days: {
      5: [
        "1-р өдөр: Ирэх өдөр, буудалдаа орох, Nanjing Road орчмоор алхах, оройн The Bund гэрэл",
        "2-р өдөр: The Bund өглөө, Oriental Pearl Tower, Lujiazui skyline",
        "3-р өдөр: Shanghai Disneyland (бүтэн өдөр) — тасалбар урьдчилж ав",
        "4-р өдөр: Yu Garden, Old City, French Concession (Tianzifang кофе, алхалт)",
        "5-р өдөр: Shopping (Nanjing Road / Xintiandi), буудал хоослох, буцах бэлтгэл"
      ],
      3: [
        "1-р өдөр: Ирэх, Nanjing Road, The Bund орой",
        "2-р өдөр: Yu Garden, French Concession, Oriental Pearl",
        "3-р өдөр: Shopping эсвэл Disneyland (сонголтоор), буцах"
      ]
    },
    flights: [
      { airline: "MIAT Mongolian Airlines", dep: "09:40", arr: "12:35", dur: "2ц 55мин", price: "~1,850 CNY" },
      { airline: "Air China", dep: "11:20", arr: "13:10", dur: "2ц 50мин", price: "~1,720 CNY" }
    ],
    esim: { name: "China eSIM 7 хоног", data: "5–10 GB", price: "QPay-ээр", note: "WeChat, Alipay VPN-гүй ажиллана" }
  },
  beijing: {
    hotelAreas: [
      { area: "Wangfujing / Tiananmen", why: "төв, Forbidden City ойр, метро сайн" },
      { area: "Sanlitun / Chaoyang", why: "залуус, ресторан, nightlife" },
      { area: "Haidian", why: "Summer Palace, университет орчин" }
    ],
    days: {
      5: [
        "1-р өдөр: Ирэх, Wangfujing алхалт, орой амралт",
        "2-р өдөр: Forbidden City, Tiananmen Square (өглөө эрт оч)",
        "3-р өдөр: Great Wall (Mutianyu) — бүтэн өдөр, private car эсвэл тур",
        "4-р өдөр: Temple of Heaven, hutong алхалт, Peking duck хоол",
        "5-р өдөр: Summer Palace эсвэл shopping, буцах бэлтгэл"
      ]
    },
    flights: [
      { airline: "Air China", dep: "08:30", arr: "10:45", dur: "2ц 15мин", price: "~1,680 CNY" },
      { airline: "MIAT", dep: "14:20", arr: "16:30", dur: "2ц 10мин", price: "~1,750 CNY" }
    ],
    esim: { name: "China eSIM 7 хоног", data: "5–10 GB", price: "QPay-ээр", note: "Maps + WeChat-д хангалттай" }
  },
  hohhot: {
    hotelAreas: [
      { area: "Xincheng / City Center", why: "төв, ресторан, Dazhao Temple ойр" },
      { area: "Railway Station", why: "Бээжин рүү галт тэрэг авахад тохиромжтой" }
    ],
    days: {
      3: [
        "1-р өдөр: Ирэх, Dazhao Temple, Muslim Quarter хоол",
        "2-р өдөр: Xilamuren grassland (1 өдрийн тур) эсвэл хот дотор музей",
        "3-р өдөр: Бээжин рүү HSR (2 цаг) эсвэл буцах"
      ]
    },
    flights: [],
    esim: { name: "China eSIM 7 хоног", data: "3–5 GB", price: "QPay-ээр", note: "Inner Mongolia-д хамрагдана" }
  }
};

const QUICK_REPLIES = [
  { id: "hotel_suggest", label: "🏨 Буудал санал болго" },
  { id: "flight_check", label: "✈️ Нислэг шалга" },
  { id: "esim_view", label: "📶 eSIM авах" },
  { id: "route_plan", label: "🗺 Өдөр өдрөөр маршрут" },
  { id: "budget_calc", label: "💰 Төсөв тооцоол" },
  { id: "insurance", label: "🛡 Даатгал нэмэх" }
];

function getProfile(cityId) {
  return cityId && CHINA_DEST?.getCity ? CHINA_DEST.getCity(cityId) : null;
}

function monthTip(cityId, month) {
  const tips = MONTH_CLIMATE[cityId];
  if (tips && month && tips[month]) return tips[month];
  const profile = getProfile(cityId);
  if (profile?.climate_mn) return `${profile.name_mn} хотын уур амьсгал: ${profile.climate_mn}.`;
  return null;
}

function pickDaysPlan(cityId, days) {
  const plan = CITY_PLANS[cityId];
  if (plan?.days?.[days]) return plan.days[days];
  if (plan?.days?.[5] && days > 5) {
    const base = plan.days[5];
    const extra = [];
    for (let d = 6; d <= days; d++) extra.push(`${d}-р өдөр: Нэмэлт shopping, амралт эсвэл ойролцоох газар`);
    return [...base.slice(0, 4), ...extra, `${days}-р өдөр: Буцах бэлтгэл`];
  }
  if (plan?.days?.[5] && days < 5) return plan.days[5].slice(0, days);
  return buildGenericDays(cityId, days);
}

function buildGenericDays(cityId, days) {
  const profile = getProfile(cityId);
  const city = profile?.name_mn || "хот";
  const attrs = profile?.attractions || ["төв хэсэг", "музей", "local food"];
  const lines = [];
  lines.push(`1-р өдөр: ${city} ирэх, буудал, ${attrs[0] || "төв"} орчмоор алхах`);
  for (let d = 2; d < days; d++) {
    const attr = attrs[(d - 2) % attrs.length] || "үзвэр";
    lines.push(`${d}-р өдөр: ${attr}, хоол, амралт`);
  }
  lines.push(`${days}-р өдөр: Shopping, буудал хоослох, буцах бэлтгэл`);
  return lines;
}

function calcBudget(intent, profile) {
  const days = intent.days || profile?.recommended_stay_days || 5;
  const people = intent.people || 2;
  const rooms = Math.ceil(people / 2);
  const budgetBase = profile?.budget_cny || { min: 280, max: 550 };

  const hotelMin = Math.round(budgetBase.min * 0.85 * days * rooms);
  const hotelMax = Math.round(budgetBase.max * 1.1 * days * rooms);
  const foodMin = Math.round(100 * people * days);
  const foodMax = Math.round(180 * people * days);
  const metroMin = Math.round(25 * people * Math.min(days, 7));
  const metroMax = Math.round(45 * people * Math.min(days, 7));
  const attrMin = intent.wantsDisney || intent.city_id === "shanghai" ? 400 * people : 150 * people;
  const attrMax = intent.wantsDisney || intent.city_id === "shanghai" ? 650 * people : 350 * people;
  const flightEst = Math.round(1600 * people);
  const totalMin = hotelMin + foodMin + metroMin + attrMin + flightEst;
  const totalMax = hotelMax + foodMax + metroMax + attrMax + flightEst + 800;

  return {
    hotel: `${hotelMin.toLocaleString()}–${hotelMax.toLocaleString()} CNY`,
    food: `${foodMin.toLocaleString()}–${foodMax.toLocaleString()} CNY`,
    metro: `${metroMin.toLocaleString()}–${metroMax.toLocaleString()} CNY`,
    attractions: `${attrMin.toLocaleString()}–${attrMax.toLocaleString()} CNY`,
    flight: `~${flightEst.toLocaleString()} CNY/хүн (нислэг тусад)`,
    total: `${totalMin.toLocaleString()}–${totalMax.toLocaleString()} CNY`,
    days,
    people
  };
}

function buildHotelCards(cityId, intent) {
  const plan = CITY_PLANS[cityId];
  const profile = getProfile(cityId);
  const city = profile?.name_mn || intent.city || "хот";
  const areas = plan?.hotelAreas || [
    { area: "City Center", why: "төв, тээвэр ойр" },
    { area: "Metro station area", why: "метро ашиглахад хялбар" }
  ];
  const stars = intent.purpose === "бизнес" ? 4 : 3;
  return areas.slice(0, 3).map((a, i) => ({
    type: "hotel",
    title: `${city} — ${a.area}`,
    subtitle: `${stars + (i === 2 ? 1 : 0)} од, ${intent.days || 5} хоног`,
    detail: a.why,
    price: `${280 + i * 120}–${450 + i * 150} CNY/өдөр`,
    badge: i === 0 ? "Санал болгох" : null
  }));
}

function buildFlightCards(cityId, intent) {
  const plan = CITY_PLANS[cityId];
  const profile = getProfile(cityId);
  const ap = profile?.airport?.primary || "PVG";
  const city = profile?.name_mn || intent.city;
  const flights = plan?.flights || [
    { airline: "MIAT / Air China", dep: "09:00–14:00", arr: "12:00–17:00", dur: "2–3 цаг", price: "~1,700 CNY" }
  ];
  return flights.map((f) => ({
    type: "flight",
    title: `${f.airline}`,
    subtitle: `УБ (${ap}) → ${city}`,
    detail: `${f.dep} – ${f.arr} · ${f.dur}`,
    price: f.price,
    badge: "Шууд нислэг"
  }));
}

function buildEsimCard(cityId, intent) {
  const plan = CITY_PLANS[cityId];
  const days = intent.days || 5;
  const esim = plan?.esim || {
    name: `China eSIM ${days} хоног`,
    data: days <= 5 ? "5 GB" : "10 GB",
    price: "QPay-ээр",
    note: "WeChat, Alipay VPN-гүй"
  };
  return {
    type: "esim",
    title: esim.name,
    subtitle: esim.data,
    detail: esim.note,
    price: esim.price,
    badge: "VPN-гүй WeChat"
  };
}

function buildAttractionCards(cityId, intent) {
  const profile = getProfile(cityId);
  const attrs = profile?.attractions || ["Үзвэр", "Музей"];
  const cards = attrs.slice(0, 4).map((name) => ({
    type: "attraction",
    title: name,
    subtitle: profile?.name_mn || "",
    detail: "Klook / Trip.com-оор урьдчилж захиалбал хямд",
    price: "100–600 CNY",
    badge: null
  }));
  if (cityId === "shanghai" || intent.wantsDisney) {
    cards.unshift({
      type: "attraction",
      title: "Shanghai Disneyland",
      subtitle: "1 бүтэн өдөр",
      detail: "Баасан, амралтын өдөр их хүнтэй — мягмар, лхагва сонго",
      price: "450–600 CNY/хүн",
      badge: "Заавал"
    });
  }
  return cards.slice(0, 4);
}

function buildConsultantReply(intent, message) {
  const profile = intent.city_id ? getProfile(intent.city_id) : null;
  const city = intent.city || profile?.name_mn || null;
  const country = intent.country || (profile ? "Хятад" : null);
  const days = intent.days || profile?.recommended_stay_days || 5;
  const people = intent.people || 2;
  const month = intent.month ? Number(intent.month) : null;
  const dateStr = month
    ? `${month} сар${intent.day ? "ын " + intent.day : ""}`
    : null;

  const parts = [];

  if (city && days && people) {
    const opener = dateStr
      ? `Маш гоё сонголт байна. ${dateStr} ${city} ${days} хоног, ${people} хүн — би дэлгэрэнгүй төлөвлөж өгье.`
      : `Сайн сонголт! ${city} ${days} хоног, ${people} хүнтэй аялал — доорх зөвлөмжийг анхааралтай уншаарай.`;
    parts.push(opener);

    const tip = month && intent.city_id ? monthTip(intent.city_id, month) : null;
    if (tip) parts.push(tip);

    const purposeNote = intent.purpose === "гэр бүл"
      ? "Гэр бүлийн аялал учраас Disneyland, Yu Garden зэрэг хүүхэдтэй газруудыг орууллаа."
      : intent.purpose === "бизнес"
        ? "Бизнес зорилго учраас метро ойр, CBD бүсийн буудлыг давхар санал болгоно."
        : null;
    if (purposeNote) parts.push(purposeNote);

    if (intent.hasChildren || intent.hasElderly) {
      const notes = [];
      if (intent.hasChildren) notes.push("Хүүхэдтэй учраас Disneyland, тоглоомын талбай, амралтын цаг илүү орууллаа.");
      if (intent.hasElderly) notes.push("Том хүнтэй учраас метротой ойр буудал, алхах бага маршрут сонголо.");
      if (notes.length) parts.push(notes.join(" "));
    }

    parts.push(`\n🗺 ${days} хоногийн санал болгох маршрут:\n`);
    pickDaysPlan(intent.city_id || "shanghai", days).forEach((line) => parts.push(line));

    parts.push("\n📋 Танд дараах зүйлс хэрэг болно:");
    const needs = [];
    if (country === "Хятад" || profile) {
      needs.push(`• ${days} хоногийн China eSIM (Maps, WeChat, Alipay)`);
      if (profile?.metro) needs.push("• Метро ашиглахад Alipay эсвэл WeChat Pay");
      else needs.push("• Didi такси — WeChat мини-апп эсвэл бэлэн юань");
    }
    if (intent.city_id === "shanghai" || intent.wantsDisney) {
      needs.push("• Disneyland тасалбар урьдчилж авах (Klook, Trip.com)");
    }
    needs.push(`• Төвдөө 3–4 одтой буудал (${people} хүн, ${Math.ceil(people / 2)} өрөө)`);
    if (country === "Хятад") needs.push("• L виз — visaforchina.org (7–10 хоногийн өмнө эхлүүл");
    parts.push(needs.join("\n"));

    const budget = calcBudget(intent, profile);
    parts.push(`\n💰 Төсөв ойролцоогоор (${people} хүн, ${days} хоног):`);
    parts.push(`• Буудал: ${budget.hotel}`);
    parts.push(`• Хоол: ${budget.food}`);
    parts.push(`• Метро/тээвэр: ${budget.metro}`);
    parts.push(`• Үзвэр/тасалбар: ${budget.attractions}`);
    parts.push(`• Нислэг: ${budget.flight}`);
    parts.push(`• **Нийт (ойролцоо): ${budget.total}**`);

    if (profile?.transport_info_mn) {
      parts.push(`\n🚇 Тээврийн зөвлөмж: ${profile.transport_info_mn}. Google Maps ажиллахгүй тул Amap (高德) эсвэл Apple Maps ашигла.`);
    }

    const hotelAreas = CITY_PLANS[intent.city_id]?.hotelAreas || [];
    if (hotelAreas.length) {
      parts.push("\n🏨 Буудлын бүс (яагаад гэж):");
      hotelAreas.forEach((h) => parts.push(`• ${h.area} — ${h.why}`));
    }

    parts.push("\n📶 eSIM: WeChat, Alipay VPN-гүй ажиллана. Google, Instagram-д VPN тусад нь хэрэгтэй.");
    parts.push("\nХэрвээ та хүсвэл би одоо таны төсөвт таарсан буудлууд, нислэгийн боломжийг нарийвчлан санал болгож өгье. Захиалахыг хүсвэл доорх товчоос сонгоорой — чат үнэгүй, form зөвхөн захиалах үед л гарна.");

    const cards = [
      ...buildHotelCards(intent.city_id || "shanghai", intent).slice(0, 2),
      ...buildFlightCards(intent.city_id || "shanghai", intent).slice(0, 1),
      buildEsimCard(intent.city_id || "shanghai", intent),
      ...buildAttractionCards(intent.city_id || "shanghai", intent).slice(0, 2)
    ];

    return {
      reply: parts.join("\n"),
      cards,
      quickReplies: QUICK_REPLIES,
      ctas: [
        { id: "hotel_suggest", label: "Буудал санал авах" },
        { id: "create_booking", label: "Захиалга үүсгэх" }
      ],
      context: intent
    };
  }

  return null;
}

function buildGreetingReply() {
  return {
    reply: `Сайн байна уу! Би eSIM Mongolia-ийн аяллын зөвлөх. Таны хувийн аяллын агент шиг — маршрут, буудал, нислэг, eSIM, төсөв, виз бүгдийг **Монгол хэлээр** дэлгэрэнгүй зөвлөнө.

Жишээ нь ингэж бичээрэй:
• «8 сард Шанхай 5 хоног, 2 хүн»
• «Хөх хотоос Бээжин 3 хоног, гэр бүл 4 хүн, төсөв 8000 юань»
• «Guangzhou business trip, 4 хоног, 4 одтой буудал хэрэгтэй»

**Чат бүрэн үнэгүй** — утас, email, form шаардлагагүй. Захиалахыг хүсвэл л доорх товчоос сонгоно.`,
    cards: [],
    quickReplies: QUICK_REPLIES.slice(0, 4),
    ctas: [],
    context: {}
  };
}

function buildFollowUpReply(intent, missing) {
  const partial = [];
  if (intent.city) {
    const profile = intent.city_id ? getProfile(intent.city_id) : null;
    partial.push(`${intent.city} сонголт сайхан байна${profile ? " — " + (profile.climate_mn || "") : ""}.`);
  }
  if (intent.month && intent.city_id) {
    const tip = monthTip(intent.city_id, Number(intent.month));
    if (tip) partial.push(tip);
  }

  let ask = "";
  if (missing.includes("destination")) {
    ask = "Хаашаа явахаа хэлбэл би маршрут, төсөв, буудлын бүс, eSIM бүгдийг нэг дор зохиож өгнө. Жишээ: «8 сард Шанхай 5 хоног, 2 хүн».";
  } else if (missing.includes("dates")) {
    ask = `${intent.city || "Тэнд"} хэзээ, хэдэн хоног явах вэ? Сар (жишээ нь 8 сар) эсвэл «5 хоног» гэж бичээрэй — би улирлын зөвлөмж өгнө.`;
  } else if (missing.includes("people")) {
    ask = "Хэдэн хүнтэй явах вэ? Хүүхэд, том хүн байвал буудал, маршрутыг өөрөөр зохионо. Жишээ: «2 том, 1 хүүхэд».";
  }

  const reply = [...partial, ask].filter(Boolean).join("\n\n");
  return {
    reply: reply || ask,
    cards: intent.city_id ? [buildEsimCard(intent.city_id, intent)] : [],
    quickReplies: QUICK_REPLIES,
    ctas: [],
    context: intent
  };
}

function buildTopicReply(intent, message) {
  const profile = intent.city_id ? getProfile(intent.city_id) : null;
  const city = intent.city || profile?.name_mn || "хот";
  const t = message.toLowerCase();
  const parts = [`${city}-тай холбоотой асуулагдлаа — дэлгэрэнгүй тайлбарлая.\n`];

  if (intent.wantsFlight || /нислэг/i.test(t)) {
    parts.push("✈️ **Нислэг:** Улаанбаатар–" + city + " шууд ~2–3 цаг. MIAT, Air China, China Southern ихэвчлэн. 7–14 хоногийн өмнө захиалбал 15–25% хямд байдаг — учир нь сезон, багтаамж ихээр нөлөөлдөг.");
    parts.push("• Өглөөний нислэг: ирмэгц 1 өдөр ашиглах\n• Оройны нислэг: ажлын өдөр алдахгүй");
    return wrapTopic(parts, intent, "flight");
  }
  if (intent.wantsHotel || /буудал/i.test(t)) {
    const areas = CITY_PLANS[intent.city_id]?.hotelAreas || [{ area: "City Center", why: "төв, аюулгүй" }];
    parts.push("🏨 **Буудлын бүс:**");
    areas.forEach((a) => parts.push(`• ${a.area} — ${a.why}`));
    parts.push("\n3 од = 250–350 CNY, 4 од = 380–550 CNY, 5 од = 650+ CNY. Метротой ойр байрлал цаг хэмнэнэ.");
    return wrapTopic(parts, intent, "hotel");
  }
  if (intent.wantsEsim || /esim/i.test(t)) {
    parts.push("📶 **eSIM:** Хятад eSIM 7/14/30 хоног — WeChat, Alipay VPN-гүй. Google, Instagram-д VPN тусад.");
    parts.push("Maps + WeChat-д 5–10 GB ихэнх 5–7 хоногт хангалттай. Видео их бол 15 GB+ сонго.");
    return wrapTopic(parts, intent, "esim");
  }
  if (intent.wantsCost || /зардал|төсөв/i.test(t)) {
    const budget = calcBudget(intent, profile);
    parts.push(`💰 **Төсөв (${budget.people} хүн, ${budget.days} хоног):**`);
    parts.push(`• Буудал: ${budget.hotel}\n• Хоол: ${budget.food}\n• Тээвэр: ${budget.metro}\n• Үзвэр: ${budget.attractions}`);
    parts.push(`• **Нийт: ${budget.total}** (нислэг тусад)`);
    return wrapTopic(parts, intent, "budget");
  }
  return null;
}

function wrapTopic(parts, intent, topicType) {
  parts.push("\nӨөр нарийвчилсан зүйл асуугаарай — чат үнэгүй. Захиалахыг хүсвэл доорх товч дарна уу.");
  const cards = [];
  if (topicType === "flight") cards.push(...buildFlightCards(intent.city_id || "shanghai", intent));
  if (topicType === "hotel") cards.push(...buildHotelCards(intent.city_id || "shanghai", intent).slice(0, 3));
  if (topicType === "esim") cards.push(buildEsimCard(intent.city_id || "shanghai", intent));
  if (topicType === "budget") {
    cards.push(buildEsimCard(intent.city_id || "shanghai", intent));
    cards.push(...buildAttractionCards(intent.city_id || "shanghai", intent).slice(0, 2));
  }
  return {
    reply: parts.join("\n"),
    cards,
    quickReplies: QUICK_REPLIES,
    ctas: [{ id: "create_booking", label: "Захиалга үүсгэх" }],
    context: intent
  };
}

function buildInsuranceReply(intent) {
  const city = intent.city || "гадаад";
  return {
    reply: `🛡 **Аяллын даатгал** (${city}):\n\nГадаад аялалд даатгал нэмбэл эмнэлэг, нислэг цуцлах, багаж алдах зэрэгт хамгаалалт авна. Монголоос гарахын өмнө 1–3 хоногийн өмнө идэвхжүүлбэл хангалттай.\n\n• Энгийн: ~30,000–50,000 MNT/хүн\n• Гэр бүл: хүүхэд хямд тарифтай\n\nЗахиалахыг хүсвэл «Захиалга үүсгэх» дар — form зөвхөн тэр үед гарна.`,
    cards: [],
    quickReplies: QUICK_REPLIES.filter((q) => q.id !== "insurance"),
    ctas: [{ id: "create_booking", label: "Даатгал + аялал захиалах" }],
    context: intent
  };
}

module.exports = {
  buildConsultantReply,
  buildGreetingReply,
  buildFollowUpReply,
  buildTopicReply,
  buildInsuranceReply,
  QUICK_REPLIES
};
