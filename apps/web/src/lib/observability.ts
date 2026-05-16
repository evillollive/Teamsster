import { publicEnv, serverEnv } from "@/lib/env";

export const observability = {
  plausibleEnabled:
    publicEnv.NEXT_PUBLIC_ENABLE_PLAUSIBLE === "true" &&
    publicEnv.NEXT_PUBLIC_PLAUSIBLE_DOMAIN.length > 0,
  sentryEnabled:
    publicEnv.NEXT_PUBLIC_ENABLE_SENTRY === "true" &&
    serverEnv.SENTRY_DSN.length > 0,
};

export function captureBoundaryError(error: Error, digest?: string) {
  if (observability.sentryEnabled) {
    console.error("[teamsster-sentry-scaffold] capture exception", {
      digest,
      message: error.message,
      stack: error.stack,
    });
    return;
  }

  console.error("[teamsster-error-boundary]", digest, error);
}
