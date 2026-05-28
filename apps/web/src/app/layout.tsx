import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/app-shell";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { TelemetryScripts } from "@/components/telemetry-scripts";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://teamsster.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0284c7",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Teamsster",
    template: "%s · Teamsster",
  },
  description:
    "Team and league management for youth sports. Organize leagues, manage rosters, schedule events, and communicate with your team.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Teamsster",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Teamsster",
    title: "Teamsster — Youth Sports Team Management",
    description:
      "Organize leagues, manage rosters, schedule events, and communicate with your team.",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: "Teamsster — Youth Sports Team Management",
    description:
      "Organize leagues, manage rosters, schedule events, and communicate with your team.",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TelemetryScripts />
        <ServiceWorkerRegistration />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
