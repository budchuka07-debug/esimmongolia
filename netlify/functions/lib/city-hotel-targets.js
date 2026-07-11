/**
 * Per-city hotel result targets — major cities return more inventory.
 */
const TARGET_MAJOR = 48;
const TARGET_MINOR = 38;
const MOCK_POOL_MAJOR = 64;
const MOCK_POOL_MINOR = 44;

/** Megacities and primary travel hubs */
const MAJOR_CITY_SLUGS = new Set([
  "beijing", "shanghai", "guangzhou", "shenzhen", "chengdu", "chongqing", "xian",
  "hangzhou", "nanjing", "wuhan", "changsha", "xiamen", "qingdao", "dalian",
  "harbin", "hohhot", "sanya", "kunming", "guilin", "suzhou",
  "bangkok", "pattaya", "phuket", "chiang_mai",
  "hanoi", "ho_chi_minh", "da_nang", "nha_trang",
  "tokyo", "osaka", "kyoto", "nagoya", "sapporo", "fukuoka", "okinawa",
  "seoul", "busan", "incheon", "jeju",
  "singapore", "kuala_lumpur", "penang",
  "bali", "jakarta", "yogyakarta",
  "manila", "cebu", "boracay",
  "taipei", "kaohsiung",
  "hong_kong", "kowloon", "macau",
  "delhi", "mumbai", "bangalore", "goa", "jaipur",
  "dubai", "abu_dhabi",
  "istanbul", "antalya", "izmir",
  "almaty", "astana", "tashkent",
  "phnom_penh", "siem_reap",
  "colombo", "kathmandu"
]);

function isMajorCity(citySlug) {
  return MAJOR_CITY_SLUGS.has(String(citySlug || "").trim());
}

function getHotelTargetForCity(citySlug) {
  return isMajorCity(citySlug) ? TARGET_MAJOR : TARGET_MINOR;
}

function getMockPoolSizeForCity(citySlug) {
  return isMajorCity(citySlug) ? MOCK_POOL_MAJOR : MOCK_POOL_MINOR;
}

module.exports = {
  TARGET_MAJOR,
  TARGET_MINOR,
  MOCK_POOL_MAJOR,
  MOCK_POOL_MINOR,
  MAJOR_CITY_SLUGS,
  isMajorCity,
  getHotelTargetForCity,
  getMockPoolSizeForCity
};
