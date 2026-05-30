# Teamsster roadmap

## Guiding goals

- Build a sport-agnostic, league-first foundation.
- Prioritize inclusive collaboration for families, volunteers, staff, and players.
- Support participants of all ages, including minors who may not have email addresses.
- Optimize the project for onboarding, extensibility, and dependable maintenance.
- Establish quality, security, and contributor guardrails before shipping business logic.
- Design natively for all-volunteer organizations with no assumption of paid staff, flexible multi-role membership, and deep permission control at every layer of the product.
- Provide built-in communication so leagues don't need external chat tools.

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

### Follow-up: live calendar subscriptions
- [ ] Subscribable iCal feed URLs for team and league calendars (read-only `.ics` endpoint that Apple Calendar, Google Calendar, Outlook, etc. can poll).
- [ ] Per-team and per-league feed URLs with token-based authentication (no login required to subscribe, but URL is unique per user to respect privacy).
- [ ] Feed includes all events the user has access to, with RSVP status embedded as attendee metadata.
- [ ] Auto-updates: external calendars pick up new/changed/cancelled events on their next sync cycle.
- [ ] UI for copying the subscription URL from team and league settings pages.
- [ ] Tests for feed generation, token auth, and event update propagation.

## Milestone 5 — communications and notifications

### Goals
- Offer clear, opt-in communication tools without overwhelming users.
- Respect roles, privacy, and auditability.

### Work items
- [x] Messaging primitives for league and team announcements.
- [x] Notification preferences per user.
- [x] Email digests and reminder templates.
- [x] Delivery logging and audit hooks.
- [x] Contact actions (click-to-call, click-to-email, SMS composition, and contact export) governed by action permissions distinct from view permissions.
- [x] Accessibility review for message composition flows.
- [x] Milestone checkpoint: refresh README and contributor-facing docs for communication workflows.

### Follow-up: mobile push notifications
- [ ] Push notification infrastructure via Capacitor Push Notifications plugin (APNs for iOS, FCM for Android).
- [ ] Device token registration and storage linked to user accounts.
- [ ] Opt-in notification preferences: users choose which event types trigger push (upcoming events, RSVP reminders, announcements, messages, volunteer slot reminders).
- [ ] Scheduled push delivery for upcoming event reminders (configurable lead time: 1 hour, 1 day, etc.).
- [ ] Real-time push for new announcements, messages, and RSVP changes.
- [ ] Minor account push routing: push notifications for minors also go to linked guardian devices.
- [ ] Badge count management (unread messages, pending RSVPs).
- [ ] Graceful fallback: if push isn't available (web-only user, permissions denied), email notifications continue as the delivery channel.
- [ ] Tests for token registration, delivery routing, preference filtering, and minor-to-guardian forwarding.

## Milestone 6 — username-only auth and minor accounts

### Goals
- Let kids sign up and log in with just a username and password, no email required.
- Keep existing email-based auth for adults.
- Every minor account must be linked to at least one parent/guardian account.
- Support many-to-many relationships: multiple guardians per minor, multiple minors per guardian.
- Emails meant for minor accounts (notifications, reminders, etc.) should route to their attached parent/guardian(s) instead.

### Work items
- [ ] Add optional `username` field to user schema (unique, nullable).
- [ ] Username/password auth flow alongside existing email/password and magic-link flows.
- [ ] Username validation rules (length, allowed characters, uniqueness).
- [ ] Account type flag (standard vs. minor) to enable safety guardrails downstream.
- [ ] Guardian-minor link table: many-to-many relationship between minor accounts and guardian accounts. A minor must have at least one linked guardian at all times.
- [ ] Enforce guardian requirement: minor account creation requires linking to an existing guardian account. Unlinking the last guardian from a minor is blocked.
- [ ] Admin/coach ability to create minor accounts on behalf of a player, with guardian linking in the same flow.
- [ ] Guardian dashboard: parent/guardian users can see and manage all linked minor accounts from their own profile.
- [ ] Email routing for minors: all email notifications (reminders, announcements, digests) for minor accounts are delivered to their linked guardian(s) instead, with clear labeling of which child the email is about.
- [ ] Profile settings page works for username-only accounts (no email change section).
- [ ] Tests for username auth, guardian linking (many-to-many), email routing, and edge cases (last guardian removal blocked, duplicate usernames, etc.).
- [ ] Milestone checkpoint: update README and auth documentation.

## Milestone 7 — structured relationship tags

### Goals
- Replace the free-text guardian relationship field with defined, selectable options.
- Keep flexibility for situations that don't fit the defaults.

### Work items
- [ ] Define standard relationship types (parent, guardian, grandparent, stepparent, sibling, coach, emergency contact, other).
- [ ] Migration to convert existing free-text values to the new structured field.
- [ ] "Other" option with custom text entry for edge cases.
- [ ] Update player contact forms to use a dropdown with optional custom entry.
- [ ] Permission implications: relationship type can influence contact visibility rules.
- [ ] Tests for migration, form validation, and permission interactions.
- [ ] Milestone checkpoint: update roster documentation.

## Milestone 8 — seasonal registration and forms

### Goals
- Give leagues a self-service registration flow that families complete each season.
- Collect all required information (player details, emergency contacts, insurance, medical info, addresses) in one guided form.
- Support digital liability waiver signatures so paperwork doesn't live in binders.
- Leave a clean seam for future payment integration without building a payment system now.

