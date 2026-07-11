/**
 * Deterministic local mock hotel generator — no OpenAI, no live availability claims.
 */
const { FALLBACK } = require("./travel-images");
const { isMajorCity, getMockPoolSizeForCity } = require("./city-hotel-targets");

const NEEDS_CHECK_MSG = "Үнэ болон өрөөний боломж захиалга баталгаажуулах үед шалгагдана.";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MOCK_POOL_SIZE = 48;

const BASE_PRICE_MNT = { 2: 180000, 3: 280000, 4: 480000, 5: 950000 };

const HOTEL_BRANDS = [
  "Holiday Inn", "Marriott", "Hilton", "Hyatt", "Novotel", "Sheraton",
  "InterContinental", "Radisson", "Courtyard", "DoubleTree", "Mercure",
  "Ibis", "Best Western", "Ramada", "Crowne Plaza", "Four Points",
  "Park Plaza", "Grand Hyatt", "Sofitel", "Wyndham", "Ascott", "Shangri-La"
];

const HOTEL_SUFFIXES = ["Hotel", "Suites", "Residence", "Inn", "Grand Hotel", "Plaza", "Lodge"];

const CITY_AREAS = {
  shanghai: { tier: 1.15, areas: ["Pudong", "Jing'an", "Huangpu", "Xuhui", "Hongqiao", "Lujiazui", "Minhang", "Changning"] },
  beijing: { tier: 1.1, areas: ["Wangfujing", "Chaoyang", "Haidian", "Dongcheng", "Sanlitun", "CBD", "Xicheng", "Fengtai"] },
  guangzhou: { tier: 1.05, areas: ["Tianhe", "Yuexiu", "Haizhu", "Panyu", "Baiyun", "Liwan", "Zhujiang New Town"] },
  shenzhen: { tier: 1.1, areas: ["Futian", "Nanshan", "Luohu", "Bao'an", "Longgang", "Shekou", "Huaqiangbei"] },
  chengdu: { tier: 0.95, areas: ["Jinjiang", "Wuhou", "Qingyang", "Chenghua", "Hi-Tech Zone", "Chunxi Road", "Tianfu"] },
  chongqing: { tier: 0.9, areas: ["Jiefangbei", "Nan'an", "Yuzhong", "Jiangbei", "Guanyinqiao", "Three Gorges Museum"] },
  xian: { tier: 0.9, areas: ["Bell Tower", "Yanta", "Weiyang", "Lintong", "High-Tech", "North Station"] },
  hangzhou: { tier: 1.0, areas: ["West Lake", "Gongshu", "Xihu", "Binjiang", "Xiacheng", "Qiantang"] },
  seoul: { tier: 1.25, areas: ["Myeongdong", "Gangnam", "Hongdae", "Dongdaemun", "Itaewon", "Incheon Airport", "Jongno", "Mapo"] },
  tokyo: { tier: 1.3, areas: ["Shinjuku", "Shibuya", "Asakusa", "Ginza", "Ueno", "Narita Airport", "Roppongi", "Akihabara"] },
  osaka: { tier: 1.2, areas: ["Umeda", "Namba", "Shinsaibashi", "Tennoji", "Universal City", "Shin-Osaka"] },
  bangkok: { tier: 0.85, areas: ["Sukhumvit", "Silom", "Siam", "Riverside", "Khaosan", "Suvarnabhumi", "Ratchada", "Chatuchak"] },
  hohhot: { tier: 0.75, areas: ["Xincheng", "Huimin", "Saihan", "Airport Road", "Railway Station", "Downtown"] },
  singapore: { tier: 1.35, areas: ["Marina Bay", "Orchard", "Chinatown", "Bugis", "Sentosa Gateway", "Changi", "Clarke Quay", "Jurong East"] },
  dubai: { tier: 1.3, areas: ["Downtown", "Marina", "Deira", "JBR", "Business Bay", "DXB Airport", "Palm Jumeirah", "Al Barsha"] },
  istanbul: { tier: 1.0, areas: ["Sultanahmet", "Taksim", "Sisli", "Kadikoy", "Besiktas", "Airport", "Beyoglu", "Uskudar"] },
  hanoi: { tier: 0.8, areas: ["Old Quarter", "Hoan Kiem", "Ba Dinh", "West Lake", "Airport Road", "Train Street", "Tay Ho"] },
  ho_chi_minh: { tier: 0.8, areas: ["District 1", "District 3", "Pham Ngu Lao", "Binh Thanh", "Airport", "Thu Duc", "District 7"] },
  hong_kong: { tier: 1.3, areas: ["Tsim Sha Tsui", "Central", "Causeway Bay", "Mong Kok", "Wan Chai", "Kowloon Bay", "Airport"] },
  delhi: { tier: 0.85, areas: ["Connaught Place", "Aerocity", "Karol Bagh", "Paharganj", "Dwarka", "Gurgaon Link"] },
  mumbai: { tier: 0.9, areas: ["Bandra", "Andheri", "Colaba", "BKC", "Juhu", "Airport Zone", "Lower Parel"] },
  kuala_lumpur: { tier: 0.95, areas: ["KLCC", "Bukit Bintang", "Chinatown", "Bangsar", "Mont Kiara", "KL Sentral"] }
};

