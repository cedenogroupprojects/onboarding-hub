import { verifyToken } from "https://esm.sh/@clerk/backend@1.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

async function verifyCaller(req: Request) {
  const authHeader = req.headers.get("authorization") ?? ""
  const token = authHeader.replace(/^Bearer\s+/i, "")
  if (!token) throw new Error("Missing Authorization header")

  const secretKey = Deno.env.get("CLERK_SECRET_KEY")
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not configured")

  const payload = await verifyToken(token, { secretKey })
  const role = (payload.public_metadata as { role?: string } | undefined)?.role
  if (role !== "va" && role !== "leadership") throw new Error("Not authorized")

  return { userId: payload.sub as string, role }
}

async function getGmailAccessToken() {
  const params = new URLSearchParams({
    client_id: Deno.env.get("GMAIL_CLIENT_ID")!,
    client_secret: Deno.env.get("GMAIL_CLIENT_SECRET")!,
    refresh_token: Deno.env.get("GMAIL_REFRESH_TOKEN")!,
    grant_type: "refresh_token",
  })
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: params })
  if (!res.ok) throw new Error(`Gmail auth failed: ${res.status}`)
  const data = await res.json()
  return data.access_token as string
}

function buildRawMessage({
  to,
  from,
  subject,
  body,
}: { to: string; from: string; subject: string; body: string }) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ].join("\r\n")

  return btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders })
  }

  try {
    const { userId, role } = await verifyCaller(req)
    const { recruitId, subject, body, templateName } = await req.json()
    if (!recruitId || !subject || !body) {
      throw new Error("recruitId, subject, and body are required")
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: recruit, error: recruitError } = await supabase
      .from("recruits")
      .select("id, email, assigned_va_id")
      .eq("id", recruitId)
      .single()
    if (recruitError || !recruit) throw new Error("Recruit not found")

    if (role === "va" && recruit.assigned_va_id !== userId) {
      throw new Error("Not authorized for this recruit")
    }

    const fromAddress = Deno.env.get("GMAIL_SENDER_ADDRESS")!
    const accessToken = await getGmailAccessToken()
    const raw = buildRawMessage({ to: recruit.email, from: fromAddress, subject, body })

    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    })
    if (!sendRes.ok) {
      const errText = await sendRes.text()
      throw new Error(`Gmail send failed: ${sendRes.status} ${errText}`)
    }

    await supabase.from("activity_log").insert({
      recruit_id: recruitId,
      actor_id: userId,
      action: "template_sent",
      detail: { template_name: templateName ?? null, subject },
    })

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
