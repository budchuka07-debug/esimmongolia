/**
 * Mock search — trains, flights; hotels via HOTELS_CATALOG
 */
(function () {
  const FALLBACK_IMG = window.HOTELS_CATALOG?.FALLBACK_IMG || "/images/hotels/exterior-01.jpg";

  function mockHotels(cityInput, nights, filters) {
    const cityId = window.TRAVEL_CITIES?.normalizeCity(cityInput);
    if (!cityId || !window.HOTELS_CATALOG) return [];
    return window.HOTELS_CATALOG.search(cityId, nights, filters || {});
  }

  const TRAIN_ROUTES = {
    "hohhot-beijing": [
      { train_number: "D6752", depart_time: "08:10", arrive_time: "10:08", duration: "1ц 58мин", seat_type: "2-р зэрэглэл", price: 187 },
      { train_number: "D6756", depart_time: "10:30", arrive_time: "12:28", duration: "1ц 58мин", seat_type: "2-р зэрэглэл", price: 187 },
      { train_number: "G2482", depart_time: "13:15", arrive_time: "15:05", duration: "1ц 50мин", seat_type: "1-р зэрэглэл", price: 298 },
      { train_number: "D6764", depart_time: "15:40", arrive_time: "17:38", duration: "1ц 58мин", seat_type: "2-р зэрэглэл", price: 187 },
      { train_number: "D6770", depart_time: "18:20", arrive_time: "20:18", duration: "1ц 58мин", seat_type: "2-р зэрэглэл", price: 187 },
      { train_number: "D102", depart_time: "19:45", arrive_time: "23:50", duration: "4ц 05мин", seat_type: "Хэвтээ", price: 220 }
    ],
    "erenhot-beijing": [
      { train_number: "K7922", depart_time: "07:30", arrive_time: "12:15", duration: "4ц 45мин", seat_type: "2-р зэрэглэл", price: 165 },
      { train_number: "K7926", depart_time: "13:00", arrive_time: "17:40", duration: "4ц 40мин", seat_type: "2-р зэрэглэл", price: 165 },
      { train_number: "Z284", depart_time: "18:20", arrive_time: "22:05", duration: "3ц 45мин", seat_type: "1-р зэрэглэл", price: 280 },
      { train_number: "K7930", depart_time: "20:10", arrive_time: "01:05", duration: "4ц 55мин", seat_type: "Хэвтээ", price: 210 }
    ],
    "beijing-shanghai": [
      { train_number: "G1", depart_time: "09:00", arrive_time: "13:28", duration: "4ц 28мин", seat_type: "2-р зэрэглэл", price: 553 },
      { train_number: "G3", depart_time: "10:00", arrive_time: "14:28", duration: "4ц 28мин", seat_type: "1-р зэрэглэл", price: 933 },
      { train_number: "G7", depart_time: "12:30", arrive_time: "16:58", duration: "4ц 28мин", seat_type: "2-р зэрэглэл", price: 553 },
      { train_number: "G13", depart_time: "15:00", arrive_time: "19:28", duration: "4ц 28мин", seat_type: "2-р зэрэглэл", price: 553 },
      { train_number: "G21", depart_time: "17:30", arrive_time: "21:58", duration: "4ц 28мин", seat_type: "1-р зэрэглэл", price: 933 }
    ],
    "beijing-guangzhou": [
      { train_number: "G79", depart_time: "08:05", arrive_time: "16:01", duration: "7ц 56мин", seat_type: "2-р зэрэглэл", price: 862 },
      { train_number: "G81", depart_time: "10:20", arrive_time: "18:16", duration: "7ц 56мин", seat_type: "1-р зэрэглэл", price: 1380 }
    ],
    "guangzhou-shenzhen": [
      { train_number: "G6201", depart_time: "07:30", arrive_time: "08:05", duration: "35мин", seat_type: "2-р зэрэглэл", price: 75 },
      { train_number: "G6205", depart_time: "09:15", arrive_time: "09:50", duration: "35мин", seat_type: "2-р зэрэглэл", price: 75 },
      { train_number: "G6211", depart_time: "12:00", arrive_time: "12:35", duration: "35мин", seat_type: "1-р зэрэглэл", price: 100 }
    ],
    "xian-beijing": [
      { train_number: "G88", depart_time: "09:30", arrive_time: "14:20", duration: "4ц 50мин", seat_type: "2-р зэрэглэл", price: 515 },
      { train_number: "G90", depart_time: "14:00", arrive_time: "18:50", duration: "4ц 50мин", seat_type: "1-р зэрэглэл", price: 824 }
    ]
  };

  function mockTrains(fromInput, toInput) {
    const fromId = window.TRAVEL_CITIES?.normalizeCity(fromInput);
    const toId = window.TRAVEL_CITIES?.normalizeCity(toInput);
    if (!fromId || !toId || fromId === toId) return { routeKey: null, trains: [] };

    const routeKey = `${fromId}-${toId}`;
    const rows = TRAIN_ROUTES[routeKey] || [];
    const fromMn = window.TRAVEL_CITIES?.getCityLabelMn(fromId) || fromId;
    const toMn = window.TRAVEL_CITIES?.getCityLabelMn(toId) || toId;

    const trains = rows.map((r, i) => ({
      type: "train",
      id: `train-${routeKey}-${i}`,
      from_city_id: fromId,
      to_city_id: toId,
      from_city: fromMn,
      to_city: toMn,
      depart_time: r.depart_time,
      arrive_time: r.arrive_time,
      duration: r.duration,
      train_number: r.train_number,
      seat_type: r.seat_type,
      original_price: r.price,
      currency: "CNY",
      internal_supplier_reference: {
        supplier_name: "internal_rail",
        supplier_id: `rail-${routeKey}-${r.train_number}`,
        supplier_price: r.price,
        currency: "CNY"
      }
    }));

    return { routeKey, fromId, toId, trains };
  }

  function mockFlights(fromInput, toInput) {
    const fromId = window.TRAVEL_CITIES?.normalizeCity(fromInput) || "ulanbaatar";
    const toId = window.TRAVEL_CITIES?.normalizeCity(toInput) || "shanghai";
    const toMn = window.TRAVEL_CITIES?.getCityLabelMn(toId) || toInput;
    const fromMn = window.TRAVEL_CITIES?.getCityLabelMn(fromId) || fromInput;

    const airportMap = {
      shanghai: "PVG", beijing: "PEK", guangzhou: "CAN", shenzhen: "SZX",
      bangkok: "BKK", phuket: "HKT", tokyo: "NRT", seoul: "ICN",
      singapore: "SIN", dubai: "DXB", istanbul: "IST", bali: "DPS",
      ulanbaatar: "UBN"
    };
    const destAp = airportMap[toId] || "PVG";
    const fromAp = airportMap[fromId] || "UBN";

    const flights = [
      { airline: "MIAT Mongolian Airlines", dep: "09:40", arr: "12:35", dur: "2ц 55мин", bag: "23kg", price: 1850 },
      { airline: "Air China", dep: "11:20", arr: "13:10", dur: "2ц 50мин", bag: "23kg", price: 1720 },
      { airline: "China Southern", dep: "14:05", arr: "17:00", dur: "2ц 55мин", bag: "20kg", price: 1680 },
      { airline: "Korean Air (ICN)", dep: "10:30", arr: "18:15", dur: "7ц 45мин", bag: "23kg", price: 1550 },
      { airline: "Thai Airways", dep: "08:15", arr: "14:30", dur: "6ц 15мин", bag: "23kg", price: 1620 },
      { airline: "Singapore Airlines", dep: "16:10", arr: "22:05", dur: "5ц 55мин", bag: "23kg", price: 1780 },
      { airline: "Emirates", dep: "18:50", arr: "02:40", dur: "7ц 50мин", bag: "30kg", price: 1920 },
      { airline: "MIAT Mongolian Airlines", dep: "20:25", arr: "23:10", dur: "2ц 45мин", bag: "20kg", price: 1650 }
    ];

    return flights.map((f, i) => ({
      type: "flight",
      id: `flight-${toId}-${i}`,
      to_city_id: toId,
      from_city_id: fromId,
      airline: f.airline,
      from_city: fromMn,
      to_city: toMn,
      depart_airport: fromAp,
      arrive_airport: destAp,
      depart_time: f.dep,
      arrive_time: f.arr,
      duration: f.dur,
      baggage: f.bag,
      original_price: f.price,
      currency: "CNY",
      internal_supplier_reference: {
        supplier_name: "internal_air",
        supplier_id: `flt-${toId}-${i}`,
        supplier_price: f.price,
        currency: "CNY"
      }
    }));
  }

  window.MOCK_SEARCH = {
    FALLBACK_IMG,
    hotels: mockHotels,
    trains: mockTrains,
    flights: mockFlights
  };
})();
