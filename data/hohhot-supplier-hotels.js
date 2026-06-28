/**
 * Hohhot curated hotels — supplier_reference for admin booking channel
 * city_id architecture · customer never sees supplier fields
 */
(function (root, factory) {
  const data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  root.HOHHOT_SUPPLIER_HOTELS = data;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const IMG = (n) => `/images/hotels/exterior-${String(n).padStart(2, "0")}.jpg`;

  function hotel(spec) {
    return {
      type: "hotel",
      country_id: "china",
      city_id: "hohhot",
      currency: "CNY",
      ...spec,
      supplier_reference: spec.supplier_reference,
      internal_supplier_reference: spec.supplier_reference
    };
  }

  const HOTELS = [
    hotel({
      id: "hohhot_shangrila",
      official_name: "Shangri-La Hohhot",
      name_en: "Shangri-La Hohhot",
      area_name: "Xincheng District",
      district: "Xincheng",
      stars: 5,
      address: "Xincheng District, Hohhot",
      description_mn: "Shangri-La Hohhot — Хөх хотын люks 5 одтой зочид буудал. Xincheng төв, Dazhao Temple ойр.",
      images: [IMG(1), IMG(2), IMG(3), IMG(4)],
      images_list: [IMG(1), IMG(2), IMG(3), IMG(4)],
      cover_key: "exterior",
      price_per_night: 680,
      original_price: 680,
      final_price_mnt: 520000,
      nights: 1,
      rooms: [{ name: "Deluxe King Room", beds: "1 King Bed" }],
      amenities: ["Free WiFi", "Spa", "Restaurant", "Concierge"],
      breakfast: true,
      free_cancellation: true,
      family_friendly: true,
      latitude: 40.8589,
      longitude: 111.7654,
      distance_to_center_km: 2,
      distance_to_airport_km: 14,
      supplier_reference: {
        supplier_name: "Trip.com",
        supplier_url: "https://www.trip.com/hotels/hohhot-hotel-detail-345678/shangri-la-hohhot/",
        supplier_hotel_id: "345678",
        supplier_price: 680,
        supplier_currency: "CNY",
        last_checked_at: null
      }
    }),
    hotel({
      id: "hohhot_sheraton",
      official_name: "Sheraton Hohhot Hotel",
      name_en: "Sheraton Hohhot Hotel",
      area_name: "City Center",
      district: "Xincheng",
      stars: 5,
      address: "City Center, Hohhot",
      description_mn: "Sheraton Hohhot — Marriott брэнд, бизнес + аялалд тохиромжтой.",
      images: [IMG(5), IMG(6), IMG(7)],
      images_list: [IMG(5), IMG(6), IMG(7)],
      cover_key: "exterior",
      price_per_night: 620,
      original_price: 620,
      final_price_mnt: 480000,
      nights: 1,
      rooms: [{ name: "Superior Room", beds: "1 King Bed" }],
      amenities: ["Free WiFi", "Fitness Center", "Restaurant"],
      breakfast: true,
      free_cancellation: true,
      latitude: 40.8426,
      longitude: 111.7492,
      distance_to_center_km: 0.8,
      distance_to_airport_km: 15,
      supplier_reference: {
        supplier_name: "Booking.com",
        supplier_url: "https://www.booking.com/hotel/cn/sheraton-hohhot.en-gb.html",
        supplier_hotel_id: "sheraton-hohhot",
        supplier_price: 620,
        supplier_currency: "CNY",
        last_checked_at: null
      }
    }),
    hotel({
      id: "hohhot_wanda_vista",
      official_name: "Wanda Vista Hohhot",
      name_en: "Wanda Vista Hohhot",
      area_name: "Xincheng District",
      district: "Xincheng",
      stars: 5,
      address: "Xincheng, Hohhot",
      description_mn: "Wanda Vista — орчин үеийн люks буудал, хотын төвөөс ойр.",
      images: [IMG(8), IMG(9), IMG(10)],
      images_list: [IMG(8), IMG(9), IMG(10)],
      cover_key: "exterior",
      price_per_night: 580,
      original_price: 580,
      final_price_mnt: 445000,
      nights: 1,
      rooms: [{ name: "Deluxe Room", beds: "1 King Bed" }],
      amenities: ["Free WiFi", "Indoor Pool", "Restaurant"],
      breakfast: true,
      latitude: 40.8512,
      longitude: 111.7589,
      distance_to_center_km: 1.5,
      distance_to_airport_km: 13,
      supplier_reference: {
        supplier_name: "Qunar",
        supplier_url: "https://hotel.qunar.com/city/hohhot/wanda-vista/",
        supplier_hotel_id: "wanda-vista-hohhot",
        supplier_price: 580,
        supplier_currency: "CNY",
        last_checked_at: null
      }
    }),
    hotel({
      id: "hohhot_holiday_inn",
      official_name: "Holiday Inn Hohhot",
      name_en: "Holiday Inn Hohhot",
      area_name: "Railway Station Area",
      district: "Huimin",
      stars: 4,
      address: "Near Hohhot Railway Station",
      description_mn: "Holiday Inn — галт тэрэгний буудал ойр, Бээжин рүү HSR авахад тохиромжтой.",
      images: [IMG(11), IMG(2), IMG(4)],
      images_list: [IMG(11), IMG(2), IMG(4)],
      cover_key: "exterior",
      price_per_night: 380,
      original_price: 380,
      final_price_mnt: 295000,
      nights: 1,
      rooms: [{ name: "Standard Twin", beds: "2 Single Beds" }],
      amenities: ["Free WiFi", "Restaurant", "24/7 Front Desk"],
      breakfast: true,
      free_cancellation: true,
      latitude: 40.8289,
      longitude: 111.6589,
      distance_to_center_km: 4,
      distance_to_airport_km: 18,
      supplier_reference: {
        supplier_name: "Trip.com",
        supplier_url: "https://www.trip.com/hotels/hohhot-hotel-detail-456789/holiday-inn-hohhot/",
        supplier_hotel_id: "456789",
        supplier_price: 380,
        supplier_currency: "CNY",
        last_checked_at: null
      }
    }),
    hotel({
      id: "hohhot_jinjiang_inn",
      official_name: "Jinjiang Inn Hohhot",
      name_en: "Jinjiang Inn Hohhot",
      area_name: "Dazhao Temple Area",
      district: "Huimin",
      stars: 3,
      address: "Near Dazhao Temple",
      description_mn: "Jinjiang Inn — хямд, цэвэр, Dazhao Temple ойр.",
      images: [IMG(3), IMG(5), IMG(6)],
      images_list: [IMG(3), IMG(5), IMG(6)],
      cover_key: "exterior",
      price_per_night: 220,
      original_price: 220,
      final_price_mnt: 175000,
      nights: 1,
      rooms: [{ name: "Standard Room", beds: "1 Queen Bed" }],
      amenities: ["Free WiFi", "Daily Housekeeping"],
      breakfast: false,
      latitude: 40.7989,
      longitude: 111.6512,
      distance_to_center_km: 3,
      distance_to_airport_km: 17,
      supplier_reference: {
        supplier_name: "Direct",
        supplier_url: "https://www.jinjiang.com/en/hotels/hohhot",
        supplier_hotel_id: "jinjiang-hohhot-dazhao",
        supplier_price: 220,
        supplier_currency: "CNY",
        last_checked_at: null
      }
    }),
    hotel({
      id: "hohhot_atour",
      official_name: "Atour Hotel Hohhot",
      name_en: "Atour Hotel Hohhot",
      area_name: "City Center",
      district: "Xincheng",
      stars: 4,
      address: "Xincheng, Hohhot",
      description_mn: "Atour Hotel — дизайн зочид буудал, залуус, бизнес зорилгоор их сонгодог.",
      images: [IMG(7), IMG(8), IMG(9)],
      images_list: [IMG(7), IMG(8), IMG(9)],
      cover_key: "exterior",
      price_per_night: 320,
      original_price: 320,
      final_price_mnt: 248000,
      nights: 1,
      rooms: [{ name: "Atour King Room", beds: "1 King Bed" }],
      amenities: ["Free WiFi", "Library Lounge", "Laundry"],
      breakfast: true,
      latitude: 40.8456,
      longitude: 111.7523,
      distance_to_center_km: 1,
      distance_to_airport_km: 15,
      supplier_reference: {
        supplier_name: "Trip.com",
        supplier_url: "https://www.trip.com/hotels/hohhot-hotel-detail-567890/atour-hohhot/",
        supplier_hotel_id: "567890",
        supplier_price: 320,
        supplier_currency: "CNY",
        last_checked_at: null
      }
    }),
    hotel({
      id: "hohhot_hanting",
      official_name: "Hanting Hotel Hohhot",
      name_en: "Hanting Hotel Hohhot",
      area_name: "Railway Station Area",
      district: "Huimin",
      stars: 3,
      address: "Huimin District, Hohhot",
      description_mn: "Hanting (Huazhu) — хямд, цэвэр, галт тэрэгний буудал ойр.",
      images: [IMG(10), IMG(11), IMG(1)],
      images_list: [IMG(10), IMG(11), IMG(1)],
      cover_key: "exterior",
      price_per_night: 180,
      original_price: 180,
      final_price_mnt: 145000,
      nights: 1,
      rooms: [{ name: "Standard Room", beds: "1 Queen Bed" }],
      amenities: ["Free WiFi", "Air Conditioning"],
      breakfast: false,
      latitude: 40.8312,
      longitude: 111.6623,
      distance_to_center_km: 3.5,
      distance_to_airport_km: 17,
      supplier_reference: {
        supplier_name: "Qunar",
        supplier_url: "https://hotel.qunar.com/city/hohhot/hanting-huhehaote/",
        supplier_hotel_id: "hanting-hohhot",
        supplier_price: 180,
        supplier_currency: "CNY",
        last_checked_at: null
      }
    }),
    hotel({
      id: "hohhot_home_inn",
      official_name: "Home Inn Hohhot",
      name_en: "Home Inn Hohhot",
      area_name: "City Center",
      district: "Xincheng",
      stars: 2,
      address: "City Center, Hohhot",
      description_mn: "Home Inn — хамгийн хямд сонголтуудын нэг, төвөөс ойр.",
      images: [IMG(2), IMG(4), IMG(6)],
      images_list: [IMG(2), IMG(4), IMG(6)],
      cover_key: "exterior",
      price_per_night: 150,
      original_price: 150,
      final_price_mnt: 120000,
      nights: 1,
      rooms: [{ name: "Economy Room", beds: "1 Double Bed" }],
      amenities: ["Free WiFi"],
      breakfast: false,
      latitude: 40.8401,
      longitude: 111.7456,
      distance_to_center_km: 0.6,
      distance_to_airport_km: 15,
      supplier_reference: {
        supplier_name: "Direct",
        supplier_url: "https://www.homeinns.com/hotel/hohhot",
        supplier_hotel_id: "homeinn-hohhot-center",
        supplier_price: 150,
        supplier_currency: "CNY",
        last_checked_at: null
      }
    })
  ];

  function getAll() { return HOTELS.slice(); }

  function getById(id) {
    return HOTELS.find((h) => h.id === id) || null;
  }

  /** Similar hotels when sold out — same city, stars ±1, price ±35%, same area if possible */
  function findAlternatives(hotelId, opts) {
    const base = getById(hotelId);
    if (!base) return HOTELS.slice(0, 4);
    const stars = base.stars;
    const price = base.final_price_mnt;
    const area = base.area_name;
    const exclude = new Set([hotelId]);

    const score = (h) => {
      if (exclude.has(h.id)) return -1;
      let s = 0;
      if (Math.abs(h.stars - stars) <= 1) s += 3;
      if (Math.abs(h.final_price_mnt - price) / price <= 0.35) s += 2;
      if (h.area_name === area) s += 2;
      if (h.city_id === "hohhot") s += 1;
      return s;
    };

    return HOTELS
      .map((h) => ({ h, s: score(h) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, opts?.limit || 4)
      .map((x) => x.h);
  }

  /** Customer-safe hotel (no supplier fields) */
  function toPublic(h) {
    if (!h) return null;
    const { supplier_reference, internal_supplier_reference, ...pub } = h;
    return pub;
  }

  function searchPublic(nights) {
    const n = Math.max(1, Number(nights) || 1);
    return HOTELS.map((h) => {
      const pub = toPublic(h);
      pub.nights = n;
      pub.original_price = h.price_per_night * n;
      if (window.TRAVEL_DATA?.priceItem) {
        return window.TRAVEL_DATA.priceItem(pub);
      }
      pub.final_price_mnt = Math.round(h.final_price_mnt * n * 0.95);
      return pub;
    });
  }

  return { HOTELS, getAll, getById, findAlternatives, toPublic, searchPublic };
});
