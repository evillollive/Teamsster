"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function LeagueErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      title="League page needs a quick reset"
    />
  );
}
