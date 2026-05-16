"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function EventsErrorBoundary({
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
      title="Events page needs a quick reset"
    />
  );
}
