/**
 * Daily FX rates → MNT per 1 unit of foreign currency (USD, CNY, …)
 * Uses open.er-api.com (USD base). Cached per UTC day in-memory.
 */
const FALLBACK = {
  date: null,
  source: "fallback",
  rates: {
    USD: 3680,
    CNY: 540,
    THB: 110,
    VND: 0.21,
    JPY: 24,
    KRW: 2.7,
    SGD: 2800,
    MYR: 780,
    IDR: 0.33,
    AED: 1000,
    TRY: 110
  }
};

let cache = { day: "", payload: null };

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchRates() {
  const day = utcDay();
  if (cache.day === day && cache.payload) return cache.payload;

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { Accept: "application/json" }
    });
    if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
    const data = await res.json();
    if (data.result !== "success" || !data.rates) throw new Error("FX bad payload");

    const usdMnt = Number(data.rates.MNT);
    if (!usdMnt || usdMnt <= 0) throw new Error("MNT rate missing");

    const rates = { USD: Math.round(usdMnt) };
    const map = ["CNY", "THB", "VND", "JPY", "KRW", "SGD", "MYR", "IDR", "AED", "TRY"];
    map.forEach((code) => {
      const perUsd = Number(data.rates[code]);
      if (perUsd > 0) {
        rates[code] = Math.round((usdMnt / perUsd) * 100) / 100;
      }
    });

    if (!rates.CNY) rates.CNY = FALLBACK.rates.CNY;

    const payload = {
      date: data.time_last_update_utc?.slice(0, 10) || day,
      source: "open.er-api.com",
      base: "USD",
      rates
    };
    cache = { day, payload };
    return payload;
  } catch (err) {
    console.warn("[exchange-rates]", err.message);
    const payload = {
      date: day,
      source: "fallback",
      base: "USD",
      rates: { ...FALLBACK.rates }
    };
    cache = { day, payload };
    return payload;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(), body: "" };
  }
  const data = await fetchRates();
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      ...cors()
    },
    body: JSON.stringify({ ok: true, ...data })
  };
};

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };
}
