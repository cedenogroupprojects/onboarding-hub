import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/clerk-react"
import { useSupabase } from "@/lib/supabase/useSupabase"
import type { Template, Track } from "@/types/domain"
import type { TablesInsert, TablesUpdate } from "@/types/database"

export function useTemplates(track?: Track) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ["templates", track ?? "all"],
    queryFn: async () => {
      let query = supabase.from("templates").select("*").order("name", { ascending: true })
      if (track) query = query.eq("track", track)
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
      const { error } = await supabase
        .from("templates")
        .insert({ ...input, created_by: userId })
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
