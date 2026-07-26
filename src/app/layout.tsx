import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { AppShell } from "@/components/ui/AppShell";
import {
  InstallPromptCapture,
  UpdateToast,
} from "@/components/ui/PwaChrome";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mano.app"),
  title: "MANO — Coach basic strategy",
  description:
    "Impara e consulta la basic strategy del blackjack. Europe-first, offline, gratis.",
  applicationName: "MANO",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MANO",
  },
  openGraph: {
    title: "MANO — Coach basic strategy",
    description:
      "Impara e consulta la basic strategy del blackjack. Europe-first, offline, gratis.",
    locale: "it_IT",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#041611",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${fraunces.variable} ${manrope.variable} h-full bg-felt-deep text-ivory`}
    >
      <body className="min-h-full bg-felt-deep text-ivory antialiased">
        <InstallPromptCapture />
        <UpdateToast />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
