import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSupabase } from "@/lib/supabase/useSupabase"
import type { Program } from "@/types/domain"

export function usePrograms() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("sort_order", { ascending: true })
      if (error) throw error
      return data as Program[]
    },
  })
}

function useInvalidatePrograms() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["programs"] })
}

export function useCreateProgram() {
  const supabase = useSupabase()
  const invalidate = useInvalidatePrograms()

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { data: existing } = await supabase
        .from("programs")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()
      const nextOrder = (existing?.sort_order ?? 0) + 1

      const { data, error } = await supabase
        .from("programs")
        .insert({ name, description, sort_order: nextOrder })
        .select("*")
        .single()
      if (error) throw error
      return data as Program
    },
    onSuccess: invalidate,
  })
}

export function useUpdateProgram() {
  const supabase = useSupabase()
  const invalidate = useInvalidatePrograms()

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      sheetSyncEnabled,
    }: {
      id: string
      name: string
      description: string
      sheetSyncEnabled: boolean
    }) => {
      const { error } = await supabase
        .from("programs")
        .update({ name, description, sheet_sync_enabled: sheetSyncEnabled })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteProgram() {
  const supabase = useSupabase()
  const invalidate = useInvalidatePrograms()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("programs").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
