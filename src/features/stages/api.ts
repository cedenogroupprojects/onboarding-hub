import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSupabase } from "@/lib/supabase/useSupabase"
import type { Stage } from "@/types/domain"

export function useStages(programId?: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ["stages", programId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("stages").select("*").order("sort_order", { ascending: true })
      if (programId) query = query.eq("program_id", programId)
      const { data, error } = await query
      if (error) throw error
      return data as Stage[]
    },
  })
}

function useInvalidateStages() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["stages"] })
}

export interface StageInput {
  name: string
  description: string
  required: boolean
  daysToComplete: number | null
}

export function useCreateStage() {
  const supabase = useSupabase()
  const invalidate = useInvalidateStages()

  return useMutation({
    mutationFn: async ({
      programId,
      sortOrder,
      ...input
    }: StageInput & { programId: string; sortOrder: number }) => {
      const { error } = await supabase.from("stages").insert({
        program_id: programId,
        name: input.name,
        description: input.description || null,
        required: input.required,
        days_to_complete: input.daysToComplete,
        sort_order: sortOrder,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useUpdateStage() {
  const supabase = useSupabase()
  const invalidate = useInvalidateStages()

  return useMutation({
    mutationFn: async ({ id, ...input }: StageInput & { id: string }) => {
      const { error } = await supabase
        .from("stages")
        .update({
          name: input.name,
          description: input.description || null,
          required: input.required,
          days_to_complete: input.daysToComplete,
        })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteStage() {
  const supabase = useSupabase()
  const invalidate = useInvalidateStages()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stages").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useReorderStages() {
  const supabase = useSupabase()
  const invalidate = useInvalidateStages()

  return useMutation({
    mutationFn: async ({ programId, orderedIds }: { programId: string; orderedIds: string[] }) => {
      const { error } = await supabase.rpc("reorder_stages", {
        p_program_id: programId,
        p_ordered_ids: orderedIds,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
