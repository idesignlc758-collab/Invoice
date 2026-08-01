import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/estimates(.*)",
  "/invoices(.*)",
  "/products(.*)",
  "/payments(.*)",
  "/branding(.*)",
  "/settings(.*)",
  "/expenses(.*)",
  "/reports(.*)",
  "/sale-receipts(.*)",
  "/statements(.*)",
  "/accounts(.*)",
  "/journal-entries(.*)",
  "/general-ledger(.*)",
  "/trial-balance(.*)",
  "/budgets(.*)",
  "/banking(.*)",
  "/fixed-assets(.*)",
  "/recurring-transactions(.*)",
  "/projects(.*)",
  "/payroll(.*)",
  "/tax(.*)",
  "/fx-rates(.*)",
  "/inventory(.*)",
  "/api/connect/onboard(.*)",
  "/api/dashboard-link(.*)",
  "/api/estimate-actions(.*)",
  "/api/estimates",
  "/api/invoices",
  "/api/products(.*)",
  "/api/branding(.*)",
  "/api/setup-status(.*)",
  "/api/expenses(.*)",
  "/api/sale-receipts(.*)",
  "/api/statements(.*)",
  "/api/payment-reminders(.*)",
  "/api/accounts(.*)",
  "/api/journal-entries(.*)",
  "/api/budgets(.*)",
  "/api/bank-accounts(.*)",
  "/api/bank-transactions(.*)",
  "/api/fixed-assets(.*)",
  "/api/recurring-transactions(.*)",
  "/api/projects(.*)",
  "/api/employees(.*)",
  "/api/pay-runs(.*)",
  "/api/fx-rates(.*)",
  "/api/inventory(.*)",
  // /api/cron/* is intentionally excluded: Vercel Cron calls it with no
  // Clerk session, authenticated instead by CRON_SECRET inside the route.
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
