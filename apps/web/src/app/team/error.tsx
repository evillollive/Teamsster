"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function TeamErrorBoundary({
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
      title="Team page needs a quick reset"
    />
  );
}
