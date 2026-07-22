import { useMemo } from "react"
import { useSession } from "@clerk/clerk-react"
import { createClerkSupabaseClient } from "./client"

/** Supabase client scoped to the signed-in Clerk user; RLS enforces per-role access. */
export function useSupabase() {
  const { session } = useSession()

  return useMemo(
    () => createClerkSupabaseClient(async () => (session ? session.getToken() : null)),
    [session],
  )
}
