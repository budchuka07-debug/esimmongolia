#!/usr/bin/env node
/**
 * Generate supabase/seed/002_bulk_inventory.sql
 * Run: node scripts/generate-travel-seed.mjs
 */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, "../supabase/seed/002_bulk_inventory.sql");

const COUNTRIES = [
  { iso: "MN", slug: "mongolia", name_mn: "Монгол", name_en: "Mongolia", local: "Mongolia", flag: "🇲🇳", currency: "MNT", featured: false, order: 0 },
  { iso: "CN", slug: "china", name_mn: "Хятад", name_en: "China", local: "中国", flag: "🇨🇳", currency: "CNY", featured: true, order: 1 },
  { iso: "TH", slug: "thailand", name_mn: "Тайланд", name_en: "Thailand", local: "ประเทศไทย", flag: "🇹🇭", currency: "THB", featured: true, order: 2 },
  { iso: "VN", slug: "vietnam", name_mn: "Вьетнам", name_en: "Vietnam", local: "Việt Nam", flag: "🇻🇳", currency: "VND", featured: true, order: 3 },
  { iso: "ID", slug: "indonesia", name_mn: "Индонез", name_en: "Indonesia", local: "Indonesia", flag: "🇮🇩", currency: "IDR", featured: true, order: 4 },
  { iso: "JP", slug: "japan", name_mn: "Япон", name_en: "Japan", local: "日本", flag: "🇯🇵", currency: "JPY", featured: true, order: 5 },
  { iso: "KR", slug: "korea", name_mn: "Солонгос", name_en: "South Korea", local: "대한민국", flag: "🇰🇷", currency: "KRW", featured: true, order: 6 },
  { iso: "SG", slug: "singapore", name_mn: "Сингапур", name_en: "Singapore", local: "Singapore", flag: "🇸🇬", currency: "SGD", featured: true, order: 7 },
  { iso: "MY", slug: "malaysia", name_mn: "Малайз", name_en: "Malaysia", local: "Malaysia", flag: "🇲🇾", currency: "MYR", featured: false, order: 8 },
  { iso: "AE", slug: "uae", name_mn: "АНЭУ", name_en: "UAE", local: "الإمارات", flag: "🇦🇪", currency: "AED", featured: false, order: 9 }
];

