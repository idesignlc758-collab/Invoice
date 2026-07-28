"use client";

import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs";

export function SignOutButton() {
  return (
    <ClerkSignOutButton redirectUrl="/">
      <button className="text-sm text-muted hover:text-foreground">Log out</button>
    </ClerkSignOutButton>
  );
}
