import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useRole } from "@/lib/auth/useRole"
import type { Role } from "@/types/domain"

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const currentRole = useRole()

  if (currentRole === null) return <Navigate to="/no-role" replace />
  if (currentRole !== role) {
    return <Navigate to={currentRole === "leadership" ? "/leadership" : "/va"} replace />
  }

  return <>{children}</>
}
