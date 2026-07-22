import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/Badge"
import { Select } from "@/components/ui/Select"
import { Modal } from "@/components/ui/Modal"
import { Textarea } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useUpdateRecruitNotes } from "@/features/recruits/api"
import { ScheduleCallButton } from "./ScheduleCallButton"
import { SOURCE_LABELS } from "@/types/domain"
import type { RecruitWithStage } from "@/features/recruits/api"
import type { Stage } from "@/types/domain"

const SOURCE_COLORS: Record<string, string> = { manual: "zinc", ghl: "purple", stripe: "green" }

export function RecruitCard({
  recruit,
  stages,
  detailBasePath,
  onMoveStage,
}: {
  recruit: RecruitWithStage
  stages: Stage[]
  detailBasePath: string
  onMoveStage: (stageId: string) => void
}) {
  const [noteOpen, setNoteOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: recruit.id,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border border-zinc-200 bg-white p-2.5 shadow-sm ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`${detailBasePath}/${recruit.id}`}
          className="text-sm font-medium text-zinc-900 hover:text-blue-700"
        >
          {recruit.name}
        </Link>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-zinc-300 hover:text-zinc-500 active:cursor-grabbing"
          aria-label="Drag to move stage"
        >
          ⠿
        </button>
      </div>
      <div className="mt-0.5 truncate text-xs text-zinc-500">{recruit.email}</div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Badge color={SOURCE_COLORS[recruit.source]}>{SOURCE_LABELS[recruit.source]}</Badge>
      </div>

      <div className="mt-2">
        <Select
          value={recruit.stage_id}
          onChange={(e) => onMoveStage(e.target.value)}
          className="w-full py-1 text-xs"
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-1.5 flex items-center gap-1">
        <Button variant="ghost" className="flex-1 px-1.5 py-1 text-xs" onClick={() => setNoteOpen(true)}>
          Note
        </Button>
        <Link
          to={`${detailBasePath}/${recruit.id}`}
          className="flex-1 rounded-md px-1.5 py-1 text-center text-xs font-medium text-zinc-600 hover:bg-zinc-100"
        >
          Email
        </Link>
        <div className="flex-1">
          <ScheduleCallButton recruit={recruit} compact />
        </div>
      </div>

      <NoteModal
        recruit={recruit}
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
      />
    </div>
  )
}

function NoteModal({
  recruit,
  open,
  onClose,
}: {
  recruit: RecruitWithStage
  open: boolean
  onClose: () => void
}) {
  const [draft, setDraft] = useState("")
  const updateNotes = useUpdateRecruitNotes()

  function handleAdd() {
    if (!draft.trim()) return
    const stamp = new Date().toLocaleString()
    const nextNotes = recruit.notes
      ? `${recruit.notes}\n\n[${stamp}] ${draft.trim()}`
      : `[${stamp}] ${draft.trim()}`
    updateNotes.mutate(
      { recruitId: recruit.id, notes: nextNotes },
      { onSuccess: () => { setDraft(""); onClose() } },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add note - ${recruit.name}`}>
      <Textarea
        rows={4}
        placeholder="Quick note..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
      />
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleAdd} disabled={updateNotes.isPending}>
          {updateNotes.isPending ? "Saving..." : "Add note"}
        </Button>
      </div>
    </Modal>
  )
}
