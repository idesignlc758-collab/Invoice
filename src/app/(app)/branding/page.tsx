import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { BrandingForm } from "@/components/branding-form";

export default async function BrandingPage() {
  const user = await getCurrentUser();
  const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <header className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div>
          <p className="text-sm font-medium text-muted">Client-facing identity</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            Branding
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Manage the business details, invoice terms, and payment-page identity clients see
            before they pay.
          </p>
        </div>
        <div className="rounded-2xl bg-background px-4 py-3 text-sm text-muted">
          Applies to new invoices
        </div>
      </header>
      <BrandingForm profile={profile} email={user.email} />
    </main>
  );
}
