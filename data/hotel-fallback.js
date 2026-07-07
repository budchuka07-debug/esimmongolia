/**
 * Hotel fallback generator — public-style ESTIMATED hotel suggestions.
 * Used ONLY when Supabase esm_hotels has no verified rows for a city.
 * These are NOT verified official hotels. data_source = "estimated_ai".
 */
(function (root) {
  const NEEDS_CHECK_MSG = "Үнэ, өрөө захиалга хийх үед дахин шалгагдана.";

  // Per-night base price (MNT) by star rating, before city tier factor.
  const BASE_PRICE_MNT = { 2: 180000, 3: 280000, 4: 480000, 5: 950000 };

  // Hotel category templates. label = English category, not a fake official name.
  const CATEGORIES = {
    budget3: { stars: 3, label: "Budget Hotel", desc: "Хямд, цэвэрхэн, богино хугацааны аялалд тохиромжтой." },
    mid4: { stars: 4, label: "Business Hotel", desc: "Дунд зэрэглэлийн тав тухтай, ажил хэрэг болон амралтад." },
    family4: { stars: 4, label: "Family Hotel", desc: "Гэр бүлд ээлтэй, өрөө уужим, хүүхэдтэй аялалд тохиромжтой." },
    metro3: { stars: 3, label: "Metro-side Hotel", desc: "Метроны буудалд ойр, хот дотор зорчиход хялбар." },
    airport3: { stars: 3, label: "Airport Transit Hotel", desc: "Нисэх буудлын ойролцоо, шилжин суух зорчигчдод тохиромжтой." },
    central4: { stars: 4, label: "Central Hotel", desc: "Хотын төвд, дэлгүүр, үзвэр, ресторанд ойр." },
    guesthouse: { stars: 2, label: "Guesthouse / Budget Stay", desc: "Хамгийн хэмнэлттэй, backpacker хэв маягийн байр." },
    lux5: { stars: 5, label: "Luxury Hotel", desc: "Тансаг зэрэглэл, бүрэн үйлчилгээтэй." }
  };

  // City-specific realistic area sets. tier: price multiplier for the city.
  const CITY_AREAS = {
    seoul: {
      city_id: "seoul", name_mn: "Сөүл", country_id: "korea", country_mn: "Солонгос", tier: 1.25,
      areas: [
        { id: "myeongdong", en: "Myeongdong", mn: "Мёндон", metro: true, cats: ["central4", "budget3"] },
        { id: "hongdae", en: "Hongdae", mn: "Хондэ", metro: true, cats: ["guesthouse", "metro3"] },
        { id: "gangnam", en: "Gangnam", mn: "Каннам", metro: true, cats: ["mid4", "lux5"] },
        { id: "dongdaemun", en: "Dongdaemun", mn: "Дондэмун", metro: true, cats: ["family4"] },
        { id: "seoul_station", en: "Seoul Station", mn: "Сөүл вокзал", metro: true, cats: ["metro3"] },
        { id: "incheon_airport", en: "Incheon Airport", mn: "Инчон нисэх буудал", metro: false, airport: true, cats: ["airport3"] }
      ]
    },
    busan: {
      city_id: "busan", name_mn: "Пусан", country_id: "korea", country_mn: "Солонгос", tier: 1.1,
      areas: [
        { id: "haeundae", en: "Haeundae", mn: "Хэундэ", metro: true, cats: ["central4", "family4"] },
        { id: "seomyeon", en: "Seomyeon", mn: "Сомён", metro: true, cats: ["mid4", "budget3"] },
        { id: "nampo", en: "Nampo-dong", mn: "Нампо", metro: true, cats: ["metro3", "guesthouse"] },
        { id: "gimhae_airport", en: "Gimhae Airport", mn: "Гимхэ нисэх буудал", airport: true, cats: ["airport3"] }
      ]
    },
    tokyo: {
      city_id: "tokyo", name_mn: "Токио", country_id: "japan", country_mn: "Япон", tier: 1.3,
      areas: [
        { id: "shinjuku", en: "Shinjuku", mn: "Шинжүкү", metro: true, cats: ["central4", "budget3"] },
        { id: "shibuya", en: "Shibuya", mn: "Шибуя", metro: true, cats: ["mid4", "guesthouse"] },
        { id: "asakusa", en: "Asakusa", mn: "Асакуса", metro: true, cats: ["family4", "metro3"] },
        { id: "ginza", en: "Ginza", mn: "Гинза", metro: true, cats: ["lux5"] },
        { id: "narita_airport", en: "Narita Airport", mn: "Нарита нисэх буудал", airport: true, cats: ["airport3"] }
      ]
    },
    osaka: {
      city_id: "osaka", name_mn: "Осака", country_id: "japan", country_mn: "Япон", tier: 1.2,
      areas: [
        { id: "namba", en: "Namba", mn: "Намба", metro: true, cats: ["central4", "budget3"] },
        { id: "umeda", en: "Umeda", mn: "Умеда", metro: true, cats: ["mid4", "family4"] },
        { id: "shinsaibashi", en: "Shinsaibashi", mn: "Шинсайбаши", metro: true, cats: ["metro3", "guesthouse"] },
        { id: "kansai_airport", en: "Kansai Airport", mn: "Кансай нисэх буудал", airport: true, cats: ["airport3"] }
      ]
    },
    bangkok: {
      city_id: "bangkok", name_mn: "Бангкок", country_id: "thailand", country_mn: "Тайланд", tier: 0.85,
      areas: [
        { id: "sukhumvit", en: "Sukhumvit", mn: "Сүхүмвит", metro: true, cats: ["central4", "mid4"] },
        { id: "silom", en: "Silom", mn: "Силом", metro: true, cats: ["mid4", "budget3"] },
        { id: "khaosan", en: "Khaosan", mn: "Каосан", metro: false, cats: ["guesthouse"] },
        { id: "pratunam", en: "Pratunam", mn: "Пратунам", metro: true, cats: ["family4", "metro3"] },
        { id: "suvarnabhumi_airport", en: "Suvarnabhumi Airport", mn: "Суварнабүми нисэх буудал", airport: true, cats: ["airport3"] }
      ]
    },
    singapore: {
      city_id: "singapore", name_mn: "Сингапур", country_id: "singapore", country_mn: "Сингапур", tier: 1.35,
      areas: [
        { id: "marina_bay", en: "Marina Bay", mn: "Марина Бэй", metro: true, cats: ["lux5", "central4"] },
        { id: "orchard", en: "Orchard", mn: "Орчард", metro: true, cats: ["mid4", "family4"] },
        { id: "chinatown", en: "Chinatown", mn: "Чайнатаун", metro: true, cats: ["budget3", "guesthouse"] },
        { id: "changi_airport", en: "Changi Airport", mn: "Чанги нисэх буудал", airport: true, cats: ["airport3"] }
      ]
    },
    dubai: {
      city_id: "dubai", name_mn: "Дубай", country_id: "uae", country_mn: "АНЭУ", tier: 1.3,
      areas: [
        { id: "downtown", en: "Downtown Dubai", mn: "Дубай төв", metro: true, cats: ["lux5", "central4"] },
        { id: "marina", en: "Dubai Marina", mn: "Дубай Марина", metro: true, cats: ["mid4", "family4"] },
        { id: "deira", en: "Deira", mn: "Дейра", metro: true, cats: ["budget3", "metro3"] },
        { id: "dxb_airport", en: "Dubai Airport", mn: "Дубай нисэх буудал", airport: true, cats: ["airport3"] }
      ]
    },
    istanbul: {
      city_id: "istanbul", name_mn: "Истанбул", country_id: "turkey", country_mn: "Турк", tier: 1.0,
      areas: [
        { id: "sultanahmet", en: "Sultanahmet", mn: "Султанахмет", metro: true, cats: ["central4", "family4"] },
        { id: "taksim", en: "Taksim", mn: "Таксим", metro: true, cats: ["mid4", "budget3"] },
        { id: "sisli", en: "Sisli", mn: "Шишли", metro: true, cats: ["metro3", "guesthouse"] },
        { id: "ist_airport", en: "Istanbul Airport", mn: "Истанбул нисэх буудал", airport: true, cats: ["airport3"] }
      ]
    },
    hanoi: {
      city_id: "hanoi", name_mn: "Ханой", country_id: "vietnam", country_mn: "Вьетнам", tier: 0.8,
      areas: [
        { id: "old_quarter", en: "Old Quarter", mn: "Хуучин хороолол", metro: false, cats: ["central4", "budget3", "guesthouse"] },
        { id: "hoan_kiem", en: "Hoan Kiem", mn: "Хоан Кием", metro: false, cats: ["mid4", "family4"] },
        { id: "noibai_airport", en: "Noi Bai Airport", mn: "Ной Бай нисэх буудал", airport: true, cats: ["airport3"] }
      ]
    },
    ho_chi_minh: {
      city_id: "ho_chi_minh", name_mn: "Хошимин", country_id: "vietnam", country_mn: "Вьетнам", tier: 0.8,
      areas: [
        { id: "district1", en: "District 1", mn: "1-р дүүрэг", metro: false, cats: ["central4", "mid4", "budget3"] },
        { id: "pham_ngu_lao", en: "Pham Ngu Lao", mn: "Фам Нгу Лао", metro: false, cats: ["guesthouse", "family4"] },
        { id: "tsn_airport", en: "Tan Son Nhat Airport", mn: "Тан Сон Нят нисэх буудал", airport: true, cats: ["airport3"] }
      ]
    }
  };

  // Country tier + label defaults for cities not explicitly mapped above.
  const COUNTRY_DEFAULTS = {
    korea: { mn: "Солонгос", tier: 1.2 },
    japan: { mn: "Япон", tier: 1.3 },
    thailand: { mn: "Тайланд", tier: 0.85 },
    vietnam: { mn: "Вьетнам", tier: 0.8 },
    singapore: { mn: "Сингапур", tier: 1.35 },
    malaysia: { mn: "Малайз", tier: 0.9 },
    indonesia: { mn: "Индонез", tier: 0.85 },
    uae: { mn: "АНЭУ", tier: 1.3 },
    turkey: { mn: "Турк", tier: 1.0 },
    china: { mn: "Хятад", tier: 1.0 }
  };

  // Map common Mongolian / English spellings to a CITY_AREAS key.
  const NAME_ALIASES = {
    "сөүл": "seoul", "seoul": "seoul", "сеул": "seoul",
    "пусан": "busan", "busan": "busan",
    "токио": "tokyo", "tokyo": "tokyo",
    "осака": "osaka", "osaka": "osaka",
    "бангкок": "bangkok", "bangkok": "bangkok",
    "сингапур": "singapore", "singapore": "singapore",
    "дубай": "dubai", "dubai": "dubai",
    "истанбул": "istanbul", "истамбул": "istanbul", "istanbul": "istanbul",
    "ханой": "hanoi", "hanoi": "hanoi",
    "хошимин": "ho_chi_minh", "ho chi minh": "ho_chi_minh", "хо ши мин": "ho_chi_minh"
  };

  const GENERIC_AREAS = [
    { id: "central", en: "City Center", mn: "Хотын төв", metro: true, cats: ["central4", "budget3"] },
    { id: "metro", en: "Metro District", mn: "Метро орчим", metro: true, cats: ["metro3", "mid4"] },
    { id: "downtown", en: "Downtown", mn: "Худалдааны төв", metro: true, cats: ["family4", "guesthouse"] },
    { id: "airport", en: "Airport Area", mn: "Нисэх буудлын бүс", metro: false, airport: true, cats: ["airport3"] }
  ];

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < String(str).length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function roundMnt(n) {
    return Math.round(n / 1000) * 1000;
  }

  function priceMnt(tier, stars, seed, extra) {
    const base = (BASE_PRICE_MNT[stars] || 300000) * (tier || 1);
    const variance = 0.9 + ((hashCode(seed) % 25) / 100); // 0.90 .. 1.14
    return roundMnt(base * variance * (extra || 1));
  }

  function titleCaseFromId(id) {
    return String(id || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  function resolveCityConfig(cityInput, opts) {
    const norm = root.TRAVEL_CITIES?.normalizeCity?.(cityInput);
    const raw = String(cityInput || "").trim().toLowerCase();
    const aliasKey = NAME_ALIASES[raw] || NAME_ALIASES[raw.replace(/_/g, " ")];
    const key = aliasKey || norm || raw.replace(/\s+/g, "_");
    if (CITY_AREAS[key]) return CITY_AREAS[key];

    // Build a generic config from catalog data or the raw input.
    const catalogCity = norm ? root.TRAVEL_CITIES?.getCity?.(norm) : null;
    const countryId = opts?.country || catalogCity?.country_id || null;
    const cDef = countryId ? COUNTRY_DEFAULTS[countryId] : null;
    const nameMn = catalogCity?.name_mn || (cityInput ? titleCaseFromId(cityInput) : "Хот");
    const nameEn = catalogCity?.name_en || titleCaseFromId(cityInput || key);
    return {
      city_id: norm || key,
      name_mn: nameMn,
      name_en: nameEn,
      country_id: countryId,
      country_mn: cDef?.mn || (countryId ? titleCaseFromId(countryId) : ""),
      tier: cDef?.tier || 1.0,
      generic: true,
      areas: GENERIC_AREAS.map((a) => ({
        ...a,
        en: `${nameEn} ${a.en}`
      }))
    };
  }

  /**
   * Generate 8–12 estimated hotel suggestion cards for a city.
   * @returns {Array<object>} estimated hotel cards (data_source = estimated_ai)
   */
  function generate(cityInput, opts) {
    const options = opts || {};
    const cfg = resolveCityConfig(cityInput, options);
    const nights = Math.max(1, Number(options.days || options.nights || 3) || 3);
    const cards = [];

    cfg.areas.forEach((area) => {
      const cats = area.cats && area.cats.length ? area.cats : ["central4", "budget3"];
      cats.forEach((catKey) => {
        const cat = CATEGORIES[catKey] || CATEGORIES.budget3;
        const seed = `${cfg.city_id}-${area.id}-${catKey}`;
        const extra = area.airport ? 1.05 : 1;
        const perNight = priceMnt(cfg.tier, cat.stars, seed, extra);
        const amenities = [];
        if (cat.stars >= 4) amenities.push("WiFi", "Өглөөний цай");
        else amenities.push("WiFi");
        if (area.metro) amenities.push("Метро ойр");
        if (area.airport) amenities.push("Буудлын шаттл");

        cards.push({
          id: `est-${seed}`,
          type: "hotel",
          data_source: "estimated_ai",
          estimated: true,
          verified: false,
          stars: cat.stars,
          name_en: `${area.en} ${cat.stars}★ ${cat.label}`,
          official_name: null,
          city_id: cfg.city_id,
          city_name_mn: cfg.name_mn,
          country_id: cfg.country_id,
          country_name_mn: cfg.country_mn,
          area_name: area.mn,
          area_id: area.id,
          category_key: catKey,
          nearby_metro: area.metro ? `${area.mn} метро` : null,
          distance_to_metro_m: area.metro ? 350 + (hashCode(seed) % 500) : 99999,
          family_friendly: catKey === "family4",
          breakfast: cat.stars >= 4,
          free_cancellation: true,
          amenities,
          description_mn: cat.desc,
          price_per_night_mnt: perNight,
          final_price_mnt: perNight * nights,
          nights,
          needs_check_message: NEEDS_CHECK_MSG,
          image: null
        });
      });
    });

    return cards.slice(0, 12);
  }

  /**
   * Build an AI/local-style stay suggestion for a city (areas + budget + fit).
   */
  function aiSuggest(cityInput, opts) {
    const cfg = resolveCityConfig(cityInput, opts || {});
    const areas = cfg.areas.filter((a) => !a.airport).slice(0, 4);
    const nights = Math.max(1, Number((opts || {}).days || (opts || {}).nights || 3) || 3);

    const budgetLow = roundMnt(BASE_PRICE_MNT[3] * cfg.tier * nights);
    const budgetHigh = roundMnt(BASE_PRICE_MNT[5] * cfg.tier * nights);

    const areaTips = areas.map((a) => {
      let who = "аялагчдад";
      if (a.cats?.includes("family4")) who = "гэр бүлд";
      else if (a.cats?.includes("lux5")) who = "тансаг амралт хүсэгчдэд";
      else if (a.cats?.includes("guesthouse") || a.cats?.includes("budget3")) who = "хэмнэлттэй аялагчдад";
      else if (a.cats?.includes("mid4")) who = "ажил хэргийн аялагчдад";
      return { area: a.mn, en: a.en, who, metro: !!a.metro };
    });

    return {
      cityMn: cfg.name_mn,
      areas: areaTips,
      budget: { low: budgetLow, high: budgetHigh, nights },
      suits: "Метроны шугамд ойр төвийн бүсийг сонговол зорчиход хамгийн хялбар. Хэмнэлттэй бол зочид буудлын бус хорооллыг, гэр бүлээрээ бол өрөө том зочид буудлыг санал болгоно.",
      message:
        `${cfg.name_mn} хотод санал болгох бүсүүд: ` +
        areaTips.map((t) => `${t.area} (${t.who})`).join(", ") +
        `. ${nights} шөнийн ойролцоо төсөв: ${budgetLow.toLocaleString("mn-MN")}₮–${budgetHigh.toLocaleString("mn-MN")}₮. ` +
        "Та тодорхой буудлыг манай аяллын зөвлөхөөр шалгуулж, бодит үнэ, өрөөний боломжийг авахыг хүсвэл мэдэгдээрэй."
    };
  }

  root.HOTEL_FALLBACK = { generate, aiSuggest, NEEDS_CHECK_MSG };
})(typeof window !== "undefined" ? window : globalThis);
