import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center px-6 py-12 focus:outline-none">
      <SignIn path="/login" routing="path" signUpUrl="/signup" fallbackRedirectUrl="/dashboard" />
    </main>
  );
}
