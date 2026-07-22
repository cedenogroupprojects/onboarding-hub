import { useQuery } from "@tanstack/react-query"
import { useEdgeFunction } from "@/lib/supabase/useEdgeFunction"

export interface VaUser {
  id: string
  name: string
  email: string | null
}

/** Leadership-only directory of VA users, sourced live from Clerk. */
export function useVaUsers() {
  const callEdgeFunction = useEdgeFunction()

  return useQuery({
    queryKey: ["team", "vas"],
    queryFn: () => callEdgeFunction<{ vas: VaUser[] }>("list-team-users").then((r) => r.vas),
    staleTime: 5 * 60_000,
  })
}
