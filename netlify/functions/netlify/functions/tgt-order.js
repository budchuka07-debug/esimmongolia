exports.handler = async (event) => {
  try {
    const { productCode, email } = JSON.parse(event.body);

    const baseUrl = process.env.TGT_BASE_URL;
    const accountId = process.env.TGT_ACCOUNT_ID;
    const secret = process.env.TGT_SECRET;

    // Token авах
    const tokenRes = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      },
      body: JSON.stringify({
        accountId,
        secret
      })
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.data.accessToken;

    // Order үүсгэх
    const orderRes = await fetch(`${baseUrl}/eSIMApi/v2/order/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Authorization": accessToken
      },
      body: JSON.stringify({
        productCode,
        email,
        channelOrderNo: `ESIM-${Date.now()}`,
        idempotencyKey: crypto.randomUUID()
      })
    });

    const orderData = await orderRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify(orderData)
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
