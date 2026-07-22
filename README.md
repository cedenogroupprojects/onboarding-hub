# Onboarding/Offboarding Hub

Recruiting and onboarding tracker with leadership-defined **Programs**, each with an ordered
checklist of tasks (required/optional, with day-based due dates). React + Vite + TypeScript
frontend, Supabase (Postgres, RLS, Edge Functions) backend, Clerk for auth.

Live at: https://onboarding-hub-ashy.vercel.app
Repo: https://github.com/cedenogroupprojects/onboarding-hub (auto-deploys `master` to Vercel)

## Already done

- Supabase project: `onboarding-hub` (ref `ttfysuuxfxtjwnmxjxtm`, org "Cedeno Group"), full
  schema + RLS applied (`supabase/migrations/`).
- Clerk application created, session token customized, third-party auth linked to Supabase.
- Edge Functions deployed: `list-team-users`, `gmail-send`, `ghl-webhook`, `stripe-webhook`,
  `sheets-sync`, `zoom-schedule`.
  - `list-team-users`, `gmail-send`, `zoom-schedule`, `sheets-sync` are called directly from
    the browser and run with **`verify_jwt: false`**. This is intentional, not a hole:
    Supabase's platform-level JWT gate doesn't currently trust Clerk-issued tokens (even
    though Clerk is registered as a Third-Party Auth provider for the database layer), so
    each of these functions does its own Clerk token verification inside the handler. If you
    ever redeploy one of these via the CLI, keep `verify_jwt` off or it'll 401 every request.
  - `ghl-webhook` / `stripe-webhook` are also `verify_jwt: false` since they're called by
    external services with no Clerk session at all; they check their own shared secret /
    Stripe signature instead.
- Vercel env vars set: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
  `VITE_CLERK_PUBLISHABLE_KEY`.

## What you still need to do

Each integration below needs credentials only you can create, set as **Supabase Edge
Function secrets** (Dashboard -> Edge Functions -> Secrets), not Vercel env vars.

### Gmail send

1. In Google Cloud Console, enable the **Gmail API** and create an OAuth 2.0 Client ID.
2. Complete the OAuth consent flow once for the company Gmail account to get a refresh token
   with the `https://www.googleapis.com/auth/gmail.send` scope.
3. Set: `CLERK_SECRET_KEY` (also needed by every other function below), `GMAIL_CLIENT_ID`,
   `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER_ADDRESS`.

### GoHighLevel webhook

1. In a GHL Workflow, add a **Webhook** action pointed at:
   `https://ttfysuuxfxtjwnmxjxtm.supabase.co/functions/v1/ghl-webhook?secret=YOUR_SECRET`
2. Set the Supabase secret `GHL_WEBHOOK_SECRET` to that same value.
3. Tag contacts `program:<Program Name>` (matched case-insensitively; falls back to whichever
   program has `is_default = true`, currently "Team").

### Stripe webhook

1. Create a webhook endpoint in the Stripe Dashboard pointed at:
   `https://ttfysuuxfxtjwnmxjxtm.supabase.co/functions/v1/stripe-webhook`, listening for
   `checkout.session.completed` and `invoice.payment_succeeded`.
2. Set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MASTERMIND_PRICE_IDS`
   (comma-separated Price IDs; leave blank to accept all events, not recommended if you sell
   anything else). Recruits land in whichever program is named exactly "Mastermind".

### Google Sheets sync

1. Create a Google Cloud service account, enable the **Google Sheets API**, download its JSON
   key, and share your destination Sheet with the service account's `client_email`.
2. Set `GOOGLE_SERVICE_ACCOUNT_KEY` to the full JSON key content.
3. In **Onboarding Programs -> [pick a program] -> Edit**, turn on "Sync onboarded recruits to
   Google Sheet" for whichever program(s) should push rows.
4. Edit `supabase/functions/sheets-sync/index.ts`'s `SHEET_CONFIG` block (`SHEET_ID`,
   `SHEET_RANGE`, `COLUMNS`) and redeploy the function.
5. This fires from the "Push to Sheet" button on a recruit's detail page, which only appears
   once every required checklist task is checked off (`onboarded_at` gets set automatically).

### Zoom scheduling

1. Create a **Server-to-Server OAuth** app in the Zoom Marketplace under the shared company
   account, with the `meeting:write` scope.
2. Set: `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`.

## How the checklist model works

- Leadership manages **Programs** (dynamic, not fixed) from Onboarding Programs in the
  sidebar: create/rename/delete, and per-program toggle for Sheets sync.
- Each program has an ordered **checklist** of tasks (title, description, required/optional,
  optional "days to complete" due-date offset from the recruit's `created_at`). Drag to
  reorder.
- Each recruit gets that program's checklist; checking off every *required* task sets
  `onboarded_at` automatically (see the `toggle_checklist_item` Postgres function).
- Dashboards group recruits by computed status: Not Started / In Progress / Onboarded — this
  is derived, not stored, so there's nothing to keep in sync.

## Local development

```bash
npm install
npm run dev
```

Requires `.env.local` with `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, and
`VITE_SUPABASE_PUBLISHABLE_KEY` filled in.
