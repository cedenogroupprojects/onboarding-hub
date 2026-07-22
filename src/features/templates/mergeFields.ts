import type { RecruitWithProgram } from "@/features/recruits/api"

export const MERGE_FIELD_HINTS = [
  "{{first_name}}",
  "{{last_name}}",
  "{{full_name}}",
  "{{email}}",
  "{{phone}}",
  "{{program}}",
  "{{zoom_link}}",
]

/** Replaces {{merge_fields}} with recruit data. Unknown fields are left untouched. */
export function renderMergeFields(text: string, recruit: RecruitWithProgram): string {
  const [firstName, ...rest] = recruit.name.trim().split(/\s+/)

  const fields: Record<string, string> = {
    first_name: firstName ?? "",
    last_name: rest.join(" "),
    full_name: recruit.name,
    email: recruit.email,
    phone: recruit.phone ?? "",
    program: recruit.program?.name ?? "",
    zoom_link: recruit.zoom_meeting_link ?? "",
  }

  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => fields[key] ?? match)
}
