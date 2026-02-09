export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { invoice_id } = JSON.parse(event.body || "{}");
    if (!invoice_id) {
      return { statusCode: 400, body: JSON.stringify({ error: "invoice_id required" }) };
    }

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

    const authData = await authRes.json();
    const access_token = authData.access_token;
    if (!access_token) {
      return { statusCode: 502, body: JSON.stringify({ error: "No access_token", detail: authData }) };
    }

    const checkRes = await fetch("https://merchant.qpay.mn/v2/payment/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        object_type: "INVOICE",
        object_id: invoice_id,
        offset: { page_number: 1, page_limit: 100 },
      }),
    });

    const data = await checkRes.json();

    const paid =
      Array.isArray(data?.rows) &&
      data.rows.some((p) => p.payment_status === "PAID");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid, raw: data }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "check failed", detail: String(e) }) };
  }
}