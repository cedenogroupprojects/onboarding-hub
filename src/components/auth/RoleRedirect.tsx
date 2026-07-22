import { Navigate } from "react-router-dom"
import { useRole } from "@/lib/auth/useRole"

export function RoleRedirect() {
  const role = useRole()

  if (role === null) return <Navigate to="/no-role" replace />
  return <Navigate to={role === "leadership" ? "/leadership" : "/va"} replace />
}
