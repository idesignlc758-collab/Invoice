export const PAY_TYPES = ["salary", "hourly"] as const;
export type PayType = (typeof PAY_TYPES)[number];
