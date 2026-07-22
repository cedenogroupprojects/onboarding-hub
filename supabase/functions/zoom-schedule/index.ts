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

async function getZoomAccessToken() {
  const accountId = Deno.env.get("ZOOM_ACCOUNT_ID")!
  const clientId = Deno.env.get("ZOOM_CLIENT_ID")!
  const clientSecret = Deno.env.get("ZOOM_CLIENT_SECRET")!
  const basicAuth = btoa(`${clientId}:${clientSecret}`)

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    { method: "POST", headers: { Authorization: `Basic ${basicAuth}` } },
  )
  if (!res.ok) throw new Error(`Zoom auth failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.access_token as string
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders })
  }

  try {
    const { userId, role } = await verifyCaller(req)
    const { recruitId, startTime } = await req.json()
    if (!recruitId || !startTime) throw new Error("recruitId and startTime are required")

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: recruit, error } = await supabase
      .from("recruits")
      .select("id, name, assigned_va_id")
      .eq("id", recruitId)
      .single()
    if (error || !recruit) throw new Error("Recruit not found")
    if (role === "va" && recruit.assigned_va_id !== userId) {
      throw new Error("Not authorized for this recruit")
    }

    const accessToken = await getZoomAccessToken()
    const meetingRes = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: `Onboarding Call - ${recruit.name}`,
        type: 2,
        start_time: startTime,
        duration: 30,
        settings: { join_before_host: true, waiting_room: false },
      }),
    })
    if (!meetingRes.ok) throw new Error(`Zoom meeting creation failed: ${meetingRes.status} ${await meetingRes.text()}`)
    const meeting = await meetingRes.json()

    await supabase.from("recruits").update({ zoom_meeting_link: meeting.join_url }).eq("id", recruitId)
    await supabase.from("activity_log").insert({
      recruit_id: recruitId,
      actor_id: userId,
      action: "zoom_scheduled",
      detail: { start_time: startTime, join_url: meeting.join_url },
    })

    return new Response(JSON.stringify({ joinUrl: meeting.join_url }), {
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
