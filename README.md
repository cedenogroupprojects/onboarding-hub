# Onboarding/Offboarding Hub

Recruiting and onboarding tracker for the Team, ROA/Newbuild USA, and Mastermind tracks.
React + Vite + TypeScript frontend, Supabase (Postgres, RLS, Edge Functions) backend, Clerk
for auth.

## Already provisioned

- Supabase project: `onboarding-hub` (ref `ttfysuuxfxtjwnmxjxtm`, org "Cedeno Group"), schema
  and RLS policies applied, seeded with default stages per track.
- Edge Functions deployed: `list-team-users`, `gmail-send`, `ghl-webhook`, `stripe-webhook`,
  `sheets-sync`, `zoom-schedule`.
- `.env.local` has the real Supabase URL/publishable key filled in.

## What you need to do

Everything below is a dashboard/account action only you can do. Once you have each value,
add it where noted (Supabase secrets vs `.env.local`/Vercel env vars).

### 1. Clerk (required to sign in at all)

1. Create a Clerk application at https://dashboard.clerk.com.
2. In **Sessions -> Customize session token**, add:
   ```json
   { "public_metadata": "{{user.public_metadata}}" }
   ```
   This is how the app reads each user's `va` / `leadership` role.
3. For each teammate, set `publicMetadata.role` to `"va"` or `"leadership"` (User -> Metadata).
4. Copy the **Publishable key** into `.env.local` as `VITE_CLERK_PUBLISHABLE_KEY`, and also
   set it in the Vercel project's environment variables once deployed.
5. Copy the **Secret key** into Supabase Edge Function secrets as `CLERK_SECRET_KEY`
   (used by every Edge Function to verify who's calling and to look up VA names).
6. In the Supabase Dashboard, go to **Authentication -> Sign In / Providers -> Third Party
   Auth**, add Clerk, and paste your Clerk **Frontend API URL** (found in Clerk's API Keys
   page). This lets Supabase's RLS policies trust Clerk-issued JWTs.

### 2. Gmail send

1. In Google Cloud Console, enable the **Gmail API** and create an OAuth 2.0 Client ID
   (type: Web application).
2. Complete the OAuth consent flow once for the company Gmail account to get a refresh
   token with the `https://www.googleapis.com/auth/gmail.send` scope (the standard way is
   Google's OAuth Playground, using your own client id/secret).
3. Set these Supabase secrets: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`,
   `GMAIL_SENDER_ADDRESS` (the company Gmail address itself).

### 3. GoHighLevel webhook

1. In a GHL Workflow, add a **Webhook** action triggered by whatever tag/pipeline change you
   want to sync, pointed at:
   `https://ttfysuuxfxtjwnmxjxtm.supabase.co/functions/v1/ghl-webhook?secret=YOUR_SECRET`
2. Set the Supabase secret `GHL_WEBHOOK_SECRET` to the same value you put in the URL.
3. Tag contacts with `track:team`, `track:roa_newbuild`, or `track:mastermind` to set the
   track (defaults to `team` if missing), and `stage:<Stage Name>` to set the stage (matched
   case-insensitively against the stages configured in the app; defaults to the first stage).
4. The raw payload is always logged to that recruit's activity log for debugging.

### 4. Stripe webhook

1. Create a webhook endpoint in the Stripe Dashboard pointed at:
   `https://ttfysuuxfxtjwnmxjxtm.supabase.co/functions/v1/stripe-webhook`
   listening for `checkout.session.completed` and `invoice.payment_succeeded`.
2. Set Supabase secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
   `STRIPE_MASTERMIND_PRICE_IDS` (comma-separated Stripe Price IDs for the Mastermind
   product; leave blank to accept all events, but setting it is strongly recommended if
   your Stripe account sells anything else).

### 5. Google Sheets sync

1. Create a Google Cloud service account, enable the **Google Sheets API**, and download its
   JSON key.
2. Share your destination Google Sheet with the service account's `client_email` (Editor
   access).
3. Set the Supabase secret `GOOGLE_SERVICE_ACCOUNT_KEY` to the full JSON key content (as one
   string).
4. Edit `supabase/functions/sheets-sync/index.ts`, `SHEET_CONFIG` block: set `SHEET_ID` to
   your sheet's ID (from its URL) and adjust `SHEET_RANGE` / `COLUMNS` if you want a
   different layout than the default (Name, Email, Phone, Assigned VA, Onboarded Date).
   Redeploy the function after editing.
5. This only fires from the "Mark Onboarded" button on a team-track recruit's detail page
   (`AUTO_ON_STAGE_CHANGE` is `false`). Flip it to `true` and wire a database trigger if you
   later want it to fire automatically the moment a recruit reaches the "Onboarded" stage.

### 6. Zoom scheduling

1. Create a **Server-to-Server OAuth** app in the Zoom Marketplace under the shared company
   Zoom account, with the `meeting:write:admin` (or `meeting:write`) scope.
2. Set Supabase secrets: `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`.

### 7. Vercel

1. `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY` are
   the only env vars the frontend needs; set them in the Vercel project settings. Everything
   else above is a Supabase Edge Function secret, not a Vercel env var.

## Local development

```bash
npm install
npm run dev
```

Requires `.env.local` to have `VITE_CLERK_PUBLISHABLE_KEY` filled in (see step 1 above) -
the app throws a clear error on boot until that's set.
