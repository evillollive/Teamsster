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
  const descriptionId = description ? `${htmlFor}-description` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={cn(
        "grid gap-2 text-sm font-medium text-slate-700",
        className,
      )}
      data-described-by={describedBy}
    >
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {description ? (
        <span
          className="text-xs font-normal text-slate-500"
          id={descriptionId}
        >
          {description}
        </span>
      ) : null}
      {error ? (
        <span
          className="text-xs font-semibold text-rose-600"
          id={errorId}
          role="alert"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
