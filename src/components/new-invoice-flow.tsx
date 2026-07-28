"use client";

import { useState } from "react";
import Link from "next/link";
import { Keypad } from "@/components/keypad";
import { formatCents, initials } from "@/lib/format";

const PLATFORM_FEE_PERCENT = 5;
const JOB_PRESETS = ["Service", "Product", "Hourly", "Custom"];
const DUE_PRESETS = [
  { label: "Pay now", days: 0 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
];

type RecentClient = {
  clientEmail: string;
  clientName: string | null;
  description: string;
  amount: number;
};

type Step = "amount" | "details" | "review" | "sent";

export function NewInvoiceFlow({
  recentClients,
  prefillClient,
}: {
  recentClients: RecentClient[];
  prefillClient?: RecentClient | null;
}) {
  const [step, setStep] = useState<Step>("amount");
  const [cents, setCents] = useState(0);
  const [clientEmail, setClientEmail] = useState(prefillClient?.clientEmail ?? "");
  const [clientName, setClientName] = useState(prefillClient?.clientName ?? "");
  const [jobPreset, setJobPreset] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [dueInDays, setDueInDays] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const feeCents = Math.round(cents * (PLATFORM_FEE_PERCENT / 100));
  const netCents = cents - feeCents;
  const canSend = cents > 0 && clientEmail.trim().length > 3 && description.trim().length > 0;

  function onKey(key: string) {
    if (key === "⌫") {
      setCents((c) => Math.floor(c / 10));
      return;
    }
    setCents((c) => (c >= 10_000_000 ? c : c * 10 + Number(key)));
  }

  function pickRecentClient(rc: RecentClient) {
    setClientEmail(rc.clientEmail);
    setClientName(rc.clientName ?? "");
  }

  function pickJob(preset: string) {
    setJobPreset(preset);
    if (preset !== "Custom") setDescription(preset);
    else setDescription("");
  }

  function resetFlow() {
    setStep("amount");
    setCents(0);
    setClientEmail("");
    setClientName("");
    setJobPreset(null);
    setDescription("");
    setDueInDays(0);
    setShowDetails(false);
    setError(null);
    setSentUrl(null);
    setCopied(false);
  }

  async function send() {
    setError(null);
    setLoading(true);

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientEmail,
        clientName,
        description,
        amount: (cents / 100).toFixed(2),
        dueInDays,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }
    setSentUrl(data.hostedInvoiceUrl ?? null);
    setStep("sent");
  }

  async function share() {
    if (!sentUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Invoice", text: `Pay ${formatCents(cents)}`, url: sentUrl });
      } catch {
        // user cancelled the share sheet — no-op
      }
      return;
    }
    await navigator.clipboard.writeText(sentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const jobChips = (
    <div className="flex gap-2 mb-3 flex-wrap">
      {JOB_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => pickJob(preset)}
          className={`rounded-full px-4 py-2 text-sm font-medium border ${
            jobPreset === preset
              ? "bg-accent text-accent-contrast border-accent"
              : "bg-card text-foreground border-line"
          }`}
        >
          {preset}
        </button>
      ))}
    </div>
  );

  const dueLabel = DUE_PRESETS.find((preset) => preset.days === dueInDays)?.label ?? "Pay now";

  // Payment terms are core to any invoice, so these stay visible. Only the
  // genuinely optional client name hides behind "+ Add details", keeping the
  // common case fast on a phone.
  const dueChips = (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-wide text-muted mb-2">Payment due</p>
      <div className="flex gap-2 flex-wrap">
        {DUE_PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            onClick={() => setDueInDays(preset.days)}
            className={`rounded-full px-4 py-2 text-sm font-medium border ${
              dueInDays === preset.days
                ? "bg-accent text-accent-contrast border-accent"
                : "bg-card text-foreground border-line"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderDetails = (inputBg: string) =>
    showDetails ? (
      <label className="flex flex-col gap-1.5 text-sm mb-4">
        <span>
          Client name <span className="text-muted">(optional)</span>
        </span>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Sam Rivera"
          className={`rounded-xl border border-line ${inputBg} px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent`}
        />
      </label>
    ) : (
      <button
        type="button"
        onClick={() => setShowDetails(true)}
        className="text-sm font-medium text-accent mb-4 self-start"
      >
        + Add details
      </button>
    );

  const recentClientChips = recentClients.length > 0 && (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-wide text-muted mb-2">Send again to</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {recentClients.map((rc) => (
          <button
            key={rc.clientEmail}
            type="button"
            onClick={() => pickRecentClient(rc)}
            className="flex flex-col items-center gap-1 flex-shrink-0 w-16"
          >
            <span
              className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-sm border-2 ${
                clientEmail === rc.clientEmail
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-line bg-card text-foreground"
              }`}
            >
              {initials(rc.clientName, rc.clientEmail)}
            </span>
            <span className="text-[11px] text-muted truncate w-full text-center">
              {rc.clientName || rc.clientEmail.split("@")[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const feeBreakdown = (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex justify-between text-sm py-1.5">
        <span className="text-muted">Amount</span>
        <span className="font-display font-bold tabular-nums">{formatCents(cents)}</span>
      </div>
      <div className="flex justify-between text-sm py-1.5 border-t border-line">
        <span className="text-muted">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
        <span className="tabular-nums">{formatCents(feeCents)}</span>
      </div>
      <div className="flex justify-between text-sm py-1.5 border-t border-line font-medium">
        <span>You get</span>
        <span className="tabular-nums text-success">{formatCents(netCents)}</span>
      </div>
    </div>
  );

  const sentView = (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-success-soft flex items-center justify-center mb-5">
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-hidden="true">
          <path
            d="M5 13l4 4L19 7"
            stroke="var(--success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-extrabold mb-1">Invoice sent</h1>
      <p className="text-sm text-muted mb-8">
        {formatCents(cents)} to {clientEmail}. They&apos;ll get an email — or share the link
        directly right now.
      </p>

      <button
        type="button"
        onClick={share}
        className="w-full rounded-full bg-accent text-accent-contrast font-display font-bold py-4 mb-3"
      >
        {copied ? "Link copied ✓" : "Share invoice link"}
      </button>
      <button
        type="button"
        onClick={resetFlow}
        className="w-full rounded-full border border-line font-medium py-4 mb-3"
      >
        Send another
      </button>
      <Link href="/dashboard" className="text-sm text-muted mt-2">
        Back to dashboard
      </Link>
    </div>
  );

  return (
    <>
      {/* ---------- Mobile: keypad-first step flow ---------- */}
      <main className="md:hidden flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
        {step === "amount" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <Link href="/dashboard" className="text-sm text-muted">
                Cancel
              </Link>
              <p className="text-sm text-muted">Step 1 of 3</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="font-display text-6xl font-extrabold tabular-nums tracking-tight">
                {formatCents(cents)}
              </p>
            </div>
            <Keypad onKey={onKey} />
            <button
              type="button"
              disabled={cents === 0}
              onClick={() => setStep("details")}
              className="mt-8 rounded-full bg-accent text-accent-contrast font-display font-bold py-4 disabled:opacity-40"
            >
              Next
            </button>
          </>
        )}

        {step === "details" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <button type="button" onClick={() => setStep("amount")} className="text-sm text-muted">
                ← Back
              </button>
              <p className="text-sm text-muted">Step 2 of 3</p>
            </div>
            <p className="font-display text-3xl font-extrabold tabular-nums mb-6">
              {formatCents(cents)}
            </p>
            {recentClientChips}
            <label className="flex flex-col gap-1.5 text-sm mb-4">
              Client email
              <input
                type="email"
                required
                inputMode="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
                className="rounded-xl border border-line bg-card px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <p className="text-xs uppercase tracking-wide text-muted mb-2">What&apos;s this for?</p>
            {jobChips}
            {jobPreset === "Custom" && (
              <input
                type="text"
                autoFocus
                placeholder="What are you billing for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border border-line bg-card px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            )}
            {dueChips}
            {renderDetails("bg-card")}
            <div className="flex-1" />
            <button
              type="button"
              disabled={!(clientEmail.trim().length > 3 && description.trim().length > 0)}
              onClick={() => setStep("review")}
              className="mt-6 rounded-full bg-accent text-accent-contrast font-display font-bold py-4 disabled:opacity-40"
            >
              Review
            </button>
          </>
        )}

        {step === "review" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <button type="button" onClick={() => setStep("details")} className="text-sm text-muted">
                ← Back
              </button>
              <p className="text-sm text-muted">Step 3 of 3</p>
            </div>
            <div className="rounded-2xl border border-line bg-card p-6 mb-6" style={{ borderStyle: "dashed" }}>
              <p className="text-xs uppercase tracking-wide text-muted mb-1">{description}</p>
              <p className="font-display text-4xl font-extrabold tabular-nums mb-4">
                {formatCents(cents)}
              </p>
              <div className="flex justify-between text-sm py-2 border-t border-line">
                <span className="text-muted">To</span>
                <span className="font-medium">{clientName || clientEmail}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-t border-line">
                <span className="text-muted">Due</span>
                <span>{dueLabel}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-t border-line">
                <span className="text-muted">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                <span className="tabular-nums">{formatCents(feeCents)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-t border-line font-medium">
                <span>You get</span>
                <span className="tabular-nums text-success">{formatCents(netCents)}</span>
              </div>
            </div>
            {error && <p className="text-sm text-danger mb-4">{error}</p>}
            <div className="flex-1" />
            <button
              type="button"
              disabled={loading}
              onClick={send}
              className="rounded-full bg-accent text-accent-contrast font-display font-bold py-4 disabled:opacity-60"
            >
              {loading ? "Sending…" : `Send invoice for ${formatCents(cents)}`}
            </button>
          </>
        )}

        {step === "sent" && <div className="flex-1 flex flex-col justify-center">{sentView}</div>}
      </main>

      {/* ---------- Desktop: single-view card ---------- */}
      <div className="hidden md:flex flex-1 items-start justify-center py-14 px-6">
        <div className="w-full max-w-md rounded-3xl border border-line bg-card p-8">
          {step !== "sent" ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-display text-xl font-bold">New invoice</h1>
                <Link href="/dashboard" className="text-muted hover:text-foreground text-sm">
                  Close ✕
                </Link>
              </div>

              <label className="flex flex-col gap-1.5 text-sm mb-5">
                Amount
                <div className="flex items-center rounded-xl border border-line bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-accent">
                  <span className="text-muted mr-1 font-display font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={cents === 0 ? "" : (cents / 100).toString()}
                    onChange={(e) =>
                      setCents(Math.max(0, Math.round(Number(e.target.value || 0) * 100)))
                    }
                    className="flex-1 bg-transparent text-base font-display font-bold tabular-nums focus:outline-none"
                  />
                </div>
              </label>

              {recentClientChips}

              <label className="flex flex-col gap-1.5 text-sm mb-4">
                Client email
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>

              <p className="text-xs uppercase tracking-wide text-muted mb-2">What&apos;s this for?</p>
              {jobChips}
              {jobPreset === "Custom" && (
                <input
                  type="text"
                  placeholder="What are you billing for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl border border-line bg-background px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              )}

              {dueChips}
              <div className="flex flex-col">{renderDetails("bg-background")}</div>

              <div className="my-5">{feeBreakdown}</div>

              {error && <p className="text-sm text-danger mb-4">{error}</p>}

              <button
                type="button"
                disabled={!canSend || loading}
                onClick={send}
                className="w-full rounded-full bg-accent text-accent-contrast font-display font-bold py-3.5 disabled:opacity-40"
              >
                {loading ? "Sending…" : cents > 0 ? `Send invoice for ${formatCents(cents)}` : "Send invoice"}
              </button>
            </>
          ) : (
            sentView
          )}
        </div>
      </div>
    </>
  );
}
