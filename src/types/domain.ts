import type { Enums, Tables } from "./database"

export type Track = Enums<"track">
export type RecruitSource = Enums<"recruit_source">

export type Stage = Tables<"stages">
export type Recruit = Tables<"recruits">
export type Template = Tables<"templates">
export type ActivityLogEntry = Tables<"activity_log">

export type Role = "va" | "leadership"

export const TRACK_LABELS: Record<Track, string> = {
  team: "Team",
  roa_newbuild: "ROA / Newbuild USA",
  mastermind: "Mastermind",
}

export const SOURCE_LABELS: Record<RecruitSource, string> = {
  manual: "Manual",
  ghl: "GoHighLevel",
  stripe: "Stripe",
}
