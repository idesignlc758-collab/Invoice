import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  const [profile, productCount] = await Promise.all([
    prisma.businessProfile.findUnique({ where: { userId: user.id } }),
    prisma.product.count({ where: { userId: user.id, active: true } }),
  ]);

  const tasks = [
    {
      id: "stripe",
      label: "Connect Stripe",
      href: "/settings",
      done: user.onboardingStatus === "ready" && Boolean(user.stripeAccountId),
    },
    {
      id: "business",
      label: "Add business name",
      href: "/branding",
      done: Boolean(profile?.businessName),
    },
    {
      id: "email",
      label: "Set email identity",
      href: "/branding",
      done: Boolean(profile?.emailSenderName && profile?.replyToEmail),
    },
    {
      id: "logo",
      label: "Upload logo",
      href: "/branding",
      done: Boolean(profile?.logoUrl),
    },
    {
      id: "product",
      label: "Add a product",
      href: "/products",
      done: productCount > 0,
    },
  ];

  return NextResponse.json({
    complete: tasks.filter((task) => task.done).length,
    total: tasks.length,
    tasks,
  });
}
