/**
 * Галт тэрэг — зэрэглэл / вагоны төрөл (customer-facing Mongolian)
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TRAIN_CAR_CLASSES = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const CLASSES = {
    second_class: {
      id: "second_class",
      train_modes: ["hsr", "mixed"],
      icon: "💺",
      label_mn: "2-р зэрэглэл",
      short_mn: "Хамгийн түгээмэл, хямд сонголт",
      detail_mn: "2-р зэрэглэл — хамгийн түгээмэл, хямд суудал. Өндөр хурдны галт тэрэгт 5 ортой (A·B·C·D·F), ихэвчлэн 3+2 байрлалтай.",
      suitable_mn: "Богино болон дунд зайн аялал, хямд төсөвтэй зорчигчид",
      family: true,
      elderly: true,
      long_trip: false,
      ratio: 1
    },
    first_class: {
      id: "first_class",
      train_modes: ["hsr", "mixed"],
      icon: "💺",
      label_mn: "1-р зэрэглэл",
      short_mn: "Илүү өргөн, тухтай",
      detail_mn: "1-р зэрэглэл — илүү өргөн, тухтай суудал. 4 ортой (2+2), илүү зай, нам гүвдүү суудал.",
      suitable_mn: "Тав тухыг илүүд үзэх, ажлын аялал, гэр бүлийн зорчигчид",
      family: true,
      elderly: true,
      long_trip: true,
      ratio: 1.67
    },
    business_class: {
      id: "business_class",
      train_modes: ["hsr"],
      icon: "💺",
      label_mn: "Бизнес зэрэглэл",
      short_mn: "Хамгийн тухтай, өргөн суудал",
      detail_mn: "Бизнес зэрэглэл — хамгийн тухтай, өргөн суудал. 3 ортой (2+1), хувийн зай их, заримдаа хоол, унтлагын хэрэгсэл.",
      suitable_mn: "Бизнес аялал, урт зайн өндөр хурдны нислэгийн түвшний тав тух",
      family: false,
      elderly: true,
      long_trip: true,
      ratio: 2.2
    },
    hard_seat: {
      id: "hard_seat",
      train_modes: ["regular", "mixed"],
      icon: "💺",
      label_mn: "Хатуу суудал",
      short_mn: "Энгийн суудал, богино замд",
      detail_mn: "Хатуу суудал — энгийн суудал, богино замд тохиромжтой. Модон/хатуу суудал, ихэвчлэн 5 ортой.",
      suitable_mn: "1–6 цагийн богино аялал, хямд төсөв",
      family: true,
      elderly: false,
      long_trip: false,
      ratio: 0.72
    },
    soft_seat: {
      id: "soft_seat",
      train_modes: ["regular", "mixed"],
      icon: "💺",
      label_mn: "Зөөлөн суудал",
      short_mn: "Илүү тухтай суудал",
      detail_mn: "Зөөлөн суудал — илүү тухтай суудал. Дэргэцтэй, 4 ортой (2+2), дунд зайд тохиромжтой.",
      suitable_mn: "6–10 цагийн дунд зай, суудалдаа суух зорчигчид",
      family: true,
      elderly: true,
      long_trip: false,
      ratio: 0.9
    },
    hard_sleeper: {
      id: "hard_sleeper",
      train_modes: ["regular", "mixed"],
      icon: "🛏",
      label_mn: "Хатуу унтлагын вагон",
      short_mn: "6 ортой, хямд унтлагын сонголт",
      detail_mn: "Хатуу унтлагын вагон — 6 ортой, дээд/дунд/доод ортой. Хямд унтлагын сонголт, шөнийн аялалд түгээмэл.",
      suitable_mn: "Шөнийн аялал, хямд төсөв, залуу зорчигчид",
      family: true,
      elderly: false,
      long_trip: true,
      ratio: 1.12
    },
    soft_sleeper: {
      id: "soft_sleeper",
      train_modes: ["regular", "mixed"],
      icon: "🛏",
      label_mn: "Зөөлөн унтлагын вагон",
      short_mn: "4 ортой, шөнийн аялалд тохиромжтой",
      detail_mn: "Зөөлөн унтлагын вагон — 4 ортой, илүү тухтай. Дэр, даавуу сайн, хаалгатай тасалгаа.",
      suitable_mn: "Шөнийн аялал, гэр бүл, өндөр настанд илүү тохиромжтой",
      family: true,
      elderly: true,
      long_trip: true,
      ratio: 1.5
    },
    deluxe_sleeper: {
      id: "deluxe_sleeper",
      train_modes: ["regular", "mixed"],
      icon: "🚪",
      label_mn: "Купе",
      short_mn: "Илүү хувийн, хамгийн тухтай",
      detail_mn: "Купе / Deluxe soft sleeper — 2 ортой эсвэл private coupe маягийн хамгийн тухтай унтлагын төрөл. Хаалгатай, илүү зай.",
      suitable_mn: "Хос, гэр бүл, тав тухыг эрхэмлэх зорчигчид, урт шөнийн аялал",
      family: true,
      elderly: true,
      long_trip: true,
      ratio: 2.13
    }
  };

  const MODE_CLASSES = {
    hsr: ["second_class", "first_class", "business_class"],
    regular: ["hard_seat", "soft_seat", "hard_sleeper", "soft_sleeper", "deluxe_sleeper"],
    mixed: ["second_class", "first_class", "soft_sleeper", "hard_sleeper", "deluxe_sleeper"]
  };

  function inferMode(record) {
    if (record.train_mode) return record.train_mode;
    const note = String(record.seat_class_note || "").toLowerCase();
    if (/хэвтээ|унтлаг|sleeper|hard seat|soft seat/i.test(note)) return "regular";
    if (/бизнес|1-р|2-р|hsr|d·g|өндөр хурд/i.test(note)) return "hsr";
    if (record.route_category === "transfer") return "mixed";
    return "hsr";
  }

  function classIdsForMode(mode) {
    return MODE_CLASSES[mode] || MODE_CLASSES.hsr;
  }

  function getClass(id) {
    return CLASSES[id] ? { ...CLASSES[id] } : null;
  }

  function estimateCny(record, classId) {
    const meta = CLASSES[classId];
    if (!meta) return 0;
    const base = Number(record.class_prices?.second_class ||
      record.class_prices?.hard_seat ||
      record.price_cny_min ||
      record.original_price ||
      0);
    const secondRatio = CLASSES.second_class.ratio;
    return Math.round(base * (meta.ratio / secondRatio));
  }

  function resolveCny(record, classId) {
    if (record.class_prices && record.class_prices[classId] != null) {
      return Number(record.class_prices[classId]);
    }
    return estimateCny(record, classId);
  }

  function buildPricedOptions(record, priceFn) {
    if (record.transport_type !== "train") return [];
    const mode = inferMode(record);
    return classIdsForMode(mode).map((classId) => {
      const meta = getClass(classId);
      if (!meta) return null;
      const cny = resolveCny(record, classId);
      const priced = priceFn({
        original_price: cny,
        currency: record.currency || "CNY"
      });
      return {
        ...meta,
        class_id: classId,
        final_price_mnt: priced.final_price_mnt
      };
    }).filter(Boolean);
  }

  function svgIllustration(classId) {
    const svg = {
      second_class: `<svg class="tp-train-svg" viewBox="0 0 200 100" aria-hidden="true"><rect x="8" y="20" width="184" height="60" rx="8" fill="#e2e8f0" stroke="#94a3b8"/><g fill="#64748b"><rect x="20" y="32" width="28" height="36" rx="4"/><rect x="54" y="32" width="28" height="36" rx="4"/><rect x="88" y="32" width="28" height="36" rx="4"/><rect x="122" y="32" width="28" height="36" rx="4"/><rect x="156" y="32" width="28" height="36" rx="4"/></g><text x="100" y="92" text-anchor="middle" font-size="9" fill="#64748b">5 ор · 3+2</text></svg>`,
      first_class: `<svg class="tp-train-svg" viewBox="0 0 200 100" aria-hidden="true"><rect x="8" y="20" width="184" height="60" rx="8" fill="#dbeafe" stroke="#60a5fa"/><g fill="#3b82f6"><rect x="24" y="30" width="36" height="40" rx="5"/><rect x="68" y="30" width="36" height="40" rx="5"/><rect x="112" y="30" width="36" height="40" rx="5"/><rect x="156" y="30" width="36" height="40" rx="5"/></g><text x="100" y="92" text-anchor="middle" font-size="9" fill="#3b82f6">4 ор · 2+2</text></svg>`,
      business_class: `<svg class="tp-train-svg" viewBox="0 0 200 100" aria-hidden="true"><rect x="8" y="18" width="184" height="64" rx="8" fill="#fef3c7" stroke="#f59e0b"/><g fill="#d97706"><rect x="30" y="28" width="48" height="44" rx="6"/><rect x="86" y="28" width="48" height="44" rx="6"/><rect x="142" y="28" width="36" height="44" rx="6"/></g><text x="100" y="92" text-anchor="middle" font-size="9" fill="#d97706">3 ор · 2+1</text></svg>`,
      hard_seat: `<svg class="tp-train-svg" viewBox="0 0 200 100" aria-hidden="true"><rect x="8" y="22" width="184" height="56" rx="6" fill="#f1f5f9" stroke="#94a3b8"/><g fill="#94a3b8"><rect x="18" y="34" width="30" height="32" rx="2"/><rect x="54" y="34" width="30" height="32" rx="2"/><rect x="90" y="34" width="30" height="32" rx="2"/><rect x="126" y="34" width="30" height="32" rx="2"/><rect x="162" y="34" width="22" height="32" rx="2"/></g></svg>`,
      soft_seat: `<svg class="tp-train-svg" viewBox="0 0 200 100" aria-hidden="true"><rect x="8" y="22" width="184" height="56" rx="6" fill="#ecfdf5" stroke="#34d399"/><g fill="#10b981"><rect x="24" y="32" width="36" height="36" rx="6"/><rect x="68" y="32" width="36" height="36" rx="6"/><rect x="112" y="32" width="36" height="36" rx="6"/><rect x="156" y="32" width="28" height="36" rx="6"/></g></svg>`,
      hard_sleeper: `<svg class="tp-train-svg" viewBox="0 0 200 110" aria-hidden="true"><rect x="20" y="10" width="160" height="88" rx="6" fill="#f8fafc" stroke="#94a3b8"/><g fill="#94a3b8"><rect x="28" y="18" width="144" height="22" rx="3"/><rect x="28" y="44" width="144" height="22" rx="3"/><rect x="28" y="70" width="144" height="22" rx="3"/></g><text x="100" y="106" text-anchor="middle" font-size="9" fill="#64748b">6 ор · дээд/дунд/доод</text></svg>`,
      soft_sleeper: `<svg class="tp-train-svg" viewBox="0 0 200 110" aria-hidden="true"><rect x="20" y="10" width="160" height="88" rx="6" fill="#eff6ff" stroke="#60a5fa"/><g fill="#3b82f6"><rect x="28" y="22" width="144" height="28" rx="4"/><rect x="28" y="56" width="144" height="28" rx="4"/></g><text x="100" y="106" text-anchor="middle" font-size="9" fill="#3b82f6">4 ор</text></svg>`,
      deluxe_sleeper: `<svg class="tp-train-svg" viewBox="0 0 200 110" aria-hidden="true"><rect x="30" y="8" width="140" height="92" rx="8" fill="#fdf4ff" stroke="#c084fc"/><rect x="38" y="16" width="124" height="76" rx="4" fill="#f3e8ff" stroke="#a855f7"/><g fill="#9333ea"><rect x="46" y="26" width="108" height="26" rx="4"/><rect x="46" y="58" width="108" height="26" rx="4"/></g><text x="100" y="106" text-anchor="middle" font-size="9" fill="#9333ea">2 ор · купе</text></svg>`
    };
    return svg[classId] || "";
  }

  function suitabilityTags(meta) {
    const tags = [];
    if (meta.family) tags.push("👨‍👩‍👧 Гэр бүлд тохиромжтой");
    if (meta.elderly) tags.push("👴 Өндөр настанд тохиромжтой");
    if (meta.long_trip) tags.push("🌙 Урт/шөнийн аялалд");
    if (!meta.family && !meta.elderly) tags.push("🎒 Залуу, хямд төсөвт");
    return tags;
  }

  return {
    CLASSES,
    MODE_CLASSES,
    getClass,
    inferMode,
    classIdsForMode,
    buildPricedOptions,
    svgIllustration,
    suitabilityTags
  };
});
