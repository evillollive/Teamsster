"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { captureBoundaryError } from "@/lib/observability";

export function RouteErrorBoundary({
  error,
  reset,
  title,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
}) {
  useEffect(() => {
    captureBoundaryError(error, error.digest);
  }, [error]);

  return (
    <div className="grid gap-4 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-slate-900 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
          Something tripped
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">
          The page is still scaffold-only, so this boundary is intentionally
          friendly while we wire the feature.
        </p>
      </div>
      <Button className="w-fit" onClick={reset} type="button">
        Try again
      </Button>
    </div>
  );
}
