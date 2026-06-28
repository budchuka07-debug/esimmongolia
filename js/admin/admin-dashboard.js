/**
 * Admin Dashboard
 */
(function () {
  function render() {
    const s = AdminStore.bookingStats();
    return `
      <div class="adm-stat-grid">
        <div class="adm-stat-card primary"><div class="label">Шинэ захиалга</div><div class="value">${s.new}</div></div>
        <div class="adm-stat-card"><div class="label">Availability шалгах</div><div class="value">${s.checking_availability}</div></div>
        <div class="adm-stat-card warn"><div class="label">QPay хүлээж байгаа</div><div class="value">${s.qpay_sent}</div></div>
        <div class="adm-stat-card ok"><div class="label">Төлөгдсөн</div><div class="value">${s.paid}</div></div>
        <div class="adm-stat-card"><div class="label">Voucher илгээсэн</div><div class="value">${s.voucher_sent}</div></div>
        <div class="adm-stat-card ok"><div class="label">Дууссан</div><div class="value">${s.completed}</div></div>
        <div class="adm-stat-card primary"><div class="label">Өнөөдрийн орлого</div><div class="value" style="font-size:1.2rem">${AdminCore.fmtMnt(s.today_revenue)}</div></div>
        <div class="adm-stat-card primary"><div class="label">7 хоногийн орлого</div><div class="value" style="font-size:1.2rem">${AdminCore.fmtMnt(s.week_revenue)}</div></div>
      </div>
      <div class="adm-panel">
        <div class="adm-panel-head"><h2>Товч мэдээлэл</h2></div>
        <div class="adm-panel-body">
          <div class="adm-form-grid">
            <div><strong>${AdminStore.getAll("countries").length}</strong> улс</div>
            <div><strong>${AdminStore.getAll("cities").length}</strong> хот</div>
            <div><strong>${AdminStore.getAll("hotels").length}</strong> буудал</div>
            <div><strong>${AdminStore.getAll("bookings").length}</strong> захиалга</div>
            <div><strong>${AdminStore.getAll("ai_knowledge").length}</strong> AI мэдлэг</div>
          </div>
          <div class="adm-btn-row">
            <button type="button" class="adm-btn primary" data-go="bookings">Захиалга удирдах</button>
            <button type="button" class="adm-btn" data-go="hotels">Буудал нэмэх</button>
            <button type="button" class="adm-btn" data-go="settings">Markup тохиргоо</button>
          </div>
        </div>
      </div>`;
  }

  function bind(box, ctx) {
    box.querySelectorAll("[data-go]").forEach((btn) => {
      btn.addEventListener("click", () => ctx.navigate(btn.dataset.go));
    });
  }

  AdminCore.registerModule("dashboard", { render, bind });
})();
