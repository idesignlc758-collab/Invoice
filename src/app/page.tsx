import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  FileText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

const proof = [
  "White-label invoice pages",
  "Stripe-secured checkout",
  "Cards, Link, bank debit, Cash App Pay",
  "No monthly fee",
];

const capabilities = [
  {
    title: "Create",
    body: "Use saved services, client email, tax, and terms to send a clean invoice fast.",
    icon: FileText,
  },
  {
    title: "Brand",
    body: "Show the service provider logo, address, support email, and payment footer.",
    icon: WalletCards,
  },
  {
    title: "Collect",
    body: "Customers pay through Stripe. The app tracks open, paid, and failed states.",
    icon: CreditCard,
  },
  {
    title: "Payout",
    body: "Your platform processes the payment and transfers the net amount to the connected account.",
    icon: Banknote,
  },
];

function ProductPanel() {
  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[1.5rem] bg-[#111111] p-3 shadow-[0_30px_90px_-52px_rgba(0,0,0,0.85)]">
      <div className="rounded-[1.15rem] bg-[#f6f6f1] p-4 text-[#141414]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#66665f]">Awaiting payment</p>
            <p className="mt-1 font-display text-4xl font-extrabold tracking-tight">$4,820</p>
          </div>
          <span className="rounded-full bg-[#141414] px-3 py-1.5 text-xs font-bold text-white">
            4 open
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_0.88fr]">
          <div className="space-y-2">
            {[
              ["Apex Repairs", "$1,150", "Open"],
              ["Lopez Cleaning", "$240", "Paid"],
              ["Northline Taxi", "$68", "Paid"],
            ].map(([name, amount, status]) => (
              <div key={name} className="flex items-center justify-between rounded-2xl bg-white px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{name}</p>
                  <p className="text-xs text-[#66665f]">Branded payment link</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">{amount}</p>
                  <p className={status === "Paid" ? "text-xs text-[#1e7a4c]" : "text-xs text-[#8a5b17]"}>
                    {status}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-sm font-bold text-white">
                RC
              </span>
              <div>
                <p className="font-display text-base font-bold">Rivera Cleaning</p>
                <p className="text-xs text-[#66665f]">Invoice #1042</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs text-[#66665f]">Invoice total</p>
              <p className="font-display text-4xl font-extrabold">$685.00</p>
            </div>
            <div className="mt-5 rounded-2xl bg-accent px-4 py-3 text-center text-sm font-bold text-white">
              Pay securely with Stripe
            </div>
            <p className="mt-3 text-center text-xs text-[#66665f]">Card, Link, ACH, Cash App</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContractComment() {
  return (
    <div
      aria-hidden="true"
      className="hidden"
      dangerouslySetInnerHTML={{
        __html:
          "<!-- THESIS: a minimal premium landing page that says the whole invoice-payment offer without section menus. OWN-WORLD: sharp fintech typography, black/white product proof, restrained red action, clean rounded panels. STORY: visitor understands branded invoices, Stripe checkout, connected-account payouts, and starts. FIRST VIEWPORT: header, direct headline, CTA, compact product panel, trust proof visible below. FORM: single-page conversion surface, no pricing/how-it-works menu. -->",
      }}
    />
  );
}

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <>
      <ContractComment />
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Invoice homepage">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background">
            <WalletCards className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">Invoice</span>
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

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-14 pt-8 md:px-8 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:pb-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Secure invoice payments powered by Stripe
            </p>
            <h1 className="mt-6 max-w-4xl text-balance font-display text-[3.15rem] font-extrabold leading-[0.98] tracking-tight md:text-7xl">
              Invoice payments for service businesses
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted md:text-lg">
              Send branded invoices from your phone, let customers pay through Stripe,
              and move payouts to the connected business account.
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
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-line px-6 font-bold text-foreground"
              >
                Open dashboard
              </Link>
            </div>
          </div>

          <ProductPanel />
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

        <section className="mx-auto w-full max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">
                Everything needed to send, collect, and explain the payment.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                The page stays simple for service providers and clear for customers:
                your brand is visible, iDesignLC processes securely with Stripe, and
                the payment path is easy to understand.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {capabilities.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-2xl bg-card p-5">
                    <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                    <h3 className="mt-4 font-display text-lg font-bold">{item.title}</h3>
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
              <p className="text-sm font-semibold text-white/65">Simple pricing</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
                5% per paid invoice. No monthly fee.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                Build a branded checkout experience for each business while keeping
                Stripe-secured payment language clear at the moment of payment.
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
    </>
  );
}
