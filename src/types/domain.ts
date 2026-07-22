import type { Enums, Tables } from "./database"

export type RecruitSource = Enums<"recruit_source">

export type Program = Tables<"programs">
export type Stage = Tables<"stages">
export type Recruit = Tables<"recruits">
export type Template = Tables<"templates">
export type ActivityLogEntry = Tables<"activity_log">
export type ChecklistItem = Tables<"recruit_checklist_items">

export type Role = "va" | "leadership"

export type RecruitStatus = "not_started" | "in_progress" | "onboarded"

export const STATUS_LABELS: Record<RecruitStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  onboarded: "Onboarded",
}

export const SOURCE_LABELS: Record<RecruitSource, string> = {
  manual: "Manual",
  ghl: "GoHighLevel",
  stripe: "Stripe",
}
