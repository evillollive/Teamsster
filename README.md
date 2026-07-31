# 🏆 Teamsster

**Team and league management that doesn't make volunteers want to quit.**

Teamsster is an open-source, sport-agnostic app for the people who actually keep youth sports and small leagues running: coaches, board members, parents, and the one person who somehow ended up managing everything in a group chat. It handles rosters, schedules, communication, and permissions so all that admin work lives in one place instead of scattered across texts and spreadsheets.

It's built with Next.js 15, TypeScript, and Postgres, designed mobile-first, and licensed under AGPL-3.0 so it stays open.

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

Open `http://localhost:3000` and you're in.

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

## What's already here

Teamsster isn't just a scaffold. There's real working functionality across several domains:

- **Auth and onboarding.** Email/password, magic-link, and username/password sign-in via Better Auth. Minor accounts can sign in with just a username (no email needed). Onboarding flows, account settings, and guardian management for linked minor accounts.
- **Minor accounts and guardian links.** Kids don't need an email address. A parent or guardian creates a minor account with a username and password, and all notifications route to the guardian(s) instead. Many-to-many guardian links with primary designation, and the system won't let you remove the last guardian from a minor.
- **League administration.** Create, update, and archive leagues and teams. Role assignment with reusable templates, invitation workflows, audit log persistence, and a dashboard with empty states that guide new users.
- **Roster management.** Player CRUD with soft deletes, guardian contacts, eligibility tracking, and profile metadata. Structured relationship types (parent, guardian, stepparent, grandparent, sibling, coach, other) with automatic normalization from legacy free-text values. Captain role with full/restricted permission levels and roster badges. Division and age group management with competitive levels (recreational, competitive, elite).
- **Scheduling.** Team event creation with recurrence, RSVP states, ICS calendar exports, reminder windows, and embedded team/league agenda views. Live calendar subscriptions with per-user token-authenticated iCal feeds for Apple Calendar, Google Calendar, and Outlook.
- **Registration.** Seasonal registration with configurable form builder, multi-child flows, pre-fill from prior seasons, admin status dashboard, and deadline notifications. Field sanitization and rate limiting built in. Digital waivers with tamper-evident metadata, encrypted insurance/medical storage (AES-256-GCM), role-gated visibility, payment status placeholder, and comprehensive audit logging.
- **Volunteer tracking.** Volunteer opportunities with slot-based signup, check-in/check-out hours tracking, manual hour entry, CSV export with formula injection prevention. Standing volunteer roles (Travel Coordinator, Social Coordinator, etc.) with league/team scope, multi-holder assignment, and directory view.
- **Officials and game management.** REFEREE role, game assignment workflow with confirm/decline, score logging with validation, availability preferences, and comprehensive audit logging.
- **In-app messaging.** Conversations schema (DMs and group threads), thread membership enforcement, message sanitization (XSS prevention), unread counts, and rate limiting.
- **Messaging safety.** Minor DM restrictions (team_threads_only, no_dm, approved_contacts_only), message flagging with review queue, user muting with expiration, configurable retention policies, and full moderation audit trail.
- **Privacy and compliance.** Account data export with formula-safe sanitization, account deletion with cascade planning (message anonymization, guardian reassignment), documented guardian boundaries, minor consent validation, and data retention policies. SECURITY.md with comprehensive security documentation.
- **Extensibility.** Domain event hook system (25 event types), extension module registration, versioned API contracts with auth validation and rate limiting. Proof-of-concept modules for payments (Stripe webhook scaffold) and stats (standings calculation with win/loss/tie/goal tracking).
- **Tournaments.** Single-elimination, double-elimination, round-robin, and pool-play bracket generation with automatic score-driven advancement. Seeded brackets with bye calculation and next-match linking.
- **Venues.** Field and venue management with surface types, amenities, recurring availability calendars, time-conflict detection, and weather cancellation planning.
- **Incident reporting.** Coaches and officials can file incident/injury reports with type (injury, conduct, facility), severity levels, encrypted medical details, involved party tracking, admin review workflow, and CSV export with formula injection prevention.
- **Communication.** League and team announcements, user-level notification preferences, digest and reminder templates, delivery logs, and permission-gated contact actions. Unified notification platform with per-event/per-channel preferences, in-app feed with unread badges, scheduled delivery helpers, email sanitization, rate-limited token registration, and guardian-aware routing.
- **Centralized validation.** Zod schemas and permission helpers for all mutations, so business logic stays consistent.
- **Template system.** Reusable templates for events, announcements, registration forms, and volunteer opportunities. League-scoped with team-level overrides, built-in starters, payload sanitization, and admin management UI.

## The clever bits

A few design decisions that shape how the whole thing fits together:

- **League-first multi-tenancy.** Everything is scoped to a league. Teams, players, events, and permissions all live under that umbrella, which keeps data isolation clean from the start.
- **No database calls in components.** All data access goes through server actions and service layers. Components stay focused on rendering.
- **Soft deletes and audit trails everywhere.** Nothing actually disappears. Every mutation is traceable, which matters when volunteers rotate and context gets lost.
- **Players aren't users.** Player records are decoupled from user accounts, so a coach can manage a roster without every 8-year-old needing a login.
- **Minor-safe by design.** Minor accounts use system-generated placeholder emails that never receive real mail. All notifications route through guardians, auth email senders block placeholder addresses, and personal league provisioning is skipped for minors.
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
| `AUTH_SMTP_URL` | SMTP transport (reserved for future wiring) |

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
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Deployment runbook, env matrix, and release/rollback steps |
| [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) | Comparative analysis of current product depth, roadmap gaps, and competitor positioning |
| [`EXECUTION_PLAN_90_DAYS.md`](./EXECUTION_PLAN_90_DAYS.md) | A 90-day execution plan focused on onboarding, proof, deployment readiness, and go-to-market packaging |
| [`MARKETING_FEATURE_MATRIX.md`](./MARKETING_FEATURE_MATRIX.md) | Marketing-ready comparison matrix and positioning guide versus key competitors |
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
