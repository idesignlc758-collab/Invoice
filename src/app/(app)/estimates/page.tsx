import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { EstimateTable } from "@/components/estimate-table";

export default async function EstimatesPage() {
  const user = await getCurrentUser();
  const estimates = await prisma.estimate.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const openCents = estimates
    .filter((estimate) => ["sent", "viewed"].includes(estimate.status))
    .reduce((sum, estimate) => sum + estimate.amount, 0);
  const acceptedCents = estimates
    .filter((estimate) => estimate.status === "accepted")
    .reduce((sum, estimate) => sum + estimate.amount, 0);
  const winCount = estimates.filter((estimate) =>
    ["accepted", "converted"].includes(estimate.status)
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Quotes before invoices</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Estimates</h1>
        </div>
        <Link
          href="/estimates/new"
          className="min-h-11 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-contrast"
        >
          + New estimate
        </Link>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Open estimate value</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {formatCents(openCents)}
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Accepted value</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {formatCents(acceptedCents)}
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Win count</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {winCount}
          </p>
        </div>
      </section>
      <EstimateTable estimates={estimates} />
    </main>
  );
}
