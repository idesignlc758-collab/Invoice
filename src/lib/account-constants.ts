export const ACCOUNT_TYPES = ["asset", "liability", "equity", "income", "expense"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  income: "Income",
  expense: "Expense",
};

// A normal debit-balance account (assets, expenses) increases with a debit;
// a normal credit-balance account (liabilities, equity, income) increases
// with a credit. Used to compute a signed running/net balance consistently
// across the ledger and trial balance.
export function normalBalanceSign(type: AccountType): 1 | -1 {
  return type === "asset" || type === "expense" ? 1 : -1;
}

export const DEFAULT_CHART_OF_ACCOUNTS: { code: string; name: string; type: AccountType }[] = [
  { code: "1000", name: "Cash", type: "asset" },
  { code: "1100", name: "Accounts Receivable", type: "asset" },
  { code: "2000", name: "Accounts Payable", type: "liability" },
  { code: "2100", name: "Sales Tax Payable", type: "liability" },
  { code: "3000", name: "Owner's Equity", type: "equity" },
  { code: "3100", name: "Retained Earnings", type: "equity" },
  { code: "4000", name: "Sales Income", type: "income" },
  { code: "4100", name: "Service Income", type: "income" },
  { code: "5000", name: "Rent Expense", type: "expense" },
  { code: "5100", name: "Utilities Expense", type: "expense" },
  { code: "5200", name: "Office Expense", type: "expense" },
  { code: "5300", name: "Software Expense", type: "expense" },
  { code: "5400", name: "Marketing Expense", type: "expense" },
  { code: "5500", name: "Professional Services Expense", type: "expense" },
  { code: "5600", name: "Travel Expense", type: "expense" },
  { code: "5900", name: "Other Expense", type: "expense" },
];
