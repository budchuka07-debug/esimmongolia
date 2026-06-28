/**
 * City areas / districts for location-based hotel search (Trip.com-style)
 */
(function () {
  function area(id, name, district, opts) {
    const o = opts || {};
    return {
      id,
      name,
      district,
      landmarks: o.landmarks || [name],
      nearby_metro: o.metro || "",
      latitude: o.lat || 0,
      longitude: o.lng || 0,
      distance_to_center_km: o.dist_center_km ?? 2,
      distance_to_airport_km: o.dist_airport_km ?? 25,
      aliases: o.aliases || []
    };
  }

  const CITY_AREAS = {
    shanghai: [
      area("peoples_square", "People's Square", "Huangpu", { metro: "People's Square", lat: 31.2304, lng: 121.4737, dist_center_km: 0.3, dist_airport_km: 45, landmarks: ["People's Square", "Shanghai Museum", "Nanjing Road"] }),
      area("nanjing_road", "Nanjing Road", "Huangpu", { metro: "East Nanjing Road", lat: 31.2347, lng: 121.4755, dist_center_km: 0.5, dist_airport_km: 44, landmarks: ["Nanjing Road", "The Bund"] }),
      area("the_bund", "The Bund", "Huangpu", { metro: "East Nanjing Road", lat: 31.2400, lng: 121.4900, dist_center_km: 1.2, dist_airport_km: 43, landmarks: ["The Bund", "Huangpu River", "Oriental Pearl"] }),
      area("pudong", "Pudong", "Pudong", { metro: "Lujiazui", lat: 31.2397, lng: 121.4998, dist_center_km: 3.5, dist_airport_km: 40, landmarks: ["Pudong", "Oriental Pearl Tower"] }),
      area("lujiazui", "Lujiazui", "Pudong", { metro: "Lujiazui", lat: 31.2352, lng: 121.5012, dist_center_km: 4, dist_airport_km: 38, landmarks: ["Lujiazui", "Shanghai Tower", "Jin Mao Tower"] }),
      area("disneyland", "Disneyland", "Pudong", { metro: "Disney Resort", lat: 31.1433, lng: 121.6572, dist_center_km: 22, dist_airport_km: 15, landmarks: ["Shanghai Disneyland", "Disneytown"], aliases: ["Disney", "Шанхай Дисней"] }),
      area("hongqiao", "Hongqiao Airport", "Minhang", { metro: "Hongqiao Railway Station", lat: 31.1979, lng: 121.3364, dist_center_km: 14, dist_airport_km: 2, landmarks: ["Hongqiao Airport", "Hongqiao Hub"], aliases: ["Hongqiao", "SHA"] }),
      area("xuhui", "Xuhui", "Xuhui", { metro: "Xujiahui", lat: 31.1885, lng: 121.4365, dist_center_km: 5, dist_airport_km: 42, landmarks: ["Xujiahui", "Shanghai Stadium"] }),
      area("french_concession", "French Concession", "Xuhui", { metro: "South Shaanxi Road", lat: 31.2156, lng: 121.4512, dist_center_km: 3, dist_airport_km: 43, landmarks: ["French Concession", "Tianzifang", "Fuxing Park"], aliases: ["French Quarter"] }),
      area("jingan", "Jing'an", "Jing'an", { metro: "Jing'an Temple", lat: 31.2244, lng: 121.4453, dist_center_km: 2.5, dist_airport_km: 44, landmarks: ["Jing'an Temple", "West Nanjing Road"] })
    ],
    beijing: [
      area("wangfujing", "Wangfujing", "Dongcheng", { metro: "Wangfujing", lat: 39.9143, lng: 116.4111, dist_center_km: 0.8, dist_airport_km: 28, landmarks: ["Wangfujing", "Wangfujing Street"] }),
      area("tiananmen", "Tiananmen", "Dongcheng", { metro: "Tiananmen East", lat: 39.9055, lng: 116.3976, dist_center_km: 0.2, dist_airport_km: 30, landmarks: ["Tiananmen Square", "Forbidden City"] }),
      area("forbidden_city", "Forbidden City", "Dongcheng", { metro: "Tiananmen West", lat: 39.9163, lng: 116.3972, dist_center_km: 0.5, dist_airport_km: 29, landmarks: ["Forbidden City", "Tiananmen"] }),
      area("sanlitun", "Sanlitun", "Chaoyang", { metro: "Tuanjiehu", lat: 39.9368, lng: 116.4551, dist_center_km: 4, dist_airport_km: 22, landmarks: ["Sanlitun", "Taikoo Li"] }),
      area("chaoyang", "Chaoyang", "Chaoyang", { metro: "Guomao", lat: 39.9219, lng: 116.4435, dist_center_km: 5, dist_airport_km: 20, landmarks: ["CBD", "China World Trade Center"] }),
      area("haidian", "Haidian", "Haidian", { metro: "Zhongguancun", lat: 39.9834, lng: 116.3158, dist_center_km: 12, dist_airport_km: 35, landmarks: ["Zhongguancun", "Summer Palace", "Peking University"] }),
      area("beijing_south", "Beijing South Railway Station", "Fengtai", { metro: "Beijing South Railway Station", lat: 39.8652, lng: 116.3785, dist_center_km: 6, dist_airport_km: 32, landmarks: ["Beijing South Station", "High-speed Rail"], aliases: ["Beijing South", "南站"] }),
      area("capital_airport", "Capital Airport", "Chaoyang", { metro: "Capital Airport Terminal 3", lat: 40.0799, lng: 116.6031, dist_center_km: 28, dist_airport_km: 1, landmarks: ["Beijing Capital Airport", "PEK"], aliases: ["PEK", "Capital"] }),
      area("daxing_airport", "Daxing Airport", "Daxing", { metro: "Daxing Airport", lat: 39.5098, lng: 116.4109, dist_center_km: 45, dist_airport_km: 1, landmarks: ["Beijing Daxing Airport", "PKX"], aliases: ["PKX", "Daxing"] }),
      area("dongcheng", "Dongcheng", "Dongcheng", { metro: "Dongsi", lat: 39.9289, lng: 116.4174, dist_center_km: 2, dist_airport_km: 27, landmarks: ["Temple of Heaven", "Lama Temple"] })
    ],
    bangkok: [
      area("sukhumvit", "Sukhumvit", "Watthana", { metro: "Asok BTS", lat: 13.7373, lng: 100.5603, dist_center_km: 5, dist_airport_km: 28, landmarks: ["Sukhumvit", "Terminal 21", "Emporium"] }),
      area("siam", "Siam", "Pathum Wan", { metro: "Siam BTS", lat: 13.7466, lng: 100.5347, dist_center_km: 2, dist_airport_km: 30, landmarks: ["Siam Paragon", "MBK Center", "CentralWorld"] }),
      area("pratunam", "Pratunam", "Ratchathewi", { metro: "Chit Lom BTS", lat: 13.7501, lng: 100.5416, dist_center_km: 3, dist_airport_km: 29, landmarks: ["Pratunam Market", "Platinum Fashion Mall"] }),
      area("silom", "Silom", "Bang Rak", { metro: "Sala Daeng BTS", lat: 13.7265, lng: 100.5342, dist_center_km: 4, dist_airport_km: 31, landmarks: ["Silom", "Patpong", "Lumphini Park"] }),
      area("riverside", "Riverside", "Bangkok Yai", { metro: "Saphan Taksin BTS", lat: 13.7225, lng: 100.5132, dist_center_km: 5, dist_airport_km: 33, landmarks: ["Chao Phraya River", "Wat Arun", "IconSiam"] }),
      area("don_mueang", "Don Mueang Airport", "Don Mueang", { metro: "Don Mueang", lat: 13.9126, lng: 100.6068, dist_center_km: 22, dist_airport_km: 1, landmarks: ["Don Mueang Airport", "DMK"], aliases: ["DMK"] }),
      area("suvarnabhumi", "Suvarnabhumi Airport", "Bang Phli", { metro: "Suvarnabhumi Airport", lat: 13.6900, lng: 100.7501, dist_center_km: 30, dist_airport_km: 1, landmarks: ["Suvarnabhumi Airport", "BKK Airport"], aliases: ["BKK", "Suvarnabhumi"] }),
      area("old_town", "Old Town", "Phra Nakhon", { metro: "Sanam Chai MRT", lat: 13.7563, lng: 100.5018, dist_center_km: 1, dist_airport_km: 32, landmarks: ["Grand Palace", "Wat Pho", "Khao San Road"] }),
      area("chatuchak", "Chatuchak", "Chatuchak", { metro: "Mo Chit BTS", lat: 13.7999, lng: 100.5501, dist_center_km: 8, dist_airport_km: 25, landmarks: ["Chatuchak Weekend Market"] })
    ],
    hohhot: [
      area("city_center", "City Center", "Xincheng", { metro: "", lat: 40.8426, lng: 111.7492, dist_center_km: 0.5, dist_airport_km: 15, landmarks: ["Hohhot City Center", "Zhaojun Tomb"] }),
      area("railway", "Hohhot Railway Station", "Huimin", { metro: "", lat: 40.8289, lng: 111.6589, dist_center_km: 4, dist_airport_km: 18, landmarks: ["Hohhot Railway Station"] }),
      area("airport", "Hohhot Airport", "Saihan", { metro: "", lat: 40.8514, lng: 111.8241, dist_center_km: 12, dist_airport_km: 1, landmarks: ["Hohhot Baita Airport"] }),
      area("dazhao", "Dazhao Temple", "Huimin", { metro: "", lat: 40.7989, lng: 111.6512, dist_center_km: 3, dist_airport_km: 17, landmarks: ["Dazhao Temple", "Muslim Quarter"] }),
      area("xincheng", "Xincheng District", "Xincheng", { metro: "", lat: 40.8589, lng: 111.7654, dist_center_km: 2, dist_airport_km: 14, landmarks: ["Xincheng", "Hohhot Museum"] })
    ],
    phuket: [
      area("patong", "Patong Beach", "Patong", { metro: "", lat: 7.8965, lng: 98.2965, dist_center_km: 8, dist_airport_km: 35, landmarks: ["Patong Beach", "Bangla Road"] }),
      area("kata", "Kata Beach", "Karon", { metro: "", lat: 7.8205, lng: 98.2989, dist_center_km: 12, dist_airport_km: 40, landmarks: ["Kata Beach", "Kata Noi"] }),
      area("old_town", "Phuket Old Town", "Mueang Phuket", { metro: "", lat: 7.8848, lng: 98.3889, dist_center_km: 2, dist_airport_km: 32, landmarks: ["Phuket Old Town", "Sunday Walking Street"] }),
      area("airport", "Phuket Airport", "Thalang", { metro: "", lat: 8.1132, lng: 98.3169, dist_center_km: 30, dist_airport_km: 1, landmarks: ["Phuket International Airport", "HKT"] }),
      area("karon", "Karon Beach", "Karon", { metro: "", lat: 7.8465, lng: 98.2945, dist_center_km: 10, dist_airport_km: 38, landmarks: ["Karon Beach"] }),
      area("rawai", "Rawai", "Mueang Phuket", { metro: "", lat: 7.7789, lng: 98.3165, dist_center_km: 14, dist_airport_km: 42, landmarks: ["Rawai Beach", "Promthep Cape"] })
    ],
    da_nang: [
      area("my_khe", "My Khe Beach", "Son Tra", { metro: "", lat: 16.0471, lng: 108.2465, dist_center_km: 4, dist_airport_km: 5, landmarks: ["My Khe Beach", "East Sea Park"] }),
      area("han_river", "Han River", "Hai Chau", { metro: "", lat: 16.0680, lng: 108.2208, dist_center_km: 1, dist_airport_km: 4, landmarks: ["Dragon Bridge", "Han River"] }),
      area("marble_mountains", "Marble Mountains", "Ngu Hanh Son", { metro: "", lat: 15.9795, lng: 108.2608, dist_center_km: 8, dist_airport_km: 10, landmarks: ["Marble Mountains", "Non Nuoc Beach"] }),
      area("airport", "Da Nang Airport", "Hai Chau", { metro: "", lat: 16.0439, lng: 108.1994, dist_center_km: 3, dist_airport_km: 1, landmarks: ["Da Nang International Airport", "DAD"] }),
      area("ba_na", "Ba Na Hills", "Hoa Vang", { metro: "", lat: 15.9953, lng: 107.9965, dist_center_km: 25, dist_airport_km: 28, landmarks: ["Ba Na Hills", "Golden Bridge"] }),
      area("city_center", "City Center", "Hai Chau", { metro: "", lat: 16.0544, lng: 108.2022, dist_center_km: 0.5, dist_airport_km: 3, landmarks: ["Da Nang Cathedral", "Han Market"] })
    ],
    seoul: [
      area("myeongdong", "Myeongdong", "Jung-gu", { metro: "Myeongdong", lat: 37.5636, lng: 126.9869, dist_center_km: 1, dist_airport_km: 55, landmarks: ["Myeongdong", "N Seoul Tower"] }),
      area("gangnam", "Gangnam", "Gangnam-gu", { metro: "Gangnam", lat: 37.4979, lng: 127.0276, dist_center_km: 8, dist_airport_km: 60, landmarks: ["Gangnam", "COEX Mall"] }),
      area("hongdae", "Hongdae", "Mapo-gu", { metro: "Hongik University", lat: 37.5563, lng: 126.9236, dist_center_km: 5, dist_airport_km: 50, landmarks: ["Hongdae", "Hongik University"] }),
      area("itaewon", "Itaewon", "Yongsan-gu", { metro: "Itaewon", lat: 37.5345, lng: 126.9946, dist_center_km: 4, dist_airport_km: 52, landmarks: ["Itaewon", "War Memorial"] }),
      area("jongno", "Jongno", "Jongno-gu", { metro: "Gyeongbokgung", lat: 37.5796, lng: 126.9770, dist_center_km: 2, dist_airport_km: 54, landmarks: ["Gyeongbokgung Palace", "Bukchon Hanok Village"] }),
      area("incheon_airport", "Incheon Airport", "Incheon", { metro: "Incheon Airport T1", lat: 37.4602, lng: 126.4407, dist_center_km: 50, dist_airport_km: 1, landmarks: ["Incheon International Airport", "ICN"], aliases: ["ICN"] }),
      area("dongdaemun", "Dongdaemun", "Jung-gu", { metro: "Dongdaemun History & Culture Park", lat: 37.5665, lng: 127.0092, dist_center_km: 3, dist_airport_km: 56, landmarks: ["Dongdaemun Design Plaza", "DDP"] }),
      area("yeouido", "Yeouido", "Yeongdeungpo-gu", { metro: "Yeouido", lat: 37.5219, lng: 126.9245, dist_center_km: 6, dist_airport_km: 48, landmarks: ["Yeouido Park", "63 Building"] })
    ],
    tokyo: [
      area("shinjuku", "Shinjuku", "Shinjuku", { metro: "Shinjuku", lat: 35.6938, lng: 139.7034, dist_center_km: 4, dist_airport_km: 65, landmarks: ["Shinjuku", "Kabukicho", "Tokyo Metropolitan Government"] }),
      area("shibuya", "Shibuya", "Shibuya", { metro: "Shibuya", lat: 35.6595, lng: 139.7004, dist_center_km: 5, dist_airport_km: 60, landmarks: ["Shibuya Crossing", "Hachiko"] }),
      area("ginza", "Ginza", "Chuo", { metro: "Ginza", lat: 35.6717, lng: 139.7650, dist_center_km: 2, dist_airport_km: 62, landmarks: ["Ginza", "Tsukiji Outer Market"] }),
      area("asakusa", "Asakusa", "Taito", { metro: "Asakusa", lat: 35.7148, lng: 139.7967, dist_center_km: 6, dist_airport_km: 58, landmarks: ["Senso-ji Temple", "Asakusa"] }),
      area("ueno", "Ueno", "Taito", { metro: "Ueno", lat: 35.7141, lng: 139.7774, dist_center_km: 5, dist_airport_km: 57, landmarks: ["Ueno Park", "Ueno Zoo"] }),
      area("akihabara", "Akihabara", "Chiyoda", { metro: "Akihabara", lat: 35.6984, lng: 139.7731, dist_center_km: 3, dist_airport_km: 61, landmarks: ["Akihabara", "Electric Town"] }),
      area("narita", "Narita Airport", "Narita", { metro: "Narita Airport T1", lat: 35.7720, lng: 140.3929, dist_center_km: 60, dist_airport_km: 1, landmarks: ["Narita International Airport", "NRT"], aliases: ["NRT"] }),
      area("haneda", "Haneda Airport", "Ota", { metro: "Haneda Airport T3", lat: 35.5494, lng: 139.7798, dist_center_km: 15, dist_airport_km: 1, landmarks: ["Haneda Airport", "HND"], aliases: ["HND"] }),
      area("roppongi", "Roppongi", "Minato", { metro: "Roppongi", lat: 35.6627, lng: 139.7314, dist_center_km: 4, dist_airport_km: 58, landmarks: ["Roppongi Hills", "Tokyo Tower"] })
    ],
    bali: [
      area("seminyak", "Seminyak", "Badung", { metro: "", lat: -8.6905, lng: 115.1682, dist_center_km: 8, dist_airport_km: 12, landmarks: ["Seminyak Beach", "Petitenget Temple"] }),
      area("kuta", "Kuta", "Badung", { metro: "", lat: -8.7183, lng: 115.1686, dist_center_km: 10, dist_airport_km: 5, landmarks: ["Kuta Beach", "Beachwalk Mall"] }),
      area("ubud", "Ubud", "Gianyar", { metro: "", lat: -8.5069, lng: 115.2625, dist_center_km: 25, dist_airport_km: 40, landmarks: ["Ubud Monkey Forest", "Tegallalang Rice Terrace"] }),
      area("nusa_dua", "Nusa Dua", "Badung", { metro: "", lat: -8.8007, lng: 115.2317, dist_center_km: 20, dist_airport_km: 15, landmarks: ["Nusa Dua Beach", "Bali Collection"] }),
      area("airport", "Ngurah Rai Airport", "Badung", { metro: "", lat: -8.7482, lng: 115.1672, dist_center_km: 12, dist_airport_km: 1, landmarks: ["Ngurah Rai Airport", "DPS"], aliases: ["DPS"] }),
      area("canggu", "Canggu", "Badung", { metro: "", lat: -8.6478, lng: 115.1385, dist_center_km: 15, dist_airport_km: 18, landmarks: ["Canggu Beach", "Echo Beach"] }),
      area("sanur", "Sanur", "Denpasar", { metro: "", lat: -8.7089, lng: 115.2625, dist_center_km: 12, dist_airport_km: 14, landmarks: ["Sanur Beach"] })
    ]
  };

  const GENERIC_AREA_NAMES = [
    "City Center", "Downtown", "Business District", "Old Town",
    "Airport Area", "Train Station Area", "Waterfront", "Shopping District"
  ];

  function normalizeKey(s) {
    return String(s || "").trim().toLowerCase().replace(/[''`]/g, "").replace(/\s+/g, " ");
  }

  function getAreas(cityId) {
    if (CITY_AREAS[cityId]) return CITY_AREAS[cityId];
    const city = window.TRAVEL_CITIES?.getCity(cityId);
    const name = city?.name_en || cityId;
    return GENERIC_AREA_NAMES.map((n, i) =>
      area(`${cityId}_area_${i}`, n, n, {
        metro: i < 4 ? `${name} Metro ${i + 1}` : "",
        lat: 0,
        lng: 0,
        dist_center_km: i * 2 + 1,
        dist_airport_km: i === 4 ? 3 : 20 + i * 3,
        landmarks: [`${name} ${n}`]
      })
    );
  }

  function getAreaNames(cityId) {
    return getAreas(cityId).map((a) => a.name);
  }

  function getDistricts(cityId) {
    const areas = getAreas(cityId);
    return [...new Set(areas.map((a) => a.district).filter(Boolean))].sort();
  }

  function findArea(cityId, query) {
    const q = normalizeKey(query);
    if (!q) return null;
    const areas = getAreas(cityId);
    return areas.find((a) => {
      const keys = [a.id, a.name, a.district, ...(a.landmarks || []), ...(a.aliases || [])].map(normalizeKey);
      return keys.some((k) => k === q || k.includes(q) || q.includes(k));
    }) || null;
  }

  function hotelMatchesArea(hotel, areaQuery) {
    if (!areaQuery) return true;
    const area = findArea(hotel.city_id, areaQuery);
    if (area) {
      const hotelArea = normalizeKey(hotel.area_name);
      const targetArea = normalizeKey(area.name);
      if (hotelArea === targetArea) return true;
      const hotelDistrict = normalizeKey(hotel.district);
      const targetDistrict = normalizeKey(area.district);
      if (hotelDistrict === targetDistrict && area.landmarks?.some((lm) => normalizeKey(lm).includes(targetArea))) return true;
      const landmarkHit = (area.landmarks || []).some((lm) => {
        const nlm = normalizeKey(lm);
        return hotelArea.includes(nlm) || nlm.includes(hotelArea) ||
          (hotel.nearby_landmarks || []).some((h) => normalizeKey(h).includes(nlm) || nlm.includes(normalizeKey(h)));
      });
      return landmarkHit && (hotelArea.includes(targetArea) || targetArea.includes(hotelArea));
    }
    const q = normalizeKey(areaQuery);
    const hay = [
      hotel.area_name,
      hotel.district,
      hotel.nearby_metro,
      ...(hotel.nearby_landmarks || [])
    ].map(normalizeKey).join(" ");
    return hay.includes(q) || q.split(" ").filter((w) => w.length >= 2).every((w) => hay.includes(w));
  }

  window.HOTEL_AREAS = {
    CITY_AREAS,
    getAreas,
    getAreaNames,
    getDistricts,
    findArea,
    hotelMatchesArea,
    normalizeKey
  };
})();
