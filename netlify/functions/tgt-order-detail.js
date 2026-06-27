const { fetchOrderDetail, extractEsimQrFromOrder } = require("./tgt-lib");

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    const orderNo = event.queryStringParameters?.orderNo;
    if (!orderNo) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "orderNo required" }),
      };
    }

    const result = await fetchOrderDetail(orderNo);
    const qrCode = extractEsimQrFromOrder(result.detailData);

    return {
      statusCode: result.ok ? 200 : result.status || 500,
      headers: corsHeaders,
      body: JSON.stringify({
        source: "TGT",
        orderNo,
        qrCode,
        detail: result.detailData,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
