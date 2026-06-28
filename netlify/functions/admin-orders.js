/**
 * Admin orders API — list & detail (requires ADMIN_SECRET)
 */
const ordersStore = require("./lib/orders-store");
const hohhotHotels = require("./lib/hohhot-hotels");

function checkAdmin(event) {
  const secret = process.env.ADMIN_SECRET || "esim-admin-dev";
  const hdr = event.headers.authorization || event.headers.Authorization || "";
  const token = hdr.replace(/^Bearer\s+/i, "").trim();
  const q = event.queryStringParameters?.key || "";
  return token === secret || q === secret;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors(), body: "" };
  if (!checkAdmin(event)) return json(401, { error: "Unauthorized" });

  try {
    if (event.httpMethod === "GET") {
      const params = event.queryStringParameters || {};
      if (params.orderId) {
        const order = await ordersStore.getOrder(params.orderId);
        if (!order) return json(404, { error: "Not found" });
        return json(200, { order: enrichOrder(order) });
      }
      const orders = await ordersStore.listOrders({
        status: params.status || null,
        service_type: params.service_type || null
      });
      return json(200, { orders: orders.map(enrichOrder) });
    }
    return json(405, { error: "GET only" });
  } catch (err) {
    return json(500, { error: err.message });
  }
};

function enrichOrder(order) {
  const sup = order.supplier_internal || {};
  return {
    ...order,
    customer: {
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email
    },
    hotel: {
      city_id: order.city_id,
      destination: order.destination_city,
      official_name: order.hotel_official_name,
      room_type: order.room_type,
      check_in: order.check_in,
      check_out: order.check_out,
      guests: order.guest_count || order.people_count,
      final_price_mnt: order.final_price_mnt
    },
    supplier: {
      supplier_name: sup.supplier_name,
      supplier_hotel_id: sup.supplier_hotel_id,
      supplier_url: sup.supplier_url,
      supplier_price: sup.supplier_price,
      supplier_currency: sup.supplier_currency || "CNY",
      last_checked_at: order.last_checked_at || sup.last_checked_at,
      internal_notes: order.internal_notes || sup.internal_notes || ""
    }
  };
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };
}

function json(code, data) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json", ...cors() },
    body: JSON.stringify(data)
  };
}

exports.enrichOrder = enrichOrder;
