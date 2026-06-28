/**
 * Admin order actions — availability, QPay, voucher, complete
 */
const ordersStore = require("./lib/orders-store");
const hohhotHotels = require("./lib/hohhot-hotels");

function checkAdmin(event) {
  const secret = process.env.ADMIN_SECRET || "esim-admin-dev";
  const hdr = event.headers.authorization || event.headers.Authorization || "";
  const token = hdr.replace(/^Bearer\s+/i, "").trim();
  let bodyKey = "";
  try {
    bodyKey = JSON.parse(event.body || "{}").admin_key || "";
  } catch { /* ignore */ }
  return token === secret || bodyKey === secret;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors(), body: "" };
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });
  if (!checkAdmin(event)) return json(401, { error: "Unauthorized" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const orderId = String(body.orderId || "").trim();
  const action = String(body.action || "").trim();
  if (!orderId || !action) return json(400, { error: "orderId and action required" });

  const order = await ordersStore.getOrder(orderId);
  if (!order) return json(404, { error: "Order not found" });

  try {
    const result = await runAction(order, action, body);
    return json(200, result);
  } catch (err) {
    return json(400, { error: err.message });
  }
};

async function runAction(order, action, body) {
  const now = new Date().toISOString();
  const patch = {};
  let message = "";
  let alternatives = [];

  switch (action) {
    case "open_supplier":
      return {
        ok: true,
        action,
        supplier_url: order.supplier_internal?.supplier_url || null,
        message: "Supplier link returned"
      };

    case "availability_ok":
      patch.status = order.status === "new" ? "quoted" : order.status;
      patch.availability_status = "available";
      patch.last_checked_at = now;
      message = "Боломжтой — QPay илгээж болно";
      break;

    case "sold_out":
      patch.status = "sold_out";
      patch.availability_status = "sold_out";
      patch.last_checked_at = now;
      if (order.city_id === "hohhot" && order.hotel_id) {
        alternatives = hohhotHotels.findAlternatives(order.hotel_id, { limit: 4 }).map((h) => ({
          id: h.id,
          official_name: h.official_name,
          area_name: h.area_name,
          stars: h.stars,
          final_price_mnt: h.final_price_mnt,
          supplier_url: h.supplier_reference?.supplier_url
        }));
      }
      message = "Sold out — ижил төстэй буудлууд санал болгоно";
      break;

    case "send_qpay":
      patch.status = "awaiting_payment";
      message = "QPay илгээх — admin panel эсвэл qpay-create-invoice ашиглана";
      break;

    case "mark_paid":
      patch.status = "paid";
      patch.paid_at = now;
      message = "Төлбөр төлөгдсөн";
      break;

    case "booking_done":
      patch.status = "booked";
      if (body.internal_notes) patch.internal_notes = body.internal_notes;
      message = "Supplier дээр захиалга хийгдсэн";
      break;

    case "upload_voucher":
      patch.voucher_url = String(body.voucher_url || "").trim();
      if (!patch.voucher_url) throw new Error("voucher_url required");
      patch.status = order.status === "paid" || order.status === "booked" ? "processing" : order.status;
      message = "Voucher хадгалагдлаа";
      break;

    case "send_voucher":
      if (!order.voucher_url && !body.voucher_url) throw new Error("Voucher URL байхгүй");
      patch.voucher_url = body.voucher_url || order.voucher_url;
      patch.voucher_sent_at = now;
      message = "Voucher илгээгдсэн (WhatsApp / email гараар)";
      break;

    case "complete":
      patch.status = "completed";
      message = "Захиалга дууссан";
      break;

    case "save_notes":
      patch.internal_notes = String(body.internal_notes || "");
      message = "Тэмдэглэл хадгалагдлаа";
      break;

    default:
      throw new Error(`Unknown action: ${action}`);
  }

  if (body.internal_notes && action !== "save_notes") {
    patch.internal_notes = body.internal_notes;
  }

  const updated = await ordersStore.updateOrder(order.orderId, patch);

  return {
    ok: true,
    action,
    message,
    order: updated,
    alternatives,
    qpay_hint: action === "send_qpay" ? {
      orderId: order.orderId,
      amount: order.final_price_mnt,
      endpoint: "/.netlify/functions/qpay-create-invoice"
    } : null
  };
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
