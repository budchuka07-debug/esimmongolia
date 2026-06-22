exports.handler = async (event) => {
  try {
    const orderNo =
      event.queryStringParameters?.orderNo;

    if (!orderNo) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "orderNo required"
        })
      };
    }

    const baseUrl = process.env.TGT_BASE_URL;
    const accountId = process.env.TGT_ACCOUNT_ID;
    const secret = process.env.TGT_SECRET;

    // Token авах
    const tokenRes = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        accountId,
        secret
      })
    });

    const tokenData = await tokenRes.json();

    const accessToken =
      tokenData?.data?.accessToken;

    if (!accessToken) {
      return {
        statusCode: 500,
        body: JSON.stringify(tokenData)
      };
    }

    // Order query
    const detailRes = await fetch(
      `${baseUrl}/eSIMApi/v2/order/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json;charset=UTF-8",
          "Accept": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          orderNo
        })
      }
    );

    const detailData =
      await detailRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify(detailData)
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
