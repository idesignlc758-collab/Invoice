import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-line px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-serif text-lg">
          Checkout
        </Link>
        <SignOutButton />
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
