/**
 * Countries CMS
 */
(function () {
  function formFields(c) {
    c = c || {};
    return `
      <div class="adm-form-grid">
        <div class="adm-field"><label>ISO code</label><input name="iso_code" value="${AdminCore.esc(c.iso_code)}" required maxlength="2"></div>
        <div class="adm-field"><label>Flag</label><input name="flag" value="${AdminCore.esc(c.flag)}"></div>
        <div class="adm-field"><label>Нэр (MN)</label><input name="name_mn" value="${AdminCore.esc(c.name_mn)}" required></div>
        <div class="adm-field"><label>Name (EN)</label><input name="name_en" value="${AdminCore.esc(c.name_en)}"></div>
        <div class="adm-field"><label>Local name</label><input name="name_local" value="${AdminCore.esc(c.name_local)}"></div>
        <div class="adm-field"><label>Currency</label><input name="currency" value="${AdminCore.esc(c.currency)}"></div>
        <div class="adm-field"><label>Language</label><input name="language" value="${AdminCore.esc(c.language)}"></div>
        <div class="adm-field"><label>Timezone</label><input name="timezone" value="${AdminCore.esc(c.timezone)}"></div>
        <div class="adm-field full"><label>Visa summary (MN)</label><textarea name="visa_summary_mn">${AdminCore.esc(c.visa_summary_mn)}</textarea></div>
        <div class="adm-field"><label>Active</label><select name="active"><option value="true" ${c.active !== false ? "selected" : ""}>Тийм</option><option value="false" ${c.active === false ? "selected" : ""}>Үгүй</option></select></div>
      </div>`;
  }

  function readForm(backdrop) {
    const g = (n) => backdrop.querySelector(`[name="${n}"]`)?.value?.trim() ?? "";
    return {
      iso_code: g("iso_code").toUpperCase(),
      flag: g("flag"),
      name_mn: g("name_mn"),
      name_en: g("name_en"),
      name_local: g("name_local"),
      currency: g("currency"),
      language: g("language"),
      timezone: g("timezone"),
      visa_summary_mn: g("visa_summary_mn"),
      active: g("active") === "true"
    };
  }

  function render(ctx) {
    const q = (ctx.search || "").toLowerCase();
    let rows = AdminStore.getAll("countries");
    if (q) {
      rows = rows.filter((c) => [c.name_mn, c.name_en, c.iso_code, c.name_local].join(" ").toLowerCase().includes(q));
    }
    return `
      <div class="adm-panel">
        <div class="adm-panel-head">
          <h2>Countries (${rows.length})</h2>
          <button type="button" class="adm-btn primary" data-add>+ Нэмэх</button>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>ISO</th><th>Улс</th><th>Currency</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${rows.map((c) => `
                <tr>
                  <td>${AdminCore.esc(c.iso_code)}</td>
                  <td>${AdminCore.esc(c.flag)} ${AdminCore.esc(c.name_mn)} <small style="color:#64748b">${AdminCore.esc(c.name_en)}</small></td>
                  <td>${AdminCore.esc(c.currency)}</td>
                  <td>${AdminCore.badge(c.active)}</td>
                  <td>
                    <button type="button" class="adm-btn sm" data-edit="${c.id}">Засах</button>
                    <button type="button" class="adm-btn sm danger" data-del="${c.id}">Устгах</button>
                  </td>
                </tr>`).join("") || '<tr><td colspan="5" class="adm-empty">Олдсонгүй</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function bind(box, ctx) {
    box.querySelector("[data-add]")?.addEventListener("click", () => {
      AdminCore.openModal("Улс нэмэх", formFields(), (backdrop) => {
        AdminStore.create("countries", readForm(backdrop));
        ctx.toast("Хадгалагдлаа");
        AdminCore.renderModule();
        return true;
      });
    });
    box.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = AdminStore.getById("countries", btn.dataset.edit);
        AdminCore.openModal("Улс засах", formFields(row), (backdrop) => {
          AdminStore.update("countries", row.id, readForm(backdrop));
          ctx.toast("Шинэчлэгдлээ");
          AdminCore.renderModule();
        });
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Устгах уу?")) return;
        AdminStore.remove("countries", btn.dataset.del);
        ctx.toast("Устгагдлаа");
        AdminCore.renderModule();
      });
    });
  }

  AdminCore.registerModule("countries", { render, bind });
})();
