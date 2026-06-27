/**
 * AI Travel Agent — MVP mock UI
 * Production: Frontend → Supabase Edge Function → OpenAI → DB
 * No API keys in frontend.
 */
(function () {
  const ENDPOINT = "/.netlify/functions/ai-travel-agent";

  const chatEl = () => document.getElementById("aiChat");
  const inputEl = () => document.getElementById("aiAgentInput");

  function appendMsg(role, text) {
    const box = chatEl();
    if (!box) return;
    const div = document.createElement("div");
    div.className = "tp-msg " + role;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function showTyping() {
    const box = chatEl();
    if (!box) return null;
    const div = document.createElement("div");
    div.className = "tp-msg ai typing";
    div.id = "aiTyping";
    div.textContent = "AI бодож байна…";
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
  }

  function parseLocalIntent(text) {
    const t = text.toLowerCase();
    const out = {
      country: t.includes("шанхай") || t.includes("shanghai") ? "Хятад / Шанхай" :
        t.includes("бээжин") || t.includes("beijing") ? "Хятад / Бээжин" :
        t.includes("солонгос") || t.includes("korea") ? "Солонгос" :
        t.includes("япон") || t.includes("japan") ? "Япон" : "Хятад",
      days: (t.match(/(\d+)\s*хоног/) || [])[1] || "5",
      people: (t.match(/(\d+)\s*хүн/) || [])[1] || "2",
      month: (t.match(/(\d+)\s*сар/) || [])[1] || null,
      wantsDisney: /disneyland|дисней/i.test(text),
      wantsEsim: /esim|интернэт/i.test(text)
    };
    return out;
  }

  function localMockReply(intent, raw) {
    const days = intent.days;
    const people = intent.people;
    let reply = `📋 **${intent.country}** — ${days} хоног, ${people} хүн\n\n`;
    reply += `**Маршрут (жишээ):**\n`;
    reply += `• 1-р өдөр: Ирэх, буудал шилжих, ойролцоох үзэх газар\n`;
    reply += `• 2–${Math.max(2, Number(days) - 1)}-р өдөр: Гол дурсгалт газрууд\n`;
    if (intent.wantsDisney) reply += `• Disneyland — 1 бүтэн өдөр (~500 CNY/хүн)\n`;
    reply += `• Сүүлийн өдөр: Буцах нислэг\n\n`;
    reply += `**Төсөв (ойролцоо):** ${Number(days) * 350 * Number(people)}–${Number(days) * 600 * Number(people)} CNY\n\n`;
    reply += `**eSIM:** China eSIM 7–14 хоног — esimmongolia.com/china.html\n`;
    reply += `**Буудлын бүс:** Метротой ойр төв эсвэл гол дурсгалт ойр\n`;
    reply += `**Нислэг:** Улаанбаатар–${intent.country.includes("Шанхай") ? "Шанхай" : "Бээжин"} ~2 цаг шууд\n`;
    reply += `**Тээвэр:** Метро + Alipay; VPN (Google/FB-д)\n\n`;
    reply += `Захиалах уу? Доорх «Захиалгын хүсэлт» товч дарна уу.`;
    return reply.replace(/\*\*/g, "");
  }

  async function ask(question) {
    const q = String(question || "").trim();
    if (!q) return;

    appendMsg("user", q);
    if (inputEl()) inputEl().value = "";

    const typing = showTyping();

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          sessionId: sessionStorage.getItem("aiSessionId") || null,
          locale: "mn"
        })
      });
      const data = await res.json();
      if (typing) typing.remove();

      if (data.sessionId) sessionStorage.setItem("aiSessionId", data.sessionId);

      appendMsg("ai", data.reply || localMockReply(parseLocalIntent(q), q));

      if (data.suggestedAction === "inquiry" && window.TravelBooking) {
        const intent = parseLocalIntent(q);
        window.TravelBooking.openInquiryModal("ai", {
          country: intent.country.split("/")[0]?.trim() || "Хятад",
          city: intent.country.split("/")[1]?.trim() || "",
          travelDate: intent.month ? `2026-${String(intent.month).padStart(2, "0")}-15` : "",
          people: intent.people,
          notes: q
        });
      }
    } catch (err) {
      if (typing) typing.remove();
      appendMsg("ai", localMockReply(parseLocalIntent(q), q));
    }
  }

  function init() {
    const form = document.getElementById("aiAgentForm");
    const syncInput = document.getElementById("aiSearchInput");

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      ask(inputEl()?.value);
    });

    if (syncInput && inputEl()) {
      syncInput.addEventListener("input", () => {
        inputEl().value = syncInput.value;
      });
    }

    appendMsg("ai", "Сайн байна уу! Би eSIM Mongolia AI аяллын туслах. Улс, огноо, хоног, хүний тоо, төсөвөө бичээрэй — маршрут, eSIM, нислэгийн зөвлөгөө өгнө.");
  }

  window.TravelAI = { ask, parseLocalIntent };

  document.addEventListener("DOMContentLoaded", init);
})();
