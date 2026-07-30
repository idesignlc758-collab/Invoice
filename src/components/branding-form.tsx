"use client";

import { upload } from "@vercel/blob/client";
import {
  CheckCircle2,
  ChevronDown,
  FileText,
  Mail,
  Palette,
  ShieldCheck,
  Upload,
} from "lucide-react";
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
  clientTerms: string | null;
  defaultClientNote: string | null;
  defaultTermsDays: number;
} | null;

const inputClass =
  "rounded-2xl border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent";
const textareaClass =
  "resize-none rounded-2xl border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent";

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Upload;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background text-accent">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}

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
  const [clientTerms, setClientTerms] = useState(
    profile?.clientTerms ??
      "By paying this invoice, you confirm that the services, pricing, and payment terms have been reviewed and accepted."
  );
  const [defaultClientNote, setDefaultClientNote] = useState(
    profile?.defaultClientNote ?? "Thank you for your business."
  );
  const [defaultTermsDays, setDefaultTermsDays] = useState(
    String(profile?.defaultTermsDays ?? 0)
  );
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
        clientTerms,
        defaultClientNote,
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
    setUploadProgress(0);
    if (file.size > 20 * 1024 * 1024) {
      setError("Logo must be 20 MB or smaller.");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setError("Upload a PNG, JPG, WebP, or GIF logo.");
      return;
    }

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const blob = await upload(`branding/logos/${Date.now()}-${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/branding/logo",
        multipart: true,
        contentType: file.type,
        onUploadProgress: (progress) => setUploadProgress(Math.round(progress.percentage)),
      });
      setLogoUrl(blob.url);
      setUploadProgress(100);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload logo.");
    } finally {
      setUploading(false);
    }
  }

  const displayName = businessName || "Your business";
  const cityLine = [city, state, postalCode].filter(Boolean).join(", ");
  const addressLines = [addressLine1, addressLine2, cityLine, country].filter(Boolean);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_27rem]">
      <form onSubmit={save} className="space-y-5">
        <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
          <SectionHeader
            icon={Upload}
            title="Logo"
            description="Upload the mark clients see on branded invoice pages and emails."
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <span
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl font-display text-2xl font-bold text-white"
                style={{ backgroundColor: brandColor }}
              >
                {displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line bg-background px-4 text-sm font-bold transition hover:bg-line/40">
                <Upload className="h-4 w-4" aria-hidden="true" />
                {uploading ? `Uploading ${uploadProgress}%` : "Upload logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => uploadLogo(event.target.files?.[0])}
                />
              </label>
              <p className="mt-2 text-sm text-muted">PNG, JPG, WebP, or GIF up to 20 MB.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
          <SectionHeader
            icon={Palette}
            title="Business identity"
            description="Keep the sender name, color, and public website consistent."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
              Business name
              <input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Rivera Creative Studio"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Brand color
              <input
                type="color"
                value={brandColor}
                onChange={(event) => setBrandColor(event.target.value)}
                className="h-12 rounded-2xl border border-line bg-background p-2"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Website
              <input
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://example.com"
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
          <SectionHeader
            icon={Mail}
            title="Contact and billing address"
            description="Show clients who provided the service and where billing questions go."
          />
          <div className="grid gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              Support email
              <input
                value={supportEmail}
                onChange={(event) => setSupportEmail(event.target.value)}
                placeholder="billing@example.com"
                className={inputClass}
              />
            </label>
            <input
              value={addressLine1}
              onChange={(event) => setAddressLine1(event.target.value)}
              placeholder="Street address"
              className={inputClass}
            />
            <input
              value={addressLine2}
              onChange={(event) => setAddressLine2(event.target.value)}
              placeholder="Apartment, suite, unit"
              className={inputClass}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
                className={inputClass}
              />
              <input
                value={state}
                onChange={(event) => setState(event.target.value)}
                placeholder="State"
                className={inputClass}
              />
              <input
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                placeholder="ZIP"
                className={inputClass}
              />
            </div>
            <input
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              placeholder="Country"
              className={inputClass}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
          <SectionHeader
            icon={FileText}
            title="Invoice defaults"
            description="Set payment timing, footer text, and client agreement language."
          />
          <div className="grid gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              Default payment due
              <select
                value={defaultTermsDays}
                onChange={(event) => setDefaultTermsDays(event.target.value)}
                className={inputClass}
              >
                <option value="0">Due on receipt</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Default client note
              <textarea
                value={defaultClientNote}
                onChange={(event) => setDefaultClientNote(event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Thank your client or add payment instructions."
                className={textareaClass}
              />
              <span className="text-xs text-muted">
                Shown on branded invoice pages and app-sent invoice emails.
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Client Terms & Conditions
              <textarea
                value={clientTerms}
                onChange={(event) => setClientTerms(event.target.value)}
                rows={7}
                maxLength={4000}
                placeholder="Add the agreement clients must accept before paying."
                className={textareaClass}
              />
              <span className="text-xs text-muted">
                New invoices copy this text and require the client checkbox before payment.
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Invoice footer
              <textarea
                value={invoiceFooter}
                onChange={(event) => setInvoiceFooter(event.target.value)}
                rows={3}
                className={textareaClass}
              />
            </label>
          </div>
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium">Ready to update your brand profile?</p>
            <p className="mt-1 text-sm text-muted">
              Changes apply to newly created invoices after saving.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 shrink-0 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-contrast disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save branding"}
          </button>
        </div>
        {saved && (
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Brand profile saved.
          </p>
        )}
      </form>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Live preview</p>
              <h2 className="font-display text-xl font-bold">Client invoice</h2>
            </div>
            <span className="rounded-full bg-background px-3 py-1 text-xs font-medium">Open</span>
          </div>

          <div className="rounded-2xl border border-line bg-background p-5">
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

            {addressLines.length > 0 && (
              <div className="mt-4 rounded-xl bg-card p-3 text-xs leading-relaxed text-muted">
                {addressLines.join(" - ")}
              </div>
            )}

            <div className="mt-7">
              <p className="text-sm text-muted">Invoice total</p>
              <p className="mt-1 font-display text-5xl font-extrabold tracking-tight tabular-nums">
                {formatCents(185000)}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-line pt-4">
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

            {defaultClientNote.trim().length > 0 && (
              <div className="mt-5 rounded-xl bg-card p-3 text-sm leading-relaxed text-muted">
                {defaultClientNote}
              </div>
            )}

            {clientTerms.trim().length > 0 && (
              <details className="group mt-5 rounded-xl border border-line bg-card p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold text-foreground">
                  <span>Terms and conditions</span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-background p-3 text-xs leading-relaxed text-muted">
                  {clientTerms}
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs">
                  <span className="mt-0.5 h-3.5 w-3.5 rounded border border-line bg-background" />
                  <span>I agree to the terms and conditions for this invoice.</span>
                </div>
              </details>
            )}

            <button
              type="button"
              className="mt-5 min-h-12 w-full rounded-2xl font-bold text-white"
              style={{ backgroundColor: brandColor }}
            >
              Pay securely with Stripe
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-success-soft p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-success">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Secure payment
            </div>
            <p className="mt-1 text-xs leading-relaxed text-success">
              Cards, Link, bank debit, and Cash App Pay may appear when enabled in Stripe.
            </p>
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-muted">
            {invoiceFooter ||
              "Secure payment processed by iDesignLC Agency in partnership with Stripe."}
          </p>
        </section>
      </aside>
    </div>
  );
}
