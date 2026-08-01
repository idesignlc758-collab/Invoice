import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ProjectManager } from "@/components/project-manager";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const [projects, clients] = await Promise.all([
    // Archived projects stay listed (dimmed) so they can be reopened --
    // filtering them out here would make them unreachable to restore.
    prisma.project.findMany({
      where: { userId: user.id },
      include: {
        client: true,
        invoices: { where: { status: "paid" }, select: { amount: true } },
        expenses: { select: { amount: true } },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    }),
    prisma.client.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  const rows = projects.map((project) => ({
    id: project.id,
    name: project.name,
    clientName: project.client?.name ?? project.client?.email ?? null,
    incomeCents: project.invoices.reduce((sum, i) => sum + i.amount, 0),
    costCents: project.expenses.reduce((sum, e) => sum + e.amount, 0),
    isActive: project.isActive,
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Profitability by project</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Projects</h1>
      </div>
      <ProjectManager projects={rows} clients={clients} />
    </main>
  );
}
