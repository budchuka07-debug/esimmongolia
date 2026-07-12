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
  let lastHotelSearchParams = null;
  let hotelResultsPage = 1;
  let lastAttractionSearchParams = null;
  let attractionResultsPage = 1;
  const ATTRACTION_NOTICE = "Тасалбарын үнэ, ажиллах цагийг захиалга хийхийн өмнө дахин шалгана.";
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

    const requestMode = !!(pendingBooking?.request_mode || preset?.request_mode);
    const priceEl = $("inqPriceDisplay");
    if (priceEl && pendingBooking?.final_price_mnt) {
      priceEl.textContent = fmtMnt(pendingBooking.final_price_mnt);
    }
    const priceLabel = $("inqPriceLabel");
    if (priceLabel) priceLabel.textContent = requestMode ? "Ойролцоо үнэ (тооцоолсон)" : "Төлөх дүн";
    const reqNote = $("inqRequestNote");
    if (reqNote) {
      if (requestMode) {
        reqNote.style.display = "";
        reqNote.textContent = "Энэ нь тооцоолсон санал юм. Та хүсэлт илгээснээр манай аяллын зөвлөх тухайн хотод тохирох бодит буудлыг шалгаад үнэ, өрөөний боломжийг танд илгээнэ. Одоо төлбөр төлөхгүй.";
      } else {
        reqNote.style.display = "none";
        reqNote.textContent = "";
      }
    }
    const submitBtn = $("inquiryForm")?.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = requestMode ? "Санал авах хүсэлт илгээх" : "Үргэлжлүүлэх";

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
    if (lastMockResults.length) showResultsContainer();
    if (tab === "esim-tab") {
      document.querySelector("#esim")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  function renderDestinations() {
    const box = $("platformDestinations");
    const data = window.TRAVEL_DATA;
    if (!box || !data) return;
    box.innerHTML = data.destinations.map((d) => {
      const img = travelImg(d.img, { kind: "country", size: "card", alt: d.name });
      return `
      <a class="tp-dest-card" href="${d.href}">
        ${img}
        <div class="tp-dest-body">
          <div class="tp-dest-name">${d.flag} ${d.name}</div>
          <div class="tp-dest-sub">Маршрут + eSIM</div>
        </div>
      </a>`;
    }).join("");
  }

  function renderChinaCities() {
    const box = $("platformChinaCities");
    const data = window.TRAVEL_DATA;
    if (!box || !data) return;
    box.innerHTML = data.chinaCities.map((c) => {
      const img = travelImg(c.img, { kind: "city", size: "hero", alt: `${c.name} — ${c.cn}`, className: "tp-china-head-img" });
      return `
      <article class="tp-china-card" id="city-${c.id}">
        <div class="tp-china-head">
          ${img}
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
      </article>`;
    }).join("");

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

  const HOTEL_IMG_FALLBACK = window.TravelImages?.FALLBACK?.hotel || "/images/hotels/exterior-01.jpg";
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
    const fb = HOTEL_IMG_FALLBACK;
    const TI = window.TravelImages;
    if (TI?.resolveGallery) {
      const gal = h.gallery_image_urls?.length ? h.gallery_image_urls : h.images;
      return TI.resolveGallery(gal, fb);
    }
    if (Array.isArray(h.images) && h.images.length) return h.images;
    if (h.image) return [h.image];
    return [fb];
  }

  function hotelCover(h) {
    if (window.TravelImages?.pickCover) {
      return window.TravelImages.pickCover(h, "hotel");
    }
    return h.cover_image || h.image || HOTEL_IMG_FALLBACK;
  }

  function hashHotelIdx(id) {
    return String(id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  }

  function hotelImgFallback() {
    return HOTEL_IMG_FALLBACK;
  }

  function travelImg(url, opts) {
    const TI = window.TravelImages;
    opts = opts || {};
    const kind = opts.kind || "hotel";
    const resolved = TI?.pickCover
      ? TI.pickCover(typeof url === "object" ? url : { cover_image_url: url }, kind)
      : (url || opts.fallback || HOTEL_IMG_FALLBACK);
    if (TI?.imgTag) return TI.imgTag(resolved, { ...opts, kind });
    const src = resolved || opts.fallback || HOTEL_IMG_FALLBACK;
    return `<img class="${opts.className || ""}" src="${src}" alt="${opts.alt || ""}" loading="lazy" decoding="async">`;
  }

  function hotelImgTag(h, className) {
    const name = h.name_en || h.name || "Hotel";
    const alt = `${name} — ${cityLabel(h.city_id)}`;
    return travelImg(hotelCover(h), { className, kind: "hotel", size: "card", alt });
  }

  function hotelGalleryHtml(hotel, fb) {
    const fallback = fb || hotelImgFallback();
    const mkFig = (src, label) => {
      const img = travelImg(src, {
        kind: "hotel",
        size: "hero",
        alt: `${hotel.name_en} — ${label}`,
        className: "",
        fallback
      });
      return `<figure class="tp-hotel-gallery-item tp-hotel-gallery-lg">${img}<figcaption>${label}</figcaption></figure>`;
    };
    if (hotel.images && typeof hotel.images === "object" && !Array.isArray(hotel.images)) {
      return Object.entries(HOTEL_IMAGE_LABELS).map(([key, label]) =>
        mkFig(hotel.images[key] || fallback, label)
      ).join("");
    }
    return hotelImagesList(hotel).map((src, i) => {
      const label = Object.values(HOTEL_IMAGE_LABELS)[i] || "Зураг";
      return mkFig(src, label);
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

  function enrichTransportItem(item) {
    if (item.transport_type === "bus") {
      return priceTransportItem(item);
    }
    if (item.transport_type === "train" && window.TRAIN_CAR_CLASSES?.buildPricedOptions) {
      const car_class_options = window.TRAIN_CAR_CLASSES.buildPricedOptions(item, (p) =>
        priceItem({ ...item, original_price: p.original_price, currency: p.currency || "CNY" })
      );
      const cheapest = car_class_options.reduce(
        (min, o) => (!min || o.final_price_mnt < min.final_price_mnt ? o : min),
        null
      );
      return {
        ...item,
        car_class_options,
        final_price_mnt: cheapest?.final_price_mnt || priceItem(item).final_price_mnt,
        internal_supplier_reference: {
          ...(item.internal_supplier_reference || {}),
          train_mode: item.train_mode || window.TRAIN_CAR_CLASSES.inferMode(item),
          car_classes: car_class_options.map((o) => ({
            id: o.class_id,
            label: o.label_mn,
            final_price_mnt: o.final_price_mnt
          }))
        }
      };
    }
    return priceTransportItem(item);
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

  const SEARCH_EMPTY_MSG =
    "Одоогоор энэ чиглэлд мэдээлэл олдсонгүй. Та өөр огноо эсвэл өөр хот сонгоод дахин хайна уу.";

  function searchEmptyHtml() {
    return `
      <div class="tp-search-empty">
        <p class="tp-lead tp-warn">${SEARCH_EMPTY_MSG}</p>
        <button type="button" class="tp-btn primary" data-action="consult-advisor">Манай аяллын зөвлөхөөс асуух</button>
      </div>`;
  }

  function bindConsultAdvisor(btn) {
    btn?.addEventListener("click", () => {
      if (window.TravelAssistant?.openAiChat) {
        window.TravelAssistant.openAiChat("Нислэг эсвэл тээврийн маршрутын талаар зөвлөгөө өгнө үү.");
      } else {
        window.TravelAssistant?.open?.("home");
      }
    });
  }

  function openAiHotelSuggestion(cityInput, filters) {
    const gen = window.HOTEL_FALLBACK?.aiSuggest;
    const box = $("mockResults");
    if (!gen) {
      window.TravelAssistant?.openAiChat?.(`${cityInput || ""} хотод санал болгох бүс, буудлын талаар зөвлөгөө өгнө үү.`);
      return;
    }
    const s = gen(cityInput, filters || {});
    const areaList = s.areas.map((a) =>
      `<li><strong>${a.area}</strong> — ${a.who}${a.metro ? " · метро ойр" : ""}</li>`
    ).join("");
    const panel = document.createElement("div");
    panel.className = "tp-ai-hotel-suggest";
    panel.innerHTML = `
      <h4>🤖 ${s.cityMn} — байрлах зөвлөмж</h4>
      <p class="tp-ai-suggest-lead">Санал болгох бүсүүд:</p>
      <ul class="tp-ai-suggest-areas">${areaList}</ul>
      <p class="tp-ai-suggest-budget">💰 ${s.budget.nights} шөнийн төсөв: <strong>${fmtMnt(s.budget.low)} – ${fmtMnt(s.budget.high)}</strong></p>
      <p class="tp-ai-suggest-fit">${s.suits}</p>
      <div class="tp-ai-suggest-actions">
        <button type="button" class="tp-btn primary" data-action="ai-hotel-admin">Зөвлөхөөр бодит буудал шалгуулах</button>
      </div>`;
    const header = box?.querySelector(".tp-results-header");
    if (header) header.insertAdjacentElement("afterend", panel);
    else box?.prepend(panel);
    panel.querySelector("[data-action=ai-hotel-admin]")?.addEventListener("click", () => {
      window.TravelAssistant?.openAiChat?.(
        `${s.cityMn} хотод ${s.budget.nights} шөнө байрлах бодит буудлыг шалгуулмаар байна. Төсөв: ${fmtMnt(s.budget.low)}–${fmtMnt(s.budget.high)}.`
      );
    });
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function normalizeSearchParams(type, fd) {
    const params = { ...fd };
    const norm = window.TRAVEL_CITIES?.normalizeCity;
    if (!norm) return params;
    if (type === "flight" || type === "train") {
      if (!params.from_city_id && params.from) params.from_city_id = norm(params.from) || "";
      if (!params.city_id && params.city) params.city_id = norm(params.city) || "";
    } else if (type === "hotel" || type === "attraction") {
      if (!params.city_id && params.city) params.city_id = norm(params.city) || "";
      if (params.city_id) {
        const c = window.TRAVEL_CITIES?.getCity(params.city_id);
        if (c?.name_en) params.city = c.name_en;
      }
      if (params.country && !params.country_id) params.country_id = params.country;
      if (type === "attraction") {
        if (params.attraction && !params.keyword) params.keyword = params.attraction;
        if (params.people && !params.visitors) params.visitors = params.people;
        const sortEl = $("attractionSortSelect");
        if (sortEl?.value) params.sort = sortEl.value;
        params.pageSize = 12;
        params.minTarget = 60;
        Object.assign(params, collectAttractionFilters());
      }
      if (type === "hotel" && params.country && !params.country_id) {
        params.country_id = params.country;
      }
    }
    return params;
  }

  function applyResultPricing(items) {
    return (items || []).map((item) => {
      if (item.final_price_mnt != null && item.final_price_mnt > 0) return item;
      return priceItem(item);
    });
  }

  function showResultsContainer() {
    const container = $("resultsContainer");
    if (container) container.style.display = "";
  }

  const CABIN_LABELS = {
    economy: "Энгийн",
    premium_economy: "Дунд",
    business: "Бизнес"
  };
  const CABIN_MULTIPLIER = { economy: 1, premium_economy: 1.4, business: 2.2 };

  function applyCabin(items, cabin) {
    const mult = CABIN_MULTIPLIER[cabin] || 1;
    if (mult === 1) return items;
    return (items || []).map((f) => ({
      ...f,
      cabin,
      final_price_mnt: Math.round((f.final_price_mnt * mult) / 1000) * 1000
    }));
  }

  async function fetchOneWayFlights(fromParam, toParam, searchParams) {
    const params = { ...searchParams, from: fromParam, city: toParam };
    // Only pass matching city ids; drop stale ones when swapping direction.
    if (fromParam !== searchParams.from) delete params.from_city_id;
    if (toParam !== searchParams.city) delete params.city_id;
    let payload = await apiSearch("flight", params);
    const apiEmpty = !payload.results?.length || payload.meta?.error;
    if (apiEmpty) {
      const fallback = window.fallbackFlights || window.MOCK_SEARCH?.flights;
      if (fallback) {
        const fb = fallback(fromParam, toParam, params);
        if (fb?.results?.length) {
          payload = { results: applyResultPricing(fb.results), meta: { ...(fb.meta || {}), source: "fallback" } };
        }
      }
    } else {
      payload.results = applyResultPricing(payload.results);
    }
    return payload;
  }

  function parseDurationMin(dur) {
    const s = String(dur || "");
    const h = /(\d+)\s*ц/.exec(s);
    const m = /(\d+)\s*мин/.exec(s);
    return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
  }

  function fmtDurationMin(min) {
    if (!min) return "";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h ? `${h}ц ` : ""}${m ? `${m}мин` : ""}`.trim();
  }

  function buildRoundTripResults(outbound, inbound, searchParams) {
    const pairs = [];
    const count = Math.min(outbound.length, inbound.length) || outbound.length;
    for (let i = 0; i < count; i++) {
      const out = outbound[i];
      const back = inbound[i] || inbound[inbound.length - 1] || outbound[i];
      if (!out || !back) continue;
      const total = Number(out.final_price_mnt || 0) + Number(back.final_price_mnt || 0);
      const totalMin = parseDurationMin(out.duration) + parseDurationMin(back.duration);
      pairs.push({
        id: `rt-${out.id}-${back.id}`,
        type: "flight_roundtrip",
        roundtrip: true,
        outbound: out,
        inbound: back,
        depart_date: searchParams.date || null,
        return_date: searchParams.return_date || null,
        baggage: out.baggage || back.baggage || "",
        cabin: searchParams.cabin || "economy",
        total_duration: fmtDurationMin(totalMin),
        data_confidence: out.data_confidence || back.data_confidence || "estimated",
        final_price_mnt: Math.round(total / 1000) * 1000
      });
    }
    return pairs;
  }

  async function fetchFlightResults(searchParams) {
    const cabin = searchParams.cabin || "economy";
    const isReturn = searchParams.trip_type === "return";

    const outPayload = await fetchOneWayFlights(searchParams.from, searchParams.city, searchParams);
    outPayload.results = applyCabin(outPayload.results || [], cabin);

    if (!isReturn) {
      return { results: outPayload.results, meta: { ...(outPayload.meta || {}), trip_type: "oneway", cabin } };
    }

    const inPayload = await fetchOneWayFlights(searchParams.city, searchParams.from, searchParams);
    inPayload.results = applyCabin(inPayload.results || [], cabin);

    if (!outPayload.results.length || !inPayload.results.length) {
      return { results: outPayload.results, meta: { ...(outPayload.meta || {}), trip_type: "return_partial", cabin } };
    }

    const results = buildRoundTripResults(outPayload.results, inPayload.results, searchParams);
    return {
      results,
      meta: {
        ...(outPayload.meta || {}),
        trip_type: "return",
        cabin,
        return_meta: inPayload.meta || {}
      }
    };
  }

  async function fetchAttractionResults(searchParams, page = 1) {
    const payload = await apiSearch("attraction", { ...searchParams, page, pageSize: 12, minTarget: 60 });
    return {
      results: payload.results || [],
      meta: {
        ...(payload.meta || {}),
        source: payload.meta?.source || "attraction-catalog",
        real_count: payload.meta?.real_count ?? 0,
        mock_count: payload.meta?.mock_count ?? 0,
        total: payload.meta?.total ?? (payload.results || []).length
      }
    };
  }

  async function loadMoreAttractions() {
    if (!lastAttractionSearchParams || !lastSearchMeta?.hasMore) return;
    const btn = $("attractionLoadMore");
    if (btn) { btn.disabled = true; btn.textContent = "Ачаалж байна…"; }
    try {
      attractionResultsPage += 1;
      const payload = await fetchAttractionResults(lastAttractionSearchParams, attractionResultsPage);
      lastMockResults = [...lastMockResults, ...(payload.results || [])];
      lastSearchMeta = { ...lastSearchMeta, ...(payload.meta || {}), hasMore: payload.meta?.hasMore };
      renderAttractionResults(lastMockResults, lastSearchMeta);
    } catch (err) {
      console.error("[TravelBooking] loadMoreAttractions", err);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Илүү олон үзэх"; }
    }
  }

  function renderAttractionResults(results, meta) {
    showMockResults("attraction", results, meta);
  }

  async function fetchHotelResults(searchParams, page = 1) {
    const pageSize = Number(searchParams.pageSize) || 48;
    const payload = await apiSearch("hotel", { ...searchParams, page, pageSize });
    return {
      results: payload.results || [],
      meta: {
        ...(payload.meta || {}),
        source: payload.meta?.source || "hybrid"
      }
    };
  }

  async function loadMoreHotels() {
    if (!lastHotelSearchParams || !lastSearchMeta?.hasMore) return;
    const btn = $("hotelLoadMore");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Ачаалж байна…";
    }
    try {
      hotelResultsPage += 1;
      const payload = await fetchHotelResults(lastHotelSearchParams, hotelResultsPage);
      lastMockResults = [...lastMockResults, ...(payload.results || [])];
      lastSearchMeta = { ...lastSearchMeta, ...(payload.meta || {}), hasMore: payload.meta?.hasMore };
      showMockResults("hotel", lastMockResults, lastSearchMeta);
    } catch (err) {
      console.error("[TravelBooking] loadMoreHotels", err);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Илүү олон үзэх";
      }
    }
  }

  function renderFlightResults(results, meta) {
    showResultsContainer();
    showMockResults("flight", results, meta);
  }

  function renderAttractionResultsView(results, meta) {
    showResultsContainer();
    showMockResults("attraction", results, meta);
  }

  function renderTransportResults(results, meta) {
    showResultsContainer();
    showMockResults("train", results, meta);
  }

  function renderHotelResults(results, meta) {
    showResultsContainer();
    showMockResults("hotel", results, meta);
  }

  async function fetchTransportResults(searchParams) {
    let payload = await apiSearch("train", searchParams);
    const apiEmpty = !payload.results?.length || payload.meta?.error;
    if (apiEmpty) {
      const fallback = window.fallbackTransportRoutes || window.MOCK_SEARCH?.transport;
      if (fallback) {
        const fb = fallback(searchParams.from, searchParams.city);
        if (fb?.results?.length) {
          payload = {
            results: (fb.results || []).map(enrichTransportItem),
            meta: {
              fromId: fb.fromId,
              toId: fb.toId,
              routeKey: fb.routeKey,
              source: "fallback"
            }
          };
        }
      }
    } else if (payload.results?.length) {
      payload.results = payload.results.map(enrichTransportItem);
    }
    return payload;
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
      const car = item.car_class_label || item.bookingItem?.car_class_label;
      const carPart = car ? ` · ${car}` : "";
      return `${mode}: ${item.from_city}→${item.to_city}${carPart}${dep ? ` (${dep})` : ""}`;
    }
    if (item.type === "train") return `${item.from_city}→${item.to_city} ${item.depart_time || ""}`.trim();
    if (item.type === "flight") return `${item.airline} ${item.from_city}→${item.to_city} ${item.depart_time}`;
    return item.title || item.name_mn || item.name || "Сонголт";
  }

  async function apiSearch(type, formData) {
    if (window.TravelSearch?.apiSearch) {
      return window.TravelSearch.apiSearch(type, formData);
    }
    return { results: [], meta: { error: "catalog_not_ready" } };
  }

  async function runSearch(type, formData) {
    const searchParams = normalizeSearchParams(type, formData);
    const box = $("mockResults");
    if (box) {
      showResultsContainer();
      box.style.display = "block";
      box.innerHTML = `<p class="tp-lead">🔍 Хайж байна...</p>`;
    }
    try {
      if (type === "flight") {
        console.log("Flight search clicked", searchParams);
        const payload = await fetchFlightResults(searchParams);
        console.log("Flight results", payload.results);
        renderFlightResults(payload.results || [], payload.meta || {});
        return;
      }
      if (type === "train") {
        console.log("Transport search clicked", searchParams);
        const payload = await fetchTransportResults(searchParams);
        console.log("Transport results", payload.results);
        renderTransportResults(payload.results || [], payload.meta || {});
        return;
      }
      if (type === "attraction") {
        console.log("Attraction search clicked", searchParams);
        attractionResultsPage = 1;
        lastAttractionSearchParams = searchParams;
        window.AttractionDestinationSelect?.syncUrlParams?.();
        const payload = await fetchAttractionResults(searchParams, 1);
        console.log("Attraction results", payload.results, payload.meta);
        renderAttractionResultsView(payload.results || [], payload.meta || {});
        return;
      }
      if (type === "hotel") {
        console.log("Hotel search clicked", searchParams);
        hotelResultsPage = 1;
        lastHotelSearchParams = searchParams;
        window.HotelDestinationSelect?.syncUrlParams?.();
        const payload = await fetchHotelResults(searchParams, 1);
        console.log("Hotel results", payload.results, payload.meta);
        renderHotelResults(payload.results || [], payload.meta || {});
        return;
      }

      const payload = await apiSearch(type, searchParams);
      showMockResults(type, payload.results || [], payload.meta || {});
    } catch (err) {
      console.error("[TravelBooking]", err);
      if (type === "flight") {
        const fallback = window.fallbackFlights || window.MOCK_SEARCH?.flights;
        const fb = fallback?.(searchParams.from, searchParams.city, searchParams);
        if (fb?.results?.length) {
          renderFlightResults(applyResultPricing(fb.results), { ...(fb.meta || {}), source: "fallback" });
          return;
        }
        renderFlightResults([], { error: "api_error" });
        return;
      }
      if (type === "train") {
        const fallback = window.fallbackTransportRoutes || window.MOCK_SEARCH?.transport;
        const fb = fallback?.(searchParams.from, searchParams.city);
        if (fb?.results?.length) {
          renderTransportResults((fb.results || []).map(enrichTransportItem), {
            fromId: fb.fromId,
            toId: fb.toId,
            source: "fallback"
          });
          return;
        }
        renderTransportResults([], { error: "api_error" });
        return;
      }
      if (type === "hotel") {
        const gen = window.fallbackHotels || window.MOCK_SEARCH?.estimatedHotels;
        const estimated = gen ? gen(searchParams.city, searchParams) : [];
        if (estimated.length) {
          renderHotelResults(applyMntFilters(estimated, collectHotelFilters()), {
            source: "estimated",
            estimated: true,
            cityInput: searchParams.city,
            note: "Одоогоор энэ хотын буудлууд манай сан дээр бүрэн ороогүй байна. Доорх нь боломжит санал бөгөөд захиалга хийх үед бодит үнэ, өрөөний боломжийг дахин шалгана."
          });
          return;
        }
        renderHotelResults([], { error: "api_error" });
        return;
      }
      if (type === "attraction") {
        renderAttractionResultsView([], { error: "api_error", subtitle: "Үзвэрийн хайлт түр амжилтгүй. Дахин оролдоно уу." });
        return;
      }
      showMockResults(type, [], { error: "api_error" });
    }
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
    if (h.distance_to_center_km != null && h.distance_to_center_km < 25) {
      parts.push(`🏙 Төвөөс ${h.distance_to_center_km}км`);
    }
    const lm = (h.nearby_landmarks || [])[0];
    if (lm && h.distance_to_attraction_km) {
      parts.push(`📍 ${lm} ${h.distance_to_attraction_km}км`);
    }
    return parts.join(" · ");
  }

  function renderHotelCard(h) {
    const isMock = h.is_mock === true || h.source === "mock" || h.source === "ai_mock";
    const badges = (h.facilities || h.amenities || h.badges || []).slice(0, 3).map((b) => `<span class="tp-badge">${b}</span>`).join("");
    const dist = formatHotelDist(h);
    const areaLine = [h.area_name || h.district].filter(Boolean).join(" · ");
    const cityMn = h.city_name_mn || h.city || cityLabel(h.city_id);
    const countryMn = h.country_name_mn || h.country || countryLabel(h.country_id);
    const displayName = h.name_en || h.name || "Буудал";
    const sourceBadge = isMock
      ? ""
      : '<span class="tp-badge tp-badge-verified">✓ Баталгаажсан</span>';
    const desc = h.description_mn || h.description
      ? `<div class="tp-hotel-desc-mn">${h.description_mn || h.description}</div>`
      : "";
    const note = isMock
      ? `<p class="tp-hotel-est-note">${h.needs_check_message || "Үнэ болон өрөөний боломж захиалга баталгаажуулах үед шалгагдана."}</p>`
      : "";
    const bookBtn = isMock
      ? `<button type="button" class="tp-btn-book" data-book-type="hotel_request" data-item-id="${h.id}">Санал авах</button>`
      : `<button type="button" class="tp-btn-book" data-book-type="hotel" data-item-id="${h.id}">Захиалах</button>`;
    const detailBtn = isMock
      ? ""
      : `<button type="button" class="tp-btn tp-btn-detail" data-detail-type="hotel" data-item-id="${h.id}">Дэлгэрэнгүй</button>`;
    const imgSrc = h.image_url || h.cover_image || h.image;
    const imgHtml = imgSrc
      ? `<img class="tp-hotel-img" src="${imgSrc}" alt="${displayName}" loading="lazy" onerror="this.onerror=null;this.classList.add('tp-hotel-img-est')">`
      : `<div class="tp-hotel-img tp-hotel-img-est" aria-hidden="true"><span>${"★".repeat(h.stars || 3)}</span></div>`;
    return `
      <article class="tp-hotel-card${isMock ? " tp-hotel-card-est" : ""}" data-item-id="${h.id}" data-lat="${h.latitude || 0}" data-lng="${h.longitude || 0}">
        ${imgHtml}
        <div class="tp-hotel-body">
          ${sourceBadge ? `<div class="tp-hotel-badges tp-hotel-source-row">${sourceBadge}</div>` : ""}
          <div class="tp-hotel-stars">${stars(h.stars)}</div>
          <h4 class="tp-hotel-name">${displayName}</h4>
          <div class="tp-hotel-area">${countryMn} • ${cityMn}${areaLine ? ` • ${areaLine}` : ""}</div>
          ${dist ? `<div class="tp-hotel-dist">${dist}</div>` : ""}
          ${desc}
          <div class="tp-hotel-badges">${badges}${h.breakfast ? '<span class="tp-badge">☕ Өглөөний цай</span>' : ""}${h.free_cancellation ? '<span class="tp-badge">✓ Цуцлах</span>' : ""}${h.family_friendly ? '<span class="tp-badge">👨‍👩‍👧 Гэр бүл</span>' : ""}</div>
          ${note}
          <div class="tp-card-price-row">
            <div>
              <div class="tp-price-final">${fmtMnt(h.price_per_night ?? h.final_price_mnt)}</div>
              ${h.nights ? `<div class="tp-price-note">${h.nights} шөнө · ${customerPriceNote()}</div>` : `<div class="tp-price-note">${customerPriceNote()}</div>`}
            </div>
            <div class="tp-card-actions">
              ${detailBtn}
              ${bookBtn}
            </div>
          </div>
        </div>
      </article>`;
  }

  function buildHotelRequestPreset(hotel) {
    const label = `${hotel.name_en || hotel.name} — ${hotel.city_name_mn || hotel.city || cityLabel(hotel.city_id)}${hotel.area_name ? `, ${hotel.area_name}` : ""}`;
    return {
      selectedItem: label,
      city: hotel.city_name_mn || hotel.city || cityLabel(hotel.city_id),
      country: hotel.country_id || "",
      city_id: hotel.city_id,
      request_mode: true,
      bookingItem: {
        final_price_mnt: hotel.price_per_night ?? hotel.final_price_mnt,
        selected_item: label,
        service_type: "hotel_search_request",
        request_mode: true,
        data_source: hotel.source === "ai_mock" ? "ai_mock" : "estimated_ai",
        city_id: hotel.city_id,
        city_name: hotel.city_name_mn || hotel.city || cityLabel(hotel.city_id),
        area_name: hotel.area_name || hotel.district || "",
        stars: hotel.stars,
        estimated_price_mnt: hotel.price_per_night ?? hotel.final_price_mnt
      }
    };
  }

  function buildTransportBookingPreset(item, classOpt) {
    const car = classOpt || item.car_class_options?.[0];
    const label = car
      ? `${item.from_city} → ${item.to_city} · ${car.label_mn}`
      : itemLabel(item);
    return {
      selectedItem: label,
      city: cityLabel(item.to_city_id),
      country: item.country_id || "china",
      city_id: item.to_city_id,
      from_city_id: item.from_city_id,
      bookingItem: {
        final_price_mnt: car?.final_price_mnt || item.final_price_mnt,
        selected_item: label,
        supplier_internal: item.internal_supplier_reference,
        transport_id: item.id,
        car_class_id: car?.class_id || null,
        car_class_label: car?.label_mn || null,
        from_city_id: item.from_city_id,
        to_city_id: item.to_city_id
      }
    };
  }

  function renderTrainClassOptions(t) {
    const opts = t.car_class_options || [];
    if (!opts.length) return "";
    const cards = opts.map((c) => `
      <div class="tp-train-class-card" data-item-id="${t.id}" data-class-id="${c.class_id}">
        <div class="tp-train-class-head">
          <span class="tp-train-class-icon">${c.icon}</span>
          <div>
            <div class="tp-train-class-name">${c.label_mn}</div>
            <div class="tp-train-class-short">${c.short_mn}</div>
          </div>
          <div class="tp-train-class-price">${fmtMnt(c.final_price_mnt)}</div>
        </div>
        <div class="tp-train-class-actions">
          <button type="button" class="tp-btn tp-btn-detail" data-detail-type="train-class" data-item-id="${t.id}" data-class-id="${c.class_id}">Дэлгэрэнгүй</button>
          <button type="button" class="tp-btn-book" data-book-type="train" data-item-id="${t.id}" data-class-id="${c.class_id}">Захиалах</button>
        </div>
      </div>`).join("");
    return `
      <div class="tp-train-class-section">
        <h5 class="tp-train-class-title">Зэрэглэл сонгох</h5>
        <div class="tp-train-class-grid">${cards}</div>
      </div>`;
  }

  function openTrainClassDetail(transport, classOpt) {
    const modal = $("hotelDetailModal");
    const bd = $("hotelDetailModalBd");
    const body = $("hotelDetailBody");
    if (!modal || !bd || !body || !transport || !classOpt) return;
    const tcc = window.TRAIN_CAR_CLASSES;
    const svg = tcc?.svgIllustration?.(classOpt.class_id) || "";
    const tags = (tcc?.suitabilityTags?.(classOpt) || []).map((tag) =>
      `<span class="tp-badge">${tag}</span>`
    ).join("");

    body.innerHTML = `
      <div class="tp-train-class-detail">
        <div class="tp-train-class-detail-hero">${svg}</div>
        <h3>${classOpt.icon} ${classOpt.label_mn}</h3>
        <p class="tp-train-class-detail-route">🚄 ${transport.from_city} → ${transport.to_city}${transport.transfer_city ? ` · Дамжих: ${transport.transfer_city}` : ""}</p>
        <p class="tp-train-class-detail-desc">${classOpt.detail_mn}</p>
        <div class="tp-train-class-detail-block">
          <h4>Хэнд тохиромжтой вэ?</h4>
          <p>${classOpt.suitable_mn}</p>
        </div>
        <div class="tp-train-class-detail-tags">${tags}</div>
        <div class="tp-train-class-detail-price">
          <div class="tp-price-final">${fmtMnt(classOpt.final_price_mnt)}</div>
        </div>
        <button type="button" class="tp-btn primary tp-train-class-detail-book" data-item-id="${transport.id}" data-class-id="${classOpt.class_id}">Захиалах</button>
      </div>`;

    body.querySelector(".tp-train-class-detail-book")?.addEventListener("click", () => {
      closeHotelDetail();
      openBookingForm("train", buildTransportBookingPreset(transport, classOpt), BOOKING_TITLES.train);
    });

    modal.style.display = "block";
    bd.style.display = "block";
  }

  function renderTrainCardContent(t) {
    const dep = t.departure_time
      ? `<div class="tp-train-time">${t.departure_time}</div>`
      : `<div class="tp-train-time tp-train-time-muted">${t.departure_note || "—"}</div>`;
    const arr = t.arrival_time
      ? `<div class="tp-train-time">${t.arrival_time}</div>`
      : `<div class="tp-train-time tp-train-time-muted">—</div>`;
    const dur = t.duration_note ? `${t.duration} (${t.duration_note})` : t.duration;
    const transfer = t.transfer_required && t.transfer_city
      ? `<div class="tp-transport-transfer">Дамжих: <strong>${t.transfer_city}</strong></div>`
      : "";
    const warn = t.confidence !== "verified" && t.needs_check_message
      ? `<p class="tp-transport-warn">⚠️ ${t.needs_check_message}</p>`
      : "";
    const modeLabel = window.TRAIN_CAR_CLASSES?.inferMode(t) === "regular"
      ? "Энгийн / шөнийн галт тэрэг"
      : (window.TRAIN_CAR_CLASSES?.inferMode(t) === "mixed"
        ? "Дамжин өндөр хурдны + энгийн"
        : "Өндөр хурдны галт тэрэг");

    return `
      <article class="tp-train-card tp-transport-card tp-train-card-expanded" data-item-id="${t.id}">
        <div class="tp-transport-badges">${transportTypeBadge(t)}${transportRouteBadge(t)}</div>
        <h4 class="tp-train-route-title">🚄 ${t.from_city} → ${t.to_city}</h4>
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
        <p class="tp-train-mode-label">${modeLabel}</p>
        ${t.notes_mn ? `<p class="tp-transport-note">${t.notes_mn}</p>` : ""}
        ${warn}
        ${renderTrainClassOptions(t)}
      </article>`;
  }

  function renderBusCardContent(t) {
    const dep = t.departure_time
      ? `<div class="tp-train-time">${t.departure_time}</div>`
      : `<div class="tp-train-time tp-train-time-muted">${t.departure_note || "—"}</div>`;
    const arr = t.arrival_time
      ? `<div class="tp-train-time">${t.arrival_time}</div>`
      : `<div class="tp-train-time tp-train-time-muted">—</div>`;
    const dur = t.duration_note ? `${t.duration} (${t.duration_note})` : t.duration;
    const warn = t.confidence !== "verified" && t.needs_check_message
      ? `<p class="tp-transport-warn">⚠️ ${t.needs_check_message}</p>`
      : "";

    return `
      <article class="tp-train-card tp-transport-card" data-item-id="${t.id}">
        <div class="tp-transport-badges">${transportTypeBadge(t)}</div>
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
        ${t.notes_mn ? `<p class="tp-transport-note">${t.notes_mn}</p>` : ""}
        ${warn}
        <div class="tp-card-price-row">
          <div>
            <div class="tp-price-final">${fmtMnt(t.final_price_mnt)}</div>
          </div>
          <button type="button" class="tp-btn-book" data-book-type="train" data-item-id="${t.id}">Захиалах</button>
        </div>
      </article>`;
  }

  function renderTransportCard(item) {
    if (!item) return "";
    if (item.transport_type === "bus") return renderBusCardContent(item);
    if (item.transport_type === "train") return renderTrainCardContent(item);
    return renderTrainCardContent(item);
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

  function flightLegHtml(f, label) {
    return `
      <div class="tp-rt-leg">
        <div class="tp-rt-leg-head">
          <span class="tp-rt-leg-label">${label}</span>
          <span class="tp-rt-leg-airline">✈️ ${f.airline}</span>
        </div>
        <div class="tp-train-route">
          <div class="tp-train-city">
            <div class="tp-train-time">${f.depart_time}</div>
            <div class="tp-train-place">${f.depart_airport || ""}</div>
            <div class="tp-flight-sub">${f.from_city}</div>
          </div>
          <div class="tp-train-mid">
            <div class="tp-train-dur">${f.duration}</div>
            <div class="tp-train-line"></div>
          </div>
          <div class="tp-train-city align-right">
            <div class="tp-train-time">${f.arrive_time}</div>
            <div class="tp-train-place">${f.arrive_airport || ""}</div>
            <div class="tp-flight-sub">${f.to_city}</div>
          </div>
        </div>
        ${!f.is_direct && f.transfer_city ? `<div class="tp-transport-transfer">🔀 Дамжих: <strong>${f.transfer_city}</strong></div>` : ""}
      </div>`;
  }

  function renderRoundTripCard(rt) {
    const out = rt.outbound;
    const back = rt.inbound;
    const cabinLabel = CABIN_LABELS[rt.cabin] || "Энгийн";
    const outLabel = `Явах${rt.depart_date ? ` · ${rt.depart_date}` : ""}`;
    const backLabel = `Ирэх${rt.return_date ? ` · ${rt.return_date}` : ""}`;
    return `
      <article class="tp-flight-card tp-rt-card" data-item-id="${rt.id}">
        <div class="tp-transport-badges">
          <span class="tp-badge tp-badge-direct">🔁 Хоёр талдаа</span>
          <span class="tp-badge muted">${cabinLabel}</span>
        </div>
        ${flightLegHtml(out, outLabel)}
        <div class="tp-rt-divider"></div>
        ${flightLegHtml(back, backLabel)}
        <div class="tp-train-meta">
          ${rt.total_duration ? `<span class="tp-badge">⏱ Нийт ${rt.total_duration}</span>` : ""}
          ${rt.baggage ? `<span class="tp-badge">🧳 ${rt.baggage}</span>` : ""}
        </div>
        <div class="tp-card-price-row">
          <div>
            <div class="tp-rt-total-label">Нийт (2 талдаа)</div>
            <div class="tp-price-final">${fmtMnt(rt.final_price_mnt)}</div>
            <div class="tp-price-note">${customerPriceNote()}</div>
          </div>
          <button type="button" class="tp-btn-book" data-book-type="flight" data-item-id="${rt.id}">Захиалах</button>
        </div>
      </article>`;
  }

  function buildFlightBookingPreset(item) {
    let label;
    let cityId;
    if (item.type === "flight_roundtrip") {
      label = `${item.outbound.from_city} ⇄ ${item.outbound.to_city} (2 талдаа)`;
      cityId = item.outbound.to_city_id;
    } else {
      label = itemLabel(item);
      cityId = item.to_city_id;
    }
    return {
      selectedItem: label,
      city: cityLabel(cityId),
      country: item.country_id || "",
      city_id: cityId,
      bookingItem: {
        final_price_mnt: item.final_price_mnt,
        selected_item: label,
        service_type: "flight",
        trip_type: item.roundtrip ? "return" : "oneway",
        cabin: item.cabin || "economy",
        from_city_id: item.outbound?.from_city_id || item.from_city_id,
        to_city_id: cityId,
        supplier_internal: item.internal_supplier_reference || null
      }
    };
  }

  function collectAttractionFilters() {
    return window.AttractionModule?.collectFilters?.() || {};
  }

  function categoryLabelMn(cat) {
    return window.AttractionCategories?.categoryLabelMn?.(cat) || cat || "";
  }

  function buildAttractionBookingPreset(item, visitors) {
    const cityId = item.city_id || lastAttractionSearchParams?.city_id || "";
    return {
      service_type: "attraction",
      city_id: cityId,
      selected_item: item.name_mn || item.name,
      people_count: visitors || lastAttractionSearchParams?.visitors || 2,
      travel_date: lastAttractionSearchParams?.visit_date || "",
      budget_mnt: item.final_price_mnt || item.estimated_price || 0,
      bookingItem: {
        final_price_mnt: item.final_price_mnt || item.estimated_price || 0,
        selected_item: item.name_mn || item.name,
        service_type: "attraction",
        city_id: cityId
      }
    };
  }

  function openAttractionDetail(item) {
    window.AttractionModule?.openDetail?.(item, lastMockResults);
  }

  function renderAttractionCard(a) {
    return window.AttractionModule?.renderCard?.(a) || "";
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

  function setAttractionResultsLayout(isAttraction) {
    const container = $("resultsContainer");
    const toolbar = $("attractionToolbar");
    const hotelToolbar = $("hotelToolbar");
    const hotelSidebar = $("hotelFiltersSidebar");
    const attrSidebar = $("attractionFiltersSidebar");
    if (container) {
      container.style.display = "";
      container.classList.toggle("tp-attraction-layout", isAttraction);
      container.classList.toggle("tp-hotel-layout", false);
    }
    syncHomeSearchShell();
    if (toolbar) toolbar.style.display = isAttraction ? "" : "none";
    if (hotelToolbar) hotelToolbar.style.display = "none";
    if (hotelSidebar) {
      hotelSidebar.style.display = isAttraction ? "none" : "";
      hotelSidebar.classList.remove("tp-hotel-filters-visible", "open");
    }
    if (attrSidebar) {
      attrSidebar.style.display = isAttraction ? "" : "none";
      attrSidebar.classList.toggle("tp-hotel-filters-visible", isAttraction);
    }
    if (!isAttraction) {
      const map = $("attractionMapPlaceholder");
      if (map) map.style.display = "none";
      window.AttractionModule?.destroyMap?.();
    }
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
    const attrToolbar = $("attractionToolbar");
    if (attrToolbar) attrToolbar.style.display = "none";
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
    const isAttraction = type === "attraction";

    if (isAttraction) setAttractionResultsLayout(true);
    else setHotelResultsLayout(isHotel);
    box.style.display = "block";

    let gridClass = "tp-results-grid";
    let cards = "";
    let sub = "";
    if (isHotel) {
      gridClass = "tp-hotel-grid";
      cards = results.map(renderHotelCard).join("");
      renderMapPins(results);
    } else if (type === "train") {
      gridClass = "tp-transport-results";
      cards = renderTransportSections(results) || "";
    } else if (type === "flight") {
      const isReturn = meta?.trip_type === "return";
      gridClass = isReturn ? "tp-flight-grid tp-rt-grid" : "tp-flight-grid";
      if (isReturn && meta?.fromId && meta?.toId) {
        sub = `<p class="tp-lead">🔁 ${cityLabel(meta.fromId)} ⇄ ${cityLabel(meta.toId)} · хоёр талын нислэг</p>`;
      } else if (meta?.trip_type === "return_partial") {
        sub = `<p class="tp-lead tp-warn">Буцах нислэгийн мэдээлэл олдсонгүй тул зөвхөн явах нислэгийг харууллаа. Хоёр талын захиалгыг зөвлөхөөр баталгаажуулна уу.</p>`;
      } else if (meta?.no_direct_message) {
        sub = `<p class="tp-lead tp-warn">${meta.no_direct_message}</p>`;
      } else if (meta?.has_direct && meta?.fromId && meta?.toId) {
        sub = `<p class="tp-lead">${cityLabel(meta.fromId)} → ${cityLabel(meta.toId)} · шууд нислэгийн боломжтой чиглэл</p>`;
      }
      if (meta?.section_title && results.length && !isReturn) {
        sub += `<h4 class="tp-flight-section-title">${meta.section_title}</h4>`;
      }
      const rateNote = customerPriceNote();
      if (rateNote) sub += `<p class="tp-lead tp-muted">${rateNote}</p>`;
      cards = results.map((r) => (r.type === "flight_roundtrip" ? renderRoundTripCard(r) : renderFlightCard(r))).join("");
    } else if (isAttraction) {
      gridClass = "tp-attraction-grid";
      cards = results.map(renderAttractionCard).join("");
      window.AttractionModule?.setResults?.(results);
    }

    if (isHotel && meta?.cityId && !meta?.error) {
      const cityMn = meta.cityName || window.TRAVEL_CITIES?.getCityLabel(meta.cityId) || meta.cityInput || "";
      sub = `<h3 class="tp-hotel-results-title">${cityMn} хотын санал болгох буудлууд</h3>`;
      sub += `<p class="tp-lead tp-muted">${meta.subtitle || "Үнэ болон өрөөний боломж захиалга баталгаажуулах үед дахин шалгагдана."}</p>`;
      const f = meta.filters || {};
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
      sub += searchEmptyHtml();
    }
    if (isAttraction && meta?.cityId && !meta?.error) {
      const cityMn = meta.cityName || window.TRAVEL_CITIES?.getCityLabel(meta.cityId) || "";
      sub = `<h3 class="tp-hotel-results-title">${cityMn} хотын үзвэрүүд</h3>`;
      sub += `<p class="tp-lead tp-muted">${meta.subtitle || ATTRACTION_NOTICE}</p>`;
    }
    if (isAttraction && meta?.error === "city_not_found") {
      sub = `<p class="tp-lead tp-warn">Хот олдсонгүй. Улс, хотыг дахин сонгоно уу.</p>`;
    }
    if (isAttraction && !results.length && !meta?.error) {
      sub += searchEmptyHtml();
    }
    if (type === "train") {
      if (meta?.fromId && meta?.toId) {
        sub = `<p class="tp-lead">${cityLabel(meta.fromId)} → ${cityLabel(meta.toId)} · зэрэглэл сонгоод захална уу</p>`;
      }
      if (!results.length) {
        sub += searchEmptyHtml();
      }
    }
    if (type === "flight" && !results.length) {
      sub += searchEmptyHtml();
    }

    const loadMoreBtn = isHotel && meta?.hasMore
      ? `<div class="tp-hotel-load-more-wrap"><button type="button" class="tp-btn tp-btn-block" id="hotelLoadMore">Илүү олон үзэх</button></div>`
      : (isAttraction && meta?.hasMore
        ? `<div class="tp-hotel-load-more-wrap"><button type="button" class="tp-btn tp-btn-block" id="attractionLoadMore">Илүү олон үзэх</button></div>`
        : "");

    const emptyGrid = (type === "flight" || type === "train") && !results.length ? "" : null;
    box.innerHTML = `
      <div class="tp-results-header">
        <h3>🔍 ${label} — ${results.length} сонголт</h3>
        ${sub}
      </div>
      <div class="${gridClass}">${cards || emptyGrid || (type === "train" ? "" : "<p class='tp-lead'>Үр дүн олдсонгүй.</p>")}</div>
      ${loadMoreBtn}
    `;

    bindConsultAdvisor(box.querySelector("[data-action=consult-advisor]"));
    $("hotelLoadMore")?.addEventListener("click", loadMoreHotels);
    $("attractionLoadMore")?.addEventListener("click", loadMoreAttractions);

    window.AttractionModule?.bindCardActions?.(box, results, {
      onTicket: (item) => openBookingForm("attraction", buildAttractionBookingPreset(item), "Тасалбар асуух")
    });

    box.querySelectorAll("[data-detail-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = results.find((r) => r.id === btn.dataset.itemId);
        if (!item) return;
        if (btn.dataset.detailType === "train-class") {
          const classOpt = item.car_class_options?.find((c) => c.class_id === btn.dataset.classId);
          if (classOpt) openTrainClassDetail(item, classOpt);
          return;
        }
        if (btn.dataset.detailType === "hotel") openHotelDetail(item);
      });
    });

    box.querySelectorAll("[data-book-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = results.find((r) => r.id === btn.dataset.itemId);
        if (!item) return;
        const bookType = btn.dataset.bookType || type;
        if (bookType === "train" && item.transport_type === "train") {
          const classOpt = item.car_class_options?.find((c) => c.class_id === btn.dataset.classId);
          openBookingForm(bookType, buildTransportBookingPreset(item, classOpt), BOOKING_TITLES[bookType]);
          return;
        }
        if (bookType === "train" && item.transport_type === "bus") {
          openBookingForm(bookType, buildTransportBookingPreset(item), BOOKING_TITLES[bookType]);
          return;
        }
        if (bookType === "hotel_request") {
          openBookingForm("hotel", buildHotelRequestPreset(item), "Буудлын санал авах хүсэлт");
          return;
        }
        if (bookType === "flight") {
          openBookingForm("flight", buildFlightBookingPreset(item), BOOKING_TITLES.flight);
          return;
        }
        if (bookType === "attraction") {
          openBookingForm("attraction", buildAttractionBookingPreset(item), BOOKING_TITLES.attraction);
          return;
        }
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
      if (f[k] === "1" || f[k] === true) f[k] = "1";
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
    else if (sort === "stars_desc") list.sort((a, b) => b.stars - a.stars || a.final_price_mnt - b.final_price_mnt);
    else if (sort === "metro_asc") list.sort((a, b) => a.distance_to_metro_m - b.distance_to_metro_m);
    else if (sort === "attraction_asc") list.sort((a, b) => a.distance_to_attraction_km - b.distance_to_attraction_km);
    else if (sort === "center_asc") list.sort((a, b) => (a.distance_to_center_km ?? 99) - (b.distance_to_center_km ?? 99));
    else {
      list.sort((a, b) => {
        const aMock = a.is_mock || a.source === "mock";
        const bMock = b.is_mock || b.source === "mock";
        if (aMock !== bMock) return aMock ? 1 : -1;
        const score = (b.recommendation_score ?? 0) - (a.recommendation_score ?? 0);
        if (score) return score;
        return b.stars - a.stars || (a.distance_to_center_km ?? 99) - (b.distance_to_center_km ?? 99);
      });
    }
    return list;
  }

  function showRequestSuccess(orderId) {
    const stepForm = $("bookingStepForm");
    const payStep = $("bookingStepPay");
    const successStep = $("bookingStepSuccess");
    if (stepForm) stepForm.style.display = "none";
    if (payStep) payStep.style.display = "none";
    if (successStep) successStep.style.display = "block";
    const box = $("bookingSuccessBox");
    if (box) {
      box.innerHTML = `
        <div class="tp-booking-success">
          <div class="tp-success-icon">✅</div>
          <h4>Таны хүсэлтийг авлаа.</h4>
          <p class="tp-success-meta">Манай аяллын зөвлөх тухайн хотод тохирох бодит буудлын сонголтыг шалгаад танд илгээнэ.</p>
          ${orderId ? `<p class="tp-success-order">Хүсэлтийн дугаар: <strong>${orderId}</strong></p>` : ""}
          <p class="tp-success-meta">Хариу: <strong>ажлын 24 цагийн дотор</strong> (утас / WhatsApp / email).</p>
          <button type="button" class="tp-btn primary" id="bookingDoneBtn">Хаах</button>
        </div>`;
      $("bookingDoneBtn")?.addEventListener("click", closeInquiryModal, { once: true });
    }
  }

  async function submitInquiry(e) {
    e.preventDefault();
    const form = $("inquiryForm");
    const statusEl = $("inqStatus");
    if (!form) return;

    const requestMode = !!pendingBooking?.request_mode;
    const amount = Number(pendingBooking?.final_price_mnt || $("inqBudget")?.value || 0);
    if (!requestMode && (!amount || amount <= 0)) {
      if (statusEl) statusEl.textContent = "Эхлээд хайлтаас сонголтоо хийж «Захиалах» дарна уу.";
      return;
    }

    const payload = Object.fromEntries(new FormData(form));
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

    if (requestMode) {
      payload.service_type = "hotel_search_request";
      payload.request_only = true;
      payload.data_source = pendingBooking?.data_source || "estimated_ai";
      payload.estimated_price_mnt = pendingBooking?.estimated_price_mnt || amount;
      payload.area_name = pendingBooking?.area_name || "";
      payload.stars = pendingBooking?.stars || "";
    } else {
      payload.service_type = payload.service_type || pendingBooking?.service_type || "flight";
      if (pendingBooking?.trip_type) payload.trip_type = pendingBooking.trip_type;
      if (pendingBooking?.cabin) payload.cabin = pendingBooking.cabin;
    }

    if (statusEl) statusEl.textContent = requestMode ? "Хүсэлт илгээж байна…" : "Бэлтгэж байна…";
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

      if (requestMode || data.request) {
        showRequestSuccess(data.orderId);
        return;
      }
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

    const tripInput = $("flightTripInput");
    const returnField = $("flightReturnField");
    document.querySelectorAll("#flightTripType .tp-trip-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        const trip = btn.dataset.trip;
        document.querySelectorAll("#flightTripType .tp-trip-opt").forEach((b) => {
          const active = b === btn;
          b.classList.toggle("active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
        if (tripInput) tripInput.value = trip;
        if (returnField) returnField.style.display = trip === "return" ? "" : "none";
      });
    });

    document.querySelectorAll("[data-search-run]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.searchRun;
        const panel = document.querySelector(`.tp-panel[data-panel="${type}"]`);
        const fd = collectForm(panel);
        if (type === "hotel") {
          Object.assign(fd, collectHotelFilters());
          const filters = buildHotelSearchFilters(fd, collectHotelFilters());
          Object.assign(fd, filters);
        }
        if (type === "attraction") {
          Object.assign(fd, collectAttractionFilters());
        }
        runSearch(type, fd);
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
    Object.assign(fd, collectHotelFilters());
    const filters = buildHotelSearchFilters(fd, collectHotelFilters());
    Object.assign(fd, filters);
    runSearch("hotel", fd);
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

  async function updateHotelAreaList(cityInput) {
    const cityId = window.TRAVEL_CITIES?.normalizeCity(cityInput);
    if (!cityId) return;
    const distList = $("hotelDistrictList");
    if (!distList) return;
    const districts = await window.TravelCatalog?.fetchDistricts(cityId) || [];
    distList.innerHTML = districts.map((d) => `<option value="${d}"></option>`).join("");
  }

  function updateHotelDistrictList(cityInput) {
    updateHotelAreaList(cityInput);
  }

  function initLocationSearch() {
    const eng = window.LOCATION_ENGINE;
    if (!eng) return;
    window.LocationAutocomplete?.initAll();
  }

  function initAttractionUI() {
    window.AttractionModule?.initUI?.({
      onApplyFilters: () => {
        const panel = document.querySelector('[data-panel="attraction"]');
        if (panel) runSearch("attraction", { ...collectForm(panel), ...collectAttractionFilters() });
      },
      onSort: () => {
        const panel = document.querySelector('[data-panel="attraction"]');
        if (panel) runSearch("attraction", { ...collectForm(panel), ...collectAttractionFilters() });
      }
    });
  }

  function initAttractionDestinationSelect() {
    return window.AttractionDestinationSelect?.init?.();
  }

  function initHotelDestinationSelect() {
    return window.HotelDestinationSelect?.init?.();
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
    openAttractionDetail,
    buildAttractionBookingPreset,
    setTab,
    renderFlightResults,
    renderTransportResults,
    updateHotelDistrictList,
    getHotelSearchContext: () => window.HotelDestinationSelect?.getContext?.() || {},
    getRoutePlanUrl: () => window.HotelDestinationSelect?.getRouteUrl?.() || "/marshrut.html",
    STATUS_LABELS,
    SERVICE_TYPES,
    BOOKING_TITLES
  };

  async function initDailyRates() {
    await window.TravelCatalog?.ready;
    await window.TRAVEL_DATA?.loadDailyRates?.();
  }

  function initHotelCountrySelect() {
    /* Populated by HotelDestinationSelect.init() */
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await initDailyRates();
    await initHotelDestinationSelect();
    await initAttractionDestinationSelect();
    initAttractionUI();
    renderDestinations();
    renderChinaCities();
    bindServices();
    initTabs();
    initInquiryModal();
    initHotelDetailModal();
    initCityDatalists();
    initHotelFiltersUI();
    const urlTab = new URLSearchParams(location.search).get("tab");
    setTab(urlTab === "hotel" ? "hotel" : urlTab === "attraction" ? "attraction" : "flight");

    if (location.hash === "#esim") {
      document.querySelector("#esim")?.scrollIntoView({ behavior: "smooth" });
    }
  });
})();
