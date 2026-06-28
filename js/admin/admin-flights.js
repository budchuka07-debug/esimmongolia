/**
 * Flights CMS
 */
(function () {
  function supplierFields(s) {
    s = s || {};
    return `
      <div class="adm-supplier-box">
        <h3>🔒 Supplier reference</h3>
        <div class="adm-form-grid">
          <div class="adm-field"><label>Supplier</label><input name="supplier_name" value="${AdminCore.esc(s.supplier_name)}"></div>
          <div class="adm-field"><label>URL</label><input name="supplier_url" value="${AdminCore.esc(s.supplier_url)}"></div>
          <div class="adm-field"><label>ID</label><input name="supplier_id" value="${AdminCore.esc(s.supplier_id)}"></div>
          <div class="adm-field"><label>Price</label><input name="supplier_price" type="number" value="${AdminCore.esc(s.supplier_price)}"></div>
          <div class="adm-field"><label>Currency</label><input name="currency" value="${AdminCore.esc(s.currency || "USD")}"></div>
          <div class="adm-field"><label>Markup %</label><input name="markup_percent" type="number" value="${AdminCore.esc(s.markup_percent ?? 15)}"></div>
        </div>
      </div>`;
  }

  function formFields(f) {
    f = f || {};
    const cities = AdminStore.getAll("cities");
    const opts = (sel) => cities.map((c) => `<option value="${c.id}" ${c.id === sel ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`).join("");
    return `
      <div class="adm-form-grid">
        <div class="adm-field"><label>From</label><select name="from_city_id">${opts(f.from_city_id)}</select></div>
        <div class="adm-field"><label>To</label><select name="to_city_id">${opts(f.to_city_id)}</select></div>
        <div class="adm-field"><label>Airline</label><input name="airline" value="${AdminCore.esc(f.airline)}"></div>
        <div class="adm-field"><label>Route type</label><select name="route_type"><option value="direct" ${f.route_type === "direct" ? "selected" : ""}>direct</option><option value="transfer" ${f.route_type === "transfer" ? "selected" : ""}>transfer</option></select></div>
        <div class="adm-field"><label>Transfer city</label><select name="transfer_city_id"><option value="">—</option>${opts(f.transfer_city_id)}</select></div>
        <div class="adm-field"><label>Departure</label><input name="departure_time" value="${AdminCore.esc(f.departure_time)}"></div>
        <div class="adm-field"><label>Arrival</label><input name="arrival_time" value="${AdminCore.esc(f.arrival_time)}"></div>
        <div class="adm-field"><label>Duration</label><input name="duration" value="${AdminCore.esc(f.duration)}"></div>
        <div class="adm-field full"><label>Baggage note (MN)</label><input name="baggage_note_mn" value="${AdminCore.esc(f.baggage_note_mn)}"></div>
        <div class="adm-field"><label>Final price (MNT)</label><input name="final_price_mnt" type="number" value="${AdminCore.esc(f.final_price_mnt)}"></div>
        <div class="adm-field"><label>Data confidence</label><select name="data_confidence"><option value="high">high</option><option value="medium">medium</option><option value="low">low</option></select></div>
        <div class="adm-field"><label>Active</label><select name="active"><option value="true">Тийм</option><option value="false">Үгүй</option></select></div>
        ${AdminCloudinary.fieldCover("cover_image_url", f.cover_image_url || "", "Cover image", AdminCloudinary.FOLDERS.flights)}
      </div>${supplierFields(f.supplier_reference)}`;
  }

  function readForm(backdrop) {
    const g = (n) => backdrop.querySelector(`[name="${n}"]`)?.value?.trim() ?? "";
    return {
      from_city_id: g("from_city_id"),
      to_city_id: g("to_city_id"),
      airline: g("airline"),
      route_type: g("route_type"),
      transfer_city_id: g("transfer_city_id") || null,
      departure_time: g("departure_time"),
      arrival_time: g("arrival_time"),
      duration: g("duration"),
      baggage_note_mn: g("baggage_note_mn"),
      final_price_mnt: parseInt(g("final_price_mnt"), 10) || 0,
      data_confidence: g("data_confidence"),
      active: g("active") === "true",
      cover_image_url: AdminCloudinary.readCover(backdrop, "cover_image_url"),
      supplier_reference: {
        supplier_name: g("supplier_name"),
        supplier_url: g("supplier_url"),
        supplier_id: g("supplier_id"),
        supplier_price: parseFloat(g("supplier_price")) || 0,
        currency: g("currency"),
        markup_percent: parseFloat(g("markup_percent")) || 15
      }
    };
  }

  function render() {
    const rows = AdminStore.getAll("flights");
    return `
      <div class="adm-panel">
        <div class="adm-panel-head"><h2>Flights (${rows.length})</h2><button type="button" class="adm-btn primary" data-add>+ Нэмэх</button></div>
        <p style="padding:0 18px;color:#64748b;font-size:13px">Шууд нислэг байхгүй бол харилцагчид дамжин нислэгийн хувилбар харуулна.</p>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Маршрут</th><th>Airline</th><th>Type</th><th>Үнэ (MNT)</th><th></th></tr></thead>
            <tbody>
              ${rows.map((f) => `
                <tr>
                  <td>${AdminCore.cityName(f.from_city_id)} → ${AdminCore.cityName(f.to_city_id)}</td>
                  <td>${AdminCore.esc(f.airline)}</td>
                  <td>${f.route_type === "transfer" ? "дамжин" : "шууд"}</td>
                  <td>${AdminCore.fmtMnt(f.final_price_mnt)}</td>
                  <td>
                    <button type="button" class="adm-btn sm" data-edit="${f.id}">Засах</button>
                    <button type="button" class="adm-btn sm danger" data-del="${f.id}">Устгах</button>
                  </td>
                </tr>`).join("") || '<tr><td colspan="5" class="adm-empty">Байхгүй</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function bind(box, ctx) {
    box.querySelector("[data-add]")?.addEventListener("click", () => {
      AdminCore.openModal("Нислэг нэмэх", formFields(), (backdrop) => {
        AdminStore.create("flights", readForm(backdrop));
        ctx.toast("Хадгалагдлаа");
        AdminCore.renderModule();
      });
    });
    box.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = AdminStore.getById("flights", btn.dataset.edit);
        AdminCore.openModal("Нислэг засах", formFields(row), (backdrop) => {
          AdminStore.update("flights", row.id, readForm(backdrop));
          AdminCore.renderModule();
        });
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Устгах уу?")) return;
        AdminStore.remove("flights", btn.dataset.del);
        AdminCore.renderModule();
      });
    });
  }

  AdminCore.registerModule("flights", { render, bind });
})();
