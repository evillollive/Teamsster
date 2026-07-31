"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Client-side nav link that marks itself as the current page for assistive
 * technology (`aria-current="page"`) and applies a visible keyboard focus ring.
 * A link is "current" when the pathname matches exactly, or when it is a nested
 * route under a non-root nav destination (e.g. `/league/123` under `/league`).
 */
export function NavLink({
  href,
  children,
  className,
  activeClassName,
  ...props
}: {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
} & Omit<ComponentProps<typeof Link>, "href" | "className">) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href !== "/" && pathname?.startsWith(`${href}/`)) === true;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(className, isActive ? activeClassName : undefined)}
      href={href as Route}
      {...props}
    >
      {children}
    </Link>
  );
}
