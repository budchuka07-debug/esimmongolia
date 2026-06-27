// Shared TGT API helpers for Netlify functions

const RESTCOUNTRIES_ALL =
  "https://restcountries.com/v3.1/all?fields=cca2,name,altSpellings";

const CODE_TO_NAME = {
  CN: "China",
  US: "United States",
  GB: "United Kingdom",
  UK: "United Kingdom",
  KR: "South Korea",
  JP: "Japan",
  TH: "Thailand",
  VN: "Vietnam",
  SG: "Singapore",
  HK: "Hong Kong",
  TW: "Taiwan",
  MY: "Malaysia",
  MN: "Mongolia",
};

function pick(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && v !== "") return v;
  }
  return "";
}

function normalizeName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/['']/g, "")
    .trim();
}

function flagFromCode(code) {
  const cc = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "";
  return cc.replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt()));
}

function detectContinent(code) {
  const c = String(code || "").toUpperCase();
  const asia = new Set([
    "CN", "JP", "KR", "MN", "TW", "HK", "MO", "SG", "TH", "VN", "MY", "PH", "ID", "IN",
    "KH", "LA", "MM", "BD", "NP", "LK", "PK", "KZ", "UZ", "KG", "TJ", "TM", "AE", "SA",
    "QA", "KW", "OM", "BH", "IL", "JO", "IQ", "IR", "TR",
  ]);
  const europe = new Set([
    "FR", "DE", "IT", "ES", "PT", "NL", "BE", "LU", "IE", "GB", "CH", "AT", "CZ", "PL",
    "HU", "SK", "SI", "HR", "RO", "BG", "GR", "SE", "NO", "FI", "DK", "IS", "EE", "LV",
    "LT", "UA", "MD", "RS", "BA", "ME", "AL", "MK", "CY", "MT",
  ]);
  const africa = new Set([
    "ZA", "EG", "MA", "TN", "DZ", "NG", "KE", "TZ", "UG", "ET", "GH", "CI", "SN", "CM",
    "ZW", "ZM", "MW", "MZ", "AO", "GA", "TD",
  ]);
  const america = new Set([
    "US", "CA", "MX", "BR", "AR", "CL", "CO", "PE", "EC", "UY", "PY", "BO", "VE", "GT",
    "CR", "PA", "DO", "JM", "BS",
  ]);
  const oceania = new Set(["AU", "NZ", "FJ", "PG", "SB", "VU"]);

  if (asia.has(c)) return "Asia";
  if (europe.has(c)) return "Europe";
  if (africa.has(c)) return "Africa";
  if (america.has(c)) return "America";
  if (oceania.has(c)) return "Oceania";
  return "Other";
}

async function getTgtToken() {
  const baseUrl = process.env.TGT_BASE_URL?.trim();
  const accountId = process.env.TGT_ACCOUNT_ID?.trim();
  const secret = process.env.TGT_SECRET?.trim();

  if (!baseUrl || !accountId || !secret) {
    throw new Error("Missing env: TGT_BASE_URL, TGT_ACCOUNT_ID, TGT_SECRET");
  }

  const tokenRes = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify({ accountId, secret }),
  });

  const tokenData = await tokenRes.json().catch(() => ({}));
  const accessToken =
    tokenData?.data?.accessToken ||
    tokenData?.data?.token ||
    tokenData?.accessToken ||
    tokenData?.token;

  if (!accessToken) {
    const err = new Error("TGT token failed");
    err.tokenData = tokenData;
    throw err;
  }

  return { baseUrl, accessToken, tokenData };
}

