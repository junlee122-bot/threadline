import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { isLocale } from "@/lib/locales/types";
import { siteOrigin } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: {
    default: "Threadline — Every signal, traced to source",
    template: "%s · Threadline",
  },
  description:
    "Evidence-native software intelligence connecting code, deployments, runtime signals, and customer impact into one causal thread.",
  applicationName: "Threadline",
  authors: [{ name: "Threadline Labs" }],
  keywords: [
    "software intelligence",
    "observability",
    "incident response",
    "developer tools",
    "AI operations",
  ],
  openGraph: {
    type: "website",
    siteName: "Threadline",
    title: "Threadline — Every signal, traced to source",
    description:
      "Trace every operational signal back to the change that caused it.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Threadline — Every signal, traced to source",
    description:
      "Trace every operational signal back to the change that caused it.",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#080b0d",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const preferredLocale = (await cookies()).get("threadline_locale")?.value;
  const locale = isLocale(preferredLocale) ? preferredLocale : "en";
  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <a
          href="#main-content"
          className="fixed start-4 top-3 z-[100] -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0"
        >
          {locale === "ko" ? "본문으로 건너뛰기" : "Skip to main content"}
        </a>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
