import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { getRecentClients } from "@/lib/recent-clients";
import { NewInvoiceFlow } from "@/components/new-invoice-flow";
import { notFound } from "next/navigation";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; estimate?: string }>;
}) {
  const user = await getCurrentUser();
  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { clientEmail: true, clientName: true, description: true, amount: true },
  });
  const products = await prisma.product.findMany({
    where: { userId: user.id, active: true },
    orderBy: [{ timesUsed: "desc" }, { updatedAt: "desc" }],
    take: 24,
    select: {
      id: true,
      name: true,
      description: true,
      unitAmount: true,
      currency: true,
      type: true,
      taxable: true,
    },
  });
  const profile = await prisma.businessProfile.findUnique({
    where: { userId: user.id },
    select: { defaultTermsDays: true, clientTerms: true, defaultClientNote: true },
  });

  const recentClients = getRecentClients(invoices, 5);

  const { client, estimate } = await searchParams;
  const prefill = client ? recentClients.find((c) => c.clientEmail === client) ?? null : null;
  const sourceEstimate = estimate
    ? await prisma.estimate.findFirst({
        where: { id: estimate, userId: user.id },
        include: { lineItems: { orderBy: { position: "asc" } } },
      })
    : null;

  if (estimate && !sourceEstimate) notFound();
  if (sourceEstimate && sourceEstimate.status !== "accepted") notFound();

  return (
    <NewInvoiceFlow
      recentClients={recentClients}
      products={products}
      prefillClient={prefill}
      initialEstimate={
        sourceEstimate
          ? {
              id: sourceEstimate.id,
              clientEmail: sourceEstimate.clientEmail,
              clientName: sourceEstimate.clientName,
              taxPercent: sourceEstimate.taxPercent,
              dueInDays: profile?.defaultTermsDays ?? 0,
              clientNote: sourceEstimate.clientNote ?? "",
              clientTerms: sourceEstimate.clientTerms ?? "",
              privateMemo: sourceEstimate.privateMemo ?? "",
              items: sourceEstimate.lineItems.map((item) => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitCents: item.unitAmount,
                productId: item.productId,
                productType: item.productType ?? "service",
                taxable: item.taxable,
                saveProduct: false,
              })),
            }
          : null
      }
      defaultTermsDays={profile?.defaultTermsDays ?? 0}
      defaultClientTerms={profile?.clientTerms ?? ""}
      defaultClientNote={profile?.defaultClientNote ?? ""}
    />
  );
}
