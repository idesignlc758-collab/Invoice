import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const [clientCount, productCount] = await Promise.all([
    prisma.client.count({ where: { userId: user.id } }),
    prisma.product.count({ where: { userId: user.id, active: true } }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Account controls</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Settings</h1>
      </div>

      <section className="rounded-3xl border border-line bg-card p-5">
        <h2 className="font-display text-xl font-bold">Account</h2>
        <div className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex justify-between rounded-2xl bg-background p-4">
            <span className="text-muted">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between rounded-2xl bg-background p-4">
            <span className="text-muted">Stripe status</span>
            <span className="font-medium">{user.onboardingStatus.replace("_", " ")}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/branding" className="rounded-3xl border border-line bg-card p-5">
          <p className="font-display text-lg font-bold">Branding</p>
          <p className="mt-1 text-sm text-muted">Logo, color, support info, and invoice footer.</p>
        </Link>
        <Link href="/products" className="rounded-3xl border border-line bg-card p-5">
          <p className="font-display text-lg font-bold">Products</p>
          <p className="mt-1 text-sm text-muted">{productCount} active saved services.</p>
        </Link>
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="font-display text-lg font-bold">Clients</p>
          <p className="mt-1 text-sm text-muted">
            {clientCount} clients have been saved automatically from invoices.
          </p>
        </div>
        <a
          href="/api/dashboard-link"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-3xl border border-line bg-card p-5"
        >
          <p className="font-display text-lg font-bold">Stripe Dashboard</p>
          <p className="mt-1 text-sm text-muted">Payouts, verification, balances, and disputes.</p>
        </a>
      </section>
    </main>
  );
}
