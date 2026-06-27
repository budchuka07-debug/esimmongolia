// netlify/functions/getCountries.js
// TGT products/list-ээс улсуудын жагсаалт үүсгэнэ

const {
  fetchAllProducts,
  buildCountriesFromProducts,
  buildRestCountriesNameMap,
  flagFromCode,
  detectContinent,
} = require("./tgt-lib");
const { getChinaCountryEntry } = require("./china-plans");

function jsonRes(statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(bodyObj),
  };
}

function corsPreflight() {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
    body: "",
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return corsPreflight();
  if (event.httpMethod !== "GET") return jsonRes(405, { error: "Method Not Allowed" });

  try {
    const [rawProducts, codeToName] = await Promise.all([
      fetchAllProducts(),
      buildRestCountriesNameMap(),
    ]);

    let countries = buildCountriesFromProducts(rawProducts, codeToName);

    if (!countries.some((c) => c.code === "CN")) {
      const china = getChinaCountryEntry();
      countries.push({
        ...china,
        continent: detectContinent("CN"),
        flag: flagFromCode("CN"),
      });
      countries.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }

    return jsonRes(200, {
      countries,
      totalCountries: countries.length,
      totalPlans: rawProducts.length,
      source: "TGT",
      note: "getCountries: TGT products/list-ээс улсын жагсаалт үүсгэдэг.",
    });
  } catch (err) {
    return jsonRes(500, {
      error: "Server error",
      message: String(err.message || err),
      details: err.tokenData || err.details || undefined,
    });
  }
};
