import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input, Textarea } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { SortableList } from "@/components/dnd/SortableList"
import {
  useStages,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
  useReorderStages,
  type StageInput,
} from "@/features/stages/api"
import type { Stage } from "@/types/domain"

const EMPTY_DRAFT: StageInput = { name: "", description: "", required: true, daysToComplete: null }

export function ChecklistEditor({ programId }: { programId: string }) {
  const { data: stages } = useStages(programId)
  const createStage = useCreateStage()
  const updateStage = useUpdateStage()
  const deleteStage = useDeleteStage()
  const reorderStages = useReorderStages()

  const [editing, setEditing] = useState<Stage | "new" | null>(null)
  const [draft, setDraft] = useState<StageInput>(EMPTY_DRAFT)

  function openNew() {
    setDraft(EMPTY_DRAFT)
    setEditing("new")
  }

  function openEdit(stage: Stage) {
    setDraft({
      name: stage.name,
      description: stage.description ?? "",
      required: stage.required,
      daysToComplete: stage.days_to_complete,
    })
    setEditing(stage)
  }

  function handleSave() {
    if (!draft.name.trim()) return

    if (editing === "new") {
      const nextOrder = (stages?.[stages.length - 1]?.sort_order ?? 0) + 1
      createStage.mutate(
        { programId, sortOrder: nextOrder, ...draft },
        { onSuccess: () => setEditing(null) },
      )
    } else if (editing) {
      updateStage.mutate({ id: editing.id, ...draft }, { onSuccess: () => setEditing(null) })
    }
  }

  function handleDelete(stage: Stage) {
    if (!confirm(`Delete task "${stage.name}"? Any recruit progress on it will be lost.`)) return
    deleteStage.mutate(stage.id, { onSuccess: () => setEditing(null) })
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-zinc-500">
          {stages?.length ?? 0} tasks &middot; Drag to reorder
        </span>
        <Button variant="primary" onClick={openNew}>
          + Add Task
        </Button>
      </div>

      {stages && stages.length > 0 ? (
        <SortableList
          items={stages}
          onReorder={(orderedIds) => reorderStages.mutate({ programId, orderedIds })}
          renderItem={(stage, handle) => (
            <div className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
              <button
                type="button"
                {...handle.attributes}
                {...handle.listeners}
                className="mt-0.5 cursor-grab touch-none text-zinc-300 hover:text-zinc-500 active:cursor-grabbing"
                aria-label="Drag to reorder"
              >
                ⠿
              </button>
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => openEdit(stage)}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium text-zinc-900">{stage.name}</span>
                  <Badge color={stage.required ? "blue" : "zinc"}>
                    {stage.required ? "Required" : "Optional"}
                  </Badge>
                  {stage.days_to_complete != null && (
                    <Badge color="amber">Due in {stage.days_to_complete}d</Badge>
                  )}
                </div>
                {stage.description && (
                  <p className="mt-0.5 text-sm text-zinc-500">{stage.description}</p>
                )}
              </button>
              <Button variant="ghost" onClick={() => handleDelete(stage)}>
                Delete
              </Button>
            </div>
          )}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-sm text-zinc-400">
          No checklist tasks yet.
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New task" : "Edit task"}
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Title</label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Description</label>
            <Textarea
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="What does the VA need to do here?"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={draft.required}
                onChange={(e) => setDraft({ ...draft, required: e.target.checked })}
              />
              Required
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-700">Due in</label>
              <Input
                type="number"
                min={0}
                className="w-20"
                value={draft.daysToComplete ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    daysToComplete: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <span className="text-sm text-zinc-500">days</span>
            </div>
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={createStage.isPending || updateStage.isPending}
            >
              {editing === "new" ? "Add task" : "Save changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
