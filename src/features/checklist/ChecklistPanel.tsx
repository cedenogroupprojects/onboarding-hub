import { Badge } from "@/components/ui/Badge"
import { useChecklistItems, useToggleChecklistItem } from "./api"
import type { RecruitWithProgram } from "@/features/recruits/api"

function getDueInfo(createdAt: string, daysToComplete: number | null, completed: boolean) {
  if (daysToComplete == null) return null

  const due = new Date(createdAt)
  due.setDate(due.getDate() + daysToComplete)
  const diffDays = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  if (completed) return { label: `Due ${due.toLocaleDateString()}`, overdue: false }
  if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)}d`, overdue: true }
  if (diffDays === 0) return { label: "Due today", overdue: false }
  return { label: `Due in ${diffDays}d`, overdue: false }
}

export function ChecklistPanel({ recruit }: { recruit: RecruitWithProgram }) {
  const { data: tasks, isLoading } = useChecklistItems(recruit.id, recruit.program_id)
  const toggle = useToggleChecklistItem()

  const requiredTotal = tasks?.filter((t) => t.stage.required).length ?? 0
  const requiredDone = tasks?.filter((t) => t.stage.required && t.completedAt).length ?? 0

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">Checklist</span>
        <span className="text-xs text-zinc-400">
          {requiredDone}/{requiredTotal} required done
        </span>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-sm text-zinc-400">Loading checklist...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks?.map(({ stage, completedAt }) => {
            const dueInfo = getDueInfo(recruit.created_at, stage.days_to_complete, !!completedAt)
            return (
              <label
                key={stage.id}
                className="flex items-start gap-3 rounded-md border border-zinc-200 p-2.5 hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  checked={!!completedAt}
                  onChange={(e) =>
                    toggle.mutate({
                      recruitId: recruit.id,
                      stageId: stage.id,
                      completed: e.target.checked,
                    })
                  }
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-sm font-medium ${completedAt ? "text-zinc-400 line-through" : "text-zinc-900"}`}
                    >
                      {stage.name}
                    </span>
                    <Badge color={stage.required ? "blue" : "zinc"}>
                      {stage.required ? "Required" : "Optional"}
                    </Badge>
                    {dueInfo && (
                      <Badge color={dueInfo.overdue ? "red" : "amber"}>{dueInfo.label}</Badge>
                    )}
                  </div>
                  {stage.description && (
                    <p className="mt-0.5 text-xs text-zinc-500">{stage.description}</p>
                  )}
                </div>
              </label>
            )
          })}
          {tasks?.length === 0 && (
            <div className="py-4 text-center text-sm text-zinc-400">
              No checklist tasks configured for this program yet.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
