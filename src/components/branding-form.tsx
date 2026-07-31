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
import { type ReactNode, useState } from "react";
import { formatCents } from "@/lib/format";

type Profile = {
  businessName: string | null;
  logoUrl: string | null;
  brandColor: string;
  emailSenderName: string | null;
  replyToEmail: string | null;
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

type BrandingSection = "logo" | "email" | "identity" | "contact" | "defaults";

const inputClass =
  "rounded-2xl border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent";
const textareaClass =
  "resize-none rounded-2xl border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent";

function paymentTermsLabel(days: string) {
  if (days === "0") return "Due on receipt";
  return `${days} days`;
}

function logoSummary(logoUrl: string) {
  return logoUrl ? "Logo uploaded" : "Initial mark";
}

function emailSummary(senderName: string, replyToEmail: string) {
  if (senderName && replyToEmail) return "Ready to send";
  if (senderName) return "Needs reply-to";
  if (replyToEmail) return "Needs sender";
  return "Required";
}

function identitySummary(name: string, website: string) {
  if (name && website) return "Name and website";
  if (name) return "Name set";
  if (website) return "Website set";
  return "Needs details";
}

function contactSummary(email: string, addressLines: string[]) {
  if (email && addressLines.length > 0) return "Email and address";
  if (email) return "Email set";
  return "Needs contact";
}

function defaultsSummary(days: string, clientTerms: string) {
  return clientTerms.trim().length > 0
    ? `${paymentTermsLabel(days)} + terms`
    : paymentTermsLabel(days);
}

function compactAddress(lines: string[]) {
  if (lines.length === 0) return "";
  return lines[0];
}

function AccordionSection({
  id,
  open,
  onToggle,
  icon: Icon,
  title,
  description,
  summary,
  children,
}: {
  id: BrandingSection;
  open: boolean;
  onToggle: (id: BrandingSection) => void;
  icon: typeof Upload;
  title: string;
  description: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="flex w-full items-start gap-4 p-5 text-left transition hover:bg-background/60 md:p-6"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background text-accent">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-display text-lg font-bold">{title}</span>
            <span className="max-w-full truncate rounded-full bg-background px-3 py-1 text-xs font-medium text-muted">
              {summary}
            </span>
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-muted">{description}</span>
        </span>
        <ChevronDown
          className={`mt-2 h-5 w-5 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="border-t border-line px-5 py-5 md:px-6">{children}</div>}
    </section>
  );
}

function SavePanel({
  loading,
  saved,
  error,
}: {
  loading: boolean;
  saved: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
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
    </div>
  );
}

export function BrandingForm({
  profile,
  email,
  fromAddress,
}: {
  profile: Profile;
  email: string;
  fromAddress: string;
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(profile?.businessName ?? "");
  const [logoUrl, setLogoUrl] = useState(profile?.logoUrl ?? "");
  const [brandColor, setBrandColor] = useState(profile?.brandColor ?? "#c81010");
  const [emailSenderName, setEmailSenderName] = useState(
    profile?.emailSenderName ?? `${profile?.businessName ?? "Your business"} via iDesignLC`
  );
  const [replyToEmail, setReplyToEmail] = useState(
    profile?.replyToEmail ?? profile?.supportEmail ?? email
  );
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
  const [openSection, setOpenSection] = useState<BrandingSection | null>("logo");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);
    const response = await fetch("/api/branding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName,
        logoUrl,
        brandColor,
        emailSenderName,
        replyToEmail,
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
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Could not save branding. Check the required email fields.");
      return;
    }
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

  function toggleSection(section: BrandingSection) {
    setOpenSection((current) => (current === section ? null : section));
  }

  const displayName = businessName || "Your business";
  const cityLine = [city, state, postalCode].filter(Boolean).join(", ");
  const addressLines = [addressLine1, addressLine2, cityLine, country].filter(Boolean);
  const previewAddress = compactAddress(addressLines);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_27rem]">
      <form onSubmit={save} className="space-y-4">
        <AccordionSection
          id="logo"
          open={openSection === "logo"}
          onToggle={toggleSection}
          icon={Upload}
          title="Logo"
          description="Upload the mark clients see on branded invoice pages and emails."
          summary={logoSummary(logoUrl)}
        >
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
        </AccordionSection>

        <AccordionSection
          id="email"
          open={openSection === "email"}
          onToggle={toggleSection}
          icon={Mail}
          title="Email identity"
          description="Control the branded email clients see before they open the invoice."
          summary={emailSummary(emailSenderName, replyToEmail)}
        >
          <div className="grid gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              Platform sending address
              <input
                value={fromAddress}
                readOnly
                className={`${inputClass} cursor-not-allowed text-muted`}
              />
              <span className="text-xs text-muted">
                This stays on iDesignLC&apos;s verified domain for delivery and security.
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Sender name
              <input
                value={emailSenderName}
                onChange={(event) => setEmailSenderName(event.target.value)}
                placeholder="Gens Gem via iDesignLC"
                className={inputClass}
                required
              />
              <span className="text-xs text-muted">
                Appears in the client&apos;s inbox, for example: Gens Gem via iDesignLC.
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Reply-to email
              <input
                type="email"
                value={replyToEmail}
                onChange={(event) => setReplyToEmail(event.target.value)}
                placeholder="billing@example.com"
                className={inputClass}
                required
              />
              <span className="text-xs text-muted">
                Client replies go here instead of the platform sending address.
              </span>
            </label>
          </div>
        </AccordionSection>

        <AccordionSection
          id="identity"
          open={openSection === "identity"}
          onToggle={toggleSection}
          icon={Palette}
          title="Business identity"
          description="Keep the sender name, color, and public website consistent."
          summary={identitySummary(businessName, website)}
        >
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
        </AccordionSection>

        <AccordionSection
          id="contact"
          open={openSection === "contact"}
          onToggle={toggleSection}
          icon={Mail}
          title="Contact and billing address"
          description="Show clients who provided the service and where billing questions go."
          summary={contactSummary(supportEmail, addressLines)}
        >
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
              aria-label="Street address"
              className={inputClass}
            />
            <input
              value={addressLine2}
              onChange={(event) => setAddressLine2(event.target.value)}
              placeholder="Apartment, suite, unit"
              aria-label="Apartment, suite, or unit"
              className={inputClass}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
                aria-label="City"
                className={inputClass}
              />
              <input
                value={state}
                onChange={(event) => setState(event.target.value)}
                placeholder="State"
                aria-label="State"
                className={inputClass}
              />
              <input
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                placeholder="ZIP"
                aria-label="ZIP"
                className={inputClass}
              />
            </div>
            <input
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              placeholder="Country"
              aria-label="Country"
              className={inputClass}
            />
          </div>
        </AccordionSection>

        <AccordionSection
          id="defaults"
          open={openSection === "defaults"}
          onToggle={toggleSection}
          icon={FileText}
          title="Invoice defaults"
          description="Set payment timing, footer text, and client agreement language."
          summary={defaultsSummary(defaultTermsDays, clientTerms)}
        >
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
        </AccordionSection>

        <SavePanel loading={loading} saved={saved} error={error} />
      </form>

      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
        <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Live preview</p>
              <h2 className="font-display text-xl font-bold">Client invoice</h2>
            </div>
            <span className="rounded-full bg-background px-3 py-1 text-xs font-medium">Open</span>
          </div>

          <div className="mb-4 rounded-2xl border border-line bg-background p-4">
            <p className="text-xs font-semibold text-muted">Branded email header</p>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted">From</span>
                <span className="min-w-0 truncate font-medium">
                  {emailSenderName || fromAddress}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Reply-to</span>
                <span className="min-w-0 truncate font-medium">
                  {replyToEmail || supportEmail}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Subject</span>
                <span className="min-w-0 truncate font-medium">
                  {displayName} sent you an invoice
                </span>
              </div>
            </div>
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

            {previewAddress && (
              <div className="mt-4 truncate rounded-xl bg-card p-3 text-xs text-muted">
                {previewAddress}
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
              tabIndex={-1}
              aria-hidden="true"
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
