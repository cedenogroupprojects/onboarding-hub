import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY - check your .env.local",
  )
}

/**
 * Creates a Supabase client that forwards the caller's Clerk session token as the
 * Supabase JWT, so RLS policies (see supabase/migrations/0001_schema.sql) can read
 * auth.jwt()->>'sub' and auth.jwt()->'public_metadata'->>'role'.
 */
export function createClerkSupabaseClient(getToken: () => Promise<string | null>) {
  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    accessToken: async () => (await getToken()) ?? null,
  })
}
