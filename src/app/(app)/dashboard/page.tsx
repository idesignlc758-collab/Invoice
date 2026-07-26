import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

const statusStyles: Record<string, string> = {
  paid: "bg-accent/15 text-accent",
  open: "bg-gold-soft text-gold",
  payment_failed: "bg-danger/15 text-danger",
  draft: "bg-line text-muted",
  void: "bg-line text-muted",
  uncollectible: "bg-danger/15 text-danger",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    include: { invoices: { orderBy: { createdAt: "desc" } } },
  });
  const { onboarding } = await searchParams;

  const isReady = user.onboardingStatus === "ready";

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
      {!isReady && (
        <section className="rounded-lg border border-line bg-card p-6">
          <h2 className="font-serif text-xl mb-1">Get set up to invoice</h2>
          <p className="text-sm text-muted mb-4">
            {user.onboardingStatus === "pending" || onboarding === "pending"
              ? "You're almost there — Stripe is finishing verification. This can take a few minutes."
              : "Connect your Stripe account to start sending invoices. Takes about 3 minutes."}
          </p>
          <form action="/api/connect/onboard" method="POST">
            <button
              type="submit"
              className="rounded-md bg-accent text-accent-contrast font-medium px-4 py-2.5 text-sm"
            >
              {user.stripeAccountId ? "Continue setup" : "Connect with Stripe"}
            </button>
          </form>
        </section>
      )}

      {isReady && (
        <section className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl">Your invoices</h1>
            <a
              href="/api/dashboard-link"
              className="text-sm text-accent font-medium"
            >
              View your Stripe dashboard →
            </a>
          </div>
          <Link
            href="/invoices/new"
            className="rounded-md bg-accent text-accent-contrast font-medium px-4 py-2.5 text-sm"
          >
            New invoice
          </Link>
        </section>
      )}

      {isReady && (
        <section className="flex flex-col gap-3">
          {user.invoices.length === 0 && (
            <p className="text-sm text-muted">No invoices yet.</p>
          )}
          {user.invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="rounded-lg border border-line bg-card p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{invoice.description}</p>
                <p className="text-sm text-muted truncate">{invoice.clientEmail}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-mono text-sm tabular-nums">
                  {formatCents(invoice.amount, invoice.currency)}
                </span>
                <span
                  className={`text-xs font-medium uppercase tracking-wide px-2 py-1 rounded-full ${
                    statusStyles[invoice.status] ?? "bg-line text-muted"
                  }`}
                >
                  {invoice.status.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
