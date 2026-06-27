/**
 * AI Travel Advisor — free ChatGPT-style chat (no form required)
 */
(function () {
  const ENDPOINT = "/.netlify/functions/ai-travel-agent";

  const history = [];
  let lastContext = {};

  const chatEl = () => document.getElementById("aiChat");
  const inputEl = () => document.getElementById("aiAgentInput");
  const heroInput = () => document.getElementById("aiSearchInput");

  function scrollChat() {
    const box = chatEl();
    if (box) box.scrollTop = box.scrollHeight;
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

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatReply(text) {
    return escapeHtml(text).replace(/\n/g, "<br>");
  }

  function appendAi(text, ctas, context) {
    const box = chatEl();
    if (!box) return;
    if (context) lastContext = { ...lastContext, ...context };

    const wrap = document.createElement("div");
    wrap.className = "tp-msg-row ai";

    let ctaHtml = "";
    if (ctas && ctas.length) {
      ctaHtml = `<div class="tp-msg-ctas">${ctas.map((c) =>
        `<button type="button" class="tp-cta-chip" data-cta-id="${c.id}">${escapeHtml(c.label)}</button>`
      ).join("")}</div>`;
    }

    wrap.innerHTML = `
      <div class="tp-msg-avatar" aria-hidden="true">🤖</div>
      <div class="tp-msg-bubble">
        <div class="tp-msg ai">${formatReply(text)}</div>
        ${ctaHtml}
      </div>`;
    box.appendChild(wrap);

    wrap.querySelectorAll("[data-cta-id]").forEach((btn) => {
      btn.addEventListener("click", () => handleCta(btn.dataset.ctaId));
    });
    scrollChat();
  }

  function showTyping() {
    const box = chatEl();
    if (!box) return null;
    const el = document.createElement("div");
    el.className = "tp-msg-row ai typing-row";
    el.id = "aiTyping";
    el.innerHTML = `
      <div class="tp-msg-avatar">🤖</div>
      <div class="tp-msg ai typing"><span class="tp-dots"><span></span><span></span><span></span></span></div>`;
    box.appendChild(el);
    scrollChat();
    return el;
  }

  function ctaFollowUpMessages() {
    const city = lastContext.city || lastContext.country || "тэнд";
    return {
      route_plan: `${city} руу ${lastContext.days || 5} хоногийн дэлгэрэнгүй маршрут өгнө үү. Өдөр бүр ямар газар очих, хэдэн цаг зарцуулахыг жагсаана уу.`,
      flight_check: `${city} руу нислэгийн боломж, үнийн хязгаар, аль үед захиалах нь дээр вэ?`,
      hotel_suggest: `${city} дотор метротой ойр, аюулгүй буудлын бүс, өдрийн үнийн санал өгнө үү.`,
      ticket_suggest: `${city} дотор үзвэр, музей, Disneyland зэрэг тасалбарын үнэ, захиалгын зөвлөмж.`,
      visa_info: `${lastContext.country || "Хятад"} руу Монгол иргэний визийн мэдээлэл, шаардлагатай материал.`,
      esim_view: null,
      create_booking: null,
      book_flight: null,
      book_hotel: null,
      book_train: null,
      book_attraction: null,
      book_esim: null,
      book_full: null
    };
  }

  function handleCta(id) {
    const bookingMap = {
      create_booking: { type: "full", title: "Бүтэн аяллын захиалга үүсгэх" },
      book_flight: { type: "flight", title: "Нислэг захиалах" },
      book_hotel: { type: "hotel", title: "Буудал захиалах" },
      book_train: { type: "train", title: "Галт тэрэгний тасалбар захиалах" },
      book_attraction: { type: "attraction", title: "Үзвэр захиалах" },
      book_esim: { type: "esim", title: "eSIM авах" }
    };

    if (id === "esim_view") {
      document.querySelector("#esim")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const book = bookingMap[id];
    if (book && window.TravelBooking) {
      window.TravelBooking.openBookingForm(book.type, buildPresetFromContext(), book.title);
      return;
    }

    const followUps = ctaFollowUpMessages();
    const msg = followUps[id];
    if (msg) ask(msg, { silentUser: false });
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

  async function ask(question, opts) {
    const q = String(question || "").trim();
    if (!q) return;

    const silent = opts && opts.silentUser;

    if (!silent) {
      appendUser(q);
      history.push({ role: "user", content: q });
    }

    if (inputEl()) inputEl().value = "";
    if (heroInput()) heroInput().value = "";

    const typing = showTyping();

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          sessionId: sessionStorage.getItem("aiSessionId") || null,
          history: history.slice(-10),
          locale: "mn"
        })
      });
      const data = await res.json();
      if (typing) typing.remove();

      if (data.sessionId) sessionStorage.setItem("aiSessionId", data.sessionId);

      const reply = data.reply || "Уучлаарай, одоогоор хариу өгч чадсангүй. Дахин оролдоно уу.";
      appendAi(reply, data.ctas || [], data.context || {});

      history.push({ role: "assistant", content: reply });
    } catch (err) {
      if (typing) typing.remove();
      appendAi("Холболт түр алдаатай байна. Дахин асуугаарай — form бөглөх шаардлагагүй.", [], {});
    }
  }

  function goToChatAndAsk(text) {
    document.getElementById("aiAgentSection")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => ask(text || heroInput()?.value || inputEl()?.value), 300);
  }

  function init() {
    const form = document.getElementById("aiAgentForm");
    const input = inputEl();

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      ask(input?.value);
    });

    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        ask(input.value);
      }
    });

    document.getElementById("aiSearchBtn")?.addEventListener("click", () => {
      goToChatAndAsk(heroInput()?.value);
    });

    heroInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        goToChatAndAsk(heroInput()?.value);
      }
    });

    appendAi(
      "Сайн байна уу! Би таны AI аяллын зөвлөх. Хаашаа явах, хэзээ, хэдэн хүн, төсөв — ямар ч зүйл асуугаарай. Form бөглөх шаардлагагүй, чөлөөтэй чатлаарай.",
      [],
      {}
    );
  }

  window.TravelAI = { ask, goToChatAndAsk, handleCta, getContext: () => ({ ...lastContext }) };

  document.addEventListener("DOMContentLoaded", init);
})();
