import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const heading = Manrope({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Invoice by iDesignLC — Send an invoice, get paid",
  description:
    "Bill a client from your phone in seconds. They pay by card, the money lands in your own bank account.",
  other: {
    // Stops iOS Safari turning client emails and amounts into blue underlined
    // "helpful" links inside our own list rows.
    "format-detection": "telephone=no, date=no, address=no, email=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${body.variable} ${heading.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
