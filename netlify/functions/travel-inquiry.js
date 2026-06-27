/** Travel inquiry — MVP (logs + returns ID). Wire to Supabase later. */
const STATUS = "new";

function genRequestId() {
  const d = new Date();
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `TR-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${p(Math.floor(Math.random() * 100))}`;
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

  const request = {
    requestId: genRequestId(),
    status: STATUS,
    service_type: String(body.service_type || "flight"),
    customer_name: name,
    customer_phone: phone,
    customer_email: email,
    destination_country: String(body.destination_country || body.country || ""),
    destination_city: String(body.destination_city || body.city || ""),
    travel_date: body.travel_date || body.travelDate || null,
    people_count: Number(body.people_count || body.people || 1) || 1,
    budget_mnt: body.budget_mnt ? Number(body.budget_mnt) : null,
    extra_notes: String(body.extra_notes || body.notes || ""),
    created_at: new Date().toISOString()
  };

  // TODO: Supabase insert into travel_requests
  console.log("[travel-inquiry]", JSON.stringify(request));

  return json(200, {
    ok: true,
    requestId: request.requestId,
    status: request.status,
    message: "Захиалгын хүсэлт хүлээн авлаа. Админ удахгүй холбогдоно."
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
