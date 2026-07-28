import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const INVOICES_INCLUDE = { invoices: { orderBy: { createdAt: "desc" as const } } };

async function getOrCreateLocalUser(clerkId: string) {
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("Signed-in Clerk user has no email address on file");
  }

  return prisma.user.create({ data: { clerkId, email } });
}

// Resolves the signed-in Clerk user to (or creates) the corresponding local
// User row that holds our own domain data (stripeAccountId, invoices, etc).
// Protected routes are gated by middleware.ts, so userId should always be
// present here — but we still fail loudly rather than silently, since there's
// no demo fallback anymore.
export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  return getOrCreateLocalUser(userId);
}

// Same resolution as getCurrentUser, but includes invoices in the same query
// instead of requiring a separate re-fetch by the caller.
export async function getCurrentUserWithInvoices() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  const user = await getOrCreateLocalUser(userId);
  return prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: INVOICES_INCLUDE });
}
