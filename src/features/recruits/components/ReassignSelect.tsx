import { useVaUsers } from "@/features/team/api"
import { useReassignRecruit } from "@/features/recruits/api"
import { Select } from "@/components/ui/Select"

export function ReassignSelect({ recruitId, assignedVaId }: { recruitId: string; assignedVaId: string | null }) {
  const { data: vas } = useVaUsers()
  const reassign = useReassignRecruit()

  return (
    <Select
      value={assignedVaId ?? ""}
      onChange={(e) => reassign.mutate({ recruitId, vaId: e.target.value })}
      className="py-1 text-xs"
    >
      <option value="">Unassigned</option>
      {vas?.map((va) => (
        <option key={va.id} value={va.id}>
          {va.name}
        </option>
      ))}
    </Select>
  )
}
