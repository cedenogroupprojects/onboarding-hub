import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/clerk-react"
import { useSupabase } from "@/lib/supabase/useSupabase"
import type { Stage } from "@/types/domain"

export interface ChecklistTask {
  stage: Stage
  completedAt: string | null
  completedBy: string | null
}

/** Every task in the recruit's program, left-joined against their completion state. */
export function useChecklistItems(recruitId: string | undefined, programId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ["checklist", recruitId],
    enabled: !!recruitId && !!programId,
    queryFn: async (): Promise<ChecklistTask[]> => {
      const { data: stages, error: stagesError } = await supabase
        .from("stages")
        .select("*")
        .eq("program_id", programId!)
        .order("sort_order", { ascending: true })
      if (stagesError) throw stagesError

      const { data: completions, error: completionsError } = await supabase
        .from("recruit_checklist_items")
        .select("*")
        .eq("recruit_id", recruitId!)
      if (completionsError) throw completionsError

      const completionByStage = new Map(completions.map((c) => [c.stage_id, c]))

      return (stages as Stage[]).map((stage) => ({
        stage,
        completedAt: completionByStage.get(stage.id)?.completed_at ?? null,
        completedBy: completionByStage.get(stage.id)?.completed_by ?? null,
      }))
    },
  })
}

export function useToggleChecklistItem() {
  const supabase = useSupabase()
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      recruitId,
      stageId,
      completed,
    }: {
      recruitId: string
      stageId: string
      completed: boolean
    }) => {
      const { error } = await supabase.rpc("toggle_checklist_item", {
        p_recruit_id: recruitId,
        p_stage_id: stageId,
        p_completed: completed,
        p_actor_id: userId ?? "",
      })
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklist", variables.recruitId] })
      queryClient.invalidateQueries({ queryKey: ["recruit", variables.recruitId] })
      queryClient.invalidateQueries({ queryKey: ["recruits"] })
      queryClient.invalidateQueries({ queryKey: ["activity_log", variables.recruitId] })
    },
  })
}
