import { AccountingTabs } from "@/components/accounting-tabs";

// Route group: the "(accounting)" folder name is wrapped in parentheses,
// so it groups these pages under one shared layout WITHOUT changing any
// URL -- /expenses is still /expenses.
export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccountingTabs />
      {children}
    </>
  );
}
