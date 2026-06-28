/**
 * Long Stay Rentals CMS
 */
(function () {
  function formFields(row) {
    row = row || {};
    const s = row.supplier_reference || {};
    const countries = AdminStore.getAll("countries");
    const cities = AdminStore.getAll("cities");
    const countryOpts = countries.map((c) => `<option value="${c.id}" ${row.country_id === c.id ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`).join("");
    const cityOpts = cities.map((c) => `<option value="${c.id}" ${row.city_id === c.id ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`).join("");
    return `
      <div class="adm-form-grid">
        <div class="adm-field"><label>Country</label><select name="country_id">${countryOpts}</select></div>
        <div class="adm-field"><label>City</label><select name="city_id">${cityOpts}</select></div>
        <div class="adm-field"><label>Area</label><input name="area" value="${AdminCore.esc(row.area)}"></div>
        <div class="adm-field"><label>Property type</label><input name="property_type" value="${AdminCore.esc(row.property_type)}"></div>
        <div class="adm-field"><label>Bedrooms</label><input name="bedrooms" type="number" value="${AdminCore.esc(row.bedrooms)}"></div>
        <div class="adm-field"><label>Monthly USD</label><input name="monthly_price_usd" type="number" value="${AdminCore.esc(row.monthly_price_usd)}"></div>
        <div class="adm-field"><label>Monthly MNT</label><input name="monthly_price_mnt" type="number" value="${AdminCore.esc(row.monthly_price_mnt)}"></div>
        <div class="adm-field"><label>Min stay (months)</label><input name="min_stay_months" type="number" value="${AdminCore.esc(row.min_stay_months || 1)}"></div>
        <div class="adm-field full"><label>Deposit info (MN)</label><input name="deposit_info_mn" value="${AdminCore.esc(row.deposit_info_mn)}"></div>
        <div class="adm-field full"><label>Utilities (MN)</label><input name="utilities_info_mn" value="${AdminCore.esc(row.utilities_info_mn)}"></div>
        <div class="adm-field full"><label>Internet (MN)</label><input name="internet_info_mn" value="${AdminCore.esc(row.internet_info_mn)}"></div>
        <div class="adm-field"><label>Distance to beach</label><input name="distance_to_beach" value="${AdminCore.esc(row.distance_to_beach)}"></div>
        <div class="adm-field"><label>Distance to center</label><input name="distance_to_center" value="${AdminCore.esc(row.distance_to_center)}"></div>
        ${AdminCloudinary.fieldCover("cover_image_url", row.cover_image_url || "", "Cover image", "esimmongolia/rentals")}
        ${AdminCloudinary.fieldGallery("gallery_image_urls", row.gallery_image_urls || row.images || [], "Gallery", "esimmongolia/rentals")}
        <div class="adm-field"><label>Amenities</label><input name="amenities" value="${AdminCore.esc((row.amenities || []).join(", "))}"></div>
        <div class="adm-field"><label>Suitable for</label><input name="suitable_for" value="${AdminCore.esc((row.suitable_for || []).join(", "))}"></div>
        <div class="adm-field full"><label>Description (MN)</label><textarea name="description_mn">${AdminCore.esc(row.description_mn)}</textarea></div>
        <div class="adm-field"><label>Active</label><select name="active"><option value="true">Тийм</option><option value="false">Үгүй</option></select></div>
      </div>
      <div class="adm-supplier-box">
        <h3>🔒 Supplier</h3>
        <div class="adm-form-grid">
          <div class="adm-field"><label>Name</label><input name="supplier_name" value="${AdminCore.esc(s.supplier_name)}"></div>
          <div class="adm-field"><label>URL</label><input name="supplier_url" value="${AdminCore.esc(s.supplier_url)}"></div>
          <div class="adm-field"><label>ID</label><input name="supplier_id" value="${AdminCore.esc(s.supplier_id)}"></div>
          <div class="adm-field"><label>Price</label><input name="supplier_price" type="number" value="${AdminCore.esc(s.supplier_price)}"></div>
          <div class="adm-field"><label>Currency</label><input name="currency" value="${AdminCore.esc(s.currency || "USD")}"></div>
          <div class="adm-field"><label>Markup %</label><input name="markup_percent" type="number" value="${AdminCore.esc(s.markup_percent ?? 15)}"></div>
        </div>
      </div>`;
  }

  function readForm(backdrop) {
    const g = (n) => backdrop.querySelector(`[name="${n}"]`)?.value?.trim() ?? "";
    return {
      country_id: g("country_id"),
      city_id: g("city_id"),
      area: g("area"),
      property_type: g("property_type"),
      bedrooms: parseInt(g("bedrooms"), 10) || 1,
      monthly_price_usd: parseFloat(g("monthly_price_usd")) || 0,
      monthly_price_mnt: parseInt(g("monthly_price_mnt"), 10) || 0,
      deposit_info_mn: g("deposit_info_mn"),
      utilities_info_mn: g("utilities_info_mn"),
      internet_info_mn: g("internet_info_mn"),
      distance_to_beach: g("distance_to_beach"),
      distance_to_center: g("distance_to_center"),
      cover_image_url: AdminCloudinary.readCover(backdrop, "cover_image_url"),
      gallery_image_urls: AdminCloudinary.readGallery(backdrop, "gallery_image_urls"),
      amenities: AdminCore.parseCsvList(g("amenities")),
      description_mn: g("description_mn"),
      min_stay_months: parseInt(g("min_stay_months"), 10) || 1,
      suitable_for: AdminCore.parseCsvList(g("suitable_for")),
      active: g("active") === "true",
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
    const rows = AdminStore.getAll("rentals");
    return `
      <div class="adm-panel">
        <div class="adm-panel-head"><h2>Long Stay Rentals (${rows.length})</h2><button type="button" class="adm-btn primary" data-add>+ Нэмэх</button></div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Байршил</th><th>Type</th><th>Bedrooms</th><th>Үнэ/сар (MNT)</th><th></th></tr></thead>
            <tbody>
              ${rows.map((r) => `
                <tr>
                  <td>${AdminCore.cityName(r.city_id)} — ${AdminCore.esc(r.area)}</td>
                  <td>${AdminCore.esc(r.property_type)}</td>
                  <td>${r.bedrooms}</td>
                  <td>${AdminCore.fmtMnt(r.monthly_price_mnt)}</td>
                  <td>
                    <button type="button" class="adm-btn sm" data-edit="${r.id}">Засах</button>
                    <button type="button" class="adm-btn sm danger" data-del="${r.id}">Устгах</button>
                  </td>
                </tr>`).join("") || '<tr><td colspan="5" class="adm-empty">Байхгүй</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function bind(box, ctx) {
    box.querySelector("[data-add]")?.addEventListener("click", () => {
      AdminCore.openModal("Түрээс нэмэх", formFields(), (backdrop) => {
        AdminStore.create("rentals", readForm(backdrop));
        ctx.toast("Хадгалагдлаа");
        AdminCore.renderModule();
      });
    });
    box.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = AdminStore.getById("rentals", btn.dataset.edit);
        AdminCore.openModal("Түрээс засах", formFields(row), (backdrop) => {
          AdminStore.update("rentals", row.id, readForm(backdrop));
          AdminCore.renderModule();
        });
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Устгах уу?")) return;
        AdminStore.remove("rentals", btn.dataset.del);
        AdminCore.renderModule();
      });
    });
  }

  AdminCore.registerModule("rentals", { render, bind });
})();
