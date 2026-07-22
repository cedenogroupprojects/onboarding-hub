import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSupabase } from "@/lib/supabase/useSupabase"
import type { Stage, Track } from "@/types/domain"

export function useStages(track?: Track) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ["stages", track ?? "all"],
    queryFn: async () => {
      let query = supabase.from("stages").select("*").order("sort_order", { ascending: true })
      if (track) query = query.eq("track", track)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

function useInvalidateStages() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["stages"] })
}

export function useCreateStage() {
  const supabase = useSupabase()
  const invalidate = useInvalidateStages()

  return useMutation({
    mutationFn: async ({ track, name, sortOrder }: { track: Track; name: string; sortOrder: number }) => {
      const { error } = await supabase.from("stages").insert({ track, name, sort_order: sortOrder })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useRenameStage() {
  const supabase = useSupabase()
  const invalidate = useInvalidateStages()

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("stages").update({ name }).eq("id", id)
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

export function useSwapStageOrder() {
  const supabase = useSupabase()
  const invalidate = useInvalidateStages()

  return useMutation({
    mutationFn: async ({ a, b }: { a: Stage; b: Stage }) => {
      const { error } = await supabase.rpc("swap_stage_order", {
        p_stage_a: a.id,
        p_stage_b: b.id,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
