"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function RootErrorBoundary({
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
      title="Teamsster hit a warm-up wobble"
    />
  );
}
