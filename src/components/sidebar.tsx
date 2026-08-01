"use client";

import {
  BadgeDollarSign,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Brush,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Globe,
  History,
  Landmark,
  Laptop,
  LayoutDashboard,
  Package,
  LifeBuoy,
  Library,
  LogOut,
  NotebookPen,
  PieChart,
  PiggyBank,
  Percent,
  Plus,
  Receipt,
  ReceiptText,
  Repeat,
  Scale,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { SignOutButton as ClerkSignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navGroups = [
  {
    label: "Money",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/estimates", label: "Estimates", icon: ClipboardCheck },
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/expenses", label: "Expenses", icon: Receipt },
      { href: "/sale-receipts", label: "Sale Receipts", icon: ReceiptText },
      { href: "/payments", label: "Payments", icon: CreditCard },
      { href: "/reports", label: "Reports", icon: PieChart },
      { href: "/statements", label: "Statements", icon: ScrollText },
      { href: "/projects", label: "Projects", icon: FolderKanban },
    ],
  },
  {
    label: "Books",
    items: [
      { href: "/accounts", label: "Chart of Accounts", icon: BookOpen },
      { href: "/journal-entries", label: "Journal Entries", icon: NotebookPen },
      { href: "/general-ledger", label: "General Ledger", icon: Library },
      { href: "/trial-balance", label: "Trial Balance", icon: Scale },
      { href: "/budgets", label: "Budgets", icon: PiggyBank },
      { href: "/banking", label: "Banking", icon: Landmark },
      { href: "/fixed-assets", label: "Fixed Assets", icon: Laptop },
      { href: "/recurring-transactions", label: "Recurring", icon: Repeat },
      { href: "/payroll", label: "Payroll", icon: Users },
      { href: "/tax", label: "Tax Collected", icon: Percent },
      { href: "/fx-rates", label: "Exchange Rates", icon: Globe },
      { href: "/inventory", label: "Inventory", icon: Package },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/products", label: "Products", icon: Boxes },
      { href: "/branding", label: "Branding", icon: Brush },
    ],
  },
];

const mobileItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/estimates", label: "Estimates", icon: ClipboardCheck },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SetupTask = {
  id: string;
  label: string;
  href: string;
  done: boolean;
};

