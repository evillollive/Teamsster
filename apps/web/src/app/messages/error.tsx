"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function MessagesErrorBoundary({
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
      title="Messages page needs a quick reset"
    />
  );
}
