import Stripe from "https://esm.sh/stripe@17.5.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

function mastermindPriceIds(): Set<string> {
  return new Set(
    (Deno.env.get("STRIPE_MASTERMIND_PRICE_IDS") ?? "").split(",").map((id) => id.trim()).filter(Boolean),
  )
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ").trim()
}

async function upsertMastermindRecruit(
  supabase: ReturnType<typeof createClient>,
  input: { customerId: string; email: string; name: string },
) {
  const { data: stages, error: stagesError } = await supabase
    .from("stages")
    .select("id, name, sort_order")
    .eq("track", "mastermind")
    .order("sort_order", { ascending: true })
  if (stagesError) throw stagesError
  if (!stages || stages.length === 0) throw new Error("No stages configured for track \"mastermind\"")

  const paidStage = stages.find((s) => normalize(s.name) === "paid") ?? stages[0]

  const { data: existing, error: findError } = await supabase
    .from("recruits")
    .select("id")
    .eq("stripe_customer_id", input.customerId)
    .maybeSingle()
  if (findError) throw findError

  let recruitId: string

  if (existing) {
    const { error: updateError } = await supabase
      .from("recruits")
      .update({ payment_status: "paid", stage_id: paidStage.id })
      .eq("id", existing.id)
    if (updateError) throw updateError
    recruitId = existing.id
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("recruits")
      .insert({
        name: input.name,
        email: input.email,
        track: "mastermind",
        stage_id: paidStage.id,
        source: "stripe",
        stripe_customer_id: input.customerId,
        payment_status: "paid",
      })
      .select("id")
      .single()
    if (insertError) throw insertError
    recruitId = inserted.id
  }

  return recruitId
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  const signature = req.headers.get("Stripe-Signature")
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )
  const targetPriceIds = mastermindPriceIds()

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items"],
      })
      const priceIds = fullSession.line_items?.data.map((li) => li.price?.id).filter(Boolean) ?? []
      const isMastermind = targetPriceIds.size === 0 || priceIds.some((id) => targetPriceIds.has(id!))

      if (isMastermind && session.customer && session.customer_details?.email) {
        const recruitId = await upsertMastermindRecruit(supabase, {
          customerId: String(session.customer),
          email: session.customer_details.email,
          name: session.customer_details.name ?? session.customer_details.email,
        })
        await supabase.from("activity_log").insert({
          recruit_id: recruitId,
          actor_id: null,
          action: "stripe_sync",
          detail: { event_type: event.type, session_id: session.id },
        })
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice
      const priceIds = invoice.lines.data.map((li) => li.price?.id).filter(Boolean)
      const isMastermind = targetPriceIds.size === 0 || priceIds.some((id) => targetPriceIds.has(id!))

      if (isMastermind && invoice.customer && invoice.customer_email) {
        const recruitId = await upsertMastermindRecruit(supabase, {
          customerId: String(invoice.customer),
          email: invoice.customer_email,
          name: invoice.customer_name ?? invoice.customer_email,
        })
        await supabase.from("activity_log").insert({
          recruit_id: recruitId,
          actor_id: null,
          action: "stripe_sync",
          detail: { event_type: event.type, invoice_id: invoice.id },
        })
      }
    }

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
