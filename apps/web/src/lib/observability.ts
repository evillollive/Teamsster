import { publicEnv, serverEnv } from "@/lib/env";

export const observability = {
  plausibleEnabled:
    publicEnv.NEXT_PUBLIC_ENABLE_PLAUSIBLE === "true" &&
    publicEnv.NEXT_PUBLIC_PLAUSIBLE_DOMAIN.length > 0,
  sentryEnabled:
    publicEnv.NEXT_PUBLIC_ENABLE_SENTRY === "true" &&
    serverEnv.SENTRY_DSN.length > 0,
};

// TODO: Replace console.error calls with real Sentry SDK calls once
// @sentry/nextjs is installed as a dependency. Dynamic import() of
// uninstalled packages breaks the Turbopack build.

export function captureBoundaryError(error: Error, digest?: string) {
  console.error("[teamsster-error-boundary]", digest, error);
}

export function captureServerError(
  error: unknown,
  context?: Record<string, unknown>,
) {
  console.error("[teamsster-server-error]", context, error);
}
