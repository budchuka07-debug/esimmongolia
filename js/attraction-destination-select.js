/**
 * Attraction search — country select + searchable city combobox (shared Asia catalog).
 */
(function (root) {
  const INITIAL_COUNTRY = "china";
  const INITIAL_CITY = "shanghai";
  const PREFIX = "attraction";

  let countrySel, cityInput, cityIdHidden, cityValueHidden, dropdown, wrap;
  let currentCities = [];
  let debounce = null;
  let activeIndex = -1;
  let ready = false;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
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
        return { id, name_mn: local?.name_mn || remote.name_mn, name_en: local?.name_en || remote.name_en, flag: remote.flag || local?.flag || "🏳️" };
      }
      return local;
    }).filter(Boolean);
  }

  function getCatalogCities(countryId) {
    return root.TravelCatalog?.citiesByCountry?.(countryId) ||
      root.ASIA_DESTINATIONS?.getCitiesByCountry(countryId) || [];
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
      dispatchChange();
    }
  }

  function dispatchChange() {
    wrap?.dispatchEvent(new CustomEvent("attraction-destination-change", { bubbles: true }));
  }

  function closeDropdown() {
    dropdown?.classList.remove("is-open");
    dropdown?.setAttribute("aria-hidden", "true");
    activeIndex = -1;
  }

  function renderDropdown(list) {
    if (!dropdown) return;
    if (!list.length) {
      dropdown.innerHTML = `<div class="tp-city-empty">Хот олдсонгүй</div>`;
      dropdown.classList.add("is-open");
      dropdown.setAttribute("aria-hidden", "false");
      return;
    }
    dropdown.innerHTML = list.map((c, i) =>
      `<button type="button" class="tp-city-item" role="option" data-index="${i}">${esc(cityLabel(c))}</button>`
    ).join("");
    dropdown.classList.add("is-open");
    dropdown.setAttribute("aria-hidden", "false");
  }

  function populateCountries(selectedId) {
    if (!countrySel) return;
    const countries = getCatalogCountries();
    countrySel.innerHTML = countries.map((c) =>
      `<option value="${esc(c.id)}"${c.id === selectedId ? " selected" : ""}>${esc(c.flag || "")} ${esc(c.name_mn)}</option>`
    ).join("");
  }

  function loadCitiesForCountry(countryId, opts) {
    currentCities = getCatalogCities(countryId);
    const cityId = opts?.cityId;
    const pick = cityId ? currentCities.find((c) => c.id === cityId) : null;
    if (pick) setCity(pick, { silent: opts?.silent });
    else if (opts?.useDefaultOnFirstLoad) {
      const def = currentCities.find((c) => c.id === INITIAL_CITY) || currentCities[0];
      if (def) setCity(def, { silent: opts?.silent });
    }
  }

  function syncUrlParams() {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "attraction");
    if (countrySel?.value) params.set("country", countrySel.value);
    if (cityIdHidden?.value) params.set("city_id", cityIdHidden.value);
    const url = `${window.location.pathname}?${params}`;
    window.history.replaceState({}, "", url);
  }

  function bindEvents() {
    countrySel?.addEventListener("change", () => {
      loadCitiesForCountry(countrySel.value);
      syncUrlParams();
      dispatchChange();
    });
    cityInput?.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => renderDropdown(filterCities(cityInput.value)), 120);
    });
    cityInput?.addEventListener("focus", () => renderDropdown(filterCities(cityInput.value)));
    cityInput?.addEventListener("keydown", (e) => {
      const items = dropdown?.querySelectorAll(".tp-city-item") || [];
      if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); items[activeIndex]?.classList.add("active"); }
      else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        const c = filterCities(cityInput.value)[activeIndex];
        if (c) setCity(c);
      } else if (e.key === "Escape") closeDropdown();
    });
    dropdown?.addEventListener("click", (e) => {
      const btn = e.target.closest(".tp-city-item");
      if (!btn) return;
      const c = filterCities(cityInput.value)[Number(btn.dataset.index)];
      if (c) setCity(c);
    });
    document.addEventListener("click", (e) => { if (!wrap?.contains(e.target)) closeDropdown(); });
  }

  async function init() {
    if (ready) return api;
    countrySel = $("attractionCountrySelect");
    cityInput = $("attractionCityComboInput");
    cityIdHidden = $("attractionCityIdInput");
    cityValueHidden = $("attractionCityValueInput");
    wrap = $("attractionCitySelectWrap");
    dropdown = $("attractionCityDropdown");
    if (!countrySel || !cityInput || !cityIdHidden) return null;
    await root.TravelCatalog?.ready;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "attraction" && root.TravelBooking?.setTab) root.TravelBooking.setTab("attraction");
    const startCountry = params.get("country") || INITIAL_COUNTRY;
    let startCity = params.get("city_id") || "";
    if (!startCity && params.get("city")) {
      startCity = root.TRAVEL_CITIES?.normalizeCity?.(params.get("city")) ||
        root.ASIA_DESTINATIONS?.normalizeCity?.(params.get("city")) || "";
    }
    populateCountries(startCountry);
    loadCitiesForCountry(countrySel.value, {
      cityId: startCity || undefined,
      useDefaultOnFirstLoad: !startCity && startCountry === INITIAL_COUNTRY,
      silent: true
    });
    syncUrlParams();
    bindEvents();
    ready = true;
    return api;
  }

  const api = {
    init,
    syncUrlParams,
    getSelection() {
      return { country_id: countrySel?.value || "", city_id: cityIdHidden?.value || "", city: cityValueHidden?.value || "" };
    }
  };

  root.AttractionDestinationSelect = api;
})(typeof window !== "undefined" ? window : globalThis);
