/**
 * Local AI travel responses — works offline; Supabase/Netlify can override later.
 */
(function (root) {
  function fold(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function parseTravelMessage(message) {
    const raw = fold(message);
    const t = raw
      .replace(/\bshanhai\b/g, "shanghai")
      .replace(/\.\/+/g, " ");

    let city = null;
    let city_id = null;
    let country = null;

    const cities = [
      { keys: ["shanghai", "шанхай", "шанхайд"], city: "Шанхай", city_id: "shanghai", country: "Хятад" },
      { keys: ["beijing", "бээжин", "бээжинд", "peking"], city: "Бээжин", city_id: "beijing", country: "Хятад" },
      { keys: ["hohhot", "хөх хот", "huhehaote"], city: "Хөх хот", city_id: "hohhot", country: "Хятад" },
      { keys: ["thailand", "тайланд", "tailand"], city: null, city_id: null, country: "Тайланд" },
      { keys: ["bangkok", "бангкок"], city: "Бангкок", city_id: "bangkok", country: "Тайланд" },
      { keys: ["vietnam", "вьетнам", "viet nam"], city: null, city_id: null, country: "Вьетнам" },
      { keys: ["hanoi", "ханой"], city: "Ханой", city_id: "hanoi", country: "Вьетнам" },
      { keys: ["da nang", "danang", "дананг"], city: "Дананг", city_id: "danang", country: "Вьетнам" },
      { keys: ["japan", "япон", "yapon"], city: null, city_id: null, country: "Япон" },
      { keys: ["tokyo", "токио"], city: "Токио", city_id: "tokyo", country: "Япон" },
      { keys: ["korea", "солонгос", "solongos"], city: null, city_id: null, country: "Солонгос" },
      { keys: ["seoul", "сөүл", "soul"], city: "Сөүл", city_id: "seoul", country: "Солонгос" }
    ];

    for (const c of cities) {
      if (c.keys.some((k) => t.includes(k))) {
        city = c.city || city;
        city_id = c.city_id || city_id;
        country = c.country;
        if (c.city) break;
      }
    }

    const days = (t.match(/(\d+)\s*(?:хоног|honog|khonog)/) || [])[1];
    const people = (t.match(/(\d+)\s*(?:хүн|hun|khun)/) || [])[1];
    const month = (t.match(/(\d{1,2})\s*(?:сар(?:ын|анд)?|sar|sard)/) || [])[1];
    const day = (t.match(/сарын\s*(\d{1,2})/) || t.match(/(\d{1,2})\s*(?:nd|наас|nees|ees)/) || [])[1];

    return {
      city,
      city_id,
      country,
      days: days ? Number(days) : null,
      people: people ? Number(people) : null,
      month: month || null,
      day: day || null,
      wantsHotel: /hotel|буудал|budal|buudal|зочид/i.test(t),
      wantsFlight: /flight|нислэг|nisleg|nisleh/i.test(t),
      wantsEsim: /esim|интернет|internet/i.test(t),
      wantsBudget: /budget|төсөв|tosov|tusev|зардал|zardal|төс/i.test(t),
      wantsDisney: /disney|дисней/i.test(t),
      wantsRoute: /маршрут|marshrut|itinerary|төлөвл/i.test(t)
    };
  }

  function shanghaiPlan(days, people, month) {
    const d = days || 5;
    const p = people || 2;
    const monthTip = month === "7" || month === "8"
      ? "7–8 сард Шанхай халуун, чийглэг байдаг тул метро ойр буудал сонговол илүү тухтай."
      : "Метро ойр, төвийн байрлалтай буудал анх удаа ирэгчид хамгийн тохиромжтой.";

    const routes = {
      5: [
        "1-р өдөр: Ирэх, Nanjing Road орчмоор алхах, орой The Bund гэрэл",
        "2-р өдөр: The Bund, Oriental Pearl Tower, Lujiazui skyline",
        "3-р өдөр: Shanghai Disneyland (бүтэн өдөр) — тасалбар урьдчилж ав",
        "4-р өдөр: Yu Garden, French Concession, Tianzifang",
        "5-р өдөр: Xintiandi shopping, буудал хоослох, буцах бэлтгэл"
      ],
      3: [
        "1-р өдөр: Ирэх, Nanjing Road, The Bund орой",
        "2-р өдөр: Yu Garden, French Concession, Oriental Pearl",
        "3-р өдөр: Shopping эсвэл Disneyland, буцах"
      ]
    };
    const plan = routes[d] || routes[5].slice(0, Math.min(d, 5));

    return {
      reply: `Маш гоё сонголт байна! ${month ? month + " сар" : ""} Шанхай ${d} хоног, ${p} хүн — доорх зөвлөмжийг анхаараарай.

${monthTip}

🗺 ${d} хоногийн санал болгох маршрут:
${plan.map((l) => "• " + l).join("\n")}

🏨 Буудлын бүс:
• Nanjing Road / People's Square — метро шууд, shopping, төв
• The Bund — харагдац сайхан (үнэ 20–30% өндөр)
• Lujiazui — Pudong, modern skyline

🚇 Метро: Alipay/WeChat Pay-ээр төлнө. Google Maps биш — Amap (高德) ашигла.

📶 eSIM: China eSIM 7/14 хоног — WeChat, Alipay VPN-гүй. ${d <= 5 ? "5–10 GB" : "10–15 GB"} ихэнх ${d} хоногт хангалттай.

💰 Төсөв ойролцоо (${p} хүн, ${d} хоног):
• Буудал (3–4 од): ~1,500,000–2,800,000 ₮
• Хоол: ~600,000–1,100,000 ₮
• Метро/тээвэр: ~150,000–280,000 ₮
• Үзвэр (Disneyland г.м): ~800,000–1,500,000 ₮
• **Нийт (ойролцоо): 3.5–6 сая ₮** (нислэг тусад)

Доорх товчоор шууд хайлт хийж болно — form, утас шаардлагагүй.`,
      context: { city: "Шанхай", city_id: "shanghai", country: "Хятад", days: d, people: p, month },
      quickReplies: [
        { id: "hotel_suggest", label: "🏨 Буудал хайх" },
        { id: "flight_check", label: "✈️ Нислэг шалгах" },
        { id: "esim_view", label: "📶 eSIM авах" }
      ],
      ctas: [
        { id: "book_hotel", label: "🏨 Буудал хайх" },
        { id: "book_flight", label: "✈️ Нислэг шалгах" },
        { id: "esim_view", label: "📶 eSIM авах" }
      ],
      cards: []
    };
  }

  function beijingPlan(days, people, month) {
    const d = days || 5;
    const p = people || 2;
    return {
      reply: `Сайн сонголт! Бээжин ${d} хоног, ${p} хүн.

${month === "8" ? "8 сард Бээжин халуун, хуурай — Great Wall явахад нарны тос, ус их ав." : "Forbidden City-д өглөө эрт очвол илүү тухтай."}

🗺 Маршрут:
• 1-р өдөр: Ирэх, Wangfujing алхалт
• 2-р өдөр: Forbidden City, Tiananmen
• 3-р өдөр: Great Wall (Mutianyu) — бүтэн өдөр
• 4-р өдөр: Temple of Heaven, hutong, Peking duck
• 5-р өдөр: Summer Palace эсвэл shopping

🏨 Бүс: Wangfujing (төв), Sanlitun (залуус), Haidian (Summer Palace ойр)

📶 China eSIM — Maps + WeChat-д 5–10 GB хангалттай.

💰 Төсөв: ~3–5.5 сая ₮/хүн (${d} хоног, нислэг тусад)`,
      context: { city: "Бээжин", city_id: "beijing", country: "Хятад", days: d, people: p, month },
      quickReplies: [
        { id: "hotel_suggest", label: "🏨 Буудал" },
        { id: "flight_check", label: "✈️ Нислэг" },
        { id: "esim_view", label: "📶 eSIM" }
      ],
      ctas: [
        { id: "book_hotel", label: "🏨 Буудал хайх" },
        { id: "book_flight", label: "✈️ Нислэг шалгах" }
      ],
      cards: []
    };
  }

  function countryBrief(name, tips) {
    return {
      reply: tips,
      context: { country: name },
      quickReplies: [
        { id: "route_plan", label: "🗺 Маршрут" },
        { id: "hotel_suggest", label: "🏨 Буудал" },
        { id: "esim_view", label: "📶 eSIM" }
      ],
      ctas: [],
      cards: []
    };
  }

  function generateLocalTravelResponse(message) {
    const intent = parseTravelMessage(message);

    if (intent.wantsEsim && !intent.city) {
      return {
        reply: "📶 **eSIM зөвлөмж:**\n\nХятад eSIM 7/14/30 хоног — Өдөр бүр 1/2/3GB эсвэл хязгааргүй. WeChat, Alipay VPN-гүй ажиллана.\n\nMaps + WeChat-д 5–10 GB ихэнх 5–7 хоногт хангалттай. Доорх «eSIM авах» товчоор QPay-р шууд авна — form шаардлагагүй.",
        quickReplies: [{ id: "esim_view", label: "📶 eSIM хэсэг рүү" }],
        ctas: [{ id: "esim_view", label: "📶 eSIM авах" }],
        context: intent,
        cards: []
      };
    }

    if (intent.wantsHotel && intent.city) {
      return {
        reply: `🏨 **${intent.city} буудал:**\n\nМетротой ойр, аюулгүй бүс сонгоорой. 3 од ~250–350 юань/өдөр, 4 од ~380–550 юань/өдөр.\n\n«Буудал хайх» товчоор ${intent.city} дотор хайж, MNT үнээр харна.`,
        quickReplies: [{ id: "hotel_suggest", label: "🏨 Буудал санал" }],
        ctas: [{ id: "book_hotel", label: "🏨 Буудал хайх" }],
        context: intent,
        cards: []
      };
    }

    if (intent.wantsFlight && intent.city) {
      return {
        reply: `✈️ **${intent.city} нислэг:**\n\nУлаанбаатар → ${intent.city} чиглэлд шууд эсвэл дамжин нислэг байж болно. 7–14 хоногийн өмнө захиалбал илүү хямд.\n\n«Нислэг шалгах» товчоор одоогийн боломжийг харна.`,
        quickReplies: [{ id: "flight_check", label: "✈️ Нислэг дэлгэрэнгүй" }],
        ctas: [{ id: "book_flight", label: "✈️ Нислэг хайх" }],
        context: intent,
        cards: []
      };
    }

    if (intent.wantsBudget) {
      const city = intent.city || "Шанхай";
      const d = intent.days || 5;
      const p = intent.people || 2;
      return {
        reply: `💰 **Төсөв (${city}, ${d} хоног, ${p} хүн):**\n\n• Буудал: ~1,200,000–2,500,000 ₮\n• Хоол: ~500,000–950,000 ₮\n• Метро/тээвэр: ~120,000–250,000 ₮\n• Үзвэр: ~600,000–1,200,000 ₮\n• **Нийт: ~3–5.5 сая ₮** (нислэг тусад)\n\nХэдэн сар, хэдэн хоног, хэдэн хүн явах вэ? Илүү нарийвчилж тооцоолъё.`,
        quickReplies: [
          { id: "route_plan", label: "🗺 Маршрут" },
          { id: "hotel_suggest", label: "🏨 Буудал" }
        ],
        ctas: [],
        context: { ...intent, city, days: d, people: p },
        cards: []
      };
    }

    if (intent.city_id === "shanghai" || (intent.city === "Шанхай")) {
      return shanghaiPlan(intent.days, intent.people, intent.month);
    }
    if (intent.city_id === "beijing" || intent.city === "Бээжин") {
      return beijingPlan(intent.days, intent.people, intent.month);
    }
    if (intent.country === "Тайланд") {
      return countryBrief("Тайланд", "🇹🇭 **Тайланд:** Бангкок, Пхукет, Чианг Май — визгүй 30 хоног. Бангкок = shopping + хоол, Пхукет = далай.\n\nХэдэн хоног, аль хот руу явах вэ?");
    }
    if (intent.country === "Вьетнам") {
      return countryBrief("Вьетнам", "🇻🇳 **Вьетнам:** Дананг, Нячанг, Хошимин, Ханой — e-visa эсвэл визгүй богино хугацаа.\n\nДалай + хоолны аялалд Дананг маш сайн.");
    }

    if (/^(sain|сайн|hello|hi|hey)\b/i.test(fold(message))) {
      return {
        reply: "Сайн байна уу! Би таны **аяллын зөвлөх**. Маршрут, буудал, нислэг, eSIM, төсөв — бүгдийг Монгол хэлээр зөвлөнө.\n\nЖишээ: «7 сард Шанхай 5 хоног 2 хүн» гэж бичээрэй.\n\n**Чат бүрэн үнэгүй** — form, утас шаардлагагүй.",
        quickReplies: [
          { id: "route_plan", label: "🗺 Маршрут" },
          { id: "hotel_suggest", label: "🏨 Буудал" },
          { id: "esim_view", label: "📶 eSIM" }
        ],
        ctas: [],
        context: {},
        cards: []
      };
    }

    return {
      reply: "Би таны аяллыг төлөвлөж чадна. Хаашаа, хэзээ, хэдэн хоног, хэдэн хүн явах вэ?\n\nЖишээ:\n• 7 сард Шанхай 5 хоног 2 хүн\n• shanghai 6 honog — hotel + esim\n• Бээжин 3 хонog маршрут",
      quickReplies: [
        { id: "route_plan", label: "🗺 Маршрут" },
        { id: "hotel_suggest", label: "🏨 Буудал" },
        { id: "flight_check", label: "✈️ Нислэг" },
        { id: "esim_view", label: "📶 eSIM" }
      ],
      ctas: [],
      context: intent,
      cards: []
    };
  }

  root.AiLocalResponses = {
    parseTravelMessage,
    generateLocalTravelResponse
  };
})(typeof window !== "undefined" ? window : globalThis);
