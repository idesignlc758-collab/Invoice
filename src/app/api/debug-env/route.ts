import { NextResponse } from "next/server";

// TEMPORARY diagnostic route — reports only whether each expected env var is
// present and how long it is. Never returns actual values. Remove after use.
export async function GET() {
  const names = [
    "TURSO_DATABASE_URL",
    "TURSO_AUTH_TOKEN",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];

  const report = Object.fromEntries(
    names.map((name) => {
      const value = process.env[name];
      return [
        name,
        {
          present: value !== undefined,
          length: value?.length ?? 0,
        },
      ];
    })
  );

  return NextResponse.json(report);
}
