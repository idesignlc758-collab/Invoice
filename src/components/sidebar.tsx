"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "O" },
  { href: "/invoices", label: "Invoices", icon: "I" },
  { href: "/products", label: "Products", icon: "P" },
  { href: "/payments", label: "Payments", icon: "$" },
  { href: "/branding", label: "Branding", icon: "B" },
  { href: "/settings", label: "Settings", icon: "S" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
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

  return (
    <>
      <aside
        className={`hidden min-h-screen flex-shrink-0 flex-col border-r border-line bg-background/85 py-5 backdrop-blur transition-[width] md:flex ${
          collapsed ? "w-[4.75rem] px-3" : "w-64 px-4"
        }`}
      >
        <div
          className={`mb-7 flex ${
            collapsed ? "flex-col items-center gap-3" : "items-center justify-between gap-2"
          }`}
        >
          <Link
            href="/dashboard"
            className={`flex min-w-0 items-center gap-2 font-display text-lg font-extrabold ${
              collapsed ? "justify-center" : ""
            }`}
            aria-label="Checkout overview"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-accent text-sm text-accent-contrast">
              C
            </span>
            {!collapsed && <span className="truncate">Checkout</span>}
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line text-sm text-muted hover:text-foreground"
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>

        <Link
          href="/invoices/new"
          className={`mb-7 flex min-h-12 items-center justify-center rounded-2xl bg-accent text-sm font-bold text-accent-contrast ${
            collapsed ? "w-full px-0" : "w-full px-4"
          }`}
          title="New invoice"
        >
          {collapsed ? "+" : "+ New invoice"}
        </Link>

        <nav className="flex flex-col gap-1 text-sm">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex min-h-11 items-center gap-3 rounded-2xl font-medium ${
                  active
                    ? "bg-line/70 text-foreground"
                    : "text-muted hover:bg-line/40 hover:text-foreground"
                } ${collapsed ? "justify-center px-0" : "px-3"}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-line text-[11px] font-bold">
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
          <a
            href="/api/dashboard-link"
            target="_blank"
            rel="noopener noreferrer"
            title="Stripe dashboard"
            className={`flex min-h-11 items-center gap-3 rounded-2xl font-medium text-muted hover:bg-line/40 hover:text-foreground ${
              collapsed ? "justify-center px-0" : "px-3"
            }`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-line text-[11px] font-bold">
              St
            </span>
            {!collapsed && <span>Stripe dashboard</span>}
          </a>
        </nav>

        <div className="flex-1" />

        {!collapsed && (
          <nav className="mb-4 flex flex-col gap-1 border-t border-line pt-4 text-xs">
            <Link href="/terms" className="px-3 py-1.5 text-muted hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/refunds" className="px-3 py-1.5 text-muted hover:text-foreground">
              Refund Policy
            </Link>
          </nav>
        )}

        <div className={collapsed ? "flex justify-center" : ""}>
          <SignOutButton compact={collapsed} />
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-background/95 px-3 pb-safe pt-2 text-[11px] font-medium backdrop-blur md:hidden">
        {navItems.slice(0, 5).map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-line text-[11px] font-bold">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
