const { fetchAllProducts, getTgtToken } = require("./tgt-lib");

exports.handler = async () => {
  try {
    const { tokenData } = await getTgtToken();
    const rawProducts = await fetchAllProducts();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        source: "TGT",
        tokenCode: tokenData.code,
        tokenMsg: tokenData.msg,
        total: rawProducts.length,
        productResult: { data: { list: rawProducts } },
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: err.message,
        details: err.tokenData || err.details || undefined,
      }),
    };
  }
};
