# 🏆 Teamsster

**Team and league management that doesn't make volunteers want to quit.**

Teamsster is an open-source, sport-agnostic app for the people who actually keep youth sports and small leagues running: coaches, board members, parents, and the one person who somehow ended up managing everything in a group chat. It handles rosters, schedules, communication, and permissions so all that admin work lives in one place instead of scattered across texts and spreadsheets.

It's built with Next.js 15, TypeScript, and Postgres, designed mobile-first, and licensed under AGPL-3.0 so it stays open.

**Release status:** pre-alpha. The current target is an invite-only browser alpha
for adult testers using synthetic player data, not a production youth-league
rollout. [PLAN.md](./PLAN.md#current-release-plan-first-browser-alpha) is the
authoritative roadmap, including scope, current blockers, acceptance gates, and
the A0-A5 execution sequence. No alpha release is qualified yet.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)

## Quick Start

### Prerequisites

- Node.js `20.20.2` (see `.nvmrc`)
- `pnpm` `10.12.4` via Corepack
- A Postgres-compatible database URL (Neon recommended for hosted development)

### Setup

```bash
corepack enable
corepack prepare pnpm@10.12.4 --activate
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000` for the development shell. See the current roadmap
for runtime integration blockers before attempting complete workflows.

### Quality commands

```bash
pnpm lint        # Biome formatting and linting
pnpm typecheck   # strict TypeScript checks
pnpm test        # Vitest unit/component tests (includes accessibility checks)
pnpm build       # production build
pnpm e2e         # Playwright end-to-end tests
pnpm audit       # dependency vulnerability scan
```

### Database migrations

```bash
pnpm db:generate
pnpm db:migrate
```

## What's in the repository

Teamsster has substantial implementation work, but code presence is not the same
as a verified user workflow:

- **Core application surfaces:** account settings, partial onboarding, league/team
  administration, invitations, manual rosters, events, RSVP, announcements,
  notification views, and template management.
- **Shared foundations:** schema and migrations, Zod validation, permission
  helpers, audit patterns, accessible form/navigation components, and CI.
- **Authentication:** Better Auth configuration, sign-in UI, and SMTP-backed auth
  email code. Database/auth integration and a complete account-entry/recovery
  journey are active release blockers.
- **Family and advanced-domain groundwork:** guardian relationships, registration,
  waivers, volunteers, officials, chat/moderation, divisions, tournaments, venues,
  incidents, calendar subscriptions, and extension helpers. Several lack connected
  application journeys or contain incomplete behavior; they are not alpha.1
  commitments.
- **Communications:** announcements are distinct from delivered notifications.
  Dispatch bookkeeping and templates exist, but live producer/delivery wiring
  remains incomplete and the reminder cron currently logs rather than sends.
- **Privacy and operations:** policies, lifecycle helpers, deployment guidance,
  and web/mobile scaffolding exist. Full deletion/session handling, safe private
  response caching, monitoring, restore, and deployed workflow proof still need
  qualification.

The first alpha will qualify one organizer-to-invited-adult workflow in a browser.
Do not use the current build for real child accounts or sensitive player data.
Historical milestone checkmarks and Storybook examples are not release evidence.

## The clever bits

A few design decisions that shape how the whole thing fits together:

- **League-first multi-tenancy.** Everything is scoped to a league. Teams, players, events, and permissions all live under that umbrella, which keeps data isolation clean from the start.
- **Service-layer architecture.** The intended boundary puts data access and permission enforcement behind services rather than presentation code. Alpha qualification must verify this on exposed paths.
- **Soft deletes and audit trails.** Core domain code includes these patterns to preserve administrative context. They do not replace a complete privacy and account-deletion lifecycle.
- **Players aren't users.** Player records are decoupled from user accounts, so a coach can manage a roster without every 8-year-old needing a login.
- **Guardian-aware design.** Minor-account helpers use placeholder email addresses and guardian relationships, and auth email code blocks placeholder recipients. Real minor access and notification behavior remain outside alpha.1 until qualified.
- **Mobile-first, accessible by default.** The UI is built on shadcn/ui-compatible components with Radix primitives, so keyboard navigation and screen readers work out of the box. Navigation announces the current page (`aria-current`) with a visible keyboard focus ring, and the shared `FormField` wires every control to its help and error text (`aria-describedby`, `aria-invalid`) so assistive technology stays in sync. These behaviors are covered by component and Playwright tests.

## Workspace layout

```text
apps/web        Next.js application shell
packages/auth   Better Auth configuration scaffold
packages/db     Drizzle schema, Neon client, and database config
```

## Environment variables

See `.env.example` for local development defaults.

### Auth

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_URL` | Base URL for auth callbacks |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `AUTH_EMAIL_FROM` | Sender address for auth emails |
| `AUTH_SMTP_URL` | SMTP transport for auth emails; operational notification delivery is separate |

### Database

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |

### Observability (off by default)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_ENABLE_PLAUSIBLE` | Enable Plausible analytics (`false`) |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible domain |
| `NEXT_PUBLIC_ENABLE_SENTRY` | Enable Sentry error tracking (`false`) |
| `SENTRY_DSN` | Sentry data source name |
| `SENTRY_AUTH_TOKEN` | Sentry auth token |
| `SENTRY_ORG` | Sentry organization |
| `SENTRY_PROJECT` | Sentry project |

Plausible is scaffolded as an optional script include and only loads when explicitly enabled. Sentry is wired as a no-op capture scaffold so the project can add the official SDK later without reworking route-level error boundaries.

## Documentation

| Document | What it covers |
| --- | --- |
| [`PLAN.md`](./PLAN.md) | Authoritative first-alpha scope, priorities, status definitions, dependencies, and release gates |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Deployment runbook, env matrix, and release/rollback steps |
| [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) | Historical strategy analysis; capability claims require revalidation before reuse |
| [`EXECUTION_PLAN_90_DAYS.md`](./EXECUTION_PLAN_90_DAYS.md) | Superseded 90-day plan retained as a detailed backlog, mapped to the current alpha milestones |
| [`MARKETING_FEATURE_MATRIX.md`](./MARKETING_FEATURE_MATRIX.md) | Historical positioning matrix, not a verified or publication-ready capability scorecard |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Local workflow, branch expectations, and review notes |
| [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) | Community participation standards |
| [`SECURITY.md`](./SECURITY.md) | How to report vulnerabilities |
| [`NOTICE`](./NOTICE) | Licensing and project notice |

## Contributing

We want Teamsster to feel approachable for first-time contributors and sustainable for maintainers. Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request, follow the standards in [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md), and use [`SECURITY.md`](./SECURITY.md) for responsible disclosure.

Keep discussions constructive, curious, and welcoming, especially for volunteers and newcomers building sports tooling for their communities.

## License

AGPL-3.0 © Alex Perrault

Teamsster is distributed under the **GNU Affero General Public License v3.0 or later**. You're free to use, study, modify, and redistribute the software. If you run a modified version over a network, you must also offer the corresponding source code to users of that service. See [`LICENSE`](./LICENSE) for the full terms.
