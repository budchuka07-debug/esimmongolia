/** Customer-facing CNY → MNT (internal markup applied; never expose % to customers) */
const FX_CNY = 540;
const MARKUP_PERCENT = 15;

function cnyToMnt(cny, rate = FX_CNY, markupPct = MARKUP_PERCENT) {
  const n = Number(cny);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round((n * rate * (1 + markupPct / 100)) / 100) * 100;
}

function formatMnt(mnt) {
  return `${Number(mnt).toLocaleString("en-US")}₮`;
}

function formatCnyRangeMnt(minCny, maxCny, suffix = "") {
  return `${formatMnt(cnyToMnt(minCny))}–${formatMnt(cnyToMnt(maxCny))}${suffix}`;
}

function formatCnyApproxMnt(cny, suffix = "") {
  return `~${formatMnt(cnyToMnt(cny))}${suffix}`;
}

function formatCnyMinPlusMnt(minCny) {
  return `${formatMnt(cnyToMnt(minCny))}+`;
}

/** Customer-safe disclaimer — never expose markup % or supplier rates */
const PRICE_FOOTNOTE = "Үнэ MNT-ээр ойролцоо — захиалах үед эцсийн дүн баталгаажна.";

module.exports = {
  FX_CNY,
  MARKUP_PERCENT,
  cnyToMnt,
  formatMnt,
  formatCnyRangeMnt,
  formatCnyApproxMnt,
  formatCnyMinPlusMnt,
  PRICE_FOOTNOTE
};
