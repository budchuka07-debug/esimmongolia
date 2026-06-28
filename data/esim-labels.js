/**
 * Shared eSIM daily-plan Mongolian labels
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ESIM_LABELS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DAILY_EXPLANATION =
    "Өдөр бүрийн дата тухайн өдөртөө ашиглагдаж, дараагийн өдөр дахин шинэчлэгдэнэ.";

  const DATA_LABELS = {
    gb1: "Өдөр бүр 1GB",
    gb2: "Өдөр бүр 2GB",
    gb3: "Өдөр бүр 3GB",
    unlimited: "Өдөр бүр хязгааргүй"
  };

  function formatDailyGb(gb) {
    return `Өдөр бүр ${gb}GB`;
  }

  function isDailyPlan(plan) {
    if (!plan) return false;
    const label = String(plan.dataLabel || "");
    const unit = String(plan.capacityUnit || "");
    if (label.includes("Өдөр бүр")) return true;
    if (unit.includes("өдөр") || unit.includes("/өдөр")) return true;
    return false;
  }

  return {
    DATA_LABELS,
    DAILY_EXPLANATION,
    formatDailyGb,
    isDailyPlan
  };
});
