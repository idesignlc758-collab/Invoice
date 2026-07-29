"use client";

import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <ClerkSignOutButton redirectUrl="/">
      <button
        className={`text-sm text-muted hover:text-foreground ${
          compact
            ? "flex h-10 w-10 items-center justify-center rounded-xl border border-line text-xs font-bold"
            : ""
        }`}
        title="Log out"
      >
        {compact ? "Out" : "Log out"}
      </button>
    </ClerkSignOutButton>
  );
}
