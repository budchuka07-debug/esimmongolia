/**
 * Travel booking — persist order + QPay amount (hotel admin channel)
 */
const ordersStore = require("./lib/orders-store");
const hohhotHotels = require("./lib/hohhot-hotels");

const STATUS = "awaiting_payment";

function genRequestId() {
  const d = new Date();
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `EM-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(Math.floor(Math.random() * 100))}`;
}

function buildSupplierInternal(body, hotelMeta) {
  const raw = body.supplier_internal || body.supplier_reference || null;
  const ref = typeof raw === "object" ? raw : { ref: raw };
  const hotel = hotelMeta || {};
  const sup = hotel.supplier_reference || ref.supplier_reference || ref;

  return {
    supplier_name: sup.supplier_name || ref.supplier_name || null,
    supplier_hotel_id: sup.supplier_hotel_id || ref.supplier_hotel_id || ref.ref || null,
    supplier_url: sup.supplier_url || ref.supplier_url || null,
    supplier_price: sup.supplier_price || ref.supplier_price || null,
    supplier_currency: sup.supplier_currency || ref.supplier_currency || "CNY",
    last_checked_at: sup.last_checked_at || null,
    internal_notes: "",
    hotel_id: hotel.id || body.hotel_id || null,
    official_name: hotel.official_name || body.hotel_official_name || null
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(), body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "POST only" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const phone = String(body.customer_phone || body.phone || "").trim();
  const email = String(body.customer_email || body.email || "").trim();
  const name = String(body.customer_name || body.name || "").trim();

  if (!phone && !email) {
    return json(400, { error: "Утас эсвэл email заавал" });
  }

  const finalPriceMnt = Number(body.final_price_mnt || body.amount || 0);
  if (!finalPriceMnt || finalPriceMnt <= 0) {
    return json(400, { error: "Үнэ олдсонгүй" });
  }

  const orderId = genRequestId();
  const cityId = body.city_id || (String(body.destination_city || "").toLowerCase().includes("хөх") ? "hohhot" : null);
  const hotelId = body.hotel_id || null;
  const hotelMeta = hotelId ? hohhotHotels.getById(hotelId) : null;
  const selectedItem = String(body.selected_item || body.hotel_official_name || "").trim();

  const order = {
    orderId,
    status: STATUS,
    service_type: String(body.service_type || "hotel"),
    customer_name: name,
    customer_phone: phone,
    customer_email: email,
    destination_country: String(body.destination_country || body.country || "Хятад"),
    destination_city: String(body.destination_city || body.city || ""),
    city_id: cityId,
    hotel_id: hotelId,
    hotel_official_name: body.hotel_official_name || hotelMeta?.official_name || selectedItem,
    room_type: body.room_type || null,
    check_in: body.check_in || body.travel_date || body.travelDate || null,
    check_out: body.check_out || null,
    guest_count: Number(body.guest_count || body.people_count || body.people || 1) || 1,
    people_count: Number(body.people_count || body.people || 1) || 1,
    travel_date: body.travel_date || body.check_in || null,
    selected_item: selectedItem,
    extra_notes: String(body.extra_notes || body.notes || ""),
    final_price_mnt: finalPriceMnt,
    availability_status: "pending",
    supplier_internal: buildSupplierInternal(body, hotelMeta),
    created_at: new Date().toISOString()
  };

  try {
    await ordersStore.createOrder(order);
  } catch (err) {
    console.error("[travel-inquiry] store error", err.message);
  }

  console.log("[travel-booking-admin]", JSON.stringify({
    orderId,
    city_id: cityId,
    hotel: order.hotel_official_name,
    supplier: order.supplier_internal?.supplier_name
  }));

  const description = selectedItem
    ? `eSIM Mongolia: ${selectedItem}`.slice(0, 120)
    : `eSIM Mongolia захиалга ${orderId}`;

  return json(200, {
    ok: true,
    orderId,
    amount: finalPriceMnt,
    description
  });
};

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

function json(code, data) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json", ...cors() },
    body: JSON.stringify(data)
  };
}
