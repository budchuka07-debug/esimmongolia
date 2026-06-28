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
    train: "Галт тэрэг / Автобус",
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
    train: "Тээврийн тасалбар захиалах",
    transport: "Тээврийн тасалбар захиалах",
    attraction: "Үзвэр захиалах",
    esim: "eSIM авах",
    visa: "Визийн зөвлөгөө",
    route: "Маршрут захиалах"
  };

  let activeTab = "flight";
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

  function buildHotelBookingPreset(hotel) {
    const room = hotel.rooms?.[0]?.name || "";
    return {
      selectedItem: itemLabel(hotel),
      city: cityLabel(hotel.city_id),
      country: hotel.country_id || "",
      city_id: hotel.city_id,
      hotel_id: hotel.id,
      hotel_official_name: hotel.official_name || hotel.name_en,
      room_type: room,
      bookingItem: {
        final_price_mnt: hotel.final_price_mnt,
        selected_item: itemLabel(hotel),
        supplier_internal: hotel.supplier_reference || hotel.internal_supplier_reference,
        hotel_id: hotel.id,
        hotel_official_name: hotel.official_name || hotel.name_en,
        city_id: hotel.city_id,
        room_type: room
      }
    };
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
        supplier_internal: preset.supplier_internal || preset.supplier_reference || null,
        hotel_id: preset.hotel_id || null,
        hotel_official_name: preset.hotel_official_name || preset.selectedItem || "",
        city_id: preset.city_id || null,
        room_type: preset.room_type || null,
        check_in: preset.check_in || null,
        check_out: preset.check_out || null
      };
    }

    const isHotel = type === "hotel";
    document.querySelectorAll(".tp-hotel-only").forEach((el) => {
      el.style.display = isHotel ? "" : "none";
    });

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
      selectedItem: "inqSelectedItem",
      hotelId: "inqHotelId",
      hotelOfficial: "inqHotelOfficial",
      cityId: "inqCityId",
      roomType: "inqRoomType",
      checkIn: "inqCheckIn",
      checkOut: "inqCheckOut"
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
    if (preset?.hotel_id && $("inqHotelId")) $("inqHotelId").value = preset.hotel_id;
    if (preset?.hotel_official_name && $("inqHotelOfficial")) $("inqHotelOfficial").value = preset.hotel_official_name;
    if (preset?.city_id && $("inqCityId")) $("inqCityId").value = preset.city_id;
    if (preset?.room_type && $("inqRoomType")) $("inqRoomType").value = preset.room_type;

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
        ${s.img ? `<img class="tp-service-img" src="${s.img}" alt="${s.title}" loading="lazy">` : ""}
        <div class="tp-service-body">
          <div class="icon">${s.icon}</div>
          <h3>${s.title}</h3>
          <p>${s.desc}</p>
        </div>
      </button>
    `).join("");

    grid.querySelectorAll(".tp-service-card").forEach((card) => {
      card.addEventListener("click", () => {
        const s = data.services.find((x) => x.id === card.dataset.service);
        if (!s) return;
        if (s.action === "ai_chat") {
          window.TravelAssistant?.openAiChat?.();
          return;
        }
        if (s.tab) { setTab(s.tab); window.scrollTo({ top: $("tpSearchCard")?.offsetTop - 20 || 0, behavior: "smooth" }); return; }
        if (s.anchor) { window.location.hash = s.anchor.replace("#", ""); document.querySelector(s.anchor)?.scrollIntoView({ behavior: "smooth" }); return; }
        if (s.href) { window.location.href = s.href; return; }
        openInquiryModal(s.id);
      });
    });
  }

  const HOTEL_IMG_FALLBACK = "/images/hotels/exterior-01.jpg";
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
    if (h.images?.lobby) return h.images.lobby;
    if (h.cover_key && h.images?.[h.cover_key]) return h.images[h.cover_key];
    if (Array.isArray(h.images_list) && h.images_list.length) {
      const idx = hashHotelIdx(h.id) % h.images_list.length;
      return h.images_list[idx];
    }
    if (h.images && typeof h.images === "object" && !Array.isArray(h.images)) {
      const vals = Object.values(h.images).filter(Boolean);
      if (vals.length) return vals[hashHotelIdx(h.id) % vals.length];
    }
    if (Array.isArray(h.images) && h.images.length) return h.images[hashHotelIdx(h.id) % h.images.length];
    if (h.image) return h.image;
    return window.HOTELS_CATALOG?.FALLBACK_IMG || window.MOCK_SEARCH?.FALLBACK_IMG || HOTEL_IMG_FALLBACK;
  }

  function hashHotelIdx(id) {
    return String(id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  }

  function hotelImgFallback() {
    return "/images/hotels/exterior-01.jpg";
  }

  function hotelImgTag(h, className) {
    const src = hotelCover(h);
    const name = h.name_en || h.name || "Hotel";
    const alt = `${name} — ${cityLabel(h.city_id)}`;
    const fb = hotelImgFallback();
    return `<img class="${className}" src="${src}" alt="${alt}" loading="lazy" onerror="this.onerror=null;this.src='${fb}'">`;
  }

  function hotelGalleryHtml(hotel, fb) {
    const fallback = fb || hotelImgFallback();
    if (hotel.images && typeof hotel.images === "object" && !Array.isArray(hotel.images)) {
      return Object.entries(HOTEL_IMAGE_LABELS).map(([key, label]) => {
        const src = hotel.images[key] || fallback;
        return `<figure class="tp-hotel-gallery-item tp-hotel-gallery-lg"><img src="${src}" alt="${hotel.name_en} — ${label}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'"><figcaption>${label}</figcaption></figure>`;
      }).join("");
    }
    return hotelImagesList(hotel).map((src, i) => {
      const label = Object.values(HOTEL_IMAGE_LABELS)[i] || "Зураг";
      return `<figure class="tp-hotel-gallery-item tp-hotel-gallery-lg"><img src="${src}" alt="${hotel.name_en} — ${label}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'"><figcaption>${label}</figcaption></figure>`;
    }).join("");
  }

  function stars(n) {
    return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
  }

  function priceTransportItem(item) {
    const priced = { ...item, original_price: item.price_cny_min ?? item.original_price };
    const base = priceItem(priced);
    const max = Number(item.price_cny_max || item.price_cny_min || 0);
    const min = Number(item.price_cny_min || item.original_price || 0);
    const out = { ...base };
    if (max > min) {
      const maxPriced = priceItem({ ...item, original_price: max });
      out.final_price_mnt_max = maxPriced.final_price_mnt;
      out.internal_supplier_reference = {
        ...out.internal_supplier_reference,
        supplier_price_cny_min: min,
        supplier_price_cny_max: max,
        final_price_mnt_max: maxPriced.final_price_mnt
      };
    }
    return out;
  }

  function customerPriceNote() {
    return window.TRAVEL_DATA?.rateFootnote?.() || "Төлөх эцсийн үнэ (₮)";
  }

  function formatTransportPrice(t) {
    if (t.final_price_mnt_max && t.final_price_mnt_max > t.final_price_mnt) {
      return `${fmtMnt(t.final_price_mnt)} – ${fmtMnt(t.final_price_mnt_max)}`;
    }
    return fmtMnt(t.final_price_mnt);
  }

  function transportCategoryLabel(t) {
    if (t.transport_type === "bus") return "🚌 Автобус";
    if (t.route_category === "transfer") return "🔀 Дамжих";
    if (t.route_category === "direct") return "🚄 Шууд";
    return t.transport_type === "train" ? "🚄 Галт тэрэг" : "🚌 Автобус";
  }

  function transportTypeBadge(t) {
    return t.transport_type === "bus"
      ? '<span class="tp-badge tp-badge-bus">🚌 Автобус</span>'
      : '<span class="tp-badge tp-badge-train">🚄 Галт тэрэг</span>';
  }

  function transportRouteBadge(t) {
    if (t.transport_type === "bus") return "";
    if (t.transfer_required) return '<span class="tp-badge tp-badge-transfer">🔀 Дамжих</span>';
    return '<span class="tp-badge tp-badge-direct">Шууд</span>';
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
    if (item.type === "transport") {
      const mode = item.transport_type === "bus" ? "Автобус" : "Галт тэрэг";
      const dep = item.departure_time || item.departure_note || "";
      return `${mode}: ${item.from_city}→${item.to_city}${dep ? ` (${dep})` : ""}`;
    }
    if (item.type === "train") return `${item.from_city}→${item.to_city} ${item.depart_time || ""}`.trim();
    if (item.type === "flight") return `${item.airline} ${item.from_city}→${item.to_city} ${item.depart_time}`;
    return item.title || item.name_mn || item.name || "Сонголт";
  }

  function mockSearch(type, formData) {
    const mock = window.MOCK_SEARCH;
    if (!mock) return { results: [], meta: {} };

    if (type === "hotel") {
      const cityInput = formData.city || "Шанхай";
      const cityId = formData.city_id || window.TRAVEL_CITIES?.normalizeCity(cityInput);
      const countryId = window.TRAVEL_CITIES?.normalizeCountry(formData.country) ||
        (cityId ? window.TRAVEL_CITIES?.getCity(cityId)?.country_id : "china");
      const nights = formData.days || 5;
      const sideFilters = collectHotelFilters();
      const filters = buildHotelSearchFilters(formData, sideFilters);

      if (!cityId) {
        return { results: [], meta: { cityInput, error: "city_not_found" } };
      }
      const city = window.TRAVEL_CITIES?.getCity(cityId);
      if (countryId && city && city.country_id !== countryId) {
        return { results: [], meta: { cityId, countryId, error: "country_mismatch" } };
      }

      let results = (window.MOCK_SEARCH?.hotels(cityInput, nights, filters) || []).map(priceItem);
      results = applyMntFilters(results, sideFilters);
      results = sortHotelResults(results, filters.sort);

      return { results, meta: { cityId, cityInput, countryId: city?.country_id, nights, filters, formData } };
    }
    if (type === "train") {
      const fromId = formData.from_city_id || window.TRAVEL_CITIES?.normalizeCity(formData.from || "Эрээн");
      const toId = formData.city_id || window.TRAVEL_CITIES?.normalizeCity(formData.city || "Бээжин");
      const route = mock.transport?.(formData.from || "Эрээн", formData.city || "Бээжин")
        || mock.trains(formData.from || "Эрээн", formData.city || "Бээжин");
      const results = (route.results || route.trains || []).map(priceTransportItem);
      return { results, meta: { fromId: fromId || route.fromId, toId: toId || route.toId, routeKey: route.routeKey } };
    }
    if (type === "flight") {
      const fromId = formData.from_city_id || window.TRAVEL_CITIES?.normalizeCity(formData.from || "Улаанбаатар");
      const toId = formData.city_id || window.TRAVEL_CITIES?.normalizeCity(formData.city || "Шанхай");
      const flightData = mock.flights(formData.from || "Улаанбаатар", formData.city || "Шанхай", {
        from_city_id: fromId,
        city_id: toId,
        date: formData.date || null
      });
      const results = (flightData.results || []).map(priceItem);
      return { results, meta: { fromId, toId, ...(flightData.meta || {}) } };
    }
    if (type === "attraction") {
      const cityId = formData.city_id || window.TRAVEL_CITIES?.normalizeCity(formData.city || "Шанхай") || "shanghai";
      const cityName = cityLabel(cityId);
      const people = Number(formData.people || 2);
      const results = [
        { type: "attraction", id: `att-${cityId}-1`, city_id: cityId, name_mn: `Disneyland ${cityName}`, description_mn: "1 өдрийн тасалбар", original_price: 499 * people, currency: "CNY", internal_supplier_reference: { supplier_price: 499 * people, currency: "CNY" } },
        { type: "attraction", id: `att-${cityId}-2`, city_id: cityId, name_mn: "Great Wall Tour", description_mn: "Тээвэр + хоол", original_price: 280 * people, currency: "CNY", internal_supplier_reference: { supplier_price: 280 * people, currency: "CNY" } }
      ].map(priceItem);
      return { results, meta: { cityId } };
    }
    const flightData = mock.flights("Улаанбаатар", formData.city || "Шанхай", {
      city_id: formData.city_id,
      date: formData.date
    });
    const results = (flightData.results || []).map(priceItem);
    return { results, meta: flightData.meta || {} };
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
        ${r.image ? `<img src="${r.image}" alt="${r.name}" loading="lazy" onerror="this.onerror=null;this.src='${fb}'">` : ""}
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
        <p class="tp-hotel-detail-loc">📍 ${countryLabel(hotel.country_id)} • ${cityLabel(hotel.city_id)} • ${hotel.area_name || hotel.district || ""}</p>
        <p class="tp-hotel-detail-desc">${hotel.description_mn || ""}</p>
        <div class="tp-hotel-badges">${policy}${amenities}${hotel.family_friendly ? '<span class="tp-badge">👨‍👩‍👧 Гэр бүлд тохиромжтой</span>' : ""}</div>
        <ul class="tp-hotel-detail-facts">
          <li><strong>Хаяг:</strong> ${hotel.address || "—"}</li>
          <li><strong>Метро:</strong> ${hotel.nearby_metro ? `${hotel.nearby_metro} (${hotel.distance_to_metro_m} м)` : "—"}</li>
          <li><strong>Нисэх буудал:</strong> ${hotel.distance_to_airport_km} км</li>
          <li><strong>Төвөөс:</strong> ${hotel.distance_to_center_km} км</li>
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
      openBookingForm("hotel", buildHotelBookingPreset(hotel), BOOKING_TITLES.hotel);
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

  function formatHotelDist(h) {
    const parts = [];
    if (h.nearby_metro && h.distance_to_metro_m < 9000) {
      parts.push(`🚇 ${h.nearby_metro} ${h.distance_to_metro_m}м`);
    }
    const lm = (h.nearby_landmarks || [])[0];
    if (lm && h.distance_to_attraction_km) {
      parts.push(`📍 ${lm} ${h.distance_to_attraction_km}км`);
    }
    return parts.join(" · ");
  }

  function renderHotelCard(h) {
    const badges = (h.amenities || h.badges || []).slice(0, 3).map((b) => `<span class="tp-badge">${b}</span>`).join("");
    const dist = formatHotelDist(h);
    const areaLine = [h.area_name || h.district].filter(Boolean).join(" · ");
    return `
      <article class="tp-hotel-card" data-item-id="${h.id}" data-lat="${h.latitude || 0}" data-lng="${h.longitude || 0}">
        ${hotelImgTag(h, "tp-hotel-img")}
        <div class="tp-hotel-body">
          <div class="tp-hotel-stars">${stars(h.stars)}</div>
          <h4 class="tp-hotel-name">${h.name_en}</h4>
          <div class="tp-hotel-area">${countryLabel(h.country_id)} • ${cityLabel(h.city_id)} • ${areaLine}</div>
          ${dist ? `<div class="tp-hotel-dist">${dist}</div>` : ""}
          <div class="tp-hotel-badges">${badges}${h.breakfast ? '<span class="tp-badge">☕ Өглөөний цай</span>' : ""}${h.free_cancellation ? '<span class="tp-badge">✓ Цуцлах</span>' : ""}${h.family_friendly ? '<span class="tp-badge">👨‍👩‍👧 Гэр бүл</span>' : ""}</div>
          <div class="tp-card-price-row">
            <div>
              <div class="tp-price-final">${fmtMnt(h.final_price_mnt)}</div>
              ${h.nights ? `<div class="tp-price-note">${h.nights} шөнө · ${customerPriceNote()}</div>` : `<div class="tp-price-note">${customerPriceNote()}</div>`}
            </div>
            <div class="tp-card-actions">
              <button type="button" class="tp-btn tp-btn-detail" data-detail-type="hotel" data-item-id="${h.id}">Дэлгэрэнгүй</button>
              <button type="button" class="tp-btn-book" data-book-type="hotel" data-item-id="${h.id}">Захиалах</button>
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderTransportCard(t) {
    const dep = t.departure_time
      ? `<div class="tp-train-time">${t.departure_time}</div>`
      : `<div class="tp-train-time tp-train-time-muted">${t.departure_note || "—"}</div>`;
    const arr = t.arrival_time
      ? `<div class="tp-train-time">${t.arrival_time}</div>`
      : `<div class="tp-train-time tp-train-time-muted">—</div>`;
    const dur = t.duration_note ? `${t.duration} (${t.duration_note})` : t.duration;
    const transfer = t.transfer_required && t.transfer_city
      ? `<div class="tp-transport-transfer">🔀 Дамжих: <strong>${t.transfer_city}</strong></div>`
      : "";
    const warn = t.confidence !== "verified" && t.needs_check_message
      ? `<p class="tp-transport-warn">⚠️ ${t.needs_check_message}</p>`
      : "";
    const source = t.source_url
      ? `<a class="tp-transport-source" href="${t.source_url}" target="_blank" rel="noopener noreferrer">📎 Цагийн эх сурвалж: ${t.source_name}</a>`
      : (t.source_name ? `<span class="tp-transport-source">📎 Цагийн эх сурвалж: ${t.source_name}</span>` : "");
    const checked = t.last_checked_at ? `<span class="tp-muted">Шалгасан: ${t.last_checked_at}</span>` : "";
    const bookType = "train";

    return `
      <article class="tp-train-card tp-transport-card" data-item-id="${t.id}">
        <div class="tp-transport-badges">${transportTypeBadge(t)}${transportRouteBadge(t)}</div>
        <div class="tp-train-route">
          <div class="tp-train-city">
            ${dep}
            <div class="tp-train-place">${t.from_city}</div>
          </div>
          <div class="tp-train-mid">
            <div class="tp-train-dur">${dur}</div>
            <div class="tp-train-line"></div>
          </div>
          <div class="tp-train-city align-right">
            ${arr}
            <div class="tp-train-place">${t.to_city}</div>
          </div>
        </div>
        ${transfer}
        <div class="tp-train-meta">
          ${t.seat_class_note ? `<span class="tp-badge muted">${t.seat_class_note}</span>` : ""}
          ${t.confidence === "verified" ? '<span class="tp-badge tp-badge-verified">✓ Баталгаажсан</span>' : '<span class="tp-badge tp-badge-check">Шалгах шаардлагатай</span>'}
        </div>
        ${t.notes_mn ? `<p class="tp-transport-note">${t.notes_mn}</p>` : ""}
        ${warn}
        <div class="tp-transport-footer">${source} ${checked}</div>
        <div class="tp-card-price-row">
          <div>
            <div class="tp-price-final">${formatTransportPrice(t)}</div>
            <div class="tp-price-note">${customerPriceNote()}</div>
          </div>
          <button type="button" class="tp-btn-book" data-book-type="${bookType}" data-item-id="${t.id}">Захиалах</button>
        </div>
      </article>`;
  }

  function renderTransportSections(results) {
    const sections = [
      { id: "direct", title: "🚄 Шууд галт тэрэг", match: (r) => r.transport_type === "train" && r.route_category === "direct" },
      { id: "transfer", title: "🔀 Дамжих галт тэрэг", match: (r) => r.transport_type === "train" && r.route_category === "transfer" },
      { id: "bus", title: "🚌 Автобус", match: (r) => r.transport_type === "bus" }
    ];
    return sections
      .map((sec) => {
        const items = results.filter(sec.match);
        if (!items.length) return "";
        return `
          <section class="tp-transport-section" data-section="${sec.id}">
            <h4 class="tp-transport-section-title">${sec.title} <span class="tp-muted">(${items.length})</span></h4>
            <div class="tp-train-grid">${items.map(renderTransportCard).join("")}</div>
          </section>`;
      })
      .filter(Boolean)
      .join("");
  }

  /** @deprecated use renderTransportCard */
  function renderTrainCard(t) {
    return renderTransportCard(t);
  }

  function flightRouteBadge(f) {
    if (f.is_direct) return '<span class="tp-badge tp-badge-direct">Шууд</span>';
    return '<span class="tp-badge tp-badge-transfer">Дамжин</span>';
  }

  function renderFlightCard(f) {
    const transfer = !f.is_direct && f.transfer_city
      ? `<div class="tp-transport-transfer">🔀 Дамжих: <strong>${f.transfer_city}</strong>${f.route_summary ? ` · ${f.route_summary}` : ""}</div>`
      : (f.route_summary ? `<div class="tp-flight-route-summary">${f.route_summary}</div>` : "");
    const warn = f.data_confidence === "needs_check" && f.needs_check_message
      ? `<p class="tp-transport-warn">⚠️ ${f.needs_check_message}</p>`
      : "";
    const confBadge = f.data_confidence === "verified"
      ? '<span class="tp-badge tp-badge-verified">✓ Баталгаажсан</span>'
      : (f.data_confidence === "estimated"
        ? '<span class="tp-badge muted">Тооцоолсон</span>'
        : '<span class="tp-badge tp-badge-check">Дахин шалгах</span>');

    return `
      <article class="tp-flight-card" data-item-id="${f.id}">
        <div class="tp-transport-badges">${flightRouteBadge(f)}${confBadge}</div>
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
        ${transfer}
        <div class="tp-train-meta">
          <span class="tp-badge">🧳 ${f.baggage}</span>
        </div>
        ${warn}
        <div class="tp-card-price-row">
          <div>
            <div class="tp-price-final">${fmtMnt(f.final_price_mnt)}</div>
            <div class="tp-price-note">${customerPriceNote()}</div>
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

  function renderMapPins(results) {
    const box = $("hotelMapPins");
    if (!box) return;
    const pins = results.slice(0, 12).map((h, i) => {
      const left = 10 + (i % 4) * 22;
      const top = 10 + Math.floor(i / 4) * 28;
      return `<span class="tp-map-pin" style="left:${left}%;top:${top}%" title="${h.name_en}">📍</span>`;
    }).join("");
    box.innerHTML = pins || "<span class='tp-muted'>Буудал олдсонгүй</span>";
  }

  function syncHomeSearchShell() {
    const wrap = document.querySelector(".tp-home-search");
    const container = $("resultsContainer");
    if (!wrap || !container) return;
    const shown = container.style.display !== "none";
    wrap.classList.toggle("has-results", shown);
  }

  function setHotelResultsLayout(isHotel) {
    const container = $("resultsContainer");
    const sidebar = $("hotelFiltersSidebar");
    const toolbar = $("hotelToolbar");
    if (container) {
      container.style.display = "";
      container.classList.toggle("tp-hotel-layout", isHotel);
    }
    syncHomeSearchShell();
    if (sidebar) sidebar.classList.toggle("tp-hotel-filters-visible", isHotel);
    if (toolbar) toolbar.style.display = isHotel ? "" : "none";
    if (!isHotel) {
      const map = $("hotelMapPlaceholder");
      if (map) map.style.display = "none";
      sidebar?.classList.remove("open");
      const overlay = $("hotelFiltersOverlay");
      if (overlay) overlay.style.display = "none";
    }
  }

  function showMockResults(type, results, meta) {
    lastMockResults = results;
    lastSearchMeta = meta || {};
    const box = $("mockResults");
    const container = $("resultsContainer");
    if (!box) return;
    const label = SERVICE_TYPES[type] || type;
    const isHotel = type === "hotel";

    setHotelResultsLayout(isHotel);
    box.style.display = "block";

    let gridClass = "tp-results-grid";
    let cards = "";
    if (isHotel) {
      gridClass = "tp-hotel-grid";
      cards = results.map(renderHotelCard).join("");
      renderMapPins(results);
    } else if (type === "train") {
      gridClass = "tp-transport-results";
      cards = renderTransportSections(results) || "";
    } else if (type === "flight") {
      gridClass = "tp-flight-grid";
      if (meta?.no_direct_message) {
        sub = `<p class="tp-lead tp-warn">${meta.no_direct_message}</p>`;
      } else if (meta?.has_direct && meta?.fromId && meta?.toId) {
        sub = `<p class="tp-lead">${cityLabel(meta.fromId)} → ${cityLabel(meta.toId)} · шууд нислэгийн боломжтой чиглэл</p>`;
      }
      if (meta?.section_title && results.length) {
        sub += `<h4 class="tp-flight-section-title">${meta.section_title}</h4>`;
      }
      const rateNote = customerPriceNote();
      if (rateNote) sub += `<p class="tp-lead tp-muted">${rateNote}</p>`;
      cards = results.map(renderFlightCard).join("");
    } else {
      cards = results.map(renderAttractionCard).join("");
    }

    let sub = "";
    if (isHotel && meta?.cityId && !meta?.error) {
      const c = window.TRAVEL_CITIES?.getCity(meta.cityId);
      const f = meta.filters || {};
      const parts = [countryLabel(c?.country_id), window.TRAVEL_CITIES?.getCityLabel(meta.cityId)];
      if (f.area) parts.push(f.area);
      else if (f.district) parts.push(f.district);
      sub = `<p class="tp-lead">${parts.filter(Boolean).join(" → ")} · <strong>${results.length}</strong> буудал</p>`;
      if (f.keyword) sub += `<p class="tp-lead tp-filter-tag">🔎 «${f.keyword}»</p>`;
      const rateNote = customerPriceNote();
      if (rateNote) sub += `<p class="tp-lead tp-muted">${rateNote}</p>`;
    }
    if (isHotel && meta?.error === "city_not_found") {
      sub = `<p class="tp-lead tp-warn">Хот олдсонгүй. Монгол, Англи эсвэл орон нутгийн нэрээр бичнэ үү.</p>`;
    }
    if (isHotel && meta?.error === "country_mismatch") {
      sub = `<p class="tp-lead tp-warn">Сонгосон улс, хот тохирохгүй байна. Улсаа зөв сонгоно уу.</p>`;
    }
    if (isHotel && !results.length && !meta?.error) {
      sub += `<p class="tp-lead tp-warn">Энэ байршилд буудал олдсонгүй. Өөр бүс эсвэл шүүлтүүрээ өөрчилнө үү.</p>`;
    }
    if (type === "train") {
      if (meta?.fromId && meta?.toId) {
        sub = `<p class="tp-lead">${cityLabel(meta.fromId)} → ${cityLabel(meta.toId)} · эх сурвалжид тулгуурласан мэдээлэл</p>`;
        const rateNote = customerPriceNote();
        if (rateNote) sub += `<p class="tp-lead tp-muted">${rateNote}</p>`;
      }
      if (!results.length) {
        const samples = (window.TRANSPORT_ROUTES?.listRoutes?.() || []).slice(0, 4).map((k) => {
          const [f, t] = k.split("-");
          return `${cityLabel(f)}→${cityLabel(t)}`;
        }).join(", ");
        sub += `<p class="tp-lead tp-warn">Энэ чиглэлд одоогоор бүртгэл байхгүй. Жишээ: ${samples || "Эрээн→Бээжин, Хөх хот→Бээжин"}.</p>`;
      }
    }

    box.innerHTML = `
      <div class="tp-results-header">
        <h3>🔍 ${label} — ${results.length} сонголт</h3>
        ${sub}
      </div>
      <div class="${gridClass}">${cards || (type === "train" ? "" : "<p class='tp-lead'>Үр дүн олдсонгүй.</p>")}${type === "train" && !cards ? "<p class='tp-lead'>Үр дүн олдсонгүй.</p>" : ""}</div>
    `;

    (container || box).scrollIntoView({ behavior: "smooth", block: "nearest" });

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
        openBookingForm(bookType, buildHotelBookingPreset(item), BOOKING_TITLES[bookType]);
      });
    });

    if (!isHotel) box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function collectForm(panel) {
    const fd = {};
    panel?.querySelectorAll("[data-field]").forEach((el) => {
      fd[el.dataset.field] = el.value;
    });
    return fd;
  }

  function collectHotelFilters() {
    const sidebar = $("hotelFiltersSidebar");
    const fd = {};
    sidebar?.querySelectorAll("[data-filter]").forEach((el) => {
      const key = el.dataset.filter;
      if (el.type === "checkbox") fd[key] = el.checked ? "1" : "";
      else fd[key] = el.value;
    });
    const sortEl = $("hotelSortSelect");
    if (sortEl?.value) fd.sort = sortEl.value;
    return fd;
  }

  function buildHotelSearchFilters(formData, extra) {
    const f = { ...(extra || {}) };
    f.area = formData.area || f.area || "";
    f.district = f.district || formData.district || "";
    f.keyword = f.keyword || formData.keyword || "";
    f.minStars = f.minStars || formData.minStars || "";
    f.sort = f.sort || formData.sort || "recommended";
    ["nearMetro", "nearAirport", "nearAttraction", "breakfast", "freeCancellation", "familyFriendly"].forEach((k) => {
      if (f[k] === "1") f[k] = true;
    });
    if (f.nearLandmark) { /* keep */ }
    return f;
  }

  function applyMntFilters(results, filters) {
    let list = results.slice();
    const min = Number(filters.priceMinMnt || 0);
    const max = Number(filters.priceMaxMnt || 0);
    if (min > 0) list = list.filter((h) => h.final_price_mnt >= min);
    if (max > 0) list = list.filter((h) => h.final_price_mnt <= max);
    return list;
  }

  function sortHotelResults(results, sort) {
    const list = results.slice();
    if (sort === "price_asc") list.sort((a, b) => a.final_price_mnt - b.final_price_mnt);
    else if (sort === "price_desc") list.sort((a, b) => b.final_price_mnt - a.final_price_mnt);
    else if (sort === "stars_desc") list.sort((a, b) => b.stars - a.stars);
    else if (sort === "metro_asc") list.sort((a, b) => a.distance_to_metro_m - b.distance_to_metro_m);
    else if (sort === "attraction_asc") list.sort((a, b) => a.distance_to_attraction_km - b.distance_to_attraction_km);
    return list;
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
    payload.hotel_id = pendingBooking?.hotel_id || payload.hotel_id || "";
    payload.hotel_official_name = pendingBooking?.hotel_official_name || payload.hotel_official_name || "";
    payload.city_id = pendingBooking?.city_id || payload.city_id || "";
    payload.room_type = payload.room_type || pendingBooking?.room_type || "";
    payload.check_in = payload.check_in || pendingBooking?.check_in || payload.travel_date || "";
    payload.check_out = payload.check_out || pendingBooking?.check_out || "";
    payload.guest_count = payload.people_count || pendingBooking?.guest_count || 2;

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

  function runHotelSearch() {
    const panel = document.querySelector('.tp-panel[data-panel="hotel"]');
    const fd = collectForm(panel);
    const { results, meta } = mockSearch("hotel", fd);
    showMockResults("hotel", results, meta);
  }

  function initHotelFiltersUI() {
    const sidebar = $("hotelFiltersSidebar");
    const overlay = $("hotelFiltersOverlay");

    function openDrawer() {
      sidebar?.classList.add("open");
      if (overlay) overlay.style.display = "";
    }
    function closeDrawer() {
      sidebar?.classList.remove("open");
      if (overlay) overlay.style.display = "none";
    }

    $("hotelFilterOpen")?.addEventListener("click", openDrawer);
    $("hotelFiltersClose")?.addEventListener("click", closeDrawer);
    overlay?.addEventListener("click", closeDrawer);

    $("hotelApplyFilters")?.addEventListener("click", () => {
      runHotelSearch();
      closeDrawer();
    });

    $("hotelClearFilters")?.addEventListener("click", () => {
      sidebar?.querySelectorAll("[data-filter]").forEach((el) => {
        if (el.type === "checkbox") el.checked = false;
        else el.value = "";
      });
      runHotelSearch();
    });

    $("hotelSortSelect")?.addEventListener("change", () => {
      if (lastSearchMeta?.cityId) runHotelSearch();
    });

    $("hotelMapToggle")?.addEventListener("click", () => {
      const map = $("hotelMapPlaceholder");
      if (!map) return;
      const show = map.style.display === "none";
      map.style.display = show ? "" : "none";
      map.setAttribute("aria-hidden", show ? "false" : "true");
    });
  }

  function updateHotelAreaList(cityInput) {
    const cityId = window.TRAVEL_CITIES?.normalizeCity(cityInput);
    if (!cityId) return;
    const distList = $("hotelDistrictList");
    if (!distList) return;
    const districts = window.HOTELS_CATALOG?.getDistricts(cityId) || [];
    distList.innerHTML = districts.map((d) => `<option value="${d}"></option>`).join("");
  }

  function updateHotelDistrictList(cityInput) {
    updateHotelAreaList(cityInput);
  }

  function initLocationSearch() {
    const eng = window.LOCATION_ENGINE;
    if (!eng) return;
    eng.init();
    if (window.LOCATIONS_CHUNK_EXTRA?.cities?.length) {
      eng.loadChunk(window.LOCATIONS_CHUNK_EXTRA, window.LOCATIONS_CHUNK_EXTRA.tag || "extra");
    }
    window.LocationAutocomplete?.initAll();

    const countrySel = $("hotelCountrySelect");
    const cityInput = $("hotelCityInput");
    if (countrySel && cityInput) {
      countrySel.addEventListener("change", () => {
        const cid = countrySel.value;
        const hits = eng.search("", { types: ["city"], country_id: cid, limit: 1 });
        if (hits[0]?.city_id) {
          const c = eng.getCity(hits[0].city_id);
          cityInput.value = c?.name_mn || hits[0].title;
          const hidden = cityInput.parentElement?.querySelector('[data-field="city_id"]');
          if (hidden) hidden.value = hits[0].city_id;
          cityInput.dataset.resolvedCityId = hits[0].city_id;
        }
        updateHotelDistrictList(cityInput.value);
      });
    }
    cityInput?.addEventListener("change", () => updateHotelDistrictList(cityInput.value));
  }

  function initCityDatalists() {
    initLocationSearch();
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

  async function initDailyRates() {
    await window.TRAVEL_DATA?.loadDailyRates?.();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await initDailyRates();
    renderDestinations();
    renderChinaCities();
    bindServices();
    initTabs();
    initInquiryModal();
    initHotelDetailModal();
    initCityDatalists();
    initHotelFiltersUI();
    setTab("flight");

    if (location.hash === "#esim") {
      document.querySelector("#esim")?.scrollIntoView({ behavior: "smooth" });
    }
  });
})();
