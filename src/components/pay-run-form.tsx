"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/format";

const inputClass =
  "rounded-2xl border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent";
const smallInputClass =
  "w-full rounded-xl border border-line bg-background px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-accent";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

type Employee = { id: string; name: string; payType: string; payRate: number };
type Row = {
  employeeId: string;
  grossPay: string;
  federalTax: string;
  stateTax: string;
  socialSecurity: string;
  medicare: string;
  otherDeductions: string;
};

function blankRow(employeeId: string): Row {
  return {
    employeeId,
    grossPay: "",
    federalTax: "",
    stateTax: "",
    socialSecurity: "",
    medicare: "",
    otherDeductions: "",
  };
}

export function PayRunForm({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const today = todayInputValue();
  const [payPeriodStart, setPayPeriodStart] = useState(today);
  const [payPeriodEnd, setPayPeriodEnd] = useState(today);
  const [payDate, setPayDate] = useState(today);
  const [selectedIds, setSelectedIds] = useState<string[]>(employees.map((e) => e.id));
  const [rows, setRows] = useState<Record<string, Row>>(
    Object.fromEntries(employees.map((e) => [e.id, blankRow(e.id)]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((i) => i !== id) : [...current, id]));
  }

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  const activeRows = selectedIds.map((id) => rows[id]).filter((r) => r && Number(r.grossPay) > 0);
  const canSave = Boolean(payPeriodStart && payPeriodEnd && payDate) && activeRows.length > 0;

  function netPayCents(row: Row) {
    const toCents = (v: string) => Math.round((Number(v) || 0) * 100);
    return (
      toCents(row.grossPay) -
      toCents(row.federalTax) -
      toCents(row.stateTax) -
      toCents(row.socialSecurity) -
      toCents(row.medicare) -
      toCents(row.otherDeductions)
    );
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);

    const response = await fetch("/api/pay-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payPeriodStart,
        payPeriodEnd,
        payDate,
        items: activeRows.map((row) => ({
          employeeId: row.employeeId,
          grossPay: Number(row.grossPay) || 0,
          federalTax: Number(row.federalTax) || 0,
          stateTax: Number(row.stateTax) || 0,
          socialSecurity: Number(row.socialSecurity) || 0,
          medicare: Number(row.medicare) || 0,
          otherDeductions: Number(row.otherDeductions) || 0,
        })),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save the pay run.");
      return;
    }

    router.push(`/payroll/pay-runs/${data.payRun.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm">
          Period start
          <input type="date" value={payPeriodStart} onChange={(e) => setPayPeriodStart(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Period end
          <input type="date" value={payPeriodEnd} onChange={(e) => setPayPeriodEnd(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Pay date
          <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-card text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium">Gross pay</th>
              <th className="px-3 py-2 font-medium">Federal</th>
              <th className="px-3 py-2 font-medium">State</th>
              <th className="px-3 py-2 font-medium">SS</th>
              <th className="px-3 py-2 font-medium">Medicare</th>
              <th className="px-3 py-2 font-medium">Other</th>
              <th className="px-3 py-2 text-right font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const included = selectedIds.includes(employee.id);
              const row = rows[employee.id];
              return (
                <tr key={employee.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={included}
                        onChange={() => toggleSelected(employee.id)}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      <span className={included ? "" : "text-muted"}>{employee.name}</span>
                    </label>
                  </td>
                  {included ? (
                    <>
                      <td className="px-2 py-2">
                        <input
                          value={row.grossPay}
                          onChange={(e) => updateRow(employee.id, { grossPay: e.target.value })}
                          placeholder="0.00"
                          inputMode="decimal"
                          className={smallInputClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.federalTax}
                          onChange={(e) => updateRow(employee.id, { federalTax: e.target.value })}
                          placeholder="0.00"
                          inputMode="decimal"
                          className={smallInputClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.stateTax}
                          onChange={(e) => updateRow(employee.id, { stateTax: e.target.value })}
                          placeholder="0.00"
                          inputMode="decimal"
                          className={smallInputClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.socialSecurity}
                          onChange={(e) => updateRow(employee.id, { socialSecurity: e.target.value })}
                          placeholder="0.00"
                          inputMode="decimal"
                          className={smallInputClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.medicare}
                          onChange={(e) => updateRow(employee.id, { medicare: e.target.value })}
                          placeholder="0.00"
                          inputMode="decimal"
                          className={smallInputClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={row.otherDeductions}
                          onChange={(e) => updateRow(employee.id, { otherDeductions: e.target.value })}
                          placeholder="0.00"
                          inputMode="decimal"
                          className={smallInputClass}
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {formatCents(netPayCents(row))}
                      </td>
                    </>
                  ) : (
                    <td className="px-3 py-2 text-muted" colSpan={7}>
                      Not included
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSave || saving}
        className="min-h-12 w-full rounded-2xl bg-accent px-5 py-3 font-display font-bold text-accent-contrast disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
      >
        {saving ? "Saving…" : "Save as draft"}
      </button>
    </form>
  );
}
