const fetch = require("node-fetch");

exports.handler = async function () {
  try {
    const tokenRes = await fetch("https://api.airhubapp.com/api/Token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.AIRHUB_USERNAME,
        password: process.env.AIRHUB_PASSWORD
      })
    });

    const tokenData = await tokenRes.json();
    const token = tokenData.token;

    const plansRes = await fetch(
      "https://api.airhubapp.com/api/Plan/GetPlanInformation",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const plansData = await plansRes.json();
    const plans = plansData.getInformation || [];

    const map = {};

    plans.forEach(plan => {
      // 🔥 ISO code зөв унших
      const code =
        plan.countryCode ||
        plan.CountryCode ||
        plan.country_code ||
        plan.countrycode ||
        plan.Countrycode ||
        plan.iso2 ||
        plan.ISO2 ||
        plan.countryIso2 ||
        plan.CountryIso2 ||
        "";

      if (!code) return;

      const name = plan.countryName || plan.CountryName || code;

      if (!map[code]) {
        map[code] = {
          code: code.toUpperCase(),
          name,
          continent: detectContinent(code),
          flag: flagFromCode(code),
          fromPrice: Number(plan.price || 0)
        };
      } else {
        const price = Number(plan.price || 0);
        if (price < map[code].fromPrice) {
          map[code].fromPrice = price;
        }
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        countries: Object.values(map),
        totalCountries: Object.keys(map).length,
        totalPlans: plans.length
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

// 🌍 Continent detection
function detectContinent(code) {
  const asia = ["CN","JP","KR","TH","VN","MY","PH","SG","ID","TW"];
  const europe = ["FR","DE","IT","ES","NL","UK","TR"];
  const africa = ["ZA","KE","NG","TZ","UG","ZM"];
  const americas = ["US","CA","BR","MX"];
  const oceania = ["AU","NZ"];

  if (asia.includes(code)) return "Asia";
  if (europe.includes(code)) return "Europe";
  if (africa.includes(code)) return "Africa";
  if (americas.includes(code)) return "Americas";
  if (oceania.includes(code)) return "Oceania";

  return "Other";
}

// 🇨🇳 Flag generator
function flagFromCode(code) {
  return code
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt())
    );
}
