import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/Button"
import { useMoveRecruitStage } from "@/features/recruits/api"
import { useStages } from "@/features/stages/api"
import { useEdgeFunction } from "@/lib/supabase/useEdgeFunction"
import type { RecruitWithStage } from "@/features/recruits/api"

/** Team-track only: moves the recruit to "Onboarded" and pushes a row to the configured Google Sheet. */
export function MarkOnboardedButton({ recruit }: { recruit: RecruitWithStage }) {
  const { data: stages } = useStages("team")
  const moveStage = useMoveRecruitStage()
  const callEdgeFunction = useEdgeFunction()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onboardedStage = stages?.find((s) => s.name === "Onboarded")
  const alreadyOnboarded = recruit.stage.name === "Onboarded"

  async function handleClick() {
    if (!onboardedStage) return
    setError(null)
    setBusy(true)
    try {
      if (recruit.stage_id !== onboardedStage.id) {
        await moveStage.mutateAsync({ recruitId: recruit.id, stageId: onboardedStage.id })
      }
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
          {alreadyOnboarded ? "Onboarded" : "Not yet marked onboarded"}
        </span>
        <Button variant="primary" onClick={handleClick} disabled={busy || !onboardedStage}>
          {busy ? "Syncing..." : "Mark Onboarded"}
        </Button>
      </div>
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  )
}
