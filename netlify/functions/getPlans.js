// netlify/functions/getPlans.js
// GET /.netlify/functions/getPlans?code=CN
// GET /.netlify/functions/getPlans?group=global|asia|china

const {
  fetchAllProducts,
  normalizeProduct,
  productMatchesCountry,
  productMatchesGroup,
} = require("./tgt-lib");

function res(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(obj),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return res(200, { ok: true });
  if (event.httpMethod !== "GET") return res(405, { error: "Method Not Allowed" });

  const code = String(event.queryStringParameters?.code || "").trim().toUpperCase();
  const group = String(event.queryStringParameters?.group || "").trim().toLowerCase();

  if (!code && !group) {
    return res(400, {
      error: "Missing query",
      examples: ["/getPlans?code=CN", "/getPlans?group=global"],
    });
  }

  try {
    const rawProducts = await fetchAllProducts();
    const normalized = rawProducts.map(normalizeProduct);

    let filtered = normalized;
    if (code) {
      filtered = normalized.filter((p) => productMatchesCountry(p, code));
    } else if (group) {
      filtered = normalized.filter((p) => productMatchesGroup(p, group));
    }

    filtered.sort((a, b) => Number(a.price) - Number(b.price));

    if (group) {
      return res(200, {
        source: "TGT",
        group,
        plans: filtered,
        total: filtered.length,
      });
    }

    return res(200, {
      source: "TGT",
      getInformation: filtered,
      total: filtered.length,
    });
  } catch (e) {
    return res(500, {
      error: "Server error",
      message: String(e.message || e),
      details: e.tokenData || e.details || undefined,
    });
  }
};
