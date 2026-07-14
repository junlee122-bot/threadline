import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <a
          href="#main-content"
          className="fixed start-4 top-3 z-[100] -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
