import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@clerk/clerk-react"

export function RequireAuth() {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()

  if (!isLoaded) return null

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  return <Outlet />
}