function extractProductList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const data = payload.data ?? payload.result ?? payload;
  if (Array.isArray(data)) return data;
  for (const key of ["list", "records", "rows", "items", "productList", "products"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function getTotalPages(payload, pageSize) {
  const data = payload?.data ?? payload;
  const total = Number(data?.total ?? data?.totalCount ?? data?.totalRecords ?? 0);
  const pages = Number(data?.pages ?? data?.totalPages ?? 0);
  if (pages > 0) return pages;
  if (total > 0 && pageSize > 0) return Math.ceil(total / pageSize);
  return 1;
}

async function fetchAllProducts() {
  const { baseUrl, accessToken } = await getTgtToken();
  const pageSize = 100;
  let pageNum = 1;
  let all = [];
  let totalPages = 1;

  do {
    const productRes = await fetch(`${baseUrl}/eSIMApi/v2/products/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ pageNum, pageSize, lang: "en" }),
    });

    const products = await productRes.json().catch(() => ({}));
    if (!productRes.ok) {
      const err = new Error("TGT products/list failed");
      err.details = products;
      throw err;
    }

    const list = extractProductList(products);
    all = all.concat(list);
    totalPages = getTotalPages(products, pageSize);
    if (!list.length) break;
    pageNum += 1;
  } while (pageNum <= totalPages && pageNum <= 50);

  return all;
}

function parsePrice(p) {
  const raw = pick(p, [
    "netPrice",
    "price",
    "portalPrice",
    "settlementPrice",
    "usdPrice",
    "retailPrice",
    "channelPrice",
    "cost",
    "salePrice",
  ]);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function getProductCountryCodes(p) {
  const codes = new Set();

  const single = pick(p, ["countryCode", "countrycode", "isoCode", "iso2", "iso", "regionCode"]);
  if (single) {
    const up = String(single).toUpperCase() === "UK" ? "GB" : String(single).toUpperCase();
    if (/^[A-Z]{2}$/.test(up)) codes.add(up);
  }

  const lists = [
    p.countryCodeList,
    p.countryList,
    p.countries,
    p.countryCodes,
    p.coverCountry,
    p.coverage,
  ];

  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item === "string") {
        const up = item.toUpperCase() === "UK" ? "GB" : item.toUpperCase();
        if (/^[A-Z]{2}$/.test(up)) codes.add(up);
      } else {
        const ic = pick(item, ["countryCode", "code", "iso", "cca2"]);
        const up = String(ic || "").toUpperCase();
        if (/^[A-Z]{2}$/.test(up)) codes.add(up === "UK" ? "GB" : up);
      }
    }
  }

  return [...codes];
}

function parseDataCapacity(p) {
  const name = String(pick(p, ["productName", "name", "title"]) || "").toLowerCase();
  const limited = String(p.dataLimited || "").toUpperCase();

  if (name.includes("unlimited") || limited === "N") {
    return { capacity: "Unlimited", capacityUnit: "" };
  }

  const dataTotal = p.dataTotal;
  const dataUnit = pick(p, ["dataUnit", "flowUnit", "capacityUnit", "unit"]) || "GB";
  if (dataTotal != null && dataTotal !== "") {
    return { capacity: String(dataTotal), capacityUnit: String(dataUnit).toUpperCase() };
  }

  const flow = pick(p, ["flow", "dataVolume", "data", "capacity", "flowSize", "packageFlow", "highFlowSize"]);
  const unit = pick(p, ["flowUnit", "dataUnit", "capacityUnit", "unit"]) || "GB";

  if (String(flow).toLowerCase().includes("unlimited") || name.includes("unlimited")) {
    return { capacity: "Unlimited", capacityUnit: "" };
  }

  if (flow) {
    const s = String(flow);
    const gb = s.match(/(\d+(?:\.\d+)?)\s*gb/i);
    const mb = s.match(/(\d+(?:\.\d+)?)\s*mb/i);
    if (gb) return { capacity: gb[1], capacityUnit: "GB" };
    if (mb) return { capacity: mb[1], capacityUnit: "MB" };
    const num = Number(flow);
    if (Number.isFinite(num)) {
      if (num >= 1024) return { capacity: String(Math.round((num / 1024) * 10) / 10), capacityUnit: "GB" };
      return { capacity: String(num), capacityUnit: String(unit || "GB").toUpperCase() };
    }
    return { capacity: s, capacityUnit: "" };
  }

  const fromName = name.match(/(\d+(?:\.\d+)?)\s*gb/);
  if (fromName) return { capacity: fromName[1], capacityUnit: "GB" };

  return { capacity: "", capacityUnit: "" };
}

function parseValidity(p) {
  const days = pick(p, [
    "usagePeriod",
    "validityPeriod",
    "validity",
    "period",
    "days",
    "effectiveDays",
    "validDays",
    "periodDays",
    "validityDays",
  ]);
  if (days) {
    const n = Number(days);
    if (Number.isFinite(n)) return { vaildity: String(n), validityType: "Days" };
    const m = String(days).match(/(\d+)/);
    if (m) return { vaildity: m[1], validityType: "Days" };
  }
  const name = String(pick(p, ["productName", "name"]) || "");
  const m = name.match(/(\d+)\s*days?/i);
  if (m) return { vaildity: m[1], validityType: "Days" };
  return { vaildity: "", validityType: "Days" };
}

function getProductCountryCode(p) {
  const codes = getProductCountryCodes(p);
  return codes.length === 1 ? codes[0] : "";
}

function getProductCountryName(p) {
  return String(pick(p, ["countryName", "country", "regionName", "areaName"]) || "").trim();
}

function normalizeProduct(p) {
  const productCode = String(pick(p, ["productCode", "code", "sku", "id"]) || "");
  const planName = String(pick(p, ["productName", "name", "title"]) || "eSIM");
  const price = parsePrice(p);
  const { capacity, capacityUnit } = parseDataCapacity(p);
  const { vaildity, validityType } = parseValidity(p);
  const countryCode = getProductCountryCode(p);
  const countryName = getProductCountryName(p);

  return {
    productCode,
    planCode: productCode,
    planName,
    price,
    capacity,
    capacityUnit,
    vaildity,
    validityType,
    countryCode,
    countryName,
    travel_date: "No Need",
    _raw: p,
  };
}

function productMatchesCountry(product, code) {
  const c = String(code || "").toUpperCase();
  const raw = product._raw || product;
  const codes = getProductCountryCodes(raw);
  if (product.countryCode === c || codes.includes(c)) return true;

  const combined = `${product.planName || ""} ${product.countryName || ""}`.toLowerCase();
  if (c === "CN" && combined.includes("china")) return true;
  if (c === "US" && (combined.includes("usa") || combined.includes("united states"))) return true;
  if (c === "GB" && (combined.includes("uk") || combined.includes("united kingdom"))) return true;

  return false;
}

function productMatchesGroup(product, group) {
  const g = String(group || "").toLowerCase();
  const raw = product._raw || product;
  const name = String(product.planName || "").toLowerCase();
  const region = String(
    pick(raw, ["region", "productType", "category", "area", "scope", "productCategory"]) || ""
  ).toLowerCase();
  const combined = `${name} ${region} ${product.countryCode || ""}`.toLowerCase();

  if (g === "china") {
    return product.countryCode === "CN" || combined.includes("china");
  }
  if (g === "asia") {
    return combined.includes("asia") || combined.includes("apac") || combined.includes("asia pacific");
  }
  if (g === "global") {
    return (
      combined.includes("global") ||
      combined.includes("world") ||
      combined.includes("multi-country") ||
      combined.includes("multicountry")
    );
  }
  return false;
}

async function buildRestCountriesNameMap() {
  const res = await fetch(RESTCOUNTRIES_ALL, { method: "GET" });
  const arr = await res.json().catch(() => []);
  const codeToName = new Map(Object.entries(CODE_TO_NAME));

  for (const item of Array.isArray(arr) ? arr : []) {
    const cca2 = item?.cca2;
    if (!cca2) continue;
    if (item?.name?.common) codeToName.set(cca2, item.name.common);
  }

  return codeToName;
}

function buildCountriesFromProducts(products, codeToName) {
  const byCode = new Map();

  for (const raw of products) {
    const p = normalizeProduct(raw);
    const codes = getProductCountryCodes(raw);

    for (const code of codes) {
      const name = p.countryName || codeToName.get(code) || CODE_TO_NAME[code] || code;
      const entry = byCode.get(code) || { code, name, fromPrice: null };
      if (!entry.name || entry.name === code) entry.name = name;
      if (p.price > 0 && (entry.fromPrice == null || p.price < entry.fromPrice)) {
        entry.fromPrice = p.price;
      }
      byCode.set(code, entry);
    }
  }

  return [...byCode.values()]
    .map((c) => ({
      code: c.code,
      name: c.name,
      continent: detectContinent(c.code),
      flag: flagFromCode(c.code),
      fromPrice: c.fromPrice,
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

async function createTgtOrder(productCode, email, channelOrderNo) {
  const { baseUrl, accessToken, tokenData } = await getTgtToken();

  const orderRes = await fetch(`${baseUrl}/eSIMApi/v2/order/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      productCode,
      email: email || "",
      channelOrderNo: channelOrderNo || `ESIM-${Date.now()}`,
      idempotencyKey:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }),
  });

  const orderData = await orderRes.json().catch(() => ({}));
  return { ok: orderRes.ok, status: orderRes.status, orderData, tokenData };
}

module.exports = {
  getTgtToken,
  fetchAllProducts,
  normalizeProduct,
  getProductCountryCodes,
  productMatchesCountry,
  productMatchesGroup,
  buildCountriesFromProducts,
  buildRestCountriesNameMap,
  createTgtOrder,
  flagFromCode,
  detectContinent,
  normalizeName,
};
