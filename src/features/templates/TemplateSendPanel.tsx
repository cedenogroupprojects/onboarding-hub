import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import { Input, Textarea } from "@/components/ui/Input"
import { useTemplates } from "./api"
import { renderMergeFields } from "./mergeFields"
import { useEdgeFunction } from "@/lib/supabase/useEdgeFunction"
import type { RecruitWithStage } from "@/features/recruits/api"

export function TemplateSendPanel({ recruit }: { recruit: RecruitWithStage }) {
  const { data: templates } = useTemplates(recruit.track)
  const callEdgeFunction = useEdgeFunction()
  const queryClient = useQueryClient()

  const [templateId, setTemplateId] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const template = templates?.find((t) => t.id === templateId)
    if (template) {
      setSubject(renderMergeFields(template.subject, recruit))
      setBody(renderMergeFields(template.body, recruit))
    }
  }, [templateId, templates, recruit])

  function insertZoomLink() {
    if (!recruit.zoom_meeting_link) return
    setBody((current) => `${current}\n\n${recruit.zoom_meeting_link}`)
  }

  async function handleSend() {
    setError(null)
    setSending(true)
    try {
      await callEdgeFunction("gmail-send", {
        recruitId: recruit.id,
        subject,
        body,
        templateName: templates?.find((t) => t.id === templateId)?.name ?? null,
      })
      queryClient.invalidateQueries({ queryKey: ["activity_log", recruit.id] })
      setTemplateId("")
      setSubject("")
      setBody("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="mb-2 text-xs font-medium text-zinc-500">Send template</div>

      <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full">
        <option value="">Choose a template...</option>
        {templates?.map((template) => (
          <option key={template.id} value={template.id}>{template.name}</option>
        ))}
      </Select>

      {templateId && (
        <div className="mt-3 flex flex-col gap-2">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="text-xs"
              onClick={insertZoomLink}
              disabled={!recruit.zoom_meeting_link}
            >
              Insert Zoom link
            </Button>
            <Button variant="primary" onClick={handleSend} disabled={sending}>
              {sending ? "Sending..." : "Send email"}
            </Button>
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
      )}
    </div>
  )
}
