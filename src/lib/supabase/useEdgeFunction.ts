import { useAuth } from "@clerk/clerk-react"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** Calls a Supabase Edge Function with the caller's Clerk session token attached. */
export function useEdgeFunction() {
  const { getToken } = useAuth()

  return async function callEdgeFunction<T>(name: string, body?: unknown): Promise<T> {
    const token = await getToken()
    const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: supabaseKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      throw new Error(payload?.error ?? `${name} failed (${res.status})`)
    }

    return res.json()
  }
}
