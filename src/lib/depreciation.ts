// Straight-line depreciation only -- the simplest, most defensible method,
// and the only one implemented here. This is for your own internal asset
// tracking (book value over time), not a tax depreciation schedule --
// actual tax depreciation (MACRS, Section 179, bonus depreciation, etc.)
// has jurisdiction-specific rules and should come from your accountant or
// tax software, not this calculation.
export function monthsElapsed(purchaseDate: Date, asOf: Date): number {
  const months =
    (asOf.getFullYear() - purchaseDate.getFullYear()) * 12 +
    (asOf.getMonth() - purchaseDate.getMonth()) -
    (asOf.getDate() < purchaseDate.getDate() ? 1 : 0);
  return Math.max(0, months);
}

export function straightLineDepreciation(params: {
  cost: number; // cents
  salvageValue: number; // cents
  usefulLifeMonths: number;
  purchaseDate: Date;
  asOf: Date;
}) {
  const depreciableBase = Math.max(0, params.cost - params.salvageValue);
  const monthlyDepreciation = params.usefulLifeMonths > 0 ? depreciableBase / params.usefulLifeMonths : 0;
  const elapsed = Math.min(monthsElapsed(params.purchaseDate, params.asOf), params.usefulLifeMonths);
  const accumulatedDepreciation = Math.round(monthlyDepreciation * elapsed);
  const bookValue = params.cost - accumulatedDepreciation;

  return {
    monthlyDepreciation: Math.round(monthlyDepreciation),
    accumulatedDepreciation,
    bookValue,
    isFullyDepreciated: elapsed >= params.usefulLifeMonths,
  };
}
