import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <SignIn path="/login" routing="path" signUpUrl="/signup" fallbackRedirectUrl="/dashboard" />
    </main>
  );
}
