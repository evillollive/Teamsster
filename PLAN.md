# Teamsster roadmap

## Guiding goals

- Build a sport-agnostic, league-first foundation.
- Prioritize inclusive collaboration for families, volunteers, staff, and players.
- Optimize the project for onboarding, extensibility, and dependable maintenance.
- Establish quality, security, and contributor guardrails before shipping business logic.
- Design natively for all-volunteer organizations with no assumption of paid staff, flexible multi-role membership, and deep permission control at every layer of the product.

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
- [x] Multi-role assignments where a user may hold multiple roles simultaneously within an org or team and effective permissions are resolved as the union of all assigned roles.
- [x] Job/role templates where roles are reusable definitions (label + permission set) assignable across teams.
- [x] Layered permission scoping across org-wide, team-level, feature-level, and field-level permissions, with org and feature scopes delivered in this milestone and field-level enforcement delivered in Milestone 3.
- [x] Explicit no-import policy: no external data import (Excel/CSV/third-party apps), with manual guided onboarding as the supported path.
- [x] Audit log persistence and read views.
- [x] League dashboard with empty states and onboarding guidance.
- [x] Milestone checkpoint: refresh README and contributor-facing docs for shipped admin workflows.

## Milestone 3 — roster workflows

### Goals
- Support player-first roster management without tying every player to a user account.
- Make guardian and volunteer collaboration feel natural.

### Work items
- [x] Player CRUD with soft deletes.
- [x] Guardian/contact relationships.
- [x] ~~Bulk import and CSV validation pipeline.~~ (Deprecated: retired in favor of manual onboarding and validation-first workflows.)
- [x] No external file import (CSV/Excel): out of scope by design; roster entry is manual only.
- [x] Eligibility, jersey, and profile metadata extensions.
- [x] Role-gated contact visibility for member phone/email using field-level read permissions through centralized permission helpers; no user opt-out.
- [x] Field-level permission enforcement to complete the four-level permission model introduced in Milestone 2.
- [x] Roster permission regression tests.
- [x] Milestone checkpoint: refresh README and contributor-facing docs for roster workflows.

## Milestone 4 — scheduling and attendance

### Goals
- Ship game, practice, and general event workflows that work well on phones.
- Make attendance and reminders friendly for busy families.

### Work items
- [x] Event CRUD and recurrence basics.
- [x] RSVP states and response summaries.
- [x] Calendar exports (ICS) and reminders.
- [x] Team and league event views.
- [x] Playwright coverage for critical event journeys.
- [x] Milestone checkpoint: refresh README and contributor-facing docs for scheduling workflows.

## Milestone 5 — communications and notifications

### Goals
- Offer clear, opt-in communication tools without overwhelming users.
- Respect roles, privacy, and auditability.

### Work items
- [x] Messaging primitives for league and team announcements.
- [x] Notification preferences per user.
- [x] Email digests and reminder templates.
- [x] Delivery logging and audit hooks.
- [ ] Contact actions (click-to-call, click-to-email, SMS composition, and contact export) governed by action permissions distinct from view permissions.
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
- Validation (data integrity and permission integrity) is a non-negotiable acceptance criterion for volunteer-organization, role, and contact features.
