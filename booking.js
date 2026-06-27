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

  function openInquiryModal(serviceType, preset) {
    const modal = $("inquiryModal");
    const bd = $("inquiryModalBd");
    if (!modal || !bd) return;
    const typeEl = $("inqServiceType");
    if (typeEl) typeEl.value = serviceType || "flight";
    const fieldMap = {
      name: "inqName",
      phone: "inqPhone",
      email: "inqEmail",
      country: "inqCountry",
      city: "inqCity",
      travelDate: "inqTravelDate",
      people: "inqPeople",
      budget: "inqBudget",
      notes: "inqNotes"
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
              <button type="button" class="tp-btn primary" data-inquiry-city="${c.name}">Захиалах</button>
            </div>
          </div>
        </div>
      </article>
    `).join("");

    box.querySelectorAll("[data-inquiry-city]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openInquiryModal("route", {
          country: "Хятад",
          city: btn.dataset.inquiryCity,
          notes: `${btn.dataset.inquiryCity} хот — маршрут, буудал, eSIM зөвлөгөө хүсэж байна.`
        });
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

  function mockSearch(type, formData) {
    const calc = window.TRAVEL_DATA?.calcFinalPriceMnt || ((x) => ({ final_price_mnt: 0 }));
    const city = formData.city || "Шанхай";
    const people = Number(formData.people || 2);
    const days = Number(formData.days || 5);

    const templates = {
      flight: [
        { title: `Улаанбаатар → ${city} (шууд)`, supplier: "mock_amadeus", original_price: 1850, currency: "CNY", meta: "2 цаг • China Southern" },
        { title: `Улаанбаатар → ${city} (1 зогсоол)`, supplier: "mock_duffel", original_price: 1420, currency: "CNY", meta: "6 цаг • Air China" }
      ],
      hotel: [
        { title: `${city} төв — 4 од`, supplier: "mock_booking", original_price: 380 * days, currency: "CNY", meta: `${days} шөнө • өглөөний цай` },
        { title: `${city} — 3 од`, supplier: "mock_trip", original_price: 220 * days, currency: "CNY", meta: `${days} шөнө • метротой ойр` }
      ],
      train: [
        { title: `Хөх хот → Бээжин HSR`, supplier: "mock_12306", original_price: 200, currency: "CNY", meta: "~2 цаг • 2-р зэрэглэл" },
        { title: `Бээжин → ${city} HSR`, supplier: "mock_12306", original_price: 550, currency: "CNY", meta: "4–6 цаг" }
      ],
      attraction: [
        { title: `Disneyland ${city.includes("Шанхай") ? "Shanghai" : "Park"}`, supplier: "mock_klook", original_price: 499 * people, currency: "CNY", meta: "1 өдрийн тасалбар" },
        { title: "Great Wall tour", supplier: "mock_klook", original_price: 280 * people, currency: "CNY", meta: "Тээвэр + хоол" }
      ]
    };

    const list = templates[type] || templates.flight;
    return list.map((item) => {
      const pricing = calc({ ...item, markup_percent: 15, service_fee_mnt: 5000 });
      return { ...item, ...pricing, people, days };
    });
  }

  function showMockResults(type, results) {
    lastMockResults = results;
    const box = $("mockResults");
    if (!box) return;
    const label = SERVICE_TYPES[type] || type;
    box.style.display = "block";
    box.innerHTML = `
      <h3 style="margin:0 0 10px;font-size:1rem">🔍 ${label} — жишээ үр дүн (MVP)</h3>
      <p class="tp-lead" style="margin:0 0 12px">Бодит API холбогдоогүй. Захиалгын хүсэлт илгээвэл админ үнэ батална.</p>
      <div class="tp-results">
        ${results.map((r) => `
          <div class="tp-result-card">
            <div>
              <strong>${r.title}</strong>
              <div class="tp-price-note">${r.meta} • ${r.supplier}</div>
            </div>
            <div style="text-align:right">
              <div class="price">${fmtMnt(r.final_price_mnt)}</div>
              <button type="button" class="tp-btn primary" style="margin-top:8px;padding:8px 14px;font-size:13px" data-book-result="${r.title}">Захиалах</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
    box.querySelectorAll("[data-book-result]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openInquiryModal(type, { notes: `Сонгосон: ${btn.dataset.bookResult}` });
      });
    });
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
        statusEl.innerHTML = `✅ Хүсэлт хүлээн авлаа! Дугаар: <b>${data.requestId || "—"}</b><br><small>Төлөв: ${STATUS_LABELS.new}. Админ үнэ илгээхэд QPay-р төлнө.</small>`;
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

    $("aiSearchBtn")?.addEventListener("click", () => {
      const q = $("aiSearchInput")?.value?.trim();
      document.getElementById("aiAgentSection")?.scrollIntoView({ behavior: "smooth" });
      if (q && window.TravelAI) window.TravelAI.ask(q);
      else setTab("ai");
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

    $("openInquiryBtn")?.addEventListener("click", () => openInquiryModal("flight"));
  }

  function initInquiryModal() {
    $("inquiryModalBd")?.addEventListener("click", closeInquiryModal);
    $("inquiryModalClose")?.addEventListener("click", closeInquiryModal);
    $("inquiryForm")?.addEventListener("submit", submitInquiry);
  }

  window.TravelBooking = {
    openInquiryModal,
    closeInquiryModal,
    setTab,
    STATUS_LABELS,
    SERVICE_TYPES
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
