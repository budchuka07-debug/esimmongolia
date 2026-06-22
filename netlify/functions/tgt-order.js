exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Only POST allowed" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const productCode = body.productCode;
    const email = body.email || "";

    if (!productCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "productCode is required" })
      };
    }

    const baseUrl = process.env.TGT_BASE_URL?.trim();
    const accountId = process.env.TGT_ACCOUNT_ID?.trim();
    const secret = process.env.TGT_SECRET?.trim();

    const tokenRes = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Accept": "application/json"
      },
      body: JSON.stringify({ accountId, secret })
    });

    const tokenData = await tokenRes.json();

    const accessToken =
      tokenData?.data?.accessToken ||
      tokenData?.data?.token ||
      tokenData?.accessToken ||
      tokenData?.token;

    if (!accessToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          step: "token",
          tokenData
        })
      };
    }

    const orderRes = await fetch(`${baseUrl}/eSIMApi/v2/order/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Accept": "application/json",
        "Authorization": accessToken
      },
      body: JSON.stringify({
        productCode,
        email,
        channelOrderNo: `ESIM-${Date.now()}`,
        idempotencyKey:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      })
    });

    const orderData = await orderRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        tokenCode: tokenData.code,
        tokenMsg: tokenData.msg,
        orderResult: orderData
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
