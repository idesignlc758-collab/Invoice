// Returns the first `limit` invoices with distinct client emails, most-recent
// first (assumes `invoices` is already ordered newest-first by the caller).
export function getRecentClients<T extends { clientEmail: string }>(
  invoices: T[],
  limit: number
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const invoice of invoices) {
    if (seen.has(invoice.clientEmail)) continue;
    seen.add(invoice.clientEmail);
    out.push(invoice);
    if (out.length === limit) break;
  }
  return out;
}
