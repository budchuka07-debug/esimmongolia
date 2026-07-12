/**
 * Attractions module — save, itinerary, map, detail modal, filters
 */
(function (root) {
  const SAVED_KEY = "esm_saved_attractions";
  const ITINERARY_KEY = "esm_attraction_itinerary";
  const NOTICE = "Тасалбарын үнэ, ажиллах цагийг захиалга хийхийн өмнө дахин шалгана.";

  const $ = (id) => document.getElementById(id);
  const cats = () => root.AttractionCategories || {};
  const fmtMnt = (n) => new Intl.NumberFormat("mn-MN").format(Number(n || 0)) + "₮";

  let mapInstance = null;
  let mapCluster = null;
  let lastResults = [];

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function attractionKey(a) {
    return String(a.id || `${a.name_mn || a.name}-${a.city_id}`);
  }

  function isSaved(a) {
    const list = readJson(SAVED_KEY, []);
    const key = attractionKey(a);
    return list.some((x) => x.key === key);
  }

  function toggleSave(a) {
    const list = readJson(SAVED_KEY, []);
    const key = attractionKey(a);
    const idx = list.findIndex((x) => x.key === key);
    if (idx >= 0) list.splice(idx, 1);
    else {
      list.unshift({
        key,
        id: a.id,
        name: a.name_mn || a.name,
        city_id: a.city_id,
        saved_at: Date.now(),
        item: { ...a }
      });
    }
    writeJson(SAVED_KEY, list.slice(0, 120));
    return idx < 0;
  }

  function getItinerary() {
    return readJson(ITINERARY_KEY, { days: [[], [], []], city_id: null });
  }

  function addToItinerary(a) {
    const plan = getItinerary();
    const days = plan.days || [[], [], []];
    const key = attractionKey(a);
    const exists = days.some((d) => d.some((x) => x.key === key));
    if (exists) return { added: false, plan };

    let target = 0;
    const counts = days.map((d) => d.length);
    if (counts[0] <= 3) target = 0;
    else if (counts[1] <= 3) target = 1;
    else target = 2;

    const entry = {
      key,
      id: a.id,
      name: a.name_mn || a.name,
      district: a.district,
      duration: a.recommended_duration,
      category: a.category
    };
    days[target].push(entry);
    const next = { days, city_id: a.city_id || plan.city_id };
    writeJson(ITINERARY_KEY, next);
    return { added: true, plan: next, day: target + 1 };
  }

  function itinerarySummary() {
    const plan = getItinerary();
    return (plan.days || []).map((d, i) => {
      if (!d.length) return `Өдөр ${i + 1}: —`;
      return `Өдөр ${i + 1}: ${d.map((x) => x.name).join(" → ")}`;
    }).join("\n");
  }

  function attractionImg(a) {
    const AC = cats();
    const fb = AC.categoryImage?.(a.category) || "/images/routes/china/panda.jpg";
    const url = a.image_url || a.cover_image_url || a.image;
    if (root.TravelImages?.imgTag) {
      return root.TravelImages.imgTag(url, { kind: "attraction", size: "card", className: "tp-attraction-img", alt: a.name_mn || a.name, fallback: fb });
    }
    const src = root.TravelImages?.resolveTravelImage?.(url, fb) || fb;
    return `<img class="tp-attraction-img" src="${src}" alt="${a.name_mn || a.name}" loading="lazy" onerror="this.onerror=null;this.src='${fb}'">`;
  }

  function renderCard(a) {
    const AC = cats();
    const icon = AC.categoryIcon?.(a.category) || "🎫";
    const catLabel = a.category_label_mn || AC.categoryLabelMn?.(a.category) || a.category;
    const pop = AC.popularityStars?.(a.popularity_score) || "★★★☆☆";
    const isMock = a.is_mock || a.source === "local_mock" || a.source === "mock";
    const price = a.free_entry ? "Үнэгүй*" : (a.final_price_mnt != null ? fmtMnt(a.final_price_mnt) : "Тодорхойгүй");
    const saved = isSaved(a);
    const badges = [
      `<span class="tp-badge tp-badge-cat">${icon} ${catLabel}</span>`,
      a.family_friendly ? '<span class="tp-badge tp-badge-family">👨‍👩‍👧 Гэр бүл</span>' : "",
      a.free_entry ? '<span class="tp-badge tp-badge-free">🆓 Үнэгүй</span>' : "",
      a.indoor ? '<span class="tp-badge tp-badge-indoor">🏠 Дотор</span>' : "",
      isMock ? '<span class="tp-badge tp-badge-mock">Шалгах</span>' : '<span class="tp-badge tp-badge-verified">✓ Баталгаажсан</span>'
    ].filter(Boolean).join("");

    return `
      <article class="tp-attraction-card" data-item-id="${a.id}" data-lat="${a.latitude || ""}" data-lng="${a.longitude || ""}">
        <div class="tp-attraction-img-wrap">${attractionImg(a)}</div>
        <div class="tp-attraction-body">
          <div class="tp-attraction-pop">${pop}</div>
          <h4 class="tp-attraction-name">${a.name_mn || a.name}</h4>
          <p class="tp-attraction-meta">📍 ${a.city_name_mn || a.city || ""}${a.district ? ` · ${a.district}` : ""}</p>
          <div class="tp-attraction-facts">
            ${a.opening_hours ? `<span>🕐 ${a.opening_hours}</span>` : ""}
            ${a.recommended_duration ? `<span>⏱ ${a.recommended_duration}</span>` : ""}
          </div>
          <div class="tp-attraction-badges">${badges}</div>
          ${isMock ? `<p class="tp-mock-notice">${NOTICE}</p>` : ""}
          <div class="tp-card-price-row">
            <div><div class="tp-price-final">${price}</div><div class="tp-price-note">${isMock ? "Тооцоолсон үнэ" : ""}</div></div>
          </div>
          <div class="tp-attraction-actions">
            <button type="button" class="tp-btn tp-btn-sm" data-attr-action="map" data-item-id="${a.id}">🗺 Газраар</button>
            <button type="button" class="tp-btn tp-btn-sm" data-attr-action="itinerary" data-item-id="${a.id}">➕ Маршрут</button>
            <button type="button" class="tp-btn tp-btn-sm" data-attr-action="detail" data-item-id="${a.id}">Дэлгэрэнгүй</button>
            <button type="button" class="tp-btn tp-btn-sm primary" data-attr-action="ticket" data-item-id="${a.id}">🎫 Тасалбар</button>
            <button type="button" class="tp-btn tp-btn-sm tp-btn-save${saved ? " saved" : ""}" data-attr-action="save" data-item-id="${a.id}" aria-label="Хадгалах">${saved ? "❤️" : "🤍"}</button>
          </div>
        </div>
      </article>`;
  }

  function nearbyFromResults(item, results, field) {
    return (results || [])
      .filter((x) => x.id !== item.id)
      .slice(0, 4)
      .map((x) => x.name_mn || x.name);
  }

  function detailExtras(item, allResults) {
    const rainy = item.indoor ? "Бороотой өдөр тохиромжтой (дотор)" : "Цэвэр цагийг сонгоорой";
    const bestTime = item.indoor ? "Өглөө 10:00–12:00 эсвэл үдээс хойш" : "Өглөө эрт эсвэл үдшийн өмнө";
    return {
      best_visiting_time: item.best_visiting_time || bestTime,
      weather_note: item.weather_note || rainy,
      tips: item.tips || [
        "Очихоос өмнө ажиллах цаг, тасалбарын үнийг дахин шалгана уу.",
        item.booking_required ? "Урьдчилсан захиалга шаардлагатай байж болно." : "Ихэнхдээ шууд очих боломжтой."
      ],
      what_to_bring: item.what_to_bring || ["Утас, камер", "Ус", item.indoor ? "Хөнгөн хувцас" : "Нарны тос, гутал"],
      good_for_children: item.family_friendly ? "Тийм — гэр бүлд тохиромжтой" : "Хүүхдийн наснаас хамаарна",
      good_for_elderly: item.indoor || item.free_entry ? "Тийм — хялбар аялал" : "Алхах зай их байж болно",
      nearby_attractions: item.nearby_attractions || nearbyFromResults(item, allResults),
      nearby_restaurants: item.nearby_restaurants || ["Ойролцоох ресторан (шалгах)", "Хотын төвийн кафе"],
      nearby_metro: item.nearby_metro || (item.district ? `${item.district} метро (ойролцоо)` : "Метро — шалгах"),
      nearby_hotels: item.nearby_hotels || ["Төвийн буудлууд (санал авах)"]
    };
  }

  function galleryHtml(item) {
    const AC = cats();
    const fb = AC.categoryImage?.(item.category);
    const urls = root.TravelImages?.resolveGallery?.(item.gallery_urls || item.image_urls, fb) || [fb];
    return urls.slice(0, 6).map((u) =>
      `<img src="${u}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fb}'">`
    ).join("");
  }

  function mapUrl(item) {
    const q = encodeURIComponent(`${item.name_en || item.name} ${item.city_name_mn || item.city || ""}`);
    if (item.latitude && item.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  function openDetail(item, allResults) {
    const modal = $("attractionDetailModal");
    const bd = $("attractionDetailModalBd");
    const body = $("attractionDetailBody");
    if (!modal || !bd || !body) return;

    const AC = cats();
    const extra = detailExtras(item, allResults || lastResults);
    const isMock = item.is_mock || item.source === "local_mock";
    const price = item.free_entry ? "Үнэгүй (тооцоолсон)" : fmtMnt(item.final_price_mnt || item.estimated_price || 0);
    const icon = AC.categoryIcon?.(item.category) || "🎫";
    const catLabel = item.category_label_mn || AC.categoryLabelMn?.(item.category);

    body.innerHTML = `
      <div class="tp-attraction-detail-hero">${galleryHtml(item)}</div>
      <div class="tp-attraction-detail-main">
        <span class="tp-badge tp-badge-cat">${icon} ${catLabel}</span>
        <div class="tp-attraction-pop">${AC.popularityStars?.(item.popularity_score)}</div>
        <h3>${item.name_mn || item.name}</h3>
        <p class="tp-attraction-detail-loc">📍 ${item.city_name_mn || item.city}${item.district ? ` · ${item.district}` : ""}</p>
        <p class="tp-attraction-detail-desc">${item.description_mn || item.description || item.short_description || ""}</p>
        <ul class="tp-attraction-detail-facts">
          <li><strong>🕐 Ажиллах цаг:</strong> ${item.opening_hours || "Очихоос өмнө шалгана"}</li>
          <li><strong>⏱ Үргэлжлэх хугацаа:</strong> ${item.recommended_duration || "2 цаг"}</li>
          <li><strong>🌤 Сайн цаг:</strong> ${extra.best_visiting_time}</li>
          <li><strong>💰 Үнэ:</strong> ${price}${isMock ? " (тооцоолсон)" : ""}</li>
        </ul>
        <div class="tp-attraction-detail-badges">
          ${item.family_friendly ? '<span class="tp-badge">👨‍👩‍👧 Хүүхэдтэй</span>' : ""}
          ${item.free_entry ? '<span class="tp-badge">🆓 Үнэгүй</span>' : ""}
          ${item.indoor ? '<span class="tp-badge">🏠 Дотор</span>' : ""}
          ${item.booking_required ? '<span class="tp-badge">🎫 Захиалга</span>' : ""}
        </div>
        <div class="tp-attraction-detail-grid">
          <div><h4>Ойролцоо үзвэр</h4><p>${extra.nearby_attractions.join(" · ") || "—"}</p></div>
          <div><h4>Ресторан</h4><p>${extra.nearby_restaurants.join(" · ")}</p></div>
          <div><h4>Метро</h4><p>${extra.nearby_metro}</p></div>
          <div><h4>Буудал</h4><p>${extra.nearby_hotels.join(" · ")}</p></div>
        </div>
        <div class="tp-attraction-detail-block">
          <h4>🌦 Цаг агаар</h4>
          <p class="tp-muted">${extra.weather_note}. Очих өдрийн урьдчилсан мэдээ шалгана уу.</p>
        </div>
        <div class="tp-attraction-detail-block">
          <h4>💡 Зөвлөгөө</h4>
          <ul>${extra.tips.map((t) => `<li>${t}</li>`).join("")}</ul>
        </div>
        <div class="tp-attraction-detail-block">
          <h4>🎒 Юу авч явах вэ</h4>
          <p>${extra.what_to_bring.join(" · ")}</p>
          <p><strong>Хүүхэд:</strong> ${extra.good_for_children}</p>
          <p><strong>Настанд:</strong> ${extra.good_for_elderly}</p>
        </div>
        ${isMock ? `<p class="tp-mock-notice">${NOTICE}</p>` : ""}
        <div class="tp-attraction-detail-actions">
          <a class="tp-btn" href="${mapUrl(item)}" target="_blank" rel="noopener">🗺 Google Map</a>
          <button type="button" class="tp-btn" data-detail-action="itinerary">➕ Маршрутдаа нэмэх</button>
          <button type="button" class="tp-btn primary" data-detail-action="ticket">🎫 Тасалбар асуух</button>
        </div>
      </div>`;

    body.querySelector('[data-detail-action="itinerary"]')?.addEventListener("click", () => {
      const r = addToItinerary(item);
      if (r.added) {
        alert(`Өдөр ${r.day}-д нэмэгдлээ.\n\n${itinerarySummary()}`);
      } else alert("Энэ үзвэр маршрутад аль хэдийн байна.");
    });
    body.querySelector('[data-detail-action="ticket"]')?.addEventListener("click", () => {
      closeDetail();
      root.TravelBooking?.openBookingForm?.("attraction", root.TravelBooking?.buildAttractionBookingPreset?.(item) || {}, "Тасалбар асуух");
    });

    modal.style.display = "block";
    bd.style.display = "block";
  }

  function closeDetail() {
    const modal = $("attractionDetailModal");
    const bd = $("attractionDetailModalBd");
    if (modal) modal.style.display = "none";
    if (bd) bd.style.display = "none";
  }

  function destroyMap() {
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
      mapCluster = null;
    }
  }

  function renderMap(results, onMarkerClick) {
    const el = $("attractionMapCanvas");
    if (!el || !root.L) return false;

    destroyMap();
    const withCoords = (results || []).filter((a) => a.latitude != null && a.longitude != null);
    if (!withCoords.length) return false;

    const center = withCoords[0];
    mapInstance = root.L.map(el, { scrollWheelZoom: false }).setView([center.latitude, center.longitude], 12);
    root.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(mapInstance);

    const markers = root.L.markerClusterGroup ? new root.L.markerClusterGroup() : root.L.layerGroup();
    withCoords.forEach((a) => {
      const m = root.L.marker([a.latitude, a.longitude]);
      m.bindPopup(`<strong>${a.name_mn || a.name}</strong><br>${a.district || ""}`);
      m.on("click", () => onMarkerClick?.(a));
      markers.addLayer(m);
    });
    mapInstance.addLayer(markers);
    mapCluster = markers;
    setTimeout(() => mapInstance.invalidateSize(), 200);
    return true;
  }

  function collectFilters() {
    const sidebar = $("attractionFiltersSidebar");
    const fd = {};
    sidebar?.querySelectorAll("[data-afilter]").forEach((el) => {
      const key = el.dataset.afilter;
      if (el.type === "checkbox") fd[key] = el.checked ? "1" : "";
      else fd[key] = el.value;
    });
    const sortEl = $("attractionSortSelect");
    if (sortEl?.value) fd.sort = sortEl.value;
    return fd;
  }

  function clearFilters() {
    const sidebar = $("attractionFiltersSidebar");
    sidebar?.querySelectorAll("[data-afilter]").forEach((el) => {
      if (el.type === "checkbox") el.checked = false;
      else if (el.dataset.afilter !== "sort") el.value = "";
    });
  }

  function initUI(handlers) {
    $("attractionDetailModalBd")?.addEventListener("click", closeDetail);
    $("attractionDetailModalClose")?.addEventListener("click", closeDetail);

    $("attractionMapToggle")?.addEventListener("click", () => {
      const map = $("attractionMapPlaceholder");
      if (!map) return;
      const show = map.style.display === "none";
      map.style.display = show ? "block" : "none";
      map.setAttribute("aria-hidden", show ? "false" : "true");
      if (show) {
        const ok = renderMap(lastResults, (a) => openDetail(a, lastResults));
        if (!ok) $("attractionMapNote").textContent = "Координаттай үзвэр олдсонгүй";
      }
    });

    $("attractionFilterOpen")?.addEventListener("click", () => {
      $("attractionFiltersSidebar")?.classList.add("open");
      $("attractionFiltersOverlay") && ($("attractionFiltersOverlay").style.display = "");
    });
    $("attractionFiltersClose")?.addEventListener("click", closeFilterDrawer);
    $("attractionFiltersOverlay")?.addEventListener("click", closeFilterDrawer);
    $("attractionApplyFilters")?.addEventListener("click", () => {
      handlers?.onApplyFilters?.();
      closeFilterDrawer();
    });
    $("attractionClearFilters")?.addEventListener("click", () => {
      clearFilters();
      handlers?.onApplyFilters?.();
    });

    $("attractionSortSelect")?.addEventListener("change", () => handlers?.onSort?.());

    root.AttractionCategories?.populateCategorySelect?.($("attractionCategorySelect"));
  }

  function closeFilterDrawer() {
    $("attractionFiltersSidebar")?.classList.remove("open");
    if ($("attractionFiltersOverlay")) $("attractionFiltersOverlay").style.display = "none";
  }

  function setResults(results) {
    lastResults = results || [];
  }

  function bindCardActions(box, results, handlers) {
    box.querySelectorAll("[data-attr-action]").forEach((btn) => {
      const item = results.find((r) => r.id === btn.dataset.itemId);
      if (!item) return;
      btn.addEventListener("click", () => {
        const action = btn.dataset.attrAction;
        if (action === "detail") openDetail(item, results);
        else if (action === "map") {
          const map = $("attractionMapPlaceholder");
          if (map) {
            map.style.display = "block";
            renderMap(results, (a) => openDetail(a, results));
            map.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        } else if (action === "itinerary") {
          const r = addToItinerary(item);
          if (r.added) {
            const msg = `✅ Өдөр ${r.day}-д нэмэгдлээ.\n\n${itinerarySummary()}\n\nAI-аар бүрэн маршрут үүсгэх үү?`;
            if (confirm(msg)) {
              root.TravelAssistant?.openAiChat?.(
                `${item.city_name_mn || item.city} хотын ${r.day} өдрийн маршрутыг дэлгэрэнгүй төлөвлөж өгнө үү. Үзвэрүүд: ${(r.plan.days[r.day - 1] || []).map((x) => x.name).join(", ")}`
              );
            }
          } else alert("Энэ үзвэр маршрутад аль хэдийн байна.");
        } else if (action === "ticket") handlers?.onTicket?.(item);
        else if (action === "save") {
          const nowSaved = toggleSave(item);
          btn.classList.toggle("saved", nowSaved);
          btn.textContent = nowSaved ? "❤️" : "🤍";
        }
      });
    });
  }

  root.AttractionModule = {
    NOTICE,
    renderCard,
    openDetail,
    closeDetail,
    renderMap,
    destroyMap,
    collectFilters,
    clearFilters,
    toggleSave,
    isSaved,
    addToItinerary,
    getItinerary,
    itinerarySummary,
    setResults,
    bindCardActions,
    initUI,
    closeFilterDrawer
  };
})(window);
