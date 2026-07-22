import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input, Textarea } from "@/components/ui/Input"
import { SortableList } from "@/components/dnd/SortableList"
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useReorderTemplates,
} from "@/features/templates/api"
import { MERGE_FIELD_HINTS } from "@/features/templates/mergeFields"
import type { Template } from "@/types/domain"

const EMPTY_DRAFT = { name: "", subject: "", body: "" }

export function ProgramTemplatesTab({ programId }: { programId: string }) {
  const [selected, setSelected] = useState<Template | null>(null)
  const [draft, setDraft] = useState(EMPTY_DRAFT)

  const { data: templates } = useTemplates(programId)
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()
  const reorderTemplates = useReorderTemplates()

  function selectTemplate(template: Template | null) {
    setSelected(template)
    setDraft(template ? { name: template.name, subject: template.subject, body: template.body } : EMPTY_DRAFT)
  }

  function handleSave() {
    if (!draft.name.trim() || !draft.subject.trim() || !draft.body.trim()) return

    if (selected) {
      updateTemplate.mutate(
        { id: selected.id, name: draft.name, subject: draft.subject, body: draft.body },
        { onSuccess: () => selectTemplate(null) },
      )
    } else {
      createTemplate.mutate(
        { program_id: programId, stage_id: null, name: draft.name, subject: draft.subject, body: draft.body },
        { onSuccess: () => selectTemplate(null) },
      )
    }
  }

  function handleDelete(template: Template) {
    if (!confirm(`Delete template "${template.name}"?`)) return
    deleteTemplate.mutate(template.id, {
      onSuccess: () => { if (selected?.id === template.id) selectTemplate(null) },
    })
  }

  return (
    <div className="flex gap-6">
      <div className="w-56 shrink-0">
        <div className="flex flex-col gap-1">
          {templates && templates.length > 0 ? (
            <SortableList
              items={templates}
              onReorder={(orderedIds) => reorderTemplates.mutate(orderedIds)}
              renderItem={(template, handle) => (
                <div
                  className={`flex items-center gap-1 rounded-md px-1 ${selected?.id === template.id ? "bg-blue-50" : "hover:bg-zinc-100"}`}
                >
                  <button
                    type="button"
                    {...handle.attributes}
                    {...handle.listeners}
                    className="cursor-grab touch-none px-1 text-zinc-300 hover:text-zinc-500 active:cursor-grabbing"
                    aria-label="Drag to reorder"
                  >
                    ⠿
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTemplate(template)}
                    className={`flex-1 truncate py-1.5 text-left text-sm ${selected?.id === template.id ? "text-blue-700" : "text-zinc-600"}`}
                  >
                    {template.name}
                  </button>
                </div>
              )}
            />
          ) : (
            <div className="px-2.5 py-1.5 text-sm text-zinc-400">No templates yet.</div>
          )}
        </div>

        <Button variant="secondary" className="mt-3 w-full" onClick={() => selectTemplate(null)}>
          + New template
        </Button>
      </div>

      <div className="flex-1 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            {selected ? "Edit template" : "New template"}
          </h2>
          {selected && (
            <Button variant="danger" onClick={() => handleDelete(selected)}>
              Delete
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Name</label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Subject</label>
            <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Body</label>
            <Textarea
              rows={10}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
          </div>
          <div className="text-xs text-zinc-400">
            Merge fields: {MERGE_FIELD_HINTS.join(", ")}
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={createTemplate.isPending || updateTemplate.isPending}
            >
              {selected ? "Save changes" : "Create template"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
