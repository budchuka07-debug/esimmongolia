/**
 * eSIM Mongolia — Capacitor native app bridge
 * Back button, safe areas, bottom nav, external links, deep links, offline, push, pull-to-refresh
 */
(function (root) {
  const SITE_HOSTS = ["esimmongolia.com", "www.esimmongolia.com", "app.esimmongolia.local"];
  const EXTERNAL_HOSTS = [
    "klook.", "trip.com", "booking.com", "agoda.com", "expedia.com",
    "skyscanner.", "google.com/maps", "facebook.com", "merchant.qpay.mn", "qpay.mn"
  ];

  function plugin(name) {
    return root.Capacitor?.Plugins?.[name] || null;
  }

  function isNative() {
    return !!(root.ESM_IS_NATIVE_APP || (root.Capacitor?.isNativePlatform && root.Capacitor.isNativePlatform()));
  }

  function $(sel) { return document.querySelector(sel); }

  function hostOf(url) {
    try { return new URL(url, root.location.origin).hostname.replace(/^www\./, ""); }
    catch { return ""; }
  }

  function isInternalUrl(url) {
    if (!url || url.startsWith("#") || url.startsWith("tel:") || url.startsWith("mailto:")) return true;
    if (url.startsWith("/")) return true;
    const h = hostOf(url);
    return SITE_HOSTS.some((s) => h === s.replace(/^www\./, "") || h.endsWith("." + s));
  }

  function isExternalUrl(url) {
    if (!url || url.startsWith("#") || url.startsWith("tel:") || url.startsWith("mailto:")) return false;
    if (url.startsWith("/")) return false;
    const h = hostOf(url);
    if (SITE_HOSTS.some((s) => h === s.replace(/^www\./, ""))) return false;
    return EXTERNAL_HOSTS.some((x) => h.includes(x.replace(/^www\./, ""))) || /^https?:\/\//i.test(url);
  }

  async function openSystemBrowser(url) {
    const Browser = plugin("Browser");
    if (Browser?.open) {
      await Browser.open({ url, presentationStyle: "popover" });
      return;
    }
    root.open(url, "_system");
  }

  function ensureOfflineOverlay() {
    if ($("#esm-offline-overlay")) return;
    const el = document.createElement("div");
    el.id = "esm-offline-overlay";
    el.className = "esm-offline-overlay";
    el.innerHTML = `
      <div class="esm-offline-card">
        <div class="esm-offline-icon">📡</div>
        <h2>Интернет холболт алга</h2>
        <p>Та сүлжээндээ холбогдсоны дараа дахин оролдоно уу.</p>
        <button type="button" class="esm-offline-retry">Дахин оролдох</button>
      </div>`;
    document.body.appendChild(el);
    el.querySelector(".esm-offline-retry")?.addEventListener("click", () => {
      if (navigator.onLine) el.classList.remove("visible");
      else root.location.reload();
    });
  }

  function setOfflineVisible(show) {
    ensureOfflineOverlay();
    $("#esm-offline-overlay")?.classList.toggle("visible", !!show);
  }

  function ensureNetworkErrorBanner() {
    if ($("#esm-network-banner")) return;
    const el = document.createElement("div");
    el.id = "esm-network-banner";
    el.className = "esm-network-banner";
    el.textContent = "Сүлжээний алдаа — API хариу ирээгүй байна.";
    document.body.appendChild(el);
  }

  function showNetworkError(msg) {
    ensureNetworkErrorBanner();
    const el = $("#esm-network-banner");
    if (el) {
      el.textContent = msg || "Сүлжээний алдаа";
      el.classList.add("visible");
      setTimeout(() => el.classList.remove("visible"), 5000);
    }
  }

  root.esmShowNetworkError = showNetworkError;

  function injectBottomNav() {
    if ($("#esm-mobile-nav") || !isNative()) return;
    document.body.classList.add("esm-native-app");
    const nav = document.createElement("nav");
    nav.id = "esm-mobile-nav";
    nav.className = "esm-mobile-nav";
    nav.setAttribute("aria-label", "Үндсэн цэс");
    const path = root.location.pathname;
    const items = [
      { href: "/index.html", icon: "🏠", label: "Нүүр", match: /^\/(index\.html)?$/ },
      { href: "/index.html?tab=flight", icon: "✈️", label: "Нислэг", match: /tab=flight/ },
      { href: "/index.html?tab=hotel", icon: "🏨", label: "Буудал", match: /tab=hotel/ },
      { href: "/index.html#esim", icon: "📶", label: "eSIM", match: /#esim|china\.html|esim/ },
      { href: "javascript:void(0)", icon: "🤖", label: "AI", action: "ai" }
    ];
    nav.innerHTML = items.map((it) => {
      const active = it.match && (it.match.test(path) || it.match.test(root.location.href));
      return `<a href="${it.href}" class="esm-nav-item${active ? " active" : ""}" data-nav-action="${it.action || ""}">
        <span class="esm-nav-icon">${it.icon}</span><span class="esm-nav-label">${it.label}</span></a>`;
    }).join("");
    document.body.appendChild(nav);
    nav.querySelectorAll("[data-nav-action=ai]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        root.TravelAssistant?.openAiChat?.();
      });
    });
  }

  function setupLinkInterceptor() {
    document.addEventListener("click", async (e) => {
      const a = e.target.closest("a[href]");
      if (!a || !isNative()) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("javascript:")) return;
      if (a.target === "_blank" || isExternalUrl(href)) {
        e.preventDefault();
        const url = href.startsWith("/") ? (root.esmApiUrl ? root.esmApiUrl(href) : "https://esimmongolia.com" + href) : href;
        if (isInternalUrl(href) && !isExternalUrl(href)) {
          root.location.href = href;
          return;
        }
        await openSystemBrowser(url.startsWith("http") ? url : "https://esimmongolia.com" + href);
        return;
      }
      if (href.startsWith("http") && !isInternalUrl(href)) {
        e.preventDefault();
        await openSystemBrowser(href);
      }
    }, true);
  }

  function setupBackButton() {
    const App = plugin("App");
    if (!App?.addListener) return;
    let lastBack = 0;
    App.addListener("backButton", ({ canGoBack }) => {
      const modalOpen = document.querySelector(".tp-modal[style*='display: block'], .tp-assist-panel.open, .tp-modal:not([style*='display:none'])");
      if (modalOpen && getComputedStyle(modalOpen).display !== "none") {
        modalOpen.style.display = "none";
        document.querySelector(".tp-modal-bd")?.style && (document.querySelector(".tp-modal-bd").style.display = "none");
        return;
      }
      if (canGoBack) {
        history.back();
        return;
      }
      const now = Date.now();
      if (now - lastBack < 2000) {
        App.exitApp();
        return;
      }
      lastBack = now;
      if (root.Capacitor?.Plugins?.Toast) {
        root.Capacitor.Plugins.Toast.show({ text: "Гарахын тулд дахин дарна уу", duration: "short" });
      }
    });
  }

  function navigateInternal(path) {
    if (!path) return;
    const clean = path.startsWith("/") ? path : "/" + path;
    if (clean.startsWith("http")) {
      const u = new URL(clean);
      if (SITE_HOSTS.some((h) => u.hostname.includes(h.replace("www.", "")))) {
        root.location.href = u.pathname + u.search + u.hash;
      }
      return;
    }
    root.location.href = clean;
  }

  function handleDeepLink(url) {
    if (!url) return;
    try {
      const u = new URL(url);
      const path = u.pathname + u.search + u.hash;
      if (u.protocol === "esimmongolia:") {
        navigateInternal(u.pathname.replace(/^\/+/, "/") + u.search + u.hash);
        return;
      }
      if (SITE_HOSTS.some((h) => u.hostname.includes(h.replace("www.", "")))) {
        if (u.searchParams.get("payment") === "success" || u.searchParams.get("app_payment") === "success") {
          const orderId = u.searchParams.get("orderId") || u.searchParams.get("order");
          if (orderId && root.TravelBooking?.openInquiryModal) {
            navigateInternal("/index.html?app_payment=success&orderId=" + encodeURIComponent(orderId));
            return;
          }
        }
        navigateInternal(path);
      }
    } catch (e) {
      console.warn("[capacitor-app] deep link", e);
    }
  }

  function setupDeepLinks() {
    const App = plugin("App");
    if (!App?.addListener) return;
    App.addListener("appUrlOpen", (ev) => handleDeepLink(ev.url));
    App.getLaunchUrl?.().then((r) => { if (r?.url) handleDeepLink(r.url); });
    const params = new URLSearchParams(root.location.search);
    if (params.get("app_payment") === "success" && params.get("orderId")) {
      setTimeout(() => {
        root.TravelBooking?.openBookingForm?.("full", { orderId: params.get("orderId") }, "Захиалга баталгаажлаа");
      }, 600);
    }
    if (params.get("tab") && root.TravelBooking?.setTab) {
      setTimeout(() => root.TravelBooking.setTab(params.get("tab")), 300);
    }
  }

  async function setupNetwork() {
    window.addEventListener("offline", () => setOfflineVisible(true));
    window.addEventListener("online", () => setOfflineVisible(false));
    const Network = plugin("Network");
    if (Network?.getStatus) {
      const st = await Network.getStatus();
      setOfflineVisible(!st.connected);
      Network.addListener?.("networkStatusChange", (s) => setOfflineVisible(!s.connected));
    } else {
      setOfflineVisible(!navigator.onLine);
    }
  }

  function setupPullToRefresh() {
    if (!isNative()) return;
    const targets = ["#resultsContainer", "#esim", ".tp-home-search", "#platformServicesSection"];
    let startY = 0;
    let pulling = false;
    const PTR_THRESHOLD = 72;
    document.addEventListener("touchstart", (e) => {
      const el = targets.map((s) => $(s)).find((n) => n && n.contains(e.target));
      if (!el || el.scrollTop > 0 || root.scrollY > 0) return;
      startY = e.touches[0].clientY;
      pulling = true;
    }, { passive: true });
    document.addEventListener("touchmove", (e) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > PTR_THRESHOLD) document.body.classList.add("esm-ptr-ready");
    }, { passive: true });
    document.addEventListener("touchend", () => {
      if (document.body.classList.contains("esm-ptr-ready")) {
        document.body.classList.remove("esm-ptr-ready");
        const activeTab = document.querySelector(".tp-tab.active")?.dataset?.tab;
        if (activeTab && root.TravelBooking) {
          const panel = document.querySelector(`[data-panel="${activeTab}"]`);
          const btn = panel?.querySelector("[data-search-run]");
          btn?.click();
        } else {
          root.location.reload();
        }
      }
      pulling = false;
    });
  }

  async function setupPush() {
    const Push = plugin("PushNotifications");
    if (!Push?.requestPermissions || !isNative()) return;
    let perm = await Push.requestPermissions();
    if (perm.receive !== "granted") return;
    await Push.register();
    Push.addListener("registration", async (token) => {
      const value = token.value;
      try {
        await root.fetch(root.esmApiUrl("/.netlify/functions/push-register"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: value,
            platform: root.Capacitor.getPlatform(),
            app_id: "com.esimmongolia.app"
          })
        });
      } catch (e) {
        console.warn("[push] register failed", e);
      }
      try {
        const Prefs = plugin("Preferences");
        if (Prefs) await Prefs.set({ key: "fcm_token", value });
      } catch (_) { /* ignore */ }
    });
    Push.addListener("pushNotificationActionPerformed", (n) => {
      const data = n.notification?.data || {};
      if (data.url) handleDeepLink(data.url);
      else if (data.path) navigateInternal(data.path);
    });
  }

  async function setupStatusBar() {
    const StatusBar = plugin("StatusBar");
    if (!StatusBar) return;
    try {
      await StatusBar.setStyle({ style: "LIGHT" });
      await StatusBar.setBackgroundColor({ color: "#2563eb" });
    } catch (_) { /* iOS only some APIs */ }
  }

  async function hideSplash() {
    const Splash = plugin("SplashScreen");
    if (Splash?.hide) {
      setTimeout(() => Splash.hide().catch(() => {}), 400);
    }
  }

  function patchQPayExternal() {
    if (!isNative()) return;
    const orig = root.open;
    root.open = function (url, target) {
      if (url && (String(url).includes("qpay") || String(url).includes("merchant."))) {
        openSystemBrowser(url);
        return null;
      }
      return orig.call(root, url, target);
    };
  }

  root.ESMCapacitor = {
    isNative,
    openSystemBrowser,
    handleDeepLink,
    requestCameraPermission: async () => {
      const Camera = plugin("Camera");
      if (!Camera?.requestPermissions) return { granted: true };
      return Camera.requestPermissions({ permissions: ["camera", "photos"] });
    },
    requestLocationPermission: async () => {
      const Geo = plugin("Geolocation");
      if (!Geo?.requestPermissions) return { granted: false };
      return Geo.requestPermissions();
    },
    saveQrToGallery: async (dataUrl, fileName) => {
      const Filesystem = plugin("Filesystem");
      if (!Filesystem?.writeFile) return { ok: false };
      const base64 = String(dataUrl).replace(/^data:image\/\w+;base64,/, "");
      try {
        await Filesystem.writeFile({
          path: fileName || `esim-qpay-${Date.now()}.png`,
          data: base64,
          directory: "DOCUMENTS"
        });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }
  };

  async function restoreSessions() {
    const Prefs = plugin("Preferences");
    if (!Prefs) return;
    try {
      const { value } = await Prefs.get({ key: "aiSessionId" });
      if (value && !sessionStorage.getItem("aiSessionId")) {
        sessionStorage.setItem("aiSessionId", value);
      }
    } catch (_) { /* ignore */ }
    const origSet = sessionStorage.setItem.bind(sessionStorage);
    sessionStorage.setItem = function (k, v) {
      origSet(k, v);
      if (k === "aiSessionId" && Prefs) Prefs.set({ key: k, value: String(v) }).catch(() => {});
    };
  }

  async function init() {
    if (!isNative()) return;
    document.documentElement.classList.add("esm-capacitor");
    await restoreSessions();
    await setupStatusBar();
    injectBottomNav();
    setupLinkInterceptor();
    setupBackButton();
    setupDeepLinks();
    await setupNetwork();
    setupPullToRefresh();
    patchQPayExternal();
    await setupPush();
    await hideSplash();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
