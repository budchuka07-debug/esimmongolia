/**
 * Admin CMS core — auth, navigation, shared UI helpers
 */
(function () {
  const NAV = [
    { section: "Үндсэн" },
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { section: "Контент" },
    { id: "countries", label: "Countries", icon: "🌍" },
    { id: "cities", label: "Cities", icon: "🏙️" },
    { id: "hotels", label: "Hotels", icon: "🏨" },
    { id: "rooms", label: "Hotel Rooms", icon: "🛏️" },
    { id: "flights", label: "Flights", icon: "✈️" },
    { id: "trains", label: "Trains", icon: "🚄" },
    { id: "buses", label: "Buses", icon: "🚌" },
    { id: "attractions", label: "Attractions", icon: "🎡" },
    { id: "rentals", label: "Long Stay Rentals", icon: "🏠" },
    { id: "esim", label: "eSIM", icon: "📱" },
    { id: "insurance", label: "Insurance", icon: "🛡️" },
    { id: "guides", label: "Travel Guides", icon: "📖" },
    { id: "health-guides", label: "Health Guides", icon: "🏥" },
    { id: "ai-knowledge", label: "AI Knowledge", icon: "🤖" },
    { section: "Захиалга" },
    { id: "bookings", label: "Bookings", icon: "📋" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "settings", label: "Settings", icon: "⚙️" }
  ];

  const MODULES = {};
  let adminKey = sessionStorage.getItem("adminKey") || "";
  let currentModule = "dashboard";
  let globalSearch = "";

  const $ = (id) => document.getElementById(id);

  function toast(msg, isError) {
    const el = $("admToast");
    if (!el) return;
    el.textContent = msg;
    el.style.background = isError ? "#991b1b" : "#166534";
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 3500);
  }

  function fmtMnt(n) {
    return Number(n || 0).toLocaleString("mn-MN") + " ₮";
  }

  function fmtDate(d) {
    if (!d) return "—";
    return String(d).slice(0, 10);
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function badge(active) {
    return active
      ? '<span class="adm-badge active">Active</span>'
      : '<span class="adm-badge inactive">Inactive</span>';
  }

  function statusBadge(status) {
    const s = esc(status || "new");
    return `<span class="adm-badge ${s}">${s.replace(/_/g, " ")}</span>`;
  }

  function countryName(id) {
    const c = AdminStore.getById("countries", id);
    return c ? `${c.flag || ""} ${c.name_mn}` : "—";
  }

  function cityName(id) {
    const c = AdminStore.getById("cities", id);
    return c ? c.name_mn : "—";
  }

  function hotelName(id) {
    const h = AdminStore.getById("hotels", id);
    return h ? h.official_name : "—";
  }

  function registerModule(id, mod) {
    MODULES[id] = mod;
  }

  function renderNav() {
    const nav = $("admNav");
    if (!nav) return;
    let html = "";
    NAV.forEach((item) => {
      if (item.section) {
        html += `<div class="adm-nav-section">${esc(item.section)}</div>`;
        return;
      }
      html += `<button type="button" class="adm-nav-item ${item.id === currentModule ? "active" : ""}" data-mod="${item.id}">${item.icon} ${esc(item.label)}</button>`;
    });
    nav.innerHTML = html;
    nav.querySelectorAll("[data-mod]").forEach((btn) => {
      btn.addEventListener("click", () => navigate(btn.dataset.mod));
    });
  }

  function navigate(mod) {
    currentModule = mod;
    location.hash = mod;
    renderNav();
    renderModule();
    $("admSidebar")?.classList.remove("open");
    const titles = { dashboard: "Dashboard" };
    NAV.forEach((n) => { if (n.id) titles[n.id] = n.label; });
    const title = $("admPageTitle");
    if (title) title.textContent = titles[mod] || mod;
  }

  function renderModule() {
    const box = $("admContent");
    if (!box) return;
    const mod = MODULES[currentModule];
    if (!mod || !mod.render) {
      box.innerHTML = `<div class="adm-empty">Модуль бэлэн болоогүй: ${esc(currentModule)}</div>`;
      return;
    }
    try {
      box.innerHTML = mod.render({ search: globalSearch });
      mod.bind?.(box, { search: globalSearch, navigate, toast, fmtMnt, fmtDate, esc });
    } catch (err) {
      box.innerHTML = `<div class="adm-empty">Алдаа: ${esc(err.message)}</div>`;
    }
  }

  function openModal(title, bodyHtml, onSave) {
    const backdrop = document.createElement("div");
    backdrop.className = "adm-modal-backdrop";
    backdrop.innerHTML = `
      <div class="adm-modal" role="dialog">
        <div class="adm-modal-head">
          <h3>${esc(title)}</h3>
          <button type="button" class="adm-btn sm" data-close>✕</button>
        </div>
        <div class="adm-modal-body">${bodyHtml}</div>
        <div class="adm-modal-foot">
          <button type="button" class="adm-btn" data-close>Болих</button>
          <button type="button" class="adm-btn primary" data-save>Хадгалах</button>
        </div>
      </div>`;
    const close = () => backdrop.remove();
    backdrop.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    backdrop.querySelector("[data-save]")?.addEventListener("click", () => {
      if (onSave?.(backdrop) !== false) close();
    });
    document.body.appendChild(backdrop);
    window.AdminCloudinary?.bindModal?.(backdrop);
    return backdrop;
  }

  function parseCsvList(val) {
    return String(val || "").split(",").map((s) => s.trim()).filter(Boolean);
  }

  function authHeaders() {
    return { Authorization: `Bearer ${adminKey}`, "Content-Type": "application/json" };
  }

  function showApp() {
    $("admLoginWrap").style.display = "none";
    $("admApp").style.display = "flex";
    renderNav();
    const hash = (location.hash || "#dashboard").slice(1);
    navigate(MODULES[hash] ? hash : "dashboard");
  }

  function init() {
    $("admLoginForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      adminKey = $("admKeyInput")?.value?.trim() || "";
      if (!adminKey) return;
      sessionStorage.setItem("adminKey", adminKey);
      showApp();
    });

    $("admLogout")?.addEventListener("click", () => {
      sessionStorage.removeItem("adminKey");
      adminKey = "";
      $("admLoginWrap").style.display = "";
      $("admApp").style.display = "none";
    });

    $("admGlobalSearch")?.addEventListener("input", (e) => {
      globalSearch = e.target.value;
      renderModule();
    });

    $("admMenuToggle")?.addEventListener("click", () => {
      $("admSidebar")?.classList.toggle("open");
    });

    window.addEventListener("hashchange", () => {
      const hash = (location.hash || "#dashboard").slice(1);
      if (MODULES[hash]) navigate(hash);
    });

    if (adminKey) showApp();
  }

  window.AdminCore = {
    registerModule,
    navigate,
    renderModule,
    openModal,
    toast,
    fmtMnt,
    fmtDate,
    esc,
    badge,
    statusBadge,
    countryName,
    cityName,
    hotelName,
    parseCsvList,
    authHeaders,
    get adminKey() { return adminKey; }
  };

  document.addEventListener("DOMContentLoaded", init);
})();
