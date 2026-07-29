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
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
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
  const [addressLine1, setAddressLine1] = useState(profile?.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(profile?.addressLine2 ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [state, setState] = useState(profile?.state ?? "");
  const [postalCode, setPostalCode] = useState(profile?.postalCode ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [invoiceFooter, setInvoiceFooter] = useState(
    profile?.invoiceFooter ??
      "Secure payment processed by iDesignLC Agency in partnership with Stripe."
  );
  const [defaultTermsDays, setDefaultTermsDays] = useState(
    String(profile?.defaultTermsDays ?? 0)
  );
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        invoiceFooter,
        defaultTermsDays,
      }),
    });
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  async function uploadLogo(file: File | undefined) {
    if (!file) return;
    setError(null);
    setSaved(false);
    if (file.size > 20 * 1024 * 1024) {
      setError("Logo must be 20 MB or smaller.");
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append("logo", file);
    const res = await fetch("/api/branding/logo", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not upload logo.");
      return;
    }
    setLogoUrl(data.logoUrl);
  }

  const displayName = businessName || "Your business";
  const cityLine = [city, state, postalCode].filter(Boolean).join(", ");
  const addressLines = [addressLine1, addressLine2, cityLine, country].filter(Boolean);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={save} className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold">White-label profile</h2>
        <p className="mt-1 text-sm text-muted">
          This appears on branded invoice pages, app-sent invoice emails, and Stripe invoice fields.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <section className="rounded-2xl bg-background p-4">
            <p className="mb-3 text-sm font-semibold">Logo</p>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-2xl font-display font-bold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <label className="flex min-h-12 cursor-pointer items-center rounded-2xl border border-line px-4 text-sm font-medium hover:bg-line/40">
                {uploading ? "Uploading..." : "Upload logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => uploadLogo(e.target.files?.[0])}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-muted">PNG, JPG, WebP, or GIF up to 20 MB.</p>
          </section>

          <label className="flex flex-col gap-1.5 text-sm">
            Business name
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Rivera Creative Studio"
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
          <section className="rounded-2xl bg-background p-4">
            <p className="mb-3 text-sm font-semibold">Service provider billing address</p>
            <div className="grid gap-3">
              <input
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Street address"
                className="rounded-2xl border border-line bg-card px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Apartment, suite, unit"
                className="rounded-2xl border border-line bg-card px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="rounded-2xl border border-line bg-card px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="rounded-2xl border border-line bg-card px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="ZIP"
                  className="rounded-2xl border border-line bg-card px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
                className="rounded-2xl border border-line bg-card px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </section>
          <label className="flex flex-col gap-1.5 text-sm">
            Invoice footer
            <textarea
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              rows={3}
              className="resize-none rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
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

      <section className="rounded-2xl border border-line bg-card p-4 md:p-6">
        <div className="rounded-[1.5rem] bg-background p-5">
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
                {addressLines.length > 0 && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{addressLines.join(" - ")}</p>
                )}
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
            Pay securely with Stripe
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            Cards, Link, bank debit, and Cash App Pay may appear when enabled in Stripe.
          </p>
          <p className="mt-4 text-center text-xs text-muted">
            {invoiceFooter ||
              "Secure payment processed by iDesignLC Agency in partnership with Stripe."}
          </p>
        </div>
      </section>
    </div>
  );
}
