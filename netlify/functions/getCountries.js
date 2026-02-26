const fetch = require("node-fetch");

exports.handler = async function () {
  try {
    // 1️⃣ Airhub Token авах
    const tokenRes = await fetch("https://api.airhubapp.com/api/Token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.AIRHUB_USERNAME,
        password: process.env.AIRHUB_PASSWORD
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Airhub token авах боломжгүй" })
      };
    }

    const token = tokenData.token;

    // 2️⃣ Бүх plan татах
    const plansRes = await fetch(
      "https://api.airhubapp.com/api/Plan/GetPlanInformation",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const plansData = await plansRes.json();
    const plans = plansData.getInformation || [];

    // 3️⃣ Улсууд map үүсгэх
    const countryMap = {};

    plans.forEach(plan => {
      // 🔥 ISO2 code зөв унших (хамгийн чухал хэсэг)
      const code = (
        plan.countryCode ||
        plan.CountryCode ||
        plan.country_code ||
        plan.countrycode ||
        plan.Countrycode ||
        plan.iso2 ||
        plan.ISO2 ||
        plan.countryIso2 ||
        plan.CountryIso2 ||
        ""
      ).toUpperCase().trim();

      if (!code) return;

      const name =
        plan.countryName ||
        plan.CountryName ||
        plan.country_name ||
        code;

      const price = Number(plan.price || 0);

      if (!countryMap[code]) {
        countryMap[code] = {
          code,
          name,
          continent: detectContinent(code),
          flag: flagFromCode(code),
          fromPrice: price
        };
      } else {
        if (price < countryMap[code].fromPrice) {
          countryMap[code].fromPrice = price;
        }
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        countries: Object.values(countryMap),
        totalCountries: Object.keys(countryMap).length,
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

//
// 🌍 Continent detection (энгийнаар)
//
function detectContinent(code) {
  const asia = ["CN","JP","KR","TH","VN","MY","PH","SG","ID","TW","HK"];
  const europe = ["FR","DE","IT","ES","NL","UK","TR","CH","PL"];
  const africa = ["ZA","KE","NG","TZ","UG","ZM","EG"];
  const americas = ["US","CA","BR","MX","AR"];
  const oceania = ["AU","NZ"];

  if (asia.includes(code)) return "Asia";
  if (europe.includes(code)) return "Europe";
  if (africa.includes(code)) return "Africa";
  if (americas.includes(code)) return "Americas";
  if (oceania.includes(code)) return "Oceania";

  return "Other";
}

//
// 🇨🇳 Flag generator (ISO2 → Emoji)
//
function flagFromCode(code) {
  return code
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt())
    );
}
