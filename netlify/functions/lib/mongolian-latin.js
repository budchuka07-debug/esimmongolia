/**
 * Latin-script Mongolian + English keyboard → Cyrillic hints for AI intent parsing.
 * Mongolians often type: "sain baina shanghai ruu 5 honog 2 hun — tuslah"
 */
function foldAscii(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0400-\u04ff\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function applyReplacements(text, pairs) {
  let t = text;
  for (const [from, to] of pairs) {
    const esc = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    t = t.replace(new RegExp(`\\b${esc}\\b`, "gi"), to);
  }
  return t;
}

/** @param {string} text @param {{ getAll?: () => { name_en: string, name_mn: string, city_id: string }[] } | null} chinaDest */
function normalizeLatinMongolian(text, chinaDest) {
  let t = foldAscii(text);

  const cityPairs = [
    ["hohhot", "хөх хот"], ["huh hot", "хөх хот"], ["hoh hot", "хөх хот"], ["huhehaote", "хөх хот"],
    ["ulaanbaatar", "улаанбаатар"], ["ulaan baatar", "улаанбаатар"], ["ulaanbaatar", "улаанбаатар"],
    ["shanghai", "шанхай"], ["shan xai", "шанхай"], ["shang hai", "шанхай"], ["shanghair", "шанхай"],
    ["beijing", "бээжин"], ["bee jing", "бээжин"], ["beijin", "бээжин"], ["peking", "бээжин"],
    ["guangzhou", "гуанжоу"], ["guang zhou", "гуанжоу"], ["canton", "гуанжоу"],
    ["shenzhen", "шэньжэнь"], ["shen zhen", "шэньжэнь"],
    ["hong kong", "хонконг"], ["hongkong", "хонконг"],
    ["erenhot", "эрээн"], ["eren hot", "эрээн"], ["erian", "эрээн"], ["erlen", "эрээн"],
    ["seoul", "сөүл"], ["soul", "сөүл"], ["incheon", "сөүл"],
    ["busan", "пусан"], ["pusan", "пусан"],
    ["tokyo", "токио"], ["tokio", "токио"], ["osaka", "осака"],
    ["bangkok", "бангкок"], ["bankok", "бангкок"],
    ["phuket", "пхукет"], ["phuket", "пхукет"],
    ["hanoi", "ханой"], ["ha noi", "ханой"],
    ["ho chi minh", "хошимин"], ["hochiminh", "хошимин"], ["saigon", "хошимин"],
    ["singapore", "сингапур"], ["singapor", "сингапур"],
    ["bali", "бали"],
    ["istanbul", "стамбул"], ["stambul", "стамбул"],
    ["dubai", "дубай"], ["dubay", "дубай"],
    ["xian", "сиань"], ["xi an", "сиань"],
    ["chengdu", "чэнду"], ["hangzhou", "ханчжоу"], ["harbin", "харбин"],
    ["qingdao", "циндао"], ["dalian", "далян"], ["kunming", "куньмин"],
    ["sanya", "саня"], ["yiwu", "иү"], ["nanjing", "нанжин"],
    ["tianjin", "тяньжин"], ["chongqing", "чунцин"]
  ];

  if (chinaDest?.getAll) {
    for (const c of chinaDest.getAll()) {
      if (!c?.name_en || !c?.name_mn) continue;
      cityPairs.push([c.name_en.toLowerCase(), c.name_mn.toLowerCase()]);
      if (c.city_id) cityPairs.push([String(c.city_id).replace(/_/g, " "), c.name_mn.toLowerCase()]);
    }
  }

  t = applyReplacements(t, cityPairs);

  const countryPairs = [
    ["solongos", "солонгос"], ["solongos", "солонгос"], ["korea", "солонгос"],
    ["yapon", "япон"], ["japan", "япон"],
    ["tailand", "тайланд"], ["thailand", "тайланд"], ["tai land", "тайланд"],
    ["vietnam", "вьетнам"], ["viet nam", "вьетнам"],
    ["hyatad", "хятад"], ["khyatad", "хятад"], ["china", "хятад"],
    ["indonesia", "индонез"], ["indonez", "индонез"],
    ["turk", "турк"], ["turkey", "турк"],
    ["malaysia", "малайз"], ["malayzia", "малайз"]
  ];
  t = applyReplacements(t, countryPairs);

  t = t.replace(/(\d+)\s*(honog|khonog|honogoor|khonogoor|honogiin|khonogiin)\b/gi, "$1 хоног");
  t = t.replace(/(\d+)\s*(hun|khun|hvn|huun|huntei|huntey|huniin|khuniin|hvnii)\b/gi, "$1 хүн");
  t = t.replace(/(\d+)\s*(sar|sarand|sard|sariin)\b/gi, "$1 сар");
  t = t.replace(/(\d+)\s*(say|sayn)\b/gi, "$1 сая");
  t = t.replace(/(\d+)\s*(myanga|mng|mnt)\b/gi, "$1 мянга");

  const wordPairs = [
    ["sain uu", "сайн уу"], ["sainuu", "сайн уу"], ["sain baina", "сайн байна"], ["sain bna", "сайн байна"],
    ["sain", "сайн"], ["baina", "байна"], ["bna", "байна"],
    ["budal", "буудал"], ["buudal", "буудал"], ["bvsdal", "буудал"], ["hotel", "буудал"],
    ["nisleg", "нислэг"], ["nisleh", "нислэг"], ["niseh", "нисэх"], ["nisex", "нисэх"], ["flight", "нислэг"],
    ["gal tereg", "галт тэрэг"], ["galt tereg", "галт тэрэг"], ["train", "галт тэрэг"],
    ["tuslah", "туслах"], ["tuslaach", "туслах"], ["tusla", "тусла"], ["help", "туслах"],
    ["zardal", "зардал"], ["zartal", "зардал"], ["zardaliin", "зардал"],
    ["tosov", "төсөв"], ["tusev", "төсөв"], ["tusuv", "төсөв"], ["tөсөв", "төсөв"], ["budget", "төсөв"], ["cost", "зардал"],
    ["une", "үнэ"], ["uniin", "үнэ"], ["price", "үнэ"],
    ["marshrut", "маршрут"], ["tuluvlolt", "төлөвлөлт"], ["tolovlolt", "төлөвлөлт"], ["plan", "төлөвлөлт"],
    ["yaaj", "яаж"], ["yavah", "явах"], ["yvah", "явах"], ["yaah", "явах"], ["ruu", "руу"], ["ru", "руу"],
    ["daatgal", "даатгал"], ["insurance", "даатгал"],
    ["huuhed", "хүүхэд"], ["hvvhed", "хүүхэд"], ["huhed", "хүүхэд"], ["child", "хүүхэд"], ["kids", "хүүхэд"],
    ["tom hun", "том хүн"], ["tomhun", "том хүн"], ["ahmad", "ахмад"], ["elderly", "ахмад"],
    ["zahialah", "захиалах"], ["zahialga", "захиалга"], ["book", "захиалах"],
    ["sanal", "санал"], ["bolgoh", "болгох"], ["bolgo", "болго"],
    ["esim", "esim"], ["internet", "интернет"], ["internetiin", "интернет"],
    ["visa", "виз"], ["viziin", "виз"],
    ["hool", "хоол"], ["food", "хоол"],
    ["metro", "метро"], ["transport", "тээвэр"],
    ["disney", "дисней"], ["disneyland", "дисней"],
    ["hyamd", "хямд"], ["cheap", "хямд"],
    ["business", "бизнес"], ["biznes", "бизнес"],
    ["ger bvlel", "гэр бүл"], ["ger bulel", "гэр бүл"], ["family", "гэр бүл"],
    ["hudaldaa", "худалдаа"], ["trade", "худалдаа"]
  ];
  t = applyReplacements(t, wordPairs);

  return t.replace(/\s+/g, " ").trim();
}

function searchBlob(text, chinaDest) {
  const raw = foldAscii(text);
  const normalized = normalizeLatinMongolian(text, chinaDest);
  return `${raw} ${normalized}`;
}

function latinGreeting(text) {
  const t = foldAscii(text);
  return /^(sain uu|sainuu|sain baina|sain bna|hello|hi|hey|sain)\b/.test(t) ||
    (t.length < 24 && /\bsain\b/.test(t));
}

function latinVague(text) {
  const t = searchBlob(text);
  return /яаж|юу хийх|төлөвлө|зөвлө|санал|тусла|help|bolgoh|plan/.test(t) && t.length < 120;
}

module.exports = {
  foldAscii,
  normalizeLatinMongolian,
  searchBlob,
  latinGreeting,
  latinVague
};
