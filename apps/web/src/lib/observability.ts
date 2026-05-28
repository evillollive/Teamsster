import { publicEnv, serverEnv } from "@/lib/env";

export const observability = {
  plausibleEnabled:
    publicEnv.NEXT_PUBLIC_ENABLE_PLAUSIBLE === "true" &&
    publicEnv.NEXT_PUBLIC_PLAUSIBLE_DOMAIN.length > 0,
  sentryEnabled:
    publicEnv.NEXT_PUBLIC_ENABLE_SENTRY === "true" &&
    serverEnv.SENTRY_DSN.length > 0,
};

let sentryModule: typeof import("@sentry/nextjs") | null = null;

async function getSentry() {
  if (sentryModule) return sentryModule;
  if (!observability.sentryEnabled) return null;
  try {
    sentryModule = await import("@sentry/nextjs");
    return sentryModule;
  } catch {
    return null;
  }
}

export async function captureBoundaryError(error: Error, digest?: string) {
  const sentry = await getSentry();
  if (sentry) {
    sentry.captureException(error, { extra: { digest } });
    return;
  }

  console.error("[teamsster-error-boundary]", digest, error);
}

export async function captureServerError(
  error: unknown,
  context?: Record<string, unknown>,
) {
  const sentry = await getSentry();
  if (sentry) {
    sentry.captureException(error, { extra: context });
    return;
  }

  console.error("[teamsster-server-error]", context, error);
}