### Work items
- [ ] Season schema: leagues can define seasons (name, year, registration open/close dates, active status) so rosters and forms are scoped to a time period.
- [ ] Registration form builder: admins can configure which fields are required per season (player info, guardian contacts, emergency contacts, insurance, medical notes, address, custom fields).
- [ ] Self-service registration flow: parents/guardians fill out the form for their player(s), review, and submit. Returning families see pre-filled data from the previous season.
- [ ] Insurance information fields: carrier, policy number, group number, insured name. Stored securely with role-gated visibility (admin/coach only).
- [ ] Medical/allergy notes field: free-text for conditions coaches need to know about, with appropriate visibility controls.
- [ ] Digital waiver signatures: click-through liability/participation agreements with timestamp, IP, and signer identity recorded. Waiver text is configurable per league.
- [ ] Waiver storage and retrieval: admins can view and export signed waivers for compliance.
- [ ] Season-based roster management: when a new season opens, rosters start fresh. Players from the previous season can re-register but aren't auto-carried over.
- [ ] Registration status dashboard: admins see who's registered, who's incomplete, and who's missing waivers or required fields.
- [ ] Payment integration hook: registration form includes a "payment" step placeholder that can link to an external processor (Stripe, PayPal, etc.) in a future milestone. For now, admins can mark payment as received/pending manually.
- [ ] Email/push notifications for registration deadlines and incomplete submissions.
- [ ] Tests for form validation, waiver recording, season transitions, and permission-gated field visibility.
- [ ] Milestone checkpoint: update README and admin documentation.

## Milestone 9 — volunteer tracking

### Goals
- Give leagues a simple, reliable way to track volunteer signups and hours.
- Make it easy for admins to see who's contributing and export the data when they need it.

### Work items
- [ ] Volunteer opportunity schema (title, description, date/time, location, slots available, associated event/team/league).
- [ ] Signup flow: volunteers can claim open slots from a list of opportunities.
- [ ] Check-in and hours tracking: auto-calculated from slot times, with optional manual hour entry for off-app work.
- [ ] Volunteer dashboard for users to see their own signups and logged hours.
- [ ] Admin volunteer management view: see all volunteers, hours, and signups across the league.
- [ ] Spreadsheet export (CSV) of volunteer hours and signups, admin-only, filterable by date range, team, and volunteer.
- [ ] Volunteer role integration: link volunteer status to existing role/membership system.
- [ ] Notifications for upcoming volunteer slots (opt-in).
- [ ] Tests for signup flows, hour calculations, and export output.
- [ ] Milestone checkpoint: update README and admin documentation.

## Milestone 10 — in-app messaging

### Goals
- Replace the need for Slack, Discord, or group texts with built-in messaging.
- Keep it safe for organizations with minor participants.

### Work items
- [ ] Conversations schema: support both one-on-one DMs and group threads.
- [ ] Team and league group threads auto-created when teams/leagues are created.
- [ ] DM initiation between members within the same league scope.
- [ ] Real-time or near-real-time message delivery (polling or WebSocket).
- [ ] Unread counts and notification badges.
- [ ] Message composition with basic formatting (text, links).
- [ ] Minor safety controls: admins/coaches can restrict who minor accounts can message (e.g., no unsupervised DMs, team threads only, or specific contact lists).
- [ ] Admin moderation tools: ability to review flagged messages, mute users, and set messaging policies per league.
- [ ] Message retention and audit logging consistent with existing audit patterns.
- [ ] Push notification integration for new messages (ties into existing notification preferences).
- [ ] Tests for messaging permissions, minor safety rules, and delivery.
- [ ] Milestone checkpoint: update README and communication documentation.

## Milestone 11 — extensibility and ecosystem

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

### Suggested issue-sized breakdown
- [ ] 11.1 Deployment hardening baseline
  - [ ] Finalize and maintain deployment runbook.
  - [ ] Keep environment matrix current across local/staging/production.
  - [ ] Keep migration/release/rollback steps current with platform changes.
- [ ] 11.2 Extension architecture
  - [ ] Define core-vs-optional package boundaries.
  - [ ] Identify stable extension seams for modules and feature toggles.
  - [ ] Document ownership and compatibility expectations for extension points.
- [ ] 11.3 Integration surface
  - [ ] Introduce domain event hooks for announcements, roster, scheduling, and membership changes.
  - [ ] Document supported lifecycle hooks and payload stability guarantees.
  - [ ] Add tests to protect hook contracts from accidental breakage.
- [ ] 11.4 Developer platform
  - [ ] Publish contributor guide for creating add-on modules.
  - [ ] Provide module templates for validation, permissions, and data access patterns.
  - [ ] Add a reference add-on module skeleton in the monorepo.
- [ ] 11.5 External API contracts
  - [ ] Define versioned external contract surface for web/mobile consumers.
  - [ ] Separate internal-only server actions from public API boundaries.
  - [ ] Document authentication and deprecation policy for external clients.
- [ ] 11.6 Proof modules
  - [ ] Deliver one payments prototype module.
  - [ ] Deliver one stats or tournament/bracket prototype module.
  - [ ] Run checkpoint review to confirm extension architecture supports both.

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
