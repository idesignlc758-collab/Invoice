"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { generateTypedSignatureDataUrl } from "@/lib/signature";

type Mode = "type" | "draw";

export function ContractSignature({
  publicToken,
  terms,
  businessName,
  senderSignatureData,
  senderSignerName,
  senderSignatureDateLabel,
  onSigned,
}: {
  publicToken: string;
  terms: string;
  businessName: string;
  senderSignatureData: string | null;
  senderSignerName: string | null;
  senderSignatureDateLabel: string | null;
  onSigned: (params: { signerName: string; signatureDateLabel: string }) => void;
}) {
  const [signerName, setSignerName] = useState("");
  const [mode, setMode] = useState<Mode>("type");
  const [agreed, setAgreed] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const padRef = useRef<SignatureCanvas | null>(null);

  const typedPreview = mode === "type" ? generateTypedSignatureDataUrl(signerName) : null;
  const hasSignatureInput = mode === "type" ? Boolean(typedPreview) : hasDrawn;
  const canSign = Boolean(signerName.trim()) && agreed && hasSignatureInput;

  function clearDrawing() {
    padRef.current?.clear();
    setHasDrawn(false);
  }

  async function sign() {
    if (!canSign || submitting) return;
    const signatureData =
      mode === "type" ? typedPreview : padRef.current?.isEmpty() ? null : padRef.current?.toDataURL("image/png");

    if (!signatureData) {
      setError("Provide a signature before continuing.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/invoices/${publicToken}/sign-contract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signatureData, signerName: signerName.trim() }),
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save your signature. Try again.");
      return;
    }

    onSigned({
      signerName: signerName.trim(),
      signatureDateLabel: new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(data.signatureDate)),
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-background p-4">
      <p className="font-display text-base font-bold">Contract & signature</p>

      <div
        tabIndex={0}
        role="region"
        aria-label="Contract terms"
        className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-card p-3 text-sm leading-relaxed text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {terms}
      </div>

      {senderSignatureData && senderSignerName && (
        <div className="mt-4 rounded-xl border border-line bg-card p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Signed by {businessName}</p>
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={senderSignatureData}
              alt={`${senderSignerName}'s signature`}
              className="h-12 max-w-[180px] rounded-lg border border-line bg-white object-contain p-1"
            />
            <div>
              <p className="text-sm font-medium">{senderSignerName}</p>
              {senderSignatureDateLabel && (
                <p className="text-xs text-muted">{senderSignatureDateLabel}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Your full name
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Jordan Lee"
            className="rounded-xl border border-line bg-card px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("type")}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
            mode === "type" ? "border-accent bg-accent text-accent-contrast" : "border-line"
          }`}
        >
          Type
        </button>
        <button
          type="button"
          onClick={() => setMode("draw")}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
            mode === "draw" ? "border-accent bg-accent text-accent-contrast" : "border-line"
          }`}
        >
          Draw
        </button>
      </div>

      {mode === "type" ? (
        <div className="mt-3 flex min-h-24 items-center justify-center rounded-xl border border-line bg-white p-4">
          {typedPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={typedPreview} alt="Signature preview" className="max-h-16" />
          ) : (
            <p className="text-sm italic text-muted">Type your full name above to preview your signature</p>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <div className="rounded-xl border border-line bg-white p-1">
            <SignatureCanvas
              ref={padRef}
              onEnd={() => setHasDrawn(Boolean(padRef.current && !padRef.current.isEmpty()))}
              canvasProps={{ className: "h-32 w-full cursor-crosshair rounded-lg" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted">Sign with your mouse, finger, or stylus.</p>
            <button type="button" onClick={clearDrawing} className="text-xs font-medium text-accent">
              Clear
            </button>
          </div>
        </div>
      )}

      <label className="mt-4 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
        />
        <span>I have read and agree to the contract terms above.</span>
      </label>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={sign}
        disabled={!canSign || submitting}
        className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent font-bold text-accent-contrast disabled:cursor-not-allowed disabled:opacity-45"
      >
        {submitting ? "Signing..." : "Sign agreement"}
      </button>
    </div>
  );
}
