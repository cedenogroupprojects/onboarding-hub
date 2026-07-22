import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { Textarea } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { useActivityLog, useRecruit, useUpdateRecruitNotes } from "./api"
import { ReassignSelect } from "./components/ReassignSelect"
import { MarkOnboardedButton } from "./components/MarkOnboardedButton"
import { ScheduleCallButton } from "./components/ScheduleCallButton"
import { ChecklistPanel } from "@/features/checklist/ChecklistPanel"
import { TemplateSendPanel } from "@/features/templates/TemplateSendPanel"
import { useRole } from "@/lib/auth/useRole"
import { SOURCE_LABELS } from "@/types/domain"

const ACTION_LABELS: Record<string, string> = {
  created: "Recruit created",
  checklist_item_completed: "Checklist task completed",
  checklist_item_unchecked: "Checklist task unchecked",
  reassigned: "Reassigned",
  note_updated: "Note added",
  template_sent: "Email sent",
  zoom_scheduled: "Zoom call scheduled",
  ghl_sync: "Synced from GoHighLevel",
  stripe_sync: "Synced from Stripe",
  sheet_sync: "Synced to Google Sheet",
}

export function RecruitDetailPage() {
  const { recruitId } = useParams<{ recruitId: string }>()
  const role = useRole()
  const { data: recruit, isLoading } = useRecruit(recruitId)
  const { data: activity } = useActivityLog(recruitId)
  const updateNotes = useUpdateRecruitNotes()
  const [notesDraft, setNotesDraft] = useState("")

  useEffect(() => {
    setNotesDraft(recruit?.notes ?? "")
  }, [recruit?.notes])

  if (isLoading || !recruit) {
    return <div className="p-6 text-sm text-zinc-400">Loading recruit...</div>
  }

  const backHref = role === "leadership" ? "/leadership" : "/va"

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link to={backHref} className="text-xs text-zinc-500 hover:text-zinc-700">
        &larr; Back to dashboard
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">{recruit.name}</h1>
          <div className="text-sm text-zinc-500">{recruit.email}</div>
          {recruit.phone && <div className="text-sm text-zinc-500">{recruit.phone}</div>}
        </div>
        <div className="flex items-center gap-1.5">
          <Badge color="blue">{recruit.program?.name}</Badge>
          <Badge color="zinc">{SOURCE_LABELS[recruit.source]}</Badge>
          {recruit.onboarded_at && <Badge color="green">Onboarded</Badge>}
        </div>
      </div>

      <div className="mt-5">
        <div className="rounded-lg border border-zinc-200 bg-white p-3">
          <div className="mb-1 text-xs font-medium text-zinc-500">Assigned VA</div>
          {role === "leadership" ? (
            <ReassignSelect recruitId={recruit.id} assignedVaId={recruit.assigned_va_id} />
          ) : (
            <div className="text-sm text-zinc-700">{recruit.assigned_va_id ?? "Unassigned"}</div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <ChecklistPanel recruit={recruit} />
      </div>

      {recruit.program?.sheet_sync_enabled && (
        <div className="mt-4">
          <MarkOnboardedButton recruit={recruit} />
        </div>
      )}

      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-xs font-medium text-zinc-500">Zoom call</div>
          <ScheduleCallButton recruit={recruit} />
        </div>
        {recruit.zoom_meeting_link ? (
          <a
            href={recruit.zoom_meeting_link}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {recruit.zoom_meeting_link}
          </a>
        ) : (
          <div className="text-sm text-zinc-400">No call scheduled yet.</div>
        )}
      </div>

      <div className="mt-4">
        <TemplateSendPanel recruit={recruit} />
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500">Notes</span>
          {notesDraft !== (recruit.notes ?? "") && (
            <Button
              variant="primary"
              className="px-2 py-1 text-xs"
              onClick={() => updateNotes.mutate({ recruitId: recruit.id, notes: notesDraft })}
              disabled={updateNotes.isPending}
            >
              {updateNotes.isPending ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
        <Textarea
          rows={5}
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          placeholder="No notes yet."
        />
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3">
        <div className="mb-2 text-xs font-medium text-zinc-500">Activity</div>
        <ol className="flex flex-col gap-2.5">
          {activity?.map((entry) => (
            <li key={entry.id} className="text-sm">
              <div className="text-zinc-800">{ACTION_LABELS[entry.action] ?? entry.action}</div>
              <div className="text-xs text-zinc-400">
                {new Date(entry.created_at).toLocaleString()}
              </div>
            </li>
          ))}
          {activity?.length === 0 && (
            <li className="text-sm text-zinc-400">No activity yet.</li>
          )}
        </ol>
      </div>
    </div>
  )
}
