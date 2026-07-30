import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { getRecentClients } from "@/lib/recent-clients";
import { NewEstimateFlow } from "@/components/new-estimate-flow";

export default async function NewEstimatePage() {
  const user = await getCurrentUser();
  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { clientEmail: true, clientName: true, description: true, amount: true },
  });
  const estimates = await prisma.estimate.findMany({
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
    select: { clientTerms: true, defaultClientNote: true },
  });

  return (
    <NewEstimateFlow
      recentClients={getRecentClients([...estimates, ...invoices], 5)}
      products={products}
      defaultTerms={profile?.clientTerms ?? ""}
      defaultClientNote={profile?.defaultClientNote ?? ""}
    />
  );
}
