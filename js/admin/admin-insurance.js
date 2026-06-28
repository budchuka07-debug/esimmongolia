/**
 * Insurance CMS
 */
(function () {
  function formFields(row) {
    row = row || {};
    const s = row.supplier_reference || {};
    return `
      <div class="adm-form-grid">
        <div class="adm-field"><label>Company</label><input name="company_name" value="${AdminCore.esc(row.company_name)}"></div>
        <div class="adm-field"><label>Product</label><input name="product_name" value="${AdminCore.esc(row.product_name)}"></div>
        <div class="adm-field full"><label>Coverage (MN)</label><textarea name="coverage_mn">${AdminCore.esc(row.coverage_mn)}</textarea></div>
        <div class="adm-field"><label>Region</label><input name="destination_region" value="${AdminCore.esc(row.destination_region)}"></div>
        <div class="adm-field"><label>Days min</label><input name="days_min" type="number" value="${AdminCore.esc(row.days_min)}"></div>
        <div class="adm-field"><label>Days max</label><input name="days_max" type="number" value="${AdminCore.esc(row.days_max)}"></div>
        <div class="adm-field"><label>Final price (MNT)</label><input name="final_price_mnt" type="number" value="${AdminCore.esc(row.final_price_mnt)}"></div>
        <div class="adm-field"><label>Active</label><select name="active"><option value="true">Тийм</option><option value="false">Үгүй</option></select></div>
        ${AdminCloudinary.fieldCover("cover_image_url", row.cover_image_url || "", "Cover image", AdminCloudinary.FOLDERS.insurance)}
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
      company_name: g("company_name"),
      product_name: g("product_name"),
      coverage_mn: g("coverage_mn"),
      destination_region: g("destination_region"),
      days_min: parseInt(g("days_min"), 10) || 1,
      days_max: parseInt(g("days_max"), 10) || 30,
      final_price_mnt: parseInt(g("final_price_mnt"), 10) || 0,
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
    const rows = AdminStore.getAll("insurance");
    return `
      <div class="adm-panel">
        <div class="adm-panel-head"><h2>Insurance (${rows.length})</h2><button type="button" class="adm-btn primary" data-add>+ Нэмэх</button></div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Company</th><th>Product</th><th>Region</th><th>Үнэ (MNT)</th><th></th></tr></thead>
            <tbody>
              ${rows.map((r) => `
                <tr>
                  <td>${AdminCore.esc(r.company_name)}</td>
                  <td>${AdminCore.esc(r.product_name)}</td>
                  <td>${AdminCore.esc(r.destination_region)}</td>
                  <td>${AdminCore.fmtMnt(r.final_price_mnt)}</td>
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
      AdminCore.openModal("Даатгал нэмэх", formFields(), (backdrop) => {
        AdminStore.create("insurance", readForm(backdrop));
        ctx.toast("Хадгалагдлаа");
        AdminCore.renderModule();
      });
    });
    box.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = AdminStore.getById("insurance", btn.dataset.edit);
        AdminCore.openModal("Даатгал засах", formFields(row), (backdrop) => {
          AdminStore.update("insurance", row.id, readForm(backdrop));
          AdminCore.renderModule();
        });
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Устгах уу?")) return;
        AdminStore.remove("insurance", btn.dataset.del);
        AdminCore.renderModule();
      });
    });
  }

  AdminCore.registerModule("insurance", { render, bind });
})();
