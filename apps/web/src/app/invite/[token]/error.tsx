"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function InviteErrorBoundary({
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
      title="Invitation page needs a quick reset"
    />
  );
}
