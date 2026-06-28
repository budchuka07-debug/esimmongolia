/**
 * Placeholder modules — buses, attractions, eSIM, guides, users
 */
(function () {
  function placeholder(id, title, note) {
    AdminCore.registerModule(id, {
      render() {
        return `
          <div class="adm-panel">
            <div class="adm-panel-head"><h2>${title}</h2></div>
            <div class="adm-panel-body">
              <p style="color:#64748b">${note}</p>
              <p>Supabase холбогдсоны дараа энэ модуль бүрэн идэвхжинэ. Одоогоор <strong>localStorage</strong> store бэлэн.</p>
              <div class="adm-btn-row">
                <button type="button" class="adm-btn" onclick="AdminCore.navigate('settings')">Settings</button>
                <button type="button" class="adm-btn primary" onclick="AdminCore.navigate('hotels')">Hotels CMS</button>
              </div>
            </div>
          </div>`;
      }
    });
  }

  placeholder("buses", "Buses", "Автобусны маршрут, үнэ, supplier reference удирдах.");
  placeholder("attractions", "Attractions", "Үзвэр үйлчилгээ, тасалбар, зураг удирдах.");
  placeholder("esim", "eSIM", "eSIM төлөвлөгөө — одоогийн Netlify functions (getPlans, china-plans) хэвээр.");
  placeholder("guides", "Travel Guides", "Аяллын гарын авлага, маршрут, зураг.");
  placeholder("users", "Users", "Хэрэглэгч, эрх, admin бүртгэл.");
})();
