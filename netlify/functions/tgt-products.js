exports.handler = async () => {
  try {
    const baseUrl = process.env.TGT_BASE_URL?.trim();
    const accountId = process.env.TGT_ACCOUNT_ID?.trim();
    const secret = process.env.TGT_SECRET?.trim();

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

    if (tokenData.code !== "0000") {
      return {
        statusCode: 500,
        body: JSON.stringify({
          step: "token",
          error: tokenData
        })
      };
    }

    const accessToken = tokenData.data.accessToken;

    const productRes = await fetch(`${baseUrl}/eSIMApi/v2/products/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        pageNum: 1,
        pageSize: 100,
        lang: "en"
      })
    });

    const products = await productRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify(products)
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
