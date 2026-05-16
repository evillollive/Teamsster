import {
  CalendarDays,
  Home,
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
    blurb: "Roster, staff, and timezone stubs",
    icon: Users,
  },
  {
    href: "/roster",
    label: "Roster",
    blurb: "Players stay decoupled from users",
    icon: ShieldCheck,
  },
  {
    href: "/events",
    label: "Events",
    blurb: "Games, practices, and reminders",
    icon: CalendarDays,
  },
] satisfies ReadonlyArray<{
  href: Route;
  label: string;
  blurb: string;
  icon: typeof Home;
}>;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link className="flex items-center gap-3" href="/">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-600 text-lg font-black text-white shadow-sm">
              T
            </div>
            <div>
              <p className="text-lg font-semibold">Teamsster</p>
              <p className="text-xs text-slate-500">
                Friendly league ops for small organizations
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/account">Auth scaffold</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/league">Explore the shell</Link>
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
                href={href}
                key={href}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
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

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
