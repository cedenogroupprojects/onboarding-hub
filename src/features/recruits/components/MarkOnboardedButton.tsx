import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/Button"
import { useEdgeFunction } from "@/lib/supabase/useEdgeFunction"
import type { RecruitWithProgram } from "@/features/recruits/api"

/**
 * Only rendered for recruits in a program with sheet_sync_enabled. `onboarded_at` is set
 * automatically once every required checklist item is checked off; this button pushes
 * that recruit's row to the configured Google Sheet.
 */
export function MarkOnboardedButton({ recruit }: { recruit: RecruitWithProgram }) {
  const callEdgeFunction = useEdgeFunction()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    setBusy(true)
    try {
      await callEdgeFunction("sheets-sync", { recruitId: recruit.id })
      queryClient.invalidateQueries({ queryKey: ["activity_log", recruit.id] })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync to sheet")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="mb-1 text-xs font-medium text-zinc-500">Onboarding</div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600">
          {recruit.onboarded_at ? "All required tasks complete" : "Required tasks still pending"}
        </span>
        <Button variant="primary" onClick={handleClick} disabled={busy || !recruit.onboarded_at}>
          {busy ? "Syncing..." : "Push to Sheet"}
        </Button>
      </div>
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  )
}
