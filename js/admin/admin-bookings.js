/**
 * Bookings Admin — local store + Netlify API merge
 */
(function () {
  const API_ORDERS = "/.netlify/functions/admin-orders";
  const API_ACTION = "/.netlify/functions/admin-order-action";
  const API_QPAY = "/.netlify/functions/qpay-create-invoice";

  let selectedId = null;
  let apiOrders = [];

  const STATUS_FLOW = {
    availability_ok: "available",
    sold_out: "sold_out",
    suggest_alternative: "alternative_sent",
    send_qpay: "qpay_sent",
    mark_paid: "paid",
    booking_done: "booking_in_progress",
    send_voucher: "voucher_sent",
    complete: "completed",
    cancel: "cancelled"
  };

  const NEEDS_AVAILABILITY = ["hotel", "flight", "train"];

  function allBookings() {
    const local = AdminStore.getAll("bookings");
    const localIds = new Set(local.map((b) => b.orderId || b.id));
    const merged = [...local];
    apiOrders.forEach((o) => {
      const oid = o.orderId || o.id;
      if (!localIds.has(oid)) {
        merged.push(normalizeApiOrder(o));
      }
    });
    return merged.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }

  function normalizeApiOrder(o) {
    return {
      id: o.orderId || o.id,
      orderId: o.orderId || o.id,
      status: o.status || "new",
      service_type: o.service_type || "hotel",
      customer: o.customer || {},
      destination: o.destination_city || o.hotel?.destination || "—",
      date: o.hotel?.check_in || o.travel_date || "",
      guests: o.hotel?.guests || o.people_count || 1,
      selected_item: o.hotel?.official_name || o.selected_item || "—",
      hotel_id: o.hotel_id,
      final_price_mnt: o.hotel?.final_price_mnt || o.final_price_mnt || 0,
      supplier: o.supplier || {},
      voucher_url: o.voucher_url || "",
      internal_notes: o.internal_notes || "",
      created_at: o.created_at,
      _fromApi: true
    };
  }

  async function loadApiOrders() {
    try {
      const res = await fetch(API_ORDERS, { headers: AdminCore.authHeaders() });
      const data = await res.json();
      if (res.ok) apiOrders = data.orders || [];
    } catch (_) {
      apiOrders = [];
    }
  }

  function canSendQPay(booking) {
    if (!NEEDS_AVAILABILITY.includes(booking.service_type)) return true;
    return ["available", "paid", "booking_in_progress", "voucher_sent", "completed"].includes(booking.status);
  }

  function renderDetail(booking, ctx) {
    if (!booking) return '<p class="adm-empty">Захиалга сонгоно уу</p>';
    const c = booking.customer || {};
    const s = booking.supplier || {};
    const profit = s.profit_mnt || Math.round((booking.final_price_mnt || 0) * ((s.markup_percent || 15) / 115));

    return `
      <div class="adm-panel">
        <div class="adm-panel-head">
          <h2># ${AdminCore.esc(booking.orderId || booking.id)} ${AdminCore.statusBadge(booking.status)}</h2>
        </div>
        <div class="adm-panel-body">
          <h3 style="margin:0 0 12px;font-size:14px">Харилцагч</h3>
          <div class="adm-form-grid">
            <div class="adm-field"><label>Нэр</label><span>${AdminCore.esc(c.name)}</span></div>
            <div class="adm-field"><label>Утас / WhatsApp</label><span>${AdminCore.esc(c.phone)}</span></div>
            <div class="adm-field"><label>Email</label><span>${AdminCore.esc(c.email)}</span></div>
          </div>
          <h3 style="margin:16px 0 12px;font-size:14px">Захиалга</h3>
          <div class="adm-form-grid">
            <div class="adm-field"><label>Төрөл</label><span>${AdminCore.esc(booking.service_type)}</span></div>
            <div class="adm-field"><label>Чиглэл</label><span>${AdminCore.esc(booking.destination)}</span></div>
            <div class="adm-field"><label>Огноо</label><span>${AdminCore.fmtDate(booking.date)}</span></div>
            <div class="adm-field"><label>Зочин</label><span>${booking.guests || "—"}</span></div>
            <div class="adm-field"><label>Сонгосон</label><span>${AdminCore.esc(booking.selected_item)}</span></div>
            <div class="adm-field"><label>Үнэ (харилцагч)</label><span><strong>${AdminCore.fmtMnt(booking.final_price_mnt)}</strong></span></div>
          </div>

          <div class="adm-supplier-box">
            <h3>🔒 Supplier (admin only)</h3>
            <div class="adm-form-grid">
              <div class="adm-field"><label>Supplier</label><span>${AdminCore.esc(s.supplier_name || "—")}</span></div>
              <div class="adm-field"><label>Supplier ID</label><span>${AdminCore.esc(s.supplier_id || s.supplier_hotel_id || "—")}</span></div>
              <div class="adm-field"><label>Supplier үнэ</label><span>${s.supplier_price || "—"} ${AdminCore.esc(s.currency || s.supplier_currency || "")}</span></div>
              <div class="adm-field"><label>Markup</label><span>${s.markup_percent || "—"}%</span></div>
              <div class="adm-field"><label>Profit</label><span>${AdminCore.fmtMnt(profit)}</span></div>
            </div>
            ${s.supplier_url ? `<p><a href="${AdminCore.esc(s.supplier_url)}" target="_blank" rel="noopener">${AdminCore.esc(s.supplier_url)}</a></p>` : ""}
            <div class="adm-field" style="margin-top:12px">
              <label>Internal notes</label>
              <textarea id="bkNotes" rows="2">${AdminCore.esc(booking.internal_notes || "")}</textarea>
            </div>
            <div class="adm-field">
              <label>Voucher URL</label>
              <input type="url" id="bkVoucher" value="${AdminCore.esc(booking.voucher_url || "")}">
            </div>
          </div>

          <div class="adm-btn-row">
            <button type="button" class="adm-btn" data-act="open_supplier">🔗 Open Supplier</button>
            <button type="button" class="adm-btn ok" data-act="availability_ok">✓ Availability OK</button>
            <button type="button" class="adm-btn danger" data-act="sold_out">✗ Sold Out</button>
            <button type="button" class="adm-btn warn" data-act="suggest_alternative">🔄 Suggest Alternative</button>
            <button type="button" class="adm-btn warn" data-act="send_qpay" ${canSendQPay(booking) ? "" : "disabled title='Эхлээд availability баталгаажуулна уу'"}>💳 Send QPay</button>
            <button type="button" class="adm-btn ok" data-act="mark_paid">✓ Mark Paid</button>
            <button type="button" class="adm-btn" data-act="booking_done">📋 Booking Done</button>
            <button type="button" class="adm-btn" data-act="send_voucher">📤 Send Voucher</button>
            <button type="button" class="adm-btn primary" data-act="complete">✅ Complete</button>
            <button type="button" class="adm-btn danger" data-act="cancel">Cancel</button>
          </div>
          <div id="bkAlts"></div>
          <div id="bkQpay"></div>
        </div>
      </div>`;
  }

  function updateLocalBooking(id, patch) {
    const local = AdminStore.getById("bookings", id);
    if (local) {
      AdminStore.update("bookings", id, patch);
      return;
    }
    const byOrder = AdminStore.getAll("bookings").find((b) => (b.orderId || b.id) === id);
    if (byOrder) AdminStore.update("bookings", byOrder.id, patch);
    else AdminStore.create("bookings", { orderId: id, id, ...patch });
  }

  async function runAction(booking, action, ctx) {
    const oid = booking.orderId || booking.id;
    const notes = document.getElementById("bkNotes")?.value || "";
    const voucher = document.getElementById("bkVoucher")?.value || "";

    if (action === "send_qpay" && !canSendQPay(booking)) {
      ctx.toast("Эхлээд availability баталгаажуулна уу", true);
      return;
    }

    if (action === "open_supplier") {
      const url = booking.supplier?.supplier_url;
      if (url) window.open(url, "_blank", "noopener");
      else ctx.toast("Supplier URL байхгүй", true);
      return;
    }

    if (action === "sold_out" && booking.hotel_id) {
      const alts = AdminStore.findSimilarHotels(booking.hotel_id);
      const altBox = document.getElementById("bkAlts");
      if (altBox && alts.length) {
        altBox.innerHTML = `<div class="adm-panel" style="margin-top:16px"><div class="adm-panel-head"><h2>Ижил төстэй буудлууд</h2></div><div class="adm-panel-body">
          ${alts.map((h) => `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px">
            <strong>${AdminCore.esc(h.official_name)}</strong> · ${h.stars}★ · ${AdminCore.esc(h.area_name)}<br>
            ${AdminCore.fmtMnt(h.final_price_mnt)}
          </div>`).join("")}
        </div></div>`;
      }
    }

    if (booking._fromApi) {
      try {
        const res = await fetch(API_ACTION, {
          method: "POST",
          headers: AdminCore.authHeaders(),
          body: JSON.stringify({ orderId: oid, action, internal_notes: notes, voucher_url: voucher, admin_key: AdminCore.adminKey })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "API error");
        if (action === "send_qpay" && data.qpay_hint) await sendQPay(data.qpay_hint, ctx);
        if (data.alternatives?.length) showApiAlts(data.alternatives);
        ctx.toast(data.message || "Амжилттай");
        await loadApiOrders();
        AdminCore.renderModule();
        selectedId = oid;
        return;
      } catch (err) {
        ctx.toast(err.message, true);
        return;
      }
    }

    const newStatus = STATUS_FLOW[action] || booking.status;
    const patch = { status: newStatus, internal_notes: notes, voucher_url: voucher };
    if (action === "mark_paid") patch.paid_at = new Date().toISOString();
    if (action === "send_voucher") patch.voucher_sent_at = new Date().toISOString();
    if (action === "send_qpay") {
      patch.status = "qpay_sent";
      await sendQPay({ orderId: oid, amount: booking.final_price_mnt }, ctx);
    }
    updateLocalBooking(booking.id, patch);
    ctx.toast("Шинэчлэгдлээ");
    AdminCore.renderModule();
    selectedId = oid;
  }

  function showApiAlts(alts) {
    const altBox = document.getElementById("bkAlts");
    if (!altBox) return;
    altBox.innerHTML = `<div class="adm-panel" style="margin-top:16px"><div class="adm-panel-head"><h2>Ижил төстэй буудлууд</h2></div><div class="adm-panel-body">
      ${alts.map((a) => `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px">
        <strong>${AdminCore.esc(a.official_name)}</strong> · ${a.stars}★ · ${AdminCore.esc(a.area_name)}<br>${AdminCore.fmtMnt(a.final_price_mnt)}
      </div>`).join("")}
    </div></div>`;
  }

  async function sendQPay(hint, ctx) {
    const box = document.getElementById("bkQpay");
    if (!box) return;
    box.innerHTML = "<p>QPay QR бэлдэж байна…</p>";
    try {
      const res = await fetch(API_QPAY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: hint.orderId, amount: hint.amount, description: `Booking ${hint.orderId}` })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "QPay error");
      const qr = data.qr_image || data.qrImage || "";
      box.innerHTML = qr
        ? `<div class="adm-panel"><div class="adm-panel-body"><h3>QPay QR</h3><img src="${qr}" alt="QPay" style="max-width:200px;border-radius:8px"><p>${AdminCore.fmtMnt(hint.amount)}</p></div></div>`
        : `<p>Invoice: ${data.invoice_id || "created"}</p>`;
    } catch (err) {
      box.innerHTML = `<p style="color:#dc2626">QPay: ${AdminCore.esc(err.message)} (local demo)</p>`;
    }
  }

  function render(ctx) {
    const q = (ctx.search || "").toLowerCase();
    let bookings = allBookings();
    if (q) {
      bookings = bookings.filter((b) =>
        [b.orderId, b.id, b.customer?.name, b.customer?.phone, b.destination, b.selected_item].join(" ").toLowerCase().includes(q)
      );
    }
    const sel = bookings.find((b) => (b.orderId || b.id) === selectedId);

    return `
      <div class="adm-split">
        <div>
          <div class="adm-panel">
            <div class="adm-panel-head"><h2>Захиалгууд (${bookings.length})</h2></div>
            <div class="adm-panel-body" style="padding-top:8px">
              ${bookings.map((b) => `
                <button type="button" class="adm-list-item ${(b.orderId || b.id) === selectedId ? "active" : ""}" data-pick="${AdminCore.esc(b.orderId || b.id)}">
                  <strong>${AdminCore.esc(b.orderId || b.id)}</strong>
                  <small>${AdminCore.esc(b.selected_item)} · ${AdminCore.esc(b.customer?.name || "—")}</small>
                  ${AdminCore.statusBadge(b.status)}
                </button>`).join("") || '<p class="adm-empty">Захиалга байхгүй</p>'}
            </div>
          </div>
        </div>
        <div id="bkDetail">${renderDetail(sel, ctx)}</div>
      </div>`;
  }

  function bind(box, ctx) {
    loadApiOrders().then(() => {
      if (selectedId) AdminCore.renderModule();
    });

    box.querySelectorAll("[data-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedId = btn.dataset.pick;
        AdminCore.renderModule();
      });
    });

    const detail = box.querySelector("#bkDetail");
    detail?.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const bookings = allBookings();
        const booking = bookings.find((b) => (b.orderId || b.id) === selectedId);
        if (booking) runAction(booking, btn.dataset.act, ctx);
      });
    });
  }

  AdminCore.registerModule("bookings", { render, bind });
})();
