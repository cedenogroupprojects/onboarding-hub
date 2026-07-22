import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/clerk-react"
import { useSupabase } from "@/lib/supabase/useSupabase"
import type { Recruit, RecruitSource, Stage, Track } from "@/types/domain"
import type { TablesInsert } from "@/types/database"

export type RecruitWithStage = Recruit & { stage: Pick<Stage, "id" | "name" | "sort_order"> }

export interface RecruitFilters {
  track?: Track
  stageId?: string
  assignedVaId?: string
  source?: RecruitSource
  search?: string
}

const RECRUIT_SELECT = "*, stage:stages(id,name,sort_order)"

export function useRecruits(filters: RecruitFilters = {}) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ["recruits", filters],
    queryFn: async () => {
      let query = supabase.from("recruits").select(RECRUIT_SELECT)

      if (filters.track) query = query.eq("track", filters.track)
      if (filters.stageId) query = query.eq("stage_id", filters.stageId)
      if (filters.assignedVaId) query = query.eq("assigned_va_id", filters.assignedVaId)
      if (filters.source) query = query.eq("source", filters.source)
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }

      const { data, error } = await query.order("created_at", { ascending: false })
      if (error) throw error
      return data as RecruitWithStage[]
    },
  })
}

export function useRecruit(recruitId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ["recruit", recruitId],
    enabled: !!recruitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recruits")
        .select(RECRUIT_SELECT)
        .eq("id", recruitId!)
        .single()
      if (error) throw error
      return data as RecruitWithStage
    },
  })
}

export function useActivityLog(recruitId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ["activity_log", recruitId],
    enabled: !!recruitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .eq("recruit_id", recruitId!)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })
}

function useInvalidateRecruits() {
  const queryClient = useQueryClient()
  return (recruitId?: string) => {
    queryClient.invalidateQueries({ queryKey: ["recruits"] })
    if (recruitId) {
      queryClient.invalidateQueries({ queryKey: ["recruit", recruitId] })
      queryClient.invalidateQueries({ queryKey: ["activity_log", recruitId] })
    }
  }
}

export function useCreateRecruit() {
  const supabase = useSupabase()
  const { userId } = useAuth()
  const invalidate = useInvalidateRecruits()

  return useMutation({
    mutationFn: async (input: TablesInsert<"recruits">) => {
      const { data, error } = await supabase
        .from("recruits")
        .insert({ ...input, assigned_va_id: input.assigned_va_id ?? userId })
        .select(RECRUIT_SELECT)
        .single()
      if (error) throw error

      await supabase.from("activity_log").insert({
        recruit_id: data.id,
        actor_id: userId,
        action: "created",
        detail: { source: input.source ?? "manual" },
      })

      return data as RecruitWithStage
    },
    onSuccess: () => invalidate(),
  })
}

export function useMoveRecruitStage() {
  const supabase = useSupabase()
  const { userId } = useAuth()
  const invalidate = useInvalidateRecruits()

  return useMutation({
    mutationFn: async ({ recruitId, stageId }: { recruitId: string; stageId: string }) => {
      const { error } = await supabase.rpc("move_recruit_stage", {
        p_recruit_id: recruitId,
        p_new_stage_id: stageId,
        p_actor_id: userId ?? "",
      })
      if (error) throw error
    },
    onSuccess: (_data, variables) => invalidate(variables.recruitId),
  })
}

export function useReassignRecruit() {
  const supabase = useSupabase()
  const { userId } = useAuth()
  const invalidate = useInvalidateRecruits()

  return useMutation({
    mutationFn: async ({ recruitId, vaId }: { recruitId: string; vaId: string }) => {
      const { error } = await supabase.rpc("reassign_recruit", {
        p_recruit_id: recruitId,
        p_new_va_id: vaId,
        p_actor_id: userId ?? "",
      })
      if (error) throw error
    },
    onSuccess: (_data, variables) => invalidate(variables.recruitId),
  })
}

export function useUpdateRecruitNotes() {
  const supabase = useSupabase()
  const { userId } = useAuth()
  const invalidate = useInvalidateRecruits()

  return useMutation({
    mutationFn: async ({ recruitId, notes }: { recruitId: string; notes: string }) => {
      const { error } = await supabase.rpc("update_recruit_notes", {
        p_recruit_id: recruitId,
        p_notes: notes,
        p_actor_id: userId ?? "",
      })
      if (error) throw error
    },
    onSuccess: (_data, variables) => invalidate(variables.recruitId),
  })
}

export function useLogActivity() {
  const supabase = useSupabase()
  const { userId } = useAuth()
  const invalidate = useInvalidateRecruits()

  return useMutation({
    mutationFn: async ({
      recruitId,
      action,
      detail,
    }: {
      recruitId: string
      action: string
      detail?: Record<string, unknown>
    }) => {
      const { error } = await supabase.from("activity_log").insert({
        recruit_id: recruitId,
        actor_id: userId,
        action,
        detail: (detail ?? null) as TablesInsert<"activity_log">["detail"],
      })
      if (error) throw error
    },
    onSuccess: (_data, variables) => invalidate(variables.recruitId),
  })
}
