import { DndContext, type DragEndEvent, useDroppable } from "@dnd-kit/core"
import { RecruitCard } from "./RecruitCard"
import type { RecruitWithStage } from "@/features/recruits/api"
import type { Stage } from "@/types/domain"

function KanbanColumn({
  stage,
  recruits,
  detailBasePath,
  onMoveStage,
  allStages,
}: {
  stage: Stage
  recruits: RecruitWithStage[]
  detailBasePath: string
  onMoveStage: (recruitId: string, stageId: string) => void
  allStages: Stage[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded-lg border ${isOver ? "border-blue-300 bg-blue-50/50" : "border-zinc-200 bg-zinc-50"}`}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {stage.name}
        </span>
        <span className="text-xs text-zinc-400">{recruits.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {recruits.map((recruit) => (
          <RecruitCard
            key={recruit.id}
            recruit={recruit}
            stages={allStages}
            detailBasePath={detailBasePath}
            onMoveStage={(stageId) => onMoveStage(recruit.id, stageId)}
          />
        ))}
      </div>
    </div>
  )
}

export function KanbanBoard({
  stages,
  recruits,
  detailBasePath,
  onMoveStage,
}: {
  stages: Stage[]
  recruits: RecruitWithStage[]
  detailBasePath: string
  onMoveStage: (recruitId: string, stageId: string) => void
}) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const recruitId = String(active.id)
    const stageId = String(over.id)
    const recruit = recruits.find((r) => r.id === recruitId)
    if (recruit && recruit.stage_id !== stageId) onMoveStage(recruitId, stageId)
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            allStages={stages}
            recruits={recruits.filter((r) => r.stage_id === stage.id)}
            detailBasePath={detailBasePath}
            onMoveStage={onMoveStage}
          />
        ))}
      </div>
    </DndContext>
  )
}
