/**
 * Deterministic local attraction mock — no OpenAI, no live ticket claims.
 */
const { FALLBACK } = require("./travel-images");

const NEEDS_CHECK_MSG = "Тасалбарын үнэ, ажиллах цагийг захиалга хийхийн өмнө дахин шалгана.";

const ATTRACTION_CATEGORIES = [
  { value: "all", label_mn: "Бүх үзвэр" },
  { value: "history_culture", label_mn: "Түүх, соёл" },
  { value: "museum", label_mn: "Музей" },
  { value: "temple", label_mn: "Сүм, хийд" },
  { value: "nature", label_mn: "Байгаль" },
  { value: "theme_park", label_mn: "Зугаа цэнгэлийн парк" },
  { value: "zoo", label_mn: "Амьтны хүрээлэн" },
  { value: "aquarium", label_mn: "Аквариум" },
  { value: "shopping", label_mn: "Худалдаа, зах" },
  { value: "city_view", label_mn: "Хотын үзэмж" },
  { value: "night_activity", label_mn: "Шөнийн аялал" },
  { value: "family", label_mn: "Хүүхэдтэй гэр бүл" },
  { value: "free", label_mn: "Үнэгүй үзвэр" },
  { value: "day_trip", label_mn: "Өдрийн аялал" }
];

const CATEGORY_IMAGES = {
  history_culture: "/images/routes/china/forbidden-city.jpg",
  museum: "/images/routes/china/shanghai-museum.jpg",
  temple: "/images/routes/china/temple-heaven.jpg",
  nature: "/images/routes/china/west-lake.jpg",
  theme_park: "/images/routes/china/disney.jpg",
  zoo: "/images/routes/china/panda.jpg",
  aquarium: "/images/routes/china/bund-night.jpg",
  shopping: "/images/routes/china/nanjing-road.jpg",
  city_view: "/images/routes/china/shanghai-bund.jpg",
  night_activity: "/images/routes/china/bund-night.jpg",
  family: "/images/routes/china/disney.jpg",
  free: "/images/routes/china/yu-garden.jpg",
  day_trip: "/images/routes/china/west-lake.jpg"
};

