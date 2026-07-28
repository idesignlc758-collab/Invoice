import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <SignUp path="/signup" routing="path" signInUrl="/login" fallbackRedirectUrl="/dashboard" />
    </main>
  );
}
