import { createClient } from "@supabase/supabase-js";

function getSupabaseConfig() {
  if (typeof window !== "undefined") {
    const customUrl = localStorage.getItem("custom_supabase_url");
    const customKey = localStorage.getItem("custom_supabase_anon_key");
    if (customUrl && customKey) {
      return {
        url: customUrl.trim(),
        key: customKey.trim(),
      };
    }
  }

  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

const config = getSupabaseConfig();

export const supabase = createClient(config.url, config.key);
export const Supabase = supabase;
export default supabase;
