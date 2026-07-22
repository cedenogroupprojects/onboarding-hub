import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input, Textarea } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Modal } from "@/components/ui/Modal"
import { usePrograms, useCreateProgram, useUpdateProgram, useDeleteProgram } from "./api"
import { ChecklistEditor } from "./ChecklistEditor"
import { ProgramTemplatesTab } from "./ProgramTemplatesTab"

export function OnboardingProgramsPage() {
  const { data: programs } = usePrograms()
  const createProgram = useCreateProgram()
  const updateProgram = useUpdateProgram()
  const deleteProgram = useDeleteProgram()

  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [tab, setTab] = useState<"checklist" | "templates">("checklist")
  const [newProgramOpen, setNewProgramOpen] = useState(false)
  const [editProgramOpen, setEditProgramOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState("")
  const [descriptionDraft, setDescriptionDraft] = useState("")
  const [sheetSyncDraft, setSheetSyncDraft] = useState(false)

  useEffect(() => {
    if (!selectedProgramId && programs?.[0]) setSelectedProgramId(programs[0].id)
  }, [programs, selectedProgramId])

  const selectedProgram = programs?.find((p) => p.id === selectedProgramId) ?? null

  function openNewProgram() {
    setNameDraft("")
    setDescriptionDraft("")
    setSheetSyncDraft(false)
    setNewProgramOpen(true)
  }

  function openEditProgram() {
    if (!selectedProgram) return
    setNameDraft(selectedProgram.name)
    setDescriptionDraft(selectedProgram.description ?? "")
    setSheetSyncDraft(selectedProgram.sheet_sync_enabled)
    setEditProgramOpen(true)
  }

  function handleCreateProgram() {
    if (!nameDraft.trim()) return
    createProgram.mutate(
      { name: nameDraft.trim(), description: descriptionDraft.trim() },
      {
        onSuccess: (program) => {
          setSelectedProgramId(program.id)
          setNewProgramOpen(false)
        },
      },
    )
  }

  function handleUpdateProgram() {
    if (!selectedProgram || !nameDraft.trim()) return
    updateProgram.mutate(
      {
        id: selectedProgram.id,
        name: nameDraft.trim(),
        description: descriptionDraft.trim(),
        sheetSyncEnabled: sheetSyncDraft,
      },
      { onSuccess: () => setEditProgramOpen(false) },
    )
  }

  function handleDeleteProgram() {
    if (!selectedProgram) return
    if (!confirm(`Delete program "${selectedProgram.name}"? This only works if no recruits, tasks, or templates reference it.`)) return
    deleteProgram.mutate(selectedProgram.id, {
      onSuccess: () => setSelectedProgramId(null),
      onError: (err) => alert(err instanceof Error ? err.message : "Could not delete this program"),
    })
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Onboarding Programs</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Manage programs, task checklists, and email templates
          </p>
        </div>
        <Button variant="primary" onClick={openNewProgram}>
          + New Program
        </Button>
      </div>

      <div className="mb-5 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3">
        <div className="flex-1">
          <div className="text-xs font-medium text-zinc-500">Program</div>
          <Select
            value={selectedProgramId ?? ""}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="mt-1 w-full"
          >
            {programs?.map((program) => (
              <option key={program.id} value={program.id}>{program.name}</option>
            ))}
          </Select>
          {selectedProgram?.description && (
            <p className="mt-1 text-xs text-zinc-400">{selectedProgram.description}</p>
          )}
        </div>
        <Button variant="secondary" onClick={openEditProgram} disabled={!selectedProgram}>
          Edit
        </Button>
        <Button variant="danger" onClick={handleDeleteProgram} disabled={!selectedProgram}>
          Delete
        </Button>
      </div>

      {selectedProgram && (
        <>
          <div className="mb-4 flex overflow-hidden rounded-md border border-zinc-300 w-fit">
            <button
              type="button"
              onClick={() => setTab("checklist")}
              className={`px-3 py-1.5 text-sm font-medium ${tab === "checklist" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
            >
              Checklist
            </button>
            <button
              type="button"
              onClick={() => setTab("templates")}
              className={`px-3 py-1.5 text-sm font-medium ${tab === "templates" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
            >
              Templates
            </button>
          </div>

          {tab === "checklist" ? (
            <ChecklistEditor programId={selectedProgram.id} />
          ) : (
            <ProgramTemplatesTab programId={selectedProgram.id} />
          )}
        </>
      )}

      <Modal open={newProgramOpen} onClose={() => setNewProgramOpen(false)} title="New program">
        <ProgramForm
          name={nameDraft}
          description={descriptionDraft}
          onNameChange={setNameDraft}
          onDescriptionChange={setDescriptionDraft}
          onCancel={() => setNewProgramOpen(false)}
          onSubmit={handleCreateProgram}
          submitLabel="Create program"
          pending={createProgram.isPending}
        />
      </Modal>

      <Modal open={editProgramOpen} onClose={() => setEditProgramOpen(false)} title="Edit program">
        <ProgramForm
          name={nameDraft}
          description={descriptionDraft}
          onNameChange={setNameDraft}
          onDescriptionChange={setDescriptionDraft}
          onCancel={() => setEditProgramOpen(false)}
          onSubmit={handleUpdateProgram}
          submitLabel="Save changes"
          pending={updateProgram.isPending}
          sheetSyncEnabled={sheetSyncDraft}
          onSheetSyncChange={setSheetSyncDraft}
        />
      </Modal>
    </div>
  )
}

function ProgramForm({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onCancel,
  onSubmit,
  submitLabel,
  pending,
  sheetSyncEnabled,
  onSheetSyncChange,
}: {
  name: string
  description: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
  submitLabel: string
  pending: boolean
  sheetSyncEnabled?: boolean
  onSheetSyncChange?: (value: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">Name</label>
        <Input value={name} onChange={(e) => onNameChange(e.target.value)} autoFocus />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">Description</label>
        <Textarea rows={2} value={description} onChange={(e) => onDescriptionChange(e.target.value)} />
      </div>
      {onSheetSyncChange && (
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={sheetSyncEnabled}
            onChange={(e) => onSheetSyncChange(e.target.checked)}
          />
          Sync onboarded recruits to Google Sheet
        </label>
      )}
      <div className="mt-1 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={onSubmit} disabled={pending}>{submitLabel}</Button>
      </div>
    </div>
  )
}
