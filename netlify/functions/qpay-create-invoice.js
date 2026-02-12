export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { amount, description, orderId } = JSON.parse(event.body || "{}");
    if (!amount || !orderId) {
      return { statusCode: 400, body: JSON.stringify({ error: "amount, orderId required" }) };
    }

    // Access token авах (Postman collection дээр Basic auth ашиглаж байна)
    console.log("ENV CHECK", {
  hasUser: !!process.env.QPAY_USERNAME,
  hasPass: !!process.env.QPAY_PASSWORD,
  hasInvoiceCode: !!process.env.QPAY_INVOICE_CODE,
  hasBaseUrl: !!process.env.QPAY_BASE_URL,
});

    const user = process.env.QPAY_USERNAME;
    const pass = process.env.QPAY_PASSWORD;
    const basic = Buffer.from(`${user}:${pass}`).toString("base64");

    const authRes = await fetch("https://merchant.qpay.mn/v2/auth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
      },
    });

    if (!authRes.ok) {
      const t = await authRes.text();
      return { statusCode: 502, body: JSON.stringify({ error: "Auth failed", detail: t }) };
    }
console.log("TOKEN STATUS:", tr.status);
console.log("TOKEN BODY:", JSON.stringify(t));

    const authData = await authRes.json();
    const access_token = authData.access_token;
    if (!access_token) {
      return { statusCode: 502, body: JSON.stringify({ error: "No access_token", detail: authData }) };
    }

    const callbackUrl = `${process.env.SITE_URL}/.netlify/functions/qpay-callback`;

    // Invoice үүсгэх (simple)
    const invoiceRes = await fetch("https://merchant.qpay.mn/v2/invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        invoice_code: process.env.QPAY_INVOICE_CODE,
        sender_invoice_no: orderId,
        invoice_receiver_code: "terminal",
        invoice_description: description || "eSIM purchase",
        amount: Number(amount),
        callback_url: callbackUrl,
      }),
    });

    if (!invoiceRes.ok) {
      const t = await invoiceRes.text();
      return { statusCode: 502, body: JSON.stringify({ error: "Invoice create failed", detail: t }) };
    }

    const data = await invoiceRes.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_id: data.invoice_id,
        qr_text: data.qr_text,
        urls: data.urls,
      }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error", detail: String(e) }) };
  }
}
