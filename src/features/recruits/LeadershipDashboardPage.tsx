import { useMemo, useState } from "react"
import { Button } from "@/components/ui/Button"
import { useRecruits, useMoveRecruitStage, type RecruitFilters } from "@/features/recruits/api"
import { useStages } from "@/features/stages/api"
import { KanbanBoard } from "./components/KanbanBoard"
import { RecruitTable } from "./components/RecruitTable"
import { FiltersBar } from "./components/FiltersBar"
import { NewRecruitDialog } from "./components/NewRecruitDialog"

export function LeadershipDashboardPage() {
  const [view, setView] = useState<"table" | "kanban">("table")
  const [filters, setFilters] = useState<RecruitFilters>({})
  const [newRecruitOpen, setNewRecruitOpen] = useState(false)

  const kanbanTrack = filters.track ?? "team"
  const { data: kanbanStages } = useStages(view === "kanban" ? kanbanTrack : undefined)
  const { data: allStages } = useStages()
  const { data: recruits, isLoading } = useRecruits(
    view === "kanban" ? { ...filters, track: kanbanTrack, stageId: undefined } : filters,
  )
  const moveStage = useMoveRecruitStage()

  const stagesByTrack = useMemo(() => {
    const map: Record<string, typeof allStages> = {}
    for (const stage of allStages ?? []) {
      map[stage.track] = [...(map[stage.track] ?? []), stage]
    }
    return map as Record<string, NonNullable<typeof allStages>>
  }, [allStages])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-base font-semibold text-zinc-900">Recruits</h1>
        <Button variant="primary" onClick={() => setNewRecruitOpen(true)}>
          + New recruit
        </Button>
      </div>

      <FiltersBar
        filters={filters}
        onChange={setFilters}
        stages={stagesByTrack[filters.track ?? ""] ?? []}
        view={view}
        onViewChange={setView}
      />

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-zinc-400">Loading recruits...</div>
        ) : view === "kanban" ? (
          <KanbanBoard
            stages={kanbanStages ?? []}
            recruits={recruits ?? []}
            detailBasePath="/recruits"
            onMoveStage={(recruitId, stageId) => moveStage.mutate({ recruitId, stageId })}
          />
        ) : (
          <RecruitTable
            recruits={recruits ?? []}
            stagesByTrack={stagesByTrack}
            onMoveStage={(recruitId, stageId) => moveStage.mutate({ recruitId, stageId })}
          />
        )}
      </div>

      <NewRecruitDialog open={newRecruitOpen} onClose={() => setNewRecruitOpen(false)} />
    </div>
  )
}
