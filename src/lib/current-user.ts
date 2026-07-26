import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@example.com";
const INVOICES_INCLUDE = { invoices: { orderBy: { createdAt: "desc" as const } } };

async function getOrCreateDemoUser() {
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEMO_EMAIL,
        passwordHash: "demo",
        stripeAccountId: "acct_demo_preview",
        onboardingStatus: "ready",
      },
    });
  }

  const invoiceCount = await prisma.invoice.count({ where: { userId: user.id } });
  if (invoiceCount === 0) {
    const now = new Date();
    await prisma.invoice.createMany({
      data: [
        {
          userId: user.id,
          stripeInvoiceId: "in_demo_1",
          stripeCustomerId: "cus_demo_1",
          clientEmail: "jordan@example.com",
          clientName: "Jordan Lee",
          description: "Ride",
          amount: 1850,
          feeAmount: 93,
          currency: "usd",
          status: "paid",
          paidAt: now,
        },
        {
          userId: user.id,
          stripeInvoiceId: "in_demo_2",
          stripeCustomerId: "cus_demo_2",
          clientEmail: "sam@example.com",
          clientName: "Sam Rivera",
          description: "Airport run",
          amount: 4200,
          feeAmount: 210,
          currency: "usd",
          status: "paid",
          paidAt: now,
        },
        {
          userId: user.id,
          stripeInvoiceId: "in_demo_3",
          stripeCustomerId: "cus_demo_3",
          clientEmail: "alex@example.com",
          clientName: "Alex Chen",
          description: "Delivery",
          amount: 2500,
          feeAmount: 125,
          currency: "usd",
          status: "open",
          hostedInvoiceUrl: "https://invoice.stripe.com/demo",
        },
      ],
    });
  }

  return user;
}

// Preview-mode helper: uses the real signed-in user if there is one, otherwise
// falls back to a seeded demo account so the UI can be viewed without logging in.
export async function getCurrentUser() {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user) return user;
  }
  return getOrCreateDemoUser();
}

// Same resolution as getCurrentUser, but includes invoices in the same query
// instead of requiring a separate re-fetch by the caller.
export async function getCurrentUserWithInvoices() {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: INVOICES_INCLUDE,
    });
    if (user) return user;
  }
  const demoUser = await getOrCreateDemoUser();
  return prisma.user.findUniqueOrThrow({ where: { id: demoUser.id }, include: INVOICES_INCLUDE });
}
