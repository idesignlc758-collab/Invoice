import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BellRing,
  Brush,
  CheckCircle2,
  CreditCard,
  FileText,
  Link2,
  Send,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

const trustItems = [
  "Powered by Stripe",
  "White-label invoices",
  "Card, Link, bank debit, Cash App Pay",
  "No monthly fee",
];

const workflow = [
  {
    title: "Create invoice",
    body: "Add the client, choose saved services, and send a clean branded invoice from your phone.",
    icon: FileText,
  },
  {
    title: "Send branded link",
    body: "Your business name, logo, support email, and service address travel with the invoice.",
    icon: Send,
  },
  {
    title: "Customer pays",
    body: "Stripe-hosted checkout can surface cards, Link, bank debit, Cash App Pay, and wallets.",
    icon: CreditCard,
  },
  {
    title: "Track payout",
    body: "Monitor paid, open, and failed invoices while Stripe moves the payout to the connected account.",
    icon: Banknote,
  },
];

const paymentMethods = [
  "Cards",
  "Link",
  "ACH / bank debit",
  "Cash App Pay",
  "Apple Pay",
  "Google Pay",
];

function ProductCollage() {
  return (
    <div className="relative min-h-[520px] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-line bg-[#101010] p-4 shadow-[0_30px_90px_-52px_rgba(0,0,0,0.85)] md:min-h-[620px] md:p-6">
      <div className="absolute inset-x-8 top-8 h-px bg-white/10" />
      <div className="absolute left-8 top-7 flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff695d]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f8c24d]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#62d26f]" />
      </div>

      <div className="grid h-full gap-4 pt-8 md:grid-cols-[1.1fr_0.72fr]">
        <div className="rounded-2xl bg-[#f7f7f4] p-4 text-[#141414] md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#6b6b62]">Overview</p>
              <p className="font-display text-2xl font-extrabold">Money in motion</p>
            </div>
            <span className="rounded-full bg-[#141414] px-3 py-1.5 text-xs font-bold text-white">
              4 open
            </span>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.5)]">
            <p className="text-sm text-[#6b6b62]">Awaiting payment</p>
            <p className="mt-2 font-display text-5xl font-extrabold tracking-tight">$4,820</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-[#eef8f1] p-3">
                <p className="text-[#4b8060]">Paid today</p>
                <p className="font-bold">$930</p>
              </div>
              <div className="rounded-xl bg-[#eef2ff] p-3">
                <p className="text-[#59689b]">This month</p>
                <p className="font-bold">$12,440</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {[
              ["Lopez Cleaning", "$240.00", "Paid"],
              ["Apex Repairs", "$1,150.00", "Open"],
              ["Northline Taxi", "$68.00", "Paid"],
            ].map(([client, total, status]) => (
              <div key={client} className="flex items-center justify-between rounded-xl bg-white px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{client}</p>
                  <p className="text-xs text-[#6b6b62]">Branded invoice link sent</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">{total}</p>
                  <p className={status === "Paid" ? "text-xs text-[#1e7a4c]" : "text-xs text-[#9a6b16]"}>
                    {status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-rows-[1fr_auto]">
          <div className="rounded-2xl bg-white p-4 text-[#141414] shadow-[0_18px_44px_-32px_rgba(0,0,0,0.75)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-sm font-bold text-white">
                RL
              </span>
              <div>
                <p className="font-display text-lg font-extrabold">Rivera Lawn Co.</p>
                <p className="text-xs text-[#6b6b62]">Branded invoice preview</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs text-[#6b6b62]">Invoice total</p>
              <p className="font-display text-4xl font-extrabold">$685.00</p>
              <p className="mt-1 text-xs text-[#6b6b62]">Due on receipt</p>
            </div>
            <div className="mt-5 space-y-2 border-t border-[#e6e6df] pt-4 text-sm">
              <div className="flex justify-between">
                <span>Spring cleanup</span>
                <span className="font-bold">$520.00</span>
              </div>
              <div className="flex justify-between text-[#6b6b62]">
                <span>Mulch delivery</span>
                <span>$165.00</span>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-accent px-4 py-3 text-center text-sm font-bold text-white">
              Pay securely with Stripe
            </div>
          </div>

          <div className="rounded-2xl bg-[#202020] p-4 text-white">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="h-4 w-4 text-[#65d789]" aria-hidden="true" />
              Secure payment
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Card", "Link", "ACH", "Cash App"].map((method) => (
                <span key={method} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                  {method}
                </span>
              ))}
            </div>
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
          "<!-- THESIS: invoice payments for service businesses, refusing the generic SaaS split hero. OWN-WORLD: premium fintech surfaces, dark product stage, crisp white invoice panels, restrained red accent, green trust states. STORY: visitors see branded invoices, Stripe-secured payment choice, connected-account payouts, then start. FIRST VIEWPORT: nav over full-height product collage, copy overlays left, CTA sits below the proof. FORM: product-led persuade surface based on the approved plan. -->",
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
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-2" aria-label="Invoice homepage">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background">
              <WalletCards className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">Invoice</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#payments" className="hover:text-foreground">Payments</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
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
        </div>
      </header>

      <main className="flex-1">
        <section className="relative isolate min-h-svh overflow-hidden bg-background pt-24">
          <div className="absolute inset-x-0 top-0 -z-10 h-[68%] bg-[#161616]" />
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 pb-12 md:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div className="relative z-10 pt-6 text-white lg:pb-24">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                <BadgeCheck className="h-3.5 w-3.5 text-[#65d789]" aria-hidden="true" />
                Stripe-secured invoicing
              </p>
              <h1 className="max-w-3xl text-balance font-display text-[3rem] font-extrabold leading-[0.98] tracking-tight md:text-6xl lg:text-[5.5rem]">
                Invoice payments for service businesses
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/72 md:text-lg">
                Send mobile-first invoices with your logo, business details, and a secure
                Stripe checkout. Customers pay their way, and payouts move to the connected account.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-6 font-bold text-accent-contrast"
                >
                  Start invoicing
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/18 px-6 font-bold text-white"
                >
                  See how it works
                </a>
              </div>
            </div>
            <div className="relative z-10 lg:-mr-24 lg:pt-8">
              <ProductCollage />
            </div>
          </div>

          <div className="mx-auto -mt-2 w-full max-w-7xl px-5 pb-10 md:px-8">
            <div className="grid gap-2 rounded-2xl border border-line bg-card p-2 text-sm font-medium md:grid-cols-4">
              {trustItems.map((item) => (
                <div key={item} className="flex min-h-12 items-center gap-2 rounded-xl bg-background px-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-line bg-background py-16 md:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-accent">Workflow</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
                From finished job to paid invoice
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                The app stays simple: create the invoice, send the branded payment link,
                and keep every payment state visible from the dashboard.
              </p>
            </div>
            <div className="mt-10 grid gap-3 md:grid-cols-4">
              {workflow.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="rounded-2xl bg-card p-5">
                    <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
                    <h3 className="mt-5 font-display text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-card py-16 md:py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-accent">White-label clarity</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
                Your business leads. iDesignLC handles the secure transaction.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Invoices can show the service provider logo, name, billing address, and support
                details while the checkout clearly explains that payment is processed by iDesignLC
                Agency in partnership with Stripe.
              </p>
            </div>
            <div className="rounded-2xl bg-background p-5">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2247d8] text-sm font-bold text-white">
                    AC
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold">Atlas Cleaning</p>
                    <p className="text-sm text-muted">218 Market St, Orlando, FL</p>
                  </div>
                </div>
                <Brush className="h-5 w-5 text-accent" aria-hidden="true" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-card p-4">
                  <p className="text-sm font-bold">Provider identity</p>
                  <p className="mt-1 text-sm text-muted">Logo, brand color, address, footer, and email.</p>
                </div>
                <div className="rounded-xl bg-card p-4">
                  <p className="text-sm font-bold">Processor clarity</p>
                  <p className="mt-1 text-sm text-muted">Secure payment language paired with Stripe trust.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="payments" className="bg-background py-16 md:py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="rounded-[1.5rem] border border-line bg-card p-5">
              <div className="rounded-2xl bg-background p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">Select a payment method</p>
                    <p className="mt-1 font-display text-2xl font-extrabold">$685.00</p>
                  </div>
                  <ShieldCheck className="h-7 w-7 text-success" aria-hidden="true" />
                </div>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {paymentMethods.map((method) => (
                    <div key={method} className="flex min-h-12 items-center gap-2 rounded-xl border border-line px-3">
                      <CreditCard className="h-4 w-4 text-muted" aria-hidden="true" />
                      <span className="text-sm font-medium">{method}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-accent">Payment choice</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
                Let customers pay the way Stripe can support.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Your app can list the payment methods clearly, while Stripe dynamically presents
                the eligible methods for each checkout and customer location.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
                <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2">
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                  Mobile-ready
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2">
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                  Shareable link
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2">
                  <BellRing className="h-4 w-4" aria-hidden="true" />
                  Payment tracking
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-y border-line bg-card py-16 md:py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 md:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-accent">Simple pricing</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
                Only pay when the invoice gets paid.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["0", "monthly fee"],
                ["5%", "per paid invoice"],
                ["Stripe", "secure checkout"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-background p-5">
                  <p className="font-display text-4xl font-extrabold">{value}</p>
                  <p className="mt-2 text-sm text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#161616] px-5 py-16 text-white md:px-8 md:py-24">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            <p className="text-sm font-semibold text-white/65">Ready when the next job is done</p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-6xl">
              Create your first invoice
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/68">
              Build a branded payment experience for the business, then let Stripe handle the secure checkout.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-6 font-bold text-accent-contrast"
            >
              Start invoicing
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
