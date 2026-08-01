"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Shared archive/restore control for records that are filtered by isActive
// on their list page. Without this, those records can be created but never
// hidden, so the list only ever grows.
export function ArchiveToggle({
  endpoint,
  isActive,
  label,
  redirectTo,
}: {
  endpoint: string;
  isActive: boolean;
  label: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setLoading(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? `Could not update this ${label}.`);
      return;
    }
    if (!isActive || !redirectTo) {
      router.refresh();
    } else {
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="text-sm font-medium text-muted hover:text-foreground disabled:opacity-60"
      >
        {loading ? "Saving…" : isActive ? `Archive ${label}` : `Restore ${label}`}
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
