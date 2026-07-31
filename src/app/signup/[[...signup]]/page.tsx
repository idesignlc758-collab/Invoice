import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center px-6 py-12 focus:outline-none">
      <SignUp path="/signup" routing="path" signInUrl="/login" fallbackRedirectUrl="/dashboard" />
    </main>
  );
}
