import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
