# Teamsster

Teamsster is a playful, friendly, **AGPL-3.0-licensed** team and league management app for small organizations and youth sports. The project is intentionally **sport-agnostic**, **mobile-first**, and designed from the start for **extensibility, inclusive collaboration, and a great contributor experience**.

## Vision

Teamsster aims to give leagues, clubs, volunteer boards, coaches, and families a shared home for the everyday logistics that keep sports joyful: rosters, schedules, permissions, communication, and the little admin details that usually end up scattered across chats and spreadsheets.

## Current scaffold highlights

- **Next.js 15** App Router scaffold with strict TypeScript
- **pnpm monorepo** with `apps/web`, `packages/db`, and `packages/auth`
- **Tailwind CSS v4** with **shadcn/ui-compatible** component setup and **Radix Slot** integration
- **Drizzle ORM + Neon Postgres** database package with league-first schema stubs
- **Better Auth** scaffold for email/password and magic-link sign-in
- **Centralized Zod validation** helpers for future forms and mutations
- **Biome** formatting and linting, plus Husky, lint-staged, and commitlint
- **Vitest + Testing Library + Playwright** testing stack
- **GitHub workflows** for CI, E2E, CodeQL, and Renovate automation scaffolding

## Project principles

- League-first multi-tenancy
- No direct database calls in React components
- Soft deletes and audit trails from the beginning
- Player records decoupled from user accounts
- Mobile-first, friendly UI with accessible building blocks
- Centralized permission and validation helpers before business features

## Quick start

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

Open `http://localhost:3000` to view the app shell.

### Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

## Workspace layout

```text
apps/web        Next.js application shell
packages/auth   Better Auth configuration scaffold
packages/db     Drizzle schema, Neon client, and database config
```

## Environment variables

See `.env.example` for local development defaults.

### Auth

- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `AUTH_EMAIL_FROM`
- `AUTH_SMTP_URL` (reserved for future email transport wiring)

### Database

- `DATABASE_URL`

### Observability (off by default)

- `NEXT_PUBLIC_ENABLE_PLAUSIBLE=false`
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=`
- `NEXT_PUBLIC_ENABLE_SENTRY=false`
- `SENTRY_DSN=`
- `SENTRY_AUTH_TOKEN=`
- `SENTRY_ORG=`
- `SENTRY_PROJECT=`

Plausible is scaffolded as an optional script include and only loads when explicitly enabled. Sentry is currently wired as a no-op capture scaffold so the project can add the official SDK later without reworking route-level error boundaries.

## AGPL-3.0 notes

Teamsster is distributed under the **GNU Affero General Public License v3.0 or later**. In short:

- You may use, study, modify, and redistribute the software.
- If you run a modified version over a network, you must also offer the corresponding source code to users of that service.
- Contributions remain part of an AGPL ecosystem focused on keeping improvements available to the community.

For the full terms, see [`LICENSE`](./LICENSE).

## Documentation

- [`PLAN.md`](./PLAN.md) — detailed roadmap and milestone plan
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — local workflow, branch expectations, and review notes
- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) — community participation standards
- [`SECURITY.md`](./SECURITY.md) — how to report vulnerabilities
- [`NOTICE`](./NOTICE) — licensing and project notice

## Feature roadmap snapshot

The initial scaffold intentionally stops short of business features. Near-term milestones focus on:

1. Auth and onboarding flows
2. League and team CRUD foundations
3. Roster workflows and invitations
4. Event scheduling, RSVPs, and calendar exports
5. Messaging, reporting, and extension points

See [`PLAN.md`](./PLAN.md) for the full milestone breakdown.

## Community and contributions

We want Teamsster to feel approachable for first-time contributors and sustainable for maintainers.

- Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request.
- Follow the standards in [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).
- Use [`SECURITY.md`](./SECURITY.md) for responsible disclosure.
- Keep discussions constructive, curious, and welcoming—especially for volunteers and newcomers building sports tooling for their communities.
