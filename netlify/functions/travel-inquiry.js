/** Travel booking — creates order + returns amount for immediate QPay */
const STATUS = "awaiting_payment";

function genRequestId() {
  const d = new Date();
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `EM-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(Math.floor(Math.random() * 100))}`;
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
  const selectedItem = String(body.selected_item || "").trim();

  // Supplier data — admin/logs only, never returned to client
  const adminRecord = {
    orderId,
    status: STATUS,
    service_type: String(body.service_type || "flight"),
    customer_name: name,
    customer_phone: phone,
    customer_email: email,
    destination_country: String(body.destination_country || body.country || ""),
    destination_city: String(body.destination_city || body.city || ""),
    travel_date: body.travel_date || body.travelDate || null,
    people_count: Number(body.people_count || body.people || 1) || 1,
    selected_item: selectedItem,
    extra_notes: String(body.extra_notes || body.notes || ""),
    final_price_mnt: finalPriceMnt,
    supplier_internal: body.supplier_internal || null,
    created_at: new Date().toISOString()
  };

  console.log("[travel-booking-admin]", JSON.stringify(adminRecord));

  // TODO: Supabase travel_requests insert (supplier_internal column)

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
