/**
 * eSIM Mongolia — booking & inquiry (MVP mock search)
 * Ready for Supabase + supplier APIs
 */
(function () {
  const STATUS_LABELS = {
    new: "Шинэ",
    quoted: "Үнэ илгээсэн",
    awaiting_payment: "Төлбөр хүлээж буй",
    paid: "Төлсөн",
    processing: "Боловсруулж буй",
    completed: "Дууссан",
    cancelled: "Цуцалсан"
  };

  const SERVICE_TYPES = {
    ai: "AI аяллын зөвлөгөө",
    flight: "Нислэг",
    hotel: "Буудал",
    train: "Галт тэрэг",
    attraction: "Үзвэр",
    esim: "eSIM",
    visa: "Виз",
    route: "Маршрут",
    transport: "Нийтийн тээвэр"
  };

  function $(id) { return document.getElementById(id); }

  function fmtMnt(n) {
    return new Intl.NumberFormat("mn-MN").format(Number(n || 0)) + "₮";
  }

  const BOOKING_TITLES = {
    full: "Бүтэн аяллын захиалга",
    flight: "Нислэг захиалах",
    hotel: "Буудал захиалах",
    train: "Галт тэрэгний тасалбар захиалах",
    attraction: "Үзвэр захиалах",
    esim: "eSIM авах",
    visa: "Визийн зөвлөгөө",
    route: "Маршрут захиалах"
  };

  let activeTab = "ai";
  let lastMockResults = [];
  let lastSearchMeta = {};
  let pendingBooking = null;
  let bookingPayInterval = null;
  let currentInvoiceId = null;
  let currentOrderId = null;

  function resetBookingModal() {
    if (bookingPayInterval) {
      clearInterval(bookingPayInterval);
      bookingPayInterval = null;
    }
    currentInvoiceId = null;
    currentOrderId = null;
    pendingBooking = null;
    const formStep = $("bookingStepForm");
    const payStep = $("bookingStepPay");
    const successStep = $("bookingStepSuccess");
    if (formStep) formStep.style.display = "";
    if (payStep) payStep.style.display = "none";
    if (successStep) successStep.style.display = "none";
    const payBox = $("bookingQpayBox");
    if (payBox) payBox.innerHTML = "";
    const form = $("inquiryForm");
    if (form) form.reset();
    const statusEl = $("inqStatus");
    if (statusEl) statusEl.textContent = "";
    const priceEl = $("inqPriceDisplay");
    if (priceEl) priceEl.textContent = "";
  }

  function extractPayUrl(data) {
    if (!data) return "";
    if (Array.isArray(data.urls)) return data.urls.find((u) => u?.link)?.link || "";
    if (typeof data.urls === "object") return data.urls.qPay || data.urls.qpay || data.urls.link || "";
    return data.qpay_url || data.payment_url || data.link || "";
  }
  function extractQrImage(data) {
    return data?.qr_image || data?.qrImage || data?.result?.qr_image || "";
  }
  function extractInvoiceId(data) {
    return data?.invoice_id || data?.invoiceId || data?.result?.invoice_id || null;
  }

  function openBookingForm(serviceType, preset, title) {
    resetBookingModal();
    const modal = $("inquiryModal");
    const bd = $("inquiryModalBd");
    if (!modal || !bd) return;
    const type = serviceType === "full" ? "route" : (serviceType || "flight");
    const typeEl = $("inqServiceType");
    if (typeEl) typeEl.value = type;

    if (preset?.bookingItem) {
      pendingBooking = { serviceType: type, ...preset.bookingItem };
    } else if (preset?.final_price_mnt) {
      pendingBooking = {
        serviceType: type,
        final_price_mnt: preset.final_price_mnt,
        selected_item: preset.selectedItem || "",
        supplier_internal: preset.supplier_internal || null
      };
    }

    const titleEl = $("inquiryModalTitle");
    if (titleEl) titleEl.textContent = title || BOOKING_TITLES[type] || "Захиалах";

    const priceEl = $("inqPriceDisplay");
    if (priceEl && pendingBooking?.final_price_mnt) {
      priceEl.textContent = fmtMnt(pendingBooking.final_price_mnt);
    }

    const fieldMap = {
      name: "inqName",
      phone: "inqPhone",
      email: "inqEmail",
      country: "inqCountry",
      city: "inqCity",
      travelDate: "inqTravelDate",
      people: "inqPeople",
      notes: "inqNotes",
      selectedItem: "inqSelectedItem"
    };
    if (preset) {
      Object.keys(fieldMap).forEach((k) => {
        const el = $(fieldMap[k]);
        if (el && preset[k] != null) el.value = preset[k];
      });
    }
    if (pendingBooking?.selected_item) {
      const sel = $("inqSelectedItem");
      if (sel) sel.value = pendingBooking.selected_item;
    }
    if (pendingBooking?.final_price_mnt) {
      const bud = $("inqBudget");
      if (bud) bud.value = String(pendingBooking.final_price_mnt);
    }

    modal.style.display = "block";
    bd.style.display = "block";
  }

  function openInquiryModal(serviceType, preset) {
    openBookingForm(serviceType, preset);
  }

  function closeInquiryModal() {
    const modal = $("inquiryModal");
    const bd = $("inquiryModalBd");
    if (modal) modal.style.display = "none";
    if (bd) bd.style.display = "none";
    resetBookingModal();
  }

  function showBookingPayStep(html) {
    $("bookingStepForm").style.display = "none";
    $("bookingStepPay").style.display = "block";
    $("bookingStepSuccess").style.display = "none";
    const box = $("bookingQpayBox");
    if (box) box.innerHTML = html;
  }

  function showBookingSuccess(orderId) {
    $("bookingStepForm").style.display = "none";
    $("bookingStepPay").style.display = "none";
    $("bookingStepSuccess").style.display = "block";
    const box = $("bookingSuccessBox");
    if (box) {
      box.innerHTML = `
        <div class="tp-booking-success">
          <div class="tp-success-icon">✅</div>
          <h4>Таны захиалга амжилттай бүртгэгдлээ.</h4>
          <p class="tp-success-order">Захиалгын дугаар: <strong>${orderId}</strong></p>
          <p class="tp-success-meta">Баталгаажуулалт: <strong>24 цагийн дотор</strong></p>
          <p class="tp-success-meta">Ваучер / тасалбарыг <strong>email болон WhatsApp</strong>-аар илгээнэ.</p>
          <button type="button" class="tp-btn primary" id="bookingDoneBtn">Хаах</button>
        </div>`;
      $("bookingDoneBtn")?.addEventListener("click", closeInquiryModal, { once: true });
    }
  }

  async function checkBookingPayment() {
    if (!currentInvoiceId) return false;
    try {
      const res = await fetch("/.netlify/functions/qpay-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: currentInvoiceId })
      });
      const data = await res.json();
      return !!data.paid;
    } catch {
      return false;
    }
  }

  function startBookingPaymentPoll() {
    if (bookingPayInterval) clearInterval(bookingPayInterval);
    bookingPayInterval = setInterval(async () => {
      const paid = await checkBookingPayment();
      if (paid) {
        clearInterval(bookingPayInterval);
        bookingPayInterval = null;
        showBookingSuccess(currentOrderId);
      }
    }, 4000);
  }

  async function openQPayForBooking(orderId, amount, description) {
    showBookingPayStep(`<p class="tp-lead">Төлбөр хүлээн авч байна…</p>`);
    const res = await fetch("/.netlify/functions/qpay-create-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, amount, description })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Төлбөр үүсгэхэд алдаа гарлаа");

    currentInvoiceId = extractInvoiceId(data);
    currentOrderId = orderId;
    const payUrl = extractPayUrl(data);
    const qrImage = extractQrImage(data);

    const qrHtml = qrImage
      ? `<img class="tp-qpay-qr" alt="QPay" src="${String(qrImage).startsWith("data:") ? qrImage : "data:image/png;base64," + qrImage}">`
      : `<div class="tp-qpay-mock" aria-label="QPay QR"><span>QPay</span><small>QR код</small></div>`;
    const linkHtml = payUrl
      ? `<a class="tp-btn primary" href="${payUrl}" target="_blank" rel="noopener" style="margin-top:12px">QPay-ээр төлөх</a>`
      : `<button type="button" class="tp-btn primary" style="margin-top:12px" disabled>QPay-ээр төлөх</button>`;

    showBookingPayStep(`
      <p class="tp-lead" style="margin:0 0 6px">Захиалгын дугаар: <strong>${orderId}</strong></p>
      <p class="tp-lead" style="margin:0 0 12px">Төлөх дүн: <strong class="tp-price-final">${fmtMnt(amount)}</strong></p>
      <div class="tp-qpay-wrap">${qrHtml}${linkHtml}</div>
      <p class="tp-lead" style="margin-top:12px;font-size:13px">QPay апп-аар QR уншуулна уу. Төлбөр амжилттай бол автоматаар баталгаажина.</p>
      <button type="button" class="tp-btn" id="bookingCheckPayBtn" style="margin-top:10px">Төлбөр шалгах</button>
    `);

    $("bookingCheckPayBtn")?.addEventListener("click", async () => {
      if (await checkBookingPayment()) showBookingSuccess(currentOrderId);
      else {
        const el = $("bookingQpayBox");
        if (el) {
          const note = document.createElement("p");
          note.className = "tp-lead";
          note.style.color = "#b45309";
          note.textContent = "Төлбөр хараахан баталгаажаагүй байна. Хэдэн секунд хүлээгээд дахин оролдоно уу.";
          el.appendChild(note);
        }
      }
    });

    startBookingPaymentPoll();
  }

  function setTab(tab) {
    activeTab = tab;
    document.querySelectorAll(".tp-tab").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });
    document.querySelectorAll(".tp-panel").forEach((p) => {
      p.classList.toggle("active", p.dataset.panel === tab);
    });
    if (tab === "esim-tab") {
      document.querySelector("#esim")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  function renderDestinations() {
    const box = $("platformDestinations");
    const data = window.TRAVEL_DATA;
    if (!box || !data) return;
    box.innerHTML = data.destinations.map((d) => `
      <a class="tp-dest-card" href="${d.href}">
        <img src="${d.img}" alt="${d.name}" loading="lazy">
        <div class="tp-dest-body">
          <div class="tp-dest-name">${d.flag} ${d.name}</div>
          <div class="tp-dest-sub">Маршрут + eSIM</div>
        </div>
      </a>
    `).join("");
  }

  function renderChinaCities() {
    const box = $("platformChinaCities");
    const data = window.TRAVEL_DATA;
    if (!box || !data) return;
    box.innerHTML = data.chinaCities.map((c) => `
      <article class="tp-china-card" id="city-${c.id}">
        <div class="tp-china-head">
          <img src="${c.img}" alt="${c.name} — ${c.cn}" loading="lazy">
          <div class="tp-china-body">
            <h3>${c.name} <span style="color:#64748b;font-weight:600">${c.cn}</span></h3>
            <div class="tp-china-meta">
              <strong>Үзэх газар:</strong>
              <ul>${c.attractions.map((a) => `<li>${a}</li>`).join("")}</ul>
              <p><strong>Тээвэр:</strong> ${c.transport}</p>
              <p><strong>Ойролцоох зардал:</strong> ${c.budget}</p>
            </div>
            <div class="tp-china-actions">
              <a class="tp-btn" href="${c.map}" target="_blank" rel="noopener">📍 Map</a>
              <a class="tp-btn" href="${c.route}">🗺 Маршрут</a>
              <a class="tp-btn" href="${c.esim}">📶 eSIM</a>
              <button type="button" class="tp-btn primary" data-book-city="${c.name}">Захиалах</button>
            </div>
          </div>
        </div>
      </article>
    `).join("");

    box.querySelectorAll("[data-book-city]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openBookingForm("full", {
          country: "Хятад",
          city: btn.dataset.bookCity,
          notes: `${btn.dataset.bookCity} — бүтэн аяллын захиалга`
        }, BOOKING_TITLES.full);
      });
    });
  }

  function bindServices() {
    const data = window.TRAVEL_DATA;
    if (!data) return;
    const grid = $("platformServices");
    if (!grid) return;
    grid.innerHTML = data.services.map((s) => `
      <button type="button" class="tp-service-card" data-service="${s.id}">
        <div class="icon">${s.icon}</div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </button>
    `).join("");

    grid.querySelectorAll(".tp-service-card").forEach((card) => {
      card.addEventListener("click", () => {
        const s = data.services.find((x) => x.id === card.dataset.service);
        if (!s) return;
        if (s.tab) { setTab(s.tab); window.scrollTo({ top: $("tpSearchCard")?.offsetTop - 20 || 0, behavior: "smooth" }); return; }
        if (s.anchor) { window.location.hash = s.anchor.replace("#", ""); document.querySelector(s.anchor)?.scrollIntoView({ behavior: "smooth" }); return; }
        if (s.href) { window.location.href = s.href; return; }
        openInquiryModal(s.id);
      });
    });
  }

  const HOTEL_IMG_FALLBACK = "/images/china/guide/hero.jpg";
  const HOTEL_IMAGE_LABELS = {
    exterior: "Гадна тал",
    lobby: "Лобби",
    standard_room: "Стандарт өрөө",
    deluxe_room: "Дэлюкс өрөө",
    bathroom: "Угаалга",
    restaurant: "Ресторан"
  };

  function countryLabel(countryId) {
    return window.TRAVEL_CITIES?.getCountry(countryId)?.name_mn || countryId || "";
  }

  function cityLabel(cityId) {
    return window.TRAVEL_CITIES?.getCityLabelMn(cityId) || cityId || "";
  }

  function hotelImagesList(h) {
    const fb = window.HOTELS_CATALOG?.FALLBACK_IMG || window.MOCK_SEARCH?.FALLBACK_IMG || HOTEL_IMG_FALLBACK;
    if (h.images && typeof h.images === "object" && !Array.isArray(h.images)) {
      return Object.keys(HOTEL_IMAGE_LABELS)
        .map((k) => h.images[k])
        .filter(Boolean);
    }
    if (Array.isArray(h.images) && h.images.length) return h.images;
    if (h.image) return [h.image];
    return [fb];
  }

  function hotelCover(h) {
    if (h.images?.exterior) return h.images.exterior;
    if (Array.isArray(h.images_list) && h.images_list.length) return h.images_list[0];
    if (h.images && typeof h.images === "object" && !Array.isArray(h.images)) {
      const first = Object.values(h.images).find(Boolean);
      if (first) return first;
    }
    if (Array.isArray(h.images) && h.images.length) return h.images[0];
    if (h.image) return h.image;
    return window.HOTELS_CATALOG?.FALLBACK_IMG || window.MOCK_SEARCH?.FALLBACK_IMG || HOTEL_IMG_FALLBACK;
  }

  function hotelImgFallback() {
    return window.HOTELS_CATALOG?.FALLBACK_IMG || window.HOTELS_CATALOG?.HOTEL_STOCK?.exterior?.[0] || HOTEL_IMG_FALLBACK;
  }

  function hotelImgTag(h, className) {
    const src = hotelCover(h);
    const name = h.name_en || h.name || "Hotel";
    const alt = `${name} — ${cityLabel(h.city_id)}`;
    const fb = hotelImgFallback();
    return `<img class="${className}" src="${src}" alt="${alt}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fb}'">`;
  }

  function hotelGalleryHtml(hotel, fb) {
    const fallback = fb || hotelImgFallback();
    if (hotel.images && typeof hotel.images === "object" && !Array.isArray(hotel.images)) {
      return Object.entries(HOTEL_IMAGE_LABELS).map(([key, label]) => {
        const src = hotel.images[key] || fallback;
        return `<figure class="tp-hotel-gallery-item tp-hotel-gallery-lg"><img src="${src}" alt="${hotel.name_en} — ${label}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallback}'"><figcaption>${label}</figcaption></figure>`;
      }).join("");
    }
    return hotelImagesList(hotel).map((src, i) => {
      const label = Object.values(HOTEL_IMAGE_LABELS)[i] || "Зураг";
      return `<figure class="tp-hotel-gallery-item tp-hotel-gallery-lg"><img src="${src}" alt="${hotel.name_en} — ${label}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallback}'"><figcaption>${label}</figcaption></figure>`;
    }).join("");
  }

  function stars(n) {
    return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
  }

  function priceItem(item) {
    const td = window.TRAVEL_DATA;
    if (td && td.priceItem) return td.priceItem(item);
    const calc = td?.calcFinalPriceMnt || (() => ({ final_price_mnt: 0 }));
    return { ...item, ...calc(item) };
  }

  function itemLabel(item) {
    if (item.type === "hotel") {
      const nm = item.name_en || item.name;
      const dist = item.district || "";
      return `${nm} — ${cityLabel(item.city_id)}${dist ? `, ${dist}` : ""}`;
    }
    if (item.type === "train") return `${item.train_number} ${item.from_city}→${item.to_city} ${item.depart_time}`;
    if (item.type === "flight") return `${item.airline} ${item.from_city}→${item.to_city} ${item.depart_time}`;
    return item.title || item.name_mn || item.name || "Сонголт";
  }

  function mockSearch(type, formData) {
    const mock = window.MOCK_SEARCH;
    if (!mock) return { results: [], meta: {} };

    if (type === "hotel") {
      const cityInput = formData.city || "Шанхай";
      const cityId = window.TRAVEL_CITIES?.normalizeCity(cityInput);
      const countryId = window.TRAVEL_CITIES?.normalizeCountry(formData.country) ||
        (cityId ? window.TRAVEL_CITIES?.getCity(cityId)?.country_id : "china");
      const nights = formData.days || 5;

      if (!cityId) {
        return { results: [], meta: { cityInput, error: "city_not_found" } };
      }
      const city = window.TRAVEL_CITIES?.getCity(cityId);
      if (countryId && city && city.country_id !== countryId) {
        return { results: [], meta: { cityId, countryId, error: "country_mismatch" } };
      }

      const results = (window.MOCK_SEARCH?.hotels(cityInput, nights) || []).map(priceItem);
      return { results, meta: { cityId, cityInput, countryId: city?.country_id, nights } };
    }
    if (type === "train") {
      const route = mock.trains(formData.from || "Хөх хот", formData.city || "Бээжин");
      const results = (route.trains || []).map(priceItem);
      return { results, meta: { fromId: route.fromId, toId: route.toId, routeKey: route.routeKey } };
    }
    if (type === "flight") {
      const results = mock.flights(formData.from || "Улаанбаатар", formData.city || "Шанхай").map(priceItem);
      const toId = window.TRAVEL_CITIES?.normalizeCity(formData.city);
      return { results, meta: { toId } };
    }
    if (type === "attraction") {
      const cityId = window.TRAVEL_CITIES?.normalizeCity(formData.city || "Шанхай") || "shanghai";
      const cityName = cityLabel(cityId);
      const people = Number(formData.people || 2);
      const results = [
        { type: "attraction", id: `att-${cityId}-1`, city_id: cityId, name_mn: `Disneyland ${cityName}`, description_mn: "1 өдрийн тасалбар", original_price: 499 * people, currency: "CNY", internal_supplier_reference: { supplier_price: 499 * people, currency: "CNY" } },
        { type: "attraction", id: `att-${cityId}-2`, city_id: cityId, name_mn: "Great Wall Tour", description_mn: "Тээвэр + хоол", original_price: 280 * people, currency: "CNY", internal_supplier_reference: { supplier_price: 280 * people, currency: "CNY" } }
      ].map(priceItem);
      return { results, meta: { cityId } };
    }
    const results = mock.flights("Улаанбаатар", formData.city || "Шанхай").map(priceItem);
    return { results, meta: {} };
  }

  function openHotelDetail(hotel) {
    const modal = $("hotelDetailModal");
    const bd = $("hotelDetailModalBd");
    const body = $("hotelDetailBody");
    if (!modal || !bd || !body) return;

    const fb = hotelImgFallback();
    const gallery = hotelGalleryHtml(hotel, fb);
    const nearby = (hotel.nearby_attractions || []).map((a) => `<span class="tp-badge muted">${a}</span>`).join("");
    const amenities = (hotel.amenities || []).map((a) => `<span class="tp-badge">${a}</span>`).join("");
    const policy = [
      hotel.breakfast ? "<span class=\"tp-badge\">☕ Өглөөний цай</span>" : "",
      hotel.free_cancellation ? "<span class=\"tp-badge\">✓ Үнэгүй цуцлах</span>" : ""
    ].filter(Boolean).join("");

    const rooms = (hotel.rooms || []).map((r) => `
      <div class="tp-hotel-room">
        ${r.image ? `<img src="${r.image}" alt="${r.name}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fb}'">` : ""}
        <div>
          <strong>${r.name}</strong>
          ${r.beds ? `<span class="tp-muted"> • ${r.beds} ор</span>` : ""}
          ${r.amenities?.length ? `<div class="tp-room-amenities">${r.amenities.map((a) => `<span class="tp-badge muted">${a}</span>`).join("")}</div>` : ""}
        </div>
      </div>`).join("");

    const mapUrl = hotel.map_url || window.TRAVEL_CITIES?.cityMapUrl(hotel.city_id, hotel.name_en);

    body.innerHTML = `
      <div class="tp-hotel-detail-hero">${hotelImgTag(hotel, "tp-hotel-detail-cover")}</div>
      <div class="tp-hotel-detail-gallery">${gallery}</div>
      <div class="tp-hotel-detail-main">
        <div class="tp-hotel-stars">${stars(hotel.stars || 0)}</div>
        <h3>${hotel.name_en}</h3>
        <p class="tp-hotel-detail-loc">📍 ${countryLabel(hotel.country_id)} • ${cityLabel(hotel.city_id)} • ${hotel.district || ""}</p>
        <p class="tp-hotel-detail-desc">${hotel.description_mn || ""}</p>
        <div class="tp-hotel-badges">${policy}${amenities}</div>
        <ul class="tp-hotel-detail-facts">
          <li><strong>Хаяг:</strong> ${hotel.address || "—"}</li>
          <li><strong>Метро / тээвэр:</strong> ${hotel.metro_distance || "—"}</li>
          <li><strong>Ойролцоох:</strong> ${hotel.attraction_distance || "—"}</li>
        </ul>
        ${nearby ? `<div class="tp-hotel-nearby"><strong>Үзэх газар:</strong><div class="tp-hotel-badges">${nearby}</div></div>` : ""}
        <a class="tp-btn" href="${mapUrl}" target="_blank" rel="noopener" style="margin:12px 0;display:inline-block">📍 Газрын зураг</a>
        <h4>Өрөөний төрөл</h4>
        <div class="tp-hotel-rooms">${rooms || "<p class='tp-muted'>Стандарт өрөө</p>"}</div>
        <div class="tp-hotel-detail-price">
          <div class="tp-price-final">${fmtMnt(hotel.final_price_mnt)}</div>
          ${hotel.nights ? `<div class="tp-price-note">${hotel.nights} шөнө</div>` : ""}
        </div>
        <button type="button" class="tp-btn primary tp-hotel-detail-book" data-item-id="${hotel.id}">Захиалах</button>
      </div>`;

    body.querySelector(".tp-hotel-detail-book")?.addEventListener("click", () => {
      closeHotelDetail();
      openBookingForm("hotel", {
        selectedItem: itemLabel(hotel),
        city: cityLabel(hotel.city_id),
        country: hotel.country_id || "",
        bookingItem: {
          final_price_mnt: hotel.final_price_mnt,
          selected_item: itemLabel(hotel),
          supplier_internal: hotel.internal_supplier_reference
        }
      }, BOOKING_TITLES.hotel);
    });

    modal.style.display = "block";
    bd.style.display = "block";
  }

  function closeHotelDetail() {
    const modal = $("hotelDetailModal");
    const bd = $("hotelDetailModalBd");
    if (modal) modal.style.display = "none";
    if (bd) bd.style.display = "none";
  }

  function renderHotelCard(h) {
    const badges = (h.amenities || h.badges || []).slice(0, 3).map((b) => `<span class="tp-badge">${b}</span>`).join("");
    const dist = [h.metro_distance, h.attraction_distance].filter(Boolean).join(" • ");
    return `
      <article class="tp-hotel-card" data-item-id="${h.id}">
        ${hotelImgTag(h, "tp-hotel-img")}
        <div class="tp-hotel-body">
          <div class="tp-hotel-stars">${stars(h.stars)}</div>
          <h4 class="tp-hotel-name">${h.name_en}</h4>
          <div class="tp-hotel-area">${countryLabel(h.country_id)} • ${cityLabel(h.city_id)} • ${h.district || ""}</div>
          <p class="tp-hotel-desc">${h.description_mn || ""}</p>
          ${dist ? `<div class="tp-hotel-dist">📍 ${dist}</div>` : ""}
          <div class="tp-hotel-badges">${badges}${h.breakfast ? '<span class="tp-badge">☕ Өглөөний цай</span>' : ""}${h.free_cancellation ? '<span class="tp-badge">✓ Цуцлах</span>' : ""}</div>
          <div class="tp-card-price-row">
            <div>
              <div class="tp-price-final">${fmtMnt(h.final_price_mnt)}</div>
              ${h.nights ? `<div class="tp-price-note">${h.nights} шөнө</div>` : ""}
            </div>
            <div class="tp-card-actions">
              <button type="button" class="tp-btn tp-btn-detail" data-detail-type="hotel" data-item-id="${h.id}">Дэлгэрэнгүй</button>
              <button type="button" class="tp-btn-book" data-book-type="hotel" data-item-id="${h.id}">Захиалах</button>
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderTrainCard(t) {
    return `
      <article class="tp-train-card" data-item-id="${t.id}">
        <div class="tp-train-route">
          <div class="tp-train-city">
            <div class="tp-train-time">${t.depart_time}</div>
            <div class="tp-train-place">${t.from_city}</div>
          </div>
          <div class="tp-train-mid">
            <div class="tp-train-dur">${t.duration}</div>
            <div class="tp-train-line"></div>
            <div class="tp-train-num">${t.train_number}</div>
          </div>
          <div class="tp-train-city align-right">
            <div class="tp-train-time">${t.arrive_time}</div>
            <div class="tp-train-place">${t.to_city}</div>
          </div>
        </div>
        <div class="tp-train-meta">
          <span class="tp-badge">${t.seat_type}</span>
        </div>
        <div class="tp-card-price-row">
          <div>
            <div class="tp-price-final">${fmtMnt(t.final_price_mnt)}</div>
          </div>
          <button type="button" class="tp-btn-book" data-book-type="train" data-item-id="${t.id}">Захиалах</button>
        </div>
      </article>`;
  }

  function renderFlightCard(f) {
    return `
      <article class="tp-flight-card" data-item-id="${f.id}">
        <div class="tp-flight-airline">✈️ ${f.airline}</div>
        <div class="tp-train-route">
          <div class="tp-train-city">
            <div class="tp-train-time">${f.depart_time}</div>
            <div class="tp-train-place">${f.depart_airport}</div>
            <div class="tp-flight-sub">${f.from_city}</div>
          </div>
          <div class="tp-train-mid">
            <div class="tp-train-dur">${f.duration}</div>
            <div class="tp-train-line"></div>
          </div>
          <div class="tp-train-city align-right">
            <div class="tp-train-time">${f.arrive_time}</div>
            <div class="tp-train-place">${f.arrive_airport}</div>
            <div class="tp-flight-sub">${f.to_city}</div>
          </div>
        </div>
        <div class="tp-train-meta">
          <span class="tp-badge">🧳 ${f.baggage}</span>
        </div>
        <div class="tp-card-price-row">
          <div>
            <div class="tp-price-final">${fmtMnt(f.final_price_mnt)}</div>
          </div>
          <button type="button" class="tp-btn-book" data-book-type="flight" data-item-id="${f.id}">Захиалах</button>
        </div>
      </article>`;
  }

  function renderAttractionCard(a) {
    return `
      <article class="tp-train-card" data-item-id="${a.id}">
        <h4 class="tp-hotel-name">${a.name_mn || a.name}</h4>
        <p class="tp-hotel-desc">${a.description_mn || a.description || ""}</p>
        <div class="tp-card-price-row">
          <div>
            <div class="tp-price-final">${fmtMnt(a.final_price_mnt)}</div>
          </div>
          <button type="button" class="tp-btn-book" data-book-type="attraction" data-item-id="${a.id}">Захиалах</button>
        </div>
      </article>`;
  }

  function showMockResults(type, results, meta) {
    lastMockResults = results;
    lastSearchMeta = meta || {};
    const box = $("mockResults");
    if (!box) return;
    const label = SERVICE_TYPES[type] || type;
    box.style.display = "block";

    let gridClass = "tp-results-grid";
    let cards = "";
    if (type === "hotel") {
      gridClass = "tp-hotel-grid";
      cards = results.map(renderHotelCard).join("");
    } else if (type === "train") {
      gridClass = "tp-train-grid";
      cards = results.map(renderTrainCard).join("");
    } else if (type === "flight") {
      gridClass = "tp-flight-grid";
      cards = results.map(renderFlightCard).join("");
    } else {
      cards = results.map(renderAttractionCard).join("");
    }

    let sub = "";
    if (type === "hotel" && meta?.cityId) {
      const c = window.TRAVEL_CITIES?.getCity(meta.cityId);
      sub = `<p class="tp-lead">${countryLabel(c?.country_id)} — ${window.TRAVEL_CITIES?.getCityLabel(meta.cityId) || meta.cityInput}</p>`;
    }
    if (type === "hotel" && meta?.error === "city_not_found") {
      sub = `<p class="tp-lead tp-warn">Хот олдсонгүй. Монгол, Англи эсвэл орон нутгийн нэрээр бичнэ үү.</p>`;
    }
    if (type === "hotel" && meta?.error === "country_mismatch") {
      sub = `<p class="tp-lead tp-warn">Сонгосон улс, хот тохирохгүй байна. Улсаа зөв сонгоно уу.</p>`;
    }
    if (type === "hotel" && !results.length && !meta?.error) {
      sub += `<p class="tp-lead tp-warn">Энэ хотод одоогоор буудал олдсонгүй.</p>`;
    }
    if (type === "train") {
      if (meta?.fromId && meta?.toId) {
        sub = `<p class="tp-lead">${cityLabel(meta.fromId)} → ${cityLabel(meta.toId)}</p>`;
      }
      if (!results.length) {
        sub += `<p class="tp-lead tp-warn">Энэ чиглэлд одоогоор тасалбар олдсонгүй. Жишээ: Хөх хот→Бээжин, Эрээн→Бээжин, Бээжин→Шанхай.</p>`;
      }
    }

    box.innerHTML = `
      <div class="tp-results-header">
        <h3>🔍 ${label} — ${results.length} сонголт</h3>
        ${sub}
      </div>
      <div class="${gridClass}">${cards || "<p class='tp-lead'>Үр дүн олдсонгүй.</p>"}</div>
    `;

    box.querySelectorAll("[data-detail-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = results.find((r) => r.id === btn.dataset.itemId);
        if (item) openHotelDetail(item);
      });
    });

    box.querySelectorAll("[data-book-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = results.find((r) => r.id === btn.dataset.itemId);
        if (!item) return;
        const bookType = btn.dataset.bookType || type;
        openBookingForm(bookType, {
          selectedItem: itemLabel(item),
          city: cityLabel(item.city_id),
          country: item.country_id || "",
          bookingItem: {
            final_price_mnt: item.final_price_mnt,
            selected_item: itemLabel(item),
            supplier_internal: item.internal_supplier_reference || null
          }
        }, BOOKING_TITLES[bookType]);
      });
    });

    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function collectForm(panel) {
    const fd = {};
    panel?.querySelectorAll("[data-field]").forEach((el) => {
      fd[el.dataset.field] = el.value;
    });
    return fd;
  }

  async function submitInquiry(e) {
    e.preventDefault();
    const form = $("inquiryForm");
    const statusEl = $("inqStatus");
    if (!form) return;

    const amount = Number(pendingBooking?.final_price_mnt || $("inqBudget")?.value || 0);
    if (!amount || amount <= 0) {
      if (statusEl) statusEl.textContent = "Эхлээд хайлтаас сонголтоо хийж «Захиалах» дарна уу.";
      return;
    }

    const payload = Object.fromEntries(new FormData(form));
    payload.service_type = payload.service_type || "flight";
    payload.final_price_mnt = amount;
    payload.selected_item = payload.selected_item || pendingBooking?.selected_item || "";
    payload.supplier_internal = pendingBooking?.supplier_internal || null;

    if (statusEl) statusEl.textContent = "Бэлтгэж байна…";
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch("/.netlify/functions/travel-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Алдаа");

      await openQPayForBooking(data.orderId, data.amount, data.description);
    } catch (err) {
      const formStep = $("bookingStepForm");
      const payStep = $("bookingStepPay");
      if (formStep) formStep.style.display = "";
      if (payStep) payStep.style.display = "none";
      if (statusEl) statusEl.textContent = "❌ " + (err.message || "Алдаа гарлаа");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function initTabs() {
    document.querySelectorAll(".tp-tab").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.dataset.tab));
    });

    $("openInquiryBtn")?.addEventListener("click", () => {
      openBookingForm("flight", {}, BOOKING_TITLES.flight);
    });

    document.querySelectorAll("[data-search-run]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.searchRun;
        const panel = document.querySelector(`.tp-panel[data-panel="${type}"]`);
        const fd = collectForm(panel);
        const { results, meta } = mockSearch(type, fd);
        showMockResults(type, results, meta);
      });
    });
  }

  function initHotelDetailModal() {
    $("hotelDetailModalBd")?.addEventListener("click", closeHotelDetail);
    $("hotelDetailModalClose")?.addEventListener("click", closeHotelDetail);
  }

  function updateHotelCityList(countryId) {
    const list = $("hotelCitiesList");
    if (!list) return;
    const opts = window.TRAVEL_CITIES?.allCityOptions(countryId) || [];
    list.innerHTML = opts.map((o) => `<option value="${o.label.split(" — ")[0]}"></option>`).join("");
    const cities = window.TRAVEL_CITIES?.getCitiesByCountry(countryId) || [];
    const input = $("hotelCityInput");
    if (input && cities[0]) input.value = cities[0].name_mn;
  }

  function initCountryCitySelects() {
    const countrySel = $("hotelCountrySelect");
    if (countrySel) {
      countrySel.addEventListener("change", () => updateHotelCityList(countrySel.value));
      updateHotelCityList(countrySel.value);
    }
    const list = $("chinaCitiesList");
    const chinaOpts = window.TRAVEL_CITIES?.allCityOptions("china") || [];
    if (list) list.innerHTML = chinaOpts.map((o) => `<option value="${o.label.split(" — ")[0]}"></option>`).join("");
  }

  function initCityDatalists() {
    initCountryCitySelects();
  }

  function initInquiryModal() {
    $("inquiryModalBd")?.addEventListener("click", closeInquiryModal);
    $("inquiryModalClose")?.addEventListener("click", closeInquiryModal);
    $("inquiryForm")?.addEventListener("submit", submitInquiry);
  }

  window.TravelBooking = {
    openInquiryModal,
    openBookingForm,
    closeInquiryModal,
    closeHotelDetail,
    openHotelDetail,
    setTab,
    STATUS_LABELS,
    SERVICE_TYPES,
    BOOKING_TITLES
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderDestinations();
    renderChinaCities();
    bindServices();
    initTabs();
    initInquiryModal();
    initHotelDetailModal();
    initCityDatalists();
    setTab("ai");

    if (location.hash === "#esim") {
      document.querySelector("#esim")?.scrollIntoView({ behavior: "smooth" });
    }
  });
})();
