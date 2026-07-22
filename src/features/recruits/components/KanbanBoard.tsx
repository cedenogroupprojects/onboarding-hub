import { RecruitCard } from "./RecruitCard"
import { getRecruitStatus } from "@/features/recruits/api"
import { STATUS_LABELS } from "@/types/domain"
import type { RecruitWithProgram } from "@/features/recruits/api"
import type { RecruitStatus } from "@/types/domain"

const STATUS_ORDER: RecruitStatus[] = ["not_started", "in_progress", "onboarded"]

function KanbanColumn({
  status,
  recruits,
  detailBasePath,
}: {
  status: RecruitStatus
  recruits: RecruitWithProgram[]
  detailBasePath: string
}) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border border-zinc-200 bg-zinc-50">
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-zinc-400">{recruits.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {recruits.map((recruit) => (
          <RecruitCard key={recruit.id} recruit={recruit} detailBasePath={detailBasePath} />
        ))}
        {recruits.length === 0 && (
          <div className="px-1 py-4 text-center text-xs text-zinc-400">Nothing here</div>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({
  recruits,
  detailBasePath,
}: {
  recruits: RecruitWithProgram[]
  detailBasePath: string
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STATUS_ORDER.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          recruits={recruits.filter((r) => getRecruitStatus(r) === status)}
          detailBasePath={detailBasePath}
        />
      ))}
    </div>
  )
}