const COUNTRY_TIER = {
  china: 1.0, korea: 1.2, japan: 1.3, thailand: 0.85, vietnam: 0.8,
  singapore: 1.35, malaysia: 0.9, indonesia: 0.85, uae: 1.3, turkey: 1.0
};

const cityMockCache = new Map();

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pseudoRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function roundMnt(n) {
  return Math.round(n / 1000) * 1000;
}

function priceMnt(tier, stars, seed) {
  const base = (BASE_PRICE_MNT[stars] || 300000) * (tier || 1);
  const variance = 0.9 + ((hashCode(seed) % 25) / 100);
  return roundMnt(base * variance);
}

function placeholderImage(seed) {
  const n = (hashCode(seed) % 12) + 1;
  return `/images/hotels/exterior-${String(n).padStart(2, "0")}.jpg`;
}

function normalizeHotelKey(name, city, district) {
  return `${String(name || "").toLowerCase().replace(/[^a-z0-9\u0400-\u04ff]+/g, " ").trim()}|${city}|${district || ""}`;
}

function resolveCityAreas(citySlug, cityRow, countryRow) {
  const cfg = CITY_AREAS[citySlug];
  if (cfg) return cfg;
  const countryId = countryRow?.slug || countryRow?.id || "";
  const tier = COUNTRY_TIER[countryId] || 1.0;
  const cityName = cityRow?.name_en || citySlug;
  return {
    tier,
    areas: [
      `${cityName} Center`, `${cityName} Downtown`, `${cityName} Metro Hub`,
      `${cityName} Business District`, `${cityName} Riverside`, `${cityName} Airport Road`
    ]
  };
}

function buildFacilities(seed, stars, nearMetro) {
  const list = ["WiFi", "24/7 Front Desk", "Air Conditioning"];
  if (stars >= 4) list.push("Restaurant", "Fitness Center");
  if (stars >= 5) list.push("Concierge", "Spa");
  if (pseudoRandom(seed + 11) > 0.3) list.push("breakfast");
  if (pseudoRandom(seed + 17) > 0.35) list.push("free_cancellation");
  if (pseudoRandom(seed + 23) > 0.55) list.push("family_friendly");
  if (nearMetro) list.push("metro_nearby");
  return list;
}

function starsForIndex(index, total, major) {
  if (!major) {
    const h = hashCode(`stars-${index}`);
    return 2 + (h % 4);
  }
  const pct = index / Math.max(total, 1);
  if (pct < 0.12) return 2;
  if (pct < 0.45) return 3;
  if (pct < 0.82) return 4;
  return 5;
}

