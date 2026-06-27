/**
 * China travel cities — canonical IDs + multilingual aliases
 */
(function () {
  const CITIES = {
    hohhot: {
      id: "hohhot",
      name_mn: "Хөх хот",
      name_en: "Hohhot",
      name_cn: "呼和浩特",
      aliases: ["Хөх хот", "Hohhot", "Huhehaote", "Huhehot", "呼和浩特", "HHHT"]
    },
    beijing: {
      id: "beijing",
      name_mn: "Бээжин",
      name_en: "Beijing",
      name_cn: "北京",
      aliases: ["Бээжин", "Beijing", "Peking", "北京", "BJS", "PEK"]
    },
    shanghai: {
      id: "shanghai",
      name_mn: "Шанхай",
      name_en: "Shanghai",
      name_cn: "上海",
      aliases: ["Шанхай", "Shanghai", "上海", "SHA", "PVG"]
    },
    guangzhou: {
      id: "guangzhou",
      name_mn: "Гуанжоу",
      name_en: "Guangzhou",
      name_cn: "广州",
      aliases: ["Гуанжоу", "Guangzhou", "Canton", "广州", "CAN"]
    },
    shenzhen: {
      id: "shenzhen",
      name_mn: "Шэньжэнь",
      name_en: "Shenzhen",
      name_cn: "深圳",
      aliases: ["Шэньжэнь", "Shenzhen", "深圳", "SZX"]
    },
    erenhot: {
      id: "erenhot",
      name_mn: "Эрээн",
      name_en: "Erenhot",
      name_cn: "二连浩特",
      aliases: ["Эрээн", "Erenhot", "Erlian", "Eren", "二连浩特", "二连"]
    },
    chengdu: {
      id: "chengdu",
      name_mn: "Чэнду",
      name_en: "Chengdu",
      name_cn: "成都",
      aliases: ["Чэнду", "Chengdu", "成都", "CTU"]
    },
    harbin: {
      id: "harbin",
      name_mn: "Харбин",
      name_en: "Harbin",
      name_cn: "哈尔滨",
      aliases: ["Харбин", "Harbin", "哈尔滨", "HRB"]
    },
    xian: {
      id: "xian",
      name_mn: "Сиань",
      name_en: "Xi'an",
      name_cn: "西安",
      aliases: ["Сиань", "Сиан", "Xi'an", "Xian", "西安", "XIY"]
    },
    zhangjiajie: {
      id: "zhangjiajie",
      name_mn: "Жанжяжэ",
      name_en: "Zhangjiajie",
      name_cn: "张家界",
      aliases: ["Жанжяжэ", "Zhangjiajie", "张家界", "DYG"]
    },
    yiwu: {
      id: "yiwu",
      name_mn: "Иү",
      name_en: "Yiwu",
      name_cn: "义乌",
      aliases: ["Иү", "Yiwu", "义乌", "YIW"]
    },
    ulanbaatar: {
      id: "ulanbaatar",
      name_mn: "Улаанбаатар",
      name_en: "Ulaanbaatar",
      name_cn: "乌兰巴托",
      aliases: ["Улаанбаатар", "Ulaanbaatar", "UB", "UBN", "乌兰巴托"]
    }
  };

  const ALIAS_INDEX = {};
  Object.values(CITIES).forEach((city) => {
    const keys = new Set([
      city.id,
      city.name_mn,
      city.name_en,
      city.name_cn,
      ...(city.aliases || [])
    ]);
    keys.forEach((k) => {
      const norm = normalizeKey(k);
      if (norm) ALIAS_INDEX[norm] = city.id;
    });
  });

  function normalizeKey(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[''`]/g, "")
      .replace(/\s+/g, " ");
  }

  function normalizeCity(input) {
    const raw = String(input || "").trim();
    if (!raw) return null;
    const key = normalizeKey(raw);
    if (ALIAS_INDEX[key]) return ALIAS_INDEX[key];
    const partial = Object.entries(ALIAS_INDEX).find(([alias]) => key.includes(alias) || alias.includes(key));
    return partial ? partial[1] : null;
  }

  function getCity(cityId) {
    return CITIES[cityId] || null;
  }

  function getCityLabel(cityId, lang) {
    const c = getCity(cityId);
    if (!c) return cityId || "";
    if (lang === "en") return c.name_en;
    if (lang === "cn") return c.name_cn;
    return `${c.name_mn} (${c.name_cn})`;
  }

  function getCityLabelMn(cityId) {
    const c = getCity(cityId);
    return c ? c.name_mn : String(cityId || "");
  }

  function allCityOptions() {
    return Object.values(CITIES)
      .filter((c) => c.id !== "ulanbaatar")
      .map((c) => ({ id: c.id, label: `${c.name_mn} — ${c.name_en} ${c.name_cn}` }));
  }

  window.TRAVEL_CITIES = {
    CITIES,
    normalizeCity,
    getCity,
    getCityLabel,
    getCityLabelMn,
    allCityOptions
  };
})();
