/**
 * Floating travel assistant — FAB + concierge panel (AI chat, contacts, quick links).
 */
(function () {
  const MESSENGER_URL = "https://m.me/esimmongolia";
  const WHATSAPP_URL = "https://wa.me/97690283039?text=" + encodeURIComponent("Сайн байна уу, аяллын зөвлөгөө авахыг хүсч байна.");
  const PHONE_URL = "tel:+97690283039";

  let chatHomeParent = null;
  let chatWidget = null;

  function $(id) {
    return document.getElementById(id);
  }

  function getChatWidget() {
    if (!chatWidget) chatWidget = $("aiChatWidget");
    return chatWidget;
  }

  function ensureChatInModal() {
    const widget = getChatWidget();
    const host = $("assistAiHost");
    if (!widget || !host || widget.parentElement === host) return;
    if (!chatHomeParent) chatHomeParent = widget.parentElement;
    host.appendChild(widget);
  }

  function restoreChatToPage() {
    const widget = getChatWidget();
    if (!widget || !chatHomeParent || widget.parentElement === chatHomeParent) return;
    chatHomeParent.appendChild(widget);
  }

  function showView(view) {
    const home = $("assistHomeView");
    const ai = $("assistAiView");
    if (view === "ai") {
      ensureChatInModal();
      home?.setAttribute("hidden", "");
      ai?.removeAttribute("hidden");
      $("assistPanelTitle").textContent = "Аяллын зөвлөх";
      $("assistPanelSubtitle").textContent = "AI чат — form шаардлагагүй, үнэгүй.";
      setTimeout(() => $("aiAgentInput")?.focus(), 280);
    } else {
      home?.removeAttribute("hidden");
      ai?.setAttribute("hidden", "");
      $("assistPanelTitle").textContent = "Аяллын зөвлөх";
      $("assistPanelSubtitle").textContent =
        "Та аялал, буудал, нислэг, eSIM, виз, даатгалын талаар асуугаарай.";
    }
  }

  function openPanel(view) {
    $("travelAssistBackdrop")?.classList.add("is-open");
    $("travelAssistPanel")?.classList.add("is-open");
    $("travelAssistFab")?.classList.add("is-hidden");
    document.body.classList.add("tp-assist-open");
    showView(view || "home");
  }

  function closePanel() {
    $("travelAssistBackdrop")?.classList.remove("is-open");
    $("travelAssistPanel")?.classList.remove("is-open");
    $("travelAssistFab")?.classList.remove("is-hidden");
    document.body.classList.remove("tp-assist-open");
    showView("home");
    restoreChatToPage();
  }

  function openAiChat(presetText) {
    openPanel("ai");
    if (presetText && window.TravelAI?.ask) {
      setTimeout(() => window.TravelAI.ask(presetText), 350);
    }
  }

  function goToSearchTab(tab) {
    closePanel();
    if (window.TravelBooking?.setTab) {
      window.TravelBooking.setTab(tab);
      setTimeout(() => {
        $("tpSearchCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }

  function init() {
    chatWidget = $("aiChatWidget");
    chatHomeParent = chatWidget?.parentElement || null;

    $("travelAssistFab")?.addEventListener("click", () => openPanel("home"));
    $("travelAssistBackdrop")?.addEventListener("click", closePanel);
    $("travelAssistClose")?.addEventListener("click", closePanel);
    $("assistAiBack")?.addEventListener("click", () => showView("home"));

    $("assistAiStart")?.addEventListener("click", () => openAiChat());
    $("assistFb")?.addEventListener("click", () => window.open(MESSENGER_URL, "_blank", "noopener"));
    $("assistWa")?.addEventListener("click", () => window.open(WHATSAPP_URL, "_blank", "noopener"));
    $("assistPhone")?.addEventListener("click", () => { window.location.href = PHONE_URL; });

    $("assistHotel")?.addEventListener("click", () => goToSearchTab("hotel"));
    $("assistFlight")?.addEventListener("click", () => goToSearchTab("flight"));
    $("assistEsim")?.addEventListener("click", () => {
      closePanel();
      document.getElementById("esim")?.scrollIntoView({ behavior: "smooth" });
    });
    $("assistInsurance")?.addEventListener("click", () =>
      openAiChat("Аяллын даатгал нэмэх сонголт, үнэ, хамгаалалтыг тайлбарла.")
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("travelAssistPanel")?.classList.contains("is-open")) closePanel();
    });
  }

  window.TravelAssistant = { open: openPanel, close: closePanel, openAiChat, openHome: () => openPanel("home") };

  document.addEventListener("DOMContentLoaded", init);
})();
