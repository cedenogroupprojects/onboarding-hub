import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// GHL doesn't sign webhook payloads by default, so authorize via a shared secret that's
// embedded in the webhook URL's query string (?secret=...) or an X-Webhook-Secret header,
// whichever the GHL workflow's webhook action supports.
function verifySecret(req: Request, url: URL) {
  const expected = Deno.env.get("GHL_WEBHOOK_SECRET")
  if (!expected) throw new Error("GHL_WEBHOOK_SECRET is not configured")
  const provided = req.headers.get("x-webhook-secret") ?? url.searchParams.get("secret")
  if (provided !== expected) throw new Error("Invalid webhook secret")
}

interface GhlPayload {
  contact_id?: string
  contactId?: string
  first_name?: string
  last_name?: string
  full_name?: string
  name?: string
  email?: string
  phone?: string
  tags?: string[]
}

function extractTagValue(tags: string[] | undefined, prefix: string): string | null {
  if (!tags) return null
  const tag = tags.find((t) => t.toLowerCase().startsWith(`${prefix}:`))
  return tag ? tag.slice(prefix.length + 1).trim() : null
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ").trim()
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  const url = new URL(req.url)

  try {
    verifySecret(req, url)

    const payload: GhlPayload = await req.json()
    const contactId = payload.contact_id ?? payload.contactId
    const name = payload.full_name ?? [payload.first_name, payload.last_name].filter(Boolean).join(" ")
    const email = payload.email

    if (!contactId) throw new Error("Payload is missing contact_id")
    if (!name || !email) throw new Error("Payload is missing name/email")

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: programs, error: programsError } = await supabase
      .from("programs")
      .select("id, name, is_default")
    if (programsError) throw programsError
    if (!programs || programs.length === 0) throw new Error("No programs configured")

    // Tag a contact `program:<name>` (or the legacy `track:<name>`) to route it to a
    // specific program; unmatched or missing tags fall back to the default program.
    const programTag = extractTagValue(payload.tags, "program") ?? extractTagValue(payload.tags, "track")
    const matchedProgram = programTag
      ? programs.find((p) => normalize(p.name) === normalize(programTag))
      : undefined
    const program = matchedProgram ?? programs.find((p) => p.is_default) ?? programs[0]

    const { data: existing, error: findError } = await supabase
      .from("recruits")
      .select("id")
      .eq("ghl_contact_id", contactId)
      .maybeSingle()
    if (findError) throw findError

    let recruitId: string

    if (existing) {
      const { error: updateError } = await supabase
        .from("recruits")
        .update({ name, email, phone: payload.phone ?? null, program_id: program.id })
        .eq("id", existing.id)
      if (updateError) throw updateError
      recruitId = existing.id
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("recruits")
        .insert({
          name,
          email,
          phone: payload.phone ?? null,
          program_id: program.id,
          source: "ghl",
          ghl_contact_id: contactId,
        })
        .select("id")
        .single()
      if (insertError) throw insertError
      recruitId = inserted.id
    }

    await supabase.from("activity_log").insert({
      recruit_id: recruitId,
      actor_id: null,
      action: "ghl_sync",
      detail: { payload, resolved_program: program.name },
    })

    return new Response(JSON.stringify({ ok: true, recruit_id: recruitId }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
})
