exports.handler = async () => {
  try {
    // Token авах
    const tokenRes = await fetch(
      `${process.env.TGT_BASE_URL}/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accountId: process.env.TGT_ACCOUNT_ID,
          secret: process.env.TGT_SECRET
        })
      }
    );

    const tokenData = await tokenRes.json();

    const accessToken = tokenData?.data?.accessToken;

    if (!accessToken) {
      return {
        statusCode: 500,
        body: JSON.stringify(tokenData)
      };
    }

    // Product жагсаалт авах
    const productRes = await fetch(
      `${process.env.TGT_BASE_URL}/eSIMApi/v2/products/list`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pageNum: 1,
          pageSize: 100,
          lang: "en"
        })
      }
    );

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
