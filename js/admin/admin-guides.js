/**
 * Travel Guides CMS — Cloudinary cover + gallery
 */
(function () {
  const CATS = ["general", "visa", "transport", "food", "culture", "safety", "budget", "esim"];

  function formFields(g) {
    g = g || {};
    const countries = AdminStore.getAll("countries");
    const cities = AdminStore.getAll("cities");
    const countryOpts = countries.map((c) =>
      `<option value="${c.id}" ${g.country_id === c.id ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`
    ).join("");
    const cityOpts = cities.map((c) =>
      `<option value="${c.id}" ${g.city_id === c.id ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`
    ).join("");
    const catOpts = CATS.map((cat) =>
      `<option value="${cat}" ${g.category === cat ? "selected" : ""}>${cat}</option>`
    ).join("");
    return `
      <div class="adm-form-grid">
        <div class="adm-field"><label>Country</label><select name="country_id">${countryOpts}</select></div>
        <div class="adm-field"><label>City</label><select name="city_id">${cityOpts}</select></div>
        <div class="adm-field"><label>Slug</label><input name="slug" value="${AdminCore.esc(g.slug)}" required></div>
        <div class="adm-field"><label>Category</label><select name="category">${catOpts}</select></div>
        <div class="adm-field"><label>Title (MN)</label><input name="title_mn" value="${AdminCore.esc(g.title_mn)}" required></div>
        <div class="adm-field"><label>Title (EN)</label><input name="title_en" value="${AdminCore.esc(g.title_en)}"></div>
        <div class="adm-field full"><label>Summary (MN)</label><textarea name="summary_mn">${AdminCore.esc(g.summary_mn)}</textarea></div>
        <div class="adm-field full"><label>Body (MN)</label><textarea name="body_mn" rows="6">${AdminCore.esc(g.body_mn)}</textarea></div>
        ${AdminCloudinary.fieldCover("cover_image_url", g.cover_image_url || "", "Cover image", AdminCloudinary.FOLDERS.guides)}
        ${AdminCloudinary.fieldGallery("gallery_image_urls", g.gallery_image_urls || [], "Gallery", AdminCloudinary.FOLDERS.guides, { coverField: "cover_image_url", coverUrl: g.cover_image_url || "" })}
        <div class="adm-field"><label>Active</label><select name="active"><option value="true" ${g.active !== false ? "selected" : ""}>Тийм</option><option value="false" ${g.active === false ? "selected" : ""}>Үгүй</option></select></div>
      </div>`;
  }

  function readForm(backdrop) {
    const g = (n) => backdrop.querySelector(`[name="${n}"]`)?.value?.trim() ?? "";
    return {
      country_id: g("country_id"),
      city_id: g("city_id"),
      slug: g("slug"),
      category: g("category") || "general",
      title_mn: g("title_mn"),
      title_en: g("title_en"),
      summary_mn: g("summary_mn"),
      body_mn: g("body_mn"),
      cover_image_url: AdminCloudinary.readCover(backdrop, "cover_image_url"),
      gallery_image_urls: AdminCloudinary.readGallery(backdrop, "gallery_image_urls"),
      active: g("active") === "true"
    };
  }

  function render(ctx) {
    const q = (ctx.search || "").toLowerCase();
    let rows = AdminStore.getAll("travel_guides");
    if (q) {
      rows = rows.filter((r) =>
        [r.title_mn, r.title_en, r.slug, r.category].join(" ").toLowerCase().includes(q)
      );
    }
    return `
      <div class="adm-panel">
        <div class="adm-panel-head">
          <h2>Travel Guides (${rows.length})</h2>
          <button type="button" class="adm-btn primary" data-add>+ Нэмэх</button>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Гарын авлага</th><th>Хот</th><th>Category</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${rows.map((r) => `
                <tr>
                  <td><strong>${AdminCore.esc(r.title_mn)}</strong><br><small>${AdminCore.esc(r.slug)}</small></td>
                  <td>${AdminCore.cityName(r.city_id)}</td>
                  <td><span class="adm-tag">${AdminCore.esc(r.category)}</span></td>
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
      AdminCore.openModal("Гарын авлага нэмэх", formFields(), (backdrop) => {
        AdminStore.create("travel_guides", readForm(backdrop));
        ctx.toast("Хадгалагдлаа");
        AdminCore.renderModule();
      });
    });
    box.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = AdminStore.getById("travel_guides", btn.dataset.edit);
        AdminCore.openModal("Гарын авлага засах", formFields(row), (backdrop) => {
          AdminStore.update("travel_guides", row.id, readForm(backdrop));
          ctx.toast("Шинэчлэгдлээ");
          AdminCore.renderModule();
        });
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Устгах уу?")) return;
        AdminStore.remove("travel_guides", btn.dataset.del);
        ctx.toast("Устгагдлаа");
        AdminCore.renderModule();
      });
    });
  }

  AdminCore.registerModule("guides", { render, bind });
})();
