import {
  BookOpen,
  Building2,
  Calculator,
  FileText,
  Landmark,
  ListChecks,
  Package,
  PenLine,
  PiggyBank,
  Receipt,
  Repeat,
  ScrollText,
  Sparkles,
  Target,
  Wallet,
  Globe,
  Scale,
  Library,
  Users,
  type LucideIcon,
} from "lucide-react";

// Ported from Connect's ACCOUNTING_NAV_GROUPS. The group set, ordering,
// labels, and descriptions follow that source; the paths point at this
// app's real routes instead of Connect's `?tab=` query params, since
// every one of these is already its own page here.
//
// Groups present in Connect but not represented below -- Vendors,
// Purchase Orders, Payables (under Expenses) and Cash Controls (under
// Banking) -- are omitted on purpose: those features aren't built here
// yet, and a tab that leads nowhere is worse than a missing tab.

export type AccountingGroupId =
  | "invoices"
  | "sale-receipts"
  | "expenses"
  | "banking"
  | "reports"
  | "payroll"
  | "tax"
  | "records";

export interface AccountingNavItem {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
}

export interface AccountingNavGroup {
  id: AccountingGroupId;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  primaryAction?: { label: string; path: string };
  items: AccountingNavItem[];
}

export const ACCOUNTING_NAV_GROUPS: AccountingNavGroup[] = [
  {
    id: "invoices",
    label: "Invoices",
    description: "Invoices, collections, and customer receivables.",
    path: "/invoices",
    icon: FileText,
    primaryAction: { label: "New invoice", path: "/invoices/new" },
    items: [
      {
        id: "invoices",
        label: "Invoices",
        description: "Create invoices, track receivables, and review status.",
        path: "/invoices",
        icon: FileText,
      },
    ],
  },
  {
    id: "sale-receipts",
    label: "Sales Receipts",
    description: "Record completed sales and issued receipts.",
    path: "/sale-receipts",
    icon: Receipt,
    primaryAction: { label: "New receipt", path: "/sale-receipts/new" },
    items: [
      {
        id: "sale-receipts",
        label: "Sales Receipts",
        description: "Money collected outside Stripe — cash, check, or transfer.",
        path: "/sale-receipts",
        icon: Receipt,
      },
    ],
  },
  {
    id: "expenses",
    label: "Expenses",
    description: "Bills, spend tracking, and recurring costs.",
    path: "/expenses",
    icon: Wallet,
    primaryAction: { label: "Record expense", path: "/expenses/new" },
    items: [
      {
        id: "expenses",
        label: "Bills & Expenses",
        description: "Capture spend, attach receipts, and review transactions.",
        path: "/expenses",
        icon: Wallet,
      },
      {
        id: "recurring",
        label: "Recurring",
        description: "Expenses that log themselves on a schedule.",
        path: "/recurring-transactions",
        icon: Repeat,
      },
    ],
  },
  {
    id: "banking",
    label: "Banking",
    description: "Bank activity, CSV import, and reconciliation.",
    path: "/banking",
    icon: Building2,
    primaryAction: { label: "Open banking", path: "/banking" },
    items: [
      {
        id: "bank",
        label: "Banking",
        description: "Accounts, imported transactions, and reconciliation.",
        path: "/banking",
        icon: Building2,
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    description: "Income vs. expenses, planning, and customer statements.",
    path: "/reports",
    icon: Target,
    primaryAction: { label: "Open reports", path: "/reports" },
    items: [
      {
        id: "reports",
        label: "Reports",
        description: "Income, expenses, and spend by category.",
        path: "/reports",
        icon: Target,
      },
      {
        id: "budget",
        label: "Budget",
        description: "Budget planning and variance against actual spend.",
        path: "/budgets",
        icon: PiggyBank,
      },
      {
        id: "statements",
        label: "Statements",
        description: "Per-customer and per-vendor activity statements.",
        path: "/statements",
        icon: ScrollText,
      },
    ],
  },
  {
    id: "payroll",
    label: "Payroll",
    description: "Employees, pay runs, and project costing.",
    path: "/payroll",
    icon: Sparkles,
    primaryAction: { label: "Open payroll", path: "/payroll" },
    items: [
      {
        id: "payroll",
        label: "Employees",
        description: "Employee records and pay rates.",
        path: "/payroll",
        icon: Users,
      },
      {
        id: "pay-runs",
        label: "Pay Runs",
        description: "Pay periods, gross pay, and deductions.",
        path: "/payroll/pay-runs",
        icon: ListChecks,
      },
      {
        id: "projects",
        label: "Projects",
        description: "Project costs, income, and profitability.",
        path: "/projects",
        icon: ListChecks,
      },
    ],
  },
  {
    id: "tax",
    label: "Tax",
    description: "Sales tax collected, inventory, assets, and currency.",
    path: "/tax",
    icon: Calculator,
    primaryAction: { label: "Open tax", path: "/tax" },
    items: [
      {
        id: "tax",
        label: "Tax Collected",
        description: "Tax already collected on invoices and receipts.",
        path: "/tax",
        icon: Calculator,
      },
      {
        id: "inventory",
        label: "Inventory",
        description: "Stock on hand, adjustments, and reorder points.",
        path: "/inventory",
        icon: Package,
      },
      {
        id: "assets",
        label: "Fixed Assets",
        description: "Depreciation, disposals, and asset records.",
        path: "/fixed-assets",
        icon: Landmark,
      },
      {
        id: "fx-rates",
        label: "Exchange Rates",
        description: "Manual rates used for consolidated reporting.",
        path: "/fx-rates",
        icon: Globe,
      },
    ],
  },
  {
    id: "records",
    label: "Records",
    description: "Core accounting records, ledgers, and structure.",
    path: "/accounts",
    icon: BookOpen,
    primaryAction: { label: "Chart of accounts", path: "/accounts" },
    items: [
      {
        id: "chart-of-accounts",
        label: "Chart of Accounts",
        description: "Accounts and structural accounting settings.",
        path: "/accounts",
        icon: BookOpen,
      },
      {
        id: "journal-entries",
        label: "Journal Entries",
        description: "Review and post manual double-entry journals.",
        path: "/journal-entries",
        icon: PenLine,
      },
      {
        id: "trial-balance",
        label: "Trial Balance",
        description: "Review balances before reporting and close.",
        path: "/trial-balance",
        icon: Scale,
      },
      {
        id: "general-ledger",
        label: "General Ledger",
        description: "Inspect detailed ledger activity by account.",
        path: "/general-ledger",
        icon: Library,
      },
    ],
  },
];

/**
 * Resolves a pathname to its nav group and item. Longest-path-first so
 * `/payroll/pay-runs` matches the pay-runs item rather than the payroll
 * one it is nested under.
 */
export function resolveAccountingLocation(pathname: string) {
  let match: { group: AccountingNavGroup; item: AccountingNavItem } | null = null;

  for (const group of ACCOUNTING_NAV_GROUPS) {
    for (const item of group.items) {
      const isMatch = pathname === item.path || pathname.startsWith(`${item.path}/`);
      if (!isMatch) continue;
      if (!match || item.path.length > match.item.path.length) {
        match = { group, item };
      }
    }
  }

  return match;
}
