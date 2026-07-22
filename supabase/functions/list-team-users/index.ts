import { verifyToken } from "https://esm.sh/@clerk/backend@1.21.0"

interface ClerkUser {
  id: string
  first_name: string | null
  last_name: string | null
  public_metadata?: { role?: string }
  email_addresses: { id: string; email_address: string }[]
  primary_email_address_id: string | null
}

async function verifyLeadership(req: Request): Promise<void> {
  const authHeader = req.headers.get("authorization") ?? ""
  const token = authHeader.replace(/^Bearer\s+/i, "")
  if (!token) throw new Error("Missing Authorization header")

  const secretKey = Deno.env.get("CLERK_SECRET_KEY")
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not configured")

  const payload = await verifyToken(token, { secretKey })
  const role = (payload.public_metadata as { role?: string } | undefined)?.role
  if (role !== "leadership") throw new Error("Leadership access required")
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  try {
    await verifyLeadership(req)

    const secretKey = Deno.env.get("CLERK_SECRET_KEY")!
    const users: ClerkUser[] = []
    const limit = 100
    let offset = 0

    while (true) {
      const res = await fetch(`https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      })
      if (!res.ok) throw new Error(`Clerk API error: ${res.status}`)
      const page: ClerkUser[] = await res.json()
      users.push(...page)
      if (page.length < limit) break
      offset += limit
    }

    const vas = users
      .filter((u) => u.public_metadata?.role === "va")
      .map((u) => {
        const email =
          u.email_addresses.find((e) => e.id === u.primary_email_address_id)?.email_address ??
          u.email_addresses[0]?.email_address ??
          null
        const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || email || u.id
        return { id: u.id, name, email }
      })

    return new Response(JSON.stringify({ vas }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    const status = message === "Leadership access required" ? 403 : 400
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  }
})
