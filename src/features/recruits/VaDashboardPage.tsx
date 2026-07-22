import { useState } from "react"
import { useAuth } from "@clerk/clerk-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { useRecruits } from "@/features/recruits/api"
import { usePrograms } from "@/features/programs/api"
import { KanbanBoard } from "./components/KanbanBoard"
import { NewRecruitDialog } from "./components/NewRecruitDialog"

export function VaDashboardPage() {
  const { userId } = useAuth()
  const [programId, setProgramId] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState("")
  const [newRecruitOpen, setNewRecruitOpen] = useState(false)

  const { data: programs } = usePrograms()
  const { data: recruits, isLoading } = useRecruits({
    programId,
    assignedVaId: userId ?? undefined,
    search: search || undefined,
  })

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-base font-semibold text-zinc-900">My Recruits</h1>
        <Button variant="primary" onClick={() => setNewRecruitOpen(true)}>
          + New recruit
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-4 py-2.5">
        <Select value={programId ?? ""} onChange={(e) => setProgramId(e.target.value || undefined)}>
          <option value="">All programs</option>
          {programs?.map((program) => (
            <option key={program.id} value={program.id}>{program.name}</option>
          ))}
        </Select>
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
          <KanbanBoard recruits={recruits ?? []} detailBasePath="/va/recruits" />
        )}
      </div>

      <NewRecruitDialog
        open={newRecruitOpen}
        onClose={() => setNewRecruitOpen(false)}
        defaultProgramId={programId}
      />
    </div>
  )
}
