import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/interface/index.interface";

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_URL : "") ||
  "";

const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_ANON_KEY : "") ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Please verify your .env file.",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default supabase;
