/**
 * Trip.com-style location autocomplete dropdown.
 */
(function (root) {
  let uid = 0;
  const openDropdowns = new Set();

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function closeAll(except) {
    openDropdowns.forEach((dd) => {
      if (dd !== except) {
        dd.classList.remove("is-open");
        dd.setAttribute("aria-hidden", "true");
      }
    });
  }

  function renderItem(item, query) {
    if (item.special === "my_location") {
      return `<button type="button" class="tp-loc-item tp-loc-item-special" data-special="my_location">
        <span class="tp-loc-flag">${item.flag}</span>
        <span class="tp-loc-body">
          <strong>${esc(item.title)}</strong>
          <span class="tp-loc-sub">${esc(item.subtitle)}</span>
        </span>
      </button>`;
    }
    const code = item.airport_code ? `<span class="tp-loc-iata">${esc(item.airport_code)}</span>` : "";
    const typeLabel = { city: "Хот", country: "Улс", airport: "Нисэх буудал", district: "Бүс", landmark: "Ойролцоо" }[item.type] || "";
    return `<button type="button" class="tp-loc-item" data-type="${esc(item.type)}"
      data-city-id="${esc(item.city_id || "")}" data-country-id="${esc(item.country_id || "")}"
      data-airport="${esc(item.airport_code || "")}" data-area-id="${esc(item.raw?.area_id || "")}">
      <span class="tp-loc-flag">${item.flag || "🏳️"}</span>
      <span class="tp-loc-body">
        <strong>${esc(item.title)}</strong>
        <span class="tp-loc-sub">${esc(item.subtitle || "")}${typeLabel ? " · " + typeLabel : ""}</span>
      </span>
      ${code}
    </button>`;
  }

  function attach(input, options) {
    if (!input || input.dataset.locBound) return null;
    input.dataset.locBound = "1";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");

    const opts = options || {};
    const wrap = document.createElement("div");
    wrap.className = "tp-loc-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const hidden = document.createElement("input");
    hidden.type = "hidden";
    const hf = opts.hiddenField || input.dataset.locHidden || "city_id";
    hidden.setAttribute("data-field", hf);
    if (opts.hiddenName) hidden.name = opts.hiddenName;
    wrap.appendChild(hidden);

    const dd = document.createElement("div");
    dd.className = "tp-loc-dropdown";
    dd.setAttribute("role", "listbox");
    dd.setAttribute("aria-hidden", "true");
    const ddId = `tp-loc-dd-${++uid}`;
    dd.id = ddId;
    input.setAttribute("aria-controls", ddId);
    wrap.appendChild(dd);
    openDropdowns.add(dd);

    let debounce = null;
    let activeIndex = -1;

    function searchOpts() {
      const countrySel = opts.countryFromSelect ? $(opts.countryFromSelect) : null;
      const countryId = countrySel?.value || opts.country_id || null;
      const cityContext = opts.cityFromInput ? $(opts.cityFromInput)?.dataset?.resolvedCityId : opts.city_id;
      return {
        types: opts.types || ["city", "airport", "country"],
        country_id: countryId,
        city_id: cityContext || null,
        limit: opts.limit || 10,
        includeDefaults: !input.value.trim(),
        showMyLocation: !!opts.showMyLocation,
        defaultCityId: opts.defaultCityId || null
      };
    }

    function open(list) {
      if (!list.length) {
        dd.classList.remove("is-open");
        dd.setAttribute("aria-hidden", "true");
        dd.innerHTML = "";
        return;
      }
      closeAll(dd);
      dd.innerHTML = list.map((item) => renderItem(item, input.value)).join("");
      dd.classList.add("is-open");
      dd.setAttribute("aria-hidden", "false");
      activeIndex = -1;
    }

    function runSearch() {
      root.LOCATION_ENGINE?.init?.();
      const list = root.LOCATION_ENGINE.search(input.value, searchOpts());
      open(list);
    }

    function applySelection(btn) {
      if (!btn) return;
      if (btn.dataset.special === "my_location") {
        selectCity("ulanbaatar", "🇲🇳 Улаанбаатар");
        return;
      }
      const type = btn.dataset.type;
      const cityId = btn.dataset.cityId;
      const countryId = btn.dataset.countryId;
      const areaId = btn.dataset.areaId;

      if (type === "country") {
        input.value = btn.querySelector("strong")?.textContent || "";
        hidden.value = countryId;
        hidden.dataset.resolvedType = "country";
        delete input.dataset.resolvedCityId;
      } else if (type === "district" || type === "landmark") {
        input.value = btn.querySelector("strong")?.textContent || "";
        hidden.value = areaId || "";
        input.dataset.resolvedAreaId = areaId || "";
        input.dataset.resolvedCityId = cityId || "";
        hidden.dataset.resolvedType = type;
      } else {
        const title = btn.querySelector("strong")?.textContent || "";
        selectCity(cityId, title, btn.dataset.airport);
      }

      dd.classList.remove("is-open");
      input.dispatchEvent(new Event("change", { bubbles: true }));
      opts.onSelect?.({
        type,
        city_id: cityId,
        country_id: countryId,
        airport_code: btn.dataset.airport,
        area_id: areaId,
        label: input.value
      });
    }

    function selectCity(cityId, label, airport) {
      if (!cityId) return;
      const city = root.LOCATION_ENGINE?.getCity?.(cityId);
      input.value = label || city?.name_mn || cityId;
      hidden.value = cityId;
      input.dataset.resolvedCityId = cityId;
      hidden.dataset.resolvedType = "city";
      if (airport) input.dataset.resolvedAirport = airport;
      if (opts.syncHiddenCityField) {
        const h = $(opts.syncHiddenCityField);
        if (h) h.value = cityId;
      }
    }

    function syncFromValue() {
      root.LOCATION_ENGINE?.init?.();
      const resolved = root.LOCATION_ENGINE.resolve(input.value, searchOpts());
      if (typeof resolved === "string") {
        hidden.value = resolved;
        input.dataset.resolvedCityId = resolved;
      }
    }

    if (opts.defaultCityId) {
      const c = root.LOCATION_ENGINE?.getCity?.(opts.defaultCityId);
      if (c && !input.value) selectCity(opts.defaultCityId, `${c.name_mn}`);
      else if (input.value) syncFromValue();
    } else if (input.value) {
      syncFromValue();
    }

    input.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(runSearch, 120);
    });

    input.addEventListener("focus", () => {
      runSearch();
    });

    input.addEventListener("keydown", (e) => {
      const items = [...dd.querySelectorAll(".tp-loc-item")];
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle("is-active", i === activeIndex));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        items.forEach((el, i) => el.classList.toggle("is-active", i === activeIndex));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        applySelection(items[activeIndex]);
      } else if (e.key === "Escape") {
        dd.classList.remove("is-open");
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(() => {
        dd.classList.remove("is-open");
        syncFromValue();
      }, 180);
    });

    dd.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const btn = e.target.closest(".tp-loc-item");
      if (btn) applySelection(btn);
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) dd.classList.remove("is-open");
    });

    return { input, hidden, wrap, syncFromValue, selectCity };
  }

  function initAll(rootEl) {
    const scope = rootEl || document;
    scope.querySelectorAll("[data-loc]").forEach((input) => {
      const types = (input.dataset.locTypes || "city,airport,country").split(",").map((s) => s.trim());
      attach(input, {
        types,
        showMyLocation: input.dataset.loc === "from",
        defaultCityId: input.dataset.locDefault || (input.dataset.loc === "from" ? "ulanbaatar" : null),
        countryFromSelect: input.dataset.locCountrySelect || null,
        cityFromInput: input.dataset.locCityContext || null,
        hiddenField: input.dataset.locHidden || (input.dataset.field ? input.dataset.field + "_id" : "city_id"),
        syncHiddenCityField: input.dataset.locSyncHidden || null,
        onSelect: input.dataset.locOnSelect ? root[input.dataset.locOnSelect] : null
      });
    });
  }

  root.LocationAutocomplete = { attach, initAll, closeAll };
})(window);