function generateLocalMockHotel(ctx, index, poolSize, fixedDistrict) {
  const { citySlug, cityRow, countryRow, countrySlug } = ctx;
  const major = isMajorCity(citySlug);
  const areasCfg = resolveCityAreas(citySlug, cityRow, countryRow);
  const district = fixedDistrict || areasCfg.areas[index % areasCfg.areas.length];
  const seed = fixedDistrict
    ? `${citySlug}-${district}-district-${index}`
    : `${citySlug}-${district}-${index}`;
  const h = hashCode(seed);
  const stars = starsForIndex(index, poolSize || 48, major);
  const brand = HOTEL_BRANDS[h % HOTEL_BRANDS.length];
  const suffix = HOTEL_SUFFIXES[(h >> 3) % HOTEL_SUFFIXES.length];
  const name = `${brand} ${district} ${suffix}`;
  const nearMetro = pseudoRandom(h + 5) > 0.25;
  const facilities = buildFacilities(h, stars, nearMetro);
  const pricePerNight = priceMnt(areasCfg.tier, stars, seed);
  const distanceToCenter = Number((0.4 + pseudoRandom(h + 29) * 8).toFixed(1));
  const distanceToMetro = nearMetro ? Math.round(120 + pseudoRandom(h + 31) * 680) : 9999;
  const distanceToAirport = Number((4 + pseudoRandom(h + 37) * 22).toFixed(1));
  const distanceToAttraction = Number((0.2 + pseudoRandom(h + 41) * 2.5).toFixed(1));
  const recommendationScore = Math.round(
    stars * 18 + (nearMetro ? 12 : 0) + (facilities.includes("breakfast") ? 6 : 0) +
    Math.max(0, 10 - distanceToCenter)
  );

  const countryName = countryRow?.name_mn || countrySlug || "";
  const cityName = cityRow?.name_mn || cityRow?.name_en || citySlug;
  const descParts = [
    `${cityName} хотын ${district} бүсэд байрлах ${stars} одтой буудал.`,
    nearMetro ? "Метроны буудал ойрхон." : "Хотын гол үйлчилгээний бүсэд.",
    NEEDS_CHECK_MSG
  ];

  const distNote = nearMetro
    ? `Метро ${distanceToMetro} м · Төвөөс ${distanceToCenter} км`
    : `Хотын төвөөс ${distanceToCenter} км`;

  return {
    id: fixedDistrict ? `mock-${citySlug}-d-${index}` : `mock-${citySlug}-${index}`,
    name,
    country: countryName,
    city: cityName,
    district,
    stars,
    price_per_night: pricePerNight,
    currency: "MNT",
    facilities,
    description: `${descParts.join(" ")} ${distNote}.`,
    image_url: placeholderImage(seed),
    source: "mock",
    is_mock: true,
    availability_status: "check_on_request",
    type: "hotel",
    name_en: name,
    city_id: citySlug,
    city_name_mn: cityName,
    country_id: countrySlug,
    country_name_mn: countryName,
    area_name: district,
    final_price_mnt: pricePerNight,
    price_per_night_mnt: pricePerNight,
    amenities: facilities,
    nearby_metro: nearMetro ? `${district} Metro` : null,
    distance_to_metro_m: distanceToMetro,
    distance_to_center_km: distanceToCenter,
    distance_to_airport_km: distanceToAirport,
    distance_to_attraction_km: distanceToAttraction,
    breakfast: facilities.includes("breakfast"),
    free_cancellation: facilities.includes("free_cancellation"),
    family_friendly: facilities.includes("family_friendly"),
    recommendation_score: recommendationScore,
    estimated: true,
    verified: false,
    needs_check_message: NEEDS_CHECK_MSG,
    cover_image: placeholderImage(seed),
    image: placeholderImage(seed)
  };
}

function generateLocalMockPool(ctx, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(generateLocalMockHotel(ctx, i, count));
  out.sort((a, b) => (b.recommendation_score ?? 0) - (a.recommendation_score ?? 0));
  return out;
}

