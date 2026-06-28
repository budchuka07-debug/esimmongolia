/** Travel platform data — MVP mock, supplier-ready pricing shape */
window.TRAVEL_DATA = {
  destinations: [
    { code: "CN", name: "Хятад", flag: "🇨🇳", img: "/images/china/guide/hero.jpg", href: "/china/" },
    { code: "KR", name: "Солонгос", flag: "🇰🇷", img: "/images/routes/china/shanghai-bund.jpg", href: "/korea-route.html" },
    { code: "JP", name: "Япон", flag: "🇯🇵", img: "/images/routes/china/yu-garden.jpg", href: "/japan-route.html" },
    { code: "TH", name: "Тайланд", flag: "🇹🇭", img: "/images/routes/china/sanya.jpg", href: "/thailand-route.html" },
    { code: "VN", name: "Вьетнам", flag: "🇻🇳", img: "/images/routes/china/guilin-liriver.jpg", href: "/vietnam-route.html" },
    { code: "SG", name: "Сингапур", flag: "🇸🇬", img: "/images/routes/china/oct-harbour.jpg", href: "/singapore-route.html" },
    { code: "MY", name: "Малайз", flag: "🇲🇾", img: "/images/routes/china/canton-tower.jpg", href: "/malaysia-route.html" },
    { code: "TR", name: "Турк", flag: "🇹🇷", img: "/images/routes/china/hangzhou-westlake.jpg", href: "/turkey-route.html" },
    { code: "AE", name: "Дубай", flag: "🇦🇪", img: "/images/routes/china/shanghai-bund.jpg", href: "/flights.html" }
  ],

  services: [
    { id: "ai", icon: "🤖", title: "AI зөвлөх", desc: "Чат үнэгүй — form шаардлагагүй", img: "/images/china/guide/internet.jpg", action: "ai_chat" },
    { id: "flight", icon: "✈️", title: "Нислэг шалгах", desc: "Хямд нислэг хайх, захиалгын хүсэлт", img: "/images/routes/china/shanghai-bund.jpg", tab: "flight" },
    { id: "hotel", icon: "🏨", title: "Буудал хайх", desc: "Буудал, байршил, үнэ", img: "/images/hotels/exterior-01.jpg", tab: "hotel" },
    { id: "train", icon: "🚄", title: "Галт тэрэг / Автобус", desc: "12306, автобус — эх сурвалжид тулгуурласан", img: "/images/china/guide/transport-hsr.jpg", tab: "train" },
    { id: "attraction", icon: "🎫", title: "Үзвэр үйлчилгээ", desc: "Disneyland, музей, тур", img: "/images/routes/china/panda.jpg", tab: "attraction" },
    { id: "esim", icon: "📶", title: "eSIM", desc: "Хятад, Ази, Global дата", img: "/images/china/guide/internet.jpg", anchor: "#esim" },
    { id: "visa", icon: "🛂", title: "Визийн мэдээлэл", desc: "Материал, элчин сайд", img: "/images/china/guide/route-asia.jpg", tab: "visa" },
    { id: "transport", icon: "🚇", title: "Нийтийн тээврийн заавар", desc: "Метро, автобус, карт", img: "/images/china/guide/app-amap.jpg", href: "/china/#transport" },
    { id: "route", icon: "🗺️", title: "Аяллын маршрут", desc: "Хот, маршрут, зөвлөгөө", img: "/images/china/guide/routes-all.jpg", href: "/marshrut.html" }
  ],

  /** Admin-configurable pricing (default 15%, range 10–20%) */
  pricing: {
    defaultMarkupPercent: 15,
    minMarkupPercent: 10,
    maxMarkupPercent: 20,
    rateDate: null,
    rateSource: null,
    exchangeRateCny: 540,
    exchangeRateUsd: 3680,
    serviceFeeMnt: 5000,
    exchangeRates: {
      CNY: 540,
      THB: 110,
      VND: 0.21,
      JPY: 24,
      KRW: 2.7,
      SGD: 2800,
      MYR: 780,
      IDR: 0.33,
      AED: 1000,
      TRY: 110,
      USD: 3680
    }
  },

  /** China city cards — derived from CHINA_DESTINATIONS (city_id), not hardcoded */
  chinaCities: [],

  initChinaCities() {
    if (window.CHINA_DESTINATIONS?.buildTravelCards) {
      this.chinaCities = window.CHINA_DESTINATIONS.buildTravelCards();
    }
    return this.chinaCities;
  },

  /** Supplier price + 15% markup → final MNT (customer sees final only) */
  calcFinalPriceMnt(item) {
    const p = window.TRAVEL_DATA?.pricing || {};
    const currency = item.currency || "CNY";
    const rate = Number(
      item.exchange_rate ||
      p.exchangeRates?.[currency] ||
      p.exchangeRateCny ||
      540
    );
    const orig = Number(item.original_price || item.supplier_price || 0);
    const markupPct = item.markup_percent ?? p.defaultMarkupPercent ?? 15;
    const markup = Number(markupPct) / 100;
    const fee = Number(item.service_fee_mnt ?? p.serviceFeeMnt ?? 0);
    const baseMnt = orig * rate * (1 + markup);
    return {
      supplier_price: orig,
      supplier_currency: currency,
      exchange_rate: rate,
      exchange_rate_date: p.rateDate || null,
      exchange_rate_source: p.rateSource || null,
      markup_percent: markupPct,
      service_fee_mnt: fee,
      final_price_mnt: Math.round((baseMnt + fee) / 100) * 100
    };
  },

  /** Customer-facing price — supplier/markup/FX stay in internal_supplier_reference only */
  priceItem(item, markupPercent) {
    const calc = this.calcFinalPriceMnt({
      ...item,
      markup_percent: markupPercent ?? this.pricing.defaultMarkupPercent
    });
    const internal = {
      ...(typeof item.internal_supplier_reference === "object"
        ? item.internal_supplier_reference
        : { ref: item.internal_supplier_reference }),
      supplier_price: calc.supplier_price,
      supplier_currency: calc.supplier_currency,
      exchange_rate: calc.exchange_rate,
      exchange_rate_date: calc.exchange_rate_date,
      exchange_rate_source: calc.exchange_rate_source,
      markup_percent: calc.markup_percent,
      service_fee_mnt: calc.service_fee_mnt,
      final_price_mnt: calc.final_price_mnt
    };
    const result = {
      ...item,
      final_price_mnt: calc.final_price_mnt,
      internal_supplier_reference: internal
    };
    delete result.original_price;
    delete result.exchange_rate;
    delete result.markup_percent;
    delete result.price_cny_min;
    delete result.price_cny_max;
    return result;
  },

  applyDailyRates(payload) {
    if (!payload?.rates) return false;
    const p = this.pricing;
    Object.assign(p.exchangeRates, payload.rates);
    if (payload.rates.CNY) p.exchangeRateCny = payload.rates.CNY;
    if (payload.rates.USD) p.exchangeRateUsd = payload.rates.USD;
    p.rateDate = payload.date || null;
    p.rateSource = payload.source || null;
    return true;
  },

  async loadDailyRates() {
    try {
      const res = await fetch("/.netlify/functions/exchange-rates");
      const data = await res.json();
      if (data.ok) this.applyDailyRates(data);
      return data;
    } catch {
      return null;
    }
  },

  rateFootnote() {
    const p = this.pricing || {};
    if (!p.rateDate) return "Төлөх эцсийн үнэ";
    return `Төлөх үнэ — ${p.rateDate} өдрийн ханшаар`;
  }
};

if (window.CHINA_DESTINATIONS) window.TRAVEL_DATA.initChinaCities();
