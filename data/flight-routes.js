/**
 * Flight route realism — direct vs connecting, confidence levels
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FLIGHT_ROUTES = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const NEEDS_CHECK_MSG = "Үнэ, суудал захиалга хийх үед дахин шалгагдана.";

  const AIRPORTS = {
    ulanbaatar: "UBN",
    beijing: "PEK",
    shanghai: "PVG",
    guangzhou: "CAN",
    hong_kong: "HKG",
    seoul: "ICN",
    bangkok: "BKK",
    phuket: "HKT",
    tokyo: "NRT",
    singapore: "SIN",
    dubai: "DXB",
    hanoi: "HAN",
    ho_chi_minh: "SGN"
  };

  /** China hubs with plausible seasonal/direct service from UBN */
  const CHINA_DIRECT_DESTINATIONS = new Set([
    "beijing", "shanghai", "hohhot", "guangzhou", "shenzhen", "chengdu",
    "harbin", "xian", "dalian", "hangzhou", "qingdao", "xiamen", "kunming",
    "nanjing", "wuhan", "sanya", "erenhot"
  ]);

  const THAILAND_CITIES = new Set([
    "bangkok", "phuket", "pattaya", "chiang_mai", "krabi"
  ]);

  const NO_DIRECT_COUNTRIES = new Set([
    "thailand", "vietnam", "japan", "korea", "singapore", "malaysia",
    "indonesia", "uae", "turkey", "hongkong"
  ]);

  const CITY_LABELS_FALLBACK = {
    ulanbaatar: "Улаанбаатар",
    beijing: "Бээжин",
    shanghai: "Шанхай",
    guangzhou: "Гуанжоу",
    hong_kong: "Хонконг",
    seoul: "Сөүл",
    bangkok: "Бангкок",
    phuket: "Пхукет",
    tokyo: "Токио",
    singapore: "Сингапур",
    hohhot: "Хөх хот"
  };

  function cityLabel(id) {
    return window.TRAVEL_CITIES?.getCityLabelMn?.(id) ||
      window.TRAVEL_CITIES?.getCity?.(id)?.name_mn ||
      CITY_LABELS_FALLBACK[id] ||
      id;
  }

  function countryOf(cityId) {
    const fromApi = window.TRAVEL_CITIES?.getCity?.(cityId)?.country_id;
    if (fromApi) return fromApi;
    if (THAILAND_CITIES.has(cityId)) return "thailand";
    if (["tokyo", "osaka", "kyoto", "fukuoka"].includes(cityId)) return "japan";
    if (["seoul", "busan", "jeju"].includes(cityId)) return "korea";
    if (cityId === "hong_kong") return "hongkong";
    if (["beijing", "shanghai", "guangzhou", "hohhot", "shenzhen"].includes(cityId)) return "china";
    return null;
  }

  function resolveDest(fromId, toId, toInput) {
    let destId = toId || window.TRAVEL_CITIES?.normalizeCity?.(toInput);
    if (!destId) return { fromId: fromId || "ulanbaatar", destId: "shanghai" };

    const from = fromId || "ulanbaatar";
    if (destId === "thailand" || destId === "hongkong") {
      return { fromId: from, destId: destId === "thailand" ? "bangkok" : "hong_kong", countryId: destId };
    }
    const country = countryOf(destId);
    if (country && NO_DIRECT_COUNTRIES.has(country) && !THAILAND_CITIES.has(destId)) {
      return { fromId: from, destId, countryId: country };
    }
    return { fromId: from, destId, countryId: country };
  }

  function hasDirectRoute(fromId, destId) {
    if (fromId !== "ulanbaatar") return false;
    return CHINA_DIRECT_DESTINATIONS.has(destId);
  }

  function needsConnecting(fromId, destId, countryId) {
    if (fromId !== "ulanbaatar") return true;
    if (THAILAND_CITIES.has(destId) || countryId === "thailand") return true;
    if (countryId && NO_DIRECT_COUNTRIES.has(countryId)) return true;
    if (destId === "hong_kong") return true;
    return !hasDirectRoute(fromId, destId);
  }

  function destDisplayName(destId, countryId) {
    if (THAILAND_CITIES.has(destId) || countryId === "thailand") return "Тайланд";
    return cityLabel(destId);
  }

  const DIRECT_TEMPLATES = {
    beijing: [
      { airline: "Air China", dep: "08:30", arr: "10:45", dur: "2ц 15мин", bag: "23kg", price: 1680, data_confidence: "estimated" },
      { airline: "MIAT Mongolian Airlines", dep: "14:20", arr: "16:30", dur: "2ц 10мин", bag: "20kg", price: 1750, data_confidence: "needs_check" }
    ],
    shanghai: [
      { airline: "Air China", dep: "11:20", arr: "13:10", dur: "2ц 50мин", bag: "23kg", price: 1720, data_confidence: "estimated" },
      { airline: "China Southern", dep: "14:05", arr: "17:00", dur: "2ц 55мин", bag: "20kg", price: 1680, data_confidence: "needs_check" },
      { airline: "MIAT Mongolian Airlines", dep: "09:40", arr: "12:35", dur: "2ц 55мин", bag: "23kg", price: 1850, data_confidence: "needs_check" }
    ],
    hohhot: [
      { airline: "Air China", dep: "10:15", arr: "11:05", dur: "50мин", bag: "20kg", price: 980, data_confidence: "estimated" }
    ]
  };

  const DEFAULT_CHINA_DIRECT = [
    { airline: "Air China", dep: "09:00", arr: "12:30", dur: "3ц 30мин", bag: "23kg", price: 1750, data_confidence: "needs_check" },
    { airline: "China Southern", dep: "13:40", arr: "17:10", dur: "3ц 30мин", bag: "20kg", price: 1680, data_confidence: "needs_check" }
  ];

  function connectingHubs(destId) {
    const hubs = [
      { hub_id: "beijing", hub_mn: "Бээжин", dur: "11ц 20мин", dep: "07:50", arr: "19:10", bag: "23kg", price: 1580 },
      { hub_id: "seoul", hub_mn: "Сөүл", dur: "12ц 45мин", dep: "08:10", arr: "20:55", bag: "23kg", price: 1620 },
      { hub_id: "hong_kong", hub_mn: "Хонконг", dur: "11ц 50мин", dep: "09:00", arr: "20:50", bag: "23kg", price: 1650 },
      { hub_id: "guangzhou", hub_mn: "Гуанжоу", dur: "12ц 10мин", dep: "08:30", arr: "20:40", bag: "20kg", price: 1540 }
    ];
    const destMn = cityLabel(destId);
    return hubs.map((h, i) => ({
      airline: `${cityLabel(h.hub_id)} дамжих холболт`,
      dep: h.dep,
      arr: h.arr,
      dur: h.dur,
      bag: h.bag,
      price: h.price + i * 40,
      is_direct: false,
      transfer_city: h.hub_mn,
      transfer_city_id: h.hub_id,
      route_summary: `Улаанбаатар → ${h.hub_mn} → ${destMn}`,
      data_confidence: "estimated"
    }));
  }

  function buildFlightRecord(template, ctx, index) {
    const { fromId, destId, fromMn, destMn } = ctx;
    const fromAp = AIRPORTS[fromId] || "UBN";
    const destAp = AIRPORTS[destId] || "—";
    const isDirect = template.is_direct !== false;
    const transferCity = template.transfer_city || null;

    return {
      type: "flight",
      id: `flight-${fromId}-${destId}-${index}`,
      to_city_id: destId,
      from_city_id: fromId,
      airline: template.airline,
      from_city: fromMn,
      to_city: destMn,
      depart_airport: fromAp,
      arrive_airport: destAp,
      depart_time: template.dep,
      arrive_time: template.arr,
      duration: template.dur,
      baggage: template.bag,
      is_direct: isDirect,
      transfer_city: transferCity,
      route_summary: template.route_summary || `${fromMn} → ${destMn}`,
      data_confidence: template.data_confidence || "needs_check",
      needs_check_message: (template.data_confidence || "needs_check") === "needs_check" ? NEEDS_CHECK_MSG : "",
      original_price: template.price,
      currency: "CNY",
      internal_supplier_reference: {
        supplier_name: "internal_air",
        supplier_id: `flt-${fromId}-${destId}-${index}`,
        supplier_price: template.price,
        currency: "CNY",
        mock: true,
        route_type: isDirect ? "direct" : "connecting"
      }
    };
  }

  function search(fromInput, toInput, options) {
    const fromId = options?.from_city_id ||
      window.TRAVEL_CITIES?.normalizeCity?.(fromInput) || "ulanbaatar";
    const toId = options?.city_id || window.TRAVEL_CITIES?.normalizeCity?.(toInput);
    const { destId, countryId } = resolveDest(fromId, toId, toInput);

    const fromMn = cityLabel(fromId);
    const destMn = cityLabel(destId);
    const destCountryName = destDisplayName(destId, countryId);

    const meta = {
      fromId,
      toId: destId,
      countryId,
      has_direct: false,
      no_direct_message: "",
      section_title: "",
      travel_date: options?.date || null
    };

    if (needsConnecting(fromId, destId, countryId)) {
      const hubs = connectingHubs(destId);
      meta.has_direct = false;
      meta.no_direct_message =
        `Энэ хугацаанд Улаанбаатараас ${destCountryName} руу шууд нислэгийн мэдээлэл олдсонгүй.`;
      meta.section_title = "Боломжит дамжин нислэгүүд";
      const ctx = { fromId, destId, fromMn, destMn };
      const results = hubs.map((t, i) => buildFlightRecord(t, ctx, i));
      return { results, meta };
    }

    const templates = DIRECT_TEMPLATES[destId] || DEFAULT_CHINA_DIRECT;
    meta.has_direct = true;
    meta.section_title = "Шууд нислэгүүд";
    const ctx = { fromId, destId, fromMn, destMn };
    const results = templates.map((t, i) =>
      buildFlightRecord({ ...t, is_direct: true, transfer_city: null }, ctx, i)
    );
    return { results, meta };
  }

  function aiConsultantMessage(destId, countryId) {
    const name = destDisplayName(destId, countryId);
    if (needsConnecting("ulanbaatar", destId, countryId)) {
      return (
        `Таны сонгосон хугацаанд шууд нислэг харагдахгүй байна. Харин Бээжин, Сөүл, Хонконг эсвэл Гуанжоугаар дамжих хувилбарууд илүү бодитой. Би танд хамгийн ойр, боломжит хувилбаруудыг санал болголоо.`
      );
    }
    return `Улаанбаатар–${cityLabel(destId)} чиглэлд шууд нислэгийн боломж байж болно. Гэхдээ үнэ, суудал захиалга хийх үед дахин шалгагдана.`;
  }

  return {
    search,
    hasDirectRoute,
    needsConnecting,
    aiConsultantMessage,
    NEEDS_CHECK_MSG
  };
});
