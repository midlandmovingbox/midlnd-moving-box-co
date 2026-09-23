# Midland Moving Box Co. — card-on-file booking system

This is the "request → vault card → you approve → charge" workflow: customers
submit a reservation and securely save a card with Square, but **nothing is
charged** until you personally approve it from a simple admin page. That same
card stays on file so you can charge extra weeks or damage later without
chasing anyone down.

## The workflow

1. Customer fills out the form at `/book`, picks a package/dates/add-ons,
   and enters a card. Square's Web Payments SDK collects the card and gives
   your server a one-time token — your server never sees the raw card number.
2. Your server creates a Square Customer, vaults the card against them
   (stored, not charged), and saves the reservation in Supabase with
   status `requested`.
3. You check `/admin` (password protected), see the request, and decide
   whether you can actually fulfill it.
4. **Approve & Charge** — charges the vaulted card for the rental total,
   flips status to `confirmed`.
   **Decline** — flips status to `declined`, card is never touched.
5. For a `confirmed` reservation, you can charge the same card again anytime
   (extra week, damage) using the "Charge card on file" box — each one is
   logged so you have a record of what was charged and why.

## One-time setup (~20 minutes)

### 1. Supabase (free)

1. [supabase.com](https://supabase.com) → New project.
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Project Settings → API → copy `Project URL` and the `service_role` key
   (not `anon`) into `.env.local`.

### 2. Square developer account (free)

1. [developer.squareup.com](https://developer.squareup.com) → create an app.
2. Stay on the **Sandbox** tab to start. Copy Application ID, Access Token,
   and the default Location ID into `.env.local`.

### 3. Environment variables

```bash
cp .env.local.example .env.local
```
Fill in the Supabase and Square values, and pick your own `ADMIN_PASSWORD`.

### 4. Run it

```bash
npm install
npm run dev
```

- Homepage: http://localhost:3000
- Booking form: http://localhost:3000/book — use Square's sandbox test card
  **4111 1111 1111 1111**, any future expiry, any CVC, any ZIP.
- Admin panel: http://localhost:3000/admin — log in with your `ADMIN_PASSWORD`.

Submit a test reservation, then approve it from `/admin` and check the
Square Sandbox dashboard's Payments tab — you'll see the real (sandbox)
charge appear.

## Deploying

Push to GitHub, import into [Vercel](https://vercel.com), and add every
variable from `.env.local` under Project Settings → Environment Variables
(Vercel doesn't read `.env.local` itself). Deploy.

## Going live with real payments

1. In Square's dashboard, switch to the **Production** tab, copy those
   credentials instead.
2. Update env vars in Vercel: `SQUARE_ENV=production` plus the production
   Application ID / Access Token / Location ID.
3. Redeploy.

## Security notes

- The admin panel uses a single shared password (`ADMIN_PASSWORD`), not a
  full login system. That's appropriate for one owner — don't share the
  `/admin` URL publicly, and treat it as worth upgrading if you ever bring
  on employees who need their own accounts.
- Your Square Access Token and Supabase service role key are powerful
  secrets — they only ever live in environment variables on the server,
  never in code you'd commit or in anything sent to the browser.

## What's intentionally not built yet

- **No inventory checking** — you manage that yourself, as you asked.
- **No confirmation emails/texts** to the customer when approved/declined —
  worth adding via Resend or Twilio inside the approve/decline routes.
- **No refund flow** — Square supports refunds via API; not wired up.
- **Reservation "returned/closed" status** exists in the schema but there's
  no button for it yet — add one in `/admin` if you want to track that.

## File map

```
app/
  page.js                    — marketing homepage
  book/page.js               — reservation form (vaults card, no charge)
  admin/page.js              — password-gated approve/decline/charge panel
  api/reservations/route.js  — creates Square customer+card, saves 'requested'
  api/admin/login/route.js   — password check, sets session cookie
  api/admin/reservations/route.js — lists reservations (admin-only)
  api/admin/approve/route.js — charges vaulted card, confirms
  api/admin/decline/route.js — declines, never charges
  api/admin/charge/route.js  — additional charge against vaulted card
lib/
  supabaseAdmin.js  — server-only Supabase client
  constants.js      — packages, add-ons, tax rate, price math
  square.js         — Square customer/card/payment API calls
  adminAuth.js       — simple password-gate cookie logic
supabase/schema.sql — run once in Supabase's SQL editor
```
