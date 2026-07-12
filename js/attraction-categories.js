/**
 * Attraction categories — single frontend source (mirrors attraction-mock.js)
 */
(function (root) {
  const ATTRACTION_CATEGORIES = [
    { value: "all", icon: "🎫", label_mn: "Бүх үзвэр" },
    { value: "history_culture", icon: "🏛️", label_mn: "Түүх, соёл" },
    { value: "museum", icon: "🎨", label_mn: "Музей" },
    { value: "temple", icon: "🏯", label_mn: "Сүм, хийд" },
    { value: "nature", icon: "🌳", label_mn: "Байгаль" },
    { value: "theme_park", icon: "🎡", label_mn: "Зугаа цэнгэлийн парк" },
    { value: "shopping", icon: "🛍", label_mn: "Худалдаа, зах" },
    { value: "night_activity", icon: "🌃", label_mn: "Шөнийн аялал" },
    { value: "family", icon: "👨‍👩‍👧", label_mn: "Хүүхэдтэй гэр бүл" },
    { value: "free", icon: "🆓", label_mn: "Үнэгүй үзвэр" },
    { value: "landmark", icon: "📸", label_mn: "Дурсгалт газар" },
    { value: "beach", icon: "🏖", label_mn: "Далайн эрэг" },
    { value: "mountain", icon: "🏔", label_mn: "Уул" },
    { value: "zoo", icon: "🦁", label_mn: "Амьтны хүрээлэн" },
    { value: "aquarium", icon: "🐠", label_mn: "Аквариум" }
  ];

  const CATEGORY_ALIASES = {
    city_view: "landmark",
    day_trip: "nature"
  };

  const CATEGORY_IMAGES = {
    history_culture: "/images/routes/china/forbidden-city.jpg",
    museum: "/images/routes/china/shanghai-museum.jpg",
    temple: "/images/routes/china/temple-heaven.jpg",
    nature: "/images/routes/china/west-lake.jpg",
    theme_park: "/images/routes/china/disney.jpg",
    zoo: "/images/routes/china/panda.jpg",
    aquarium: "/images/routes/china/bund-night.jpg",
    shopping: "/images/routes/china/nanjing-road.jpg",
    landmark: "/images/routes/china/shanghai-bund.jpg",
    night_activity: "/images/routes/china/bund-night.jpg",
    family: "/images/routes/china/disney.jpg",
    free: "/images/routes/china/yu-garden.jpg",
    beach: "/images/routes/vietnam/hoian.jpg",
    mountain: "/images/routes/china/west-lake.jpg"
  };

  function normalizeCategory(cat) {
    return CATEGORY_ALIASES[cat] || cat || "history_culture";
  }

  function categoryLabelMn(value) {
    const v = normalizeCategory(value);
    const hit = ATTRACTION_CATEGORIES.find((c) => c.value === v);
    return hit ? hit.label_mn : value || "";
  }

  function categoryIcon(value) {
    const v = normalizeCategory(value);
    return ATTRACTION_CATEGORIES.find((c) => c.value === v)?.icon || "🎫";
  }

  function categoryImage(value) {
    return CATEGORY_IMAGES[normalizeCategory(value)] || CATEGORY_IMAGES.history_culture;
  }

  function popularityStars(score) {
    const n = Math.min(5, Math.max(1, Math.round((Number(score) || 50) / 20)));
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function populateCategorySelect(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = ATTRACTION_CATEGORIES.map((c) =>
      `<option value="${c.value}">${c.icon} ${c.label_mn}</option>`
    ).join("");
  }

  root.AttractionCategories = {
    ATTRACTION_CATEGORIES,
    CATEGORY_IMAGES,
    normalizeCategory,
    categoryLabelMn,
    categoryIcon,
    categoryImage,
    popularityStars,
    populateCategorySelect
  };
})(typeof window !== "undefined" ? window : global);
