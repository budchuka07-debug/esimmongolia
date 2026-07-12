/**
 * Attraction catalog API — hybrid Supabase + local mock.
 * POST/GET /.netlify/functions/attraction-catalog
 * Always HTTP 200 + JSON.
 */
const { getSupabase } = require("./lib/supabase-client");
const { hybridAttractionSearch, TARGET_TOTAL, MAX_TOTAL, PAGE_SIZE_DEFAULT } = require("./lib/attraction-search-lib");
const { buildSearchCtxFast } = require("./lib/travel-ai-tools");
const { ATTRACTION_CATEGORIES } = require("./lib/attraction-mock");

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };
}

function respond(body) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", ...cors() },
    body: JSON.stringify(body)
  };
}

function parseParams(event) {
  let params = {};
  if (event.httpMethod === "GET") {
    params = event.queryStringParameters || {};
  } else {
    try {
      params = JSON.parse(event.body || "{}");
    } catch {
      return { error: "invalid_json" };
    }
  }
  return { params };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(), body: "" };
  }

  const started = Date.now();
  const parsed = parseParams(event);
  if (parsed.error) {
    return respond({
      success: false,
      error: parsed.error,
      attractions: [],
      real_count: 0,
      mock_count: 0,
      total: 0,
      source: "error"
    });
  }

  const params = parsed.params;
  const sb = getSupabase("attraction-catalog");

  try {
    const ctx = await buildSearchCtxFast(sb, params.city_id, params.city);
    if (!ctx) {
      return respond({
        success: false,
        error: "city_not_found",
        attractions: [],
        real_count: 0,
        mock_count: 0,
        total: 0,
        source: "error",
        categories: ATTRACTION_CATEGORIES
      });
    }

    params._resolvedCitySlug = ctx.resolvedSlug || params.city_id;
    params.city_id = params._resolvedCitySlug;
    params.page = Number(params.page || 1);
    params.pageSize = Math.min(MAX_TOTAL, Number(params.pageSize || PAGE_SIZE_DEFAULT));
    params.minTarget = Math.min(MAX_TOTAL, Number(params.minTarget) || TARGET_TOTAL);
    if (params.people) params.visitors = Number(params.people);

    const payload = await hybridAttractionSearch(sb, params, ctx);
    const attractions = payload.attractions || [];
    const meta = payload.meta || {};

    return respond({
      success: meta.success !== false && !meta.error,
      error: meta.error || null,
      attractions,
      results: attractions,
      real_count: meta.real_count ?? 0,
      mock_count: meta.mock_count ?? attractions.filter((a) => a.is_mock || a.source === "local_mock").length,
      total: meta.total ?? attractions.length,
      source: meta.source || "local_mock",
      meta,
      categories: ATTRACTION_CATEGORIES,
      elapsed_ms: Date.now() - started
    });
  } catch (err) {
    console.error("[attraction-catalog]", err.message);
    try {
      const { buildOfflineSearchCtx } = require("./lib/asia-catalog-fallback");
      const { hybridAttractionSearch: hybrid } = require("./lib/attraction-search-lib");
      const citySlug = parsed.params.city_id || parsed.params.city || "shanghai";
      const offline = buildOfflineSearchCtx(citySlug);
      if (offline) {
        const payload = await hybrid(null, { ...parsed.params, city_id: citySlug, page: 1, pageSize: 12, minTarget: 60 }, offline);
        const attractions = payload.attractions || [];
        return respond({
          success: true,
          error: null,
          attractions,
          results: attractions,
          real_count: 0,
          mock_count: attractions.length,
          total: payload.meta?.total ?? attractions.length,
          source: "local_mock",
          meta: payload.meta,
          categories: ATTRACTION_CATEGORIES,
          elapsed_ms: Date.now() - started
        });
      }
    } catch (fallbackErr) {
      console.error("[attraction-catalog] fallback failed", fallbackErr.message);
    }
    return respond({
      success: false,
      error: err.message || "attraction_search_error",
      attractions: [],
      real_count: 0,
      mock_count: 0,
      total: 0,
      source: "error",
      categories: ATTRACTION_CATEGORIES,
      elapsed_ms: Date.now() - started
    });
  }
};
