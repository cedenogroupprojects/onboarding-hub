import { useUser } from "@clerk/clerk-react"
import type { Role } from "@/types/domain"

/** Reads the VA/Leadership role from Clerk publicMetadata.role. */
export function useRole(): Role | null {
  const { user } = useUser()
  const role = user?.publicMetadata?.role
  return role === "va" || role === "leadership" ? role : null
}