/** Local deterministic pool only — never calls OpenAI. */
function getMockPoolForCity(ctx) {
  const cacheKey = ctx.citySlug;
  const cached = cityMockCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { pool: cached.pool, generator: "local_template" };
  }

  const poolSize = getMockPoolSizeForCity(ctx.citySlug);
  const pool = generateLocalMockPool(ctx, poolSize);
  cityMockCache.set(cacheKey, { pool, generator: "local_template", ts: Date.now() });
  return { pool, generator: "local_template" };
}

function resolveDistrictsForSearch(ctx, params) {
  const query = String(params.district || params.area || "").trim().toLowerCase();
  if (!query) return null;

  const areasCfg = resolveCityAreas(ctx.citySlug, ctx.cityRow, ctx.countryRow);
  const matched = areasCfg.areas.filter((name) => {
    const n = name.toLowerCase();
    return n.includes(query) || query.includes(n);
  });

  if (matched.length) return matched;
  const label = String(params.district || params.area || "").trim();
  return label ? [label] : null;
}

/** District/area filter үед тухайн бүсэд бүх зорилтот тоогоор mock үүсгэнэ. */
function getMockPoolForSearch(ctx, params, targetCount) {
  const districts = resolveDistrictsForSearch(ctx, params);
  if (!districts) return getMockPoolForCity(ctx);

  const count = Math.max(1, Number(targetCount) || getMockPoolSizeForCity(ctx.citySlug));
  const pool = [];
  for (let i = 0; i < count; i++) {
    const district = districts[i % districts.length];
    pool.push(generateLocalMockHotel(ctx, i, count, district));
  }
  pool.sort((a, b) => (b.recommendation_score ?? 0) - (a.recommendation_score ?? 0));
  return { pool, generator: "local_template_district" };
}

function filterMockPool(pool, params) {
  let list = pool.slice();

  if (params.district) {
    const d = params.district.toLowerCase();
    list = list.filter((h) => (h.district || "").toLowerCase().includes(d) || (h.area_name || "").toLowerCase().includes(d));
  }
  if (params.area) {
    const a = params.area.toLowerCase();
    list = list.filter((h) =>
      (h.district || "").toLowerCase().includes(a) ||
      (h.area_name || "").toLowerCase().includes(a) ||
      (h.description || "").toLowerCase().includes(a)
    );
  }
  if (params.minStars) {
    const min = Number(params.minStars);
    list = list.filter((h) => h.stars >= min);
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter((h) =>
      (h.name || "").toLowerCase().includes(kw) ||
      (h.description || "").toLowerCase().includes(kw)
    );
  }
  const minP = Number(params.priceMinMnt || 0);
  const maxP = Number(params.priceMaxMnt || 0);
  if (minP > 0) list = list.filter((h) => h.price_per_night >= minP);
  if (maxP > 0) list = list.filter((h) => h.price_per_night <= maxP);

  if (params.nearMetro === "1" || params.nearMetro === true) {
    list = list.filter((h) => h.distance_to_metro_m <= 800);
  }
  if (params.nearAirport === "1" || params.nearAirport === true) {
    list = list.filter((h) => h.distance_to_airport_km <= 15);
  }
  if (params.nearAttraction === "1" || params.nearAttraction === true) {
    list = list.filter((h) => h.distance_to_attraction_km <= 2);
  }
  if (params.breakfast === "1" || params.breakfast === true) {
    list = list.filter((h) => h.breakfast);
  }
  if (params.freeCancellation === "1" || params.freeCancellation === true) {
    list = list.filter((h) => h.free_cancellation);
  }
  if (params.familyFriendly === "1" || params.familyFriendly === true) {
    list = list.filter((h) => h.family_friendly);
  }

  return list;
}

module.exports = {
  NEEDS_CHECK_MSG,
  MOCK_POOL_SIZE,
  normalizeHotelKey,
  getMockPoolForCity,
  getMockPoolForSearch,
  resolveDistrictsForSearch,
  filterMockPool,
  generateLocalMockPool,
  placeholderImage,
  FALLBACK_HOTEL: FALLBACK.hotel
};
