/**
 * Customer travel images — Cloudinary CDN + local fallback only
 * f_auto / q_auto for WebP/AVIF; responsive widths for 20k+ hotel scale
 */
(function (root) {
  const BLOCKED_HOST =
    /googleusercontent|google\.com|gstatic\.com|trip\.com|booking\.com|agoda\.com|expedia\.com|tripadvisor|ctrip|hotels\.com|trivago/i;

  const FALLBACK = {
    hotel: "/images/hotels/exterior-01.jpg",
    city: "/images/china/guide/hero.jpg",
    country: "/images/china/guide/hero.jpg",
    attraction: "/images/routes/china/panda.jpg",
    rental: "/images/routes/vietnam/hoian.jpg",
    room: "/images/hotels/standard_room-01.jpg",
    train: "/images/china/guide/transport-hsr.jpg",
    flight: "/images/routes/china/shanghai-bund.jpg",
    insurance: "/images/china/guide/route-asia.jpg",
    esim: "/images/china/guide/internet.jpg"
  };

  const SIZES = { thumb: 200, card: 480, hero: 960, full: 1600 };

  function isCloudinaryUrl(url) {
    return /res\.cloudinary\.com/i.test(String(url || ""));
  }

  function isLocalAsset(url) {
    return String(url || "").startsWith("/");
  }

  function isBlockedUrl(url) {
    return BLOCKED_HOST.test(String(url || ""));
  }

  function resolveTravelImage(url, fallback) {
    const fb = fallback || FALLBACK.hotel;
    if (!url) return fb;
    const s = String(url).trim();
    if (isBlockedUrl(s)) return fb;
    if (isCloudinaryUrl(s)) return s;
    if (isLocalAsset(s)) return s;
    return fb;
  }

  function resolveGallery(urls, fallback) {
    const fb = fallback || FALLBACK.hotel;
    const list = Array.isArray(urls) ? urls : [];
    const cleaned = list
      .map((u) => resolveTravelImage(u, null))
      .filter((u) => u && u !== fb);
    return cleaned.length ? cleaned : [fb];
  }

  function pickCover(item, kind) {
    const fb = FALLBACK[kind] || FALLBACK.hotel;
    const url =
      item?.cover_image_url ||
      item?.cover_image ||
      item?.hero_image ||
      item?.image_url ||
      null;
    return resolveTravelImage(url, fb);
  }

  /** Inject Cloudinary transforms — f_auto,q_auto for WebP/AVIF */
  function cdnUrl(url, opts) {
    opts = opts || {};
    const kind = opts.kind || "hotel";
    const fb = opts.fallback || FALLBACK[kind] || FALLBACK.hotel;
    const raw = resolveTravelImage(url, fb);
    if (!isCloudinaryUrl(raw)) return raw;

    const w = opts.width || SIZES[opts.size] || SIZES.card;
    const h = opts.height;
    const parts = ["f_auto", "q_auto", `w_${w}`];
    if (h) {
      parts.push(`h_${h}`, "c_fill");
    } else {
      parts.push("c_limit");
    }
    const tfx = parts.join(",");
    if (raw.includes("/image/upload/")) {
      return raw.replace("/image/upload/", `/image/upload/${tfx}/`);
    }
    return raw;
  }

  function srcSet(url, widths, kind) {
    const raw = resolveTravelImage(url, null);
    if (!isCloudinaryUrl(raw)) return "";
    const list = widths || [320, 480, 640, 960, 1280];
    return list.map((w) => `${cdnUrl(raw, { width: w, kind })} ${w}w`).join(", ");
  }

  function escAttr(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function imgTag(url, opts) {
    opts = opts || {};
    const kind = opts.kind || "hotel";
    const alt = opts.alt || "";
    const cls = opts.className || opts.class || "";
    const size = opts.size || "card";
    const sizes = opts.sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px";
    const fb = FALLBACK[kind] || FALLBACK.hotel;
    const src = cdnUrl(url, { size, kind, fallback: fb });
    const raw = resolveTravelImage(url, null);
    const ss = isCloudinaryUrl(raw) ? srcSet(raw, opts.widths, kind) : "";
    const onerr = ` onerror="this.onerror=null;this.src='${escAttr(fb)}'"`;
    return `<img class="${escAttr(cls)}" src="${escAttr(src)}"${
      ss ? ` srcset="${escAttr(ss)}" sizes="${escAttr(sizes)}"` : ""
    } alt="${escAttr(alt)}" loading="lazy" decoding="async"${onerr}>`;
  }

  root.TravelImages = {
    FALLBACK,
    SIZES,
    isCloudinaryUrl,
    isBlockedUrl,
    resolveTravelImage,
    resolveGallery,
    pickCover,
    cdnUrl,
    srcSet,
    imgTag
  };
})(typeof window !== "undefined" ? window : globalThis);
