const { createClient } = require("@supabase/supabase-js");

// Polyfill for Node.js < 22 where WebSocket is experimental or absent,
// preventing Supabase Realtime from crashing during client initialization.
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {};
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("🟢 Supabase client initialized for Storage");
} else {
  console.warn("⚠️ SUPABASE_URL or SUPABASE_KEY is missing. Supabase upload is disabled.");
}

module.exports = supabase;
