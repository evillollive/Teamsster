import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { TelemetryScripts } from "@/components/telemetry-scripts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teamsster",
  description:
    "Playful, inclusive team and league management scaffolding built for extensibility.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TelemetryScripts />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
