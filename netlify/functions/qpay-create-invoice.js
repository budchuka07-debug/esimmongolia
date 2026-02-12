// netlify/functions/qpay-create-invoice.js
// QPay: Token авах + Invoice үүсгэх + QR буцаах (Debug log-той)

exports.handler = async (event) => {
  // CORS хэрэгтэй бол (browser-оос дуудаж байгаа учраас)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ ok: false, error: "Method Not Allowed" }) };
  }

  try {
    // ===== ENV =====
    const username = process.env.QPAY_USERNAME;
    const password = process.env.QPAY_PASSWORD;
    const invoiceCode = process.env.QPAY_INVOICE_CODE;

    // Чиний өмнөх код "hasBaseUrl" гэж шалгаж байсан тул BASE_URL-г дэмжив.
    const baseUrl = process.env.BASE_URL || process.env.SITE_URL || "";

    console.log("ENV CHECK", {
      hasUser: !!username,
      hasPass: !!password,
      hasInvoiceCode: !!invoiceCode,
      hasBaseUrl: !!baseUrl,
    });

    if (!username || !password || !invoiceCode) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, error: "Missing env: QPAY_USERNAME / QPAY_PASSWORD / QPAY_INVOICE_CODE" }),
      };
    }

    // ===== INPUT =====
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      body = {};
    }

    const amount = Number(body.amount || 0);
    const orderId = String(body.orderId || `ORDER-${Date.now()}`);
    const description = String(body.description || "eSIM purchase");

    if (!amount || amount <= 0) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ ok: false, error: "Invalid amount" }) };
    }

    // ===== 1) TOKEN авах =====
    const basic = Buffer.from(`${username}:${password}`).toString("base64");

    const tr = await fetch("https://merchant.qpay.mn/v2/auth/token", {
      method: "POST",
      headers: { Authorization: `Basic ${basic}` },
    });

    const t = await tr.json().catch(() => ({}));

    // DEBUG
    console.log("TOKEN STATUS:", tr.status);
    // ⚠️ Token-ийг log хийх нь эрсдэлтэй. Алдаа олоод дуусмагц энэ мөрийг арилгаарай.
    // Хэрвээ бүр аюулгүй байлгамаар бол дараах мөрийг comment болго.
    console.log("TOKEN BODY:", JSON.stringify({ ...t, access_token: t.access_token ? "[REDACTED]" : undefined }));

    if (!tr.ok || !t.access_token) {
      return {
        statusCode: tr.status,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, step: "token", token_response: t }),
      };
    }

    // ===== 2) INVOICE үүсгэх =====
    // Callback URL одоохондоо optional. Хэрвээ baseUrl байхгүй бол callback_url огт явуулахгүй.
    const payload = {
      invoice_code: invoiceCode,
      sender_invoice_no: orderId,
      invoice_receiver_code: "terminal",
      invoice_description: description,
      amount: amount,
      ...(baseUrl ? { callback_url: `${baseUrl}/.netlify/functions/qpay-callback` } : {}),
    };

    const ir = await fetch("https://merchant.qpay.mn/v2/invoice", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const inv = await ir.json().catch(() => ({}));

    // DEBUG
    console.log("INVOICE STATUS:", ir.status);
    console.log("INVOICE BODY:", JSON.stringify(inv));

    if (!ir.ok || !inv.invoice_id || !inv.qr_image) {
      return {
        statusCode: ir.status,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, step: "invoice", invoice_response: inv }),
      };
    }

    // ===== SUCCESS =====
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        orderId,
        amount,
        invoice_id: inv.invoice_id,
        qr_text: inv.qr_text,
        qr_image: inv.qr_image, // base64 PNG
        urls: inv.urls || [],
      }),
    };
  } catch (e) {
    console.log("FATAL ERROR:", String(e));
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ ok: false, error: String(e) }) };
  }
};
