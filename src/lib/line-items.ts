export type IncomingItem = {
  description: string;
  quantity: number;
  unitAmountCents: number;
  productId?: string | null;
  saveProduct: boolean;
  productType: string;
  taxable: boolean;
};

export function parseLineItems(raw: unknown): IncomingItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const description = String(item.description ?? "").trim();
      const quantity = Math.round(Number(item.quantity));
      const unitAmountCents = Math.round(Number(item.unitAmountCents));
      const productId = item.productId ? String(item.productId) : null;
      const productType = String(item.productType ?? "service").trim() || "service";
      const taxable = item.taxable === undefined ? true : Boolean(item.taxable);

      return {
        description,
        quantity,
        unitAmountCents,
        productId,
        productType,
        taxable,
        saveProduct: Boolean(item.saveProduct),
      };
    })
    .filter(
      (item) =>
        item.description.length > 0 &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(item.unitAmountCents) &&
        item.unitAmountCents > 0
    );
}

export function summarizeItems(items: IncomingItem[]) {
  if (items.length === 0) return "Estimate";
  return items.length === 1
    ? items[0].description
    : `${items[0].description} + ${items.length - 1} more`;
}
