import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";

function defaultFrom() {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  return date.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default async function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; entity?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const type = params.type === "vendor" ? "vendor" : "customer";
  const entity = params.entity ?? "";
  const from = params.from || defaultFrom();
  const to = params.to || defaultTo();
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59`);

  const user = await getCurrentUser();

  const clients =
    type === "customer"
      ? await prisma.client.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } })
      : [];
  const vendorRows =
    type === "vendor"
      ? await prisma.expense.findMany({
          where: { userId: user.id, vendor: { not: null } },
          select: { vendor: true },
          distinct: ["vendor"],
          orderBy: { vendor: "asc" },
        })
      : [];
  const vendorNames = vendorRows.map((row) => row.vendor).filter((v): v is string => Boolean(v));

  const invoices =
    type === "customer" && entity
      ? await prisma.invoice.findMany({
          where: { userId: user.id, clientId: entity, createdAt: { gte: fromDate, lte: toDate } },
          orderBy: { createdAt: "asc" },
        })
      : [];
  const expenses =
    type === "vendor" && entity
      ? await prisma.expense.findMany({
          where: { userId: user.id, vendor: entity, date: { gte: fromDate, lte: toDate } },
          orderBy: { date: "asc" },
        })
      : [];

  const totalCents = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidCents = invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
  const balanceCents = totalCents - paidCents;
  const expenseTotalCents = expenses.reduce((sum, e) => sum + e.amount, 0);

  const selectedClient = clients.find((c) => c.id === entity);
  const pdfHref = entity
    ? `/api/statements/pdf?type=${type}&entity=${encodeURIComponent(entity)}&from=${from}&to=${to}`
    : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Per-client and per-vendor activity</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Statements</h1>
      </div>

      <div className="flex gap-1 self-start rounded-full border border-line p-1">
        <Link
          href={`/statements?type=customer&from=${from}&to=${to}`}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
            type === "customer" ? "bg-accent text-accent-contrast" : "text-muted"
          }`}
        >
          Customer
        </Link>
        <Link
          href={`/statements?type=vendor&from=${from}&to=${to}`}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
            type === "vendor" ? "bg-accent text-accent-contrast" : "text-muted"
          }`}
        >
          Vendor
        </Link>
      </div>

      <form method="GET" className="grid gap-4 rounded-2xl border border-line bg-card p-4 sm:grid-cols-4">
        <input type="hidden" name="type" value={type} />
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          {type === "customer" ? "Client" : "Vendor"}
          <select
            name="entity"
            defaultValue={entity}
            className="rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Select…</option>
            {type === "customer"
              ? clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name || client.email}
                  </option>
                ))
              : vendorNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          From
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          To
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <button
          type="submit"
          className="min-h-12 self-end rounded-2xl bg-accent px-5 font-display font-bold text-accent-contrast sm:col-span-4 sm:w-fit"
        >
          View statement
        </button>
      </form>

      {!entity ? (
        <p className="rounded-2xl bg-line px-4 py-3 text-center text-sm text-muted">
          Select a {type === "customer" ? "client" : "vendor"} and date range to load a statement.
        </p>
      ) : type === "customer" ? (
        <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-bold">
              {selectedClient?.name || selectedClient?.email}
            </h2>
            {pdfHref && (
              <a href={pdfHref} className="text-sm font-medium text-accent">
                Export PDF
              </a>
            )}
          </div>
          {invoices.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No invoices in this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                    <th className="px-3 py-2 text-right font-medium">Paid</th>
                    <th className="px-3 py-2 text-right font-medium">Balance</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const paid = inv.status === "paid" ? inv.amount : 0;
                    return (
                      <tr key={inv.id} className="border-b border-line last:border-0">
                        <td className="px-3 py-2 text-muted">{formatDate(inv.createdAt)}</td>
                        <td className="px-3 py-2">{inv.description}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatCents(inv.amount)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatCents(paid)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatCents(inv.amount - paid)}</td>
                        <td className="px-3 py-2 text-muted">{inv.status}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-line/40 font-bold">
                    <td className="px-3 py-2" colSpan={2}>
                      Total
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCents(totalCents)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCents(paidCents)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCents(balanceCents)}</td>
                    <td className="px-3 py-2" />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-bold">{entity}</h2>
            {pdfHref && (
              <a href={pdfHref} className="text-sm font-medium text-accent">
                Export PDF
              </a>
            )}
          </div>
          {expenses.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No expenses in this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-2 text-muted">{formatDate(expense.date)}</td>
                      <td className="px-3 py-2">{expense.description}</td>
                      <td className="px-3 py-2 text-muted">{expense.category}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCents(expense.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-line/40 font-bold">
                    <td className="px-3 py-2" colSpan={3}>
                      Total
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCents(expenseTotalCents)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
