"use client";

import {
  BadgeDollarSign,
  Boxes,
  Brush,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@/components/sign-out-button";

const navGroups = [
  {
    label: "Money",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/products", label: "Products", icon: Boxes },
      { href: "/branding", label: "Branding", icon: Brush },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

const mobileItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/branding", label: "Branding", icon: Brush },
  { href: "/payments", label: "Payments", icon: CreditCard },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function userInitial(email?: string | null) {
  return (email?.trim().slice(0, 1) || "I").toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const displayName = user?.fullName ?? email?.split("@")[0] ?? "Account";
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("checkout-sidebar") === "collapsed"
  );

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("checkout-sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return navGroups;
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.label.toLowerCase().includes(needle)),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <>
      <aside
        className={`hidden min-h-screen flex-shrink-0 flex-col border-r border-line bg-background/90 py-4 backdrop-blur-xl transition-[width] duration-200 md:flex ${
          collapsed ? "w-[4.5rem] px-2.5" : "w-[17.5rem] px-4"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            aria-label="Invoice overview"
            className={`flex min-w-0 items-center gap-3 ${collapsed ? "justify-center" : ""}`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-[0_12px_28px_-18px_rgba(0,0,0,0.7)]">
              <WalletCards className="h-5 w-5" aria-hidden="true" />
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate font-display text-lg font-extrabold tracking-tight">
                  Invoice
                </span>
                <span className="block truncate text-xs text-muted">Service payments</span>
              </span>
            )}
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line text-muted transition hover:bg-card hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            className="mx-auto mt-3 flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted transition hover:bg-card hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        <Link
          href="/invoices/new"
          title="New invoice"
          className={`mt-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-bold text-accent-contrast shadow-[0_14px_32px_-22px_var(--accent)] transition hover:brightness-95 ${
            collapsed ? "px-0" : "px-4"
          }`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {!collapsed && <span>New invoice</span>}
        </Link>

        {!collapsed && (
          <label className="mt-5 flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-card px-3 text-sm text-muted focus-within:ring-2 focus-within:ring-accent">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Search navigation</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted"
            />
          </label>
        )}

        <nav className="mt-6 flex flex-col gap-5 text-sm">
          {filteredGroups.map((group) => (
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
                      className={`group flex min-h-11 items-center gap-3 rounded-2xl font-medium transition ${
                        active
                          ? "bg-foreground text-background"
                          : "text-muted hover:bg-card hover:text-foreground"
                      } ${collapsed ? "justify-center px-0" : "px-3"}`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
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
            title="Stripe dashboard"
            className={`flex min-h-11 items-center gap-3 rounded-2xl font-medium text-muted transition hover:bg-card hover:text-foreground ${
              collapsed ? "justify-center px-0" : "px-3"
            }`}
          >
            <BadgeDollarSign className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {!collapsed && <span className="truncate">Stripe Dashboard</span>}
          </a>
        </nav>

        <div className="flex-1" />

        {!collapsed && (
          <div className="mb-4 rounded-2xl border border-line bg-card p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-muted">
                Payments are secured by Stripe. Your branded invoices stay under your business name.
              </p>
            </div>
          </div>
        )}

        <div
          className={`border-t border-line pt-4 ${
            collapsed ? "flex flex-col items-center gap-3" : "space-y-3"
          }`}
        >
          {!collapsed && (
            <nav className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/terms" className="rounded-xl px-2 py-2 text-muted hover:bg-card hover:text-foreground">
                Terms
              </Link>
              <Link href="/refunds" className="rounded-xl px-2 py-2 text-muted hover:bg-card hover:text-foreground">
                Refunds
              </Link>
              <Link href="/settings" className="rounded-xl px-2 py-2 text-muted hover:bg-card hover:text-foreground">
                Settings
              </Link>
              <a href="mailto:support@idesignlc.com" className="rounded-xl px-2 py-2 text-muted hover:bg-card hover:text-foreground">
                Support
              </a>
            </nav>
          )}

          <div className={collapsed ? "flex flex-col items-center gap-3" : "flex items-center gap-3"}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-card font-display text-sm font-bold">
              {userInitial(email)}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-muted">{email ?? "Signed in"}</p>
              </div>
            )}
            {collapsed ? <LifeBuoy className="h-4 w-4 text-muted" aria-hidden="true" /> : null}
          </div>

          <SignOutButton compact={collapsed} />
        </div>
      </aside>

      <Link
        href="/invoices/new"
        aria-label="Create new invoice"
        className="fixed bottom-[4.55rem] left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-accent text-accent-contrast shadow-[0_18px_34px_-18px_rgba(0,0,0,0.6)] md:hidden"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-background/95 px-2 pb-safe pt-2 text-[10px] font-medium backdrop-blur md:hidden">
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
