import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/clerk-react"
import { useSupabase } from "@/lib/supabase/useSupabase"
import type { Template } from "@/types/domain"
import type { TablesInsert, TablesUpdate } from "@/types/database"

export function useTemplates(programId?: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ["templates", programId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("templates").select("*").order("sort_order", { ascending: true })
      if (programId) query = query.eq("program_id", programId)
      const { data, error } = await query
      if (error) throw error
      return data as Template[]
    },
  })
}

function useInvalidateTemplates() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["templates"] })
}

export function useCreateTemplate() {
  const supabase = useSupabase()
  const { userId } = useAuth()
  const invalidate = useInvalidateTemplates()

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<"templates">, "created_by">) => {
      const { data: existing } = await supabase
        .from("templates")
        .select("sort_order")
        .eq("program_id", input.program_id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()
      const nextOrder = (existing?.sort_order ?? 0) + 1

      const { error } = await supabase
        .from("templates")
        .insert({ ...input, created_by: userId, sort_order: nextOrder })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useUpdateTemplate() {
  const supabase = useSupabase()
  const invalidate = useInvalidateTemplates()

  return useMutation({
    mutationFn: async ({ id, ...patch }: TablesUpdate<"templates"> & { id: string }) => {
      const { error } = await supabase.from("templates").update(patch).eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteTemplate() {
  const supabase = useSupabase()
  const invalidate = useInvalidateTemplates()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("templates").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useReorderTemplates() {
  const supabase = useSupabase()
  const invalidate = useInvalidateTemplates()

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const results = await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from("templates").update({ sort_order: index + 1 }).eq("id", id),
        ),
      )
      const failed = results.find((result) => result.error)
      if (failed?.error) throw failed.error
    },
    onSuccess: invalidate,
  })
}
