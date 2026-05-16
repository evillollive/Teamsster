# Teamsster roadmap

## Guiding goals

- Build a sport-agnostic, league-first foundation.
- Prioritize inclusive collaboration for families, volunteers, staff, and players.
- Optimize the project for onboarding, extensibility, and dependable maintenance.
- Establish quality, security, and contributor guardrails before shipping business logic.

## Milestone 0 — repository foundation (this scaffold)

### OSS and governance
- [x] AGPL-3.0 license and notice files
- [x] README with setup, roadmap summary, governance references, and AGPL explanation
- [x] CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, and PR template
- [x] Issue templates for bugs and feature ideas

### Platform and tooling
- [x] pnpm monorepo scaffold
- [x] Next.js 15 App Router app shell
- [x] Strict TypeScript baseline
- [x] Tailwind v4 and shadcn/ui-compatible component setup
- [x] Biome lint/format config
- [x] Husky, lint-staged, and commitlint hooks
- [x] Vitest, Testing Library, and Playwright setup
- [x] GitHub Actions workflows for CI, E2E, CodeQL, and Renovate

### Architecture and data groundwork
- [x] Drizzle + Neon configuration package
- [x] Better Auth configuration scaffold
- [x] League-first schema stubs
- [x] Central permission helpers
- [x] Shared Zod validation helpers
- [x] Mobile-first route shell with loading and error boundaries

## Milestone 1 — authentication and onboarding

### Goals
- Create a polished sign-in, sign-up, and magic-link experience.
- Auto-create a Personal League during first-time onboarding.
- Capture timezone and display-name preferences early.

### Work items
- [x] Replace auth email logging scaffolds with a production-ready mail transport.
- [x] Add Better Auth tables and migrations.
- [x] Implement onboarding flow for personal league creation.
- [x] Add account settings pages for profile, timezone, and notification preferences.
- [x] Add tests around onboarding edge cases and invitation flows.

## Milestone 2 — league administration

### Goals
- Let organizers manage leagues, teams, and staff memberships confidently.
- Keep every mutation behind shared validation and permission helpers.

### Work items
- [x] League create/update/archive flows.
- [x] Team create/update/archive flows.
- [x] Role assignment and invitation workflows.
- [x] Audit log persistence and read views.
- [x] League dashboard with empty states and onboarding guidance.
- [x] Milestone checkpoint: refresh README and contributor-facing docs for shipped admin workflows.

## Milestone 3 — roster workflows

### Goals
- Support player-first roster management without tying every player to a user account.
- Make guardian and volunteer collaboration feel natural.

### Work items
- [ ] Player CRUD with soft deletes.
- [ ] Guardian/contact relationships.
- [ ] Bulk import and CSV validation pipeline.
- [ ] Eligibility, jersey, and profile metadata extensions.
- [ ] Roster permission regression tests.
- [ ] Milestone checkpoint: refresh README and contributor-facing docs for roster workflows.

## Milestone 4 — scheduling and attendance

### Goals
- Ship game, practice, and general event workflows that work well on phones.
- Make attendance and reminders friendly for busy families.

### Work items
- [ ] Event CRUD and recurrence basics.
- [ ] RSVP states and response summaries.
- [ ] Calendar exports (ICS) and reminders.
- [ ] Team and league event views.
- [ ] Playwright coverage for critical event journeys.
- [ ] Milestone checkpoint: refresh README and contributor-facing docs for scheduling workflows.

## Milestone 5 — communications and notifications

### Goals
- Offer clear, opt-in communication tools without overwhelming users.
- Respect roles, privacy, and auditability.

### Work items
- [ ] Messaging primitives for league and team announcements.
- [ ] Notification preferences per user.
- [ ] Email digests and reminder templates.
- [ ] Delivery logging and audit hooks.
- [ ] Accessibility review for message composition flows.
- [ ] Milestone checkpoint: refresh README and contributor-facing docs for communication workflows.

## Milestone 6 — extensibility and ecosystem

### Goals
- Make Teamsster easy to adapt for different sports and organization sizes.
- Create stable seams for future modules like payments, stats, and tournaments.

### Work items
- [ ] Extension strategy and package boundaries.
- [ ] Public hooks for integrations.
- [ ] Developer docs for new feature modules.
- [ ] Example advanced modules (payments, stats, brackets) as optional add-ons.
- [ ] API contracts for external consumers and mobile clients.
- [ ] Milestone checkpoint: refresh README and contributor-facing docs for extension points.

## Continuous best practices

- Every form validated with Zod.
- Every permission check routed through centralized helpers.
- No direct database access from UI components.
- Prefer small composable server-side modules over route-specific duplication.
- Every milestone should add or update test coverage for newly introduced behavior.
- Keep CI green with lint, typecheck, unit tests, integration tests, build, and E2E coverage where appropriate.
- Review and update the README and contributor-facing docs at milestone checkpoints when user-facing capabilities, setup, architecture, or workflow expectations change.
- Review security, observability, and accessibility as first-class concerns at every milestone.
