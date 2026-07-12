/**
 * API base URL for Capacitor — routes /.netlify/functions to production server.
 * Web build is unchanged; native app never embeds secret keys.
 */
(function (root) {
  const PRODUCTION_ORIGIN = "https://esimmongolia.com";
  const native = !!(root.Capacitor && root.Capacitor.isNativePlatform && root.Capacitor.isNativePlatform());

  function apiBase() {
    return native ? PRODUCTION_ORIGIN : "";
  }

  function apiUrl(path) {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path;
    const base = apiBase();
    if (!base) return path;
    return base + (path.startsWith("/") ? path : "/" + path);
  }

  root.ESM_API_BASE = apiBase();
  root.esmApiUrl = apiUrl;
  root.ESM_IS_NATIVE_APP = native;

  if (!native) return;

  const originalFetch = root.fetch.bind(root);
  root.fetch = function (input, init) {
    try {
      if (typeof input === "string" && input.startsWith("/.netlify/")) {
        return originalFetch(apiUrl(input), init);
      }
      if (input instanceof Request) {
        const u = input.url;
        const isRelativeApi = u.startsWith("/.netlify/") ||
          (u.startsWith("https://app.esimmongolia.local/.netlify/"));
        if (isRelativeApi) {
          const fixed = u.replace(/^https?:\/\/[^/]+/, "") ;
          return originalFetch(apiUrl(fixed), init);
        }
      }
    } catch (e) {
      console.warn("[api-config] fetch patch", e);
    }
    return originalFetch(input, init);
  };
})(typeof window !== "undefined" ? window : global);
