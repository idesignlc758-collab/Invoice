"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/format";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

type Employee = {
  id: string;
  name: string;
  role: string | null;
  payType: string;
  payRate: number;
  isActive: boolean;
};

export function EmployeeManager({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [payType, setPayType] = useState("salary");
  const [payRate, setPayRate] = useState("");
  const [startDate, setStartDate] = useState(todayInputValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role, payType, payRate, startDate }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save employee.");
      return;
    }
    setName("");
    setEmail("");
    setRole("");
    setPayRate("");
    router.refresh();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={createEmployee} className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold">Add employee</h2>
        <p className="mt-1 text-sm text-muted">
          For your own pay run records — not connected to a payroll tax provider.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sam Rivera"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              Email <span className="text-muted">(optional)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Role <span className="text-muted">(optional)</span>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Designer"
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              Pay type
              <select
                value={payType}
                onChange={(e) => setPayType(e.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="salary">Salary (annual)</option>
                <option value="hourly">Hourly</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              {payType === "salary" ? "Annual salary" : "Hourly rate"}
              <div className="flex items-center rounded-2xl border border-line bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-accent">
                <span className="mr-1 text-muted">$</span>
                <input
                  value={payRate}
                  onChange={(e) => setPayRate(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="min-w-0 flex-1 bg-transparent text-base focus:outline-none"
                />
              </div>
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
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
            {loading ? "Saving…" : "Save employee"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Employees</h2>
          <span className="text-sm text-muted">{employees.length} employees</span>
        </div>
        <div className="flex flex-col gap-3">
          {employees.length === 0 && (
            <p className="rounded-2xl bg-background px-4 py-8 text-center text-sm text-muted">
              No employees yet. Add one on the left.
            </p>
          )}
          {employees.map((employee) => (
            <div key={employee.id} className={`rounded-2xl bg-background p-4 ${employee.isActive ? "" : "opacity-50"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{employee.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {employee.role ?? "No role set"} · {employee.payType === "salary" ? "Salary" : "Hourly"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-lg font-bold tabular-nums">
                    {formatCents(employee.payRate)}
                    {employee.payType === "hourly" ? "/hr" : "/yr"}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleActive(employee.id, !employee.isActive)}
                    className="mt-1 text-xs font-medium text-muted hover:text-foreground"
                  >
                    {employee.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
