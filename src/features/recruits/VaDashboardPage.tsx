import { useState } from "react"
import { useAuth } from "@clerk/clerk-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useRecruits, useMoveRecruitStage } from "@/features/recruits/api"
import { useStages } from "@/features/stages/api"
import { KanbanBoard } from "./components/KanbanBoard"
import { NewRecruitDialog } from "./components/NewRecruitDialog"
import { TRACK_LABELS } from "@/types/domain"
import type { Track } from "@/types/domain"

const TRACKS = Object.keys(TRACK_LABELS) as Track[]

export function VaDashboardPage() {
  const { userId } = useAuth()
  const [track, setTrack] = useState<Track>("team")
  const [search, setSearch] = useState("")
  const [newRecruitOpen, setNewRecruitOpen] = useState(false)

  const { data: stages } = useStages(track)
  const { data: recruits, isLoading } = useRecruits({
    track,
    assignedVaId: userId ?? undefined,
    search: search || undefined,
  })
  const moveStage = useMoveRecruitStage()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-base font-semibold text-zinc-900">My Recruits</h1>
        <Button variant="primary" onClick={() => setNewRecruitOpen(true)}>
          + New recruit
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-4 py-2.5">
        <div className="flex overflow-hidden rounded-md border border-zinc-300">
          {TRACKS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrack(t)}
              className={`px-3 py-1.5 text-sm font-medium ${track === t ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
            >
              {TRACK_LABELS[t]}
            </button>
          ))}
        </div>
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-zinc-400">Loading recruits...</div>
        ) : (
          <KanbanBoard
            stages={stages ?? []}
            recruits={recruits ?? []}
            detailBasePath="/va/recruits"
            onMoveStage={(recruitId, stageId) => moveStage.mutate({ recruitId, stageId })}
          />
        )}
      </div>

      <NewRecruitDialog
        open={newRecruitOpen}
        onClose={() => setNewRecruitOpen(false)}
        defaultTrack={track}
      />
    </div>
  )
}
