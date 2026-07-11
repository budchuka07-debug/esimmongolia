/**
 * AI Travel Advisor — real chat UI + local responses + Netlify/Supabase backend
 */
(function () {
  const ENDPOINT = "/.netlify/functions/travel-ai";
  const REMOTE_TIMEOUT_MS = 25000;
  const USE_REMOTE = true;

  const history = [];
  let lastContext = {};
  let sendBusy = false;
  let lastSendText = "";
  let lastSendTime = 0;

  const chatEl = () => document.getElementById("aiChat");
  const inputEl = () => document.getElementById("aiAgentInput");
  const heroInput = () => document.getElementById("aiSearchInput");

  const CARD_ICONS = { hotel: "🏨", flight: "✈️", esim: "📶", attraction: "🎫" };

  function scrollChat() {
    const box = chatEl();
    if (box) box.scrollTop = box.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function normalizeUserQuery(q) {
    return String(q || "")
      .replace(/\.\/+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function appendUser(text) {
    const box = chatEl();
    if (!box) return;
    const wrap = document.createElement("div");
    wrap.className = "tp-msg-row user";
    wrap.innerHTML = `<div class="tp-msg user">${escapeHtml(text)}</div>`;
    box.appendChild(wrap);
    scrollChat();
  }

  function formatReply(text) {
    let s = escapeHtml(text);
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    const lines = s.split("\n");
    const out = [];
    let inList = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (/^\d+-р өдөр:/.test(trimmed) || /^[•\-]\s/.test(trimmed)) {
        if (!inList) { out.push('<ul class="tp-ai-list">'); inList = true; }
        const item = trimmed.replace(/^\d+-р өдөр:\s*/, "").replace(/^[•\-]\s*/, "");
        const dayMatch = trimmed.match(/^(\d+-р өдөр:)/);
        const prefix = dayMatch ? `<strong>${dayMatch[1]}</strong> ` : "";
        out.push(`<li>${prefix}${item || trimmed}</li>`);
      } else {
        if (inList) { out.push("</ul>"); inList = false; }
        if (/^🗺|^📋|^💰|^🚇|^🏨|^📶|^✈️|^🛡|^🛂|^🇹|^🇻|^🇯|^🇰|^🇨|^🇹/.test(trimmed)) {
          out.push(`<p class="tp-ai-heading">${trimmed}</p>`);
        } else if (trimmed) {
          out.push(`<p>${trimmed}</p>`);
        }
      }
    });
    if (inList) out.push("</ul>");
    return out.join("");
  }

  function renderCards(cards) {
    if (!cards || !cards.length) return "";
    const grouped = { hotel: [], flight: [], esim: [], attraction: [] };
    cards.forEach((c) => {
      if (grouped[c.type]) grouped[c.type].push(c);
    });

    let html = '<div class="tp-ai-cards">';
    Object.entries(grouped).forEach(([type, list]) => {
      if (!list.length) return;
      const label = { hotel: "Буудлын санал", flight: "Нислэг", esim: "eSIM", attraction: "Үзвэр" }[type];
      html += `<div class="tp-ai-card-group"><div class="tp-ai-card-label">${label}</div><div class="tp-ai-card-grid">`;
      list.forEach((c) => {
        html += `<article class="tp-ai-card tp-ai-card-${type}">
          <div class="tp-ai-card-icon">${CARD_ICONS[type] || "📌"}</div>
          <div class="tp-ai-card-body">
            ${c.badge ? `<span class="tp-ai-card-badge">${escapeHtml(c.badge)}</span>` : ""}
            <strong>${escapeHtml(c.title)}</strong>
            ${c.subtitle ? `<div class="tp-ai-card-sub">${escapeHtml(c.subtitle)}</div>` : ""}
            ${c.detail ? `<div class="tp-ai-card-detail">${escapeHtml(c.detail)}</div>` : ""}
            ${c.price ? `<div class="tp-ai-card-price">${escapeHtml(c.price)}</div>` : ""}
          </div>
        </article>`;
      });
      html += "</div></div>";
    });
    html += "</div>";
    return html;
  }

  function renderQuickReplies(replies) {
    if (!replies || !replies.length) return "";
    return `<div class="tp-ai-quick">${replies.map((q) =>
      `<button type="button" class="tp-quick-chip" data-quick-id="${q.id}">${escapeHtml(q.label)}</button>`
    ).join("")}</div>`;
  }

  function appendAi(payload) {
    const text = typeof payload === "string" ? payload : payload.reply;
    const ctas = typeof payload === "object" ? (payload.ctas || []) : [];
    const quickReplies = typeof payload === "object" ? (payload.quickReplies || []) : [];
    const cards = typeof payload === "object" ? (payload.cards || []) : [];
    const context = typeof payload === "object" ? (payload.context || {}) : {};

    const box = chatEl();
    if (!box) return;
    if (context && Object.keys(context).length) {
      lastContext = { ...lastContext, ...context };
    }

    const wrap = document.createElement("div");
    wrap.className = "tp-msg-row ai";

    let ctaHtml = "";
    if (ctas.length) {
      ctaHtml = `<div class="tp-msg-ctas">${ctas.map((c) =>
        `<button type="button" class="tp-cta-chip" data-cta-id="${c.id}">${escapeHtml(c.label)}</button>`
      ).join("")}</div>`;
    }

    wrap.innerHTML = `
      <div class="tp-msg-avatar" aria-hidden="true">🧳</div>
      <div class="tp-msg-bubble tp-msg-bubble-wide">
        <div class="tp-msg ai tp-msg-rich">${formatReply(text)}</div>
        ${renderCards(cards)}
        ${renderQuickReplies(quickReplies)}
        ${ctaHtml}
      </div>`;
    box.appendChild(wrap);

    wrap.querySelectorAll("[data-cta-id]").forEach((btn) => {
      btn.addEventListener("click", () => handleCta(btn.dataset.ctaId));
    });
    wrap.querySelectorAll("[data-quick-id]").forEach((btn) => {
      btn.addEventListener("click", () => handleQuickReply(btn.dataset.quickId));
    });
    scrollChat();
  }

  function showTyping() {
    clearTyping();
    const box = chatEl();
    if (!box) return;
    const el = document.createElement("div");
    el.className = "tp-msg-row ai typing-row";
    el.id = "aiTyping";
    el.innerHTML = `
      <div class="tp-msg-avatar">🧳</div>
      <div class="tp-msg ai typing">
        <span class="tp-typing-label">Танд тохирох саналуудыг хайж байна…</span>
        <span class="tp-dots"><span></span><span></span><span></span></span>
      </div>`;
    box.appendChild(el);
    scrollChat();
  }

  function clearTyping() {
    document.getElementById("aiTyping")?.remove();
  }

  function isWeakRemoteReply(reply) {
    if (!reply) return true;
    return /хаашаа явахаа хэлбэл/i.test(reply) && !/🗺|маршрут|1-р өдөр/i.test(reply);
  }

  /** Strip internal pricing/markup lines from backend replies */
  function sanitizeCustomerReply(text) {
    return String(text || "")
      .split("\n")
      .filter((line) => !/15\s*%\s*үйлчилгээ|540₮\/юань|markup_percent|supplier_price|үйлчилгээний хураамж|ашиг.*хувь/i.test(line))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function aiErrorFallback() {
    return {
      reply: "Уучлаарай, AI зөвлөх түр холбогдож чадсангүй. Буудал, маршрут эсвэл eSIM товчийг сонгоод хайлтаа үргэлжлүүлээрэй.",
      quickReplies: [
        { id: "hotel_suggest", label: "🏨 Буудал" },
        { id: "route_plan", label: "🗺 Маршрут" },
        { id: "esim_view", label: "📶 eSIM" }
      ],
      ctas: [],
      context: lastContext,
      cards: []
    };
  }
  function generateLocalTravelResponse(message) {
    if (window.AiLocalResponses?.generateLocalTravelResponse) {
      return window.AiLocalResponses.generateLocalTravelResponse(message);
    }
    return {
      reply: "Сайн байна уу! Аяллын зөвлөх бэлэн. «7 сард Шанхай 5 хоног 2 хүн» гэж бичээрэй.",
      quickReplies: [],
      ctas: [],
      context: {},
      cards: []
    };
  }

  async function fetchRemoteTravelResponse(message) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          sessionId: sessionStorage.getItem("aiSessionId") || null,
          history: history.slice(-10),
          context: lastContext,
          locale: "mn"
        })
      });
      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        return null;
      }
      if (!res.ok || !data.reply) return null;
      if (data.sessionId) sessionStorage.setItem("aiSessionId", data.sessionId);
      if (isWeakRemoteReply(data.reply)) return null;
      return {
        reply: sanitizeCustomerReply(data.reply),
        ctas: data.ctas || [],
        quickReplies: data.quickReplies || [],
        cards: data.cards || [],
        context: data.context || {}
      };
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function resolveTravelResponse(message) {
    if (USE_REMOTE) {
      const remote = await fetchRemoteTravelResponse(message);
      if (remote) return remote;
      return aiErrorFallback();
    }
    await new Promise((r) => setTimeout(r, 400));
    return generateLocalTravelResponse(message);
  }

  async function handleAiSendMessage(rawText, opts) {
    const q = normalizeUserQuery(rawText);
    if (!q) return;

    const now = Date.now();
    if (sendBusy) return;
    if (!opts?.force && q === lastSendText && now - lastSendTime < 1200) return;
    if (!chatEl()) return;

    sendBusy = true;
    lastSendText = q;
    lastSendTime = now;

    const silent = opts && opts.silentUser;
    if (!silent) {
      appendUser(q);
      history.push({ role: "user", content: q });
    }

    if (inputEl()) inputEl().value = "";
    if (heroInput()) heroInput().value = "";

    showTyping();

    try {
      const payload = await resolveTravelResponse(q);
      clearTyping();
      appendAi(payload);
      history.push({ role: "assistant", content: payload.reply });
    } catch (err) {
      clearTyping();
      appendAi(aiErrorFallback());
    } finally {
      sendBusy = false;
      scrollChat();
    }
  }

  function quickReplyMessages() {
    const city = lastContext.city || "Шанхай";
    const days = lastContext.days || 5;
    const people = lastContext.people || 2;
    return {
      hotel_suggest: `${city} дотор метротой ойр, аюулгүй буудлын бүс, ${people} хүнд тохирох өдрийн үнийн санал өгнө үү.`,
      flight_check: `${city} руу нислэгийн боломж, үнийн хязгаар, аль үед захиалах нь дээр вэ?`,
      esim_view: null,
      route_plan: `${city} ${days} хоногийн өдөр өдрөөр дэлгэрэнгүй маршрут гарга. Цаг, газар бүрийг тодорхой бич.`,
      budget_calc: `${city} ${days} хоног, ${people} хүн — буудал, хоол, метро, үзвэр тусад нь төсөв тооцоол.`,
      insurance: `${city} аялалд даатгал нэмэх сонголт, үнэ, хамгаалалтыг тайлбарла.`,
      ticket_suggest: `${city} дотор үзвэр, Disneyland, музейний тасалбарын үнэ, захиалгын зөвлөмж.`,
      visa_info: `${lastContext.country || "Хятад"} руу Монгол иргэний визийн мэдээлэл.`,
      create_booking: null
    };
  }

  function handleQuickReply(id) {
    if (id === "esim_view") {
      document.querySelector("#esim")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const msg = quickReplyMessages()[id];
    if (msg) handleAiSendMessage(msg);
    else handleCta(id);
  }

  function handleCta(id) {
    const bookingMap = {
      create_booking: { type: "full", title: "Бүтэн аяллын захиалга үүсгэх" },
      book_flight: { type: "flight", title: "Нислэг захиалах", tab: "flight" },
      book_hotel: { type: "hotel", title: "Буудал захиалах", tab: "hotel" },
      book_train: { type: "train", title: "Галт тэрэгний тасалбар захиалах", tab: "train" },
      book_attraction: { type: "attraction", title: "Үзвэр захиалах", tab: "attraction" },
      book_esim: { type: "esim", title: "eSIM авах", tab: "esim-tab" }
    };

    if (id === "esim_view") {
      document.querySelector("#esim")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const book = bookingMap[id];
    if (book?.tab && window.TravelBooking?.setTab) {
      window.TravelBooking.setTab(book.tab);
      document.getElementById("tpSearchCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (book && window.TravelBooking?.openBookingForm) {
      window.TravelBooking.openBookingForm(book.type, buildPresetFromContext(), book.title);
      return;
    }

    const msg = quickReplyMessages()[id];
    if (msg) handleAiSendMessage(msg);
  }

  function buildPresetFromContext() {
    const c = lastContext;
    return {
      country: c.country || "",
      city: c.city || "",
      people: c.people ? String(c.people) : "",
      travelDate: c.month ? `2026-${String(c.month).padStart(2, "0")}-${String(c.day || "15").padStart(2, "0")}` : "",
      notes: [c.country, c.city, c.days ? c.days + " хоног" : "", c.people ? c.people + " хүн" : ""].filter(Boolean).join(", ")
    };
  }

  function goToChatAndAsk(text) {
    const q = normalizeUserQuery(text || heroInput()?.value || inputEl()?.value);
    if (window.TravelAssistant?.openAiChat) {
      window.TravelAssistant.openAiChat(q || "");
      return;
    }
    document.getElementById("aiAgentSection")?.scrollIntoView({ behavior: "smooth" });
    if (q) setTimeout(() => handleAiSendMessage(q), 300);
  }

  function bindChatForm() {
    const form = document.getElementById("aiAgentForm");
    const input = inputEl();
    if (!form || form.dataset.aiBound === "1") return;
    form.dataset.aiBound = "1";

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleAiSendMessage(input?.value);
    });

    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAiSendMessage(input.value);
      }
    });
  }

  function showWelcome() {
    const box = chatEl();
    if (!box || box.dataset.aiWelcome === "1") return;
    box.dataset.aiWelcome = "1";
    appendAi({
      reply: "Сайн байна уу! Би таны **аяллын зөвлөх**. Маршрут, буудал, нислэг, eSIM, төсөв — бүгдийг Монгол хэлээр зөвлөнө.\n\nЖишээ: «7 сард Шанхай 5 хоног 2 хүн»\n\n**Чат үнэгүй** — form, утас, QPay, login шаардлагагүй.",
      quickReplies: [
        { id: "route_plan", label: "🗺 Маршрут" },
        { id: "hotel_suggest", label: "🏨 Буудал" },
        { id: "flight_check", label: "✈️ Нислэг" },
        { id: "esim_view", label: "📶 eSIM" }
      ],
      ctas: [],
      cards: [],
      context: {}
    });
  }

  function initChatUi(retries) {
    if (!chatEl()) {
      if (retries > 0) setTimeout(() => initChatUi(retries - 1), 50);
      return;
    }
    bindChatForm();
    showWelcome();
  }

  function init() {
    initChatUi(40);

    document.getElementById("aiSearchBtn")?.addEventListener("click", () => {
      goToChatAndAsk(heroInput()?.value);
    });

    heroInput()?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        goToChatAndAsk(heroInput()?.value);
      }
    });
  }

  const ask = handleAiSendMessage;

  window.TravelAI = {
    ask,
    handleAiSendMessage,
    generateLocalTravelResponse,
    goToChatAndAsk,
    handleCta,
    handleQuickReply,
    getContext: () => ({ ...lastContext })
  };

  document.addEventListener("DOMContentLoaded", init);
})();
