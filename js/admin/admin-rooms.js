/**
 * Hotel Rooms CMS
 */
(function () {
  function formFields(r) {
    r = r || {};
    const hotels = AdminStore.getAll("hotels");
    const hotelOpts = hotels.map((h) =>
      `<option value="${h.id}" ${r.hotel_id === h.id ? "selected" : ""}>${AdminCore.esc(h.official_name)}</option>`
    ).join("");
    return `
      <div class="adm-form-grid">
        <div class="adm-field"><label>Hotel</label><select name="hotel_id" required>${hotelOpts}</select></div>
        <div class="adm-field"><label>Room name</label><input name="room_name" value="${AdminCore.esc(r.room_name)}" required></div>
        <div class="adm-field"><label>Room type</label><input name="room_type" value="${AdminCore.esc(r.room_type)}"></div>
        <div class="adm-field"><label>Capacity</label><input name="capacity" type="number" value="${AdminCore.esc(r.capacity || 2)}"></div>
        <div class="adm-field"><label>Beds</label><input name="beds" value="${AdminCore.esc(r.beds)}"></div>
        <div class="adm-field"><label>Breakfast</label><select name="breakfast_included"><option value="true" ${r.breakfast_included ? "selected" : ""}>Тийм</option><option value="false" ${!r.breakfast_included ? "selected" : ""}>Үгүй</option></select></div>
        <div class="adm-field"><label>Free cancel</label><select name="free_cancel"><option value="true" ${r.free_cancel ? "selected" : ""}>Тийм</option><option value="false" ${!r.free_cancel ? "selected" : ""}>Үгүй</option></select></div>
        <div class="adm-field"><label>Final price (MNT)</label><input name="final_price_mnt" type="number" value="${AdminCore.esc(r.final_price_mnt)}"></div>
        <div class="adm-field"><label>Images (comma)</label><input name="images" value="${AdminCore.esc((r.images || []).join(", "))}"></div>
        <div class="adm-field"><label>Active</label><select name="active"><option value="true" ${r.active !== false ? "selected" : ""}>Тийм</option><option value="false" ${r.active === false ? "selected" : ""}>Үгүй</option></select></div>
      </div>`;
  }

  function readForm(backdrop) {
    const g = (n) => backdrop.querySelector(`[name="${n}"]`)?.value?.trim() ?? "";
    return {
      hotel_id: g("hotel_id"),
      room_name: g("room_name"),
      room_type: g("room_type"),
      capacity: parseInt(g("capacity"), 10) || 2,
      beds: g("beds"),
      breakfast_included: g("breakfast_included") === "true",
      free_cancel: g("free_cancel") === "true",
      final_price_mnt: parseInt(g("final_price_mnt"), 10) || 0,
      images: AdminCore.parseCsvList(g("images")),
      active: g("active") === "true"
    };
  }

  function render(ctx) {
    const q = (ctx.search || "").toLowerCase();
    let rows = AdminStore.getAll("hotel_rooms");
    if (q) {
      rows = rows.filter((r) => [r.room_name, AdminCore.hotelName(r.hotel_id)].join(" ").toLowerCase().includes(q));
    }
    return `
      <div class="adm-panel">
        <div class="adm-panel-head">
          <h2>Hotel Rooms (${rows.length})</h2>
          <button type="button" class="adm-btn primary" data-add>+ Өрөө нэмэх</button>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Өрөө</th><th>Буудал</th><th>Capacity</th><th>Үнэ (MNT)</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${rows.map((r) => `
                <tr>
                  <td>${AdminCore.esc(r.room_name)} <small>${AdminCore.esc(r.room_type)}</small></td>
                  <td>${AdminCore.hotelName(r.hotel_id)}</td>
                  <td>${r.capacity}</td>
                  <td>${AdminCore.fmtMnt(r.final_price_mnt)}</td>
                  <td>${AdminCore.badge(r.active)}</td>
                  <td>
                    <button type="button" class="adm-btn sm" data-edit="${r.id}">Засах</button>
                    <button type="button" class="adm-btn sm danger" data-del="${r.id}">Устгах</button>
                  </td>
                </tr>`).join("") || '<tr><td colspan="6" class="adm-empty">Олдсонгүй</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function bind(box, ctx) {
    box.querySelector("[data-add]")?.addEventListener("click", () => {
      AdminCore.openModal("Өрөө нэмэх", formFields(), (backdrop) => {
        AdminStore.create("hotel_rooms", readForm(backdrop));
        ctx.toast("Хадгалагдлаа");
        AdminCore.renderModule();
      });
    });
    box.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = AdminStore.getById("hotel_rooms", btn.dataset.edit);
        AdminCore.openModal("Өрөө засах", formFields(row), (backdrop) => {
          AdminStore.update("hotel_rooms", row.id, readForm(backdrop));
          ctx.toast("Шинэчлэгдлээ");
          AdminCore.renderModule();
        });
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Устгах уу?")) return;
        AdminStore.remove("hotel_rooms", btn.dataset.del);
        ctx.toast("Устгагдлаа");
        AdminCore.renderModule();
      });
    });
  }

  AdminCore.registerModule("rooms", { render, bind });
})();
