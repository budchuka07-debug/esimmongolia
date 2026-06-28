/**
 * Settings — markup defaults
 */
(function () {
  function render() {
    const data = AdminStore.load();
    const s = data.settings || AdminStore.defaultSettings();
    const fields = [
      ["hotel_markup_percent", "Hotel markup %"],
      ["flight_markup_percent", "Flight markup %"],
      ["train_markup_percent", "Train markup %"],
      ["bus_markup_percent", "Bus markup %"],
      ["attraction_markup_percent", "Attraction markup %"],
      ["rental_markup_percent", "Rental markup %"],
      ["insurance_markup_percent", "Insurance markup %"],
      ["esim_markup_percent", "eSIM markup %"]
    ];
    return `
      <div class="adm-panel">
        <div class="adm-panel-head"><h2>Pricing Settings</h2></div>
        <div class="adm-panel-body">
          <p style="color:#64748b;font-size:14px;margin-top:0">Харилцагч зөвхөн <strong>final_price_mnt</strong> харна. Markup нь зөвхөн admin-д харагдана.</p>
          <form id="admSettingsForm">
            <div class="adm-form-grid">
              ${fields.map(([k, label]) => `
                <div class="adm-field">
                  <label>${label}</label>
                  <input name="${k}" type="number" min="0" max="200" step="0.5" value="${AdminCore.esc(s[k] ?? 15)}">
                </div>`).join("")}
            </div>
            <div class="adm-btn-row">
              <button type="submit" class="adm-btn primary">Хадгалах</button>
              <button type="button" class="adm-btn warn" data-reset>Seed дахин ачаалах</button>
            </div>
          </form>
        </div>
      </div>`;
  }

  function bind(box, ctx) {
    box.querySelector("#admSettingsForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target;
      const settings = { ...AdminStore.defaultSettings() };
      form.querySelectorAll("input[name]").forEach((inp) => {
        settings[inp.name] = parseFloat(inp.value) || 0;
      });
      const data = AdminStore.load();
      data.settings = settings;
      AdminStore.save(data);
      ctx.toast("Тохиргоо хадгалагдлаа");
    });
    box.querySelector("[data-reset]")?.addEventListener("click", () => {
      if (!confirm("Бүх localStorage өгөгдлийг seed-ээр солих уу?")) return;
      AdminStore.resetSeed();
      ctx.toast("Seed ачаалагдлаа");
      AdminCore.renderModule();
    });
  }

  AdminCore.registerModule("settings", { render, bind });
})();
