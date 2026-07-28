# Checkout

Invoicing on top of Stripe Connect. Users connect a Stripe Express account
once, then send mobile-friendly invoices to their own clients. The platform
keeps a 5% fee per invoice; the rest settles directly to the user's connected
account.

See the full architecture writeup (money flow, account model, build order)
in the plan artifact shared alongside this repo.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + Turso (libSQL)
- Clerk (hosted auth)
- Stripe (Connect, Invoicing)
- Nodemailer via Mailtrap for the "you got paid" notification

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Copy environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in:
   - `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` — from a [Turso](https://turso.tech) database (`turso db create`, `turso db tokens create`)
   - `STRIPE_SECRET_KEY` — from your [test-mode API keys](https://dashboard.stripe.com/test/apikeys)
   - `STRIPE_WEBHOOK_SECRET` / `STRIPE_WEBHOOK_SECRET_CONNECT` — see below
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — from your [Clerk dashboard](https://dashboard.clerk.com) API Keys page
   - `MAILTRAP_*` — from your Mailtrap sending/sandbox inbox
   - `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` for local dev

3. **Push the schema to your database**

   Prisma's schema engine doesn't speak the `libsql://` protocol directly, so
   schema changes are applied by generating SQL and running it against Turso:

   ```bash
   npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > schema.sql
   turso db shell <your-db-name> < schema.sql
   ```

   (Or execute the generated SQL with any `@libsql/client` script — see git
   history for an example. This only needs to be re-run when the schema
   changes.)

4. **Forward Stripe webhooks locally**

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET`.

5. **Run the app**

   ```bash
   npm run dev
   ```

## Manual end-to-end test (test mode)

1. Sign up at `/signup` (Clerk's hosted sign-up form).
2. From the dashboard, click **Connect with Stripe** and complete Stripe's
   test-mode onboarding (use their test data — e.g. SSN `000-00-0000`, any
   future date for DOB, test bank account `000123456789` / routing `110000000`).
3. Once `account.updated` fires (watch the `stripe listen` terminal), the
   dashboard flips to "ready" and emails you via Mailtrap.
4. Click **New invoice**, fill it out, and send it to any email you control.
5. Open the returned Hosted Invoice Page link and pay with a
   [Stripe test card](https://docs.stripe.com/testing) (`4242 4242 4242 4242`,
   any future expiry, any CVC).
6. Confirm: the `invoice.paid` webhook fires, the dashboard shows the invoice
   as **paid**, and a "you got paid" email lands in Mailtrap.
7. Click **View your Stripe dashboard** to see the connected account's balance
   and the incoming payout.

## Notes

- Express accounts are created with `country: "US"`; multi-country support
  is a later addition, not a blocker for the first release.
- `src/generated/prisma` is generated on `npm install` (via `postinstall`) and
  is gitignored — never edit it directly.
- `/dashboard` and `/invoices/new` require a signed-in Clerk session
  (enforced by `middleware.ts`). On first sign-in, a local `User` row is
  lazily created (`src/lib/current-user.ts`) keyed by Clerk's `userId`,
  starting with a genuinely empty dashboard — no demo data is seeded.
- Going live means switching `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` to
  live-mode values and updating the webhook endpoint in the Stripe Dashboard
  to point at your deployed URL.
- Connect splits events across two scopes, so production needs **two event
  destinations pointing at the same `/api/webhooks/stripe` URL**: one scoped to
  *Your account* for `invoice.paid` / `invoice.payment_failed` (invoices are
  created on the platform with `transfer_data`/`on_behalf_of`), and one scoped
  to *Connected accounts* for `account.updated`. Stripe issues a separate
  signing secret per destination — put them in `STRIPE_WEBHOOK_SECRET` and
  `STRIPE_WEBHOOK_SECRET_CONNECT`; the handler tries both.
