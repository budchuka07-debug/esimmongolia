/**
 * Hotel search — country select + searchable city combobox.
 */
(function (root) {
  const INITIAL_COUNTRY = "china";
  const INITIAL_CITY = "shanghai";

  let countrySel = null;
  let cityInput = null;
  let cityIdHidden = null;
  let cityValueHidden = null;
  let dropdown = null;
  let wrap = null;
  let currentCities = [];
  let debounce = null;
  let activeIndex = -1;
  let ready = false;

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeKey(s) {
    return String(s || "").trim().toLowerCase().replace(/[''`]/g, "").replace(/\s+/g, " ");
  }

  function getCatalogCountries() {
    const asia = root.ASIA_DESTINATIONS;
    const ids = asia?.HOTEL_COUNTRY_IDS || [];
    const fromCatalog = root.TravelCatalog?.countries?.() || [];
    const byId = Object.fromEntries(fromCatalog.map((c) => [c.id, c]));
    return ids.map((id) => {
      const local = asia?.getCountry(id);
      const remote = byId[id];
      if (remote) {
        return {
          id,
          name_mn: local?.name_mn || remote.name_mn,
          name_en: local?.name_en || remote.name_en,
          flag: remote.flag || local?.flag || "🏳️"
        };
      }
      return local;
    }).filter(Boolean);
  }

  function getCatalogCities(countryId) {
    if (root.TravelCatalog?.citiesByCountry) {
      return root.TravelCatalog.citiesByCountry(countryId);
    }
    return root.ASIA_DESTINATIONS?.getCitiesByCountry(countryId) ||
      root.TRAVEL_CITIES?.getCitiesByCountry?.(countryId) || [];
  }

  function cityLabel(c) {
    return c.local ? `${c.name_mn} (${c.local})` : c.name_mn;
  }

  function filterCities(query) {
    const q = normalizeKey(query);
    if (!q) return currentCities;
    return currentCities.filter((c) => {
      const hay = normalizeKey([c.id, c.name_mn, c.name_en, c.local, ...(c.aliases || [])].join(" "));
      return hay.includes(q);
    });
  }

  function setCity(city, options) {
    if (!city) return;
    const silent = options?.silent;
    if (cityIdHidden) cityIdHidden.value = city.id;
    if (cityValueHidden) cityValueHidden.value = city.name_en;
    if (cityInput) {
      cityInput.value = cityLabel(city);
      cityInput.dataset.resolvedCityId = city.id;
    }
    closeDropdown();
    if (!silent) {
      syncUrlParams();
      updateAreaContext();
      root.TravelBooking?.updateHotelDistrictList?.(city.name_en);
      dispatchChange();
    }
  }

  function dispatchChange() {
    wrap?.dispatchEvent(new CustomEvent("hotel-destination-change", { bubbles: true }));
  }

  function closeDropdown() {
    dropdown?.classList.remove("is-open");
    dropdown?.setAttribute("aria-hidden", "true");
    activeIndex = -1;
  }

  function openDropdown(list) {
    if (!dropdown) return;
    if (!list.length) {
      closeDropdown();
      dropdown.innerHTML = "";
      return;
    }
    dropdown.innerHTML = list.map((c, i) =>
      `<button type="button" class="tp-loc-item tp-city-item" data-index="${i}" data-city-id="${esc(c.id)}">
        <span class="tp-loc-flag">🏙</span>
        <span class="tp-loc-body">
          <strong>${esc(cityLabel(c))}</strong>
          <span class="tp-loc-sub">${esc(c.name_en)}</span>
        </span>
      </button>`
    ).join("");
    dropdown.classList.add("is-open");
    dropdown.setAttribute("aria-hidden", "false");
    activeIndex = -1;
  }

  function renderDropdown(query) {
    openDropdown(filterCities(query));
  }

  function selectByIndex(index) {
    const items = dropdown?.querySelectorAll(".tp-city-item");
    if (!items?.length || index < 0 || index >= items.length) return;
    const id = items[index].dataset.cityId;
    const city = currentCities.find((c) => c.id === id);
    if (city) setCity(city);
  }

  function highlightIndex(index) {
    const items = dropdown?.querySelectorAll(".tp-city-item");
    if (!items?.length) return;
    items.forEach((el, i) => el.classList.toggle("is-active", i === index));
    activeIndex = index;
    items[index]?.scrollIntoView({ block: "nearest" });
  }

  function loadCitiesForCountry(countryId, options) {
    currentCities = getCatalogCities(countryId);
    const prefer = options?.cityId;
    let target = null;
    if (prefer) target = currentCities.find((c) => c.id === prefer);
    if (!target && options?.useDefaultOnFirstLoad && countryId === INITIAL_COUNTRY) {
      target = currentCities.find((c) => c.id === INITIAL_CITY);
    }
    if (!target) target = currentCities[0] || null;
    setCity(target, { silent: !!options?.silent });
    return target;
  }

  function populateCountries(selectedId) {
    if (!countrySel) return;
    const list = getCatalogCountries();
    countrySel.innerHTML = list.map((c) =>
      `<option value="${esc(c.id)}">${c.flag || ""} ${esc(c.name_mn)}</option>`
    ).join("");
    const pick = selectedId || INITIAL_COUNTRY;
    if (list.some((c) => c.id === pick)) countrySel.value = pick;
    else if (list.length) countrySel.value = list[0].id;
  }

  function readUrlParams() {
    const params = new URLSearchParams(location.search);
    return {
      country: params.get("country") || params.get("country_id") || "",
      city_id: params.get("city_id") || "",
      city: params.get("city") || "",
      tab: params.get("tab") || ""
    };
  }

  function syncUrlParams() {
    if (!countrySel || !cityIdHidden) return;
    const params = new URLSearchParams(location.search);
    params.set("tab", "hotel");
    params.set("country", countrySel.value);
    params.set("city_id", cityIdHidden.value || "");
    if (cityValueHidden?.value) params.set("city", cityValueHidden.value);
    const next = `${location.pathname}?${params.toString()}${location.hash}`;
    history.replaceState(null, "", next);
  }

  function updateAreaContext() {
    const areaInput = $("hotelAreaInput");
    if (areaInput && cityInput) {
      areaInput.dataset.locCityId = cityInput.dataset.resolvedCityId || "";
    }
  }

  function getContext() {
    const countryId = countrySel?.value || "";
    const cityId = cityIdHidden?.value || "";
    const cityEn = cityValueHidden?.value || "";
    const country = root.TRAVEL_CITIES?.getCountry(countryId) || root.ASIA_DESTINATIONS?.getCountry(countryId);
    const city = root.TRAVEL_CITIES?.getCity(cityId) || root.ASIA_DESTINATIONS?.getCity(cityId);
    const daysEl = document.querySelector('.tp-panel[data-panel="hotel"] [data-field="days"]');
    const guestsEl = document.querySelector('.tp-panel[data-panel="hotel"] [data-field="guests"]');
    return {
      country: country?.name_mn || "",
      country_id: countryId,
      city: city?.name_mn || cityEn,
      city_en: cityEn,
      city_id: cityId,
      days: daysEl ? Number(daysEl.value) || undefined : undefined,
      people: guestsEl ? Number(guestsEl.value) || undefined : undefined
    };
  }

  function getRouteUrl() {
    const ctx = getContext();
    const params = new URLSearchParams();
    if (ctx.country_id) params.set("country", ctx.country_id);
    if (ctx.city_id) params.set("city_id", ctx.city_id);
    if (ctx.city_en) params.set("city", ctx.city_en);
    const qs = params.toString();
    return `/marshrut.html${qs ? `?${qs}` : ""}`;
  }

  function bindEvents() {
    countrySel?.addEventListener("change", () => {
      loadCitiesForCountry(countrySel.value);
      syncUrlParams();
      dispatchChange();
    });

    cityInput?.addEventListener("focus", () => renderDropdown(cityInput.value));
    cityInput?.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => renderDropdown(cityInput.value), 120);
    });
    cityInput?.addEventListener("keydown", (e) => {
      const items = dropdown?.querySelectorAll(".tp-city-item");
      const count = items?.length || 0;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        highlightIndex(Math.min(activeIndex + 1, count - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlightIndex(Math.max(activeIndex - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0) selectByIndex(activeIndex);
        else if (count === 1) selectByIndex(0);
      } else if (e.key === "Escape") {
        closeDropdown();
      }
    });

    dropdown?.addEventListener("click", (e) => {
      const btn = e.target.closest(".tp-city-item");
      if (!btn) return;
      selectByIndex(Number(btn.dataset.index));
    });

    document.addEventListener("click", (e) => {
      if (!wrap?.contains(e.target)) closeDropdown();
    });
  }

  async function init() {
    if (ready) return api;
    countrySel = $("hotelCountrySelect");
    cityInput = $("hotelCityComboInput");
    cityIdHidden = $("hotelCityIdInput");
    cityValueHidden = $("hotelCityValueInput");
    wrap = $("hotelCitySelectWrap");
    dropdown = $("hotelCityDropdown");
    if (!countrySel || !cityInput || !cityIdHidden) return null;

    await root.TravelCatalog?.ready;

    const url = readUrlParams();
    if (url.tab === "hotel" && root.TravelBooking?.setTab) {
      root.TravelBooking.setTab("hotel");
    }

    const startCountry = url.country || INITIAL_COUNTRY;
    let startCity = url.city_id || "";
    if (!startCity && url.city) {
      startCity = root.TRAVEL_CITIES?.normalizeCity?.(url.city) ||
        root.ASIA_DESTINATIONS?.normalizeCity?.(url.city) || "";
    }

    populateCountries(startCountry);
    const useInitialDefault = !startCity && startCountry === INITIAL_COUNTRY;
    loadCitiesForCountry(countrySel.value, {
      cityId: startCity || undefined,
      useDefaultOnFirstLoad: useInitialDefault,
      silent: true
    });
    syncUrlParams();
    updateAreaContext();
    bindEvents();
    ready = true;
    return api;
  }

  const api = {
    init,
    ready: () => ready,
    getContext,
    getRouteUrl,
    syncUrlParams,
    setCountry(countryId, cityId) {
      if (!countrySel) return;
      populateCountries(countryId);
      loadCitiesForCountry(countrySel.value, { cityId });
    },
    getSelection() {
      return {
        country_id: countrySel?.value || "",
        city_id: cityIdHidden?.value || "",
        city: cityValueHidden?.value || ""
      };
    }
  };

  root.HotelDestinationSelect = api;
})(typeof window !== "undefined" ? window : globalThis);
