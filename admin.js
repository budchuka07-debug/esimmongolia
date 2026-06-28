/**
 * Admin Booking Channel — hotel orders (Hohhot supplier workflow)
 */
(function () {
  const API_ORDERS = "/.netlify/functions/admin-orders";
  const API_ACTION = "/.netlify/functions/admin-order-action";
  const API_QPAY = "/.netlify/functions/qpay-create-invoice";

  let adminKey = sessionStorage.getItem("adminKey") || "";
  let orders = [];
  let selectedId = null;

  const $ = (id) => document.getElementById(id);

  function authHeaders() {
    return { Authorization: `Bearer ${adminKey}`, "Content-Type": "application/json" };
  }

  function toast(msg) {
    const el = $("admToast");
    if (!el) return;
    el.textContent = msg;
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

  function statusBadge(s) {
    return `<span class="adm-badge ${s}">${s}</span>`;
  }

  async function apiGet(url) {
    const res = await fetch(url, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "API error");
    return data;
  }

  async function apiPost(body) {
    const res = await fetch(API_ACTION, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...body, admin_key: adminKey })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Action failed");
    return data;
  }

  async function loadOrders() {
    const data = await apiGet(`${API_ORDERS}?service_type=hotel`);
    orders = data.orders || [];
    renderList();
    if (selectedId) renderDetail(orders.find((o) => o.orderId === selectedId));
  }

  function renderList() {
    const box = $("admOrderList");
    if (!box) return;
    if (!orders.length) {
      box.innerHTML = '<p class="adm-empty">Захиалга байхгүй</p>';
      return;
    }
    box.innerHTML = orders.map((o) => `
      <button type="button" class="adm-order-item ${o.orderId === selectedId ? "active" : ""}" data-id="${o.orderId}">
        <strong>${o.orderId}</strong>
        <small>${o.hotel?.official_name || o.selected_item || "Hotel"} · ${o.customer?.name || "—"}</small>
        ${statusBadge(o.status)}
      </button>
    `).join("");
    box.querySelectorAll(".adm-order-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedId = btn.dataset.id;
        renderList();
        renderDetail(orders.find((o) => o.orderId === selectedId));
      });
    });
  }

  function renderDetail(order) {
    const box = $("admDetail");
    if (!box) return;
    if (!order) {
      box.innerHTML = '<p class="adm-empty">Захиалга сонгоно уу</p>';
      return;
    }

    const h = order.hotel || {};
    const c = order.customer || {};
    const s = order.supplier || {};

    box.innerHTML = `
      <div class="adm-section">
        <h2>Захиалга # ${order.orderId} ${statusBadge(order.status)}</h2>
        <div class="adm-grid">
          <div class="adm-kv"><label>Харилцагч</label><span>${c.name || "—"}</span></div>
          <div class="adm-kv"><label>Утас / WhatsApp</label><span>${c.phone || "—"}</span></div>
          <div class="adm-kv"><label>Email</label><span>${c.email || "—"}</span></div>
          <div class="adm-kv"><label>Хот</label><span>${h.destination || order.destination_city || "—"}</span></div>
          <div class="adm-kv"><label>Буудал</label><span>${h.official_name || "—"}</span></div>
          <div class="adm-kv"><label>Өрөө</label><span>${h.room_type || "—"}</span></div>
          <div class="adm-kv"><label>Check-in</label><span>${fmtDate(h.check_in)}</span></div>
          <div class="adm-kv"><label>Check-out</label><span>${fmtDate(h.check_out)}</span></div>
          <div class="adm-kv"><label>Зочин</label><span>${h.guests || "—"}</span></div>
          <div class="adm-kv"><label>Үнэ (харилцагч)</label><span>${fmtMnt(h.final_price_mnt)}</span></div>
        </div>
      </div>

      <div class="adm-section adm-supplier">
        <h3>🔒 Supplier (дотоод — харилцагч харахгүй)</h3>
        <div class="adm-grid">
          <div class="adm-kv"><label>Supplier</label><span>${s.supplier_name || "—"}</span></div>
          <div class="adm-kv"><label>Hotel ID</label><span>${s.supplier_hotel_id || "—"}</span></div>
          <div class="adm-kv"><label>Supplier үнэ</label><span>${s.supplier_price || "—"} ${s.supplier_currency || "CNY"}</span></div>
          <div class="adm-kv"><label>Last checked</label><span>${fmtDate(s.last_checked_at)}</span></div>
        </div>
        ${s.supplier_url ? `<p style="margin-top:8px"><a href="${s.supplier_url}" target="_blank" rel="noopener" style="color:#60a5fa">${s.supplier_url}</a></p>` : ""}
        <div class="adm-field" style="margin-top:12px">
          <label>Internal notes</label>
          <textarea id="admInternalNotes" rows="3">${order.internal_notes || s.internal_notes || ""}</textarea>
        </div>
      </div>

      <div class="adm-section">
        <h2>Voucher</h2>
        <div class="adm-field">
          <label>Voucher URL (PDF/image link)</label>
          <input type="url" id="admVoucherUrl" value="${order.voucher_url || ""}" placeholder="https://...">
        </div>
        ${order.voucher_sent_at ? `<p style="font-size:12px;color:var(--adm-muted)">Илгээсэн: ${order.voucher_sent_at}</p>` : ""}
      </div>

      <div class="adm-btn-row">
        <button type="button" class="adm-btn primary" data-action="open_supplier">🔗 Open Supplier</button>
        <button type="button" class="adm-btn ok" data-action="availability_ok">✓ Availability OK</button>
        <button type="button" class="adm-btn danger" data-action="sold_out">✗ Sold Out</button>
        <button type="button" class="adm-btn warn" data-action="send_qpay">💳 Send QPay</button>
        <button type="button" class="adm-btn ok" data-action="mark_paid">✓ Mark Paid</button>
        <button type="button" class="adm-btn" data-action="booking_done">📋 Booking Done</button>
        <button type="button" class="adm-btn" data-action="upload_voucher">📎 Upload Voucher</button>
        <button type="button" class="adm-btn" data-action="send_voucher">📤 Send Voucher</button>
        <button type="button" class="adm-btn primary" data-action="complete">✅ Complete</button>
        <button type="button" class="adm-btn" data-action="save_notes">💾 Save Notes</button>
      </div>

      <div id="admAlternatives"></div>
      <div id="admQpayBox" style="margin-top:16px"></div>
    `;

    box.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => runAction(order.orderId, btn.dataset.action));
    });
  }

  async function runAction(orderId, action) {
    try {
      const payload = {
        orderId,
        action,
        internal_notes: $("admInternalNotes")?.value || "",
        voucher_url: $("admVoucherUrl")?.value || ""
      };

      if (action === "open_supplier") {
        const data = await apiPost({ orderId, action: "open_supplier" });
        if (data.supplier_url) window.open(data.supplier_url, "_blank", "noopener");
        toast("Supplier хуудас нээгдлээ");
        return;
      }

      const data = await apiPost(payload);
      toast(data.message || "Амжилттай");

      if (action === "send_qpay" && data.qpay_hint) {
        await sendQPay(data.qpay_hint);
      }

      if (data.alternatives?.length) {
        const altBox = $("admAlternatives");
        if (altBox) {
          altBox.innerHTML = `<div class="adm-section"><h2>🔄 Sold out — ижил төстэй буудлууд (hohhot)</h2>
            ${data.alternatives.map((a) => `
              <div class="adm-alt-card">
                <strong>${a.official_name}</strong> · ${a.stars}★ · ${a.area_name}<br>
                ${fmtMnt(a.final_price_mnt)}
                ${a.supplier_url ? `<br><a href="${a.supplier_url}" target="_blank" rel="noopener" style="color:#60a5fa">Supplier →</a>` : ""}
              </div>
            `).join("")}</div>`;
        }
      }

      await loadOrders();
      selectedId = orderId;
      renderDetail(orders.find((o) => o.orderId === orderId));
    } catch (err) {
      toast("❌ " + err.message);
    }
  }

  async function sendQPay(hint) {
    const box = $("admQpayBox");
    if (!box) return;
    box.innerHTML = "<p>QPay QR бэлдэж байна…</p>";
    try {
      const res = await fetch(API_QPAY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: hint.orderId,
          amount: hint.amount,
          description: `Hotel ${hint.orderId}`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "QPay error");
      const qr = data.qr_image || data.qrImage || "";
      box.innerHTML = qr
        ? `<div class="adm-section"><h2>QPay QR</h2><img src="${qr}" alt="QPay QR" style="max-width:220px;border-radius:8px"><p>${fmtMnt(hint.amount)}</p></div>`
        : `<p>QPay invoice: ${data.invoice_id || "created"}</p>`;
    } catch (err) {
      box.innerHTML = `<p style="color:#f87171">QPay: ${err.message}</p>`;
    }
  }

  function showApp() {
    $("admLogin").style.display = "none";
    $("admApp").style.display = "";
    loadOrders().catch((e) => toast(e.message));
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
      $("admLogin").style.display = "";
      $("admApp").style.display = "none";
    });

    $("admRefresh")?.addEventListener("click", () => loadOrders().catch((e) => toast(e.message)));

    if (adminKey) showApp();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
