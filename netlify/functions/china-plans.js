// Хятад eSIM — china.html-тэй ижил supplier үнэ (TGT-д China-only багц байхгүй)

const USD_RATE = 3680;
const MARKUP = 1.4;

const SUPPLIER_PRICES = [
  { days: "7 хоног", daysNum: 7, gb1: 3.8, gb2: 6.23, gb3: 9.42, unlimited: 13.83 },
  { days: "14 хоног", daysNum: 14, gb1: 7.6, gb2: 12.46, gb3: 18.84, unlimited: 27.66 },
  { days: "21 хоног", daysNum: 21, gb1: 11.4, gb2: 18.69, gb3: 28.26, unlimited: 41.49 },
  { days: "30 хоног", daysNum: 30, gb1: 16.29, gb2: 26.7, gb3: 40.37, unlimited: 59.27 },
];

const DATA_LABELS = {
  gb1: "1GB / өдөр",
  gb2: "2GB / өдөр",
  gb3: "3GB / өдөр",
  unlimited: "Unlimited",
};

function sellPriceMnt(usd) {
  return Math.round((Number(usd) * USD_RATE * MARKUP) / 100) * 100;
}

function getChinaPlans() {
  const plans = [];

  for (const row of SUPPLIER_PRICES) {
    for (const key of ["gb1", "gb2", "gb3", "unlimited"]) {
      const usd = Number(row[key] || 0);
      if (!usd) continue;

      const code = `CHINA-${row.daysNum}D-${key.toUpperCase()}`;
      const isUnl = key === "unlimited";

      plans.push({
        productCode: code,
        planCode: code,
        planName: `🇨🇳 China eSIM — ${row.days} — ${DATA_LABELS[key]}`,
        price: usd,
        sellPriceMnt: sellPriceMnt(usd),
        capacity: isUnl ? "Unlimited" : key.replace("gb", ""),
        capacityUnit: isUnl ? "" : "GB/өдөр",
        dataLabel: DATA_LABELS[key],
        vaildity: String(row.daysNum),
        validityType: "хоног",
        daysLabel: row.days,
        activateLabel: "",
        countryCode: "CN",
        countryName: "China",
        travel_date: "No Need",
        source: "china-supplier",
        manualFulfillment: true,
      });
    }
  }

  return plans.sort((a, b) => Number(a.price) - Number(b.price));
}

function getChinaCountryEntry() {
  const plans = getChinaPlans();
  const prices = plans.map((p) => p.sellPriceMnt).filter((n) => n > 0);
  return {
    code: "CN",
    name: "China",
    fromPrice: prices.length ? Math.min(...prices) : null,
  };
}

module.exports = { getChinaPlans, getChinaCountryEntry, sellPriceMnt };
