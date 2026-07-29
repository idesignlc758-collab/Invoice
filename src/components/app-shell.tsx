import { Sidebar } from "@/components/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-24 md:pb-0">{children}</div>
    </div>
  );
}
