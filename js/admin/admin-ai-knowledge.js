/**
 * AI Knowledge CMS
 */
(function () {
  const TOPICS = AdminStore.AI_TOPICS;

  function formFields(row) {
    row = row || {};
    const countries = AdminStore.getAll("countries");
    const cities = AdminStore.getAll("cities");
    const countryOpts = countries.map((c) => `<option value="${c.id}" ${row.country_id === c.id ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`).join("");
    const cityOpts = '<option value="">—</option>' + cities.map((c) => `<option value="${c.id}" ${row.city_id === c.id ? "selected" : ""}>${AdminCore.esc(c.name_mn)}</option>`).join("");
    const topicOpts = TOPICS.map((t) => `<option value="${t}" ${row.topic === t ? "selected" : ""}>${t}</option>`).join("");
    return `
      <div class="adm-form-grid">
        <div class="adm-field"><label>Country</label><select name="country_id">${countryOpts}</select></div>
        <div class="adm-field"><label>City (optional)</label><select name="city_id">${cityOpts}</select></div>
        <div class="adm-field"><label>Topic</label><select name="topic">${topicOpts}</select></div>
        <div class="adm-field full"><label>Title (MN)</label><input name="title_mn" value="${AdminCore.esc(row.title_mn)}" required></div>
        <div class="adm-field full"><label>Content (MN)</label><textarea name="content_mn" rows="6">${AdminCore.esc(row.content_mn)}</textarea></div>
        <div class="adm-field"><label>Tags (comma)</label><input name="tags" value="${AdminCore.esc((row.tags || []).join(", "))}"></div>
        <div class="adm-field"><label>Active</label><select name="active"><option value="true" ${row.active !== false ? "selected" : ""}>Тийм</option><option value="false" ${row.active === false ? "selected" : ""}>Үгүй</option></select></div>
      </div>`;
  }

  function readForm(backdrop) {
    const g = (n) => backdrop.querySelector(`[name="${n}"]`)?.value?.trim() ?? "";
    return {
      country_id: g("country_id"),
      city_id: g("city_id") || null,
      topic: g("topic"),
      title_mn: g("title_mn"),
      content_mn: g("content_mn"),
      tags: AdminCore.parseCsvList(g("tags")),
      active: g("active") === "true"
    };
  }

  function render(ctx) {
    const q = (ctx.search || "").toLowerCase();
    let rows = AdminStore.getAll("ai_knowledge");
    if (q) {
      rows = rows.filter((r) => [r.title_mn, r.content_mn, r.topic, ...(r.tags || [])].join(" ").toLowerCase().includes(q));
    }
    return `
      <div class="adm-panel">
        <div class="adm-panel-head">
          <h2>AI Knowledge (${rows.length})</h2>
          <button type="button" class="adm-btn primary" data-add>+ Нэмэх</button>
        </div>
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Topic</th><th>Гарчиг</th><th>Хот</th><th>Tags</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${rows.map((r) => `
                <tr>
                  <td><span class="adm-tag">${AdminCore.esc(r.topic)}</span></td>
                  <td>${AdminCore.esc(r.title_mn)}</td>
                  <td>${r.city_id ? AdminCore.cityName(r.city_id) : "—"}</td>
                  <td>${(r.tags || []).map((t) => `<span class="adm-tag">${AdminCore.esc(t)}</span>`).join("")}</td>
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
      AdminCore.openModal("AI мэдлэг нэмэх", formFields(), (backdrop) => {
        AdminStore.create("ai_knowledge", readForm(backdrop));
        ctx.toast("Хадгалагдлаа");
        AdminCore.renderModule();
      });
    });
    box.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = AdminStore.getById("ai_knowledge", btn.dataset.edit);
        AdminCore.openModal("AI мэдлэг засах", formFields(row), (backdrop) => {
          AdminStore.update("ai_knowledge", row.id, readForm(backdrop));
          ctx.toast("Шинэчлэгдлээ");
          AdminCore.renderModule();
        });
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Устгах уу?")) return;
        AdminStore.remove("ai_knowledge", btn.dataset.del);
        ctx.toast("Устгагдлаа");
        AdminCore.renderModule();
      });
    });
  }

  AdminCore.registerModule("ai-knowledge", { render, bind });
})();
