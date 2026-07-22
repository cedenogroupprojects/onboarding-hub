import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { useRecruits, type RecruitFilters } from "@/features/recruits/api"
import { KanbanBoard } from "./components/KanbanBoard"
import { RecruitTable } from "./components/RecruitTable"
import { FiltersBar } from "./components/FiltersBar"
import { NewRecruitDialog } from "./components/NewRecruitDialog"

export function LeadershipDashboardPage() {
  const [view, setView] = useState<"table" | "kanban">("table")
  const [filters, setFilters] = useState<RecruitFilters>({})
  const [newRecruitOpen, setNewRecruitOpen] = useState(false)

  const { data: recruits, isLoading } = useRecruits(filters)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-base font-semibold text-zinc-900">Recruits</h1>
        <Button variant="primary" onClick={() => setNewRecruitOpen(true)}>
          + New recruit
        </Button>
      </div>

      <FiltersBar filters={filters} onChange={setFilters} view={view} onViewChange={setView} />

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-zinc-400">Loading recruits...</div>
        ) : view === "kanban" ? (
          <KanbanBoard recruits={recruits ?? []} detailBasePath="/recruits" />
        ) : (
          <RecruitTable recruits={recruits ?? []} />
        )}
      </div>

      <NewRecruitDialog open={newRecruitOpen} onClose={() => setNewRecruitOpen(false)} />
    </div>
  )
}
