/**
 * Trains CMS — зэрэглэл / вагоны төрөл
 */
(function () {
  const CLASSES = AdminStore.TRAIN_CLASSES;
  const CLASS_LABELS = {
    second_class: "2-р зэрэглэл",
    first_class: "1-р зэрэглэл",
    business_class: "Бизнес",
    hard_seat: "Хатуу суудал",
    soft_seat: "Зөөлөн суудал",
    hard_sleeper: "Хатуу унтлагын",
    soft_sleeper: "Зөөлөн унтлагын",
    coupe: "Купе"
  };

  function formFields(t) {
    t = t || {};
    const cities = AdminStore.getAll("cities");
    const cityOpts = (sel) => cities.map((c) => `<option value="${c.id}" ${c.id === sel ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`).join("");
    const classFields = CLASSES.map((cl) => `
      <div class="adm-field"><label>${CLASS_LABELS[cl] || cl} (MNT)</label>
        <input name="class_${cl}" type="number" value="${AdminCore.esc((t.class_prices || {})[cl] || "")}">
      </div>`).join("");
    return `
      <div class="adm-form-grid">
        <div class="adm-field"><label>From city</label><select name="from_city_id">${cityOpts(t.from_city_id)}</select></div>
        <div class="adm-field"><label>To city</label><select name="to_city_id">${cityOpts(t.to_city_id)}</select></div>
        <div class="adm-field"><label>Transfer city</label><select name="transfer_city_id"><option value="">—</option>${cityOpts(t.transfer_city_id)}</select></div>
        <div class="adm-field"><label>Train no</label><input name="train_no" value="${AdminCore.esc(t.train_no)}"></div>
        <div class="adm-field"><label>Duration</label><input name="duration" value="${AdminCore.esc(t.duration)}"></div>
        <div class="adm-field"><label>From price (MNT)</label><input name="final_price_mnt_from" type="number" value="${AdminCore.esc(t.final_price_mnt_from)}"></div>
        <div class="adm-field"><label>Data confidence</label><select name="data_confidence">
          <option value="high" ${t.data_confidence === "high" ? "selected" : ""}>high</option>
          <option value="medium" ${t.data_confidence === "medium" ? "selected" : ""}>medium</option>
          <option value="low" ${t.data_confidence === "low" ? "selected" : ""}>low</option>
        </select></div>
        <div class="adm-field"><label>Source name</label><input name="source_name" value="${AdminCore.esc(t.source_name)}"></div>
        <div class="adm-field"><label>Source URL</label><input name="source_url" value="${AdminCore.esc(t.source_url)}"></div>
        <div class="adm-field"><label>Last checked</label><input name="last_checked_at" type="date" value="${AdminCore.esc(t.last_checked_at || "")}"></div>
        <div class="adm-field"><label>Active</label><select name="active"><option value="true" ${t.active !== false ? "selected" : ""}>Тийм</option><option value="false" ${t.active === false ? "selected" : ""}>Үгүй</option></select></div>
        ${AdminCloudinary.fieldCover("cover_image_url", t.cover_image_url || "", "Cover image", AdminCloudinary.FOLDERS.trains)}
      </div>
      <h4 style="margin:16px 0 8px">Зэрэглэл / вагоны төрөл (MNT)</h4>
      <div class="adm-form-grid">${classFields}</div>`;
  }

  function readForm(backdrop) {
    const g = (n) => backdrop.querySelector(`[name="${n}"]`)?.value?.trim() ?? "";
    const class_prices = {};
    CLASSES.forEach((cl) => {
      const v = backdrop.querySelector(`[name="class_${cl}"]`)?.value;
      if (v) class_prices[cl] = parseInt(v, 10);
    });
    return {
      from_city_id: g("from_city_id"),
      to_city_id: g("to_city_id"),
      transfer_city_id: g("transfer_city_id") || null,
      train_no: g("train_no"),
      duration: g("duration"),
      final_price_mnt_from: parseInt(g("final_price_mnt_from"), 10) || 0,
      class_prices,
      data_confidence: g("data_confidence"),
      source_name: g("source_name"),
      source_url: g("source_url"),
      last_checked_at: g("last_checked_at") || null,
      active: g("active") === "true",
      cover_image_url: AdminCloudinary.readCover(backdrop, "cover_image_url")
    };
  }

  function render() {
    const rows = AdminStore.getAll("trains");
    return `
      <div class="adm-panel">
        <div class="adm-panel-head"><h2>Trains (${rows.length})</h2><button type="button" class="adm-btn primary" data-add>+ Нэмэх</button></div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Маршрут</th><th>Дугаар</th><th>Үнэээс</th><th>Confidence</th><th></th></tr></thead>
            <tbody>
              ${rows.map((t) => `
                <tr>
                  <td>${AdminCore.cityName(t.from_city_id)} → ${AdminCore.cityName(t.to_city_id)}${t.transfer_city_id ? " (дамжин)" : ""}</td>
                  <td>${AdminCore.esc(t.train_no)}</td>
                  <td>${AdminCore.fmtMnt(t.final_price_mnt_from)}</td>
                  <td>${AdminCore.esc(t.data_confidence)}</td>
                  <td>
                    <button type="button" class="adm-btn sm" data-edit="${t.id}">Засах</button>
                    <button type="button" class="adm-btn sm danger" data-del="${t.id}">Устгах</button>
                  </td>
                </tr>`).join("") || '<tr><td colspan="5" class="adm-empty">Байхгүй</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function bind(box, ctx) {
    box.querySelector("[data-add]")?.addEventListener("click", () => {
      AdminCore.openModal("Галт тэрэг нэмэх", formFields(), (backdrop) => {
        AdminStore.create("trains", readForm(backdrop));
        ctx.toast("Хадгалагдлаа");
        AdminCore.renderModule();
      });
    });
    box.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = AdminStore.getById("trains", btn.dataset.edit);
        AdminCore.openModal("Галт тэрэг засах", formFields(row), (backdrop) => {
          AdminStore.update("trains", row.id, readForm(backdrop));
          ctx.toast("Шинэчлэгдлээ");
          AdminCore.renderModule();
        });
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Устгах уу?")) return;
        AdminStore.remove("trains", btn.dataset.del);
        AdminCore.renderModule();
      });
    });
  }

  AdminCore.registerModule("trains", { render, bind });
})();
