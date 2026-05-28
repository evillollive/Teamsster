import {
  CalendarDays,
  Home,
  MessageSquare,
  ShieldCheck,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", blurb: "Warm, playful welcome", icon: Home },
  {
    href: "/account",
    label: "Account",
    blurb: "Profiles, auth, preferences",
    icon: UserRound,
  },
  {
    href: "/league",
    label: "League",
    blurb: "League-first tenancy model",
    icon: Trophy,
  },
  {
    href: "/team",
    label: "Team",
    blurb: "All your teams across leagues",
    icon: Users,
  },
  {
    href: "/roster",
    label: "Roster",
    blurb: "Players across all your teams",
    icon: ShieldCheck,
  },
  {
    href: "/events",
    label: "Events",
    blurb: "Games, practices, and reminders",
    icon: CalendarDays,
  },
  {
    href: "/messages",
    label: "Messages",
    blurb: "League and team announcements",
    icon: MessageSquare,
  },
] satisfies ReadonlyArray<{
  href: string;
  label: string;
  blurb: string;
  icon: typeof Home;
}>;

const mobileNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/league", label: "Leagues", icon: Trophy },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/account", label: "Account", icon: UserRound },
] satisfies ReadonlyArray<{
  href: string;
  label: string;
  icon: typeof Home;
}>;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-sky-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link className="flex items-center gap-3" href="/">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-600 text-lg font-black text-white shadow-sm">
              T
            </div>
            <div>
              <p className="text-lg font-semibold">Teamsster</p>
              <p className="text-xs text-slate-600">
                Friendly league ops for small organizations
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/account">Account</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/league">Leagues</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:items-start">
        <aside className="md:sticky md:top-6 md:w-80">
          <Card className="grid gap-4 bg-gradient-to-br from-sky-600 to-cyan-500 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-100">
                Scaffold preview
              </p>
              <h1 className="mt-2 text-2xl font-semibold">
                League-first from day one
              </h1>
              <p className="mt-2 text-sm text-sky-50">
                Every team belongs to a league, every route has a boundary, and
                every future mutation is expected to flow through validated
                helpers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-sky-50">
              <span className="rounded-full bg-white/15 px-3 py-1">
                Next.js 15
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1">
                Drizzle + Neon
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1">
                Better Auth
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1">
                Zod everywhere
              </span>
            </div>
          </Card>

          <nav aria-label="Primary" className="mt-4 grid gap-3 md:mt-6">
            {navItems.map(({ blurb, href, icon: Icon, label }) => (
              <Link
                className={cn(
                  "rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-sky-200 hover:shadow-md",
                )}
                href={href as Route}
                key={href}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-slate-500">{blurb}</p>
                  </div>
                </div>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1" id="main-content">{children}</main>
      </div>

      <footer className="border-t border-slate-200 bg-white/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-slate-500 sm:px-6">
          <p>© {new Date().getFullYear()} Teamsster. All rights reserved.</p>
          <div className="flex gap-4">
            <Link className="hover:text-slate-700 hover:underline" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="hover:text-slate-700 hover:underline" href="/terms">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      >
        <div className="flex items-center justify-around px-2 py-1">
          {mobileNavItems.map(({ href, icon: Icon, label }) => (
            <Link
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-slate-600 transition-colors hover:text-sky-600"
              href={href as Route}
              key={href}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
      {/* Spacer for mobile bottom nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
