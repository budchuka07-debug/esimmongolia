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

  function mockFlights(fromInput, toInput, options) {
    if (window.FLIGHT_ROUTES?.search) {
      return window.FLIGHT_ROUTES.search(fromInput, toInput, options || {});
    }
    return { results: [], meta: { error: "flight_routes_unavailable" } };
  }

  function estimatedHotels(cityInput, opts) {
    if (window.HOTEL_FALLBACK?.generate) {
      return window.HOTEL_FALLBACK.generate(cityInput, opts || {});
    }
    return [];
  }

  window.MOCK_SEARCH = {
    FALLBACK_IMG,
    hotels: mockHotels,
    transport: mockTransport,
    trains: mockTrains,
    flights: mockFlights,
    estimatedHotels
  };

  window.fallbackFlights = mockFlights;
  window.fallbackTransportRoutes = mockTransport;
  window.fallbackHotels = estimatedHotels;
})();
