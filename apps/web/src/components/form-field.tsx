import { Children, cloneElement, isValidElement, type ReactNode } from "react";

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

  const control = enhanceControl(children, describedBy, Boolean(error));

  return (
    <div
      className={cn("grid gap-2 text-sm font-medium text-slate-700", className)}
    >
      <label htmlFor={htmlFor}>{label}</label>
      {control}
      {description ? (
        <span className="text-xs font-normal text-slate-500" id={descriptionId}>
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

/**
 * Wires the field's description/error to its control so assistive technology
 * announces them. Only a single form control child is enhanced; any existing
 * `aria-describedby` on the control is preserved and merged.
 */
function enhanceControl(
  children: ReactNode,
  describedBy: string | undefined,
  hasError: boolean,
): ReactNode {
  const child = Children.toArray(children).find(isValidElement);
  if (Children.count(children) !== 1 || !child) {
    return children;
  }

  const props = child.props as {
    "aria-describedby"?: string;
    "aria-invalid"?: boolean | "true" | "false";
  };

  const mergedDescribedBy =
    [props["aria-describedby"], describedBy].filter(Boolean).join(" ") ||
    undefined;

  return cloneElement(child, {
    "aria-describedby": mergedDescribedBy,
    "aria-invalid": hasError ? true : props["aria-invalid"],
  } as Record<string, unknown>);
}
