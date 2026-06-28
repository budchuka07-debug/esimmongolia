/**
 * Admin CMS data store — localStorage now, Supabase esm_* tables later.
 * Never use BookingMongolia table names. Customer APIs must not expose supplier/markup.
 */
(function (root) {
  const STORAGE_KEY = "esim_mn_admin_cms_v1";

  function uid(prefix) {
    return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function defaultSettings() {
    return {
      hotel_markup_percent: 15,
      flight_markup_percent: 15,
      train_markup_percent: 15,
      bus_markup_percent: 15,
      attraction_markup_percent: 15,
      rental_markup_percent: 15,
      insurance_markup_percent: 15,
      esim_markup_percent: 30
    };
  }

  function seedCountries() {
    const list = [
      { iso_code: "CN", flag: "🇨🇳", name_mn: "Хятад", name_en: "China", name_local: "中国", currency: "CNY", language: "zh", timezone: "Asia/Shanghai", visa_summary_mn: "L-виз, 30 хоног хүртэл жуулчлалын виз боломжтой.", active: true },
      { iso_code: "TH", flag: "🇹🇭", name_mn: "Тайланд", name_en: "Thailand", name_local: "ประเทศไทย", currency: "THB", language: "th", timezone: "Asia/Bangkok", visa_summary_mn: "Монгол иргэнд 30 хоног визгүй.", active: true },
      { iso_code: "VN", flag: "🇻🇳", name_mn: "Вьетнам", name_en: "Vietnam", name_local: "Việt Nam", currency: "VND", language: "vi", timezone: "Asia/Ho_Chi_Minh", visa_summary_mn: "E-visa эсвэл визгүй богино хугацаа.", active: true },
      { iso_code: "JP", flag: "🇯🇵", name_mn: "Япон", name_en: "Japan", name_local: "日本", currency: "JPY", language: "ja", timezone: "Asia/Tokyo", visa_summary_mn: "Виз шаардлагатай — элчин сайдын яамнаас лавлана.", active: true },
      { iso_code: "KR", flag: "🇰🇷", name_mn: "Солонгос", name_en: "South Korea", name_local: "대한민국", currency: "KRW", language: "ko", timezone: "Asia/Seoul", visa_summary_mn: "K-ETA эсвэл виз.", active: true },
      { iso_code: "MY", flag: "🇲🇾", name_mn: "Малайз", name_en: "Malaysia", name_local: "Malaysia", currency: "MYR", language: "ms", timezone: "Asia/Kuala_Lumpur", visa_summary_mn: "90 хоног хүртэл визгүй.", active: true },
      { iso_code: "SG", flag: "🇸🇬", name_mn: "Сингапур", name_en: "Singapore", name_local: "Singapore", currency: "SGD", language: "en", timezone: "Asia/Singapore", visa_summary_mn: "30 хоног визгүй.", active: true },
      { iso_code: "ID", flag: "🇮🇩", name_mn: "Индонез", name_en: "Indonesia", name_local: "Indonesia", currency: "IDR", language: "id", timezone: "Asia/Jakarta", visa_summary_mn: "VOA эсвэл e-VOA.", active: true },
      { iso_code: "AE", flag: "🇦🇪", name_mn: "АНЭУ", name_en: "United Arab Emirates", name_local: "الإمارات", currency: "AED", language: "ar", timezone: "Asia/Dubai", visa_summary_mn: "30 хоног визгүй.", active: true },
      { iso_code: "TR", flag: "🇹🇷", name_mn: "Турк", name_en: "Turkey", name_local: "Türkiye", currency: "TRY", language: "tr", timezone: "Europe/Istanbul", visa_summary_mn: "E-visa боломжтой.", active: true }
    ];
    return list.map((c) => ({ id: uid("cty"), ...c }));
  }

  function seedCities(countries) {
    const byIso = (iso) => countries.find((c) => c.iso_code === iso)?.id;
    const cn = byIso("CN");
    const th = byIso("TH");
    const vn = byIso("VN");

    const china = [
      { name_mn: "Бээжин", name_en: "Beijing", name_local: "北京", aliases: ["Beijing", "Peking", "PEK", "PKX"], province: "Beijing", airport_codes: ["PEK", "PKX"], railway_stations: ["北京站", "北京西站"], lat: 39.9042, lng: 116.4074, popular: true },
      { name_mn: "Шанхай", name_en: "Shanghai", name_local: "上海", aliases: ["Shanghai", "PVG", "SHA"], province: "Shanghai", airport_codes: ["PVG", "SHA"], railway_stations: ["上海虹桥", "上海站"], lat: 31.2304, lng: 121.4737, popular: true },
      { name_mn: "Хөх хот", name_en: "Hohhot", name_local: "呼和浩特", aliases: ["Hohhot", "Huhehaote", "HET"], province: "Inner Mongolia", airport_codes: ["HET"], railway_stations: ["呼和浩特站"], lat: 40.8424, lng: 111.7519, popular: true },
      { name_mn: "Гуанжоу", name_en: "Guangzhou", name_local: "广州", aliases: ["Guangzhou", "Canton", "CAN"], province: "Guangdong", airport_codes: ["CAN"], railway_stations: ["广州南站"], lat: 23.1291, lng: 113.2644, popular: true },
      { name_mn: "Шэньжэнь", name_en: "Shenzhen", name_local: "深圳", aliases: ["Shenzhen", "SZX"], province: "Guangdong", airport_codes: ["SZX"], railway_stations: ["深圳北站"], lat: 22.5431, lng: 114.0579, popular: true },
      { name_mn: "Чэндү", name_en: "Chengdu", name_local: "成都", aliases: ["Chengdu", "CTU"], province: "Sichuan", airport_codes: ["CTU"], railway_stations: ["成都东站"], lat: 30.5728, lng: 104.0668, popular: false },
      { name_mn: "Харбин", name_en: "Harbin", name_local: "哈尔滨", aliases: ["Harbin", "HRB"], province: "Heilongjiang", airport_codes: ["HRB"], railway_stations: ["哈尔滨西站"], lat: 45.8038, lng: 126.535, popular: false },
      { name_mn: "Сиань", name_en: "Xi'an", name_local: "西安", aliases: ["Xian", "Xi'an", "XIY"], province: "Shaanxi", airport_codes: ["XIY"], railway_stations: ["西安北站"], lat: 34.3416, lng: 108.9398, popular: false },
      { name_mn: "Иву", name_en: "Yiwu", name_local: "义乌", aliases: ["Yiwu", "YIW"], province: "Zhejiang", airport_codes: ["YIW"], railway_stations: ["义乌站"], lat: 29.3068, lng: 120.0751, popular: false },
      { name_mn: "Далиан", name_en: "Dalian", name_local: "大连", aliases: ["Dalian", "DLC"], province: "Liaoning", airport_codes: ["DLC"], railway_stations: ["大连站"], lat: 38.914, lng: 121.6147, popular: false },
      { name_mn: "Чанша", name_en: "Changsha", name_local: "长沙", aliases: ["Changsha", "CSX"], province: "Hunan", airport_codes: ["CSX"], railway_stations: ["长沙南站"], lat: 28.2282, lng: 112.9388, popular: false }
    ].map((c) => ({ id: uid("city"), country_id: cn, cover_image_url: "", active: true, ...c }));

    const thailand = [
      { name_mn: "Бангкок", name_en: "Bangkok", name_local: "กรุงเทพ", aliases: ["Bangkok", "BKK"], province: "Bangkok", airport_codes: ["BKK", "DMK"], railway_stations: ["Hua Lamphong"], lat: 13.7563, lng: 100.5018, popular: true },
      { name_mn: "Паттайя", name_en: "Pattaya", name_local: "พัทยา", aliases: ["Pattaya", "UTP"], province: "Chonburi", airport_codes: ["UTP"], railway_stations: [], lat: 12.9236, lng: 100.8825, popular: true },
      { name_mn: "Пхукет", name_en: "Phuket", name_local: "ภูเก็ต", aliases: ["Phuket", "HKT"], province: "Phuket", airport_codes: ["HKT"], railway_stations: [], lat: 7.8804, lng: 98.3923, popular: true },
      { name_mn: "Чианг Май", name_en: "Chiang Mai", name_local: "เชียงใหม่", aliases: ["Chiang Mai", "CNX"], province: "Chiang Mai", airport_codes: ["CNX"], railway_stations: ["Chiang Mai"], lat: 18.7883, lng: 98.9853, popular: true },
      { name_mn: "Краби", name_en: "Krabi", name_local: "กระบี่", aliases: ["Krabi", "KBV"], province: "Krabi", airport_codes: ["KBV"], railway_stations: [], lat: 8.0863, lng: 98.9063, popular: false }
    ].map((c) => ({ id: uid("city"), country_id: th, cover_image_url: "", active: true, ...c }));

    const vietnam = [
      { name_mn: "Дананг", name_en: "Da Nang", name_local: "Đà Nẵng", aliases: ["Da Nang", "Danang", "DAD"], province: "Da Nang", airport_codes: ["DAD"], railway_stations: ["Da Nang"], lat: 16.0544, lng: 108.2022, popular: true },
      { name_mn: "Вунг Тау", name_en: "Vung Tau", name_local: "Vũng Tàu", aliases: ["Vung Tau", "VTG"], province: "Ba Ria-Vung Tau", airport_codes: [], railway_stations: [], lat: 10.346, lng: 107.0843, popular: false },
      { name_mn: "Хошимин", name_en: "Ho Chi Minh City", name_local: "TP. Hồ Chí Minh", aliases: ["Ho Chi Minh", "Saigon", "SGN", "HCMC"], province: "Ho Chi Minh", airport_codes: ["SGN"], railway_stations: ["Saigon"], lat: 10.8231, lng: 106.6297, popular: true },
      { name_mn: "Ханой", name_en: "Hanoi", name_local: "Hà Nội", aliases: ["Hanoi", "HAN"], province: "Hanoi", airport_codes: ["HAN"], railway_stations: ["Hanoi"], lat: 21.0285, lng: 105.8542, popular: true },
      { name_mn: "Нячанг", name_en: "Nha Trang", name_local: "Nha Trang", aliases: ["Nha Trang", "CXR"], province: "Khanh Hoa", airport_codes: ["CXR"], railway_stations: ["Nha Trang"], lat: 12.2388, lng: 109.1967, popular: true }
    ].map((c) => ({ id: uid("city"), country_id: vn, cover_image_url: "", active: true, ...c }));

    return [...china, ...thailand, ...vietnam];
  }

  function seedHotels(countries, cities) {
    const beijing = cities.find((c) => c.name_en === "Beijing");
    const shanghai = cities.find((c) => c.name_en === "Shanghai");
    const hohhot = cities.find((c) => c.name_en === "Hohhot");
    const cn = countries.find((c) => c.iso_code === "CN")?.id;
    if (!beijing || !shanghai || !hohhot) return [];

    return [
      {
        id: uid("htl"),
        country_id: cn,
        city_id: beijing.id,
        official_name: "Beijing Grand Hotel",
        name_mn_optional: "Бээжин их буудал",
        stars: 5,
        district: "Dongcheng",
        area_name: "Wangfujing",
        address: "Wangfujing St, Beijing",
        latitude: 39.9142,
        longitude: 116.4174,
        description_mn: "Төв байрлал, метрон ойрхон 5 одтой буудал.",
        cover_image_url: "",
        gallery_image_urls: [],
        room_image_urls: [],
        amenities: ["wifi", "breakfast", "gym", "metro_nearby"],
        nearby_metro: "Wangfujing Station",
        nearby_landmarks: ["Forbidden City", "Tiananmen"],
        final_price_mnt: 485000,
        active: true,
        supplier_reference: {
          supplier_name: "Trip.com",
          supplier_url: "https://www.trip.com/hotels/beijing",
          supplier_hotel_id: "DEMO-BJ-001",
          supplier_price: 980,
          supplier_currency: "CNY",
          markup_percent: 15,
          internal_notes: "Seed data — шалгах шаардлагатай",
          last_checked_at: new Date().toISOString().slice(0, 10)
        }
      },
      {
        id: uid("htl"),
        country_id: cn,
        city_id: shanghai.id,
        official_name: "Shanghai Bund View Hotel",
        name_mn_optional: "Шанхай Bund буудал",
        stars: 4,
        district: "Huangpu",
        area_name: "The Bund",
        address: "Zhongshan East Rd, Shanghai",
        latitude: 31.2397,
        longitude: 121.4912,
        description_mn: "Bund алсыг харах 4 одтой буудал.",
        cover_image_url: "",
        gallery_image_urls: [],
        room_image_urls: [],
        amenities: ["wifi", "river_view"],
        nearby_metro: "East Nanjing Road",
        nearby_landmarks: ["The Bund", "Yu Garden"],
        final_price_mnt: 420000,
        active: true,
        supplier_reference: {
          supplier_name: "Ctrip",
          supplier_url: "https://hotels.ctrip.com/shanghai",
          supplier_hotel_id: "DEMO-SH-002",
          supplier_price: 850,
          supplier_currency: "CNY",
          markup_percent: 15,
          internal_notes: "",
          last_checked_at: null
        }
      },
      {
        id: uid("htl"),
        country_id: cn,
        city_id: hohhot.id,
        official_name: "Hohhot Central Hotel",
        name_mn_optional: "Хөх хот төв буудал",
        stars: 4,
        district: "Xincheng",
        area_name: "City Center",
        address: "Xinhua East St, Hohhot",
        latitude: 40.8183,
        longitude: 111.6601,
        description_mn: "Хөх хотын төвд байрлах 4 одтой буудал.",
        cover_image_url: "",
        gallery_image_urls: [],
        room_image_urls: [],
        amenities: ["wifi", "parking"],
        nearby_metro: "",
        nearby_landmarks: ["Dazhao Temple"],
        final_price_mnt: 285000,
        active: true,
        supplier_reference: {
          supplier_name: "Local Agent",
          supplier_url: "https://example.com/hohhot-hotel",
          supplier_hotel_id: "HH-003",
          supplier_price: 520,
          supplier_currency: "CNY",
          markup_percent: 15,
          internal_notes: "Hohhot supplier channel",
          last_checked_at: new Date().toISOString().slice(0, 10)
        }
      }
    ];
  }

  function seedHotelRooms(hotels) {
    const rooms = [];
    hotels.forEach((h) => {
      rooms.push({
        id: uid("rm"),
        hotel_id: h.id,
        room_name: "Standard Double",
        room_type: "standard",
        capacity: 2,
        beds: "1 queen",
        breakfast_included: true,
        free_cancel: true,
        final_price_mnt: h.final_price_mnt,
        room_image_urls: h.room_image_urls || [],
        active: true
      });
      rooms.push({
        id: uid("rm"),
        hotel_id: h.id,
        room_name: "Deluxe Twin",
        room_type: "deluxe",
        capacity: 2,
        beds: "2 single",
        breakfast_included: true,
        free_cancel: false,
        final_price_mnt: Math.round(h.final_price_mnt * 1.2),
        room_image_urls: h.room_image_urls || [],
        active: true
      });
    });
    return rooms;
  }

  function seedBookings(cities, hotels) {
    const beijing = cities.find((c) => c.name_en === "Beijing");
    const hotel = hotels[0];
    if (!beijing || !hotel) return [];
    return [
      {
        id: uid("bk"),
        orderId: "DEMO-2026-001",
        status: "new",
        service_type: "hotel",
        customer: { name: "Батбаяр", phone: "+976 99112233", email: "demo@example.com" },
        destination: beijing.name_mn,
        destination_city_id: beijing.id,
        date: "2026-07-15",
        guests: 2,
        selected_item: hotel.official_name,
        hotel_id: hotel.id,
        final_price_mnt: hotel.final_price_mnt,
        supplier: {
          supplier_name: hotel.supplier_reference?.supplier_name,
          supplier_url: hotel.supplier_reference?.supplier_url,
          supplier_id: hotel.supplier_reference?.supplier_hotel_id,
          supplier_price: hotel.supplier_reference?.supplier_price,
          currency: hotel.supplier_reference?.supplier_currency,
          markup_percent: hotel.supplier_reference?.markup_percent,
          profit_mnt: Math.round(hotel.final_price_mnt * 0.13)
        },
        voucher_url: "",
        internal_notes: "",
        created_at: new Date().toISOString()
      }
    ];
  }

  function seedAiKnowledge(cities, countries) {
    const beijing = cities.find((c) => c.name_en === "Beijing");
    const cn = countries.find((c) => c.iso_code === "CN");
    if (!beijing || !cn) return [];
    return [
      {
        id: uid("ai"),
        country_id: cn.id,
        city_id: beijing.id,
        topic: "metro",
        title_mn: "Бээжингийн метро ашиглах",
        content_mn: "Yikatong карт эсвэл Alipay/WeChat Pay-ээр төлнө. Өглөө 7-9 цаг их ачаалалтай.",
        tags: ["metro", "beijing", "transport"],
        active: true
      },
      {
        id: uid("ai"),
        country_id: cn.id,
        city_id: beijing.id,
        topic: "visa",
        title_mn: "Хятад руу визийн товч мэдээлэл",
        content_mn: "L-виз жуулчлалын зорилгоор. Паспорт 6 сараас дээш хүчинтэй байх.",
        tags: ["visa", "china"],
        active: true
      }
    ];
  }

  function seedFlights(cities) {
    const ub = { id: uid("city"), country_id: null, name_mn: "Улаанбаатар", name_en: "Ulaanbaatar", name_local: "Ulaanbaatar", aliases: ["UB", "UBN"], airport_codes: ["UBN"], active: true };
    const beijing = cities.find((c) => c.name_en === "Beijing");
    const shanghai = cities.find((c) => c.name_en === "Shanghai");
    if (!beijing || !shanghai) return { flights: [], ubCity: null };
    return {
      ubCity: ub,
      flights: [
        {
          id: uid("flt"),
          from_city_id: ub.id,
          to_city_id: beijing.id,
          airline: "MIAT",
          route_type: "direct",
          transfer_city_id: null,
          departure_time: "08:30",
          arrival_time: "10:45",
          duration: "2h 15m",
          baggage_note_mn: "23kg багтаамж",
          final_price_mnt: 1850000,
          data_confidence: "high",
          supplier_reference: { supplier_name: "Amadeus", supplier_url: "", supplier_id: "FLT-UB-PEK", supplier_price: 420, currency: "USD", markup_percent: 15 },
          active: true
        },
        {
          id: uid("flt"),
          from_city_id: ub.id,
          to_city_id: shanghai.id,
          airline: "Air China",
          route_type: "transfer",
          transfer_city_id: beijing.id,
          departure_time: "06:00",
          arrival_time: "14:30",
          duration: "8h 30m",
          baggage_note_mn: "20kg багтаамж",
          final_price_mnt: 2100000,
          data_confidence: "medium",
          supplier_reference: { supplier_name: "Skyscanner", supplier_url: "", supplier_id: "FLT-UB-SHA-VIA", supplier_price: 480, currency: "USD", markup_percent: 15 },
          active: true
        }
      ]
    };
  }

  function seedTrains(cities) {
    const beijing = cities.find((c) => c.name_en === "Beijing");
    const shanghai = cities.find((c) => c.name_en === "Shanghai");
    const hohhot = cities.find((c) => c.name_en === "Hohhot");
    if (!beijing || !shanghai || !hohhot) return [];
    return [
      {
        id: uid("trn"),
        from_city_id: beijing.id,
        to_city_id: shanghai.id,
        transfer_city_id: null,
        train_no: "G1",
        duration: "4h 28m",
        final_price_mnt_from: 185000,
        class_prices: {
          second_class: 185000,
          first_class: 295000,
          business_class: 420000
        },
        data_confidence: "high",
        source_name: "12306",
        source_url: "https://www.12306.cn",
        last_checked_at: new Date().toISOString().slice(0, 10),
        active: true
      },
      {
        id: uid("trn"),
        from_city_id: hohhot.id,
        to_city_id: beijing.id,
        transfer_city_id: null,
        train_no: "D6752",
        duration: "2h 15m",
        final_price_mnt_from: 95000,
        class_prices: {
          second_class: 95000,
          first_class: 152000,
          hard_seat: 65000,
          soft_seat: 78000
        },
        data_confidence: "medium",
        source_name: "12306",
        source_url: "https://www.12306.cn",
        last_checked_at: null,
        active: true
      }
    ];
  }

  function seedInsurance() {
    return [
      {
        id: uid("ins"),
        company_name: "MSIG",
        product_name: "Asia Travel Basic",
        coverage_mn: "Эмнэлэг, осол даатгал 50,000 USD хүртэл",
        destination_region: "Asia",
        days_min: 1,
        days_max: 30,
        final_price_mnt: 45000,
        supplier_reference: { supplier_name: "MSIG Partner", supplier_url: "", supplier_id: "MSIG-ASIA-30", supplier_price: 28, currency: "USD", markup_percent: 15 },
        active: true
      }
    ];
  }

  function seedRentals(cities, countries) {
    const danang = cities.find((c) => c.name_en === "Da Nang");
    const vn = countries.find((c) => c.iso_code === "VN");
    if (!danang || !vn) return [];
    return [
      {
        id: uid("rent"),
        country_id: vn.id,
        city_id: danang.id,
        area: "My Khe Beach",
        property_type: "apartment",
        bedrooms: 2,
        monthly_price_usd: 650,
        monthly_price_mnt: 2250000,
        deposit_info_mn: "1 сарын түрээс + 500 USD барьцаа",
        utilities_info_mn: "Цахилгаан тусад нь (~80 USD)",
        internet_info_mn: "Fiber 100Mbps орсон",
        distance_to_beach: "300m",
        distance_to_center: "4km",
        cover_image_url: "",
        gallery_image_urls: [],
        amenities: ["wifi", "pool", "gym", "parking"],
        description_mn: "Далайн эрэг ойрхон 2 өрөөт орон сууц.",
        min_stay_months: 1,
        suitable_for: ["digital_nomad", "family", "long_stay"],
        supplier_reference: { supplier_name: "Local Agent", supplier_url: "", supplier_id: "DN-APT-01", supplier_price: 520, currency: "USD", markup_percent: 15 },
        active: true
      }
    ];
  }

  function seedAttractions(cities) {
    const beijing = cities.find((c) => c.name_en === "Beijing");
    const shanghai = cities.find((c) => c.name_en === "Shanghai");
    const out = [];
    if (beijing) {
      out.push({
        id: uid("att"),
        city_id: beijing.id,
        name_mn: "Хоригдсон хот",
        name_en: "Forbidden City",
        description_mn: "Мин Юань улсын ордон, Бээжиний гол үзвэр.",
        original_price: 60,
        currency: "CNY",
        final_price_mnt: 42000,
        cover_image_url: "",
        gallery_image_urls: [],
        active: true
      });
    }
    if (shanghai) {
      out.push({
        id: uid("att"),
        city_id: shanghai.id,
        name_mn: "Shanghai Tower",
        name_en: "Shanghai Tower Observatory",
        description_mn: "Хотын өндөр цэгээс харах далайц.",
        original_price: 180,
        currency: "CNY",
        final_price_mnt: 125000,
        cover_image_url: "",
        gallery_image_urls: [],
        active: true
      });
    }
    return out;
  }

  function buildSeed() {
    const countries = seedCountries();
    const cities = seedCities(countries);
    const hotels = seedHotels(countries, cities);
    const hotel_rooms = seedHotelRooms(hotels);
    const flightSeed = seedFlights(cities);
    if (flightSeed.ubCity) cities.push(flightSeed.ubCity);
    return {
      countries,
      cities,
      hotels,
      hotel_rooms,
      flights: flightSeed.flights,
      trains: seedTrains(cities),
      buses: [],
      attractions: seedAttractions(cities),
      esim: [],
      insurance: seedInsurance(),
      rentals: seedRentals(cities, countries),
      ai_knowledge: seedAiKnowledge(cities, countries),
      bookings: seedBookings(cities, hotels),
      users: [],
      settings: defaultSettings(),
      meta: { version: 1, seeded_at: new Date().toISOString() }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) { /* ignore */ }
    const data = buildSeed();
    save(data);
    return data;
  }

  function save(data) {
    data.meta = data.meta || {};
    data.meta.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  function collection(name) {
    const data = load();
    return data[name] || (Array.isArray(data[name]) ? [] : {});
  }

  function getAll(name) {
    return collection(name).slice();
  }

  function getById(name, id) {
    return getAll(name).find((r) => r.id === id) || null;
  }

  function create(name, record) {
    const data = load();
    const row = { id: record.id || uid(name.slice(0, 3)), ...record };
    data[name] = data[name] || [];
    data[name].push(row);
    save(data);
    return row;
  }

  function update(name, id, patch) {
    const data = load();
    const idx = (data[name] || []).findIndex((r) => r.id === id);
    if (idx < 0) return null;
    data[name][idx] = { ...data[name][idx], ...patch, id };
    save(data);
    return data[name][idx];
  }

  function remove(name, id) {
    const data = load();
    data[name] = (data[name] || []).filter((r) => r.id !== id);
    save(data);
  }

  function searchCities(q) {
    const needle = String(q || "").trim().toLowerCase();
    if (!needle) return getAll("cities");
    return getAll("cities").filter((c) => {
      const blob = [
        c.name_mn, c.name_en, c.name_local, c.province,
        ...(c.aliases || []),
        ...(c.airport_codes || []),
        ...(c.railway_stations || [])
      ].join(" ").toLowerCase();
      return blob.includes(needle);
    });
  }

  function findSimilarHotels(hotelId) {
    const hotel = getById("hotels", hotelId);
    if (!hotel) return [];
    const price = hotel.final_price_mnt || 0;
    return getAll("hotels").filter((h) => {
      if (h.id === hotelId || !h.active) return false;
      if (h.city_id !== hotel.city_id) return false;
      const sameStars = h.stars === hotel.stars;
      const similarPrice = Math.abs((h.final_price_mnt || 0) - price) <= price * 0.25;
      return sameStars && similarPrice;
    });
  }

  function computeFinalPrice(supplierPrice, markupPercent, fxRate) {
    const base = Number(supplierPrice || 0) * Number(fxRate || 1);
    const markup = Number(markupPercent || 0) / 100;
    return Math.round(base * (1 + markup));
  }

  function bookingStats() {
    const bookings = getAll("bookings");
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const paidStatuses = ["paid", "booking_in_progress", "voucher_sent", "completed"];
    const todayRevenue = bookings
      .filter((b) => paidStatuses.includes(b.status) && String(b.paid_at || b.date || "").slice(0, 10) === today)
      .reduce((s, b) => s + (b.final_price_mnt || 0), 0);
    const weekRevenue = bookings
      .filter((b) => paidStatuses.includes(b.status) && String(b.paid_at || b.date || "").slice(0, 10) >= weekAgo)
      .reduce((s, b) => s + (b.final_price_mnt || 0), 0);
    return {
      new: bookings.filter((b) => b.status === "new").length,
      checking_availability: bookings.filter((b) => b.status === "checking_availability").length,
      qpay_sent: bookings.filter((b) => b.status === "qpay_sent").length,
      paid: bookings.filter((b) => b.status === "paid").length,
      voucher_sent: bookings.filter((b) => b.status === "voucher_sent").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      today_revenue: todayRevenue,
      week_revenue: weekRevenue
    };
  }

  /** Strip supplier fields for any customer-facing export */
  function toCustomerHotel(hotel) {
    if (!hotel) return null;
    const { supplier_reference, ...safe } = hotel;
    return safe;
  }

  function resetSeed() {
    localStorage.removeItem(STORAGE_KEY);
    return load();
  }

  const AdminStore = {
    STORAGE_KEY,
    load,
    save,
    getAll,
    getById,
    create,
    update,
    remove,
    searchCities,
    findSimilarHotels,
    computeFinalPrice,
    bookingStats,
    toCustomerHotel,
    resetSeed,
    defaultSettings,
    BOOKING_STATUSES: [
      "new", "checking_availability", "available", "sold_out", "alternative_sent",
      "qpay_sent", "paid", "booking_in_progress", "voucher_sent", "completed", "cancelled"
    ],
    AI_TOPICS: [
      "visa", "transport", "metro", "airport", "train", "bus", "insurance", "vaccine",
      "hospital", "payment", "currency", "shopping", "food", "safety", "long_stay",
      "apps", "weather", "faq"
    ],
    TRAIN_CLASSES: [
      "second_class", "first_class", "business_class", "hard_seat", "soft_seat",
      "hard_sleeper", "soft_sleeper", "coupe"
    ]
  };

  root.AdminStore = AdminStore;
})(typeof window !== "undefined" ? window : globalThis);
