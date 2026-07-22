import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { useCreateRecruit } from "@/features/recruits/api"
import { usePrograms } from "@/features/programs/api"
import { useVaUsers } from "@/features/team/api"
import { useRole } from "@/lib/auth/useRole"

export function NewRecruitDialog({
  open,
  onClose,
  defaultProgramId,
}: {
  open: boolean
  onClose: () => void
  defaultProgramId?: string
}) {
  const role = useRole()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [programId, setProgramId] = useState(defaultProgramId ?? "")
  const [assignedVaId, setAssignedVaId] = useState("")

  const { data: programs } = usePrograms()
  const { data: vas } = useVaUsers()
  const createRecruit = useCreateRecruit()

  useEffect(() => {
    if (!programId && programs?.[0]) setProgramId(defaultProgramId ?? programs[0].id)
  }, [programs, programId, defaultProgramId])

  function reset() {
    setName("")
    setEmail("")
    setPhone("")
    setAssignedVaId("")
  }

  function handleSubmit() {
    if (!programId || !name.trim() || !email.trim()) return

    createRecruit.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        program_id: programId,
        source: "manual",
        assigned_va_id: role === "leadership" ? assignedVaId || null : null,
      },
      { onSuccess: () => { reset(); onClose() } },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="New recruit">
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Phone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Program</label>
          <Select value={programId} onChange={(e) => setProgramId(e.target.value)} className="w-full">
            {programs?.map((program) => (
              <option key={program.id} value={program.id}>{program.name}</option>
            ))}
          </Select>
        </div>
        {role === "leadership" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Assign to VA</label>
            <Select value={assignedVaId} onChange={(e) => setAssignedVaId(e.target.value)} className="w-full">
              <option value="">Unassigned</option>
              {vas?.map((va) => (
                <option key={va.id} value={va.id}>{va.name}</option>
              ))}
            </Select>
          </div>
        )}

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createRecruit.isPending}>
            {createRecruit.isPending ? "Creating..." : "Create recruit"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
