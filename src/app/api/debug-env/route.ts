import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    "STRIPE_WEBHOOK_SECRET_CONNECT",
    "NEXT_PUBLIC_APP_URL",
    "MAILTRAP_HOST",
    "MAILTRAP_PORT",
    "MAILTRAP_USER",
    "MAILTRAP_PASS",
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

  // Prove the Turso connection actually works, not just that the vars exist.
  let database: { ok: boolean; error?: string };
  try {
    const count = await prisma.user.count();
    database = { ok: true };
    Object.assign(database, { userRows: count });
  } catch (err) {
    database = {
      ok: false,
      error: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    };
  }

  return NextResponse.json({ env: report, database });
}
