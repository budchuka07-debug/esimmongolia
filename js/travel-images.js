/**
 * Customer travel images — Cloudinary secure_url + local fallback only
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
    room: "/images/hotels/standard_room-01.jpg"
  };

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

  root.TravelImages = {
    FALLBACK,
    isCloudinaryUrl,
    isBlockedUrl,
    resolveTravelImage,
    resolveGallery,
    pickCover
  };
})(typeof window !== "undefined" ? window : globalThis);
