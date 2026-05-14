"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabaseEnv } from "./env";

let cached: SupabaseClient<Database> | null = null;

export function createClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const { url, anon } = supabaseEnv();
  cached = createBrowserClient<Database>(url, anon);
  return cached;
}
