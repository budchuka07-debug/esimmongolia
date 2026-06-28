/**
 * Cities CMS — multilingual + airport code search
 */
(function () {
  function formFields(c) {
    c = c || {};
    const countries = AdminStore.getAll("countries");
    const countryOpts = countries.map((ct) =>
      `<option value="${ct.id}" ${c.country_id === ct.id ? "selected" : ""}>${AdminCore.esc(ct.flag)} ${AdminCore.esc(ct.name_mn)}</option>`
    ).join("");
    return `
      <div class="adm-form-grid">
        <div class="adm-field"><label>Country</label><select name="country_id" required>${countryOpts}</select></div>
        <div class="adm-field"><label>Нэр (MN)</label><input name="name_mn" value="${AdminCore.esc(c.name_mn)}" required></div>
        <div class="adm-field"><label>Name (EN)</label><input name="name_en" value="${AdminCore.esc(c.name_en)}"></div>
        <div class="adm-field"><label>Local name</label><input name="name_local" value="${AdminCore.esc(c.name_local)}"></div>
        <div class="adm-field"><label>Province</label><input name="province" value="${AdminCore.esc(c.province)}"></div>
        <div class="adm-field"><label>Aliases (comma)</label><input name="aliases" value="${AdminCore.esc((c.aliases || []).join(", "))}"><div class="adm-field-hint">Beijing, PEK, PKX</div></div>
        <div class="adm-field"><label>Airport codes</label><input name="airport_codes" value="${AdminCore.esc((c.airport_codes || []).join(", "))}"></div>
        <div class="adm-field"><label>Railway stations</label><input name="railway_stations" value="${AdminCore.esc((c.railway_stations || []).join(", "))}"></div>
        <div class="adm-field"><label>Lat</label><input name="lat" type="number" step="any" value="${AdminCore.esc(c.lat)}"></div>
        <div class="adm-field"><label>Lng</label><input name="lng" type="number" step="any" value="${AdminCore.esc(c.lng)}"></div>
        <div class="adm-field"><label>Hero image URL</label><input name="hero_image" value="${AdminCore.esc(c.hero_image)}"></div>
        <div class="adm-field"><label>Popular</label><select name="popular"><option value="true" ${c.popular ? "selected" : ""}>Тийм</option><option value="false" ${!c.popular ? "selected" : ""}>Үгүй</option></select></div>
        <div class="adm-field"><label>Active</label><select name="active"><option value="true" ${c.active !== false ? "selected" : ""}>Тийм</option><option value="false" ${c.active === false ? "selected" : ""}>Үгүй</option></select></div>
      </div>`;
  }

  function readForm(backdrop) {
    const g = (n) => backdrop.querySelector(`[name="${n}"]`)?.value?.trim() ?? "";
    return {
      country_id: g("country_id"),
      name_mn: g("name_mn"),
      name_en: g("name_en"),
      name_local: g("name_local"),
      province: g("province"),
      aliases: AdminCore.parseCsvList(g("aliases")),
      airport_codes: AdminCore.parseCsvList(g("airport_codes")),
      railway_stations: AdminCore.parseCsvList(g("railway_stations")),
      lat: parseFloat(g("lat")) || null,
      lng: parseFloat(g("lng")) || null,
      hero_image: g("hero_image"),
      popular: g("popular") === "true",
      active: g("active") === "true"
    };
  }

  function render(ctx) {
    const q = ctx.search || "";
    let rows = q ? AdminStore.searchCities(q) : AdminStore.getAll("cities");
    return `
      <div class="adm-panel">
        <div class="adm-panel-head">
          <h2>Cities (${rows.length})</h2>
          <button type="button" class="adm-btn primary" data-add>+ Нэмэх</button>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Хот</th><th>Улс</th><th>Airports</th><th>Popular</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${rows.map((c) => `
                <tr>
                  <td><strong>${AdminCore.esc(c.name_mn)}</strong><br><small>${AdminCore.esc(c.name_en)} / ${AdminCore.esc(c.name_local)}</small></td>
                  <td>${AdminCore.countryName(c.country_id)}</td>
                  <td>${(c.airport_codes || []).map((a) => `<span class="adm-tag">${AdminCore.esc(a)}</span>`).join("")}</td>
                  <td>${c.popular ? "⭐" : "—"}</td>
                  <td>${AdminCore.badge(c.active)}</td>
                  <td>
                    <button type="button" class="adm-btn sm" data-edit="${c.id}">Засах</button>
                    <button type="button" class="adm-btn sm danger" data-del="${c.id}">Устгах</button>
                  </td>
                </tr>`).join("") || '<tr><td colspan="6" class="adm-empty">Олдсонгүй</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function bind(box, ctx) {
    box.querySelector("[data-add]")?.addEventListener("click", () => {
      AdminCore.openModal("Хот нэмэх", formFields(), (backdrop) => {
        AdminStore.create("cities", readForm(backdrop));
        ctx.toast("Хадгалагдлаа");
        AdminCore.renderModule();
      });
    });
    box.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = AdminStore.getById("cities", btn.dataset.edit);
        AdminCore.openModal("Хот засах", formFields(row), (backdrop) => {
          AdminStore.update("cities", row.id, readForm(backdrop));
          ctx.toast("Шинэчлэгдлээ");
          AdminCore.renderModule();
        });
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Устгах уу?")) return;
        AdminStore.remove("cities", btn.dataset.del);
        ctx.toast("Устгагдлаа");
        AdminCore.renderModule();
      });
    });
  }

  AdminCore.registerModule("cities", { render, bind });
})();
