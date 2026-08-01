"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BEFORE_OPTIONS = [1, 3, 7];
const AFTER_OPTIONS = [1, 3, 7, 14, 30];

function toggle(list: number[], value: number): number[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value].sort((a, b) => a - b);
}

export function PaymentReminderSettingsForm({
  initialEnabled,
  initialDaysBefore,
  initialDaysAfter,
}: {
  initialEnabled: boolean;
  initialDaysBefore: number[];
  initialDaysAfter: number[];
}) {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [daysBeforeDue, setDaysBeforeDue] = useState(initialDaysBefore);
  const [daysAfterDue, setDaysAfterDue] = useState(initialDaysAfter);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const response = await fetch("/api/payment-reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEnabled, daysBeforeDue, daysAfterDue }),
    });
    setSaving(false);
    if (!response.ok) {
      setError("Could not save reminder settings.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
        />
        <span>
          <span className="block font-medium text-foreground">
            Automatically email clients about unpaid invoices
          </span>
          <span className="text-xs text-muted">Runs once a day; each reminder only ever sends once.</span>
        </span>
      </label>

      {isEnabled && (
        <>
          <div>
            <p className="mb-2 text-sm font-medium">Before the due date</p>
            <div className="flex flex-wrap gap-2">
              {BEFORE_OPTIONS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDaysBeforeDue((current) => toggle(current, days))}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                    daysBeforeDue.includes(days) ? "border-accent bg-accent text-accent-contrast" : "border-line text-muted"
                  }`}
                >
                  {days} day{days === 1 ? "" : "s"} before
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">After the due date</p>
            <div className="flex flex-wrap gap-2">
              {AFTER_OPTIONS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDaysAfterDue((current) => toggle(current, days))}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                    daysAfterDue.includes(days) ? "border-accent bg-accent text-accent-contrast" : "border-line text-muted"
                  }`}
                >
                  {days} day{days === 1 ? "" : "s"} after
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="min-h-11 w-fit rounded-2xl bg-accent px-5 text-sm font-bold text-accent-contrast disabled:opacity-60"
      >
        {saving ? "Saving…" : saved ? "Saved" : "Save reminder settings"}
      </button>
    </div>
  );
}
