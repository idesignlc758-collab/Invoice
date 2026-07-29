"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/format";

type Profile = {
  businessName: string | null;
  logoUrl: string | null;
  brandColor: string;
  supportEmail: string | null;
  website: string | null;
  invoiceFooter: string | null;
  defaultTermsDays: number;
} | null;

export function BrandingForm({ profile, email }: { profile: Profile; email: string }) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(profile?.businessName ?? "");
  const [logoUrl, setLogoUrl] = useState(profile?.logoUrl ?? "");
  const [brandColor, setBrandColor] = useState(profile?.brandColor ?? "#c81010");
  const [supportEmail, setSupportEmail] = useState(profile?.supportEmail ?? email);
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [invoiceFooter, setInvoiceFooter] = useState(
    profile?.invoiceFooter ?? "Payment is processed securely by iDesignLC."
  );
  const [defaultTermsDays, setDefaultTermsDays] = useState(
    String(profile?.defaultTermsDays ?? 0)
  );
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSaved(false);
    await fetch("/api/branding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName,
        logoUrl,
        brandColor,
        supportEmail,
        website,
        invoiceFooter,
        defaultTermsDays,
      }),
    });
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  const displayName = businessName || "Your business";

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={save} className="rounded-3xl border border-line bg-card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold">White-label profile</h2>
        <p className="mt-1 text-sm text-muted">
          This appears on your branded invoice page and app-sent invoice emails.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Business name
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Rivera Creative Studio"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Logo URL
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              Brand color
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-12 rounded-2xl border border-line bg-background p-2"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Default terms
              <select
                value={defaultTermsDays}
                onChange={(e) => setDefaultTermsDays(e.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="0">Due on receipt</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            Support email
            <input
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="billing@example.com"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Website
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Invoice footer
            <textarea
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              rows={3}
              className="resize-none rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-contrast disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save branding"}
          </button>
          {saved && <p className="text-sm text-success">Brand profile saved.</p>}
        </div>
      </form>

      <section className="rounded-3xl border border-line bg-card p-4 md:p-6">
        <div className="rounded-[2rem] bg-background p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-12 w-12 rounded-2xl object-cover" />
              ) : (
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl font-display font-bold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold">{displayName}</p>
                <p className="truncate text-sm text-muted">{supportEmail}</p>
              </div>
            </div>
            <span className="rounded-full bg-line px-3 py-1 text-xs font-medium">Open</span>
          </div>

          <div className="mt-8">
            <p className="text-sm text-muted">Invoice total</p>
            <p className="mt-1 font-display text-5xl font-extrabold tracking-tight tabular-nums">
              {formatCents(185000)}
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 rounded-3xl border border-line p-4">
            {[
              ["Website audit", "$850.00"],
              ["Implementation support", "$1,000.00"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 text-sm">
                <span className="truncate text-muted">{label}</span>
                <span className="tabular-nums">{value}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-6 min-h-12 w-full rounded-2xl font-bold text-white"
            style={{ backgroundColor: brandColor }}
          >
            Pay securely
          </button>
          <p className="mt-4 text-center text-xs text-muted">
            {invoiceFooter || "Payment is processed securely by iDesignLC."}
          </p>
        </div>
      </section>
    </div>
  );
}
