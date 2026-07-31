import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

const display = Space_Grotesk({
  variable: "--font-landing-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-landing-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const proof = [
  "Branded, white-label invoices",
  "Stripe-secured checkout",
  "Cards, Link, ACH, Cash App",
  "5% per paid invoice, no monthly fee",
];

const anatomy = [
  {
    field: "From",
    title: "Your brand, not ours",
    body: "Logo, business name, address, and support email appear on every invoice your client opens.",
    icon: Wallet,
  },
  {
    field: "Items",
    title: "Line items in seconds",
    body: "Pull from saved products or type a quick description, quantity, and rate from your phone.",
    icon: Receipt,
  },
  {
    field: "Total",
    title: "Stripe collects the payment",
    body: "Customers pay by card, Link, ACH, or Cash App Pay. Open, paid, and failed status track themselves.",
    icon: CreditCard,
  },
  {
    field: "Paid",
    title: "Payout to your account",
    body: "iDesignLC processes the charge and transfers your net straight to the connected bank account.",
    icon: Banknote,
  },
];

const invoiceItems = [
  { label: "Grout repair & reseal", qty: "1", amount: "$420.00" },
  { label: "Deep clean, 3 rooms", qty: "2", amount: "$180.00" },
  { label: "Callout fee", qty: "1", amount: "$85.00" },
];

function InvoiceArtifact() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-sm">
      <div
        aria-hidden="true"
        className="absolute inset-x-4 top-4 -z-10 h-[calc(100%-1rem)] rounded-2xl bg-line/80"
      />
      <div className="relative">
        <div className="perforated-top" aria-hidden="true" />
        <div className="relative overflow-hidden rounded-b-2xl border border-t-0 border-line bg-card p-6 shadow-[0_30px_90px_-45px_rgba(0,0,0,0.5)]">
          <div
            className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted"
            style={{ fontFamily: "var(--font-landing-mono)" }}
          >
            <span>Invoice</span>
            <span>No. 1042</span>
          </div>

          <div className="mt-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted">To</p>
              <p
                className="truncate text-lg font-bold"
                style={{ fontFamily: "var(--font-landing-display)" }}
              >
                Rivera Cleaning
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-pending-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-pending">
              Open
            </span>
          </div>

          <div
            className="mt-5 space-y-2.5 border-y border-dashed border-line py-4 text-xs"
            style={{ fontFamily: "var(--font-landing-mono)" }}
          >
            {invoiceItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-foreground/80">{item.label}</span>
                <span className="shrink-0 tabular-nums text-muted">{item.amount}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-end justify-between">
            <span className="text-xs text-muted">Total due</span>
            <span
              className="text-4xl font-bold tabular-nums"
              style={{ fontFamily: "var(--font-landing-display)" }}
            >
              $685.00
            </span>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="stamp-mark pointer-events-none absolute left-[54%] top-full select-none"
        >
          <div
            className="rounded-full border-[3px] border-accent px-4 py-2 text-sm font-bold uppercase tracking-[0.22em] text-accent"
            style={{ fontFamily: "var(--font-landing-mono)" }}
          >
            Paid
          </div>
        </div>
      </div>
    </div>
  );
}

function ThesisNote() {
  return (
    <div
      aria-hidden="true"
      className="hidden"
      dangerouslySetInnerHTML={{
        __html:
          "<!-- THESIS: the hero is a single invoice document, not a screenshot or a stat tile - a perforated card pulled off a pad, with a red ink PAID stamp pressing onto it once on load. OWN-WORLD: ledger paper, mono invoice numbers, dashed item rules, rubber-stamp ink - the actual vernacular of a paid invoice, not generic fintech gradients. STRUCTURE: the capability grid below is labeled FROM / ITEMS / TOTAL / PAID, the real fields on the document above, not a numbered step sequence. FORM: single-page conversion surface, no pricing/how-it-works nav menu. -->",
      }}
    />
  );
}

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className={`${display.variable} ${mono.variable} flex flex-1 flex-col`}>
      <ThesisNote />
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Invoice homepage">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background">
            <Receipt className="h-5 w-5" aria-hidden="true" />
          </span>
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "var(--font-landing-display)" }}
          >
            Invoice
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="flex min-h-11 items-center rounded-2xl px-4 text-sm font-medium text-muted transition hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="flex min-h-11 items-center rounded-2xl bg-foreground px-4 text-sm font-bold text-background"
          >
            Start
          </Link>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-14 pt-8 md:px-8 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:pb-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Secure invoice payments powered by Stripe
            </p>
            <h1
              className="mt-6 max-w-4xl text-balance text-[3.15rem] font-bold leading-[0.98] tracking-tight md:text-7xl"
              style={{ fontFamily: "var(--font-landing-display)" }}
            >
              Send the invoice.
              <br />
              Watch it get paid.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted md:text-lg">
              Brand it, send it from your phone, and let Stripe collect the card, Link, ACH, or
              Cash App payment. The money settles straight to your account.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-6 font-bold text-accent-contrast"
              >
                Start invoicing
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="#anatomy"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-line px-6 font-bold text-foreground"
              >
                See how it works
              </Link>
            </div>
          </div>

          <InvoiceArtifact />
        </section>

        <section className="border-y border-line bg-card">
          <div className="mx-auto grid w-full max-w-7xl gap-px px-5 py-2 text-sm font-medium md:grid-cols-4 md:px-8">
            {proof.map((item) => (
              <div key={item} className="flex min-h-12 items-center gap-2 bg-card px-1 md:px-4">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="anatomy" className="mx-auto w-full max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <h2
                className="text-3xl font-bold tracking-tight md:text-5xl"
                style={{ fontFamily: "var(--font-landing-display)" }}
              >
                One document.
                <br />
                Four jobs handled.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Everything on the invoice above is covered — from the name your client sees to
                the payout that lands in your bank account.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {anatomy.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.field} className="rounded-2xl bg-card p-5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                      <span
                        className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted"
                        style={{ fontFamily: "var(--font-landing-mono)" }}
                      >
                        {item.field}
                      </span>
                    </div>
                    <h3
                      className="mt-3 text-lg font-bold"
                      style={{ fontFamily: "var(--font-landing-display)" }}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 pb-16 md:px-8 md:pb-24">
          <div className="grid gap-3 rounded-[1.5rem] bg-[#151515] p-4 text-white md:grid-cols-[1fr_auto] md:items-center md:p-6">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60"
                style={{ fontFamily: "var(--font-landing-mono)" }}
              >
                Simple pricing
              </p>
              <h2
                className="mt-2 text-3xl font-bold tracking-tight md:text-5xl"
                style={{ fontFamily: "var(--font-landing-display)" }}
              >
                5% per paid invoice.
                <br />
                Nothing else.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                No monthly fee, no setup cost. If an invoice never gets paid, you never pay us
                either.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-6 font-bold text-accent-contrast"
            >
              Create your first invoice
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
