/** Shared Supabase client — esimmongolia project, esm_* tables only */
let client = null;

function getSupabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const { createClient } = require("@supabase/supabase-js");
    client = createClient(url, key);
    return client;
  } catch {
    return null;
  }
}

module.exports = { getSupabase };
