import {
  CalendarDays,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const highlights = [
  {
    title: "League-first by default",
    description:
      "Every team lives inside a league, and every new account is meant to start with a friendly Personal League.",
    icon: Sparkles,
  },
  {
    title: "Inclusive and collaborative",
    description:
      "Players stay separate from user accounts so families, volunteers, and administrators can collaborate with the right permissions.",
    icon: HeartHandshake,
  },
  {
    title: "Built for trust",
    description:
      "Soft deletes, audit logs, centralized validation, and permission helpers set the ground rules before feature work starts.",
    icon: ShieldCheck,
  },
  {
    title: "Ready for busy schedules",
    description:
      "Events, rosters, league dashboards, and mobile-first navigation are scaffolded now so shipping real workflows stays focused later.",
    icon: CalendarDays,
  },
];

export default function Home() {
  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_right,_#67e8f9,_#0284c7_55%,_#0f172a)] text-white">
        <div className="grid gap-8 md:grid-cols-[1.35fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-100">
              Welcome to Teamsster
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              A playful home base for leagues, teams, families, and the people
              who keep game day joyful.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-sky-50 sm:text-base">
              Teamsster starts small on purpose: great docs, strong defaults,
              gentle mobile-first navigation, and an extensible foundation for
              rosters, events, permissions, and future add-ons.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/league">View league shell</Link>
              </Button>
              <Button
                asChild
                className="bg-slate-900 text-white hover:bg-slate-800"
                size="lg"
              >
                <Link href="/events">Peek at events</Link>
              </Button>
            </div>
          </div>

          <Card className="self-start bg-white text-slate-900 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
              Early access vibes
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Scaffolded input helpers
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This card is intentionally non-functional business-wise, but it
              proves the shared form pieces are ready for future validated
              mutations.
            </p>
            <form className="mt-4 grid gap-4">
              <FormField
                description="For now this is a design stub wired to reusable form components."
                htmlFor="early-access-email"
                label="Email address"
              >
                <Input
                  id="early-access-email"
                  placeholder="coach@sunnyvaleunited.org"
                  type="email"
                />
              </FormField>
              <Button type="button">Keep me posted</Button>
            </form>
          </Card>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map(({ description, icon: Icon, title }) => (
          <Card className="grid gap-3" key={title}>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-700">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
