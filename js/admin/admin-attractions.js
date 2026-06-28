/**
 * Attractions CMS — Cloudinary images
 */
(function () {
  function formFields(a) {
    a = a || {};
    const cities = AdminStore.getAll("cities");
    const cityOpts = cities.map((c) =>
      `<option value="${c.id}" ${a.city_id === c.id ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`
    ).join("");
    return `
      <div class="adm-form-grid">
        <div class="adm-field"><label>City</label><select name="city_id" required>${cityOpts}</select></div>
        <div class="adm-field"><label>Нэр (MN)</label><input name="name_mn" value="${AdminCore.esc(a.name_mn)}" required></div>
        <div class="adm-field"><label>Name (EN)</label><input name="name_en" value="${AdminCore.esc(a.name_en)}"></div>
        <div class="adm-field full"><label>Description (MN)</label><textarea name="description_mn">${AdminCore.esc(a.description_mn)}</textarea></div>
        <div class="adm-field"><label>Original price</label><input name="original_price" type="number" step="any" value="${AdminCore.esc(a.original_price)}"></div>
        <div class="adm-field"><label>Currency</label><input name="currency" value="${AdminCore.esc(a.currency || "CNY")}"></div>
        <div class="adm-field"><label>Final price (MNT)</label><input name="final_price_mnt" type="number" value="${AdminCore.esc(a.final_price_mnt)}"></div>
        ${AdminCloudinary.fieldCover("cover_image_url", a.cover_image_url || a.image_url || "", "Cover image", "esimmongolia/attractions")}
        ${AdminCloudinary.fieldGallery("gallery_image_urls", a.gallery_image_urls || [], "Gallery", "esimmongolia/attractions")}
        <div class="adm-field"><label>Active</label><select name="active"><option value="true" ${a.active !== false ? "selected" : ""}>Тийм</option><option value="false" ${a.active === false ? "selected" : ""}>Үгүй</option></select></div>
      </div>`;
  }

  function readForm(backdrop) {
    const g = (n) => backdrop.querySelector(`[name="${n}"]`)?.value?.trim() ?? "";
    return {
      city_id: g("city_id"),
      name_mn: g("name_mn"),
      name_en: g("name_en"),
      description_mn: g("description_mn"),
      original_price: parseFloat(g("original_price")) || 0,
      currency: g("currency") || "CNY",
      final_price_mnt: parseInt(g("final_price_mnt"), 10) || 0,
      cover_image_url: AdminCloudinary.readCover(backdrop, "cover_image_url"),
      gallery_image_urls: AdminCloudinary.readGallery(backdrop, "gallery_image_urls"),
      active: g("active") === "true"
    };
  }

  function render(ctx) {
    const q = (ctx.search || "").toLowerCase();
    let rows = AdminStore.getAll("attractions");
    if (q) {
      rows = rows.filter((a) =>
        [a.name_mn, a.name_en, AdminCore.cityName(a.city_id)].join(" ").toLowerCase().includes(q)
      );
    }
    return `
      <div class="adm-panel">
        <div class="adm-panel-head">
          <h2>Attractions (${rows.length})</h2>
          <button type="button" class="adm-btn primary" data-add>+ Нэмэх</button>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Үзвэр</th><th>Хот</th><th>Үнэ (MNT)</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${rows.map((a) => `
                <tr>
                  <td><strong>${AdminCore.esc(a.name_mn)}</strong><br><small>${AdminCore.esc(a.name_en)}</small></td>
                  <td>${AdminCore.cityName(a.city_id)}</td>
                  <td>${AdminCore.fmtMnt(a.final_price_mnt)}</td>
                  <td>${AdminCore.badge(a.active)}</td>
                  <td>
                    <button type="button" class="adm-btn sm" data-edit="${a.id}">Засах</button>
                    <button type="button" class="adm-btn sm danger" data-del="${a.id}">Устгах</button>
                  </td>
                </tr>`).join("") || '<tr><td colspan="5" class="adm-empty">Олдсонгүй</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function bind(box, ctx) {
    box.querySelector("[data-add]")?.addEventListener("click", () => {
      AdminCore.openModal("Үзвэр нэмэх", formFields(), (backdrop) => {
        AdminStore.create("attractions", readForm(backdrop));
        ctx.toast("Хадгалагдлаа");
        AdminCore.renderModule();
      });
    });
    box.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = AdminStore.getById("attractions", btn.dataset.edit);
        AdminCore.openModal("Үзвэр засах", formFields(row), (backdrop) => {
          AdminStore.update("attractions", row.id, readForm(backdrop));
          ctx.toast("Шинэчлэгдлээ");
          AdminCore.renderModule();
        });
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Устгах уу?")) return;
        AdminStore.remove("attractions", btn.dataset.del);
        ctx.toast("Устгагдлаа");
        AdminCore.renderModule();
      });
    });
  }

  AdminCore.registerModule("attractions", { render, bind });
})();
