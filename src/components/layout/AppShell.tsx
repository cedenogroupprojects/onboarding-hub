import { NavLink, Outlet } from "react-router-dom"
import { UserButton } from "@clerk/clerk-react"
import { useRole } from "@/lib/auth/useRole"

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
  }`

export function AppShell() {
  const role = useRole()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-52 shrink-0 flex-col border-r border-zinc-200 bg-white px-3 py-4">
        <div className="mb-6 px-2">
          <div className="text-sm font-semibold text-zinc-900">Onboarding Hub</div>
          <div className="text-xs text-zinc-400">
            {role === "leadership" ? "Leadership" : "VA"}
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {role === "leadership" ? (
            <>
              <NavLink to="/leadership" end className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/leadership/templates" className={navLinkClass}>
                Templates
              </NavLink>
              <NavLink to="/leadership/stages" className={navLinkClass}>
                Stages
              </NavLink>
            </>
          ) : (
            <NavLink to="/va" end className={navLinkClass}>
              My Recruits
            </NavLink>
          )}
        </nav>

        <div className="mt-auto flex items-center gap-2 px-2 pt-4">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
