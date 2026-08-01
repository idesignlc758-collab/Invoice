"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SaleReceiptActions({
  receiptId,
  isVoid,
}: {
  receiptId: string;
  isVoid: boolean;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resendEmail() {
    setSending(true);
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/sale-receipts/${receiptId}/send-email`, { method: "POST" });
    setSending(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Could not send the email.");
      return;
    }
    setMessage("Receipt emailed to the customer.");
  }

  async function voidReceipt() {
    setVoiding(true);
    setError(null);
    const response = await fetch(`/api/sale-receipts/${receiptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "void" }),
    });
    setVoiding(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Could not void this receipt.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/sale-receipts/${receiptId}/pdf`}
          className="flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 text-sm font-bold"
        >
          Download PDF
        </a>
        <button
          type="button"
          onClick={resendEmail}
          disabled={sending}
          className="flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 text-sm font-bold disabled:opacity-60"
        >
          {sending ? "Sending…" : "Email to customer"}
        </button>
        {!isVoid &&
          (confirmVoid ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={voidReceipt}
                disabled={voiding}
                className="flex min-h-11 items-center justify-center rounded-2xl bg-danger px-4 text-sm font-bold text-white disabled:opacity-60"
              >
                {voiding ? "Voiding…" : "Confirm void"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmVoid(false)}
                className="flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmVoid(true)}
              className="flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 text-sm font-bold text-danger"
            >
              Void receipt
            </button>
          ))}
      </div>
      {message && <p className="text-sm text-success">{message}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
