import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useEdgeFunction } from "@/lib/supabase/useEdgeFunction"
import type { RecruitWithProgram } from "@/features/recruits/api"

export function ScheduleCallButton({
  recruit,
  compact = false,
}: {
  recruit: RecruitWithProgram
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [startTime, setStartTime] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const callEdgeFunction = useEdgeFunction()
  const queryClient = useQueryClient()

  async function handleSchedule() {
    if (!startTime) return
    setBusy(true)
    setError(null)
    try {
      await callEdgeFunction("zoom-schedule", {
        recruitId: recruit.id,
        startTime: new Date(startTime).toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ["recruit", recruit.id] })
      queryClient.invalidateQueries({ queryKey: ["activity_log", recruit.id] })
      setOpen(false)
      setStartTime("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule call")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        variant={compact ? "ghost" : "secondary"}
        className={compact ? "w-full px-1.5 py-1 text-xs" : ""}
        onClick={() => setOpen(true)}
      >
        {compact ? "Call" : recruit.zoom_meeting_link ? "Reschedule call" : "Schedule Onboarding Call"}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Schedule onboarding call">
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-zinc-600">Start time</label>
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <div className="text-xs text-zinc-400">Creates a 30 minute Zoom meeting.</div>
          {error && <div className="text-xs text-red-600">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSchedule} disabled={busy || !startTime}>
              {busy ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
