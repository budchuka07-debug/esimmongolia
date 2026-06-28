/**
 * Travel destinations — countries, cities, normalization (supplier-ready)
 */
(function () {
  const COUNTRIES = {
    mongolia: { id: "mongolia", name_mn: "Монгол", name_en: "Mongolia", flag: "🇲🇳", currency: "MNT" },
    china: { id: "china", name_mn: "Хятад", name_en: "China", flag: "🇨🇳", currency: "CNY" },
    thailand: { id: "thailand", name_mn: "Тайланд", name_en: "Thailand", flag: "🇹🇭", currency: "THB" },
    vietnam: { id: "vietnam", name_mn: "Вьетнам", name_en: "Vietnam", flag: "🇻🇳", currency: "VND" },
    japan: { id: "japan", name_mn: "Япон", name_en: "Japan", flag: "🇯🇵", currency: "JPY" },
    korea: { id: "korea", name_mn: "Солонгос", name_en: "South Korea", flag: "🇰🇷", currency: "KRW" },
    singapore: { id: "singapore", name_mn: "Сингапур", name_en: "Singapore", flag: "🇸🇬", currency: "SGD" },
    malaysia: { id: "malaysia", name_mn: "Малайз", name_en: "Malaysia", flag: "🇲🇾", currency: "MYR" },
    indonesia: { id: "indonesia", name_mn: "Индонез", name_en: "Indonesia", flag: "🇮🇩", currency: "IDR" },
    uae: { id: "uae", name_mn: "Дубай / АНЭУ", name_en: "UAE", flag: "🇦🇪", currency: "AED" },
    turkey: { id: "turkey", name_mn: "Турк", name_en: "Turkey", flag: "🇹🇷", currency: "TRY" }
  };

  const CITIES = {
    beijing: { id: "beijing", country_id: "china", name_mn: "Бээжин", name_en: "Beijing", local: "北京", aliases: ["Бээжин", "Beijing", "Peking", "北京", "PEK", "PKX"] },
    shanghai: { id: "shanghai", country_id: "china", name_mn: "Шанхай", name_en: "Shanghai", local: "上海", aliases: ["Шанхай", "Shanghai", "上海", "PVG"] },
    guangzhou: { id: "guangzhou", country_id: "china", name_mn: "Гуанжоу", name_en: "Guangzhou", local: "广州", aliases: ["Гуанжоу", "Guangzhou", "Canton", "广州"] },
    shenzhen: { id: "shenzhen", country_id: "china", name_mn: "Шэньжэнь", name_en: "Shenzhen", local: "深圳", aliases: ["Шэньжэнь", "Shenzhen", "深圳"] },
    hohhot: { id: "hohhot", country_id: "china", name_mn: "Хөх хот", name_en: "Hohhot", local: "呼和浩特", aliases: ["Хөх хот", "Hohhot", "Huhehaote", "呼和浩特"] },
    chengdu: { id: "chengdu", country_id: "china", name_mn: "Чэнду", name_en: "Chengdu", local: "成都", aliases: ["Чэнду", "Chengdu", "成都"] },
    harbin: { id: "harbin", country_id: "china", name_mn: "Харбин", name_en: "Harbin", local: "哈尔滨", aliases: ["Харбин", "Harbin", "哈尔滨"] },
    xian: { id: "xian", country_id: "china", name_mn: "Сиань", name_en: "Xi'an", local: "西安", aliases: ["Сиань", "Xi'an", "Xian", "西安"] },
    yiwu: { id: "yiwu", country_id: "china", name_mn: "Иү", name_en: "Yiwu", local: "义乌", aliases: ["Иү", "Yiwu", "义乌"] },
    dalian: { id: "dalian", country_id: "china", name_mn: "Далян", name_en: "Dalian", local: "大连", aliases: ["Далян", "Dalian", "大连", "DLC"] },
    hangzhou: { id: "hangzhou", country_id: "china", name_mn: "Ханчжоу", name_en: "Hangzhou", local: "杭州", aliases: ["Ханчжоу", "Hangzhou", "杭州", "HGH"] },
    suzhou: { id: "suzhou", country_id: "china", name_mn: "Сүчжоу", name_en: "Suzhou", local: "苏州", aliases: ["Сүчжоу", "Suzhou", "苏州"] },
    nanjing: { id: "nanjing", country_id: "china", name_mn: "Нанжин", name_en: "Nanjing", local: "南京", aliases: ["Нанжин", "Nanjing", "南京", "NKG"] },
    qingdao: { id: "qingdao", country_id: "china", name_mn: "Циндао", name_en: "Qingdao", local: "青岛", aliases: ["Циндао", "Qingdao", "青岛", "TAO"] },
    xiamen: { id: "xiamen", country_id: "china", name_mn: "Шямын", name_en: "Xiamen", local: "厦门", aliases: ["Шямын", "Xiamen", "厦门", "XMN"] },
    kunming: { id: "kunming", country_id: "china", name_mn: "Куньмин", name_en: "Kunming", local: "昆明", aliases: ["Куньмин", "Kunming", "昆明", "KMG"] },
    wuhan: { id: "wuhan", country_id: "china", name_mn: "Уухан", name_en: "Wuhan", local: "武汉", aliases: ["Уухан", "Wuhan", "武汉", "WUH"] },
    changsha: { id: "changsha", country_id: "china", name_mn: "Чанша", name_en: "Changsha", local: "长沙", aliases: ["Чанша", "Changsha", "长沙", "CSX"] },
    zhangjiajie: { id: "zhangjiajie", country_id: "china", name_mn: "Жанжяжэ", name_en: "Zhangjiajie", local: "张家界", aliases: ["Жанжяжэ", "Zhangjiajie", "张家界", "DYG"] },
    sanya: { id: "sanya", country_id: "china", name_mn: "Саня", name_en: "Sanya", local: "三亚", aliases: ["Саня", "Sanya", "三亚", "SYX"] },
    erenhot: { id: "erenhot", country_id: "china", name_mn: "Эрээн", name_en: "Erenhot", local: "二连浩特", aliases: ["Эрээн", "Erenhot", "Erlian", "二连浩特"] },
    bangkok: { id: "bangkok", country_id: "thailand", name_mn: "Бангкок", name_en: "Bangkok", local: "กรุงเทพ", aliases: ["Бангкок", "Bangkok", "BKK"] },
    phuket: { id: "phuket", country_id: "thailand", name_mn: "Пхукет", name_en: "Phuket", local: "ภูเก็ต", aliases: ["Пхукет", "Phuket", "HKT"] },
    pattaya: { id: "pattaya", country_id: "thailand", name_mn: "Паттайа", name_en: "Pattaya", local: "พัทยา", aliases: ["Паттайа", "Pattaya"] },
    chiang_mai: { id: "chiang_mai", country_id: "thailand", name_mn: "Чиангмай", name_en: "Chiang Mai", local: "เชียงใหม่", aliases: ["Чиангмай", "Chiang Mai", "CNX"] },
    krabi: { id: "krabi", country_id: "thailand", name_mn: "Краби", name_en: "Krabi", local: "กระบี่", aliases: ["Краби", "Krabi", "KBV"] },
    hanoi: { id: "hanoi", country_id: "vietnam", name_mn: "Ханой", name_en: "Hanoi", local: "Hà Nội", aliases: ["Ханой", "Hanoi", "HAN"] },
    ho_chi_minh: { id: "ho_chi_minh", country_id: "vietnam", name_mn: "Хошимин", name_en: "Ho Chi Minh City", local: "TP.HCM", aliases: ["Хошимин", "Ho Chi Minh", "Saigon", "SGN"] },
    da_nang: { id: "da_nang", country_id: "vietnam", name_mn: "Дананг", name_en: "Da Nang", local: "Đà Nẵng", aliases: ["Дананг", "Da Nang", "DAD"] },
    nha_trang: { id: "nha_trang", country_id: "vietnam", name_mn: "Нячанг", name_en: "Nha Trang", local: "Nha Trang", aliases: ["Нячанг", "Nha Trang", "CXR"] },
    vung_tau: { id: "vung_tau", country_id: "vietnam", name_mn: "Вунгтау", name_en: "Vung Tau", local: "Vũng Tàu", aliases: ["Вунгтау", "Vung Tau"] },
    bali: { id: "bali", country_id: "indonesia", name_mn: "Бали", name_en: "Bali", local: "Bali", aliases: ["Бали", "Bali", "DPS", "Ubud"] },
    jakarta: { id: "jakarta", country_id: "indonesia", name_mn: "Жакарта", name_en: "Jakarta", local: "Jakarta", aliases: ["Жакарта", "Jakarta", "CGK"] },
    yogyakarta: { id: "yogyakarta", country_id: "indonesia", name_mn: "Жогжакарта", name_en: "Yogyakarta", local: "Yogyakarta", aliases: ["Жогжакарта", "Yogyakarta", "Jogja"] },
    tokyo: { id: "tokyo", country_id: "japan", name_mn: "Токио", name_en: "Tokyo", local: "東京", aliases: ["Токио", "Tokyo", "NRT", "HND"] },
    osaka: { id: "osaka", country_id: "japan", name_mn: "Осака", name_en: "Osaka", local: "大阪", aliases: ["Осака", "Osaka", "KIX"] },
    kyoto: { id: "kyoto", country_id: "japan", name_mn: "Киото", name_en: "Kyoto", local: "京都", aliases: ["Киото", "Kyoto"] },
    fukuoka: { id: "fukuoka", country_id: "japan", name_mn: "Фукуока", name_en: "Fukuoka", local: "福岡", aliases: ["Фукуока", "Fukuoka", "FUK"] },
    seoul: { id: "seoul", country_id: "korea", name_mn: "Сөүл", name_en: "Seoul", local: "서울", aliases: ["Сөүл", "Seoul", "ICN", "GMP"] },
    busan: { id: "busan", country_id: "korea", name_mn: "Пусан", name_en: "Busan", local: "부산", aliases: ["Пусан", "Busan", "PUS"] },
    jeju: { id: "jeju", country_id: "korea", name_mn: "Жэжү", name_en: "Jeju", local: "제주", aliases: ["Жэжү", "Jeju", "CJU"] },
    singapore: { id: "singapore", country_id: "singapore", name_mn: "Сингапур", name_en: "Singapore", local: "Singapore", aliases: ["Сингапур", "Singapore", "SIN"] },
    kuala_lumpur: { id: "kuala_lumpur", country_id: "malaysia", name_mn: "Куала Лумпур", name_en: "Kuala Lumpur", local: "KL", aliases: ["Куала Лумпур", "Kuala Lumpur", "KL", "KUL"] },
    penang: { id: "penang", country_id: "malaysia", name_mn: "Пенанг", name_en: "Penang", local: "Penang", aliases: ["Пенанг", "Penang", "Georgetown"] },
    dubai: { id: "dubai", country_id: "uae", name_mn: "Дубай", name_en: "Dubai", local: "دبي", aliases: ["Дубай", "Dubai", "DXB"] },
    abu_dhabi: { id: "abu_dhabi", country_id: "uae", name_mn: "Абу Даби", name_en: "Abu Dhabi", local: "أبوظبي", aliases: ["Абу Даби", "Abu Dhabi", "AUH"] },
    istanbul: { id: "istanbul", country_id: "turkey", name_mn: "Стамбул", name_en: "Istanbul", local: "İstanbul", aliases: ["Стамбул", "Istanbul", "IST"] },
    antalya: { id: "antalya", country_id: "turkey", name_mn: "Анталья", name_en: "Antalya", local: "Antalya", aliases: ["Анталья", "Antalya", "AYT"] },
    ulanbaatar: { id: "ulanbaatar", country_id: "mongolia", name_mn: "Улаанбаатар", name_en: "Ulaanbaatar", local: "УБ", aliases: ["Улаанбаатар", "Ulaanbaatar", "UB", "UBN"] }
  };

  const ALIAS_INDEX = {};
  Object.values(CITIES).forEach((city) => {
    const keys = new Set([city.id, city.name_mn, city.name_en, city.local, ...(city.aliases || [])]);
    keys.forEach((k) => {
      const norm = normalizeKey(k);
      if (norm) ALIAS_INDEX[norm] = city.id;
    });
  });

  function normalizeKey(s) {
    return String(s || "").trim().toLowerCase().replace(/[''`]/g, "").replace(/\s+/g, " ");
  }

  function normalizeCity(input) {
    const raw = String(input || "").trim();
    if (!raw) return null;
    const key = normalizeKey(raw);
    if (ALIAS_INDEX[key]) return ALIAS_INDEX[key];
    const partial = Object.entries(ALIAS_INDEX).find(([alias]) =>
      key.length >= 3 && (key.includes(alias) || alias.includes(key))
    );
    return partial ? partial[1] : null;
  }

  function normalizeCountry(input) {
    const key = normalizeKey(input);
    if (!key) return null;
    const hit = Object.values(COUNTRIES).find((c) =>
      [c.id, c.name_mn, c.name_en].some((n) => normalizeKey(n) === key)
    );
    return hit?.id || null;
  }

  function getCity(cityId) { return CITIES[cityId] || null; }
  function getCountry(countryId) { return COUNTRIES[countryId] || null; }

  function getCityLabel(cityId) {
    const c = getCity(cityId);
    if (!c) return cityId || "";
    return c.local ? `${c.name_mn} (${c.local})` : c.name_mn;
  }

  function getCityLabelMn(cityId) {
    const c = getCity(cityId);
    return c ? c.name_mn : String(cityId || "");
  }

  function getCitiesByCountry(countryId) {
    const list = Object.values(CITIES).filter((c) => c.country_id === countryId && c.id !== "ulanbaatar");
    if (countryId === "china" && window.CHINA_DESTINATIONS?.TIER1) {
      const order = [...window.CHINA_DESTINATIONS.TIER1, ...window.CHINA_DESTINATIONS.TIER2];
      const rank = Object.fromEntries(order.map((id, i) => [id, i]));
      list.sort((a, b) => (rank[a.id] ?? 999) - (rank[b.id] ?? 999));
    }
    return list;
  }

  function allCityOptions(countryId) {
    const list = countryId ? getCitiesByCountry(countryId) : Object.values(CITIES).filter((c) => c.country_id !== "mongolia");
    return list.map((c) => ({
      id: c.id,
      country_id: c.country_id,
      label: `${c.name_mn} — ${c.name_en}`
    }));
  }

  function cityMapUrl(cityId, hotelName) {
    const c = getCity(cityId);
    if (!c) return "https://www.google.com/maps";
    const q = encodeURIComponent(`${hotelName || ""} ${c.name_en}`.trim());
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  window.TRAVEL_CITIES = {
    COUNTRIES,
    CITIES,
    normalizeCity,
    normalizeCountry,
    getCity,
    getCountry,
    getCityLabel,
    getCityLabelMn,
    getCitiesByCountry,
    allCityOptions,
    cityMapUrl
  };
})();
