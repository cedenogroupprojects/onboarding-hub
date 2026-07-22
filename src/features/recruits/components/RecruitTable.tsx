import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/Badge"
import { Select } from "@/components/ui/Select"
import { ReassignSelect } from "./ReassignSelect"
import { TRACK_LABELS, SOURCE_LABELS } from "@/types/domain"
import type { RecruitWithStage } from "@/features/recruits/api"
import type { Stage } from "@/types/domain"

const SOURCE_COLORS: Record<string, string> = { manual: "zinc", ghl: "purple", stripe: "green" }

export function RecruitTable({
  recruits,
  stagesByTrack,
  onMoveStage,
}: {
  recruits: RecruitWithStage[]
  stagesByTrack: Record<string, Stage[]>
  onMoveStage: (recruitId: string, stageId: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Track</th>
            <th className="px-3 py-2 font-medium">Stage</th>
            <th className="px-3 py-2 font-medium">Assigned VA</th>
            <th className="px-3 py-2 font-medium">Source</th>
            <th className="px-3 py-2 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {recruits.map((recruit) => (
            <tr key={recruit.id} className="hover:bg-zinc-50">
              <td className="px-3 py-2">
                <Link
                  to={`/recruits/${recruit.id}`}
                  className="font-medium text-zinc-900 hover:text-blue-700"
                >
                  {recruit.name}
                </Link>
                <div className="text-xs text-zinc-400">{recruit.email}</div>
              </td>
              <td className="px-3 py-2 text-zinc-600">{TRACK_LABELS[recruit.track]}</td>
              <td className="px-3 py-2">
                <Select
                  value={recruit.stage_id}
                  onChange={(e) => onMoveStage(recruit.id, e.target.value)}
                  className="py-1 text-xs"
                >
                  {(stagesByTrack[recruit.track] ?? []).map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </Select>
              </td>
              <td className="px-3 py-2">
                <ReassignSelect recruitId={recruit.id} assignedVaId={recruit.assigned_va_id} />
              </td>
              <td className="px-3 py-2">
                <Badge color={SOURCE_COLORS[recruit.source]}>
                  {SOURCE_LABELS[recruit.source]}
                </Badge>
              </td>
              <td className="px-3 py-2 text-xs text-zinc-400">
                {new Date(recruit.updated_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {recruits.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-sm text-zinc-400">
                No recruits match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
