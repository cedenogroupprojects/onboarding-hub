import { useState } from "react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/Badge"
import { Modal } from "@/components/ui/Modal"
import { Textarea } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useUpdateRecruitNotes } from "@/features/recruits/api"
import { ScheduleCallButton } from "./ScheduleCallButton"
import { SOURCE_LABELS } from "@/types/domain"
import type { RecruitWithProgram } from "@/features/recruits/api"

const SOURCE_COLORS: Record<string, string> = { manual: "zinc", ghl: "purple", stripe: "green" }

export function RecruitCard({
  recruit,
  detailBasePath,
}: {
  recruit: RecruitWithProgram
  detailBasePath: string
}) {
  const [noteOpen, setNoteOpen] = useState(false)

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-2.5 shadow-sm">
      <Link
        to={`${detailBasePath}/${recruit.id}`}
        className="text-sm font-medium text-zinc-900 hover:text-blue-700"
      >
        {recruit.name}
      </Link>
      <div className="mt-0.5 truncate text-xs text-zinc-500">{recruit.email}</div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Badge color={SOURCE_COLORS[recruit.source]}>{SOURCE_LABELS[recruit.source]}</Badge>
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
  recruit: RecruitWithProgram
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
