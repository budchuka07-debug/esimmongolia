/**
 * Admin Cloudinary upload — unsigned preset via Netlify public config
 */
(function () {
  let configPromise = null;

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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
    if (folder) fd.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud_name}/image/upload`, {
      method: "POST",
      body: fd
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url;
  }

  function previewHtml(url, fallback) {
    const src = url || fallback || "";
    if (!src) return `<div class="adm-img-preview adm-img-empty">Зураг байхгүй</div>`;
    return `<img class="adm-img-preview" src="${esc(src)}" alt="" loading="lazy">`;
  }

  function fieldCover(name, value, label, folder) {
    return `
      <div class="adm-field adm-img-field" data-img-field="cover" data-folder="${esc(folder)}">
        <label>${esc(label)}</label>
        <input type="hidden" name="${esc(name)}" value="${esc(value || "")}">
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
        <div class="adm-field-hint">Cloudinary CDN — Google/Trip/Booking URL хориотой</div>
      </div>`;
  }

  function fieldGallery(hiddenName, urls, label, folder) {
    const list = Array.isArray(urls) ? urls : [];
    const items = list.map((u) => `
      <div class="adm-gallery-item" data-url="${esc(u)}">
        <img src="${esc(u)}" alt="" loading="lazy">
        <button type="button" class="adm-gallery-remove" title="Устгах">✕</button>
      </div>`).join("");
    return `
      <div class="adm-field full adm-img-gallery-field" data-img-field="gallery" data-hidden-name="${esc(hiddenName)}" data-folder="${esc(folder)}">
        <label>${esc(label)}</label>
        <input type="hidden" name="${esc(hiddenName)}" value="${esc(list.join("|"))}">
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

  function syncGalleryHidden(wrap) {
    const hidden = wrap.querySelector('input[type="hidden"]');
    const urls = [...wrap.querySelectorAll(".adm-gallery-item")].map((el) => el.dataset.url);
    if (hidden) hidden.value = urls.join("|");
  }

  function bindModal(backdrop) {
    backdrop.querySelectorAll('[data-img-field="cover"]').forEach((field) => {
      const hidden = field.querySelector('input[type="hidden"]');
      const folder = field.dataset.folder || "esimmongolia";

      const setUrl = (url) => {
        if (hidden) hidden.value = url || "";
        const preview = field.querySelector(".adm-img-preview, .adm-img-empty");
        if (!preview) return;
        if (url) {
          preview.outerHTML = previewHtml(url);
        } else {
          preview.outerHTML = `<div class="adm-img-preview adm-img-empty">Зураг байхгүй</div>`;
        }
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
      const folder = field.dataset.folder || "esimmongolia";

      field.querySelector("[data-gallery-input]")?.addEventListener("change", async (e) => {
        const files = [...(e.target.files || [])];
        e.target.value = "";
        for (const file of files) {
          try {
            const url = await upload(file, folder);
            const item = document.createElement("div");
            item.className = "adm-gallery-item";
            item.dataset.url = url;
            item.innerHTML = `<img src="${esc(url)}" alt="" loading="lazy"><button type="button" class="adm-gallery-remove" title="Устгах">✕</button>`;
            item.querySelector(".adm-gallery-remove").addEventListener("click", () => {
              item.remove();
              syncGalleryHidden(field);
            });
            grid?.appendChild(item);
            syncGalleryHidden(field);
          } catch (err) {
            window.AdminCore?.toast?.(err.message || "Upload алдаа", true);
            break;
          }
        }
      });

      field.querySelectorAll(".adm-gallery-remove").forEach((btn) => {
        btn.addEventListener("click", () => {
          btn.closest(".adm-gallery-item")?.remove();
          syncGalleryHidden(field);
        });
      });
    });
  }

  window.AdminCloudinary = {
    getConfig,
    upload,
    fieldCover,
    fieldGallery,
    readCover,
    readGallery,
    bindModal
  };
})();
