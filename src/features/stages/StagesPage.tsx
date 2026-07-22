import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {
  useStages,
  useCreateStage,
  useRenameStage,
  useDeleteStage,
  useSwapStageOrder,
} from "./api"
import { TRACK_LABELS } from "@/types/domain"
import type { Track } from "@/types/domain"

const TRACKS = Object.keys(TRACK_LABELS) as Track[]

export function StagesPage() {
  const [track, setTrack] = useState<Track>("team")
  const [newStageName, setNewStageName] = useState("")

  const { data: stages } = useStages(track)
  const createStage = useCreateStage()
  const renameStage = useRenameStage()
  const deleteStage = useDeleteStage()
  const swapOrder = useSwapStageOrder()

  function handleAdd() {
    if (!newStageName.trim() || !stages) return
    const nextOrder = (stages[stages.length - 1]?.sort_order ?? 0) + 1
    createStage.mutate(
      { track, name: newStageName.trim(), sortOrder: nextOrder },
      { onSuccess: () => setNewStageName("") },
    )
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this stage? Recruits currently in it must be moved first.")) return
    deleteStage.mutate(id)
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-base font-semibold text-zinc-900">Stages</h1>

      <div className="mb-4 flex overflow-hidden rounded-md border border-zinc-300 w-fit">
        {TRACKS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrack(t)}
            className={`px-3 py-1.5 text-sm font-medium ${track === t ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
          >
            {TRACK_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {stages?.map((stage, index) => (
          <div
            key={stage.id}
            className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2"
          >
            <div className="flex flex-col">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => swapOrder.mutate({ a: stage, b: stages[index - 1] })}
                className="text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={index === stages.length - 1}
                onClick={() => swapOrder.mutate({ a: stage, b: stages[index + 1] })}
                className="text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            <Input
              defaultValue={stage.name}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== stage.name) {
                  renameStage.mutate({ id: stage.id, name: e.target.value.trim() })
                }
              }}
              className="flex-1"
            />
            <Button variant="ghost" onClick={() => handleDelete(stage.id)}>
              Delete
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          placeholder="New stage name"
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
        />
        <Button variant="primary" onClick={handleAdd} disabled={createStage.isPending}>
          Add stage
        </Button>
      </div>
    </div>
  )
}