const CITY_DEFS = [
  // China priority (35)
  { cc: "CN", slug: "beijing", mn: "Бээжин", en: "Beijing", local: "北京", aliases: ["Peking", "PEK"], airports: ["PEK", "PKX"], rails: ["北京站", "北京南站"], lat: 39.9042, lng: 116.4074, popular: true, pri: 1 },
  { cc: "CN", slug: "shanghai", mn: "Шанхай", en: "Shanghai", local: "上海", aliases: ["PVG"], airports: ["PVG", "SHA"], rails: ["上海虹桥", "上海站"], lat: 31.2304, lng: 121.4737, popular: true, pri: 1 },
  { cc: "CN", slug: "hohhot", mn: "Хөх хот", en: "Hohhot", local: "呼和浩特", aliases: ["HET"], airports: ["HET"], rails: ["呼和浩特站"], lat: 40.8424, lng: 111.7519, popular: true, pri: 1 },
  { cc: "CN", slug: "chengdu", mn: "Чэндү", en: "Chengdu", local: "成都", aliases: ["CTU"], airports: ["CTU"], rails: ["成都东站"], lat: 30.5728, lng: 104.0668, popular: true, pri: 1 },
  { cc: "CN", slug: "dalian", mn: "Далиан", en: "Dalian", local: "大连", aliases: ["DLC"], airports: ["DLC"], rails: ["大连站"], lat: 38.914, lng: 121.6147, popular: true, pri: 1 },
  { cc: "CN", slug: "guangzhou", mn: "Гуанжоу", en: "Guangzhou", local: "广州", aliases: ["CAN"], airports: ["CAN"], rails: ["广州南站"], lat: 23.1291, lng: 113.2644, popular: true, pri: 1 },
  { cc: "CN", slug: "shenzhen", mn: "Шэньжэнь", en: "Shenzhen", local: "深圳", aliases: ["SZX"], airports: ["SZX"], rails: ["深圳北站"], lat: 22.5431, lng: 114.0579, popular: true, pri: 1 },
  { cc: "CN", slug: "yiwu", mn: "Иву", en: "Yiwu", local: "义乌", aliases: ["YIW"], airports: ["YIW"], rails: ["义乌站"], lat: 29.3068, lng: 120.0751, popular: true, pri: 1 },
  { cc: "CN", slug: "harbin", mn: "Харbin", en: "Harbin", local: "哈尔滨", aliases: ["HRB"], airports: ["HRB"], rails: ["哈尔滨站"], lat: 45.8038, lng: 126.5349, popular: true, pri: 1 },
  { cc: "CN", slug: "xian", mn: "Сиань", en: "Xi'an", local: "西安", aliases: ["XIY", "Xian"], airports: ["XIY"], rails: ["西安北站"], lat: 34.3416, lng: 108.9398, popular: true, pri: 1 },
  { cc: "CN", slug: "changsha", mn: "Чанша", en: "Changsha", local: "长沙", aliases: ["CSX"], airports: ["CSX"], rails: ["长沙南站"], lat: 28.2282, lng: 112.9388, popular: true, pri: 1 },
  { cc: "CN", slug: "erenhot", mn: "Эрээн", en: "Erenhot", local: "二连浩特", aliases: ["Erlian"], airports: [], rails: ["二连站"], lat: 43.653, lng: 111.976, popular: false, pri: 1 },
  { cc: "CN", slug: "nanjing", mn: "Нанжин", en: "Nanjing", local: "南京", aliases: ["NKG"], airports: ["NKG"], rails: ["南京南站"], lat: 32.0603, lng: 118.7969, popular: false, pri: 0 },
  { cc: "CN", slug: "hangzhou", mn: "Ханzhou", en: "Hangzhou", local: "杭州", aliases: ["HGH"], airports: ["HGH"], rails: ["杭州东站"], lat: 30.2741, lng: 120.1551, popular: false, pri: 0 },
  { cc: "CN", slug: "suzhou", mn: "Сүжоу", en: "Suzhou", local: "苏州", aliases: [], airports: [], rails: ["苏州站"], lat: 31.2989, lng: 120.5853, popular: false, pri: 0 },
  { cc: "CN", slug: "qingdao", mn: "Циндао", en: "Qingdao", local: "青岛", aliases: ["TAO"], airports: ["TAO"], rails: ["青岛站"], lat: 36.0671, lng: 120.3826, popular: false, pri: 0 },
  { cc: "CN", slug: "chongqing", mn: "Чунцин", en: "Chongqing", local: "重庆", aliases: ["CKG"], airports: ["CKG"], rails: ["重庆北站"], lat: 29.4316, lng: 106.9123, popular: false, pri: 0 },
  { cc: "CN", slug: "wuhan", mn: "Ухань", en: "Wuhan", local: "武汉", aliases: ["WUH"], airports: ["WUH"], rails: ["武汉站"], lat: 30.5928, lng: 114.3055, popular: false, pri: 0 },
  { cc: "CN", slug: "kunming", mn: "Куньмин", en: "Kunming", local: "昆明", aliases: ["KMG"], airports: ["KMG"], rails: ["昆明南站"], lat: 25.0389, lng: 102.7183, popular: false, pri: 0 },
  { cc: "CN", slug: "xiamen", mn: "Шiamen", en: "Xiamen", local: "厦门", aliases: ["XMN"], airports: ["XMN"], rails: ["厦门站"], lat: 24.4798, lng: 118.0894, popular: false, pri: 0 },
  { cc: "CN", slug: "ningbo", mn: "Нинbo", en: "Ningbo", local: "宁波", aliases: ["NGB"], airports: ["NGB"], rails: ["宁波站"], lat: 29.8683, lng: 121.544, popular: false, pri: 0 },
  { cc: "CN", slug: "tianjin", mn: "Тяньжин", en: "Tianjin", local: "天津", aliases: ["TSN"], airports: ["TSN"], rails: ["天津站"], lat: 39.3434, lng: 117.3616, popular: false, pri: 0 },
  { cc: "CN", slug: "zhengzhou", mn: "Жэнzhou", en: "Zhengzhou", local: "郑州", aliases: ["CGO"], airports: ["CGO"], rails: ["郑州东站"], lat: 34.7466, lng: 113.6253, popular: false, pri: 0 },
  { cc: "CN", slug: "fuzhou", mn: "Фучжоу", en: "Fuzhou", local: "福州", aliases: ["FOC"], airports: ["FOC"], rails: ["福州站"], lat: 26.0745, lng: 119.2965, popular: false, pri: 0 },
  { cc: "CN", slug: "jinan", mn: "Жинань", en: "Jinan", local: "济南", aliases: ["TNA"], airports: ["TNA"], rails: ["济南站"], lat: 36.6512, lng: 117.1201, popular: false, pri: 0 },
  { cc: "CN", slug: "hefei", mn: "Хэфэй", en: "Hefei", local: "合肥", aliases: ["HFE"], airports: ["HFE"], rails: ["合肥南站"], lat: 31.8206, lng: 117.2272, popular: false, pri: 0 },
  { cc: "CN", slug: "nanning", mn: "Наньнин", en: "Nanning", local: "南宁", aliases: ["NNG"], airports: ["NNG"], rails: ["南宁站"], lat: 22.817, lng: 108.3665, popular: false, pri: 0 },
  { cc: "CN", slug: "guilin", mn: "Гуйлинь", en: "Guilin", local: "桂林", aliases: ["KWL"], airports: ["KWL"], rails: ["桂林站"], lat: 25.2736, lng: 110.29, popular: false, pri: 0 },
  { cc: "CN", slug: "lijiang", mn: "Лижiang", en: "Lijiang", local: "丽江", aliases: ["LJG"], airports: ["LJG"], rails: [], lat: 26.855, lng: 100.227, popular: false, pri: 0 },
  { cc: "CN", slug: "sanya", mn: "Санья", en: "Sanya", local: "三亚", aliases: ["SYX"], airports: ["SYX"], rails: ["三亚站"], lat: 18.2528, lng: 109.5119, popular: false, pri: 0 },
  { cc: "CN", slug: "zhuhai", mn: "Жухай", en: "Zhuhai", local: "珠海", aliases: ["ZUH"], airports: ["ZUH"], rails: ["珠海站"], lat: 22.271, lng: 113.5767, popular: false, pri: 0 },
  { cc: "CN", slug: "dongguan", mn: "Дунгуань", en: "Dongguan", local: "东莞", aliases: [], airports: [], rails: ["东莞站"], lat: 23.0207, lng: 113.7518, popular: false, pri: 0 },
  { cc: "CN", slug: "foshan", mn: "Фошань", en: "Foshan", local: "佛山", aliases: [], airports: [], rails: ["佛山西站"], lat: 23.0218, lng: 113.1219, popular: false, pri: 0 },
  { cc: "CN", slug: "wenzhou", mn: "Вэньzhou", en: "Wenzhou", local: "温州", aliases: ["WNZ"], airports: ["WNZ"], rails: ["温州南站"], lat: 27.9949, lng: 120.6994, popular: false, pri: 0 },
  { cc: "CN", slug: "urumqi", mn: "Үрүмчи", en: "Urumqi", local: "乌鲁木齐", aliases: ["URC"], airports: ["URC"], rails: ["乌鲁木齐站"], lat: 43.8256, lng: 87.6168, popular: false, pri: 0 },
  // Thailand (12)
  { cc: "TH", slug: "bangkok", mn: "Бангкок", en: "Bangkok", local: "กรุงเทพ", aliases: ["BKK"], airports: ["BKK", "DMK"], rails: ["Hua Lamphong"], lat: 13.7563, lng: 100.5018, popular: true, pri: 1 },
  { cc: "TH", slug: "pattaya", mn: "Паттайя", en: "Pattaya", local: "พัทยา", aliases: ["UTP"], airports: ["UTP"], rails: [], lat: 12.9236, lng: 100.8825, popular: true, pri: 1 },
  { cc: "TH", slug: "phuket", mn: "Пхукет", en: "Phuket", local: "ภูเก็ต", aliases: ["HKT"], airports: ["HKT"], rails: [], lat: 7.8804, lng: 98.3923, popular: true, pri: 1 },
  { cc: "TH", slug: "chiang_mai", mn: "Чианг Май", en: "Chiang Mai", local: "เชียงใหม่", aliases: ["CNX"], airports: ["CNX"], rails: ["Chiang Mai"], lat: 18.7883, lng: 98.9853, popular: true, pri: 1 },
  { cc: "TH", slug: "krabi", mn: "Краби", en: "Krabi", local: "กระบี่", aliases: ["KBV"], airports: ["KBV"], rails: [], lat: 8.0863, lng: 98.9063, popular: true, pri: 1 },
  { cc: "TH", slug: "chiang_rai", mn: "Чианг Рай", en: "Chiang Rai", local: "เชียงราย", aliases: ["CEI"], airports: ["CEI"], rails: [], lat: 19.9105, lng: 99.8406, popular: false, pri: 0 },
  { cc: "TH", slug: "koh_samui", mn: "Самуи", en: "Koh Samui", local: "เกาะสมุย", aliases: ["USM"], airports: ["USM"], rails: [], lat: 9.512, lng: 100.013, popular: false, pri: 0 },
  { cc: "TH", slug: "hat_yai", mn: "Хат Яй", en: "Hat Yai", local: "หาดใหญ่", aliases: ["HDY"], airports: ["HDY"], rails: ["Hat Yai"], lat: 7.008, lng: 100.474, popular: false, pri: 0 },
  { cc: "TH", slug: "udon_thani", mn: "Удон Тани", en: "Udon Thani", local: "อุดรธานี", aliases: ["UTH"], airports: ["UTH"], rails: [], lat: 17.4138, lng: 102.787, popular: false, pri: 0 },
  { cc: "TH", slug: "ayutthaya", mn: "Аютthaya", en: "Ayutthaya", local: "อยุธยา", aliases: [], airports: [], rails: ["Ayutthaya"], lat: 14.353, lng: 100.577, popular: false, pri: 0 },
  { cc: "TH", slug: "hua_hin", mn: "Хua Hin", en: "Hua Hin", local: "หัวหิน", aliases: [], airports: [], rails: ["Hua Hin"], lat: 12.568, lng: 99.957, popular: false, pri: 0 },
  { cc: "TH", slug: "surat_thani", mn: "Сурат Тани", en: "Surat Thani", local: "สุราษฎร์ธานี", aliases: ["URT"], airports: ["URT"], rails: [], lat: 9.138, lng: 99.333, popular: false, pri: 0 },
  // Vietnam (12)
  { cc: "VN", slug: "da_nang", mn: "Дананг", en: "Da Nang", local: "Đà Nẵng", aliases: ["DAD"], airports: ["DAD"], rails: ["Da Nang"], lat: 16.0544, lng: 108.2022, popular: true, pri: 1 },
  { cc: "VN", slug: "vung_tau", mn: "Вунг Тau", en: "Vung Tau", local: "Vũng Tàu", aliases: [], airports: [], rails: [], lat: 10.346, lng: 107.084, popular: true, pri: 1 },
  { cc: "VN", slug: "nha_trang", mn: "Нячанг", en: "Nha Trang", local: "Nha Trang", aliases: ["CXR"], airports: ["CXR"], rails: ["Nha Trang"], lat: 12.2388, lng: 109.1967, popular: true, pri: 1 },
  { cc: "VN", slug: "ho_chi_minh", mn: "Хошимин", en: "Ho Chi Minh City", local: "TP.HCM", aliases: ["Saigon", "SGN"], airports: ["SGN"], rails: ["Saigon"], lat: 10.8231, lng: 106.6297, popular: true, pri: 1 },
  { cc: "VN", slug: "hanoi", mn: "Ханой", en: "Hanoi", local: "Hà Nội", aliases: ["HAN"], airports: ["HAN"], rails: ["Hanoi"], lat: 21.0285, lng: 105.8542, popular: true, pri: 1 },
  { cc: "VN", slug: "hue", mn: "Хue", en: "Hue", local: "Huế", aliases: ["HUI"], airports: ["HUI"], rails: ["Hue"], lat: 16.4637, lng: 107.5909, popular: false, pri: 0 },
  { cc: "VN", slug: "hoi_an", mn: "Хoi An", en: "Hoi An", local: "Hội An", aliases: ["DAD"], airports: ["DAD"], rails: [], lat: 15.8801, lng: 108.338, popular: false, pri: 0 },
  { cc: "VN", slug: "phu_quoc", mn: "Фу Quoc", en: "Phu Quoc", local: "Phú Quốc", aliases: ["PQC"], airports: ["PQC"], rails: [], lat: 10.2899, lng: 103.984, popular: false, pri: 0 },
  { cc: "VN", slug: "can_tho", mn: "Кан Tho", en: "Can Tho", local: "Cần Thơ", aliases: ["VCA"], airports: ["VCA"], rails: [], lat: 10.0452, lng: 105.7469, popular: false, pri: 0 },
  { cc: "VN", slug: "dalat", mn: "Далat", en: "Da Lat", local: "Đà Lạt", aliases: ["DLI"], airports: ["DLI"], rails: [], lat: 11.9404, lng: 108.4583, popular: false, pri: 0 },
  { cc: "VN", slug: "ha_long", mn: "Ха Long", en: "Ha Long", local: "Hạ Long", aliases: [], airports: [], rails: [], lat: 20.971, lng: 107.044, popular: false, pri: 0 },
  { cc: "VN", slug: "vinh", mn: "Вinh", en: "Vinh", local: "Vinh", aliases: ["VII"], airports: ["VII"], rails: ["Vinh"], lat: 18.6796, lng: 105.6813, popular: false, pri: 0 },
  // Indonesia (8)
  { cc: "ID", slug: "bali", mn: "Бали", en: "Bali", local: "Bali", aliases: ["DPS"], airports: ["DPS"], rails: [], lat: -8.3405, lng: 115.092, popular: true, pri: 1 },
  { cc: "ID", slug: "jakarta", mn: "Жakarta", en: "Jakarta", local: "Jakarta", aliases: ["CGK"], airports: ["CGK"], rails: [], lat: -6.2088, lng: 106.8456, popular: true, pri: 1 },
  { cc: "ID", slug: "surabaya", mn: "Сураbaya", en: "Surabaya", local: "Surabaya", aliases: ["SUB"], airports: ["SUB"], rails: [], lat: -7.2575, lng: 112.7521, popular: false, pri: 0 },
  { cc: "ID", slug: "bandung", mn: "Бандung", en: "Bandung", local: "Bandung", aliases: ["BDO"], airports: ["BDO"], rails: [], lat: -6.9175, lng: 107.6191, popular: false, pri: 0 },
  { cc: "ID", slug: "yogyakarta", mn: "Yogyakarta", en: "Yogyakarta", local: "Yogyakarta", aliases: ["YIA", "JOG"], airports: ["YIA"], rails: [], lat: -7.7956, lng: 110.3695, popular: false, pri: 0 },
  { cc: "ID", slug: "medan", mn: "Медan", en: "Medan", local: "Medan", aliases: ["KNO"], airports: ["KNO"], rails: [], lat: 3.5952, lng: 98.6722, popular: false, pri: 0 },
  { cc: "ID", slug: "lombok", mn: "Лombok", en: "Lombok", local: "Lombok", aliases: ["LOP"], airports: ["LOP"], rails: [], lat: -8.583, lng: 116.116, popular: false, pri: 0 },
  { cc: "ID", slug: "batam", mn: "Бatam", en: "Batam", local: "Batam", aliases: ["BTH"], airports: ["BTH"], rails: [], lat: 1.0456, lng: 104.0305, popular: false, pri: 0 },
  // Japan (10)
  { cc: "JP", slug: "tokyo", mn: "Токио", en: "Tokyo", local: "東京", aliases: ["NRT", "HND"], airports: ["NRT", "HND"], rails: ["東京駅"], lat: 35.6762, lng: 139.6503, popular: true, pri: 1 },
  { cc: "JP", slug: "osaka", mn: "Оsaka", en: "Osaka", local: "大阪", aliases: ["KIX", "ITM"], airports: ["KIX", "ITM"], rails: ["大阪駅"], lat: 34.6937, lng: 135.5023, popular: true, pri: 1 },
  { cc: "JP", slug: "kyoto", mn: "Кyoto", en: "Kyoto", local: "京都", aliases: [], airports: [], rails: ["京都駅"], lat: 35.0116, lng: 135.7681, popular: true, pri: 1 },
  { cc: "JP", slug: "sapporo", mn: "Сapporo", en: "Sapporo", local: "札幌", aliases: ["CTS"], airports: ["CTS"], rails: ["札幌駅"], lat: 43.0618, lng: 141.3545, popular: false, pri: 0 },
  { cc: "JP", slug: "fukuoka", mn: "Фukuoka", en: "Fukuoka", local: "福岡", aliases: ["FUK"], airports: ["FUK"], rails: ["博多駅"], lat: 33.5904, lng: 130.4017, popular: false, pri: 0 },
  { cc: "JP", slug: "nagoya", mn: "Нagoya", en: "Nagoya", local: "名古屋", aliases: ["NGO"], airports: ["NGO"], rails: ["名古屋駅"], lat: 35.1815, lng: 136.9066, popular: false, pri: 0 },
  { cc: "JP", slug: "hiroshima", mn: "Хiroshima", en: "Hiroshima", local: "広島", aliases: ["HIJ"], airports: ["HIJ"], rails: ["広島駅"], lat: 34.3853, lng: 132.4553, popular: false, pri: 0 },
  { cc: "JP", slug: "nara", mn: "Нara", en: "Nara", local: "奈良", aliases: [], airports: [], rails: ["奈良駅"], lat: 34.6851, lng: 135.8048, popular: false, pri: 0 },
  { cc: "JP", slug: "okinawa", mn: "Оkinawa", en: "Okinawa", local: "沖縄", aliases: ["OKA"], airports: ["OKA"], rails: [], lat: 26.2124, lng: 127.6792, popular: false, pri: 0 },
  { cc: "JP", slug: "sendai", mn: "Сенdai", en: "Sendai", local: "仙台", aliases: ["SDJ"], airports: ["SDJ"], rails: ["仙台駅"], lat: 38.2682, lng: 140.8694, popular: false, pri: 0 },
  // Korea (10)
  { cc: "KR", slug: "seoul", mn: "Сөүл", en: "Seoul", local: "서울", aliases: ["ICN", "GMP"], airports: ["ICN", "GMP"], rails: ["서울역"], lat: 37.5665, lng: 126.978, popular: true, pri: 1 },
  { cc: "KR", slug: "busan", mn: "Бusan", en: "Busan", local: "부산", aliases: ["PUS"], airports: ["PUS"], rails: ["부산역"], lat: 35.1796, lng: 129.0756, popular: true, pri: 1 },
  { cc: "KR", slug: "jeju", mn: "Жeju", en: "Jeju", local: "제주", aliases: ["CJU"], airports: ["CJU"], rails: [], lat: 33.4996, lng: 126.5312, popular: true, pri: 1 },
  { cc: "KR", slug: "incheon", mn: "Иncheon", en: "Incheon", local: "인천", aliases: ["ICN"], airports: ["ICN"], rails: ["인천역"], lat: 37.4563, lng: 126.7052, popular: false, pri: 0 },
  { cc: "KR", slug: "daegu", mn: "Daegu", en: "Daegu", local: "대구", aliases: ["TAE"], airports: ["TAE"], rails: ["대구역"], lat: 35.8714, lng: 128.6014, popular: false, pri: 0 },
  { cc: "KR", slug: "gwangju", mn: "Gwangju", en: "Gwangju", local: "광주", aliases: ["KWJ"], airports: ["KWJ"], rails: ["광주송정역"], lat: 35.1595, lng: 126.8526, popular: false, pri: 0 },
  { cc: "KR", slug: "daejeon", mn: "Daejeon", en: "Daejeon", local: "대전", aliases: [], airports: [], rails: ["대전역"], lat: 36.3504, lng: 127.3845, popular: false, pri: 0 },
  { cc: "KR", slug: "jeonju", mn: "Jeonju", en: "Jeonju", local: "전주", aliases: [], airports: [], rails: ["전주역"], lat: 35.8242, lng: 127.148, popular: false, pri: 0 },
  { cc: "KR", slug: "gangneung", mn: "Gangneung", en: "Gangneung", local: "강릉", aliases: ["KAG"], airports: ["KAG"], rails: ["강릉역"], lat: 37.7519, lng: 128.8761, popular: false, pri: 0 },
  { cc: "KR", slug: "gyeongju", mn: "Gyeongju", en: "Gyeongju", local: "경주", aliases: [], airports: [], rails: ["경주역"], lat: 35.8562, lng: 129.2247, popular: false, pri: 0 },
  // Mongolia (3)
  { cc: "MN", slug: "ulanbaatar", mn: "Улаанбаатар", en: "Ulaanbaatar", local: "Ulaanbaatar", aliases: ["UB", "UBN"], airports: ["UBN"], rails: ["Ulaanbaatar"], lat: 47.8864, lng: 106.9057, popular: true, pri: 1 },
  { cc: "MN", slug: "erdenet", mn: "Эрдэнэт", en: "Erdenet", local: "Erdenet", aliases: [], airports: [], rails: [], lat: 49.033, lng: 104.042, popular: false, pri: 0 },
  { cc: "MN", slug: "darkhan", mn: "Дarkhan", en: "Darkhan", local: "Darkhan", aliases: [], airports: [], rails: [], lat: 49.486, lng: 105.922, popular: false, pri: 0 },
  // Singapore (2)
  { cc: "SG", slug: "singapore", mn: "Сингапур", en: "Singapore", local: "Singapore", aliases: ["SIN"], airports: ["SIN"], rails: [], lat: 1.3521, lng: 103.8198, popular: true, pri: 1 },
  { cc: "SG", slug: "sentosa", mn: "Sentosa", en: "Sentosa", local: "Sentosa", aliases: [], airports: [], rails: [], lat: 1.2494, lng: 103.8303, popular: false, pri: 0 },
  // Malaysia (6)
  { cc: "MY", slug: "kuala_lumpur", mn: "Куала Lumpur", en: "Kuala Lumpur", local: "KL", aliases: ["KUL"], airports: ["KUL"], rails: ["KL Sentral"], lat: 3.139, lng: 101.6869, popular: true, pri: 1 },
  { cc: "MY", slug: "penang", mn: "Penang", en: "Penang", local: "Penang", aliases: ["PEN"], airports: ["PEN"], rails: [], lat: 5.4164, lng: 100.3327, popular: false, pri: 0 },
  { cc: "MY", slug: "langkawi", mn: "Langkawi", en: "Langkawi", local: "Langkawi", aliases: ["LGK"], airports: ["LGK"], rails: [], lat: 6.35, lng: 99.8, popular: false, pri: 0 },
  { cc: "MY", slug: "melaka", mn: "Melaka", en: "Malacca", local: "Melaka", aliases: [], airports: [], rails: [], lat: 2.1896, lng: 102.2501, popular: false, pri: 0 },
  { cc: "MY", slug: "johor_bahru", mn: "Johor Bahru", en: "Johor Bahru", local: "JB", aliases: ["JHB"], airports: ["JHB"], rails: [], lat: 1.4927, lng: 103.7414, popular: false, pri: 0 },
  { cc: "MY", slug: "kota_kinabalu", mn: "Kota Kinabalu", en: "Kota Kinabalu", local: "KK", aliases: ["BKI"], airports: ["BKI"], rails: [], lat: 5.9804, lng: 116.0735, popular: false, pri: 0 },
  // UAE (2)
  { cc: "AE", slug: "dubai", mn: "Дубай", en: "Dubai", local: "Dubai", aliases: ["DXB"], airports: ["DXB"], rails: ["Dubai Metro"], lat: 25.2048, lng: 55.2708, popular: true, pri: 1 },
  { cc: "AE", slug: "abu_dhabi", mn: "Аbu Dhabi", en: "Abu Dhabi", local: "Abu Dhabi", aliases: ["AUH"], airports: ["AUH"], rails: [], lat: 24.4539, lng: 54.3773, popular: false, pri: 0 }
];

