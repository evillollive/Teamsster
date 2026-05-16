import Script from "next/script";
import { publicEnv } from "@/lib/env";
import { observability } from "@/lib/observability";

export function TelemetryScripts() {
  if (!observability.plausibleEnabled) {
    return null;
  }

  return (
    <Script
      data-domain={publicEnv.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
      defer
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
