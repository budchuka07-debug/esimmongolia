/**
 * Asian hotel-search destinations — countries, cities, Mongolian labels, aliases.
 * Local fallback when Supabase catalog is unavailable.
 */
(function (root) {
  const HOTEL_COUNTRY_IDS = [
    "china", "thailand", "vietnam", "japan", "korea", "singapore", "malaysia",
    "indonesia", "philippines", "taiwan", "hongkong", "macau", "kazakhstan",
    "uzbekistan", "laos", "cambodia", "india", "nepal", "sri_lanka", "maldives",
    "uae", "turkey"
  ];

  function country(id, name_mn, name_en, flag, cityIds, defaultCityId) {
    return { id, name_mn, name_en, flag: flag || "🏳️", cityIds, defaultCityId: defaultCityId || cityIds[0] };
  }

  function city(id, country_id, name_mn, name_en, local, aliases) {
    const base = [id, name_mn, name_en, local, ...(aliases || [])].filter(Boolean);
    return {
      id,
      slug: id,
      country_id,
      name_mn,
      name_en,
      local: local || "",
      aliases: [...new Set(base)]
    };
  }

  const COUNTRY_DEFS = [
    country("china", "Хятад", "China", "🇨🇳",
      ["beijing", "shanghai", "guangzhou", "shenzhen", "chengdu", "chongqing", "xian", "hangzhou", "nanjing", "wuhan", "changsha", "xiamen", "qingdao", "dalian", "harbin", "hohhot", "erenhot", "sanya", "kunming", "guilin", "suzhou"],
      "shanghai"),
    country("thailand", "Тайланд", "Thailand", "🇹🇭",
      ["bangkok", "pattaya", "phuket", "chiang_mai", "krabi", "hua_hin", "koh_samui", "chiang_rai"],
      "bangkok"),
    country("vietnam", "Вьетнам", "Vietnam", "🇻🇳",
      ["hanoi", "ho_chi_minh", "da_nang", "nha_trang", "phu_quoc", "vung_tau", "hoi_an", "da_lat", "ha_long"],
      "hanoi"),
    country("japan", "Япон", "Japan", "🇯🇵",
      ["tokyo", "osaka", "kyoto", "nagoya", "sapporo", "fukuoka", "okinawa", "hiroshima", "kobe", "yokohama"],
      "tokyo"),
    country("korea", "Өмнөд Солонгос", "South Korea", "🇰🇷",
      ["seoul", "busan", "incheon", "jeju", "daegu", "daejeon", "gyeongju"],
      "seoul"),
    country("singapore", "Сингапур", "Singapore", "🇸🇬", ["singapore"], "singapore"),
    country("malaysia", "Малайз", "Malaysia", "🇲🇾",
      ["kuala_lumpur", "penang", "langkawi", "johor_bahru", "kota_kinabalu", "malacca"],
      "kuala_lumpur"),
    country("indonesia", "Индонез", "Indonesia", "🇮🇩",
      ["bali", "jakarta", "surabaya", "yogyakarta", "bandung", "lombok", "medan"],
      "bali"),
    country("philippines", "Филиппин", "Philippines", "🇵🇭",
      ["manila", "cebu", "boracay", "davao", "palawan", "bohol", "clark"],
      "manila"),
    country("taiwan", "Тайвань", "Taiwan", "🇹🇼",
      ["taipei", "kaohsiung", "taichung", "tainan"],
      "taipei"),
    country("hongkong", "Хонконг", "Hong Kong", "🇭🇰",
      ["hong_kong", "kowloon", "lantau"],
      "hong_kong"),
    country("macau", "Макао", "Macau", "🇲🇴", ["macau", "cotai"], "macau"),
    country("kazakhstan", "Казахстан", "Kazakhstan", "🇰🇿",
      ["almaty", "astana", "shymkent"],
      "almaty"),
    country("uzbekistan", "Узбекистан", "Uzbekistan", "🇺🇿",
      ["tashkent", "samarkand", "bukhara", "khiva"],
      "tashkent"),
    country("laos", "Лаос", "Laos", "🇱🇦",
      ["vientiane", "luang_prabang", "vang_vieng", "pakse"],
      "vientiane"),
    country("cambodia", "Камбож", "Cambodia", "🇰🇭",
      ["phnom_penh", "siem_reap", "sihanoukville"],
      "phnom_penh"),
    country("india", "Энэтхэг", "India", "🇮🇳",
      ["delhi", "mumbai", "bangalore", "chennai", "goa", "jaipur", "agra", "kolkata", "hyderabad"],
      "delhi"),
    country("nepal", "Балба", "Nepal", "🇳🇵", ["kathmandu", "pokhara"], "kathmandu"),
    country("sri_lanka", "Шри Ланка", "Sri Lanka", "🇱🇰",
      ["colombo", "kandy", "galle", "negombo", "ella"],
      "colombo"),
    country("maldives", "Мальдив", "Maldives", "🇲🇻", ["male", "maafushi"], "male"),
    country("uae", "Арабын Нэгдсэн Эмират", "United Arab Emirates", "🇦🇪",
      ["dubai", "abu_dhabi", "sharjah", "ras_al_khaimah"],
      "dubai"),
    country("turkey", "Турк", "Turkey", "🇹🇷",
      ["istanbul", "antalya", "cappadocia", "izmir", "ankara", "bodrum"],
      "istanbul")
  ];

  const CITY_DEFS = [
    city("beijing", "china", "Бээжин", "Beijing", "北京", ["Peking", "PEK", "PKX"]),
    city("shanghai", "china", "Шанхай", "Shanghai", "上海", ["Шанхай", "上海", "PVG"]),
    city("guangzhou", "china", "Гуанжоу", "Guangzhou", "广州", ["Canton"]),
    city("shenzhen", "china", "Шэньжэнь", "Shenzhen", "深圳"),
    city("chengdu", "china", "Чэнду", "Chengdu", "成都"),
    city("chongqing", "china", "Чунцин", "Chongqing", "重庆", ["CKG"]),
    city("xian", "china", "Сиань", "Xi'an", "西安", ["Xian", "Xi'an"]),
    city("hangzhou", "china", "Ханчжоу", "Hangzhou", "杭州", ["HGH"]),
    city("nanjing", "china", "Нанжин", "Nanjing", "南京", ["NKG"]),
    city("wuhan", "china", "Уухан", "Wuhan", "武汉", ["WUH"]),
    city("changsha", "china", "Чанша", "Changsha", "长沙", ["CSX"]),
    city("xiamen", "china", "Шямын", "Xiamen", "厦门", ["XMN"]),
    city("qingdao", "china", "Циндао", "Qingdao", "青岛", ["TAO"]),
    city("dalian", "china", "Далян", "Dalian", "大连", ["DLC"]),
    city("harbin", "china", "Харбин", "Harbin", "哈尔滨"),
    city("hohhot", "china", "Хөх хот", "Hohhot", "呼和浩特"),
    city("erenhot", "china", "Эрээн", "Erenhot", "二连浩特", ["Erlian"]),
    city("sanya", "china", "Саня", "Sanya", "三亚", ["SYX"]),
    city("kunming", "china", "Куньмин", "Kunming", "昆明", ["KMG"]),
    city("guilin", "china", "Гуйлинь", "Guilin", "桂林", ["KWL"]),
    city("suzhou", "china", "Сүчжоу", "Suzhou", "苏州"),

    city("bangkok", "thailand", "Бангкок", "Bangkok", "กรุงเทพ", ["Бангкок", "BKK"]),
    city("pattaya", "thailand", "Паттайа", "Pattaya", "พัทยา"),
    city("phuket", "thailand", "Пхукет", "Phuket", "ภูเก็ต", ["HKT"]),
    city("chiang_mai", "thailand", "Чиангмай", "Chiang Mai", "เชียงใหม่", ["CNX"]),
    city("krabi", "thailand", "Краби", "Krabi", "กระบี่", ["KBV"]),
    city("hua_hin", "thailand", "Хуа Хин", "Hua Hin", "หัวหิน"),
    city("koh_samui", "thailand", "Ко Самуи", "Koh Samui", "Ko Samui", ["USM"]),
    city("chiang_rai", "thailand", "Чианг Рай", "Chiang Rai", "เชียงราย", ["CEI"]),

    city("hanoi", "vietnam", "Ханой", "Hanoi", "Hà Nội", ["HAN"]),
    city("ho_chi_minh", "vietnam", "Хо Ши Мин", "Ho Chi Minh City", "TP.HCM", ["Saigon", "Хошимин", "SGN"]),
    city("da_nang", "vietnam", "Дананг", "Da Nang", "Đà Nẵng", ["DAD"]),
    city("nha_trang", "vietnam", "Нячанг", "Nha Trang", "Nha Trang", ["CXR"]),
    city("phu_quoc", "vietnam", "Фукуок", "Phu Quoc", "Phú Quốc", ["PQC"]),
    city("vung_tau", "vietnam", "Вунгтау", "Vung Tau", "Vũng Tàu"),
    city("hoi_an", "vietnam", "Хой Ан", "Hoi An", "Hội An"),
    city("da_lat", "vietnam", "Далат", "Da Lat", "Đà Lạt", ["DLI"]),
    city("ha_long", "vietnam", "Ха Лонг", "Ha Long", "Hạ Long"),

    city("tokyo", "japan", "Токио", "Tokyo", "東京", ["Токио", "NRT", "HND"]),
    city("osaka", "japan", "Осака", "Osaka", "大阪", ["KIX"]),
    city("kyoto", "japan", "Киото", "Kyoto", "京都"),
    city("nagoya", "japan", "Нагоя", "Nagoya", "名古屋", ["NGO"]),
    city("sapporo", "japan", "Саппоро", "Sapporo", "札幌", ["CTS"]),
    city("fukuoka", "japan", "Фукуока", "Fukuoka", "福岡", ["FUK"]),
    city("okinawa", "japan", "Окинава", "Okinawa", "沖縄", ["OKA", "Naha"]),
    city("hiroshima", "japan", "Хирошима", "Hiroshima", "広島", ["HIJ"]),
    city("kobe", "japan", "Кобе", "Kobe", "神戸"),
    city("yokohama", "japan", "Йокохама", "Yokohama", "横浜"),

    city("seoul", "korea", "Сөүл", "Seoul", "서울", ["Сөүл", "ICN", "GMP"]),
    city("busan", "korea", "Пусан", "Busan", "부산", ["PUS"]),
    city("incheon", "korea", "Инчон", "Incheon", "인천", ["ICN"]),
    city("jeju", "korea", "Жэжү", "Jeju", "제주", ["CJU"]),
    city("daegu", "korea", "Тэгу", "Daegu", "대구", ["TAE"]),
    city("daejeon", "korea", "Тэжон", "Daejeon", "대전"),
    city("gyeongju", "korea", "Гёнжү", "Gyeongju", "경주"),

    city("singapore", "singapore", "Сингапур", "Singapore", "Singapore", ["SIN"]),

    city("kuala_lumpur", "malaysia", "Куала Лумпур", "Kuala Lumpur", "KL", ["KUL"]),
    city("penang", "malaysia", "Пенанг", "Penang", "Penang", ["PEN", "Georgetown"]),
    city("langkawi", "malaysia", "Лангкави", "Langkawi", "Langkawi", ["LGK"]),
    city("johor_bahru", "malaysia", "Жохор Бахру", "Johor Bahru", "Johor Bahru", ["JHB"]),
    city("kota_kinabalu", "malaysia", "Кота Кинабалу", "Kota Kinabalu", "Kota Kinabalu", ["BKI"]),
    city("malacca", "malaysia", "Малакка", "Malacca", "Melaka"),

    city("bali", "indonesia", "Бали", "Bali", "Bali", ["Бали", "DPS", "Ubud"]),
    city("jakarta", "indonesia", "Жакарта", "Jakarta", "Jakarta", ["CGK"]),
    city("surabaya", "indonesia", "Сурабая", "Surabaya", "Surabaya", ["SUB"]),
    city("yogyakarta", "indonesia", "Жогжакарта", "Yogyakarta", "Yogyakarta", ["Jogja", "JOG"]),
    city("bandung", "indonesia", "Бандунг", "Bandung", "Bandung", ["BDO"]),
    city("lombok", "indonesia", "Ломбок", "Lombok", "Lombok", ["LOP"]),
    city("medan", "indonesia", "Медан", "Medan", "Medan", ["KNO"]),

    city("manila", "philippines", "Манила", "Manila", "Manila", ["MNL"]),
    city("cebu", "philippines", "Себу", "Cebu", "Cebu", ["CEB"]),
    city("boracay", "philippines", "Боракай", "Boracay", "Boracay", ["MPH"]),
    city("davao", "philippines", "Давао", "Davao", "Davao", ["DVO"]),
    city("palawan", "philippines", "Палаван", "Palawan", "Palawan", ["PPS"]),
    city("bohol", "philippines", "Бохол", "Bohol", "Bohol", ["TAG"]),
    city("clark", "philippines", "Кларк", "Clark", "Clark", ["CRK"]),

    city("taipei", "taiwan", "Тайбэй", "Taipei", "台北", ["TPE", "TSA"]),
    city("kaohsiung", "taiwan", "Гаосюн", "Kaohsiung", "高雄", ["KHH"]),
    city("taichung", "taiwan", "Тайчжун", "Taichung", "台中", ["RMQ"]),
    city("tainan", "taiwan", "Тайнань", "Tainan", "台南", ["TNN"]),

    city("hong_kong", "hongkong", "Хонконг", "Hong Kong", "香港", ["Хонконг", "HKG"]),
    city("kowloon", "hongkong", "Коулун", "Kowloon", "九龍"),
    city("lantau", "hongkong", "Лантау", "Lantau", "大嶼山"),

    city("macau", "macau", "Макао", "Macau", "澳門", ["MFM"]),
    city("cotai", "macau", "Котай", "Cotai", "路氹"),

    city("almaty", "kazakhstan", "Алматы", "Almaty", "Алматы", ["ALA"]),
    city("astana", "kazakhstan", "Астана", "Astana", "Астана", ["NQZ", "Nur-Sultan"]),
    city("shymkent", "kazakhstan", "Шымкент", "Shymkent", "Шымкент", ["CIT"]),

    city("tashkent", "uzbekistan", "Ташкент", "Tashkent", "Toshkent", ["TAS"]),
    city("samarkand", "uzbekistan", "Самарканд", "Samarkand", "Samarqand", ["SKD"]),
    city("bukhara", "uzbekistan", "Бухара", "Bukhara", "Buxoro"),
    city("khiva", "uzbekistan", "Хива", "Khiva", "Xiva"),

    city("vientiane", "laos", "Вьентьян", "Vientiane", "ວຽງຈັນ", ["VTE"]),
    city("luang_prabang", "laos", "Луанг Прабанг", "Luang Prabang", "ຫຼວງພະບາງ", ["LPQ"]),
    city("vang_vieng", "laos", "Ванг Вьенг", "Vang Vieng", "ວັງວຽງ"),
    city("pakse", "laos", "Паксе", "Pakse", "ປາກເຊ", ["PKZ"]),

    city("phnom_penh", "cambodia", "Пном Пень", "Phnom Penh", "ភ្នំពេញ", ["PNH"]),
    city("siem_reap", "cambodia", "Сием Рип", "Siem Reap", "សៀមរាប", ["REP", "Angkor"]),
    city("sihanoukville", "cambodia", "Сиануквиль", "Sihanoukville", "ព្រះសីហនុ"),

    city("delhi", "india", "Дели", "Delhi", "दिल्ली", ["DEL", "New Delhi"]),
    city("mumbai", "india", "Мумбай", "Mumbai", "मुंबई", ["BOM", "Bombay"]),
    city("bangalore", "india", "Бангалор", "Bangalore", "ಬೆಂಗಳೂರು", ["BLR", "Bengaluru"]),
    city("chennai", "india", "Ченнай", "Chennai", "சென்னை", ["MAA", "Madras"]),
    city("goa", "india", "Гоа", "Goa", "Goa", ["GOI"]),
    city("jaipur", "india", "Жайпур", "Jaipur", "जयपुर", ["JAI"]),
    city("agra", "india", "Агра", "Agra", "आगरा"),
    city("kolkata", "india", "Калькутта", "Kolkata", "কলকাতা", ["CCU", "Calcutta"]),
    city("hyderabad", "india", "Хайдарабад", "Hyderabad", "హైదరాబాద్", ["HYD"]),

    city("kathmandu", "nepal", "Катманду", "Kathmandu", "काठमाडौं", ["KTM"]),
    city("pokhara", "nepal", "Покхара", "Pokhara", "पोखरा", ["PKR"]),

    city("colombo", "sri_lanka", "Коломбо", "Colombo", "කොළඹ", ["CMB"]),
    city("kandy", "sri_lanka", "Канди", "Kandy", "මහනුවර"),
    city("galle", "sri_lanka", "Галле", "Galle", "ගාල්ල"),
    city("negombo", "sri_lanka", "Негомбо", "Negombo", "මීගමුව"),
    city("ella", "sri_lanka", "Элла", "Ella", "ඇල්ල"),

    city("male", "maldives", "Мале", "Male", "މާލެ", ["MLE"]),
    city("maafushi", "maldives", "Маафуши", "Maafushi", "Maafushi"),

    city("dubai", "uae", "Дубай", "Dubai", "دبي", ["DXB"]),
    city("abu_dhabi", "uae", "Абу Даби", "Abu Dhabi", "أبوظبي", ["AUH"]),
    city("sharjah", "uae", "Шаржа", "Sharjah", "الشارقة", ["SHJ"]),
    city("ras_al_khaimah", "uae", "Рас Аль Хайма", "Ras Al Khaimah", "رأس الخيمة", ["RKT"]),

    city("istanbul", "turkey", "Стамбул", "Istanbul", "İstanbul", ["IST", "SAW"]),
    city("antalya", "turkey", "Анталья", "Antalya", "Antalya", ["AYT"]),
    city("cappadocia", "turkey", "Каппадоки", "Cappadocia", "Kapadokya", ["NAV", "Kayseri"]),
    city("izmir", "turkey", "Измир", "Izmir", "İzmir", ["ADB"]),
    city("ankara", "turkey", "Анкара", "Ankara", "Ankara", ["ESB"]),
    city("bodrum", "turkey", "Бодрум", "Bodrum", "Bodrum", ["BJV"])
  ];

  const countryById = Object.fromEntries(
    COUNTRY_DEFS.map((c) => [c.id, { id: c.id, name_mn: c.name_mn, name_en: c.name_en, flag: c.flag }])
  );
  const cityById = Object.fromEntries(CITY_DEFS.map((c) => [c.id, c]));
  const cityOrderByCountry = Object.fromEntries(COUNTRY_DEFS.map((c) => [c.id, c.cityIds]));
  const defaultCityByCountry = Object.fromEntries(COUNTRY_DEFS.map((c) => [c.id, c.defaultCityId]));

  const aliasIndex = {};
  CITY_DEFS.forEach((c) => {
    c.aliases.forEach((k) => {
      const norm = String(k || "").trim().toLowerCase().replace(/[''`]/g, "").replace(/\s+/g, " ");
      if (norm) aliasIndex[norm] = c.id;
    });
  });

  function normalizeKey(s) {
    return String(s || "").trim().toLowerCase().replace(/[''`]/g, "").replace(/\s+/g, " ");
  }

  function normalizeCity(input) {
    const key = normalizeKey(input);
    if (!key) return null;
    if (aliasIndex[key]) return aliasIndex[key];
    const partial = Object.entries(aliasIndex).find(([alias]) =>
      key.length >= 3 && (key.includes(alias) || alias.includes(key))
    );
    return partial ? partial[1] : null;
  }

  function getCitiesByCountry(countryId) {
    const order = cityOrderByCountry[countryId] || [];
    return order.map((id) => cityById[id]).filter(Boolean);
  }

  function getDefaultCityId(countryId, preferDefault) {
    if (preferDefault && defaultCityByCountry[countryId]) {
      return defaultCityByCountry[countryId];
    }
    const order = cityOrderByCountry[countryId] || [];
    return order[0] || null;
  }

  const API = {
    HOTEL_COUNTRY_IDS,
    COUNTRY_DEFS,
    CITY_DEFS,
    getCountries: () => HOTEL_COUNTRY_IDS.map((id) => countryById[id]).filter(Boolean),
    getCities: () => CITY_DEFS.slice(),
    getCountry: (id) => countryById[id] || null,
    getCity: (id) => cityById[id] || null,
    getCitiesByCountry,
    getDefaultCityId,
    getFirstCityId: (countryId) => (cityOrderByCountry[countryId] || [])[0] || null,
    normalizeCity,
    getCityLabelMn: (id) => cityById[id]?.name_mn || String(id || ""),
    getCityLabelEn: (id) => cityById[id]?.name_en || String(id || "")
  };

  root.ASIA_DESTINATIONS = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
