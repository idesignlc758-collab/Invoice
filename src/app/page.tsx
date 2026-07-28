import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-accent mb-4">
          Invoices, on Stripe
        </p>
        <h1 className="font-display text-4xl leading-tight mb-4 text-balance">
          Send an invoice. Get paid. Keep your own payouts.
        </h1>
        <p className="text-muted mb-8">
          Connect your Stripe account once, then send mobile-friendly invoices to
          your clients. We keep a 5% fee — the rest lands straight in your bank.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-accent text-accent-contrast font-medium px-5 py-2.5"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-line px-5 py-2.5 text-foreground"
          >
            Log in
          </Link>
        </div>

        <nav className="mt-16 flex items-center justify-center gap-6 text-xs text-muted">
          <Link href="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
          <Link href="/refunds" className="hover:text-foreground">
            Refund Policy
          </Link>
        </nav>
      </div>
    </main>
  );
}
