/**
 * Search API — hotels, transport (source-based), flights
 */
(function () {
  const FALLBACK_IMG = window.HOTELS_CATALOG?.FALLBACK_IMG || "/images/hotels/exterior-01.jpg";

  function mockHotels(cityInput, nights, filters) {
    const cityId = window.TRAVEL_CITIES?.normalizeCity(cityInput);
    if (!cityId || !window.HOTELS_CATALOG) return [];
    return window.HOTELS_CATALOG.search(cityId, nights, filters || {});
  }

  function mockTransport(fromInput, toInput) {
    if (window.TRANSPORT_ROUTES?.search) {
      return window.TRANSPORT_ROUTES.search(fromInput, toInput);
    }
    return { routeKey: null, fromId: null, toId: null, results: [] };
  }

  /** @deprecated use mockTransport */
  function mockTrains(fromInput, toInput) {
    const data = mockTransport(fromInput, toInput);
    return { ...data, trains: data.results };
  }

  function mockFlights(fromInput, toInput) {
    const fromId = window.TRAVEL_CITIES?.normalizeCity(fromInput) || "ulanbaatar";
    const toId = window.TRAVEL_CITIES?.normalizeCity(toInput) || "shanghai";
    const toMn = window.TRAVEL_CITIES?.getCityLabelMn(toId) || toInput;
    const fromMn = window.TRAVEL_CITIES?.getCityLabelMn(fromId) || fromInput;

    const airportMap = {
      ...(window.CHINA_DESTINATIONS?.buildAirportMap?.() || {}),
      bangkok: "BKK", phuket: "HKT", tokyo: "NRT", seoul: "ICN",
      singapore: "SIN", dubai: "DXB", istanbul: "IST", bali: "DPS",
      hanoi: "HAN", ho_chi_minh: "SGN", kuala_lumpur: "KUL"
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
    transport: mockTransport,
    trains: mockTrains,
    flights: mockFlights
  };
})();
