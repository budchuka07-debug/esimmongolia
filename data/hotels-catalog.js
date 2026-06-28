/**
 * Hotels catalog — location-based inventory with Trip.com-style search
 */
(function () {
  const FALLBACK_IMG = "/images/hotels/exterior-01.jpg";
  const IMAGE_KEYS = ["exterior", "lobby", "standard_room", "deluxe_room", "bathroom", "restaurant"];
  const COVER_KEYS = ["exterior", "lobby"];

  const CITY_HOTEL_TARGETS = {
    shanghai: 20, beijing: 20, hohhot: 15, bangkok: 20, phuket: 15,
    da_nang: 15, seoul: 20, tokyo: 20, bali: 15
  };
  const DEFAULT_HOTEL_COUNT = 12;

  const HOTEL_BRANDS = [
    "Holiday Inn", "Marriott", "Hilton", "Hyatt", "Novotel", "Sheraton",
    "InterContinental", "Radisson Blu", "Courtyard", "DoubleTree", "Mercure",
    "Ibis", "Best Western", "Ramada", "Crowne Plaza", "Four Points",
    "Park Plaza", "Grand Hyatt", "Sofitel", "Wyndham"
  ];

  const HOTEL_SUFFIXES = ["Hotel", "Suites", "Resort", "Inn", "Grand Hotel", "Plaza"];

  function localImg(category, n) {
    return `/images/hotels/${category}-${String(n).padStart(2, "0")}.jpg`;
  }

  const HOTEL_STOCK = Object.fromEntries(
    IMAGE_KEYS.map((cat) => [cat, Array.from({ length: 12 }, (_, i) => localImg(cat, i + 1))])
  );

  function hashSeed(value) {
    return String(value || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  }

  function assignImages(countryId, cityId, hotelIdx) {
    const seed = hashSeed(`${countryId}:${cityId}:${hotelIdx}`);
    const images = {};
    IMAGE_KEYS.forEach((key, i) => {
      const pool = HOTEL_STOCK[key];
      images[key] = pool[(seed + i * 17 + hotelIdx * 5) % pool.length];
    });
    return images;
  }

  function coverImageKey(hotelIdx) {
    return COVER_KEYS[hotelIdx % COVER_KEYS.length];
  }

  function defaultAmenities(stars, areaName) {
    const list = ["Free WiFi", "24/7 Front Desk", "Daily Housekeeping", "Air Conditioning"];
    if (stars >= 4) list.push("Fitness Center", "Restaurant");
    if (stars >= 5) list.push("Spa", "Concierge", "Room Service");
    if (areaName) list.push(`${areaName} Area`);
    return list;
  }

  function defaultRooms(stars) {
    const base = [
      { name: "Standard Twin Room", beds: "2 Single Beds" },
      { name: "Deluxe King Room", beds: "1 King Bed" }
    ];
    if (stars >= 4) base.push({ name: "Superior Double Room", beds: "1 Queen Bed" });
    if (stars >= 5) base.push({ name: "Executive Suite", beds: "1 King Bed + Living Area" });
    return base;
  }

  function pseudoRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function generateHotelSpec(cityId, cityMn, area, idx, globalIdx) {
    const seed = hashSeed(`${cityId}:${area.id}:${idx}`);
    const brand = HOTEL_BRANDS[Math.floor(pseudoRandom(seed) * HOTEL_BRANDS.length)];
    const suffix = HOTEL_SUFFIXES[Math.floor(pseudoRandom(seed + 7) * HOTEL_SUFFIXES.length)];
    const stars = 3 + Math.floor(pseudoRandom(seed + 13) * 3);
    const basePrice = 55 + Math.floor(pseudoRandom(seed + 19) * 120) + stars * 35;
    const areaFactor = area.distance_to_center_km > 15 ? 0.85 : area.distance_to_airport_km < 5 ? 0.9 : 1;
    const price = Math.round(basePrice * areaFactor * (0.9 + pseudoRandom(seed + 23) * 0.4));

    const metroM = area.nearby_metro
      ? Math.round(150 + pseudoRandom(seed + 31) * 750)
      : Math.round(500 + pseudoRandom(seed + 31) * 2000);

    const distAttrKm = Number((0.3 + pseudoRandom(seed + 37) * 3.5).toFixed(1));
    const lat = area.latitude + (pseudoRandom(seed + 41) - 0.5) * 0.012;
    const lng = area.longitude + (pseudoRandom(seed + 43) - 0.5) * 0.012;

    const breakfast = pseudoRandom(seed + 47) > 0.25;
    const freeCancel = pseudoRandom(seed + 53) > 0.2;
    const familyFriendly = pseudoRandom(seed + 59) > 0.35;

    const name = `${brand} ${area.name} ${suffix}`.replace(/\s+/g, " ").trim();
    const landmarks = area.landmarks || [area.name];
    const nearTxt = landmarks.slice(0, 2).join(", ");
    const description = `${name} — ${cityMn} хотын ${area.name} (${area.district}) бүсэд байрлах ${stars} одтой зочид буудал. ${nearTxt} руу ${distAttrKm} км, ${area.nearby_metro ? `${area.nearby_metro} метро ${metroM} м` : "төвөөс " + area.distance_to_center_km + " км"}. Аялал, бизнес хоёуланд тохиромжтой.`;

    return {
      name_en: name,
      description_mn: description,
      district: area.district,
      area_name: area.name,
      stars,
      price_per_night: price,
      nearby_landmarks: landmarks,
      nearby_metro: area.nearby_metro || "",
      distance_to_metro_m: metroM,
      distance_to_airport_km: Number((area.distance_to_airport_km + pseudoRandom(seed + 61) * 4).toFixed(1)),
      distance_to_center_km: Number((area.distance_to_center_km + pseudoRandom(seed + 67) * 1.5).toFixed(1)),
      distance_to_attraction_km: distAttrKm,
      latitude: Number(lat.toFixed(5)),
      longitude: Number(lng.toFixed(5)),
      breakfast,
      free_cancellation: freeCancel,
      family_friendly: familyFriendly,
      amenities: defaultAmenities(stars, area.name),
      rooms: defaultRooms(stars),
      _coverKey: coverImageKey(globalIdx)
    };
  }

  function generateCitySpecs(cityId) {
    const city = window.TRAVEL_CITIES?.getCity(cityId);
    if (!city) return [];
    const cityMn = city.name_mn;
    const areas = window.HOTEL_AREAS?.getAreas(cityId) || [];
    const target = CITY_HOTEL_TARGETS[cityId] || DEFAULT_HOTEL_COUNT;
    const specs = [];
    let globalIdx = 0;

    for (let i = 0; i < target; i++) {
      const area = areas[i % areas.length];
      const idx = Math.floor(i / areas.length);
      specs.push(generateHotelSpec(cityId, cityMn, area, idx, globalIdx++));
    }

    return specs;
  }

  const CITY_HOTELS = {};
  function ensureCityHotels(cityId) {
    const id = window.TRAVEL_CITIES?.normalizeCity(cityId) || cityId;
    if (!CITY_HOTELS[id]) CITY_HOTELS[id] = generateCitySpecs(id);
    return CITY_HOTELS[id];
  }

  function buildHotel(cityId, spec, idx, nights) {
    const city = window.TRAVEL_CITIES?.getCity(cityId);
    if (!city) return null;
    const country = window.TRAVEL_CITIES?.getCountry(city.country_id) || {};
    const nightsNum = Math.max(1, Number(nights) || 1);
    const images = assignImages(city.country_id, cityId, idx);
    const coverKey = spec._coverKey || "exterior";
    const baseAmenities = spec.amenities || [];
    const rooms = (spec.rooms || []).map((room, roomIdx) => ({
      name: room.name,
      beds: room.beds,
      image: roomIdx % 2 === 0 ? images.standard_room : images.deluxe_room,
      amenities: [...new Set([...(room.amenities || []), ...baseAmenities.slice(0, 4)])]
    }));
    const images_list = IMAGE_KEYS.map((k) => images[k]);
    const supplierRef = `SUP-${city.country_id.toUpperCase()}-${cityId.toUpperCase()}-${String(idx + 1).padStart(3, "0")}`;

    const metroDist = spec.distance_to_metro_m
      ? `${spec.distance_to_metro_m} м`
      : "";
    const attrDist = spec.distance_to_attraction_km
      ? `${spec.distance_to_attraction_km} км`
      : "";

    return {
      id: `${cityId}_hotel_${idx + 1}`,
      type: "hotel",
      country_id: city.country_id,
      city_id: cityId,
      name_en: spec.name_en,
      description_mn: spec.description_mn,
      district: spec.district,
      area_name: spec.area_name,
      stars: spec.stars,
      address: `${spec.area_name}, ${spec.district}, ${city.name_en}`,
      nearby_landmarks: spec.nearby_landmarks || [],
      nearby_metro: spec.nearby_metro || "",
      distance_to_metro_m: spec.distance_to_metro_m || 9999,
      distance_to_airport_km: spec.distance_to_airport_km || 99,
      distance_to_center_km: spec.distance_to_center_km || 99,
      distance_to_attraction_km: spec.distance_to_attraction_km || 99,
      latitude: spec.latitude,
      longitude: spec.longitude,
      metro_distance: metroDist,
      attraction_distance: attrDist,
      breakfast: Boolean(spec.breakfast),
      free_cancellation: Boolean(spec.free_cancellation),
      family_friendly: Boolean(spec.family_friendly),
      images,
      images_list,
      cover_key: coverKey,
      rooms,
      amenities: baseAmenities,
      map_url: window.TRAVEL_CITIES?.cityMapUrl(cityId, spec.name_en) || "https://www.google.com/maps",
      nights: nightsNum,
      original_price: Math.round((Number(spec.price_per_night) || 0) * nightsNum),
      currency: country.currency || "USD",
      internal_supplier_reference: supplierRef
    };
  }

  function matchText(hotel, q) {
    if (!q) return true;
    const hay = [
      hotel.name_en,
      hotel.district,
      hotel.area_name,
      hotel.address,
      hotel.description_mn,
      hotel.nearby_metro,
      ...(hotel.nearby_landmarks || [])
    ].join(" ").toLowerCase();
    return q.split(/\s+/).filter(Boolean).every((word) => hay.includes(word.toLowerCase()));
  }

  function filterHotels(hotels, filters) {
    let list = hotels.slice();
    const f = filters || {};

    const area = String(f.area || f.district || "").trim();
    const keyword = String(f.keyword || "").trim();
    const district = String(f.district || "").trim();
    const minStars = Number(f.minStars || f.stars || 0);
    const maxStars = Number(f.maxStars || 0);
    const priceMin = Number(f.priceMin || 0);
    const priceMax = Number(f.priceMax || 0);

    if (area) {
      list = list.filter((h) => window.HOTEL_AREAS?.hotelMatchesArea(h, area));
    } else if (district) {
      const d = district.toLowerCase();
      list = list.filter((h) =>
        String(h.district || "").toLowerCase().includes(d) ||
        String(h.area_name || "").toLowerCase().includes(d)
      );
    }

    if (f.nearLandmark) {
      const lm = String(f.nearLandmark).trim();
      list = list.filter((h) => matchText(h, lm) || window.HOTEL_AREAS?.hotelMatchesArea(h, lm));
    }

    if (f.nearMetro === true || f.nearMetro === "true" || f.nearMetro === "1") {
      list = list.filter((h) => h.distance_to_metro_m <= 800);
    }

    if (f.nearAirport === true || f.nearAirport === "true" || f.nearAirport === "1") {
      list = list.filter((h) => h.distance_to_airport_km <= 15);
    }

    if (f.nearAttraction === true || f.nearAttraction === "true" || f.nearAttraction === "1") {
      list = list.filter((h) => h.distance_to_attraction_km <= 2);
    }

    if (keyword) list = list.filter((h) => matchText(h, keyword));

    if (minStars > 0) list = list.filter((h) => Number(h.stars) >= minStars);
    if (maxStars > 0) list = list.filter((h) => Number(h.stars) <= maxStars);

    if (f.breakfast === true || f.breakfast === "true" || f.breakfast === "1") {
      list = list.filter((h) => h.breakfast);
    }
    if (f.freeCancellation === true || f.freeCancellation === "true" || f.freeCancellation === "1") {
      list = list.filter((h) => h.free_cancellation);
    }
    if (f.familyFriendly === true || f.familyFriendly === "true" || f.familyFriendly === "1") {
      list = list.filter((h) => h.family_friendly);
    }

    if (priceMin > 0) list = list.filter((h) => (h.original_price || 0) >= priceMin);
    if (priceMax > 0) list = list.filter((h) => (h.original_price || 0) <= priceMax);

    const sort = f.sort || "recommended";
    if (sort === "stars_desc") list.sort((a, b) => b.stars - a.stars);
    else if (sort === "metro_asc") list.sort((a, b) => a.distance_to_metro_m - b.distance_to_metro_m);
    else if (sort === "attraction_asc") list.sort((a, b) => a.distance_to_attraction_km - b.distance_to_attraction_km);

    return list;
  }

  function getDistricts(cityId) {
    return window.HOTEL_AREAS?.getDistricts(cityId) || [];
  }

  function getAreas(cityId) {
    return window.HOTEL_AREAS?.getAreaNames(cityId) || [];
  }

  function search(cityId, nights, filters) {
    const normalized = window.TRAVEL_CITIES?.normalizeCity(cityId) || cityId;
    const specs = ensureCityHotels(normalized);
    const hotels = specs
      .map((spec, idx) => buildHotel(normalized, spec, idx, nights))
      .filter((hotel) => hotel && hotel.city_id === normalized);
    return filterHotels(hotels, filters || {});
  }

  window.HOTELS_CATALOG = {
    HOTEL_STOCK,
    CITY_HOTEL_TARGETS,
    FALLBACK_IMG,
    assignImages,
    buildHotel,
    getDistricts,
    getAreas,
    filterHotels,
    search,
    ensureCityHotels
  };
})();
