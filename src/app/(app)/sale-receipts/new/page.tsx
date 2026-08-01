import Link from "next/link";
import { SaleReceiptForm } from "@/components/sale-receipt-form";

export default function NewSaleReceiptPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Money already collected</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">New sale receipt</h1>
        </div>
        <Link href="/sale-receipts" className="text-sm font-medium text-muted hover:text-foreground">
          Cancel
        </Link>
      </div>
      <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <SaleReceiptForm />
      </div>
    </main>
  );
}