const HOTEL_PREFIXES = ["Inn", "Express", "Metro", "Budget", "Central", "Garden", "City", "Comfort", "Smart", "Stay"];
const HOTEL_SUFFIXES = ["Hotel", "Inn", "Suites", "Lodge", "Residence"];
const AREAS = ["Downtown", "Station Area", "Business District", "Old Town", "Airport Road", "Metro Hub", "Market Street", "Riverside"];
const AMENITY_POOLS = [
  ["wifi", "breakfast", "metro_nearby"],
  ["wifi", "parking", "24h_front"],
  ["wifi", "breakfast", "gym"],
  ["wifi", "metro_nearby", "laundry"],
  ["wifi", "restaurant", "airport_shuttle"],
  ["wifi", "breakfast", "family_friendly"]
];

function escSql(s) {
  return String(s ?? "").replace(/'/g, "''");
}

function jsonSql(obj) {
  return `'${escSql(JSON.stringify(obj))}'::jsonb`;
}

function pickStars(i) {
  const r = i % 10;
  if (r < 6) return 3;
  if (r < 8) return 4;
  return 5;
}

function priceFor(stars, cc, seed = 0) {
  const base = { CN: [180000, 320000, 480000], TH: [150000, 280000, 450000], VN: [140000, 260000, 420000],
    ID: [160000, 300000, 480000], JP: [220000, 380000, 650000], KR: [200000, 350000, 580000],
    MN: [120000, 220000, 380000], SG: [280000, 450000, 750000], MY: [150000, 270000, 440000], AE: [250000, 420000, 720000] };
  const tier = stars - 3;
  const [lo, mid, hi] = base[cc] || base.CN;
  const vals = [lo, mid, hi];
  return vals[Math.min(tier, 2)] + (seed % 7) * 12000;
}

function generateHotels() {
  const hotels = [];
  let idx = 0;
  const weights = CITY_DEFS.map((c) => (c.pri ? 8 : 3));
  const totalW = weights.reduce((a, b) => a + b, 0);
  CITY_DEFS.forEach((city, ci) => {
    const count = Math.max(1, Math.round((weights[ci] / totalW) * 500));
    for (let j = 0; j < count && hotels.length < 500; j++) {
      idx++;
      const stars = pickStars(idx);
      const prefix = HOTEL_PREFIXES[idx % HOTEL_PREFIXES.length];
      const suffix = HOTEL_SUFFIXES[(idx + j) % HOTEL_SUFFIXES.length];
      const area = AREAS[j % AREAS.length];
      const name = `${city.en} ${prefix} ${suffix}${j > 0 ? ` ${j + 1}` : ""}`.trim();
      const price = priceFor(stars, city.cc, idx) + j * 8000;
      hotels.push({
        city_slug: city.slug,
        cc: city.cc,
        official_name: name,
        name_mn: `${city.mn} ${stars} од`,
        stars,
        district: area,
        area_name: area,
        address: `${area}, ${city.en}`,
        lat: city.lat + (j * 0.008 - 0.02),
        lng: city.lng + (j * 0.006 - 0.015),
        description_mn: `${city.mn} хотын ${area} бүсэд байрлах ${stars} одтой буудал. Метро/тээвэр ойрхон.`,
        amenities: AMENITY_POOLS[idx % AMENITY_POOLS.length],
        price,
        supplier_id: `SEED-${city.slug.toUpperCase()}-${String(idx).padStart(4, "0")}`
      });
    }
  });
  while (hotels.length < 500) {
    const city = CITY_DEFS[hotels.length % CITY_DEFS.length];
    idx++;
    const stars = 3;
    hotels.push({
      city_slug: city.slug,
      cc: city.cc,
      official_name: `${city.en} Budget Stay ${hotels.length}`,
      name_mn: `${city.mn} хямд буудал`,
      stars,
      district: "Budget Zone",
      area_name: "Station Area",
      address: `Station Rd, ${city.en}`,
      lat: city.lat,
      lng: city.lng,
      description_mn: `Хямд 3 одтой буудал — ${city.mn}.`,
      amenities: ["wifi", "breakfast"],
      price: priceFor(3, city.cc),
      supplier_id: `SEED-BUD-${String(idx).padStart(4, "0")}`
    });
  }
  return hotels.slice(0, 500);
}

function generateAttractions() {
  const names = [
    ["Хоригдсон хот", "Forbidden City"], ["Great Wall", "Great Wall"], ["Shanghai Tower", "Shanghai Tower"],
    ["Panda Base", "Chengdu Panda Base"], ["Terracotta Army", "Terracotta Army"], ["Victoria Peak", "Victoria Peak"],
    ["Grand Palace", "Grand Palace"], ["Phi Phi Islands", "Phi Phi Islands"], ["Ha Long Bay", "Ha Long Bay"],
    ["Cu Chi Tunnels", "Cu Chi Tunnels"], ["Borobudur", "Borobudur"], ["Tanah Lot", "Tanah Lot"],
    ["Tokyo Skytree", "Tokyo Skytree"], ["Fushimi Inari", "Fushimi Inari"], ["Gyeongbokgung", "Gyeongbokgung"],
    ["Jeju Hallasan", "Hallasan"], ["Marina Bay", "Marina Bay"], ["Petronas Towers", "Petronas Towers"],
    ["Burj Khalifa", "Burj Khalifa"], ["Disneyland", "Disneyland"], ["Universal Studios", "Universal Studios"],
    ["Night Market", "Night Market Tour"], ["Temple Tour", "Temple Tour"], ["Museum Pass", "City Museum"],
    ["River Cruise", "River Cruise"], ["Food Tour", "Street Food Tour"]
  ];
  const out = [];
  for (let i = 0; i < 100; i++) {
    const city = CITY_DEFS[i % CITY_DEFS.length];
    const [mn, en] = names[i % names.length];
    out.push({
      city_slug: city.slug,
      name_mn: `${city.mn} — ${mn}`,
      name_en: `${city.en} ${en}`,
      description_mn: `${city.mn} хотод зочлох ${mn}. Тасалбар, хөтөчийн үйлчилгээ.`,
      price: 35000 + (i % 20) * 15000,
      currency: city.cc === "CN" ? "CNY" : city.cc === "JP" ? "JPY" : "USD"
    });
  }
  return out;
}

function generateRentals() {
  const types = ["apartment", "studio", "condo", "serviced_apartment"];
  const out = [];
  for (let i = 0; i < 50; i++) {
    const city = CITY_DEFS.filter((c) => ["VN", "TH", "ID", "MY", "CN"].includes(c.cc))[i % 25];
    out.push({
      city_slug: city.slug,
      cc: city.cc,
      area: AREAS[i % AREAS.length],
      property_type: types[i % types.length],
      bedrooms: 1 + (i % 3),
      monthly_usd: 400 + (i % 15) * 80,
      monthly_mnt: 1200000 + (i % 20) * 150000,
      description_mn: `${city.mn} — ${1 + (i % 3)} өрөөт ${types[i % types.length]}. Урт хугацааны түрээс.`,
      amenities: ["wifi", "pool", "gym", "parking"].slice(0, 2 + (i % 3))
    });
  }
  return out;
}

function generateTravelGuides() {
  const cats = ["visa", "transport", "food", "culture", "safety", "budget", "esim", "general"];
  const out = [];
  for (let i = 0; i < 50; i++) {
    const city = CITY_DEFS[i % CITY_DEFS.length];
    const cat = cats[i % cats.length];
    out.push({
      city_slug: city.slug,
      cc: city.cc,
      slug: `guide-${city.slug}-${cat}-${i}`,
      title_mn: `${city.mn} — ${cat} гарын авлага`,
      title_en: `${city.en} ${cat} guide`,
      summary_mn: `${city.mn} хотод аялах ${cat} талаарх зөвлөмж.`,
      body_mn: `${city.mn} хотын ${cat} мэдээлэл. eSIM Mongolia Travel OS.`,
      category: cat
    });
  }
  return out;
}

function generateHealthGuides() {
  const types = ["insurance", "vaccine", "hospital"];
  const out = [];
  for (let i = 0; i < 30; i++) {
    const city = CITY_DEFS[i % CITY_DEFS.length];
    const t = types[i % types.length];
    const titles = {
      insurance: `${city.mn} — аяллын даатгал`,
      vaccine: `${city.mn} — вакцин, эрүүл мэнд`,
      hospital: `${city.mn} — олон улсын эмнэлэг`
    };
    out.push({
      city_slug: city.slug,
      cc: city.cc,
      guide_type: t,
      title_mn: titles[t],
      description_mn: `${city.mn} хотод ${t === "hospital" ? "англи хэл дэмждэг эмнэлэг" : t === "vaccine" ? "шахмал вакцин, эрүүл мэндийн зөвлөгөө" : "аяллын даатгал, гэрчилгээ"}.`,
      phone: "+800-000-" + String(1000 + i),
      address: `${city.en} Medical Center ${i + 1}`
    });
  }
  return out;
}

function buildSql() {
  const hotels = generateHotels();
  const attractions = generateAttractions();
  const rentals = generateRentals();
  const guides = generateTravelGuides();
  const health = generateHealthGuides();

  const lines = [
    "-- eSIM Mongolia bulk inventory seed",
    "-- Generated by scripts/generate-travel-seed.mjs",
    `-- Counts: ${COUNTRIES.length} countries, ${CITY_DEFS.length} cities, ${hotels.length} hotels, ${attractions.length} attractions, ${rentals.length} rentals, ${guides.length} guides, ${health.length} health`,
    "-- Run after schema.sql + migrations 001-005",
    "-- Images: empty Cloudinary URLs — upload via Admin; site uses local fallback until set",
    "",
    "-- ========== COUNTRIES (10) ==========",
    "insert into esm_countries (iso_code, slug, name_mn, name_en, name_local, flag_emoji, currency, is_featured, active, sort_order)",
    "values"
  ];

  lines.push(
    COUNTRIES.map((c) =>
      `  ('${c.iso}', '${c.slug}', '${escSql(c.name_mn)}', '${escSql(c.name_en)}', '${escSql(c.local)}', '${c.flag}', '${c.currency}', ${c.featured}, true, ${c.order})`
    ).join(",\n")
  );
  lines.push("on conflict (iso_code) do update set name_mn = excluded.name_mn, is_featured = excluded.is_featured, sort_order = excluded.sort_order;");
  lines.push("");

  lines.push("-- ========== CITIES (100) ==========");
  for (const c of CITY_DEFS) {
    lines.push(`insert into esm_cities (country_id, slug, name_mn, name_en, name_local, aliases, airport_codes, railway_stations, lat, lng, cover_image_url, transport_mn, budget_hint_mn, popular, active, sort_order)`);
    lines.push(`select id, '${c.slug}', '${escSql(c.mn)}', '${escSql(c.en)}', '${escSql(c.local)}', ${jsonSql(c.aliases)}, ${jsonSql(c.airports)}, ${jsonSql(c.rails)}, ${c.lat}, ${c.lng}, null, 'Метро + такси', 'Хямд-с дунд зэрэг', ${c.popular}, true, ${c.pri ? 1 : 5}`);
    lines.push(`from esm_countries where iso_code = '${c.cc}'`);
    lines.push(`on conflict (country_id, slug) do update set name_mn = excluded.name_mn, aliases = excluded.aliases, airport_codes = excluded.airport_codes, railway_stations = excluded.railway_stations, popular = excluded.popular;`);
    lines.push("");
  }

  lines.push("-- ========== HOTELS (500) ==========");
  for (const h of hotels) {
    const sup = {
      supplier_name: "Internal Catalog",
      supplier_url: "",
      supplier_hotel_id: h.supplier_id,
      supplier_price: Math.round(h.price / 540),
      supplier_currency: h.cc === "CN" ? "CNY" : h.cc === "TH" ? "THB" : h.cc === "VN" ? "VND" : "USD",
      markup_percent: 15,
      internal_notes: "Bulk seed — Cloudinary images via Admin"
    };
    lines.push(`insert into esm_hotels (country_id, city_id, official_name, name_mn_optional, stars, district, area_name, address, latitude, longitude, description_mn, cover_image_url, gallery_image_urls, room_image_urls, image_urls, gallery_urls, amenities, final_price_mnt, supplier_reference, active)`);
    lines.push(`select co.id, ci.id, '${escSql(h.official_name)}', '${escSql(h.name_mn)}', ${h.stars}, '${escSql(h.district)}', '${escSql(h.area_name)}', '${escSql(h.address)}', ${h.lat.toFixed(4)}, ${h.lng.toFixed(4)}, '${escSql(h.description_mn)}', null, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, ${jsonSql(h.amenities)}, ${h.price}, ${jsonSql(sup)}::jsonb, true`);
    lines.push(`from esm_cities ci join esm_countries co on co.id = ci.country_id where ci.slug = '${h.city_slug}' and co.iso_code = '${h.cc}';`);
  }
  lines.push("");

  lines.push("-- ========== ATTRACTIONS (100) ==========");
  for (const a of attractions) {
    lines.push(`insert into attractions (city_id, name_mn, name_en, description_mn, cover_image_url, image_urls, gallery_image_urls, original_price, currency, final_price_mnt, active)`);
    lines.push(`select ci.id, '${escSql(a.name_mn)}', '${escSql(a.name_en)}', '${escSql(a.description_mn)}', null, '[]'::jsonb, '[]'::jsonb, ${Math.round(a.price / 540)}, '${a.currency}', ${a.price}, true`);
    lines.push(`from esm_cities ci where ci.slug = '${a.city_slug}';`);
  }
  lines.push("");

  lines.push("-- ========== LONG STAY RENTALS (50) ==========");
  for (const r of rentals) {
    lines.push(`insert into esm_long_stay_rentals (country_id, city_id, area, property_type, bedrooms, monthly_price_usd, monthly_price_mnt, description_mn, amenities, min_stay_months, cover_image_url, gallery_image_urls, active)`);
    lines.push(`select co.id, ci.id, '${escSql(r.area)}', '${r.property_type}', ${r.bedrooms}, ${r.monthly_usd}, ${r.monthly_mnt}, '${escSql(r.description_mn)}', ${jsonSql(r.amenities)}, 1, null, '[]'::jsonb, true`);
    lines.push(`from esm_cities ci join esm_countries co on co.id = ci.country_id where ci.slug = '${r.city_slug}';`);
  }
  lines.push("");

  lines.push("-- ========== TRAVEL GUIDES (50) ==========");
  for (const g of guides) {
    lines.push(`insert into esm_travel_guides (country_id, city_id, slug, title_mn, title_en, summary_mn, body_mn, category, cover_image_url, gallery_image_urls, active)`);
    lines.push(`select co.id, ci.id, '${g.slug}', '${escSql(g.title_mn)}', '${escSql(g.title_en)}', '${escSql(g.summary_mn)}', '${escSql(g.body_mn)}', '${g.category}', null, '[]'::jsonb, true`);
    lines.push(`from esm_cities ci join esm_countries co on co.id = ci.country_id where ci.slug = '${g.city_slug}'`);
    lines.push(`on conflict (slug) do nothing;`);
  }
  lines.push("");

  lines.push("-- ========== HEALTH GUIDES (30) ==========");
  for (const h of health) {
    lines.push(`insert into esm_health_guides (country_id, city_id, guide_type, title_mn, description_mn, address, phone, cover_image_url, image_urls, active)`);
    lines.push(`select co.id, ci.id, '${h.guide_type}', '${escSql(h.title_mn)}', '${escSql(h.description_mn)}', '${escSql(h.address)}', '${h.phone}', null, '[]'::jsonb, true`);
    lines.push(`from esm_cities ci join esm_countries co on co.id = ci.country_id where ci.slug = '${h.city_slug}';`);
  }

  return lines.join("\n");
}

const sql = buildSql();
writeFileSync(OUT, sql, "utf8");
console.log("Wrote", OUT);
console.log("Size:", (sql.length / 1024).toFixed(1), "KB");