const CITY_CENTERS = {
  shanghai: { lat: 31.2304, lng: 121.4737 },
  beijing: { lat: 39.9042, lng: 116.4074 },
  bangkok: { lat: 13.7563, lng: 100.5018 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  seoul: { lat: 37.5665, lng: 126.978 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  hanoi: { lat: 21.0285, lng: 105.8542 },
  ho_chi_minh: { lat: 10.8231, lng: 106.6297 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  istanbul: { lat: 41.0082, lng: 28.9784 }
};

const CITY_ATTRACTIONS = {
  shanghai: [
    { name_en: "Shanghai Disneyland", name_mn: "Шанхай Disneyland", category: "theme_park", district: "Pudong", price: 285000, duration: "1 өдөр", family_friendly: true, indoor: false },
    { name_en: "The Bund", name_mn: "The Bund (Вайтан)", category: "city_view", district: "Huangpu", price: 0, duration: "2–3 цаг", family_friendly: true, free_entry: true, indoor: false },
    { name_en: "Yu Garden", name_mn: "Ю Хуцин", category: "history_culture", district: "Huangpu", price: 45000, duration: "2 цаг", family_friendly: true },
    { name_en: "Shanghai Museum", name_mn: "Шанхайн музей", category: "museum", district: "Huangpu", price: 0, duration: "2–3 цаг", free_entry: true, indoor: true },
    { name_en: "Shanghai Tower Observatory", name_mn: "Шанхай Тауэр", category: "city_view", district: "Pudong", price: 195000, duration: "1.5 цаг", indoor: true },
    { name_en: "Nanjing Road", name_mn: "Нанжин зам", category: "shopping", district: "Huangpu", price: 0, duration: "2–4 цаг", free_entry: true, indoor: false },
    { name_en: "Zhujiajiao Water Town", name_mn: "Жужяцзяо усан хот", category: "day_trip", district: "Qingpu", price: 85000, duration: "Өдрийн аялал", family_friendly: true, indoor: false },
    { name_en: "Shanghai Ocean Aquarium", name_mn: "Шанхайн далайн аквариум", category: "aquarium", district: "Pudong", price: 165000, duration: "2 цаг", family_friendly: true, indoor: true },
    { name_en: "Shanghai Natural History Museum", name_mn: "Байгалийн түүхийн музей", category: "museum", district: "Jing'an", price: 55000, duration: "2 цаг", family_friendly: true, indoor: true },
    { name_en: "Tianzifang", name_mn: "Тяньцзыфан", category: "shopping", district: "Huangpu", price: 0, duration: "2 цаг", free_entry: true, indoor: false },
    { name_en: "Oriental Pearl Tower", name_mn: "Ориентал Пёрл цамхаг", category: "city_view", district: "Pudong", price: 175000, duration: "1.5 цаг", indoor: true },
    { name_en: "Xintiandi", name_mn: "Шинь Тяньди", category: "history_culture", district: "Huangpu", price: 0, duration: "2 цаг", free_entry: true, indoor: false },
    { name_en: "Jing'an Temple", name_mn: "Жиньань сүм", category: "temple", district: "Jing'an", price: 35000, duration: "1 цаг", indoor: true },
    { name_en: "Shanghai Zoo", name_mn: "Шанхайн амьтны хүрээлэн", category: "zoo", district: "Changning", price: 45000, duration: "3 цаг", family_friendly: true, indoor: false },
    { name_en: "Huangpu River Night Cruise", name_mn: "Хуанпу голын шөнийн аялал", category: "night_activity", district: "Huangpu", price: 125000, duration: "1 цаг", indoor: false },
    { name_en: "Century Park", name_mn: "Century Park", category: "nature", district: "Pudong", price: 15000, duration: "2 цаг", family_friendly: true, indoor: false },
    { name_en: "Shanghai Science and Technology Museum", name_mn: "Шинжлэх ухаан, технологийн музей", category: "museum", district: "Pudong", price: 60000, duration: "3 цаг", family_friendly: true, indoor: true },
    { name_en: "French Concession Walking Tour", name_mn: "Францын концессийн аялал", category: "history_culture", district: "Xuhui", price: 0, duration: "2 цаг", free_entry: true, indoor: false },
    { name_en: "Happy Valley Shanghai", name_mn: "Happy Valley Shanghai", category: "theme_park", district: "Songjiang", price: 220000, duration: "1 өдөр", family_friendly: true, indoor: false },
    { name_en: "Long Museum West Bund", name_mn: "Long Museum", category: "museum", district: "Xuhui", price: 65000, duration: "2 цаг", indoor: true },
    { name_en: "Shanghai Circus World", name_mn: "Шанхайн циркийн ертөнц", category: "family", district: "Jing'an", price: 195000, duration: "2 цаг", family_friendly: true, indoor: true },
    { name_en: "Fuxing Park", name_mn: "Фүшин парк", category: "nature", district: "Huangpu", price: 0, duration: "1.5 цаг", free_entry: true, family_friendly: true, indoor: false },
    { name_en: "Shanghai Propaganda Poster Art Centre", name_mn: "Пропагандын постерын музей", category: "museum", district: "Changning", price: 35000, duration: "1 цаг", indoor: true },
    { name_en: "M50 Creative Park", name_mn: "M50 урлагийн бүс", category: "history_culture", district: "Putuo", price: 0, duration: "2 цаг", free_entry: true, indoor: false }
  ],
  beijing: [
    { name_en: "Forbidden City", name_mn: "Хориот хот", category: "history_culture", district: "Dongcheng", price: 85000, duration: "3 цаг", indoor: true },
    { name_en: "Temple of Heaven", name_mn: "Тэнгэрийн сүм", category: "temple", district: "Dongcheng", price: 45000, duration: "2 цаг", indoor: false },
    { name_en: "Summer Palace", name_mn: "Зуны ордон", category: "history_culture", district: "Haidian", price: 75000, duration: "3 цаг", family_friendly: true, indoor: false },
    { name_en: "798 Art District", name_mn: "798 урлагийн бүс", category: "history_culture", district: "Chaoyang", price: 0, duration: "2 цаг", free_entry: true, indoor: false }
  ],
  bangkok: [
    { name_en: "Grand Palace", name_mn: "Их ордон", category: "history_culture", district: "Phra Nakhon", price: 95000, duration: "3 цаг", indoor: false },
    { name_en: "Chatuchak Weekend Market", name_mn: "Чатучак зах", category: "shopping", district: "Chatuchak", price: 0, duration: "3 цаг", free_entry: true, indoor: false },
    { name_en: "SEA LIFE Bangkok Ocean World", name_mn: "SEA LIFE Bangkok", category: "aquarium", district: "Pathum Wan", price: 145000, duration: "2 цаг", family_friendly: true, indoor: true }
  ],
  tokyo: [
    { name_en: "Senso-ji Temple", name_mn: "Сэнсө-жи сүм", category: "temple", district: "Asakusa", price: 0, duration: "2 цаг", free_entry: true, indoor: false },
    { name_en: "teamLab Planets", name_mn: "teamLab Planets", category: "museum", district: "Toyosu", price: 285000, duration: "2 цаг", family_friendly: true, indoor: true },
    { name_en: "Tokyo Skytree", name_mn: "Tokyo Skytree", category: "city_view", district: "Sumida", price: 195000, duration: "1.5 цаг", indoor: true }
  ],
  seoul: [
    { name_en: "Gyeongbokgung Palace", name_mn: "Гёнбокгун ордон", category: "history_culture", district: "Jongno", price: 45000, duration: "2 цаг", indoor: false },
    { name_en: "N Seoul Tower", name_mn: "N Seoul Tower", category: "city_view", district: "Yongsan", price: 125000, duration: "2 цаг", indoor: true },
    { name_en: "Lotte World", name_mn: "Lotte World", category: "theme_park", district: "Songpa", price: 245000, duration: "1 өдөр", family_friendly: true, indoor: true }
  ]
};

const GENERIC_BY_CATEGORY = {
  history_culture: { prefix: "Heritage", suffix: "Cultural Site", price: 55000 },
  museum: { prefix: "City", suffix: "Museum", price: 45000 },
  temple: { prefix: "Sacred", suffix: "Temple", price: 35000 },
  nature: { prefix: "Green", suffix: "Park", price: 15000 },
  theme_park: { prefix: "Adventure", suffix: "Theme Park", price: 220000 },
  zoo: { prefix: "City", suffix: "Zoo", price: 48000 },
  aquarium: { prefix: "Ocean", suffix: "Aquarium", price: 155000 },
  shopping: { prefix: "Central", suffix: "Market District", price: 0 },
  city_view: { prefix: "Sky", suffix: "Observation Deck", price: 165000 },
  night_activity: { prefix: "Night", suffix: "Experience", price: 115000 },
  family: { prefix: "Family", suffix: "Activity Center", price: 95000 },
  free: { prefix: "Public", suffix: "Square", price: 0 },
  day_trip: { prefix: "Scenic", suffix: "Day Trip", price: 85000 }
};

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

function categoryLabelMn(value) {
  return ATTRACTION_CATEGORIES.find((c) => c.value === value)?.label_mn || value;
}

function categoryImage(category) {
  return CATEGORY_IMAGES[category] || FALLBACK.attraction;
}

function cityCenter(citySlug) {
  return CITY_CENTERS[citySlug] || { lat: 30 + (hashCode(citySlug) % 20), lng: 100 + (hashCode(citySlug) % 40) };
}

function approxCoords(citySlug, index, district) {
  const center = cityCenter(citySlug);
  const seed = hashCode(`${citySlug}-${district}-${index}`);
  const lat = Number((center.lat + (pseudoRandom(seed) - 0.5) * 0.08).toFixed(6));
  const lng = Number((center.lng + (pseudoRandom(seed + 7) - 0.5) * 0.08).toFixed(6));
  return { latitude: lat, longitude: lng, coords_approximate: true };
}

function buildMockRecord(ctx, tpl, index) {
  const { citySlug, cityRow, countryRow, countrySlug } = ctx;
  const cityName = cityRow?.name_mn || cityRow?.name_en || citySlug;
  const countryName = countryRow?.name_mn || countrySlug || "";
  const district = tpl.district || `${cityName} Center`;
  const coords = approxCoords(citySlug, index, district);
  const price = tpl.price ?? 50000;
  const category = tpl.category || "history_culture";
  const short = `${cityName} хотын ${district} бүсийн ${categoryLabelMn(category).toLowerCase()}. ${NEEDS_CHECK_MSG}`;

  return {
    id: `mock-attr-${citySlug}-${index}`,
    type: "attraction",
    name: tpl.name_mn || tpl.name_en,
    name_mn: tpl.name_mn || tpl.name_en,
    name_en: tpl.name_en || tpl.name_mn,
    country: countryName,
    country_id: countrySlug,
    country_name_mn: countryName,
    city: cityName,
    city_id: citySlug,
    city_name_mn: cityName,
    district,
    category,
    category_label_mn: categoryLabelMn(category),
    description: short,
    description_mn: short,
    short_description: short,
    image_url: categoryImage(category),
    cover_image_url: categoryImage(category),
    image: categoryImage(category),
    gallery_urls: [categoryImage(category)],
    estimated_price: price,
    final_price_mnt: price,
    currency: "MNT",
    opening_hours: tpl.indoor === false ? "08:00–18:00 (ойролцоо)" : "10:00–20:00 (ойролцоо)",
    recommended_duration: tpl.duration || "2 цаг",
    family_friendly: !!tpl.family_friendly,
    free_entry: !!tpl.free_entry || price === 0,
    indoor: tpl.indoor !== false,
    booking_required: category === "theme_park" || category === "aquarium",
    official_url: null,
    address: null,
    latitude: coords.latitude,
    longitude: coords.longitude,
    coords_approximate: coords.coords_approximate,
    popularity_score: 40 + (hashCode(`${citySlug}-${index}`) % 55),
    recommendation_score: 50 + (tpl.family_friendly ? 10 : 0) + (price === 0 ? 8 : 0) + (hashCode(tpl.name_en) % 20),
    source: "local_mock",
    is_mock: true,
    verification_status: "check_before_booking",
    needs_check_message: NEEDS_CHECK_MSG,
    active: true
  };
}

function generateGeneric(ctx, index) {
  const cats = Object.keys(GENERIC_BY_CATEGORY);
  const cat = cats[index % cats.length];
  const cfg = GENERIC_BY_CATEGORY[cat];
  const cityName = ctx.cityRow?.name_en || ctx.citySlug;
  const district = `${cityName} District ${1 + (index % 6)}`;
  const seed = `${ctx.citySlug}-gen-${index}`;
  const variance = 0.85 + (hashCode(seed) % 30) / 100;
  const price = roundMnt((cfg.price || 50000) * variance);
  return buildMockRecord(ctx, {
    name_en: `${cfg.prefix} ${cityName} ${cfg.suffix}`,
    name_mn: `${cityName} ${categoryLabelMn(cat)}`,
    category: cat,
    district,
    price,
    duration: cat === "day_trip" ? "Өдрийн аялал" : "2 цаг",
    family_friendly: cat === "family" || cat === "theme_park" || cat === "zoo",
    free_entry: cat === "free" || price === 0,
    indoor: !["nature", "day_trip", "city_view"].includes(cat)
  }, index);
}

function getCityTemplates(citySlug) {
  if (CITY_ATTRACTIONS[citySlug]?.length) return CITY_ATTRACTIONS[citySlug].slice();
  return [];
}

function generateMockPool(ctx, count) {
  const templates = getCityTemplates(ctx.citySlug);
  const out = [];
  for (let i = 0; i < count; i++) {
    const tpl = templates[i % templates.length] || null;
    out.push(tpl ? buildMockRecord(ctx, tpl, i) : generateGeneric(ctx, i));
  }
  return out;
}

function matchesCategory(item, category) {
  if (!category || category === "all") return true;
  if (category === "family") return !!item.family_friendly;
  if (category === "free") return !!item.free_entry;
  return item.category === category;
}

function filterMockPool(pool, params) {
  let list = pool.slice();
  const kw = String(params.keyword || params.attraction || "").trim().toLowerCase();
  if (kw) {
    list = list.filter((a) =>
      (a.name || "").toLowerCase().includes(kw) ||
      (a.name_mn || "").toLowerCase().includes(kw) ||
      (a.name_en || "").toLowerCase().includes(kw) ||
      (a.description || "").toLowerCase().includes(kw) ||
      (a.district || "").toLowerCase().includes(kw) ||
      (a.category_label_mn || "").toLowerCase().includes(kw)
    );
  }
  if (params.category && params.category !== "all") {
    list = list.filter((a) => matchesCategory(a, params.category));
  }
  if (params.district) {
    const d = params.district.toLowerCase();
    list = list.filter((a) => (a.district || "").toLowerCase().includes(d));
  }
  const minP = Number(params.priceMinMnt || params.budget_min || 0);
  const maxP = Number(params.priceMaxMnt || params.budget_max || 0);
  if (minP > 0) list = list.filter((a) => (a.estimated_price ?? a.final_price_mnt ?? 0) >= minP);
  if (maxP > 0) list = list.filter((a) => (a.estimated_price ?? a.final_price_mnt ?? 0) <= maxP);
  if (params.familyFriendly === "1" || params.family === "1") {
    list = list.filter((a) => a.family_friendly);
  }
  if (params.freeOnly === "1" || params.free_entry === "1") {
    list = list.filter((a) => a.free_entry);
  }
  return list;
}

function getMockPoolForSearch(ctx, params, targetCount) {
  const poolSize = Math.max(targetCount, 48);
  const pool = generateMockPool(ctx, poolSize);
  return { pool: filterMockPool(pool, params), generator: "local_template" };
}

module.exports = {
  NEEDS_CHECK_MSG,
  ATTRACTION_CATEGORIES,
  CATEGORY_IMAGES,
  generateMockPool,
  filterMockPool,
  getMockPoolForSearch,
  categoryLabelMn,
  categoryImage,
  cityCenter
};
