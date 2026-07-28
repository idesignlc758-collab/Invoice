import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

const POINTS = [
  {
    title: "Built for your phone",
    body: "Tap the amount, pick who it's for, send. Three taps from job done to invoice out.",
  },
  {
    title: "Your money, your account",
    body: "Connect your own Stripe account. Payouts land in your bank, not ours.",
  },
  {
    title: "Only pay when you're paid",
    body: "5% per paid invoice. No monthly fee, no setup cost, nothing to cancel.",
  },
];

// A stylised invoice, drawn in CSS rather than shipped as an image — it stays
// crisp at any size and follows the theme tokens in light and dark.
function InvoicePreview() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-full max-w-xs select-none sm:max-w-sm"
    >
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-accent/5 blur-2xl" />

      <div className="rounded-3xl border border-line bg-card p-6 shadow-[0_24px_60px_-24px_rgb(0_0_0_/_0.28)]">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">From</p>
            <p className="font-display text-sm font-bold">Southern Taxi</p>
          </div>
          <span className="rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-success">
            Paid
          </span>
        </div>

        <p className="font-display text-4xl font-extrabold tabular-nums tracking-tight">
          $53.00
        </p>
        <p className="mt-1 text-xs text-muted">Invoice #1042 · Due on receipt</p>

        <div className="mt-6 space-y-2.5 border-t border-line pt-4 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Airport transfer</span>
            <span className="tabular-nums">$50.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Tax (5.99%)</span>
            <span className="tabular-nums">$3.00</span>
          </div>
        </div>

        <div className="mt-5 rounded-full bg-accent py-2.5 text-center text-xs font-bold text-accent-contrast">
          Pay invoice
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-display text-base font-extrabold tracking-tight">
          Invoice<span className="text-accent">.</span>
        </span>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/login"
            className="flex min-h-11 items-center rounded-full px-4 font-medium text-muted transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="flex min-h-11 items-center rounded-full bg-foreground px-4 font-medium text-background"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 sm:pt-16">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Invoicing on Stripe
              </p>

              <h1 className="text-balance font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Send an invoice.
                <br />
                <span className="text-accent">Get paid.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-md text-pretty text-base leading-relaxed text-muted lg:mx-0">
                Bill a client from your phone in seconds. They pay by card, the money
                lands in your own bank account, and you keep the rest.
              </p>

              <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="rounded-full bg-accent px-7 py-3.5 text-center font-display font-bold text-accent-contrast"
                >
                  Start invoicing
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-line px-7 py-3.5 text-center font-medium text-foreground transition-colors hover:bg-card"
                >
                  I have an account
                </Link>
              </div>

              <p className="mt-6 text-xs text-muted">
                No monthly fee · 5% per paid invoice · Payouts by Stripe
              </p>
            </div>

            <div className="lg:pl-8">
              <InvoicePreview />
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 sm:grid-cols-3 sm:gap-8">
            {POINTS.map((point) => (
              <div key={point.title}>
                <h2 className="mb-2 font-display text-base font-bold">{point.title}</h2>
                <p className="text-sm leading-relaxed text-muted">{point.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} iDesignLC Agency</p>
          <nav className="flex items-center gap-4">
            <Link
              href="/terms"
              className="flex min-h-11 items-center px-2 transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
            <Link
              href="/refunds"
              className="flex min-h-11 items-center px-2 transition-colors hover:text-foreground"
            >
              Refund Policy
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
