/**
 * eSIM Mongolia — booking & inquiry (MVP mock search)
 * Ready for Supabase + supplier APIs
 */
(function () {
  const STATUS_LABELS = {
    new: "Шинэ",
    quoted: "Үнэ илгээсэн",
    awaiting_payment: "Төлбөр хүлээж буй",
    paid: "Төлсөн",
    processing: "Боловсруулж буй",
    completed: "Дууссан",
    cancelled: "Цуцалсан"
  };

  const SERVICE_TYPES = {
    ai: "AI аяллын зөвлөгөө",
    flight: "Нислэг",
    hotel: "Буудал",
    train: "Галт тэрэг",
    attraction: "Үзвэр",
    esim: "eSIM",
    visa: "Виз",
    route: "Маршрут",
    transport: "Нийтийн тээвэр"
  };

  let activeTab = "ai";
  let lastMockResults = [];

  function $(id) { return document.getElementById(id); }

  function fmtMnt(n) {
    return new Intl.NumberFormat("mn-MN").format(Number(n || 0)) + "₮";
  }

  const BOOKING_TITLES = {
    full: "Бүтэн аяллын захиалга үүсгэх",
    flight: "Нислэг захиалах",
    hotel: "Буудал захиалах",
    train: "Галт тэрэгний тасалбар захиалах",
    attraction: "Үзвэр захиалах",
    esim: "eSIM авах",
    visa: "Визийн зөвлөгөө",
    route: "Маршрут захиалах"
  };

  function openBookingForm(serviceType, preset, title) {
    const modal = $("inquiryModal");
    const bd = $("inquiryModalBd");
    if (!modal || !bd) return;
    const type = serviceType === "full" ? "route" : (serviceType || "flight");
    const typeEl = $("inqServiceType");
    if (typeEl) typeEl.value = type;
    const titleEl = $("inquiryModalTitle");
    if (titleEl) {
      titleEl.textContent = title || BOOKING_TITLES[type] || "Захиалга үүсгэх";
    }
    const statusEl = $("inqStatus");
    if (statusEl) statusEl.textContent = "";
    const fieldMap = {
      name: "inqName",
      phone: "inqPhone",
      email: "inqEmail",
      country: "inqCountry",
      city: "inqCity",
      travelDate: "inqTravelDate",
      people: "inqPeople",
      budget: "inqBudget",
      notes: "inqNotes",
      selectedItem: "inqSelectedItem"
    };
    if (preset) {
      Object.keys(preset).forEach((k) => {
        const el = $(fieldMap[k]);
        if (el && preset[k] != null) el.value = preset[k];
      });
    }
    modal.style.display = "block";
    bd.style.display = "block";
  }

  function openInquiryModal(serviceType, preset) {
    openBookingForm(serviceType, preset);
  }

  function closeInquiryModal() {
    const modal = $("inquiryModal");
    const bd = $("inquiryModalBd");
    if (modal) modal.style.display = "none";
    if (bd) bd.style.display = "none";
  }

  function setTab(tab) {
    activeTab = tab;
    document.querySelectorAll(".tp-tab").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });
    document.querySelectorAll(".tp-panel").forEach((p) => {
      p.classList.toggle("active", p.dataset.panel === tab);
    });
    if (tab === "esim-tab") {
      document.querySelector("#esim")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  function renderDestinations() {
    const box = $("platformDestinations");
    const data = window.TRAVEL_DATA;
    if (!box || !data) return;
    box.innerHTML = data.destinations.map((d) => `
      <a class="tp-dest-card" href="${d.href}">
        <img src="${d.img}" alt="${d.name}" loading="lazy">
        <div class="tp-dest-body">
          <div class="tp-dest-name">${d.flag} ${d.name}</div>
          <div class="tp-dest-sub">Маршрут + eSIM</div>
        </div>
      </a>
    `).join("");
  }

  function renderChinaCities() {
    const box = $("platformChinaCities");
    const data = window.TRAVEL_DATA;
    if (!box || !data) return;
    box.innerHTML = data.chinaCities.map((c) => `
      <article class="tp-china-card" id="city-${c.id}">
        <div class="tp-china-head">
          <img src="${c.img}" alt="${c.name} — ${c.cn}" loading="lazy">
          <div class="tp-china-body">
            <h3>${c.name} <span style="color:#64748b;font-weight:600">${c.cn}</span></h3>
            <div class="tp-china-meta">
              <strong>Үзэх газар:</strong>
              <ul>${c.attractions.map((a) => `<li>${a}</li>`).join("")}</ul>
              <p><strong>Тээвэр:</strong> ${c.transport}</p>
              <p><strong>Ойролцоох зардал:</strong> ${c.budget}</p>
            </div>
            <div class="tp-china-actions">
              <a class="tp-btn" href="${c.map}" target="_blank" rel="noopener">📍 Map</a>
              <a class="tp-btn" href="${c.route}">🗺 Маршрут</a>
              <a class="tp-btn" href="${c.esim}">📶 eSIM</a>
              <button type="button" class="tp-btn primary" data-book-city="${c.name}">Захиалах</button>
            </div>
          </div>
        </div>
      </article>
    `).join("");

    box.querySelectorAll("[data-book-city]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openBookingForm("full", {
          country: "Хятад",
          city: btn.dataset.bookCity,
          notes: `${btn.dataset.bookCity} — бүтэн аяллын захиалга`
        }, BOOKING_TITLES.full);
      });
    });
  }

  function bindServices() {
    const data = window.TRAVEL_DATA;
    if (!data) return;
    const grid = $("platformServices");
    if (!grid) return;
    grid.innerHTML = data.services.map((s) => `
      <button type="button" class="tp-service-card" data-service="${s.id}">
        <div class="icon">${s.icon}</div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </button>
    `).join("");

    grid.querySelectorAll(".tp-service-card").forEach((card) => {
      card.addEventListener("click", () => {
        const s = data.services.find((x) => x.id === card.dataset.service);
        if (!s) return;
        if (s.tab) { setTab(s.tab); window.scrollTo({ top: $("tpSearchCard")?.offsetTop - 20 || 0, behavior: "smooth" }); return; }
        if (s.anchor) { window.location.hash = s.anchor.replace("#", ""); document.querySelector(s.anchor)?.scrollIntoView({ behavior: "smooth" }); return; }
        if (s.href) { window.location.href = s.href; return; }
        openInquiryModal(s.id);
      });
    });
  }

  function stars(n) {
    return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
  }

  function priceItem(item) {
    const td = window.TRAVEL_DATA;
    if (td && td.priceItem) return td.priceItem(item);
    const calc = td?.calcFinalPriceMnt || (() => ({ final_price_mnt: 0 }));
    return { ...item, ...calc(item) };
  }

  function itemLabel(item) {
    if (item.type === "hotel") return `${item.name} — ${item.city}, ${item.area}`;
    if (item.type === "train") return `${item.train_number} ${item.from_city}→${item.to_city} ${item.depart_time}`;
    if (item.type === "flight") return `${item.airline} ${item.from_city}→${item.to_city} ${item.depart_time}`;
    return item.title || item.name || "Сонголт";
  }

  function mockSearch(type, formData) {
    const mock = window.MOCK_SEARCH;
    if (!mock) return [];

    if (type === "hotel") {
      const city = formData.city || "Шанхай";
      const nights = formData.days || formData.checkout ? formData.days : 5;
      return mock.hotels(city, nights).map(priceItem);
    }
    if (type === "train") {
      return mock.trains(formData.from || "Хөх хот", formData.city || "Бээжин").map(priceItem);
    }
    if (type === "flight") {
      return mock.flights(formData.from || "Улаанбаатар", formData.city || "Шанхай").map(priceItem);
    }
    if (type === "attraction") {
      const city = formData.city || "Шанхай";
      const people = Number(formData.people || 2);
      return [
        { type: "attraction", id: "att-1", supplier: "mock_klook", name: `Disneyland ${city}`, description: "1 өдрийн тасалбар", original_price: 499 * people, currency: "CNY" },
        { type: "attraction", id: "att-2", supplier: "mock_klook", name: "Great Wall Tour", description: "Тээвэр + хоол", original_price: 280 * people, currency: "CNY" }
      ].map(priceItem);
    }
    return mock.flights("Улаанбаатар", formData.city || "Шанхай").map(priceItem);
  }

  function renderHotelCard(h) {
    const badges = (h.badges || []).map((b) => `<span class="tp-badge">${b}</span>`).join("");
    return `
      <article class="tp-hotel-card" data-item-id="${h.id}">
        <img class="tp-hotel-img" src="${h.image}" alt="${h.name}" loading="lazy">
        <div class="tp-hotel-body">
          <div class="tp-hotel-stars">${stars(h.stars)}</div>
          <h4 class="tp-hotel-name">${h.name}</h4>
          <div class="tp-hotel-area">${h.city} • ${h.area}</div>
          <p class="tp-hotel-desc">${h.description}</p>
          <div class="tp-hotel-dist">📍 ${h.distance}</div>
          <div class="tp-hotel-badges">${badges}</div>
          <div class="tp-card-price-row">
            <div>
              <div class="tp-price-final">${fmtMnt(h.final_price_mnt)}</div>
              <div class="tp-price-supplier">${h.original_price} ${h.currency} • ${h.nights} шөнө (+${h.markup_percent}%)</div>
            </div>
            <button type="button" class="tp-btn-book" data-book-type="hotel" data-item-id="${h.id}">Захиалах</button>
          </div>
        </div>
      </article>`;
  }

  function renderTrainCard(t) {
    return `
      <article class="tp-train-card" data-item-id="${t.id}">
        <div class="tp-train-route">
          <div class="tp-train-city">
            <div class="tp-train-time">${t.depart_time}</div>
            <div class="tp-train-place">${t.from_city}</div>
          </div>
          <div class="tp-train-mid">
            <div class="tp-train-dur">${t.duration}</div>
            <div class="tp-train-line"></div>
            <div class="tp-train-num">${t.train_number}</div>
          </div>
          <div class="tp-train-city align-right">
            <div class="tp-train-time">${t.arrive_time}</div>
            <div class="tp-train-place">${t.to_city}</div>
          </div>
        </div>
        <div class="tp-train-meta">
          <span class="tp-badge">${t.seat_type}</span>
          <span class="tp-badge muted">${t.supplier}</span>
        </div>
        <div class="tp-card-price-row">
          <div>
            <div class="tp-price-final">${fmtMnt(t.final_price_mnt)}</div>
            <div class="tp-price-supplier">${t.original_price} ${t.currency} (+${t.markup_percent}%)</div>
          </div>
          <button type="button" class="tp-btn-book" data-book-type="train" data-item-id="${t.id}">Захиалах</button>
        </div>
      </article>`;
  }

  function renderFlightCard(f) {
    return `
      <article class="tp-flight-card" data-item-id="${f.id}">
        <div class="tp-flight-airline">✈️ ${f.airline}</div>
        <div class="tp-train-route">
          <div class="tp-train-city">
            <div class="tp-train-time">${f.depart_time}</div>
            <div class="tp-train-place">${f.depart_airport}</div>
            <div class="tp-flight-sub">${f.from_city}</div>
          </div>
          <div class="tp-train-mid">
            <div class="tp-train-dur">${f.duration}</div>
            <div class="tp-train-line"></div>
          </div>
          <div class="tp-train-city align-right">
            <div class="tp-train-time">${f.arrive_time}</div>
            <div class="tp-train-place">${f.arrive_airport}</div>
            <div class="tp-flight-sub">${f.to_city}</div>
          </div>
        </div>
        <div class="tp-train-meta">
          <span class="tp-badge">🧳 ${f.baggage}</span>
        </div>
        <div class="tp-card-price-row">
          <div>
            <div class="tp-price-final">${fmtMnt(f.final_price_mnt)}</div>
            <div class="tp-price-supplier">${f.original_price} ${f.currency} (+${f.markup_percent}%)</div>
          </div>
          <button type="button" class="tp-btn-book" data-book-type="flight" data-item-id="${f.id}">Захиалах</button>
        </div>
      </article>`;
  }

  function renderAttractionCard(a) {
    return `
      <article class="tp-train-card" data-item-id="${a.id}">
        <h4 class="tp-hotel-name">${a.name}</h4>
        <p class="tp-hotel-desc">${a.description}</p>
        <div class="tp-card-price-row">
          <div>
            <div class="tp-price-final">${fmtMnt(a.final_price_mnt)}</div>
            <div class="tp-price-supplier">${a.original_price} ${a.currency}</div>
          </div>
          <button type="button" class="tp-btn-book" data-book-type="attraction" data-item-id="${a.id}">Захиалах</button>
        </div>
      </article>`;
  }

  function showMockResults(type, results) {
    lastMockResults = results;
    const box = $("mockResults");
    if (!box) return;
    const label = SERVICE_TYPES[type] || type;
    box.style.display = "block";

    let gridClass = "tp-results-grid";
    let cards = "";
    if (type === "hotel") {
      gridClass = "tp-hotel-grid";
      cards = results.map(renderHotelCard).join("");
    } else if (type === "train") {
      gridClass = "tp-train-grid";
      cards = results.map(renderTrainCard).join("");
    } else if (type === "flight") {
      gridClass = "tp-flight-grid";
      cards = results.map(renderFlightCard).join("");
    } else {
      cards = results.map(renderAttractionCard).join("");
    }

    box.innerHTML = `
      <div class="tp-results-header">
        <h3>🔍 ${label} — ${results.length} үр дүн</h3>
        <p class="tp-lead">Жишээ өгөгдөл (supplier API удахгүй). «Захиалах» дарвал хүсэлт илгээнэ.</p>
      </div>
      <div class="${gridClass}">${cards}</div>
    `;

    box.querySelectorAll("[data-book-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = results.find((r) => r.id === btn.dataset.itemId);
        if (!item) return;
        const bookType = btn.dataset.bookType || type;
        openBookingForm(bookType, {
          selectedItem: itemLabel(item),
          notes: `Үнэ: ${fmtMnt(item.final_price_mnt)} (${item.original_price} ${item.currency})`,
          city: item.city || item.to_city || "",
          country: item.from_city ? "" : "Хятад"
        }, BOOKING_TITLES[bookType]);
      });
    });

    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function collectForm(panel) {
    const fd = {};
    panel?.querySelectorAll("[data-field]").forEach((el) => {
      fd[el.dataset.field] = el.value;
    });
    return fd;
  }

  async function submitInquiry(e) {
    e.preventDefault();
    const form = $("inquiryForm");
    const statusEl = $("inqStatus");
    if (!form) return;
    const payload = Object.fromEntries(new FormData(form));
    payload.service_type = payload.service_type || "flight";
    payload.status = "new";
    if (payload.selected_item) {
      payload.extra_notes = [payload.selected_item, payload.extra_notes].filter(Boolean).join("\n");
    }

    if (statusEl) statusEl.textContent = "Илгээж байна…";

    try {
      const res = await fetch("/.netlify/functions/travel-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Алдаа");
      if (statusEl) {
        statusEl.innerHTML = `✅ Захиалга хүлээн авлаа! Дугаар: <b>${data.requestId || "—"}</b><br><small>Төлөв: ${STATUS_LABELS.new}. Админ үнэ баталсны дараа танд мэдэгдэнэ. Төлбөр (QPay) зөвхөн үнэ батлагдсаны дараа.</small>`;
      }
      form.reset();
    } catch (err) {
      if (statusEl) statusEl.textContent = "❌ " + (err.message || "Алдаа гарлаа");
    }
  }

  function initTabs() {
    document.querySelectorAll(".tp-tab").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.dataset.tab));
    });

    $("openInquiryBtn")?.addEventListener("click", () => {
      openBookingForm("flight", {}, BOOKING_TITLES.flight);
    });

    document.querySelectorAll("[data-search-run]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.searchRun;
        const panel = document.querySelector(`.tp-panel[data-panel="${type}"]`);
        const fd = collectForm(panel);
        const results = mockSearch(type, fd);
        showMockResults(type, results);
      });
    });
  }

  function initInquiryModal() {
    $("inquiryModalBd")?.addEventListener("click", closeInquiryModal);
    $("inquiryModalClose")?.addEventListener("click", closeInquiryModal);
    $("inquiryForm")?.addEventListener("submit", submitInquiry);
  }

  window.TravelBooking = {
    openInquiryModal,
    openBookingForm,
    closeInquiryModal,
    setTab,
    STATUS_LABELS,
    SERVICE_TYPES,
    BOOKING_TITLES
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderDestinations();
    renderChinaCities();
    bindServices();
    initTabs();
    initInquiryModal();
    setTab("ai");

    if (location.hash === "#esim") {
      document.querySelector("#esim")?.scrollIntoView({ behavior: "smooth" });
    }
  });
})();
