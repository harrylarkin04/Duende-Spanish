import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Browser Supabase client for Client Components (auth, realtime, etc.).
 * Returns null when env is missing so prerender/CI builds do not throw.
 */
export function createClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[duende] Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
      );
    }
    return null;
  }

  return createBrowserClient<Database>(url, anonKey);
}
