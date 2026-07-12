/**
 * Register FCM device tokens — server-side only.
 * POST /.netlify/functions/push-register
 * Body: { token, platform, app_id }
 *
 * Tokens are logged for now; wire to Supabase `push_tokens` when ready.
 * Never expose FCM server keys to the mobile bundle.
 */
const { getSupabase } = require("./lib/supabase-client");

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

function respond(status, body) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", ...cors() },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(), body: "" };
  }
  if (event.httpMethod !== "POST") {
    return respond(405, { success: false, error: "method_not_allowed" });
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return respond(400, { success: false, error: "invalid_json" });
  }

  const token = String(payload.token || "").trim();
  const platform = String(payload.platform || "unknown");
  const appId = String(payload.app_id || "com.esimmongolia.app");

  if (!token || token.length < 20) {
    return respond(400, { success: false, error: "invalid_token" });
  }

  const record = {
    token,
    platform,
    app_id: appId,
    updated_at: new Date().toISOString()
  };

  console.log("[push-register]", { platform, appId, token_prefix: token.slice(0, 12) + "…" });

  const sb = getSupabase("push-register");
  if (sb) {
    try {
      const { error } = await sb.from("push_tokens").upsert(record, { onConflict: "token" });
      if (error && !/push_tokens|relation/i.test(error.message)) {
        console.warn("[push-register] supabase:", error.message);
      } else if (!error) {
        return respond(200, { success: true, stored: "supabase" });
      }
    } catch (e) {
      console.warn("[push-register] supabase skip:", e.message);
    }
  }

  return respond(200, { success: true, stored: "log_only" });
};
