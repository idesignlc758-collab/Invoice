import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 flex-shrink-0 flex-col border-r border-line px-5 py-6">
      <span className="font-display text-lg font-bold mb-8">Checkout</span>

      <Link
        href="/invoices/new"
        className="rounded-full bg-accent text-accent-contrast font-display font-bold text-sm py-3 text-center mb-8"
      >
        + New invoice
      </Link>

      <nav className="flex flex-col gap-1 text-sm">
        <Link
          href="/dashboard"
          className="rounded-lg px-3 py-2 font-medium bg-line/60 text-foreground"
        >
          Dashboard
        </Link>
        <a
          href="/api/dashboard-link"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg px-3 py-2 font-medium text-muted hover:text-foreground"
        >
          Stripe dashboard {"↗︎"}
        </a>
      </nav>

      <div className="flex-1" />

      <nav className="flex flex-col gap-1 text-xs mb-4 border-t border-line pt-4">
        <Link href="/terms" className="px-3 py-1.5 text-muted hover:text-foreground">
          Terms of Service
        </Link>
        <Link href="/refunds" className="px-3 py-1.5 text-muted hover:text-foreground">
          Refund Policy
        </Link>
      </nav>

      <SignOutButton />
    </aside>
  );
}
