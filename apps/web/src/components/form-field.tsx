import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FormField({
  className,
  description,
  error,
  htmlFor,
  label,
  children,
}: {
  className?: string;
  description?: string;
  error?: string;
  htmlFor: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("grid gap-2 text-sm font-medium text-slate-700", className)}
    >
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {description ? (
        <span className="text-xs font-normal text-slate-500">
          {description}
        </span>
      ) : null}
      {error ? (
        <span className="text-xs font-semibold text-rose-600">{error}</span>
      ) : null}
    </div>
  );
}
