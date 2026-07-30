"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function EstimateActions({
  estimateId,
  publicEstimateUrl,
  status,
}: {
  estimateId: string;
  publicEstimateUrl: string;
  status: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const canConvert = status === "accepted";
  const canChange = !["converted", "canceled", "declined", "expired"].includes(status);

  async function copyLink() {
    await navigator.clipboard.writeText(publicEstimateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function runAction(action: "cancel" | "mark_accepted") {
    setLoading(action);
    const res = await fetch(`/api/estimate-actions/${estimateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="grid gap-3">
      {canConvert && (
        <Link
          href={`/invoices/new?estimate=${estimateId}`}
          className="flex min-h-12 items-center justify-center rounded-full bg-accent px-5 text-sm font-bold text-accent-contrast"
        >
          Convert to invoice
        </Link>
      )}
      <button
        type="button"
        onClick={copyLink}
        className="flex min-h-12 items-center justify-center rounded-full border border-line text-sm font-bold"
      >
        {copied ? "Link copied" : "Copy estimate link"}
      </button>
      <a
        href={publicEstimateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-12 items-center justify-center rounded-full border border-line text-sm font-bold"
      >
        Open client view
      </a>
      {canChange && status !== "accepted" && (
        <button
          type="button"
          disabled={loading === "mark_accepted"}
          onClick={() => runAction("mark_accepted")}
          className="flex min-h-12 items-center justify-center rounded-full border border-line text-sm font-bold disabled:opacity-50"
        >
          {loading === "mark_accepted" ? "Updating..." : "Mark accepted"}
        </button>
      )}
      {canChange && (
        <button
          type="button"
          disabled={loading === "cancel"}
          onClick={() => runAction("cancel")}
          className="flex min-h-12 items-center justify-center rounded-full border border-line text-sm font-bold text-danger disabled:opacity-50"
        >
          {loading === "cancel" ? "Canceling..." : "Cancel estimate"}
        </button>
      )}
    </div>
  );
}
