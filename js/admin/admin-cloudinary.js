/**
 * Admin Cloudinary — unsigned preset, folder structure, drag-drop gallery
 * Cloud: dflwo8gmz | Preset: esimmongolia_upload (via Netlify env)
 */
(function () {
  let configPromise = null;

  const FOLDERS = {
    root: "esimmongolia",
    countries: "esimmongolia/countries",
    cities: "esimmongolia/cities",
    hotels: "esimmongolia/hotels",
    rooms: "esimmongolia/rooms",
    attractions: "esimmongolia/attractions",
    trains: "esimmongolia/trains",
    flights: "esimmongolia/flights",
    rentals: "esimmongolia/rentals",
    insurance: "esimmongolia/insurance",
    esim: "esimmongolia/esim",
    guides: "esimmongolia/guides",
    health: "esimmongolia/health"
  };

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function thumbUrl(url) {
    if (/res\.cloudinary\.com/i.test(String(url || ""))) {
      return url.replace("/upload/", "/upload/f_auto,q_auto,w_160,c_fill/");
    }
    return url;
  }

  async function getConfig() {
    if (!configPromise) {
      configPromise = fetch("/.netlify/functions/cloudinary-config")
        .then((r) => r.json())
        .then((d) => {
          if (!d.ok || !d.cloud_name || !d.upload_preset) {
            throw new Error("Cloudinary тохиргоо дутуу (CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET)");
          }
          return d;
        });
    }
    return configPromise;
  }

  async function upload(file, folder) {
    const cfg = await getConfig();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", cfg.upload_preset);
    fd.append("folder", folder || FOLDERS.root);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud_name}/image/upload`, {
      method: "POST",
      body: fd
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url;
  }

  function previewHtml(url) {
    if (!url) {
      return `<div class="adm-img-preview adm-img-empty">Зураг байхгүй — drag & drop эсвэл upload</div>`;
    }
    return `<img class="adm-img-preview" src="${esc(thumbUrl(url))}" alt="" loading="lazy">`;
  }

  function dropZoneHtml(label) {
    return `
      <div class="adm-drop-zone" data-drop-zone>
        <div class="adm-drop-inner">
          <span class="adm-drop-icon">📁</span>
          <strong>${esc(label || "Зураг чирж оруулна уу")}</strong>
          <span class="adm-drop-hint">JPEG, PNG, WebP · олон зураг</span>
        </div>
      </div>`;
  }

  function galleryItemHtml(url, isCover) {
    return `
      <div class="adm-gallery-item${isCover ? " is-cover" : ""}" draggable="true" data-url="${esc(url)}">
        ${isCover ? '<span class="adm-cover-badge">Cover</span>' : ""}
        <img src="${esc(thumbUrl(url))}" alt="" loading="lazy">
        <div class="adm-gallery-toolbar">
          <button type="button" class="adm-gallery-btn" data-set-cover title="Cover болгох">★</button>
          <button type="button" class="adm-gallery-btn" data-move-left title="Зүүн">←</button>
          <button type="button" class="adm-gallery-btn" data-move-right title="Баруун">→</button>
          <button type="button" class="adm-gallery-btn" data-replace title="Солих">🔄</button>
          <button type="button" class="adm-gallery-btn danger" data-remove title="Устгах">✕</button>
        </div>
        <input type="file" accept="image/*" hidden data-replace-input>
      </div>`;
  }

  function fieldCover(name, value, label, folder) {
    return `
      <div class="adm-field adm-img-field full" data-img-field="cover" data-folder="${esc(folder || FOLDERS.root)}" data-cover-name="${esc(name)}">
        <label>${esc(label)} <span class="adm-field-hint-inline">(Cloudinary secure_url)</span></label>
        <input type="hidden" name="${esc(name)}" value="${esc(value || "")}">
        ${dropZoneHtml("Cover зураг чирж оруулна уу")}
        <div class="adm-img-row">
          ${previewHtml(value)}
          <div class="adm-img-actions">
            <label class="adm-btn sm adm-upload-btn">
              📤 Upload
              <input type="file" accept="image/*" hidden data-upload-input>
            </label>
            <button type="button" class="adm-btn sm" data-img-replace>🔄 Солих</button>
            <button type="button" class="adm-btn sm danger" data-img-remove>✕ Устгах</button>
          </div>
        </div>
      </div>`;
  }

  function fieldGallery(hiddenName, urls, label, folder, opts) {
    opts = opts || {};
    const list = Array.isArray(urls) ? urls : [];
    const coverField = opts.coverField || "";
    const coverUrl = opts.coverUrl || "";
    const items = list
      .map((u) => galleryItemHtml(u, coverField && u === coverUrl))
      .join("");
    return `
      <div class="adm-field full adm-img-gallery-field" data-img-field="gallery"
        data-hidden-name="${esc(hiddenName)}"
        data-folder="${esc(folder || FOLDERS.root)}"
        data-cover-field="${esc(coverField)}">
        <label>${esc(label)} <span class="adm-field-hint-inline">(★ cover сонгох · чирж эрэмбэлэх)</span></label>
        <input type="hidden" name="${esc(hiddenName)}" value="${esc(list.join("|"))}">
        ${dropZoneHtml("Gallery зураг чирж оруулна уу (олон)")}
        <div class="adm-gallery-grid">${items}</div>
        <div class="adm-img-actions" style="margin-top:8px">
          <label class="adm-btn sm adm-upload-btn">
            📤 Зураг нэмэх
            <input type="file" accept="image/*" hidden data-gallery-input multiple>
          </label>
        </div>
      </div>`;
  }

  function readCover(backdrop, name) {
    return backdrop.querySelector(`[name="${name}"]`)?.value?.trim() || "";
  }

  function readGallery(backdrop, name) {
    const raw = backdrop.querySelector(`[name="${name}"]`)?.value || "";
    return String(raw).split("|").map((s) => s.trim()).filter(Boolean);
  }

  function syncGalleryHidden(field) {
    const hidden = field.querySelector('input[type="hidden"][name]');
    const urls = [...field.querySelectorAll(".adm-gallery-item")].map((el) => el.dataset.url);
    if (hidden) hidden.value = urls.join("|");
  }

  function setCoverInModal(backdrop, coverFieldName, url) {
    const hidden = backdrop.querySelector(`[name="${coverFieldName}"]`);
    if (hidden) hidden.value = url || "";
    const coverWrap = backdrop.querySelector(`[data-cover-name="${coverFieldName}"]`);
    if (coverWrap) {
      const preview = coverWrap.querySelector(".adm-img-preview, .adm-img-empty");
      if (preview) {
        preview.outerHTML = previewHtml(url);
      }
    }
    backdrop.querySelectorAll(`[data-cover-field="${coverFieldName}"] .adm-gallery-item`).forEach((el) => {
      const isCover = el.dataset.url === url;
      el.classList.toggle("is-cover", isCover);
      let badge = el.querySelector(".adm-cover-badge");
      if (isCover && !badge) {
        badge = document.createElement("span");
        badge.className = "adm-cover-badge";
        badge.textContent = "Cover";
        el.prepend(badge);
      } else if (!isCover && badge) {
        badge.remove();
      }
    });
  }

  function bindDropZone(zone, onFiles) {
    if (!zone) return;
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", (e) => {
      if (!zone.contains(e.relatedTarget)) zone.classList.remove("drag-over");
    });
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith("image/"));
      if (files.length) onFiles(files);
    });
  }

  function appendGalleryItem(field, grid, url, backdrop) {
    const coverField = field.dataset.coverField;
    const coverVal = coverField ? readCover(backdrop, coverField) : "";
    const item = document.createElement("div");
    item.innerHTML = galleryItemHtml(url, coverField && url === coverVal);
    const el = item.firstElementChild;
    bindGalleryItem(el, field, grid, backdrop);
    grid.appendChild(el);
    syncGalleryHidden(field);
  }

  function bindGalleryItem(item, field, grid, backdrop) {
    const folder = field.dataset.folder || FOLDERS.root;
    const coverField = field.dataset.coverField;

    item.querySelector("[data-remove]")?.addEventListener("click", () => {
      const wasCover = item.classList.contains("is-cover");
      const url = item.dataset.url;
      item.remove();
      syncGalleryHidden(field);
      if (wasCover && coverField) {
        const next = field.querySelector(".adm-gallery-item");
        setCoverInModal(backdrop, coverField, next?.dataset.url || "");
      }
    });

    item.querySelector("[data-set-cover]")?.addEventListener("click", () => {
      if (!coverField) {
        window.AdminCore?.toast?.("Cover талбар холбогдоогүй", true);
        return;
      }
      setCoverInModal(backdrop, coverField, item.dataset.url);
    });

    item.querySelector("[data-move-left]")?.addEventListener("click", () => {
      const prev = item.previousElementSibling;
      if (prev) grid.insertBefore(item, prev);
      syncGalleryHidden(field);
    });

    item.querySelector("[data-move-right]")?.addEventListener("click", () => {
      const next = item.nextElementSibling;
      if (next) grid.insertBefore(next, item);
      syncGalleryHidden(field);
    });

    const replaceInput = item.querySelector("[data-replace-input]");
    item.querySelector("[data-replace]")?.addEventListener("click", () => replaceInput?.click());
    replaceInput?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      try {
        const url = await upload(file, folder);
        const wasCover = item.classList.contains("is-cover");
        item.dataset.url = url;
        const img = item.querySelector("img");
        if (img) img.src = thumbUrl(url);
        syncGalleryHidden(field);
        if (wasCover && coverField) setCoverInModal(backdrop, coverField, url);
        window.AdminCore?.toast?.("Cloudinary-д солигдлоо");
      } catch (err) {
        window.AdminCore?.toast?.(err.message || "Upload алдаа", true);
      }
    });

    item.addEventListener("dragstart", (e) => {
      item.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", item.dataset.url);
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
  }

  function bindGallerySort(grid, field) {
    let dragEl = null;
    grid.addEventListener("dragover", (e) => {
      e.preventDefault();
      const after = getDragAfterElement(grid, e.clientY);
      const dragging = grid.querySelector(".dragging");
      if (!dragging) return;
      if (after == null) grid.appendChild(dragging);
      else grid.insertBefore(dragging, after);
    });
    grid.addEventListener("drop", () => syncGalleryHidden(field));

    function getDragAfterElement(container, y) {
      const els = [...container.querySelectorAll(".adm-gallery-item:not(.dragging)")];
      return els.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
          }
          return closest;
        },
        { offset: Number.NEGATIVE_INFINITY, element: null }
      ).element;
    }
  }

  async function uploadFiles(files, folder, onEach) {
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const url = await upload(file, folder);
        await onEach(url, file);
      } catch (err) {
        window.AdminCore?.toast?.(err.message || "Upload алдаа", true);
        break;
      }
    }
  }

  function bindModal(backdrop) {
    backdrop.querySelectorAll('[data-img-field="cover"]').forEach((field) => {
      const hidden = field.querySelector('input[type="hidden"]');
      const folder = field.dataset.folder || FOLDERS.root;
      const coverName = field.dataset.coverName;

      const setUrl = (url) => {
        if (hidden) hidden.value = url || "";
        const preview = field.querySelector(".adm-img-preview, .adm-img-empty");
        if (preview) preview.outerHTML = previewHtml(url);
        backdrop.querySelectorAll(`[data-cover-field="${coverName}"] .adm-gallery-item`).forEach((el) => {
          el.classList.toggle("is-cover", el.dataset.url === url);
        });
      };

      const doUpload = async (file) => {
        if (!file) return;
        try {
          const url = await upload(file, folder);
          setUrl(url);
          window.AdminCore?.toast?.("Cloudinary-д хадгалагдлаа");
        } catch (err) {
          window.AdminCore?.toast?.(err.message || "Upload алдаа", true);
        }
      };

      bindDropZone(field.querySelector("[data-drop-zone]"), (files) => doUpload(files[0]));

      field.querySelector("[data-upload-input]")?.addEventListener("change", (e) => {
        doUpload(e.target.files?.[0]);
        e.target.value = "";
      });
      field.querySelector("[data-img-replace]")?.addEventListener("click", () => {
        field.querySelector("[data-upload-input]")?.click();
      });
      field.querySelector("[data-img-remove]")?.addEventListener("click", () => setUrl(""));
    });

    backdrop.querySelectorAll('[data-img-field="gallery"]').forEach((field) => {
      const grid = field.querySelector(".adm-gallery-grid");
      const folder = field.dataset.folder || FOLDERS.root;
      const coverField = field.dataset.coverField;

      const addUrl = (url) => {
        appendGalleryItem(field, grid, url, backdrop);
        if (coverField && !readCover(backdrop, coverField)) {
          setCoverInModal(backdrop, coverField, url);
        }
      };

      bindDropZone(field.querySelector("[data-drop-zone]"), (files) => {
        uploadFiles(files, folder, (url) => {
          addUrl(url);
          window.AdminCore?.toast?.("Cloudinary-д нэмэгдлээ");
        });
      });

      field.querySelector("[data-gallery-input]")?.addEventListener("change", (e) => {
        const files = [...(e.target.files || [])];
        e.target.value = "";
        uploadFiles(files, folder, (url) => {
          addUrl(url);
          window.AdminCore?.toast?.("Cloudinary-д нэмэгдлээ");
        });
      });

      field.querySelectorAll(".adm-gallery-item").forEach((item) => {
        bindGalleryItem(item, field, grid, backdrop);
      });

      bindGallerySort(grid, field);
    });
  }

  window.AdminCloudinary = {
    FOLDERS,
    getConfig,
    upload,
    fieldCover,
    fieldGallery,
    readCover,
    readGallery,
    bindModal,
    thumbUrl
  };
})();
