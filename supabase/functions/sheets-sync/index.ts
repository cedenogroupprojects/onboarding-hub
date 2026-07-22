import { verifyToken } from "https://esm.sh/@clerk/backend@1.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Edit this block to point at the real destination sheet and column order. Nothing else
// in this file needs to change when the sheet layout changes.
const SHEET_CONFIG = {
  SHEET_ID: "REPLACE_WITH_GOOGLE_SHEET_ID",
  SHEET_RANGE: "Sheet1!A:E",
  COLUMNS: ["name", "email", "phone", "assigned_va_name", "onboarded_at"] as const,
  // false = only the "Mark Onboarded" button on the recruit detail page pushes a row.
  // true would require also wiring a DB trigger to call this function on stage change.
  AUTO_ON_STAGE_CHANGE: false,
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

async function getVaName(userId: string | null): Promise<string> {
  if (!userId) return ""
  const secretKey = Deno.env.get("CLERK_SECRET_KEY")
  if (!secretKey) return userId

  const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  if (!res.ok) return userId
  const user = await res.json()
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || userId
}

function base64Url(input: Uint8Array | string) {
  const base64 = typeof input === "string" ? btoa(input) : btoa(String.fromCharCode(...input))
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

async function getGoogleAccessToken(scope: string) {
  const keyJson = JSON.parse(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY")!)
  const now = Math.floor(Date.now() / 1000)

  const header = { alg: "RS256", typ: "JWT" }
  const claimSet = {
    iss: keyJson.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claimSet))}`

  const pemContents = keyJson.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "")
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsigned),
  )
  const jwt = `${unsigned}.${base64Url(new Uint8Array(signature))}`

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`Google auth failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.access_token as string
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  try {
    const { userId, role } = await verifyCaller(req)
    const { recruitId } = await req.json()
    if (!recruitId) throw new Error("recruitId is required")

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: recruit, error } = await supabase
      .from("recruits")
      .select("*, stage:stages(name)")
      .eq("id", recruitId)
      .single()
    if (error || !recruit) throw new Error("Recruit not found")

    if (recruit.track !== "team") throw new Error("Only team-track recruits sync to the sheet")
    if (role === "va" && recruit.assigned_va_id !== userId) {
      throw new Error("Not authorized for this recruit")
    }

    const vaName = await getVaName(recruit.assigned_va_id)
    const fieldValues: Record<(typeof SHEET_CONFIG.COLUMNS)[number], string> = {
      name: recruit.name,
      email: recruit.email,
      phone: recruit.phone ?? "",
      assigned_va_name: vaName,
      onboarded_at: recruit.onboarded_at ? new Date(recruit.onboarded_at).toLocaleDateString() : "",
    }
    const row = SHEET_CONFIG.COLUMNS.map((column) => fieldValues[column])

    const accessToken = await getGoogleAccessToken("https://www.googleapis.com/auth/spreadsheets")
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_CONFIG.SHEET_ID}/values/${encodeURIComponent(SHEET_CONFIG.SHEET_RANGE)}:append?valueInputOption=USER_ENTERED`

    const sheetRes = await fetch(appendUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [row] }),
    })
    if (!sheetRes.ok) throw new Error(`Sheets append failed: ${sheetRes.status} ${await sheetRes.text()}`)

    await supabase.from("activity_log").insert({
      recruit_id: recruitId,
      actor_id: userId,
      action: "sheet_sync",
      detail: { row },
    })

    return new Response(JSON.stringify({ ok: true }), {
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
