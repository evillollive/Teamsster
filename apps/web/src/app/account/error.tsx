"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function AccountErrorBoundary({
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
      title="Account page needs a quick reset"
    />
  );
}
