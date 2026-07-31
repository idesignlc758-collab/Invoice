import Link from "next/link";
import { getCurrentUserWithInvoices } from "@/lib/current-user";
import { formatCents, initials } from "@/lib/format";
import { getRecentClients } from "@/lib/recent-clients";
import { SignOutButton } from "@/components/sign-out-button";
import { StatusPill } from "@/components/status-pill";
import { CONNECT_COUNTRIES } from "@/lib/connect-countries";
import { prisma } from "@/lib/prisma";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function displayName(email: string) {
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function formatDate(date: Date | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string; reason?: string; country?: string }>;
}) {
  const user = await getCurrentUserWithInvoices();
  const [productCount, clientCount, profile] = await Promise.all([
    prisma.product.count({ where: { userId: user.id, active: true } }),
    prisma.client.count({ where: { userId: user.id } }),
    prisma.businessProfile.findUnique({ where: { userId: user.id } }),
  ]);
  const { onboarding, reason, country: attemptedCountry } = await searchParams;
  const isReady = user.onboardingStatus === "ready";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

  const todayCents = user.invoices
    .filter((i) => i.status === "paid" && i.paidAt && i.paidAt >= startOfToday)
    .reduce((sum, i) => sum + i.amount, 0);
  const monthCents = user.invoices
    .filter((i) => i.status === "paid" && i.paidAt && i.paidAt >= startOfMonth)
    .reduce((sum, i) => sum + i.amount, 0);
  const openInvoices = user.invoices.filter((i) => i.status === "open");
  const openCents = openInvoices.reduce((sum, i) => sum + i.amount, 0);
  const monthNetCents = user.invoices
    .filter((i) => i.status === "paid" && i.paidAt && i.paidAt >= startOfMonth)
    .reduce((sum, i) => sum + i.amount - i.feeAmount, 0);
  const paidCount = user.invoices.filter((i) => i.status === "paid").length;
  const recentClients = getRecentClients(user.invoices, 6);
  const recentInvoices = user.invoices.slice(0, 5);
  const brandReady = Boolean(profile?.businessName && profile?.supportEmail);

  const connectBanner = !isReady && (
    <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
      <h2 className="font-display text-xl font-bold">Get set up to invoice</h2>
      <p className="mt-1 text-sm text-muted">
        {user.stripeAccountId
          ? "Your Stripe account exists but is not verified yet. Stripe needs the whole form completed before you can invoice."
          : "Connect your Stripe account to start sending invoices. The platform processes card payments and transfers your net payout."}
      </p>

      {onboarding === "country_required" && (
        <p className="mt-4 text-sm text-danger">Choose the country your business is based in.</p>
      )}
      {onboarding === "country_unsupported" && (
        <div className="mt-4 rounded-2xl border border-danger/40 bg-danger/5 p-4">
          <p className="text-sm font-medium text-danger">Stripe rejected that country</p>
          <p className="mt-1 break-words text-sm text-danger">
            {reason || "Try another country, or get in touch."}
          </p>
        </div>
      )}

      <form action="/api/connect/onboard" method="POST" className="mt-5 flex flex-col items-start gap-4">
        <label className="flex w-full max-w-xs flex-col gap-1.5 text-sm">
          Business country
          <select
            name="country"
            defaultValue={attemptedCountry ?? "US"}
            className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {CONNECT_COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </label>
        {!user.stripeAccountId && (
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="acceptedTerms"
              required
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="text-accent underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/refunds" target="_blank" className="text-accent underline">
                Refund Policy
              </Link>
              .
            </span>
          </label>
        )}
        <button
          type="submit"
          className="min-h-12 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-contrast"
        >
          {user.stripeAccountId ? "Continue setup" : "Connect Stripe"}
        </button>
      </form>
    </section>
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{greeting()}</p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            {displayName(user.email)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/invoices/new"
            className="hidden min-h-11 items-center rounded-2xl bg-accent px-4 text-sm font-bold text-accent-contrast sm:flex"
          >
            + New invoice
          </Link>
          <div className="md:hidden">
            <SignOutButton />
          </div>
        </div>
      </div>

      {connectBanner}

      {isReady && (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="elevated rounded-2xl border border-line bg-card p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">Awaiting payment</p>
                  <p className="mt-2 font-display text-4xl font-extrabold tracking-tight tabular-nums md:text-5xl">
                    {formatCents(openCents, "usd")}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {openInvoices.length === 1
                      ? "1 invoice is ready for follow-up."
                      : `${openInvoices.length} invoices are ready for follow-up.`}
                  </p>
                </div>
                <span className="rounded-full bg-line px-3 py-1.5 text-xs font-medium text-foreground">
                  {openInvoices.length} open
                </span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-4">
                <div className="rounded-2xl bg-background p-4">
                  <p className="text-xs text-muted">Collected this month</p>
                  <p className="mt-1 font-display text-xl font-bold tabular-nums">
                    {formatCents(monthCents, "usd")}
                  </p>
                </div>
                <div className="rounded-2xl bg-background p-4">
                  <p className="text-xs text-muted">Collected today</p>
                  <p className="mt-1 font-display text-xl font-bold tabular-nums">
                    {formatCents(todayCents, "usd")}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-card p-5">
              <p className="font-display text-lg font-bold">Account readiness</p>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link href="/branding" className="flex items-center justify-between rounded-2xl bg-background p-4">
                  <span>
                    <span className="block font-medium">White-label profile</span>
                    <span className="text-muted">
                      {brandReady ? profile?.businessName : "Add brand name and billing email"}
                    </span>
                  </span>
                  <span className={brandReady ? "text-success" : "text-pending"}>
                    {brandReady ? "Ready" : "Needed"}
                  </span>
                </Link>
                <Link href="/products" className="flex items-center justify-between rounded-2xl bg-background p-4">
                  <span>
                    <span className="block font-medium">Product catalog</span>
                    <span className="text-muted">Saved services for faster invoices</span>
                  </span>
                  <span className="font-display font-bold tabular-nums">{productCount}</span>
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            {[
              ["Paid invoices", paidCount.toString()],
              ["Clients auto-saved", clientCount.toString()],
              ["Products active", productCount.toString()],
              ["Net after fee", formatCents(monthNetCents, "usd")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-card p-5">
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">{value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Recent invoices</h2>
                <Link href="/invoices" className="text-sm font-medium text-accent">
                  View all
                </Link>
              </div>
              <div className="overflow-hidden rounded-2xl border border-line bg-card">
                {recentInvoices.length === 0 && (
                  <p className="px-5 py-10 text-center text-sm text-muted">
                    No invoices yet. Send your first one from the New invoice button.
                  </p>
                )}
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center gap-3 border-b border-line p-4 last:border-0 hover:bg-line/30"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-background font-display text-xs font-bold">
                      {initials(invoice.clientName, invoice.clientEmail)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{invoice.description}</p>
                      <p className="truncate text-sm text-muted">
                        {invoice.clientName || invoice.clientEmail} - {formatDate(invoice.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-display font-bold tabular-nums">
                        {formatCents(invoice.amount, invoice.currency)}
                      </span>
                      <StatusPill status={invoice.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Send again</h2>
                <Link href="/products" className="text-sm font-medium text-accent">
                  Products
                </Link>
              </div>
              <div className="rounded-2xl border border-line bg-card p-4">
                {recentClients.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted">Clients appear after your first invoice.</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {recentClients.map((client) => (
                    <Link
                      key={client.clientEmail}
                      href={`/invoices/new?client=${encodeURIComponent(client.clientEmail)}`}
                      className="rounded-2xl bg-background p-3"
                    >
                      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-line font-display text-xs font-bold">
                        {initials(client.clientName, client.clientEmail)}
                      </span>
                      <span className="block truncate text-sm font-medium">
                        {client.clientName || client.clientEmail.split("@")[0]}
                      </span>
                      <span className="block truncate text-xs text-muted">{client.clientEmail}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
