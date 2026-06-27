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
    { id: "flight", icon: "✈️", title: "Нислэг шалгах", desc: "Хямд нислэг хайх, захиалгын хүсэлт", href: "/flights.html" },
    { id: "hotel", icon: "🏨", title: "Буудал хайх", desc: "Буудал, байршил, үнэ", href: "/hotels.html" },
    { id: "train", icon: "🚄", title: "Галт тэрэгний тасалбар", desc: "12306, өндөр хурдны галт тэрэг", tab: "train" },
    { id: "attraction", icon: "🎫", title: "Үзвэр үйлчилгээ", desc: "Disneyland, музей, тур", href: "/aylal.html" },
    { id: "esim", icon: "📶", title: "eSIM", desc: "Хятад, Ази, Global дата", anchor: "#esim" },
    { id: "visa", icon: "🛂", title: "Визийн мэдээлэл", desc: "Материал, элчин сайд", href: "/china/#visa" },
    { id: "transport", icon: "🚇", title: "Нийтийн тээврийн заавар", desc: "Метро, автобус, карт", href: "/china/#transport" },
    { id: "route", icon: "🗺️", title: "Аяллын маршрут", desc: "Хот, маршрут, зөвлөгөө", href: "/marshrut.html" }
  ],

  chinaCities: [
    {
      id: "beijing", name: "Бээжин", cn: "北京",
      img: "/images/china/guide/beijing.jpg",
      attractions: ["Forbidden City", "Great Wall (Mutianyu)", "Temple of Heaven", "Summer Palace"],
      map: "https://www.google.com/maps/search/?api=1&query=Beijing+China",
      route: "/china/beijing.html",
      transport: "Метро (20+ шугам), Didi, Airport Express",
      budget: "Өдөрт ~300–600 CNY (дунд зэрэг)",
      esim: "/china.html"
    },
    {
      id: "shanghai", name: "Шанхай", cn: "上海",
      img: "/images/china/guide/shanghai.jpg",
      attractions: ["The Bund", "Oriental Pearl", "Disneyland", "Yu Garden"],
      map: "https://www.google.com/maps/search/?api=1&query=Shanghai+China",
      route: "/shanghai-route.html",
      transport: "Метро, Maglev, Pudong/Hongqiao нисэх буудал",
      budget: "Өдөрт ~350–700 CNY",
      esim: "/china.html"
    },
    {
      id: "guangzhou", name: "Гуанжоу", cn: "广州",
      img: "/images/china/guide/guangzhou.jpg",
      attractions: ["Canton Tower", "Chen Clan Academy", "Shamian Island"],
      map: "https://www.google.com/maps/search/?api=1&query=Guangzhou+China",
      route: "/guangzhou-route.html",
      transport: "Метро, BRT, Guangzhou South HSR",
      budget: "Өдөрт ~250–500 CNY",
      esim: "/china.html"
    },
    {
      id: "shenzhen", name: "Шэньжэнь", cn: "深圳",
      img: "/images/china/guide/shenzhen-city.jpg",
      attractions: ["OCT Harbour", "Window of the World", "Luohu border"],
      map: "https://www.google.com/maps/search/?api=1&query=Shenzhen+China",
      route: "/shenzhen-route.html",
      transport: "Метро, Hong Kong руу шууд галт тэрэг",
      budget: "Өдөрт ~280–550 CNY",
      esim: "/china.html"
    },
    {
      id: "hohhot", name: "Хөх хот", cn: "呼和浩特",
      img: "/images/china/guide/hohhot.jpg",
      attractions: ["Dazhao Temple", "Xilamuren grassland (ойролцоо)"],
      map: "https://www.google.com/maps/search/?api=1&query=Hohhot+China",
      route: "/hohhot-route.html",
      transport: "Монголоос галт тэрэг ~2 цаг, Бээжин рүү HSR",
      budget: "Өдөрт ~200–400 CNY",
      esim: "/china.html"
    },
    {
      id: "chengdu", name: "Чэнду", cn: "成都",
      img: "/images/routes/china/chengdu-panda.jpg",
      attractions: ["Giant Panda Base", "Jinli Street", "Leshan Buddha (1 өдөр)"],
      map: "https://www.google.com/maps/search/?api=1&query=Chengdu+China",
      route: "/china-20-places-route.html",
      transport: "Метро, Shuangliu/ Tianfu нисэх буудал",
      budget: "Өдөрт ~250–500 CNY",
      esim: "/china.html"
    },
    {
      id: "harbin", name: "Харбин", cn: "哈尔滨",
      img: "/images/routes/china/tianjin-eye.jpg",
      attractions: ["Ice Festival (1–2 сар)", "Central Street", "Siberian Tiger Park"],
      map: "https://www.google.com/maps/search/?api=1&query=Harbin+China",
      route: "/china-20-places-route.html",
      transport: "Метро, HSR Бээжинээс ~5 цаг",
      budget: "Өдөрт ~200–450 CNY",
      esim: "/china.html"
    },
    {
      id: "xian", name: "Сиань", cn: "西安",
      img: "/images/routes/china/xian-terracotta.jpg",
      attractions: ["Terracotta Army", "City Wall", "Muslim Quarter"],
      map: "https://www.google.com/maps/search/?api=1&query=Xi'an+China",
      route: "/china-20-places-route.html",
      transport: "Метро, Xian North HSR",
      budget: "Өдөрт ~220–480 CNY",
      esim: "/china.html"
    },
    {
      id: "zhangjiajie", name: "Жанжяжэ", cn: "张家界",
      img: "/images/routes/china/zhangjiajie.jpg",
      attractions: ["Zhangjiajie National Forest", "Tianmen Mountain", "Avatar mountains"],
      map: "https://www.google.com/maps/search/?api=1&query=Zhangjiajie+China",
      route: "/china-20-places-route.html",
      transport: "ZJJ airport, кабель машин, автобус",
      budget: "Өдөрт ~280–600 CNY",
      esim: "/china.html"
    },
    {
      id: "yiwu", name: "Иү", cn: "义乌",
      img: "/images/routes/china/chen-clan.jpg",
      attractions: ["Yiwu International Trade City", "Futian Market"],
      map: "https://www.google.com/maps/search/?api=1&query=Yiwu+China",
      route: "/china-route.html",
      transport: "Yiwu HSR, Шанхай/Ханчжоу руу",
      budget: "Өдөрт ~200–400 CNY (худалдаа)",
      esim: "/china.html"
    }
  ],

  /** Supplier-ready price model (MVP mock) */
  calcFinalPriceMnt(item) {
    const rate = Number(item.exchange_rate || 520);
    const orig = Number(item.original_price || 0);
    const markup = Number(item.markup_percent ?? 15) / 100;
    const fee = Number(item.service_fee_mnt || 0);
    const baseMnt = orig * rate * (1 + markup);
    return {
      original_price: orig,
      currency: item.currency || "CNY",
      exchange_rate: rate,
      markup_percent: item.markup_percent ?? 15,
      service_fee: fee,
      final_price_mnt: Math.round((baseMnt + fee) / 100) * 100
    };
  }
};
