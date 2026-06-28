/** Travel image URLs — Cloudinary secure_url only; local fallbacks when missing */
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
  const out = list
    .map((u) => resolveTravelImage(u, null))
    .filter((u) => u && u !== fb);
  return out.length ? out : [fb];
}

function pickCover(item, fallback) {
  const url =
    item?.cover_image_url ||
    item?.cover_image ||
    item?.hero_image ||
    item?.image_url ||
    null;
  return resolveTravelImage(url, fallback || FALLBACK.hotel);
}

function cdnUrl(url, opts = {}) {
  const fb = opts.fallback || FALLBACK.hotel;
  const raw = resolveTravelImage(url, fb);
  if (!isCloudinaryUrl(raw)) return raw;
  const w = opts.width || SIZES[opts.size] || SIZES.card;
  const h = opts.height;
  const parts = ["f_auto", "q_auto", `w_${w}`];
  if (h) parts.push(`h_${h}`, "c_fill");
  else parts.push("c_limit");
  const tfx = parts.join(",");
  return raw.replace("/image/upload/", `/image/upload/${tfx}/`);
}

module.exports = {
  FALLBACK,
  SIZES,
  isCloudinaryUrl,
  isBlockedUrl,
  resolveTravelImage,
  resolveGallery,
  pickCover,
  cdnUrl
};
