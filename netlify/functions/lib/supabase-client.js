/** Shared Supabase client — esimmongolia project, esm_* tables only */
let client = null;
let missingEnvLogged = false;

function getMissingSupabaseEnv() {
  const missing = [];
  if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  return missing;
}

function logMissingSupabaseEnv(context) {
  const missing = getMissingSupabaseEnv();
  if (!missing.length || missingEnvLogged) return;
  missingEnvLogged = true;
  const prefix = context ? `[${context}] ` : "";
  console.error(
    `${prefix}Supabase env not configured. Set in Netlify: ${missing.join(", ")}. ` +
    "Use SUPABASE_SERVICE_ROLE_KEY on the server only (never in frontend code)."
  );
}

function getSupabase(context) {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    logMissingSupabaseEnv(context || "supabase-client");
    return null;
  }

  try {
    const { createClient } = require("@supabase/supabase-js");
    client = createClient(url, key);
    return client;
  } catch (err) {
    console.error(`[${context || "supabase-client"}] Failed to create Supabase client:`, err.message || err);
    return null;
  }
}

module.exports = { getSupabase, getMissingSupabaseEnv, logMissingSupabaseEnv };
