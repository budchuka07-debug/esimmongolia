/** Customer-facing CNY → MNT (540 rate + 15% markup), aligned with travel-data.js */
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

const PRICE_FOOTNOTE = "Үнэ: 540₮/юань ханшаар, 15% үйлчилгээний хураамжтай MNT.";

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
