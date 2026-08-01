"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/format";

type ClientOption = { id: string; name: string | null; email: string };
type Project = {
  id: string;
  name: string;
  clientName: string | null;
  incomeCents: number;
  costCents: number;
  isActive: boolean;
};

export function ProjectManager({
  projects,
  clients,
}: {
  projects: Project[];
  clients: ClientOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, clientId: clientId || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save the project.");
      return;
    }
    setName("");
    setClientId("");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={createProject} className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold">Add project</h2>
        <p className="mt-1 text-sm text-muted">
          Tag invoices and expenses to a project to see its profitability.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Project name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Website redesign"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Client <span className="text-muted">(optional)</span>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">No client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name || client.email}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-contrast disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save project"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Projects</h2>
          <span className="text-sm text-muted">{projects.length} projects</span>
        </div>
        <div className="flex flex-col gap-3">
          {projects.length === 0 && (
            <p className="rounded-2xl bg-background px-4 py-8 text-center text-sm text-muted">
              No projects yet. Add one on the left.
            </p>
          )}
          {projects.map((project) => {
            const profit = project.incomeCents - project.costCents;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={`flex items-center justify-between gap-3 rounded-2xl bg-background p-4 hover:bg-line/30 ${
                  project.isActive ? "" : "opacity-50"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{project.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {project.clientName ?? "No client"}
                    {project.isActive ? "" : " · archived"} · Income {formatCents(project.incomeCents)} · Costs{" "}
                    {formatCents(project.costCents)}
                  </p>
                </div>
                <p
                  className={`shrink-0 font-display text-lg font-bold tabular-nums ${
                    profit >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {formatCents(profit)}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