type SetupStatus = {
  complete: number;
  total: number;
  tasks: SetupTask[];
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function userInitial(email?: string | null, name?: string | null) {
  return (name?.trim().slice(0, 1) || email?.trim().slice(0, 1) || "I").toUpperCase();
}

function displayAccountName(email?: string | null, name?: string | null) {
  return name || email?.split("@")[0] || "Business account";
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const displayName = displayAccountName(email, user?.fullName);
  const initial = userInitial(email, user?.fullName);
  const [accountOpen, setAccountOpen] = useState(false);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("checkout-sidebar") === "collapsed"
  );

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("checkout-sidebar", next ? "collapsed" : "expanded");
      setAccountOpen(false);
      return next;
    });
  }

  useEffect(() => {
    let active = true;
    fetch("/api/setup-status")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active) setSetupStatus(data);
      })
      .catch(() => {
        if (active) setSetupStatus(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const accountMenuLinks = (
    <>
      <Link href="/settings" className="mt-2 flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-card hover:text-foreground">
        <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
        Account settings
      </Link>
      <Link href="/branding" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-card hover:text-foreground">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Branding
      </Link>
      <Link href="/payments" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-card hover:text-foreground">
        <History className="h-4 w-4" aria-hidden="true" />
        Payment history
      </Link>
      <a href="mailto:support@idesignlc.com" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-card hover:text-foreground">
        <LifeBuoy className="h-4 w-4" aria-hidden="true" />
        Support
      </a>
      <div className="my-2 h-px bg-line" />
      <div className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-sm font-medium text-success">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Stripe secure
      </div>
      <ClerkSignOutButton redirectUrl="/">
        <button className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-muted hover:bg-card hover:text-foreground">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </button>
      </ClerkSignOutButton>
      <div className="mt-2 flex items-center justify-between border-t border-line px-3 pt-2 text-xs text-muted">
        <Link href="/terms" className="hover:text-foreground">Terms</Link>
        <Link href="/refunds" className="hover:text-foreground">Refunds</Link>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`hidden min-h-screen flex-shrink-0 bg-card/70 p-3 transition-[width] duration-200 md:flex ${
          collapsed ? "w-[5.25rem]" : "w-[19.25rem]"
        }`}
      >
        <div className="flex min-h-[calc(100vh-1.5rem)] w-full flex-col rounded-[1.5rem] border border-line bg-background p-3 shadow-[0_18px_50px_-38px_rgba(0,0,0,0.48)]">
          <div className={collapsed ? "flex flex-col items-center gap-3" : "flex items-center gap-3"}>
            <Link
              href="/dashboard"
              title="Business profile"
              aria-label="Business profile"
              className={`flex min-w-0 items-center gap-3 rounded-2xl transition hover:bg-card ${
                collapsed ? "h-11 w-11 justify-center" : "flex-1 p-2"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-contrast shadow-[0_12px_26px_-18px_var(--accent)]">
                <WalletCards className="h-5 w-5" aria-hidden="true" />
              </span>
              {!collapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base font-extrabold">
                    Invoice
                  </span>
                  <span className="block truncate text-xs text-muted">Business workspace</span>
                </span>
              )}
              {!collapsed && <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
            </Link>

            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line text-muted transition hover:bg-card hover:text-foreground"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <Link
            href="/invoices/new"
            title="New invoice"
            aria-label="New invoice"
            className={`mt-4 flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-foreground text-sm font-bold text-background transition hover:opacity-90 ${
              collapsed ? "px-0" : "px-4"
            }`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {!collapsed && <span>New invoice</span>}
          </Link>

          <nav className="mt-4 flex flex-col gap-3 text-sm">
            {navGroups.map((group) => (
              <div key={group.label}>
                {!collapsed && (
                  <p className="mb-1.5 px-3 text-[11px] font-semibold text-muted">{group.label}</p>
                )}
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.label}
                        aria-label={item.label}
                        className={`group relative flex min-h-10 items-center gap-3 rounded-2xl font-medium transition ${
                          active
                            ? "bg-card text-foreground shadow-[inset_0_0_0_1px_var(--line)]"
                            : "text-muted hover:bg-card hover:text-foreground"
                        } ${collapsed ? "justify-center px-0" : "px-3"}`}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {collapsed && (
                          <span className="pointer-events-none absolute left-[3.25rem] z-30 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition group-hover:opacity-100">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <a
              href="/api/dashboard-link"
              target="_blank"
              rel="noopener noreferrer"
              title="Stripe Dashboard"
              aria-label="Stripe Dashboard"
              className={`group relative flex min-h-10 items-center gap-3 rounded-2xl font-medium text-muted transition hover:bg-card hover:text-foreground ${
                collapsed ? "justify-center px-0" : "px-3"
              }`}
            >
              <BadgeDollarSign className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">Stripe Dashboard</span>}
              {collapsed && (
                <span className="pointer-events-none absolute left-[3.25rem] z-30 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition group-hover:opacity-100">
                  Stripe Dashboard
                </span>
              )}
            </a>
          </nav>

          <div className="flex-1" />

          {setupStatus && setupStatus.complete < setupStatus.total && (
            <Link
              href={setupStatus.tasks.find((task) => !task.done)?.href ?? "/settings"}
              title={`Setup ${setupStatus.complete}/${setupStatus.total} complete`}
              className={`mb-3 flex min-h-11 items-center gap-3 rounded-2xl border border-line bg-card font-medium text-foreground transition hover:border-accent/60 ${
                collapsed ? "justify-center px-0" : "px-3"
              }`}
            >
              <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-6 w-6 -rotate-90">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="var(--line)" strokeWidth="3" />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(setupStatus.complete / setupStatus.total) * 62.8} 62.8`}
                  />
                </svg>
              </span>
              {!collapsed && (
                <span className="min-w-0 flex-1 truncate text-sm">
                  Finish setup · {setupStatus.complete}/{setupStatus.total}
                </span>
              )}
            </Link>
          )}

          <div className="relative border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setAccountOpen((current) => !current)}
              aria-expanded={accountOpen}
              className={`flex w-full items-center rounded-2xl transition hover:bg-card ${
                collapsed ? "justify-center p-1" : "gap-3 p-2 text-left"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-card font-display text-sm font-bold">
                {initial}
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{displayName}</span>
                    <span className="block truncate text-xs text-muted">{email ?? "Signed in"}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </>
              )}
            </button>

            {accountOpen && (
              <div
                className={`absolute bottom-[4.25rem] z-40 w-64 rounded-2xl border border-line bg-background p-2 shadow-[0_24px_70px_-34px_rgba(0,0,0,0.55)] ${
                  collapsed ? "left-[3.75rem]" : "left-0"
                }`}
              >
                <div className="flex items-center gap-3 border-b border-line p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card font-display text-sm font-bold">
                    {initial}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{displayName}</span>
                    <span className="block truncate text-xs text-muted">{email ?? "Signed in"}</span>
                  </span>
                </div>
                {accountMenuLinks}
              </div>
            )}
          </div>
        </div>
      </aside>

      {pathname !== "/invoices/new" && pathname !== "/estimates/new" && (
        <Link
          href="/invoices/new"
          aria-label="Create new invoice"
          className="fixed bottom-[4.55rem] left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-accent text-accent-contrast shadow-[0_18px_34px_-18px_rgba(0,0,0,0.6)] md:hidden"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </Link>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-7 border-t border-line bg-background/95 px-1 pb-safe pt-2 text-[9px] font-medium backdrop-blur md:hidden">
        {mobileItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
