/**
 * Hotels catalog for eSIM Mongolia travel platform
 * Supplier-ready mock inventory with city-based search.
 */
(function () {
  const FALLBACK_IMG = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";
  const IMAGE_KEYS = ["exterior", "lobby", "standard_room", "deluxe_room", "bathroom", "restaurant"];

  /** Hotel-themed stock photos (Unsplash) — unique per category, not tourism/landmark shots */
  function u(id, w) {
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w || 800}&q=80`;
  }

  const HOTEL_STOCK = {
    exterior: [
      u("1566073771259-6a8506099945"),
      u("1520250497591-611579863"),
      u("1542314831-068f7765c4cc"),
      u("1582719478250-ef43ee9122b"),
      u("1571896349842-33c89424de2d"),
      u("1445019980597-93fa8acb246c"),
      u("1551882547-cec40c12f77e"),
      u("1566665797767-6aef6ad960ce"),
      u("1610641817119-ca82ad4381e8"),
      u("1523215126519-099995af5603"),
      u("1631049307264-e0a89a3f241a"),
      u("1590490360182-c54684c4e6e2")
    ],
    lobby: [
      u("1618773928811-624fca6d9ef9"),
      u("1564501049412-6130c8a8eb73"),
      u("1584130953409-89a3a9463e5e"),
      u("1555854877-d156778f2b9d"),
      u("1519167758481-83f550bb49b5"),
      u("1566073771259-6a8506099945", 900),
      u("1523215126519-099995af5603", 900),
      u("1578683010236-d716f9a3f461", 900),
      u("1631049307264-e0a89a3f241a", 900),
      u("1596394518453-47c557139016", 900)
    ],
    standard_room: [
      u("1631049307264-e0a89a3f241a"),
      u("1590490360182-c54684c4e6e2"),
      u("1611892440504-1345043067a6"),
      u("1582719478140-0901289a5b71"),
      u("1590071243278-336b5d9b9b82"),
      u("1566665797767-6aef6ad960ce", 900),
      u("1578683010236-d716f9a3f461", 900),
      u("1596394518453-47c557139016", 900),
      u("1618773928811-624fca6d9ef9", 900),
      u("1522771739844-6a9f6d5a14ee", 900)
    ],
    deluxe_room: [
      u("1618773928811-624fca6d9ef9"),
      u("1578683010236-d716f9a3f461"),
      u("1596394518453-47c557139016"),
      u("1522771739844-6a9f6d5a14ee"),
      u("1566665797767-6aef6ad960ce"),
      u("1631049307264-e0a89a3f241a", 900),
      u("1582719478140-0901289a5b71", 900),
      u("1611892440504-1345043067a6", 900),
      u("1590071243278-336b5d9b9b82", 900),
      u("1520250497591-611579863", 900)
    ],
    bathroom: [
      u("1620626011761-996317b78d01"),
      u("1584622652206-4255ef7764d0"),
      u("1552328724-417f8506d4e7"),
      u("1507652310619-8ddc4b4a087a"),
      u("1564540574859-0f6400f2f249"),
      u("1582719478140-0901289a5b71", 700),
      u("1631049307264-e0a89a3f241a", 700),
      u("1590490360182-c54684c4e6e2", 700)
    ],
    restaurant: [
      u("1414235077428-338989a2e8c0"),
      u("1555396273-367ea4eb4db5"),
      u("1517248135467-4c7edcad34c4"),
      u("1559339352-11d035aa65de"),
      u("1424844315991-845022dc0456"),
      u("1566073771259-6a8506099945", 900),
      u("1555854877-d156778f2b9d", 900),
      u("1519167758481-83f550bb49b5", 900)
    ]
  };

  function hashSeed(value) {
    return String(value || "")
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  }

  function assignImages(countryId, cityId, hotelIdx) {
    const seed = hashSeed(`${countryId}:${cityId}:${hotelIdx}`);
    const images = {};
    IMAGE_KEYS.forEach((key, i) => {
      const pool = HOTEL_STOCK[key];
      images[key] = pool[(seed + i * 13 + hotelIdx * 3) % pool.length];
    });
    return images;
  }

  function defaultAmenities(stars, district) {
    const list = ["Free WiFi", "24/7 Front Desk", "Daily Housekeeping", `${district} Area Access`];
    if (stars >= 4) list.push("Fitness Center", "Business Lounge");
    if (stars >= 5) list.push("Airport Transfer", "Executive Lounge");
    return list;
  }

  function defaultRooms(stars) {
    const base = [
      { name: "Standard Twin Room", beds: "2 Single Beds" },
      { name: "Deluxe King Room", beds: "1 King Bed" }
    ];
    if (stars >= 5) base.push({ name: "Executive Suite", beds: "1 King Bed + Living Area" });
    return base;
  }

  function makeSpec(cityMn, payload, idx) {
    const stars = Number(payload.stars || 4);
    const district = payload.district || "City Center";
    const nearby = payload.nearby_attractions || payload.nearby || [];
    const nearTxt = nearby.length ? `${nearby.slice(0, 2).join(", ")} руу ойрхон.` : "";
    const description = payload.description_mn ||
      `${payload.name_en} — ${cityMn} хотын ${district} хэсэгт байрлах ${stars} одтой зочид буудал. ${nearTxt} Аялал, бизнес хоёуланд тохиромжтой байршил, цэвэр өрөө, найдвартай үйлчилгээ.`;
    return {
      name_en: payload.name_en,
      description_mn: description,
      district,
      stars,
      price_per_night: Number(payload.price_per_night),
      metro_distance: payload.metro_distance || `${350 + idx * 70} м`,
      attraction_distance: payload.attraction_distance || `${1.2 + idx * 0.4} км`,
      nearby_attractions: nearby,
      breakfast: payload.breakfast !== false,
      free_cancellation: payload.free_cancellation !== false,
      amenities: payload.amenities || defaultAmenities(stars, district),
      rooms: payload.rooms || defaultRooms(stars)
    };
  }

  function createCitySpecs(cityMn, blueprint) {
    return blueprint.hotels.map((hotel, idx) => makeSpec(cityMn, {
      name_en: hotel.name_en,
      district: hotel.district,
      stars: hotel.stars,
      price_per_night: hotel.price_per_night,
      metro_distance: hotel.metro_distance,
      attraction_distance: hotel.attraction_distance,
      nearby_attractions: hotel.nearby_attractions || blueprint.nearby_attractions,
      breakfast: hotel.breakfast,
      free_cancellation: hotel.free_cancellation,
      description_mn: hotel.description_mn
    }, idx));
  }

  const CITY_BLUEPRINTS = {
    beijing: { city_mn: "Бээжин", nearby_attractions: ["Forbidden City", "Great Wall", "Temple of Heaven"], hotels: [
      { name_en: "Regent Beijing", district: "Wangfujing", stars: 5, price_per_night: 1280, metro_distance: "320 м", attraction_distance: "1.1 км" },
      { name_en: "Holiday Inn Beijing Wangfujing", district: "Dongcheng", stars: 4, price_per_night: 860, metro_distance: "280 м", attraction_distance: "1.4 км", description_mn: "Ванфужин худалдааны бүсэд байрлах, метро болон Тяньаньмэний талбайд ойр тохилог буудал." },
      { name_en: "Novotel Beijing Peace", district: "Jinbao Street", stars: 4, price_per_night: 780, metro_distance: "420 м", attraction_distance: "1.8 км" },
      { name_en: "The Peninsula Beijing", district: "Wangfujing", stars: 5, price_per_night: 1680, metro_distance: "300 м", attraction_distance: "1.2 км" },
      { name_en: "Park Plaza Beijing Wangfujing", district: "Chaoyangmen", stars: 4, price_per_night: 740, metro_distance: "390 м", attraction_distance: "2.1 км" }
    ] },
    shanghai: { city_mn: "Шанхай", nearby_attractions: ["The Bund", "Yu Garden", "Nanjing Road"], hotels: [
      { name_en: "Grand Central Hotel Shanghai", district: "Huangpu", stars: 5, price_per_night: 1180 },
      { name_en: "Radisson Blu Hotel Shanghai New World", district: "People's Square", stars: 5, price_per_night: 1260 },
      { name_en: "Holiday Inn Shanghai Nanjing Road", district: "Nanjing East Road", stars: 4, price_per_night: 880 },
      { name_en: "Courtyard by Marriott Shanghai Central", district: "Jing'an", stars: 4, price_per_night: 920 },
      { name_en: "The Eton Hotel Shanghai", district: "Lujiazui", stars: 4, price_per_night: 860 }
    ] },
    guangzhou: { city_mn: "Гуанжоу", nearby_attractions: ["Canton Tower", "Beijing Road", "Shamian Island"], hotels: [
      { name_en: "Langham Place Guangzhou", district: "Haizhu", stars: 5, price_per_night: 1080 },
      { name_en: "Sofitel Guangzhou Sunrich", district: "Tianhe", stars: 5, price_per_night: 1120 },
      { name_en: "Holiday Inn Guangzhou Shifu", district: "Liwan", stars: 4, price_per_night: 760 },
      { name_en: "Hotel Landmark Canton", district: "Yuexiu", stars: 4, price_per_night: 690 },
      { name_en: "DoubleTree by Hilton Guangzhou", district: "Yuexiu", stars: 5, price_per_night: 980 }
    ] },
    shenzhen: { city_mn: "Шэньжэнь", nearby_attractions: ["Window of the World", "OCT Harbour", "Huaqiangbei"], hotels: [
      { name_en: "Futian Shangri-La Shenzhen", district: "Futian CBD", stars: 5, price_per_night: 1280 },
      { name_en: "Grand Skylight Hotel Shenzhen", district: "Futian", stars: 4, price_per_night: 860 },
      { name_en: "Hyatt Place Shenzhen Dongmen", district: "Luohu", stars: 4, price_per_night: 790 },
      { name_en: "Crowne Plaza Shenzhen Nanshan", district: "Nanshan", stars: 5, price_per_night: 1080 },
      { name_en: "Holiday Inn Express Shenzhen Luohu", district: "Luohu", stars: 3, price_per_night: 620 }
    ] },
    hohhot: { city_mn: "Хөх хот", nearby_attractions: ["Dazhao Temple", "Inner Mongolia Museum", "Saishang Old Street"], hotels: [
      { name_en: "Shangri-La Hohhot", district: "Xincheng", stars: 5, price_per_night: 760 },
      { name_en: "Holiday Inn Hohhot", district: "Saihan", stars: 4, price_per_night: 560 },
      { name_en: "Jinjiang International Hotel Hohhot", district: "Xincheng", stars: 4, price_per_night: 520 },
      { name_en: "Inner Mongolia Hotel", district: "Xincheng", stars: 4, price_per_night: 490 },
      { name_en: "Hampton by Hilton Hohhot Gulou", district: "Huimin", stars: 4, price_per_night: 540 }
    ] },
    chengdu: { city_mn: "Чэнду", nearby_attractions: ["Kuanzhai Alley", "Jinli Street", "Panda Base"], hotels: [
      { name_en: "The Ritz-Carlton Chengdu", district: "Qingyang", stars: 5, price_per_night: 1180 },
      { name_en: "Grand Hyatt Chengdu", district: "Chunxi Road", stars: 5, price_per_night: 1080 },
      { name_en: "Holiday Inn Chengdu Oriental Plaza", district: "Jinjiang", stars: 4, price_per_night: 780 },
      { name_en: "Somerset Riverview Chengdu", district: "Wuhou", stars: 4, price_per_night: 720 },
      { name_en: "Dorsett Chengdu", district: "Luomashi", stars: 4, price_per_night: 650 }
    ] },
    harbin: { city_mn: "Харбин", nearby_attractions: ["Central Street", "Saint Sophia Cathedral", "Ice and Snow World"], hotels: [
      { name_en: "Shangri-La Songbei Harbin", district: "Songbei", stars: 5, price_per_night: 820 },
      { name_en: "Sofitel Harbin", district: "Xiangfang", stars: 5, price_per_night: 780 },
      { name_en: "Holiday Inn City Centre Harbin", district: "Daoli", stars: 4, price_per_night: 620 },
      { name_en: "Mercure Harbin Central Street", district: "Daoli", stars: 4, price_per_night: 560 },
      { name_en: "Wanda Realm Harbin", district: "Nangang", stars: 5, price_per_night: 740 }
    ] },
    xian: { city_mn: "Сиань", nearby_attractions: ["Terracotta Army", "Xi'an City Wall", "Muslim Quarter"], hotels: [
      { name_en: "Sofitel Legend People's Grand Hotel Xian", district: "Xincheng", stars: 5, price_per_night: 1180 },
      { name_en: "Grand Mercure Xian on Renmin Square", district: "Xincheng", stars: 5, price_per_night: 840 },
      { name_en: "Hilton Xi'an", district: "Dongxin Street", stars: 5, price_per_night: 980 },
      { name_en: "Holiday Inn Xi'an Big Goose Pagoda", district: "Yanta", stars: 4, price_per_night: 720 },
      { name_en: "Ramada Bell Tower Xi'an", district: "Beilin", stars: 4, price_per_night: 660 }
    ] },
    yiwu: { city_mn: "Иү", nearby_attractions: ["Yiwu International Trade City", "Futian Market", "Xiuhu Park"], hotels: [
      { name_en: "Marriott Executive Apartments Yiwu", district: "Futian", stars: 5, price_per_night: 780 },
      { name_en: "Shangri-La Yiwu", district: "Choucheng", stars: 5, price_per_night: 860 },
      { name_en: "Kasion International Hotel Yiwu", district: "Binwang", stars: 4, price_per_night: 620 },
      { name_en: "The Pury Hotel Yiwu", district: "Jiangdong", stars: 4, price_per_night: 560 },
      { name_en: "Yandoo Hotel Yiwu", district: "Futian", stars: 3, price_per_night: 450 }
    ] },

    bangkok: { city_mn: "Бангкок", nearby_attractions: ["Grand Palace", "Wat Pho", "Siam Paragon"], hotels: [
      { name_en: "Eastin Grand Hotel Sathorn", district: "Sathorn", stars: 5, price_per_night: 3400, attraction_distance: "1.8 км" },
      { name_en: "Amara Bangkok", district: "Silom", stars: 4, price_per_night: 2600, attraction_distance: "2.0 км" },
      { name_en: "Novotel Bangkok Sukhumvit 20", district: "Sukhumvit", stars: 4, price_per_night: 3100, attraction_distance: "2.4 км" },
      { name_en: "Grande Centre Point Ratchadamri", district: "Ratchadamri", stars: 5, price_per_night: 3900, attraction_distance: "1.5 км" },
      { name_en: "Holiday Inn Bangkok Silom", district: "Silom", stars: 4, price_per_night: 2800, attraction_distance: "2.2 км" }
    ] },
    phuket: { city_mn: "Пхукет", nearby_attractions: ["Patong Beach", "Big Buddha", "Phuket Old Town"], hotels: [
      { name_en: "Holiday Inn Resort Phuket", district: "Patong", stars: 4, price_per_night: 3600 },
      { name_en: "Amari Phuket", district: "Patong Bay", stars: 5, price_per_night: 5200 },
      { name_en: "Four Points by Sheraton Phuket Patong Beach Resort", district: "Patong", stars: 4, price_per_night: 4300 },
      { name_en: "The Nature Phuket", district: "Kalim", stars: 5, price_per_night: 4100 },
      { name_en: "Novotel Phuket City Phokeethra", district: "Phuket Town", stars: 5, price_per_night: 3500 }
    ] },
    pattaya: { city_mn: "Паттайа", nearby_attractions: ["Walking Street", "Sanctuary of Truth", "Jomtien Beach"], hotels: [
      { name_en: "Hilton Pattaya", district: "Pattaya Beach Road", stars: 5, price_per_night: 4600 },
      { name_en: "Holiday Inn Pattaya", district: "North Pattaya", stars: 4, price_per_night: 3300 },
      { name_en: "Siam@Siam Design Hotel Pattaya", district: "Central Pattaya", stars: 4, price_per_night: 3000 },
      { name_en: "Dusit Thani Pattaya", district: "Naklua", stars: 5, price_per_night: 4200 },
      { name_en: "Mercure Pattaya Ocean Resort", district: "Central Pattaya", stars: 4, price_per_night: 2700 }
    ] },
    chiang_mai: { city_mn: "Чиангмай", nearby_attractions: ["Old City Temples", "Night Bazaar", "Doi Suthep"], hotels: [
      { name_en: "Shangri-La Chiang Mai", district: "Chang Khlan", stars: 5, price_per_night: 4200 },
      { name_en: "Melia Chiang Mai", district: "Chang Moi", stars: 5, price_per_night: 3900 },
      { name_en: "The Empress Premier Chiang Mai", district: "Chang Khlan", stars: 5, price_per_night: 3200 },
      { name_en: "dusitD2 Chiang Mai", district: "Night Bazaar", stars: 4, price_per_night: 3000 },
      { name_en: "Holiday Inn Chiang Mai", district: "Riverside", stars: 4, price_per_night: 2600 }
    ] },
    krabi: { city_mn: "Краби", nearby_attractions: ["Ao Nang Beach", "Railay Beach", "Tiger Cave Temple"], hotels: [
      { name_en: "Holiday Inn Resort Krabi Ao Nang Beach", district: "Ao Nang", stars: 4, price_per_night: 3100 },
      { name_en: "Panan Krabi Resort", district: "Ao Nang", stars: 4, price_per_night: 2500 },
      { name_en: "Sofitel Krabi Phokeethra Golf and Spa Resort", district: "Khlong Muang", stars: 5, price_per_night: 5600 },
      { name_en: "Dusit Thani Krabi Beach Resort", district: "Khlong Muang", stars: 5, price_per_night: 5200 },
      { name_en: "Centara Ao Nang Beach Resort and Spa Krabi", district: "Ao Nang", stars: 4, price_per_night: 3400 }
    ] },

    hanoi: { city_mn: "Ханой", nearby_attractions: ["Hoan Kiem Lake", "Old Quarter", "Temple of Literature"], hotels: [
      { name_en: "Pan Pacific Hanoi", district: "Ba Dinh", stars: 5, price_per_night: 2200000 },
      { name_en: "Apricot Hotel Hanoi", district: "Hoan Kiem", stars: 5, price_per_night: 2600000 },
      { name_en: "Hanoi La Siesta Hotel and Spa", district: "Old Quarter", stars: 4, price_per_night: 1900000 },
      { name_en: "Movenpick Hotel Hanoi Centre", district: "Hai Ba Trung", stars: 5, price_per_night: 2300000 },
      { name_en: "Silk Path Hotel Hanoi", district: "Hoan Kiem", stars: 4, price_per_night: 1700000 }
    ] },
    ho_chi_minh: { city_mn: "Хошимин", nearby_attractions: ["Ben Thanh Market", "Saigon Notre-Dame Cathedral", "Nguyen Hue Street"], hotels: [
      { name_en: "Rex Hotel Saigon", district: "District 1", stars: 5, price_per_night: 2400000 },
      { name_en: "Liberty Central Saigon Citypoint", district: "District 1", stars: 4, price_per_night: 1800000 },
      { name_en: "Hotel Nikko Saigon", district: "District 1", stars: 5, price_per_night: 2700000 },
      { name_en: "Sofitel Saigon Plaza", district: "District 1", stars: 5, price_per_night: 3200000 },
      { name_en: "Harmony Saigon Hotel and Spa", district: "District 1", stars: 4, price_per_night: 1600000 }
    ] },
    da_nang: { city_mn: "Дананг", nearby_attractions: ["My Khe Beach", "Dragon Bridge", "Ba Na Hills"], hotels: [
      { name_en: "Novotel Danang Premier Han River", district: "Hai Chau", stars: 5, price_per_night: 2200000 },
      { name_en: "Hilton Da Nang", district: "Han Riverside", stars: 5, price_per_night: 2500000 },
      { name_en: "Four Points by Sheraton Danang", district: "My Khe Beach", stars: 4, price_per_night: 2000000 },
      { name_en: "M Hotel Danang", district: "Son Tra", stars: 4, price_per_night: 1700000 },
      { name_en: "Melia Vinpearl Danang Riverfront", district: "Son Tra", stars: 5, price_per_night: 2100000 }
    ] },
    nha_trang: { city_mn: "Нячанг", nearby_attractions: ["Nha Trang Beach", "Ponagar Tower", "VinWonders"], hotels: [
      { name_en: "InterContinental Nha Trang", district: "Tran Phu", stars: 5, price_per_night: 2900000 },
      { name_en: "Sheraton Nha Trang Hotel and Spa", district: "Tran Phu", stars: 5, price_per_night: 2800000 },
      { name_en: "Citadines Bayfront Nha Trang", district: "Loc Tho", stars: 4, price_per_night: 1900000 },
      { name_en: "Novotel Nha Trang", district: "Tran Phu", stars: 4, price_per_night: 2100000 },
      { name_en: "Liberty Central Nha Trang Hotel", district: "Loc Tho", stars: 4, price_per_night: 1700000 }
    ] },
    vung_tau: { city_mn: "Вунгтау", nearby_attractions: ["Back Beach", "Christ of Vung Tau", "Lighthouse"], hotels: [
      { name_en: "Pullman Vung Tau", district: "Thang Tam", stars: 5, price_per_night: 2300000 },
      { name_en: "Vias Hotel Vung Tau", district: "Back Beach", stars: 5, price_per_night: 2100000 },
      { name_en: "The Imperial Hotel Vung Tau", district: "Thang Tam", stars: 5, price_per_night: 2600000 },
      { name_en: "Premier Pearl Hotel Vung Tau", district: "Back Beach", stars: 4, price_per_night: 1800000 },
      { name_en: "Muong Thanh Holiday Vung Tau Hotel", district: "Thang Tam", stars: 4, price_per_night: 1500000 }
    ] },

    bali: { city_mn: "Бали", nearby_attractions: ["Seminyak Beach", "Uluwatu Temple", "Ubud Market"], hotels: [
      { name_en: "Ayodya Resort Bali", district: "Nusa Dua", stars: 5, price_per_night: 2100000 },
      { name_en: "Courtyard by Marriott Bali Seminyak Resort", district: "Seminyak", stars: 5, price_per_night: 2300000 },
      { name_en: "The Westin Resort Nusa Dua Bali", district: "Nusa Dua", stars: 5, price_per_night: 2700000 },
      { name_en: "Four Points by Sheraton Bali Kuta", district: "Kuta", stars: 4, price_per_night: 1700000 },
      { name_en: "Holiday Inn Resort Baruna Bali", district: "Tuban", stars: 4, price_per_night: 1900000 }
    ] },
    jakarta: { city_mn: "Жакарта", nearby_attractions: ["National Monument", "Grand Indonesia", "Kota Tua"], hotels: [
      { name_en: "Hotel Indonesia Kempinski Jakarta", district: "Thamrin", stars: 5, price_per_night: 3000000 },
      { name_en: "Pullman Jakarta Indonesia", district: "Thamrin", stars: 5, price_per_night: 2600000 },
      { name_en: "Holiday Inn and Suites Jakarta Gajah Mada", district: "Gajah Mada", stars: 4, price_per_night: 1800000 },
      { name_en: "DoubleTree by Hilton Jakarta Diponegoro", district: "Menteng", stars: 5, price_per_night: 2400000 },
      { name_en: "YELLO Hotel Harmoni Jakarta", district: "Central Jakarta", stars: 3, price_per_night: 1200000 }
    ] },
    yogyakarta: { city_mn: "Жогжакарта", nearby_attractions: ["Malioboro Street", "Borobudur", "Prambanan"], hotels: [
      { name_en: "Yogyakarta Marriott Hotel", district: "Sleman", stars: 5, price_per_night: 1600000 },
      { name_en: "Melia Purosani Yogyakarta", district: "Malioboro", stars: 5, price_per_night: 1800000 },
      { name_en: "The Alana Hotel and Conference Center Malioboro Yogyakarta", district: "Danurejan", stars: 4, price_per_night: 1300000 },
      { name_en: "Harper Malioboro Yogyakarta", district: "Malioboro", stars: 4, price_per_night: 1100000 },
      { name_en: "Grand Mercure Yogyakarta Adi Sucipto", district: "Depok", stars: 5, price_per_night: 1500000 }
    ] },

    tokyo: { city_mn: "Токио", nearby_attractions: ["Shibuya Crossing", "Senso-ji", "Tokyo Skytree"], hotels: [
      { name_en: "Shinagawa Prince Hotel", district: "Shinagawa", stars: 4, price_per_night: 26000 },
      { name_en: "Hotel Gracery Shinjuku", district: "Shinjuku", stars: 4, price_per_night: 29000 },
      { name_en: "Keio Plaza Hotel Tokyo", district: "Shinjuku", stars: 5, price_per_night: 42000 },
      { name_en: "Mitsui Garden Hotel Ginza Premier", district: "Ginza", stars: 4, price_per_night: 36000 },
      { name_en: "The Prince Gallery Tokyo Kioicho", district: "Akasaka", stars: 5, price_per_night: 58000 }
    ] },
    osaka: { city_mn: "Осака", nearby_attractions: ["Dotonbori", "Osaka Castle", "Umeda Sky Building"], hotels: [
      { name_en: "Hotel Monterey Grasmere Osaka", district: "Namba", stars: 4, price_per_night: 22000 },
      { name_en: "Swissotel Nankai Osaka", district: "Namba", stars: 5, price_per_night: 38000 },
      { name_en: "Cross Hotel Osaka", district: "Shinsaibashi", stars: 4, price_per_night: 28000 },
      { name_en: "Hotel New Otani Osaka", district: "Chuo", stars: 5, price_per_night: 35000 },
      { name_en: "Holiday Inn Osaka Namba", district: "Namba", stars: 4, price_per_night: 24000 }
    ] },
    kyoto: { city_mn: "Киото", nearby_attractions: ["Fushimi Inari", "Kiyomizu-dera", "Arashiyama"], hotels: [
      { name_en: "Kyoto Hotel Okura", district: "Nakagyo", stars: 5, price_per_night: 32000 },
      { name_en: "Miyako Hotel Kyoto Hachijo", district: "Minami", stars: 4, price_per_night: 21000 },
      { name_en: "The Royal Park Hotel Kyoto Sanjo", district: "Sanjo", stars: 4, price_per_night: 24000 },
      { name_en: "Hotel Granvia Kyoto", district: "Kyoto Station", stars: 5, price_per_night: 36000 },
      { name_en: "Daiwa Roynet Hotel Kyoto Terrace Hachijo PREMIER", district: "Minami", stars: 4, price_per_night: 20000 }
    ] },
    fukuoka: { city_mn: "Фукуока", nearby_attractions: ["Canal City", "Ohori Park", "Hakata Station"], hotels: [
      { name_en: "Hotel Nikko Fukuoka", district: "Hakata", stars: 5, price_per_night: 26000 },
      { name_en: "THE BLOSSOM HAKATA Premier", district: "Hakata", stars: 4, price_per_night: 23000 },
      { name_en: "ANA Crowne Plaza Fukuoka", district: "Hakata", stars: 4, price_per_night: 24000 },
      { name_en: "Grand Hyatt Fukuoka", district: "Nakasu", stars: 5, price_per_night: 33000 },
      { name_en: "Mitsui Garden Hotel Fukuoka Gion", district: "Gion", stars: 4, price_per_night: 21000 }
    ] },

    seoul: { city_mn: "Сөүл", nearby_attractions: ["Gyeongbokgung", "Myeongdong", "N Seoul Tower"], hotels: [
      { name_en: "Lotte Hotel Seoul", district: "Myeongdong", stars: 5, price_per_night: 320000 },
      { name_en: "ENA Suite Hotel Namdaemun", district: "Jung-gu", stars: 4, price_per_night: 190000 },
      { name_en: "Novotel Ambassador Seoul Dongdaemun Hotels and Residences", district: "Dongdaemun", stars: 5, price_per_night: 250000 },
      { name_en: "Four Points by Sheraton Josun Seoul Myeongdong", district: "Myeongdong", stars: 4, price_per_night: 210000 },
      { name_en: "Shilla Stay Gwanghwamun", district: "Jongno", stars: 4, price_per_night: 180000 }
    ] },
    busan: { city_mn: "Пусан", nearby_attractions: ["Haeundae Beach", "Gamcheon Culture Village", "Gwangalli Beach"], hotels: [
      { name_en: "Paradise Hotel Busan", district: "Haeundae", stars: 5, price_per_night: 340000 },
      { name_en: "L7 Haeundae by LOTTE", district: "Haeundae", stars: 4, price_per_night: 220000 },
      { name_en: "Shilla Stay Haeundae", district: "Haeundae", stars: 4, price_per_night: 200000 },
      { name_en: "Asti Hotel Busan Station", district: "Dong-gu", stars: 4, price_per_night: 170000 },
      { name_en: "Ananti at Busan Cove", district: "Gijang", stars: 5, price_per_night: 380000 }
    ] },
    jeju: { city_mn: "Жэжү", nearby_attractions: ["Seongsan Ilchulbong", "Jeju Folk Village", "Hallasan"], hotels: [
      { name_en: "Lotte Hotel Jeju", district: "Jungmun", stars: 5, price_per_night: 360000 },
      { name_en: "Grand Hyatt Jeju", district: "Jeju City", stars: 5, price_per_night: 330000 },
      { name_en: "Ramada Plaza by Wyndham Jeju Ocean Front", district: "Tap-dong", stars: 5, price_per_night: 250000 },
      { name_en: "Shin Shin Hotel Jeju Airport", district: "Yeon-dong", stars: 4, price_per_night: 140000 },
      { name_en: "Ocean Suites Jeju Hotel", district: "Jeju Port", stars: 4, price_per_night: 170000 }
    ] },

    singapore: { city_mn: "Сингапур", nearby_attractions: ["Marina Bay Sands", "Gardens by the Bay", "Sentosa"], hotels: [
      { name_en: "Carlton Hotel Singapore", district: "Bras Basah", stars: 4, price_per_night: 340 },
      { name_en: "Pan Pacific Singapore", district: "Marina Centre", stars: 5, price_per_night: 520 },
      { name_en: "PARKROYAL COLLECTION Marina Bay Singapore", district: "Marina Bay", stars: 5, price_per_night: 560 },
      { name_en: "Holiday Inn Singapore Little India", district: "Little India", stars: 4, price_per_night: 380 },
      { name_en: "M Social Singapore", district: "Robertson Quay", stars: 4, price_per_night: 320 }
    ] },

    kuala_lumpur: { city_mn: "Куала Лумпур", nearby_attractions: ["Petronas Twin Towers", "Bukit Bintang", "Merdeka Square"], hotels: [
      { name_en: "Traders Hotel Kuala Lumpur", district: "KLCC", stars: 5, price_per_night: 520 },
      { name_en: "Impiana KLCC Hotel", district: "KLCC", stars: 4, price_per_night: 360 },
      { name_en: "PARKROYAL COLLECTION Kuala Lumpur", district: "Bukit Bintang", stars: 5, price_per_night: 480 },
      { name_en: "Holiday Inn Express Kuala Lumpur City Centre", district: "Raja Chulan", stars: 4, price_per_night: 300 },
      { name_en: "Aloft Kuala Lumpur Sentral", district: "KL Sentral", stars: 4, price_per_night: 340 }
    ] },
    penang: { city_mn: "Пенанг", nearby_attractions: ["George Town", "Kek Lok Si Temple", "Penang Hill"], hotels: [
      { name_en: "Eastern and Oriental Hotel", district: "George Town", stars: 5, price_per_night: 760 },
      { name_en: "Jen Penang Georgetown by Shangri-La", district: "Magazine Road", stars: 4, price_per_night: 420 },
      { name_en: "G Hotel Gurney", district: "Gurney Drive", stars: 5, price_per_night: 640 },
      { name_en: "Cititel Penang", district: "George Town", stars: 4, price_per_night: 310 },
      { name_en: "DoubleTree Resort by Hilton Hotel Penang", district: "Batu Ferringhi", stars: 4, price_per_night: 460 }
    ] },

    dubai: { city_mn: "Дубай", nearby_attractions: ["Burj Khalifa", "Dubai Mall", "Dubai Marina"], hotels: [
      { name_en: "Swissotel Al Murooj Dubai", district: "Downtown Dubai", stars: 5, price_per_night: 780 },
      { name_en: "Rove Downtown Dubai", district: "Downtown Dubai", stars: 4, price_per_night: 520 },
      { name_en: "JA Ocean View Hotel", district: "Jumeirah Beach Residence", stars: 5, price_per_night: 890 },
      { name_en: "Millennium Place Marina", district: "Dubai Marina", stars: 4, price_per_night: 560 },
      { name_en: "Holiday Inn Express Dubai Airport", district: "Garhoud", stars: 3, price_per_night: 360 }
    ] },
    abu_dhabi: { city_mn: "Абу Даби", nearby_attractions: ["Sheikh Zayed Grand Mosque", "Louvre Abu Dhabi", "Corniche"], hotels: [
      { name_en: "Conrad Abu Dhabi Etihad Towers", district: "Corniche West", stars: 5, price_per_night: 920 },
      { name_en: "Jannah Burj Al Sarab", district: "Al Zahiyah", stars: 5, price_per_night: 620 },
      { name_en: "Novotel Abu Dhabi Al Bustan", district: "Al Aman", stars: 4, price_per_night: 420 },
      { name_en: "Ramada by Wyndham Abu Dhabi Corniche", district: "Corniche", stars: 4, price_per_night: 460 },
      { name_en: "Premier Inn Abu Dhabi Airport", district: "Khalifa City", stars: 3, price_per_night: 300 }
    ] },

    istanbul: { city_mn: "Стамбул", nearby_attractions: ["Hagia Sophia", "Blue Mosque", "Grand Bazaar"], hotels: [
      { name_en: "Sura Hagia Sophia Hotel", district: "Sultanahmet", stars: 5, price_per_night: 5200 },
      { name_en: "Holiday Inn Istanbul Old City", district: "Fatih", stars: 4, price_per_night: 3300 },
      { name_en: "CVK Park Bosphorus Hotel Istanbul", district: "Taksim", stars: 5, price_per_night: 6800 },
      { name_en: "Radisson Blu Hotel Istanbul Pera", district: "Beyoglu", stars: 5, price_per_night: 5900 },
      { name_en: "Golden Horn Hotel Istanbul", district: "Sirkeci", stars: 4, price_per_night: 3600 }
    ] },
    antalya: { city_mn: "Анталья", nearby_attractions: ["Kaleici Old Town", "Konyaalti Beach", "Duden Waterfalls"], hotels: [
      { name_en: "Akra Antalya", district: "Lara", stars: 5, price_per_night: 6200 },
      { name_en: "Ramada Plaza by Wyndham Antalya", district: "Muratpasa", stars: 5, price_per_night: 5100 },
      { name_en: "DoubleTree by Hilton Antalya City Centre", district: "Muratpasa", stars: 5, price_per_night: 4700 },
      { name_en: "Best Western Plus Khan Hotel", district: "Kaleici", stars: 4, price_per_night: 3200 },
      { name_en: "Holiday Inn Antalya Lara", district: "Lara", stars: 4, price_per_night: 3900 }
    ] }
  };

  const CITY_HOTELS = Object.fromEntries(
    Object.entries(CITY_BLUEPRINTS).map(([cityId, blueprint]) => [cityId, createCitySpecs(blueprint.city_mn, blueprint)])
  );

  function buildHotel(cityId, spec, idx, nights) {
    const city = window.TRAVEL_CITIES?.getCity(cityId);
    if (!city) return null;
    const country = window.TRAVEL_CITIES?.getCountry(city.country_id) || {};
    const nightsNum = Math.max(1, Number(nights) || 1);
    const images = assignImages(city.country_id, cityId, idx);
    const baseAmenities = spec.amenities || [];
    const rooms = (spec.rooms || []).map((room, roomIdx) => ({
      name: room.name,
      beds: room.beds,
      image: roomIdx % 2 === 0 ? images.standard_room : images.deluxe_room,
      amenities: [...new Set([...(room.amenities || []), ...baseAmenities.slice(0, 4)])]
    }));
    const images_list = IMAGE_KEYS.map((k) => images[k]);
    const supplierRef = `SUP-${city.country_id.toUpperCase()}-${cityId.toUpperCase()}-${String(idx + 1).padStart(2, "0")}`;
    return {
      id: `${cityId}_hotel_${idx + 1}`,
      type: "hotel",
      country_id: city.country_id,
      city_id: cityId,
      name_en: spec.name_en,
      description_mn: spec.description_mn,
      district: spec.district,
      stars: spec.stars,
      address: `${spec.district}, ${city.name_en}, ${country.name_en || city.country_id}`,
      metro_distance: spec.metro_distance,
      attraction_distance: spec.attraction_distance,
      nearby_attractions: spec.nearby_attractions || [],
      breakfast: Boolean(spec.breakfast),
      free_cancellation: Boolean(spec.free_cancellation),
      images,
      images_list,
      rooms,
      amenities: baseAmenities,
      map_url: window.TRAVEL_CITIES?.cityMapUrl(cityId, spec.name_en) || "https://www.google.com/maps",
      nights: nightsNum,
      original_price: Math.round((Number(spec.price_per_night) || 0) * nightsNum),
      currency: country.currency || "USD",
      internal_supplier_reference: supplierRef
    };
  }

  function search(cityId, nights) {
    const normalized = window.TRAVEL_CITIES?.normalizeCity(cityId) || cityId;
    const specs = CITY_HOTELS[normalized] || [];
    return specs
      .map((spec, idx) => buildHotel(normalized, spec, idx, nights))
      .filter((hotel) => hotel && hotel.city_id === normalized);
  }

  window.HOTELS_CATALOG = {
    HOTEL_STOCK,
    CITY_HOTELS,
    FALLBACK_IMG,
    assignImages,
    buildHotel,
    search
  };
})();
