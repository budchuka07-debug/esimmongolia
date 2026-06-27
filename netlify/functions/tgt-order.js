const { createTgtOrder } = require("./tgt-lib");

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
        body: "",
      };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Only POST allowed" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const productCode = body.productCode;
    const email = body.email || "";
    const channelOrderNo = body.channelOrderNo || `ESIM-${Date.now()}`;

    if (!productCode) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "productCode is required" }),
      };
    }

    const result = await createTgtOrder(productCode, email, channelOrderNo);

    return {
      statusCode: result.ok ? 200 : result.status || 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        source: "TGT",
        tokenCode: result.tokenData?.code,
        tokenMsg: result.tokenData?.msg,
        orderResult: result.orderData,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
