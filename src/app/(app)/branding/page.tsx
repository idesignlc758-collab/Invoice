import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { BrandingForm } from "@/components/branding-form";

export default async function BrandingPage() {
  const user = await getCurrentUser();
  const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Client-facing identity</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Branding</h1>
      </div>
      <BrandingForm profile={profile} email={user.email} />
    </main>
  );
}
