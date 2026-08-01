"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNTING_NAV_GROUPS, resolveAccountingLocation } from "@/lib/accounting-navigation";

// Full-screen creation flows bring their own chrome (step progress, its
// own header), so the tab bar would fight with them.
const FULL_SCREEN_PATHS = ["/invoices/new"];

// Two-level navigation ported from Connect's AccountingMainTabs (group
// row) + AccountingDesktopHub's item row. The sub-row only renders for
// groups that actually have more than one destination.
export function AccountingTabs() {
  const pathname = usePathname();
  const active = resolveAccountingLocation(pathname);
  const activeGroup = active?.group ?? null;

  if (FULL_SCREEN_PATHS.includes(pathname)) return null;

  return (
    <div className="border-b border-line bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <nav aria-label="Accounting sections" className="-mb-px flex gap-1 overflow-x-auto">
          {ACCOUNTING_NAV_GROUPS.map((group) => {
            const isActive = activeGroup?.id === group.id;
            const Icon = group.icon;
            return (
              <Link
                key={group.id}
                href={group.path}
                title={group.description}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {group.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {activeGroup && activeGroup.items.length > 1 && (
        <div className="border-t border-line bg-card">
          <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
            <nav
              aria-label={`${activeGroup.label} pages`}
              className="-mb-px flex gap-1 overflow-x-auto"
            >
              {activeGroup.items.map((item) => {
                const isActive = active?.item.id === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    title={item.description}
                    aria-current={isActive ? "page" : undefined}
                    className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
