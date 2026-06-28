/**
 * Ground transport routes — source-based records (no invented train numbers)
 */
(function () {
  const NEEDS_CHECK_MSG = "Цаг, үнэ өөрчлөгдөж болзошгүй. Захиалга хийх үед дахин шалгана.";

  /** @type {Record<string, object[]>} */
  const ROUTES = {
    "erenhot-beijing": [
      {
        id: "erenhot-beijing-bus-1400",
        from_city_id: "erenhot",
        to_city_id: "beijing",
        transport_type: "bus",
        route_category: "bus",
        departure_time: "14:00",
        arrival_time: null,
        duration: "10ц 30мин",
        duration_note: "ойролцоогоор",
        transfer_required: false,
        transfer_city: null,
        transfer_city_id: null,
        price_cny_min: 220,
        price_cny_max: 220,
        seat_class_note: "Сул суудал",
        source_name: "ChinaBusGuide",
        source_url: "https://www.chinabusguide.com/erlian-to-beijing-bus.html",
        last_checked_at: "2026-06-27",
        confidence: "needs_check",
        notes_mn: "Эрээн (Erlian) зогсоолын өдөр тутмын автобус. Хилийн бүртгэл, цаг өөрчлөгдөж болно."
      },
      {
        id: "erenhot-beijing-bus-1500",
        from_city_id: "erenhot",
        to_city_id: "beijing",
        transport_type: "bus",
        route_category: "bus",
        departure_time: "15:00",
        arrival_time: null,
        duration: "10ц 30мин",
        duration_note: "ойролцоогоор",
        transfer_required: false,
        transfer_city: null,
        transfer_city_id: null,
        price_cny_min: 220,
        price_cny_max: 220,
        seat_class_note: "Сул суудал",
        source_name: "ChinaBusGuide",
        source_url: "https://www.chinabusguide.com/erlian-to-beijing-bus.html",
        last_checked_at: "2026-06-27",
        confidence: "needs_check",
        notes_mn: "Хоёр дахь өдрийн автобусын цаг (эх сурвалжийн мэдээлэл)."
      },
      {
        id: "erenhot-beijing-train-via-hohhot",
        from_city_id: "erenhot",
        to_city_id: "beijing",
        transport_type: "train",
        route_category: "transfer",
        departure_time: null,
        departure_note: "Эрээн → Хөх хот → Бээжин (12306 цаг шалгах)",
        arrival_time: null,
        duration: "9–12 цаг",
        duration_note: "маршрутаас хамаарна",
        transfer_required: true,
        transfer_city: "Хөх хот",
        transfer_city_id: "hohhot",
        price_cny_min: 328,
        price_cny_max: 950,
        seat_class_note: "2-р зэрэг / хэвтээ / D·G дамжин",
        source_name: "Rome2Rio / TravelChinaGuide / 12306",
        source_url: "https://www.rome2rio.com/s/Erenhot/Beijing",
        last_checked_at: "2026-06-27",
        confidence: "needs_check",
        notes_mn: "Шууд тогтмол галт тэрэг байхгүй. Хөх хотоор дамжин өндөр хурдны эсвэл энгийн галт тэрэгээр үргэлжлүүлнэ."
      },
      {
        id: "erenhot-beijing-train-via-ulanqab",
        from_city_id: "erenhot",
        to_city_id: "beijing",
        transport_type: "train",
        route_category: "transfer",
        departure_time: null,
        departure_note: "Эрээн → Уланхаб (Jining) → Бээжин (12306 цаг шалгах)",
        arrival_time: null,
        duration: "9–12 цаг",
        duration_note: "маршрутаас хамаарна",
        transfer_required: true,
        transfer_city: "Уланхаб (Jining)",
        transfer_city_id: null,
        price_cny_min: 328,
        price_cny_max: 950,
        seat_class_note: "2-р зэрэг / хэвтээ / D·G дамжин",
        source_name: "Rome2Rio / TravelChinaGuide / 12306",
        source_url: "https://www.travelchinaguide.com/china-trains/",
        last_checked_at: "2026-06-27",
        confidence: "needs_check",
        notes_mn: "Уланхаб (Inner Mongolia) дамжих хувилбар. Бодит цагийг 12306 эсвэл өндөр хурдны буудлаас шалгана."
      }
    ],
    "hohhot-beijing": [
      {
        id: "hohhot-beijing-hsr-direct",
        from_city_id: "hohhot",
        to_city_id: "beijing",
        transport_type: "train",
        route_category: "direct",
        departure_time: null,
        departure_note: "Өдөрт олон D/G цуврал (12306)",
        arrival_time: null,
        duration: "1ц 50мин – 2ц",
        transfer_required: false,
        transfer_city: null,
        transfer_city_id: null,
        price_cny_min: 187,
        price_cny_max: 298,
        seat_class_note: "2-р зэрэг / 1-р зэрэг",
        source_name: "12306.cn",
        source_url: "https://www.12306.cn",
        last_checked_at: "2026-06-27",
        confidence: "needs_check",
        notes_mn: "Хөх хот — Бээжин өндөр хурдны шууд чиглэл. Тодорхой цувралын дугаар, цагийг 12306-аас шалгана."
      },
      {
        id: "hohhot-beijing-sleeper",
        from_city_id: "hohhot",
        to_city_id: "beijing",
        transport_type: "train",
        route_category: "direct",
        departure_time: null,
        departure_note: "Оройн хэвтээ цуврал (12306)",
        arrival_time: null,
        duration: "4–5 цаг",
        transfer_required: false,
        transfer_city: null,
        transfer_city_id: null,
        price_cny_min: 200,
        price_cny_max: 280,
        seat_class_note: "Хэвтээ вагон",
        source_name: "12306.cn",
        source_url: "https://www.12306.cn",
        last_checked_at: "2026-06-27",
        confidence: "needs_check",
        notes_mn: "Шөнийн/оройн энгийн галт тэрэгийн хувилбар. Цувралын дугаар заагдаагүй."
      }
    ],
    "beijing-shanghai": [
      {
        id: "beijing-shanghai-hsr",
        from_city_id: "beijing",
        to_city_id: "shanghai",
        transport_type: "train",
        route_category: "direct",
        departure_time: null,
        departure_note: "Өдөрт олон G цуврал (12306)",
        arrival_time: null,
        duration: "4ц 18мин – 6ц",
        transfer_required: false,
        transfer_city: null,
        transfer_city_id: null,
        price_cny_min: 553,
        price_cny_max: 933,
        seat_class_note: "2-р зэрэг / 1-р зэрэг / бизнес",
        source_name: "12306.cn",
        source_url: "https://www.12306.cn",
        last_checked_at: "2026-06-27",
        confidence: "needs_check",
        notes_mn: "Бээжин Нан — Шанхай Хунцяо өндөр хурдны шууд чиглэл."
      }
    ],
    "beijing-guangzhou": [
      {
        id: "beijing-guangzhou-hsr",
        from_city_id: "beijing",
        to_city_id: "guangzhou",
        transport_type: "train",
        route_category: "direct",
        departure_time: null,
        departure_note: "Өдөрт G цуврал (12306)",
        arrival_time: null,
        duration: "7ц 50мин – 9ц",
        transfer_required: false,
        transfer_city: null,
        transfer_city_id: null,
        price_cny_min: 862,
        price_cny_max: 1380,
        seat_class_note: "2-р зэрэг / 1-р зэрэг",
        source_name: "12306.cn",
        source_url: "https://www.12306.cn",
        last_checked_at: "2026-06-27",
        confidence: "needs_check",
        notes_mn: "Бээжин — Гуанжоу өндөр хурдны шууд чиглэл."
      }
    ],
    "guangzhou-shenzhen": [
      {
        id: "guangzhou-shenzhen-hsr",
        from_city_id: "guangzhou",
        to_city_id: "shenzhen",
        transport_type: "train",
        route_category: "direct",
        departure_time: null,
        departure_note: "Өдөрт олон C/D/G (12306)",
        arrival_time: null,
        duration: "30–45 мин",
        transfer_required: false,
        transfer_city: null,
        transfer_city_id: null,
        price_cny_min: 75,
        price_cny_max: 100,
        seat_class_note: "2-р зэрэг / 1-р зэрэг",
        source_name: "12306.cn",
        source_url: "https://www.12306.cn",
        last_checked_at: "2026-06-27",
        confidence: "needs_check",
        notes_mn: "Гуанжоу Нан — Шэньжэнь өндөр хурдны ойрын чиглэл."
      }
    ],
    "xian-beijing": [
      {
        id: "xian-beijing-hsr",
        from_city_id: "xian",
        to_city_id: "beijing",
        transport_type: "train",
        route_category: "direct",
        departure_time: null,
        departure_note: "Өдөрт G цуврал (12306)",
        arrival_time: null,
        duration: "4ц 30мин – 5ц 30мин",
        transfer_required: false,
        transfer_city: null,
        transfer_city_id: null,
        price_cny_min: 515,
        price_cny_max: 824,
        seat_class_note: "2-р зэрэг / 1-р зэрэг",
        source_name: "12306.cn",
        source_url: "https://www.12306.cn",
        last_checked_at: "2026-06-27",
        confidence: "needs_check",
        notes_mn: "Сиань Бэй — Бээжин өндөр хурдны шууд чиглэл."
      }
    ]
  };

  function routeKey(fromId, toId) {
    return `${fromId}-${toId}`;
  }

  function buildRecord(raw, index) {
    const fromId = raw.from_city_id;
    const toId = raw.to_city_id;
    const fromMn = window.TRAVEL_CITIES?.getCityLabelMn(fromId) || fromId;
    const toMn = window.TRAVEL_CITIES?.getCityLabelMn(toId) || toId;
    return {
      type: "transport",
      id: raw.id || `transport-${routeKey(fromId, toId)}-${index}`,
      from_city_id: fromId,
      to_city_id: toId,
      from_city: fromMn,
      to_city: toMn,
      country_id: window.TRAVEL_CITIES?.getCity(fromId)?.country_id || "china",
      transport_type: raw.transport_type,
      route_category: raw.route_category,
      departure_time: raw.departure_time || null,
      departure_note: raw.departure_note || null,
      arrival_time: raw.arrival_time || null,
      duration: raw.duration,
      duration_note: raw.duration_note || null,
      transfer_required: Boolean(raw.transfer_required),
      transfer_city: raw.transfer_city || null,
      transfer_city_id: raw.transfer_city_id || null,
      price_cny_min: raw.price_cny_min,
      price_cny_max: raw.price_cny_max ?? raw.price_cny_min,
      seat_class_note: raw.seat_class_note || null,
      source_name: raw.source_name,
      source_url: raw.source_url,
      last_checked_at: raw.last_checked_at,
      confidence: raw.confidence || "needs_check",
      notes_mn: raw.notes_mn || null,
      currency: "CNY",
      original_price: raw.price_cny_min,
      needs_check_message: raw.confidence === "verified" ? null : NEEDS_CHECK_MSG,
      internal_supplier_reference: {
        source: raw.source_name,
        route_id: raw.id,
        price_cny_min: raw.price_cny_min,
        price_cny_max: raw.price_cny_max,
        last_checked_at: raw.last_checked_at,
        confidence: raw.confidence
      }
    };
  }

  function search(fromInput, toInput) {
    const fromId = window.TRAVEL_CITIES?.normalizeCity(fromInput);
    const toId = window.TRAVEL_CITIES?.normalizeCity(toInput);
    if (!fromId || !toId || fromId === toId) {
      return { routeKey: null, fromId, toId, results: [] };
    }
    const key = routeKey(fromId, toId);
    const rows = ROUTES[key] || [];
    const results = rows.map((r, i) => buildRecord(r, i));
    return { routeKey: key, fromId, toId, results };
  }

  function listRoutes() {
    return Object.keys(ROUTES);
  }

  window.TRANSPORT_ROUTES = {
    NEEDS_CHECK_MSG,
    ROUTES,
    search,
    listRoutes,
    buildRecord
  };
})();
