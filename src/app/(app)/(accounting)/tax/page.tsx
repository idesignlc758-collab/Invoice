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

export default async function TaxPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from || defaultFrom();
  const to = params.to || defaultTo();
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59`);

  const user = await getCurrentUser();

  const [invoices, receipts] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        userId: user.id,
        status: "paid",
        taxAmount: { gt: 0 },
        paidAt: { gte: fromDate, lte: toDate },
      },
      select: { id: true, description: true, taxAmount: true, taxPercent: true, paidAt: true },
    }),
    prisma.saleReceipt.findMany({
      where: {
        userId: user.id,
        status: "completed",
        taxAmount: { gt: 0 },
        saleDate: { gte: fromDate, lte: toDate },
      },
      select: { id: true, receiptNumber: true, taxAmount: true, taxPercent: true, saleDate: true },
    }),
  ]);

  const invoiceTaxCents = invoices.reduce((sum, i) => sum + i.taxAmount, 0);
  const receiptTaxCents = receipts.reduce((sum, r) => sum + r.taxAmount, 0);
  const totalTaxCents = invoiceTaxCents + receiptTaxCents;

  const byRate = new Map<number, number>();
  for (const invoice of invoices) byRate.set(invoice.taxPercent, (byRate.get(invoice.taxPercent) ?? 0) + invoice.taxAmount);
  for (const receipt of receipts) byRate.set(receipt.taxPercent, (byRate.get(receipt.taxPercent) ?? 0) + receipt.taxAmount);
  const rateBreakdown = Array.from(byRate.entries()).sort((a, b) => b[1] - a[1]);

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Tax already collected from clients</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Tax Collected</h1>
        <p className="mt-1 text-sm text-muted">
          A summary for your accountant or sales tax filing — this does not calculate tax owed,
          file returns, or remit payments.
        </p>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3">
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
          className="min-h-12 rounded-2xl bg-accent px-5 font-display font-bold text-accent-contrast"
        >
          View
        </button>
      </form>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">From invoices</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">{formatCents(invoiceTaxCents)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">From sale receipts</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">{formatCents(receiptTaxCents)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Total collected</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">{formatCents(totalTaxCents)}</p>
        </div>
      </section>

      {rateBreakdown.length > 0 && (
        <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
          <h2 className="mb-3 font-display text-lg font-bold">By tax rate</h2>
          <div className="flex flex-col gap-2 text-sm">
            {rateBreakdown.map(([rate, amount]) => (
              <div key={rate} className="flex justify-between">
                <span className="text-muted">{rate}%</span>
                <span className="tabular-nums">{formatCents(amount)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
        <h2 className="mb-3 font-display text-lg font-bold">Transactions</h2>
        {invoices.length === 0 && receipts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No taxable transactions in this range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 text-right font-medium">Rate</th>
                  <th className="px-3 py-2 text-right font-medium">Tax</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 text-muted">{invoice.paidAt ? formatDate(invoice.paidAt) : "—"}</td>
                    <td className="px-3 py-2">Invoice: {invoice.description}</td>
                    <td className="px-3 py-2 text-right text-muted">{invoice.taxPercent}%</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCents(invoice.taxAmount)}</td>
                  </tr>
                ))}
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 text-muted">{formatDate(receipt.saleDate)}</td>
                    <td className="px-3 py-2">Receipt {receipt.receiptNumber}</td>
                    <td className="px-3 py-2 text-right text-muted">{receipt.taxPercent}%</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCents(receipt.taxAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
