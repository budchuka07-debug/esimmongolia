/**
 * Hotels CMS — customer sees final_price_mnt only; supplier in admin panel
 */
(function () {
  function supplierFields(s) {
    s = s || {};
    return `
      <div class="adm-supplier-box">
        <h3>🔒 Supplier reference (admin only)</h3>
        <div class="adm-form-grid">
          <div class="adm-field"><label>Supplier name</label><input name="supplier_name" value="${AdminCore.esc(s.supplier_name)}"></div>
          <div class="adm-field"><label>Supplier URL</label><input name="supplier_url" type="url" value="${AdminCore.esc(s.supplier_url)}"></div>
          <div class="adm-field"><label>Supplier hotel ID</label><input name="supplier_hotel_id" value="${AdminCore.esc(s.supplier_hotel_id)}"></div>
          <div class="adm-field"><label>Supplier price</label><input name="supplier_price" type="number" step="any" value="${AdminCore.esc(s.supplier_price)}"></div>
          <div class="adm-field"><label>Supplier currency</label><input name="supplier_currency" value="${AdminCore.esc(s.supplier_currency || "CNY")}"></div>
          <div class="adm-field"><label>Markup %</label><input name="markup_percent" type="number" value="${AdminCore.esc(s.markup_percent ?? 15)}"></div>
          <div class="adm-field"><label>Last checked</label><input name="last_checked_at" type="date" value="${AdminCore.esc(s.last_checked_at || "")}"></div>
          <div class="adm-field full"><label>Internal notes</label><textarea name="internal_notes">${AdminCore.esc(s.internal_notes)}</textarea></div>
        </div>
      </div>`;
  }

  function formFields(h) {
    h = h || {};
    const s = h.supplier_reference || {};
    const countries = AdminStore.getAll("countries");
    const cities = AdminStore.getAll("cities");
    const countryOpts = countries.map((c) => `<option value="${c.id}" ${h.country_id === c.id ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`).join("");
    const cityOpts = cities.map((c) => `<option value="${c.id}" ${h.city_id === c.id ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`).join("");
    return `
      <div class="adm-form-grid">
        <div class="adm-field"><label>Country</label><select name="country_id">${countryOpts}</select></div>
        <div class="adm-field"><label>City</label><select name="city_id">${cityOpts}</select></div>
        <div class="adm-field"><label>Official name</label><input name="official_name" value="${AdminCore.esc(h.official_name)}" required></div>
        <div class="adm-field"><label>Нэр (MN, optional)</label><input name="name_mn_optional" value="${AdminCore.esc(h.name_mn_optional)}"></div>
        <div class="adm-field"><label>Stars</label><input name="stars" type="number" min="1" max="5" value="${AdminCore.esc(h.stars || 3)}"></div>
        <div class="adm-field"><label>District</label><input name="district" value="${AdminCore.esc(h.district)}"></div>
        <div class="adm-field"><label>Area</label><input name="area_name" value="${AdminCore.esc(h.area_name)}"></div>
        <div class="adm-field full"><label>Address</label><input name="address" value="${AdminCore.esc(h.address)}"></div>
        <div class="adm-field"><label>Latitude</label><input name="latitude" type="number" step="any" value="${AdminCore.esc(h.latitude)}"></div>
        <div class="adm-field"><label>Longitude</label><input name="longitude" type="number" step="any" value="${AdminCore.esc(h.longitude)}"></div>
        <div class="adm-field full"><label>Description (MN)</label><textarea name="description_mn">${AdminCore.esc(h.description_mn)}</textarea></div>
        ${AdminCloudinary.fieldCover("cover_image_url", h.cover_image_url || h.cover_image || "", "Cover image", "esimmongolia/hotels")}
        ${AdminCloudinary.fieldGallery("gallery_image_urls", h.gallery_image_urls || h.images || [], "Gallery", "esimmongolia/hotels")}
        ${AdminCloudinary.fieldGallery("room_image_urls", h.room_image_urls || h.room_images || [], "Room images", "esimmongolia/hotels/rooms")}
        <div class="adm-field"><label>Amenities</label><input name="amenities" value="${AdminCore.esc((h.amenities || []).join(", "))}"></div>
        <div class="adm-field"><label>Nearby metro</label><input name="nearby_metro" value="${AdminCore.esc(h.nearby_metro)}"></div>
        <div class="adm-field"><label>Landmarks</label><input name="nearby_landmarks" value="${AdminCore.esc((h.nearby_landmarks || []).join(", "))}"></div>
        <div class="adm-field"><label>Final price (MNT) — customer</label><input name="final_price_mnt" type="number" value="${AdminCore.esc(h.final_price_mnt)}" required></div>
        <div class="adm-field"><label>Active</label><select name="active"><option value="true" ${h.active !== false ? "selected" : ""}>Тийм</option><option value="false" ${h.active === false ? "selected" : ""}>Үгүй</option></select></div>
      </div>
      ${supplierFields(s)}`;
  }

  function readForm(backdrop) {
    const g = (n) => backdrop.querySelector(`[name="${n}"]`)?.value?.trim() ?? "";
    return {
      country_id: g("country_id"),
      city_id: g("city_id"),
      official_name: g("official_name"),
      name_mn_optional: g("name_mn_optional"),
      stars: parseInt(g("stars"), 10) || 3,
      district: g("district"),
      area_name: g("area_name"),
      address: g("address"),
      latitude: parseFloat(g("latitude")) || null,
      longitude: parseFloat(g("longitude")) || null,
      description_mn: g("description_mn"),
      cover_image_url: AdminCloudinary.readCover(backdrop, "cover_image_url"),
      gallery_image_urls: AdminCloudinary.readGallery(backdrop, "gallery_image_urls"),
      room_image_urls: AdminCloudinary.readGallery(backdrop, "room_image_urls"),
      amenities: AdminCore.parseCsvList(g("amenities")),
      nearby_metro: g("nearby_metro"),
      nearby_landmarks: AdminCore.parseCsvList(g("nearby_landmarks")),
      final_price_mnt: parseInt(g("final_price_mnt"), 10) || 0,
      active: g("active") === "true",
      supplier_reference: {
        supplier_name: g("supplier_name"),
        supplier_url: g("supplier_url"),
        supplier_hotel_id: g("supplier_hotel_id"),
        supplier_price: parseFloat(g("supplier_price")) || 0,
        supplier_currency: g("supplier_currency") || "CNY",
        markup_percent: parseFloat(g("markup_percent")) || 15,
        internal_notes: g("internal_notes"),
        last_checked_at: g("last_checked_at") || null
      }
    };
  }

  function render(ctx) {
    const q = (ctx.search || "").toLowerCase();
    let rows = AdminStore.getAll("hotels");
    if (q) {
      rows = rows.filter((h) => [h.official_name, h.name_mn_optional, h.area_name, AdminCore.cityName(h.city_id)].join(" ").toLowerCase().includes(q));
    }
    return `
      <div class="adm-panel">
        <div class="adm-panel-head">
          <h2>Hotels (${rows.length})</h2>
          <button type="button" class="adm-btn primary" data-add>+ Буудал нэмэх</button>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Буудал</th><th>Хот</th><th>★</th><th>Үнэ (MNT)</th><th>Supplier</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${rows.map((h) => `
                <tr>
                  <td><strong>${AdminCore.esc(h.official_name)}</strong><br><small>${AdminCore.esc(h.area_name)}</small></td>
                  <td>${AdminCore.cityName(h.city_id)}</td>
                  <td>${h.stars || "—"}</td>
                  <td>${AdminCore.fmtMnt(h.final_price_mnt)}</td>
                  <td><small>${AdminCore.esc(h.supplier_reference?.supplier_name || "—")}</small></td>
                  <td>${AdminCore.badge(h.active)}</td>
                  <td>
                    <button type="button" class="adm-btn sm" data-edit="${h.id}">Засах</button>
                    ${h.supplier_reference?.supplier_url ? `<a class="adm-btn sm" href="${AdminCore.esc(h.supplier_reference.supplier_url)}" target="_blank" rel="noopener">Supplier</a>` : ""}
                    <button type="button" class="adm-btn sm danger" data-del="${h.id}">Устгах</button>
                  </td>
                </tr>`).join("") || '<tr><td colspan="7" class="adm-empty">Олдсонгүй</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function bind(box, ctx) {
    box.querySelector("[data-add]")?.addEventListener("click", () => {
      AdminCore.openModal("Буудал нэмэх", formFields(), (backdrop) => {
        AdminStore.create("hotels", readForm(backdrop));
        ctx.toast("Хадгалагдлаа");
        AdminCore.renderModule();
      });
    });
    box.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = AdminStore.getById("hotels", btn.dataset.edit);
        AdminCore.openModal("Буудал засах", formFields(row), (backdrop) => {
          AdminStore.update("hotels", row.id, readForm(backdrop));
          ctx.toast("Шинэчлэгдлээ");
          AdminCore.renderModule();
        });
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Устгах уу?")) return;
        AdminStore.remove("hotels", btn.dataset.del);
        ctx.toast("Устгагдлаа");
        AdminCore.renderModule();
      });
    });
  }

  AdminCore.registerModule("hotels", { render, bind });
})();
