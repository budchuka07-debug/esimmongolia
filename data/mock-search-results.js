/**
 * Mock supplier search results — replace with API later (Booking, 12306, Duffel…)
 */
(function () {
  const HOTEL_IMGS = [
    "/images/china/guide/shanghai.jpg",
    "/images/china/guide/overview-shanghai.jpg",
    "/images/china/guide/beijing.jpg",
    "/images/china/guide/guangzhou.jpg",
    "/images/china/guide/shenzhen-city.jpg",
    "/images/routes/china/shanghai-bund.jpg",
    "/images/routes/china/forbidden-city.jpg",
    "/images/routes/china/canton-tower.jpg",
    "/images/routes/china/summer-palace.jpg",
    "/images/routes/china/yu-garden.jpg",
    "/images/routes/china/oct-harbour.jpg",
    "/images/routes/china/disneyland.jpg"
  ];

  const HOTEL_NAMES = [
    { name: "Bund Riverside Hotel", area: "The Bund", stars: 5, desc: "Хуанпу голын эрэг, дээд зэргийн дүрэмт хувцасгүй ресторан.", dist: "The Bund 3 мин • метро 5 мин", breakfast: true, cancel: true, priceNight: 680 },
    { name: "Pudong Skyline Inn", area: "Lujiazui", stars: 4, desc: "Oriental Pearl харагдана. Өрөө том, аялалтанд тохиромжтой.", dist: "Lujiazui метро 2 мин", breakfast: true, cancel: true, priceNight: 520 },
    { name: "Nanjing Road Central", area: "People's Square", stars: 4, desc: "Дэлгүүр, ресторант ойрхон. Гэр бүлд тохиромжтой.", dist: "People's Square метро 4 мин", breakfast: false, cancel: true, priceNight: 420 },
    { name: "French Concession Boutique", area: "Xuhui", stars: 4, desc: "Гудамж, кафе, Instagram газрууд ойрхон.", dist: "Jing'an Temple 8 мин", breakfast: true, cancel: false, priceNight: 480 },
    { name: "Disney Resort Partner Hotel", area: "Pudong Disney", stars: 4, desc: "Disneyland шаттлалтай автобус. Хүүхэдтэй гэр бүлд.", dist: "Disneyland 12 мин", breakfast: true, cancel: true, priceNight: 550 },
    { name: "Hongqiao Airport Link", area: "Minhang", stars: 3, desc: "Нисэх буудал, галт тэрэгт ойр. Эрт нислэгт тохиромжтой.", dist: "Hongqiao airport 15 мин", breakfast: true, cancel: true, priceNight: 320 },
    { name: "Yu Garden Heritage Stay", area: "Old City", stars: 3, desc: "Уламжлалт хороолол, Yu Garden алхамын зайд.", dist: "Yu Garden 5 мин", breakfast: false, cancel: true, priceNight: 290 },
    { name: "Jing'an Business Hotel", area: "Jing'an", stars: 3, desc: "Бизнес аялал, WiFi хурдан, цэвэрхэн.", dist: "Jing'an Temple метро 1 мин", breakfast: true, cancel: false, priceNight: 350 },
    { name: "North Bund Value Stay", area: "Hongkou", stars: 3, desc: "Хямд, цэвэр, метротой ойр.", dist: "Metro 6 мин • The Bund 15 мин", breakfast: false, cancel: true, priceNight: 240 },
    { name: "Changning Metro Hub", area: "Changning", stars: 3, desc: "Олон шугамын метро уулзвар ойрхон.", dist: "Zhongshan Park метро 3 мин", breakfast: true, cancel: true, priceNight: 270 },
    { name: "West Lake View Shanghai", area: "Qingpu", stars: 4, desc: "Ногоон орчин, амралтын өдөрт тохиромжтой.", dist: "Hongqiao HSR 10 мин", breakfast: true, cancel: true, priceNight: 460 },
    { name: "Expo Riverside Suites", area: "Pudong South", stars: 5, desc: "Өрөө+зочид булан, Expo төв ойрхон.", dist: "China Pavilion 8 мин", breakfast: true, cancel: true, priceNight: 720 }
  ];

  function mockHotels(city, nights) {
    const n = Math.max(1, Number(nights) || 5);
    return HOTEL_NAMES.map((h, i) => ({
      type: "hotel",
      id: `hotel-${i}`,
      supplier: "mock_booking",
      name: h.name,
      city,
      area: h.area,
      stars: h.stars,
      description: h.desc,
      distance: h.dist,
      image: HOTEL_IMGS[i % HOTEL_IMGS.length],
      badges: [
        h.breakfast ? "Өглөөний цай" : null,
        h.cancel ? "Үнэгүй цуцлах" : null
      ].filter(Boolean),
      original_price: h.priceNight * n,
      currency: "CNY",
      nights: n,
      label: `${n} шөнө`
    }));
  }

  function mockTrains(from, to) {
    const routes = [
      { dep: "08:15", arr: "10:12", dur: "1ц 57мин", train: "G2402", seat: "2-р зэрэглэл", price: 187 },
      { dep: "09:30", arr: "11:28", dur: "1ц 58мин", train: "G2406", seat: "2-р зэрэглэл", price: 187 },
      { dep: "10:45", arr: "12:40", dur: "1ц 55мин", train: "G2410", seat: "1-р зэрэглэл", price: 298 },
      { dep: "12:00", arr: "14:05", dur: "2ц 05мин", train: "G2418", seat: "2-р зэрэглэл", price: 187 },
      { dep: "14:20", arr: "16:18", dur: "1ц 58мин", train: "G2424", seat: "2-р зэрэглэл", price: 187 },
      { dep: "16:35", arr: "18:32", dur: "1ц 57мин", train: "G2430", seat: "1-р зэрэглэл", price: 298 },
      { dep: "18:10", arr: "22:45", dur: "4ц 35мин", train: "D102", seat: "2-р зэрэглэл", price: 156 },
      { dep: "19:00", arr: "23:20", dur: "4ц 20мин", train: "D108", seat: "Хэвтээ", price: 220 }
    ];
    return routes.map((r, i) => ({
      type: "train",
      id: `train-${i}`,
      supplier: "mock_12306",
      from_city: from || "Хөх хот",
      to_city: to || "Бээжин",
      depart_time: r.dep,
      arrive_time: r.arr,
      duration: r.dur,
      train_number: r.train,
      seat_type: r.seat,
      original_price: r.price,
      currency: "CNY"
    }));
  }

  function mockFlights(from, to) {
    const dest = to || "Шанхай";
    const flights = [
      { airline: "MIAT Mongolian Airlines", depAp: "UBN", arrAp: "PVG", dep: "09:40", arr: "12:35", dur: "2ц 55мин", bag: "23kg багтана", price: 1850 },
      { airline: "Air China", depAp: "UBN", arrAp: "PEK", dep: "11:20", arr: "13:10", dur: "2ц 50мин", bag: "23kg", price: 1720 },
      { airline: "China Southern", depAp: "UBN", arrAp: dest.includes("Шанхай") ? "PVG" : "PEK", dep: "14:05", arr: "17:00", dur: "2ц 55мин", bag: "20kg", price: 1680 },
      { airline: "Hunnu Air + transfer", depAp: "UBN", arrAp: "PVG", dep: "07:15", arr: "16:40", dur: "9ц 25мин", bag: "2×23kg", price: 1420 },
      { airline: "Korean Air (ICN)", depAp: "UBN", arrAp: "PVG", dep: "10:30", arr: "18:15", dur: "7ц 45мин", bag: "23kg", price: 1550 },
      { airline: "MIAT Mongolian Airlines", depAp: "UBN", arrAp: "PVG", dep: "18:50", arr: "21:45", dur: "2ц 55мин", bag: "23kg багтана", price: 1920 },
      { airline: "Air China", depAp: "UBN", arrAp: "SHA", dep: "16:10", arr: "19:05", dur: "2ц 55мин", bag: "23kg", price: 1780 },
      { airline: "China Eastern", depAp: "UBN", arrAp: "PVG", dep: "20:25", arr: "23:10", dur: "2ц 45мин", bag: "20kg", price: 1650 }
    ];
    return flights.map((f, i) => ({
      type: "flight",
      id: `flight-${i}`,
      supplier: "mock_duffel",
      airline: f.airline,
      from_city: from || "Улаанбаатар",
      to_city: dest,
      depart_airport: f.depAp,
      arrive_airport: f.arrAp,
      depart_time: f.dep,
      arrive_time: f.arr,
      duration: f.dur,
      baggage: f.bag,
      original_price: f.price,
      currency: "CNY"
    }));
  }

  window.MOCK_SEARCH = {
    hotels: mockHotels,
    trains: mockTrains,
    flights: mockFlights
  };
})();
