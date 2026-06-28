/**
 * Health Guides CMS — insurance, vaccine, hospital
 */
(function () {
  function formFields(h) {
    h = h || {};
    const countries = AdminStore.getAll("countries");
    const cities = AdminStore.getAll("cities");
    const countryOpts = countries.map((c) =>
      `<option value="${c.id}" ${h.country_id === c.id ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`
    ).join("");
    const cityOpts = cities.map((c) =>
      `<option value="${c.id}" ${h.city_id === c.id ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`
    ).join("");
    return `
      <div class="adm-form-grid">
        <div class="adm-field"><label>Type</label><select name="guide_type">
          <option value="insurance" ${h.guide_type === "insurance" ? "selected" : ""}>Insurance</option>
          <option value="vaccine" ${h.guide_type === "vaccine" ? "selected" : ""}>Vaccine</option>
          <option value="hospital" ${h.guide_type === "hospital" ? "selected" : ""}>Hospital</option>
        </select></div>
        <div class="adm-field"><label>Country</label><select name="country_id">${countryOpts}</select></div>
        <div class="adm-field"><label>City</label><select name="city_id">${cityOpts}</select></div>
        <div class="adm-field full"><label>Title (MN)</label><input name="title_mn" value="${AdminCore.esc(h.title_mn)}" required></div>
        <div class="adm-field full"><label>Description (MN)</label><textarea name="description_mn">${AdminCore.esc(h.description_mn)}</textarea></div>
        <div class="adm-field"><label>Address</label><input name="address" value="${AdminCore.esc(h.address)}"></div>
        <div class="adm-field"><label>Phone</label><input name="phone" value="${AdminCore.esc(h.phone)}"></div>
        <div class="adm-field"><label>Website</label><input name="website" type="url" value="${AdminCore.esc(h.website)}"></div>
        <div class="adm-field"><label>Hours (MN)</label><input name="hours_mn" value="${AdminCore.esc(h.hours_mn)}"></div>
        ${AdminCloudinary.fieldCover("cover_image_url", h.cover_image_url || "", "Cover image", AdminCloudinary.FOLDERS.health)}
        ${AdminCloudinary.fieldGallery("image_urls", h.image_urls || [], "Images", AdminCloudinary.FOLDERS.health, { coverField: "cover_image_url", coverUrl: h.cover_image_url || "" })}
        <div class="adm-field"><label>Active</label><select name="active"><option value="true" ${h.active !== false ? "selected" : ""}>Тийм</option><option value="false" ${h.active === false ? "selected" : ""}>Үгүй</option></select></div>
      </div>`;
  }

  function readForm(backdrop) {
    const g = (n) => backdrop.querySelector(`[name="${n}"]`)?.value?.trim() ?? "";
    return {
      guide_type: g("guide_type") || "insurance",
      country_id: g("country_id"),
      city_id: g("city_id"),
      title_mn: g("title_mn"),
      description_mn: g("description_mn"),
      address: g("address"),
      phone: g("phone"),
      website: g("website"),
      hours_mn: g("hours_mn"),
      cover_image_url: AdminCloudinary.readCover(backdrop, "cover_image_url"),
      image_urls: AdminCloudinary.readGallery(backdrop, "image_urls"),
      active: g("active") === "true"
    };
  }

  function render(ctx) {
    const q = (ctx.search || "").toLowerCase();
    let rows = AdminStore.getAll("health_guides");
    if (q) {
      rows = rows.filter((r) =>
        [r.title_mn, r.guide_type, AdminCore.cityName(r.city_id)].join(" ").toLowerCase().includes(q)
      );
    }
    return `
      <div class="adm-panel">
        <div class="adm-panel-head">
          <h2>Health Guides (${rows.length})</h2>
          <button type="button" class="adm-btn primary" data-add>+ Нэмэх</button>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Гарын авлага</th><th>Type</th><th>Хот</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${rows.map((r) => `
                <tr>
                  <td>${AdminCore.esc(r.title_mn)}</td>
                  <td><span class="adm-tag">${AdminCore.esc(r.guide_type)}</span></td>
                  <td>${AdminCore.cityName(r.city_id)}</td>
                  <td>${AdminCore.badge(r.active)}</td>
                  <td>
                    <button type="button" class="adm-btn sm" data-edit="${r.id}">Засах</button>
                    <button type="button" class="adm-btn sm danger" data-del="${r.id}">Устгах</button>
                  </td>
                </tr>`).join("") || '<tr><td colspan="5" class="adm-empty">Олдсонгүй</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function bind(box, ctx) {
    box.querySelector("[data-add]")?.addEventListener("click", () => {
      AdminCore.openModal("Health guide нэмэх", formFields(), (backdrop) => {
        AdminStore.create("health_guides", readForm(backdrop));
        ctx.toast("Хадгалагдлаа");
        AdminCore.renderModule();
      });
    });
    box.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = AdminStore.getById("health_guides", btn.dataset.edit);
        AdminCore.openModal("Health guide засах", formFields(row), (backdrop) => {
          AdminStore.update("health_guides", row.id, readForm(backdrop));
          ctx.toast("Шинэчлэгдлээ");
          AdminCore.renderModule();
        });
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Устгах уu?")) return;
        AdminStore.remove("health_guides", btn.dataset.del);
        ctx.toast("Устгагдлаа");
        AdminCore.renderModule();
      });
    });
  }

  AdminCore.registerModule("health-guides", { render, bind });
})();
