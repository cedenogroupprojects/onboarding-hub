import { Select } from "@/components/ui/Select"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { TRACK_LABELS, SOURCE_LABELS } from "@/types/domain"
import { useVaUsers } from "@/features/team/api"
import type { RecruitFilters } from "@/features/recruits/api"
import type { Stage, Track } from "@/types/domain"

export function FiltersBar({
  filters,
  onChange,
  stages,
  view,
  onViewChange,
}: {
  filters: RecruitFilters
  onChange: (filters: RecruitFilters) => void
  stages: Stage[]
  view: "table" | "kanban"
  onViewChange: (view: "table" | "kanban") => void
}) {
  const { data: vas } = useVaUsers()

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-4 py-2.5">
      <div className="flex overflow-hidden rounded-md border border-zinc-300">
        <button
          type="button"
          onClick={() => onViewChange("table")}
          className={`px-3 py-1.5 text-sm font-medium ${view === "table" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
        >
          Table
        </button>
        <button
          type="button"
          onClick={() => onViewChange("kanban")}
          className={`px-3 py-1.5 text-sm font-medium ${view === "kanban" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
        >
          Kanban
        </button>
      </div>

      <Select
        value={filters.track ?? ""}
        onChange={(e) => onChange({ ...filters, track: (e.target.value || undefined) as Track | undefined, stageId: undefined })}
      >
        <option value="">All tracks</option>
        {Object.entries(TRACK_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </Select>

      {view === "table" && (
        <Select
          value={filters.stageId ?? ""}
          onChange={(e) => onChange({ ...filters, stageId: e.target.value || undefined })}
        >
          <option value="">All stages</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>{stage.name}</option>
          ))}
        </Select>
      )}

      <Select
        value={filters.assignedVaId ?? ""}
        onChange={(e) => onChange({ ...filters, assignedVaId: e.target.value || undefined })}
      >
        <option value="">All VAs</option>
        {vas?.map((va) => (
          <option key={va.id} value={va.id}>{va.name}</option>
        ))}
      </Select>

      <Select
        value={filters.source ?? ""}
        onChange={(e) => onChange({ ...filters, source: (e.target.value || undefined) as RecruitFilters["source"] })}
      >
        <option value="">All sources</option>
        {Object.entries(SOURCE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </Select>

      <Input
        placeholder="Search name or email..."
        value={filters.search ?? ""}
        onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
        className="w-56"
      />

      {(filters.track || filters.stageId || filters.assignedVaId || filters.source || filters.search) && (
        <Button variant="ghost" onClick={() => onChange({})}>Clear</Button>
      )}
    </div>
  )
}
