/**
 * Supabase entrypoints for Duende.
 * Browser: `createClient` from `./supabase/client`.
 * Server: `createServerSupabaseClient` from `./supabase/server`.
 */
export { createClient } from "./supabase/client";
export { createServerSupabaseClient, isSupabaseConfigured } from "./supabase/server";
