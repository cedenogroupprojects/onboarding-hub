import { UserButton } from "@clerk/clerk-react"

export function NoRoleAssignedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
      <h1 className="text-lg font-semibold text-zinc-900">No role assigned yet</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        Your account is signed in but doesn't have a VA or Leadership role yet. Ask a
        Leadership team member to set your role in Clerk before you can access the hub.
      </p>
      <UserButton afterSignOutUrl="/sign-in" />
    </div>
  )
}
