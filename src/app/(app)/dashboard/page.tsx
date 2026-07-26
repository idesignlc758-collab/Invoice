import Link from "next/link";
import { getCurrentUserWithInvoices } from "@/lib/current-user";
import { formatCents, initials } from "@/lib/format";
import { getRecentClients } from "@/lib/recent-clients";
import { SignOutButton } from "@/components/sign-out-button";
import { Sidebar } from "@/components/sidebar";
import { InvoiceTable } from "@/components/invoice-table";
import { StatusPill } from "@/components/status-pill";

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const user = await getCurrentUserWithInvoices();
  const { onboarding } = await searchParams;
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
  const openCents = user.invoices
    .filter((i) => i.status === "open")
    .reduce((sum, i) => sum + i.amount, 0);

  const recentClients = getRecentClients(user.invoices, 6);

  const connectBanner = !isReady && (
    <section className="rounded-2xl border border-line bg-card p-6">
      <h2 className="font-display text-xl font-bold mb-1">Get set up to invoice</h2>
      <p className="text-sm text-muted mb-4">
        {user.onboardingStatus === "pending" || onboarding === "pending"
          ? "You're almost there — Stripe is finishing verification. This can take a few minutes."
          : "Connect your Stripe account to start sending invoices. Takes about 3 minutes."}
      </p>
      <form action="/api/connect/onboard" method="POST">
        <button
          type="submit"
          className="rounded-full bg-accent text-accent-contrast font-display font-bold px-5 py-3 text-sm"
        >
          {user.stripeAccountId ? "Continue setup" : "Connect with Stripe"}
        </button>
      </form>
    </section>
  );

  return (
    <div className="flex-1 flex">
      <Sidebar />

      <div className="flex-1 min-w-0">
        {/* ---------- Mobile ---------- */}
        <main className="md:hidden flex flex-col max-w-md mx-auto w-full px-6 py-8 pb-28">
          <div className="flex items-center justify-between mb-6">
            <span className="font-display text-lg font-bold">Checkout</span>
            <SignOutButton />
          </div>

          {connectBanner}

          {isReady && (
            <>
              <section className="mb-8 mt-6">
                <p className="text-sm text-muted mb-1">Collected today</p>
                <p className="font-display text-5xl font-extrabold tabular-nums tracking-tight">
                  {formatCents(todayCents, "usd")}
                </p>
                <a href="/api/dashboard-link" className="text-sm text-accent font-medium">
                  View your Stripe dashboard →
                </a>
              </section>

              <section className="flex-1 flex flex-col gap-3">
                <p className="text-xs uppercase tracking-wide text-muted">Recent invoices</p>
                {user.invoices.length === 0 && (
                  <p className="text-sm text-muted py-6 text-center">
                    No invoices yet — send your first one below.
                  </p>
                )}
                {user.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-2xl border border-line bg-card p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{invoice.description}</p>
                      <p className="text-sm text-muted truncate">
                        {invoice.clientName || invoice.clientEmail}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="font-display font-bold tabular-nums">
                        {formatCents(invoice.amount, invoice.currency)}
                      </span>
                      <StatusPill status={invoice.status} />
                    </div>
                  </div>
                ))}
              </section>
            </>
          )}

          {isReady && (
            <div className="fixed bottom-0 inset-x-0 border-t border-line bg-background/95 backdrop-blur px-6 py-4">
              <Link
                href="/invoices/new"
                className="block w-full max-w-md mx-auto text-center rounded-full bg-accent text-accent-contrast font-display font-bold py-4"
              >
                + New invoice
              </Link>
            </div>
          )}
        </main>

        {/* ---------- Desktop ---------- */}
        <main className="hidden md:block px-10 py-10 max-w-5xl">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold">
                {greeting()}, {displayName(user.email)}
              </h1>
              <p className="text-sm text-muted mt-1">
                Here&apos;s what&apos;s happening with your invoices today.
              </p>
            </div>
            <div className="flex items-center gap-2.5 rounded-full border border-line bg-card pl-1 pr-4 py-1">
              <span className="w-8 h-8 rounded-full bg-accent text-accent-contrast flex items-center justify-center font-display font-bold text-xs">
                {initials(null, user.email)}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium">{displayName(user.email)}</p>
                <p className="text-xs text-muted">
                  {isReady ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
          </div>

          {!isReady && connectBanner}

          {isReady && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl border border-line bg-card p-5">
                  <p className="text-sm text-muted mb-1">Collected today</p>
                  <p className="font-display text-3xl font-extrabold tabular-nums">
                    {formatCents(todayCents, "usd")}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-card p-5">
                  <p className="text-sm text-muted mb-1">Awaiting payment</p>
                  <p className="font-display text-3xl font-extrabold tabular-nums text-pending">
                    {formatCents(openCents, "usd")}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-card p-5">
                  <p className="text-sm text-muted mb-1">Collected this month</p>
                  <p className="font-display text-3xl font-extrabold tabular-nums">
                    {formatCents(monthCents, "usd")}
                  </p>
                </div>
              </div>

              {recentClients.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-wide text-muted mb-3">Send again to</p>
                  <div className="flex gap-4">
                    {recentClients.map((rc) => (
                      <Link
                        key={rc.clientEmail}
                        href={`/invoices/new?client=${encodeURIComponent(rc.clientEmail)}`}
                        className="flex flex-col items-center gap-1.5 w-16"
                      >
                        <span className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-sm bg-card border border-line">
                          {initials(rc.clientName, rc.clientEmail)}
                        </span>
                        <span className="text-[11px] text-muted truncate w-full text-center">
                          {rc.clientName || rc.clientEmail.split("@")[0]}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wide text-muted">Invoices</p>
                <a href="/api/dashboard-link" className="text-sm text-accent font-medium">
                  View your Stripe dashboard →
                </a>
              </div>

              <InvoiceTable invoices={user.invoices} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
