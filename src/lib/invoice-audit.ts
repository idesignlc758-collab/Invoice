import { prisma } from "@/lib/prisma";

// Best-effort: a failed audit-log write should never block the invoice
// action it's recording, so every call site wraps this in try/catch and
// only logs to the console on failure.
export async function logInvoiceEvent(params: {
  invoiceId: string;
  action: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.invoiceAuditLog.create({
    data: {
      invoiceId: params.invoiceId,
      action: params.action,
      oldStatus: params.oldStatus ?? null,
      newStatus: params.newStatus ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
