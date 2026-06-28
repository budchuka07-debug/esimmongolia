/**
 * China destination database — city_id architecture (supplier-ready)
 * 20 tier cities · 30 hotels each · scales to 1000+ inventory
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.CHINA_DESTINATIONS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const HOTEL_TIERS = { budget: 15, mid: 10, luxury: 5 };
  const DEFAULT_HOTEL_COUNT = 30;

  const VISA_DEFAULT = {
    type: "L (tourism)",
    portal: "visaforchina.org",
    embassy_mn: "Улаанбаатарт Хятадын ЭСЯ",
    note_mn: "Нислэг + буудлын захиалга, хугацаа, даатгал хавсаргана"
  };

  const ESIM_DEFAULT = {
    available: true,
    plans_mn: "7 / 14 / 30 хоног — WeChat, Alipay VPN-гүй",
    href: "/china.html#esim"
  };

  function city(base) {
    return {
      country_id: "china",
      hotel_count: DEFAULT_HOTEL_COUNT,
      hotel_tiers: { ...HOTEL_TIERS },
      long_stay_available: true,
      esim_available: true,
      esim: ESIM_DEFAULT,
      visa: VISA_DEFAULT,
      ...base
    };
  }

  const TIER1 = [
    "beijing", "shanghai", "guangzhou", "shenzhen", "chengdu",
    "hohhot", "yiwu", "harbin", "xian", "dalian"
  ];

  const TIER2 = [
    "hangzhou", "suzhou", "nanjing", "qingdao", "xiamen",
    "kunming", "wuhan", "changsha", "zhangjiajie", "sanya"
  ];

  const CITIES = {
    beijing: city({
      city_id: "beijing", tier: 1,
      name_en: "Beijing", name_mn: "Бээжин", name_zh: "北京",
      province_en: "Beijing Municipality", province_mn: "Бээжин",
      airport: { primary: "PEK", name: "Beijing Capital International", secondary: "PKX" },
      railway_station: ["Beijing South", "Beijing West", "Beijing"],
      metro: true, metro_lines: 27,
      climate_en: "Continental — hot humid summers, cold dry winters",
      climate_mn: "Т континенталь — зуун дулаан чийгтэй, өвөл хүйтэн",
      attractions: ["Forbidden City", "Great Wall (Mutianyu)", "Temple of Heaven", "Summer Palace", "798 Art District"],
      recommended_stay_days: 5,
      transport_info_en: "Metro (27 lines), Airport Express, Didi, 12306 HSR hub",
      transport_info_mn: "Метро 27 шугам, Airport Express, Didi, 12306 HSR төв",
      img: "/images/china/guide/beijing.jpg",
      route: "/china/beijing.html",
      budget_cny: { min: 300, max: 650 }
    }),

    shanghai: city({
      city_id: "shanghai", tier: 1,
      name_en: "Shanghai", name_mn: "Шанхай", name_zh: "上海",
      province_en: "Shanghai Municipality", province_mn: "Шанхай",
      airport: { primary: "PVG", name: "Pudong International", secondary: "SHA" },
      railway_station: ["Shanghai Hongqiao", "Shanghai", "Shanghai South"],
      metro: true, metro_lines: 20,
      climate_en: "Humid subtropical — mild winters, hot humid summers",
      climate_mn: "Чийгтэй субтропик — зун дулаан чийгтэй",
      attractions: ["The Bund", "Oriental Pearl", "Disneyland Shanghai", "Yu Garden", "French Concession"],
      recommended_stay_days: 4,
      transport_info_en: "Metro, Maglev to PVG, Hongqiao/Pudong airports, Didi",
      transport_info_mn: "Метро, Maglev PVG руу, Hongqiao/Pudong нисэх буудал",
      img: "/images/china/guide/shanghai.jpg",
      route: "/shanghai-route.html",
      budget_cny: { min: 350, max: 750 }
    }),

    guangzhou: city({
      city_id: "guangzhou", tier: 1,
      name_en: "Guangzhou", name_mn: "Гуанжоу", name_zh: "广州",
      province_en: "Guangdong", province_mn: "Гуанжоу муж",
      airport: { primary: "CAN", name: "Guangzhou Baiyun International" },
      railway_station: ["Guangzhou South", "Guangzhou East", "Guangzhou"],
      metro: true, metro_lines: 16,
      climate_en: "Subtropical — warm year-round, rainy season Apr–Sep",
      climate_mn: "Субтропик — жилийн турш дулаан, 4–9 сар бороотой",
      attractions: ["Canton Tower", "Chen Clan Academy", "Shamian Island", "Baiyun Mountain"],
      recommended_stay_days: 3,
      transport_info_en: "Metro, BRT, Guangzhou South HSR to HK/Shenzhen",
      transport_info_mn: "Метро, BRT, Guangzhou South HSR",
      img: "/images/china/guide/guangzhou.jpg",
      route: "/guangzhou-route.html",
      budget_cny: { min: 250, max: 520 }
    }),

    shenzhen: city({
      city_id: "shenzhen", tier: 1,
      name_en: "Shenzhen", name_mn: "Шэньжэнь", name_zh: "深圳",
      province_en: "Guangdong", province_mn: "Гуанжоу муж",
      airport: { primary: "SZX", name: "Shenzhen Bao'an International" },
      railway_station: ["Shenzhen North", "Shenzhen", "Futian"],
      metro: true, metro_lines: 17,
      climate_en: "Subtropical — mild winter, hot humid summer",
      climate_mn: "Субтропик — зун дулаан чийгтэй",
      attractions: ["OCT Harbour", "Window of the World", "Luohu border", "Dafen Oil Painting Village"],
      recommended_stay_days: 3,
      transport_info_en: "Metro to Hong Kong (Lo Wu/Futian), high-speed rail north",
      transport_info_mn: "Метро Хонконг руу, HSR хойд зүг",
      img: "/images/china/guide/shenzhen-city.jpg",
      route: "/shenzhen-route.html",
      budget_cny: { min: 280, max: 580 }
    }),

    chengdu: city({
      city_id: "chengdu", tier: 1,
      name_en: "Chengdu", name_mn: "Чэнду", name_zh: "成都",
      province_en: "Sichuan", province_mn: "Сычуань",
      airport: { primary: "TFU", name: "Chengdu Tianfu International", secondary: "CTU" },
      railway_station: ["Chengdu East", "Chengdu South", "Chengdu"],
      metro: true, metro_lines: 14,
      climate_en: "Humid subtropical — cloudy, mild winter, hot summer",
      climate_mn: "Чийгтэй субтропик — өвөл зөөлөн, зун дулаан",
      attractions: ["Giant Panda Base", "Jinli Street", "Leshan Giant Buddha", "Mount Qingcheng"],
      recommended_stay_days: 4,
      transport_info_en: "Metro, Tianfu/Shuangliu airports, HSR to Chongqing/Xi'an",
      transport_info_mn: "Метро, Tianfu/Shuangliu нисэх буудал, HSR",
      img: "/images/routes/china/chengdu-panda.jpg",
      route: "/china-20-places-route.html#chengdu",
      budget_cny: { min: 250, max: 520 }
    }),

    hohhot: city({
      city_id: "hohhot", tier: 1,
      name_en: "Hohhot", name_mn: "Хөх хот", name_zh: "呼和浩特",
      province_en: "Inner Mongolia", province_mn: "Өвөр Монгол",
      airport: { primary: "HET", name: "Hohhot Baita International" },
      railway_station: ["Hohhot", "Hohhot East"],
      metro: false,
      climate_en: "Continental steppe — cold dry winter, warm summer",
      climate_mn: "Т континенталь — өвөл хүйтэн, зун дулаан",
      attractions: ["Dazhao Temple", "Xilamuren Grassland", "Zhaojun Tomb", "Muslim Quarter"],
      recommended_stay_days: 2,
      transport_info_en: "Train from Erenhot ~2h, HSR to Beijing ~2h, no metro",
      transport_info_mn: "Эрээнээс галт тэрэг ~2 цаг, Бээжин HSR ~2 цаг, метро байхгүй",
      img: "/images/china/guide/hohhot.jpg",
      route: "/hohhot-route.html",
      budget_cny: { min: 180, max: 400 },
      long_stay_available: true
    }),

    yiwu: city({
      city_id: "yiwu", tier: 1,
      name_en: "Yiwu", name_mn: "Иү", name_zh: "义乌",
      province_en: "Zhejiang", province_mn: "Чжэцзян",
      airport: { primary: "YIW", name: "Yiwu International" },
      railway_station: ["Yiwu", "Yiwu West"],
      metro: false,
      climate_en: "Humid subtropical — hot summer, mild winter",
      climate_mn: "Чийгтэй субтропик",
      attractions: ["Yiwu International Trade City", "Futian Market", "Huangshan Market"],
      recommended_stay_days: 3,
      transport_info_en: "HSR from Hangzhou/Shanghai, trade-city shuttle buses",
      transport_info_mn: "Ханчжоу/Шанхай HSR, худалдааны төв рүү автобус",
      img: "/images/routes/china/chen-clan.jpg",
      route: "/china-route.html",
      budget_cny: { min: 200, max: 420 },
      visa: { ...VISA_DEFAULT, note_mn: "M виз (худалдаа) эсвэл L виз — бизнес зорилго тодорхой бичнэ" }
    }),

    harbin: city({
      city_id: "harbin", tier: 1,
      name_en: "Harbin", name_mn: "Харбин", name_zh: "哈尔滨",
      province_en: "Heilongjiang", province_mn: "Хэйлунцзян",
      airport: { primary: "HRB", name: "Harbin Taiping International" },
      railway_station: ["Harbin West", "Harbin", "Harbin East"],
      metro: true, metro_lines: 3,
      climate_en: "Cold continental — famous Ice Festival (Jan–Feb), −20°C winter",
      climate_mn: "Хүйтэн континенталь — 1–2 сар мөсний наадам, өвөл −20°C",
      attractions: ["Ice & Snow Festival", "Central Street", "Siberian Tiger Park", "Saint Sophia Cathedral"],
      recommended_stay_days: 3,
      transport_info_en: "Metro, HSR from Beijing ~5h, winter tourism peak Dec–Feb",
      transport_info_mn: "Метро, Бээжин HSR ~5 цаг, 12–2 сар өндөр сезон",
      img: "/images/routes/china/tianjin-eye.jpg",
      route: "/china-20-places-route.html#harbin",
      budget_cny: { min: 200, max: 480 }
    }),

    xian: city({
      city_id: "xian", tier: 1,
      name_en: "Xi'an", name_mn: "Сиань", name_zh: "西安",
      province_en: "Shaanxi", province_mn: "Шaanxi",
      airport: { primary: "XIY", name: "Xi'an Xianyang International" },
      railway_station: ["Xi'an North", "Xi'an", "Xi'an South"],
      metro: true, metro_lines: 9,
      climate_en: "Continental — hot dry summer, cold winter",
      climate_mn: "Т континенталь — зун халуун, өвөл хүйтэн",
      attractions: ["Terracotta Army", "Ancient City Wall", "Muslim Quarter", "Big Wild Goose Pagoda"],
      recommended_stay_days: 3,
      transport_info_en: "Metro, Xi'an North HSR hub (Silk Road gateway)",
      transport_info_mn: "Метро, Xi'an North HSR төв",
      img: "/images/routes/china/xian-terracotta.jpg",
      route: "/china-20-places-route.html#xian",
      budget_cny: { min: 220, max: 480 }
    }),

    dalian: city({
      city_id: "dalian", tier: 1,
      name_en: "Dalian", name_mn: "Далян", name_zh: "大连",
      province_en: "Liaoning", province_mn: "Ляонин",
      airport: { primary: "DLC", name: "Dalian Zhoushuizi International" },
      railway_station: ["Dalian North", "Dalian", "Dalian West"],
      metro: true, metro_lines: 5,
      climate_en: "Maritime temperate — mild compared to inland Northeast",
      climate_mn: "Далайн уур амьсгал — хойд зүгийн бусад хотноос зөөлөн",
      attractions: ["Xinghai Square", "Tiger Beach", "Russian Street", "Bangchuidao Scenic Area"],
      recommended_stay_days: 3,
      transport_info_en: "Metro, coastal tram, ferry connections, HSR to Shenyang/Beijing",
      transport_info_mn: "Метро, эрэг дагуу трам, HSR Шэньян/Бээжин",
      img: "/images/routes/china/qingdao.jpg",
      route: "/china-20-places-route.html#dalian",
      budget_cny: { min: 240, max: 500 }
    }),

    hangzhou: city({
      city_id: "hangzhou", tier: 2,
      name_en: "Hangzhou", name_mn: "Ханчжоу", name_zh: "杭州",
      province_en: "Zhejiang", province_mn: "Чжэцзян",
      airport: { primary: "HGH", name: "Hangzhou Xiaoshan International" },
      railway_station: ["Hangzhou East", "Hangzhou", "Hangzhou South"],
      metro: true, metro_lines: 12,
      climate_en: "Humid subtropical — West Lake mild year-round",
      climate_mn: "Чийгтэй субтропик — Баруун нуурын бүс зөөлөн",
      attractions: ["West Lake", "Lingyin Temple", "Longjing Tea Village", "Xixi Wetland"],
      recommended_stay_days: 3,
      transport_info_en: "Metro, 30 min HSR to Shanghai, airport to city ~40 min",
      transport_info_mn: "Метро, Шанхай HSR ~30 мин",
      img: "/images/routes/china/hangzhou-westlake.jpg",
      route: "/china-20-places-route.html#hangzhou",
      budget_cny: { min: 280, max: 550 }
    }),

    suzhou: city({
      city_id: "suzhou", tier: 2,
      name_en: "Suzhou", name_mn: "Сүчжоу", name_zh: "苏州",
      province_en: "Jiangsu", province_mn: "Жiangsu",
      airport: { primary: "WUX", name: "Sunan Shuofang (nearby)", note: "Shanghai airports also used" },
      railway_station: ["Suzhou North", "Suzhou", "Suzhou Industrial Park"],
      metro: true, metro_lines: 6,
      climate_en: "Humid subtropical — classical gardens, canal city",
      climate_mn: "Чийгтэй субтропик — цэцэрлэг, сув хотоор алдартай",
      attractions: ["Humble Administrator's Garden", "Tiger Hill", "Pingjiang Road", "Tongli Water Town"],
      recommended_stay_days: 2,
      transport_info_en: "Metro, 25 min HSR from Shanghai, ancient water towns nearby",
      transport_info_mn: "Метро, Шанхай HSR ~25 мин",
      img: "/images/routes/china/suzhou.jpg",
      route: "/china-20-places-route.html#suzhou",
      budget_cny: { min: 260, max: 520 }
    }),

    nanjing: city({
      city_id: "nanjing", tier: 2,
      name_en: "Nanjing", name_mn: "Нанжин", name_zh: "南京",
      province_en: "Jiangsu", province_mn: "Жiangsu",
      airport: { primary: "NKG", name: "Nanjing Lukou International" },
      railway_station: ["Nanjing South", "Nanjing", "Nanjing West"],
      metro: true, metro_lines: 13,
      climate_en: "Humid subtropical — former capital, hot summer",
      climate_mn: "Чийгтэй субтропик — хуучин нийслэл",
      attractions: ["Sun Yat-sen Mausoleum", "Confucius Temple", "Nanjing City Wall", "Xuanwu Lake"],
      recommended_stay_days: 3,
      transport_info_en: "Metro, Yangtze river crossing, HSR hub central China",
      transport_info_mn: "Метро, Yangtze гол, HSR төв",
      img: "/images/routes/china/national-museum.jpg",
      route: "/china-20-places-route.html#nanjing",
      budget_cny: { min: 250, max: 500 }
    }),

    qingdao: city({
      city_id: "qingdao", tier: 2,
      name_en: "Qingdao", name_mn: "Циндао", name_zh: "青岛",
      province_en: "Shandong", province_mn: "Шandong",
      airport: { primary: "TAO", name: "Qingdao Jiaodong International" },
      railway_station: ["Qingdao", "Qingdao North", "Qingdao West"],
      metro: true, metro_lines: 8,
      climate_en: "Maritime temperate — coastal, beer city, mild summer",
      climate_mn: "Далайн уур амьсгал — эрэг, зун зөөлөн",
      attractions: ["Zhanqiao Pier", "Badaguan Scenic Area", "Tsingtao Brewery", "Laoshan Mountain"],
      recommended_stay_days: 3,
      transport_info_en: "Metro, coastal beaches, HSR to Beijing ~4h",
      transport_info_mn: "Метро, эрэг, Бээжин HSR ~4 цаг",
      img: "/images/routes/china/qingdao.jpg",
      route: "/china-20-places-route.html#qingdao",
      budget_cny: { min: 260, max: 520 }
    }),

    xiamen: city({
      city_id: "xiamen", tier: 2,
      name_en: "Xiamen", name_mn: "Шямын", name_zh: "厦门",
      province_en: "Fujian", province_mn: "Фужиан",
      airport: { primary: "XMN", name: "Xiamen Gaoqi International" },
      railway_station: ["Xiamen North", "Xiamen", "Xiamen Island"],
      metro: true, metro_lines: 3,
      climate_en: "Subtropical maritime — island city, typhoon season Jul–Sep",
      climate_mn: "Субтропик далайн — арал хот, 7–9 сар хатуу шуурга",
      attractions: ["Gulangyu Island", "Nanputuo Temple", "Zhongshan Road", "Hulishan Fortress"],
      recommended_stay_days: 3,
      transport_info_en: "Metro + BRT, ferry to Gulangyu, Taiwan strait gateway",
      transport_info_mn: "Метро + BRT, Gulangyu завь",
      img: "/images/routes/china/xiamen.jpg",
      route: "/china-20-places-route.html#xiamen",
      budget_cny: { min: 270, max: 540 }
    }),

    kunming: city({
      city_id: "kunming", tier: 2,
      name_en: "Kunming", name_mn: "Куньмин", name_zh: "昆明",
      province_en: "Yunnan", province_mn: "Юnnan",
      airport: { primary: "KMG", name: "Kunming Changshui International" },
      railway_station: ["Kunming South", "Kunming", "Kunming West"],
      metro: true, metro_lines: 6,
      climate_en: "Spring city — mild year-round, gateway to Yunnan",
      climate_mn: "Хаврын хот — жилийн турш зөөлөн",
      attractions: ["Stone Forest", "Dian Lake", "Green Lake Park", "Western Hills"],
      recommended_stay_days: 3,
      transport_info_en: "Metro, HSR to Dali/Lijiang, flights across Yunnan",
      transport_info_mn: "Метро, Dali/Lijiang HSR, дотоод нислэг",
      img: "/images/routes/china/kunming.jpg",
      route: "/china-20-places-route.html#kunming",
      budget_cny: { min: 230, max: 480 }
    }),

    wuhan: city({
      city_id: "wuhan", tier: 2,
      name_en: "Wuhan", name_mn: "Уухан", name_zh: "武汉",
      province_en: "Hubei", province_mn: "Хубэй",
      airport: { primary: "WUH", name: "Wuhan Tianhe International" },
      railway_station: ["Wuhan", "Wuhan Hankou", "Wuhan East"],
      metro: true, metro_lines: 12,
      climate_en: "Humid subtropical — three towns, very hot summer ( furnace city )",
      climate_mn: "Чийгтэй субтропик — зун маш халуун",
      attractions: ["Yellow Crane Tower", "East Lake", "Hubuxiang Alley", "Wuhan Yangtze Bridge"],
      recommended_stay_days: 2,
      transport_info_en: "Metro, Yangtze ferry, major HSR crossroads",
      transport_info_mn: "Метро, Yangtze завь, HSR зааг",
      img: "/images/routes/china/wuhan.jpg",
      route: "/china-20-places-route.html#wuhan",
      budget_cny: { min: 220, max: 460 }
    }),

    changsha: city({
      city_id: "changsha", tier: 2,
      name_en: "Changsha", name_mn: "Чанша", name_zh: "长沙",
      province_en: "Hunan", province_mn: "Хunan",
      airport: { primary: "CSX", name: "Changsha Huanghua International" },
      railway_station: ["Changsha South", "Changsha", "Changsha West"],
      metro: true, metro_lines: 7,
      climate_en: "Humid subtropical — spicy food capital, hot summer",
      climate_mn: "Чийгтэй субтропик — халуун наран амттай хоолны хот",
      attractions: ["Orange Isle", "Yuelu Mountain", "Hunan Museum", "Taiping Old Street"],
      recommended_stay_days: 2,
      transport_info_en: "Metro, HSR to Guangzhou ~3h, gateway to Zhangjiajie",
      transport_info_mn: "Метро, Guangzhou HSR ~3 цаг, Zhangjiajie руу",
      img: "/images/routes/china/changsha.jpg",
      route: "/china-20-places-route.html#changsha",
      budget_cny: { min: 220, max: 450 }
    }),

    zhangjiajie: city({
      city_id: "zhangjiajie", tier: 2,
      name_en: "Zhangjiajie", name_mn: "Жанжяжэ", name_zh: "张家界",
      province_en: "Hunan", province_mn: "Хunan",
      airport: { primary: "DYG", name: "Zhangjiajie Hehua International" },
      railway_station: ["Zhangjiajie West", "Zhangjiajie"],
      metro: false,
      climate_en: "Mountain subtropical — misty peaks, Avatar mountains",
      climate_mn: "Уулын субтропик — мISTтэй оргил, Avatar уул",
      attractions: ["Zhangjiajie National Forest Park", "Tianmen Mountain", "Glass Bridge", "Baofeng Lake"],
      recommended_stay_days: 3,
      transport_info_en: "Cable cars, scenic buses, HSR from Changsha ~3h, no metro",
      transport_info_mn: "Кабель машин, HSR Чанша ~3 цаг, метро байхгүй",
      img: "/images/routes/china/zhangjiajie.jpg",
      route: "/china-20-places-route.html#zhangjiajie",
      budget_cny: { min: 280, max: 600 }
    }),

    sanya: city({
      city_id: "sanya", tier: 2,
      name_en: "Sanya", name_mn: "Саня", name_zh: "三亚",
      province_en: "Hainan", province_mn: "Хainan",
      airport: { primary: "SYX", name: "Sanya Phoenix International" },
      railway_station: ["Sanya", "Phoenix Airport"],
      metro: false,
      climate_en: "Tropical — beach resort, best Oct–Apr, typhoon Jun–Oct",
      climate_mn: "Тропик — эрэг амралт, 10–4 сар сайн",
      attractions: ["Yalong Bay", "Nanshan Temple", "Wuzhizhou Island", "Tianya Haijiao"],
      recommended_stay_days: 4,
      transport_info_en: "Resort shuttles, taxi, HSR around Hainan island ring",
      transport_info_mn: "Resort shuttle, такси, Hainan арлын HSR",
      img: "/images/routes/china/sanya.jpg",
      route: "/china-20-places-route.html#sanya",
      budget_cny: { min: 350, max: 800 },
      long_stay_available: true
    })
  };

  function getCity(cityId) {
    const id = String(cityId || "").trim();
    return CITIES[id] || null;
  }

  function getAll() {
    return [...TIER1, ...TIER2].map((id) => CITIES[id]).filter(Boolean);
  }

  function getTier1() { return TIER1.map((id) => CITIES[id]).filter(Boolean); }
  function getTier2() { return TIER2.map((id) => CITIES[id]).filter(Boolean); }

  function getHotelCount(cityId) {
    return getCity(cityId)?.hotel_count ?? DEFAULT_HOTEL_COUNT;
  }

  function isChinaCity(cityId) {
    return Boolean(CITIES[cityId]);
  }

  /** Star tier for hotel index slot (0-based) — 15 budget / 10 mid / 5 luxury */
  function starForHotelIndex(index) {
    if (index < HOTEL_TIERS.budget) return index % 2 === 0 ? 2 : 3;
    if (index < HOTEL_TIERS.budget + HOTEL_TIERS.mid) return 4;
    return 5;
  }

  function tierLabelForIndex(index) {
    if (index < HOTEL_TIERS.budget) return "budget";
    if (index < HOTEL_TIERS.budget + HOTEL_TIERS.mid) return "mid";
    return "luxury";
  }

  /** Build alias list for TRAVEL_CITIES / AI normalization */
  function aliasesForCity(cityId) {
    const c = getCity(cityId);
    if (!c) return [];
    return [c.name_en, c.name_mn, c.name_zh, cityId].filter(Boolean);
  }

  /** UI card shape for TRAVEL_DATA.chinaCities (derived, not duplicated) */
  function toTravelCard(cityId) {
    const c = getCity(cityId);
    if (!c) return null;
    const base = window.TRAVEL_CITIES?.getCity(cityId);
    return {
      id: c.city_id,
      name: c.name_mn,
      cn: c.name_zh,
      tier: c.tier,
      img: c.img,
      attractions: c.attractions,
      map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name_en + " China")}`,
      route: c.route,
      transport: c.transport_info_mn,
      budget: `Өдөрт ~${c.budget_cny.min}–${c.budget_cny.max} CNY`,
      esim: c.esim?.href || "/china.html",
      recommended_stay_days: c.recommended_stay_days,
      hotel_count: c.hotel_count,
      name_en: c.name_en,
      province_mn: c.province_mn,
      metro: c.metro,
      long_stay_available: c.long_stay_available,
      label: base ? `${base.name_mn} — ${base.name_en}` : `${c.name_mn} — ${c.name_en}`
    };
  }

  function buildTravelCards() {
    return [...TIER1, ...TIER2].map(toTravelCard).filter(Boolean);
  }

  /** Intent keys for AI agent — derived from city_id, not hardcoded names */
  function intentKeysForCity(cityId) {
    const c = getCity(cityId);
    if (!c) return [cityId];
    const keys = [cityId, c.name_en.toLowerCase(), c.name_mn.toLowerCase(), c.name_zh];
    if (cityId === "hohhot") keys.push("hohhot", "huh hot", "hoh hot", "huhehaote", "хөх хот");
    if (cityId === "xian") keys.push("xi'an", "xian");
    return [...new Set(keys.filter(Boolean))];
  }

  function buildAiDestinations() {
    const country = "Хятад";
    return getAll().map((c) => ({
      keys: intentKeysForCity(c.city_id),
      country,
      city: c.name_mn,
      city_id: c.city_id,
      tier: c.tier
    }));
  }

  function buildAirportMap() {
    const map = { ulanbaatar: "UBN", erenhot: "ERL" };
    getAll().forEach((c) => {
      if (c.airport?.primary) map[c.city_id] = c.airport.primary;
    });
    return map;
  }

  return {
    VERSION: 1,
    HOTEL_TIERS,
    DEFAULT_HOTEL_COUNT,
    TIER1,
    TIER2,
    CITIES,
    getCity,
    getAll,
    getTier1,
    getTier2,
    getHotelCount,
    isChinaCity,
    starForHotelIndex,
    tierLabelForIndex,
    aliasesForCity,
    toTravelCard,
    buildTravelCards,
    intentKeysForCity,
    buildAiDestinations,
    buildAirportMap
  };
});
