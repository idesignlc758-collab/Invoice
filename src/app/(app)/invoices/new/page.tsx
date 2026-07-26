import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { getRecentClients } from "@/lib/recent-clients";
import { NewInvoiceFlow } from "@/components/new-invoice-flow";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const user = await getCurrentUser();
  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { clientEmail: true, clientName: true, description: true, amount: true },
  });

  const recentClients = getRecentClients(invoices, 5);

  const { client } = await searchParams;
  const prefill = client ? recentClients.find((c) => c.clientEmail === client) ?? null : null;

  return <NewInvoiceFlow recentClients={recentClients} prefillClient={prefill} />;
}
