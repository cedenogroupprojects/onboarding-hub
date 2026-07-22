import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/Badge"
import { ReassignSelect } from "./ReassignSelect"
import { getRecruitStatus } from "@/features/recruits/api"
import { SOURCE_LABELS, STATUS_LABELS } from "@/types/domain"
import type { RecruitWithProgram } from "@/features/recruits/api"

const SOURCE_COLORS: Record<string, string> = { manual: "zinc", ghl: "purple", stripe: "green" }
const STATUS_COLORS: Record<string, string> = { not_started: "zinc", in_progress: "amber", onboarded: "green" }

export function RecruitTable({ recruits }: { recruits: RecruitWithProgram[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Program</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Assigned VA</th>
            <th className="px-3 py-2 font-medium">Source</th>
            <th className="px-3 py-2 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {recruits.map((recruit) => {
            const status = getRecruitStatus(recruit)
            return (
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
                <td className="px-3 py-2 text-zinc-600">{recruit.program?.name}</td>
                <td className="px-3 py-2">
                  <Badge color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
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
            )
          })}
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
