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

## Milestone 6 — username-only auth and minor accounts

> **Depends on:** M1 auth infrastructure
> **Enables:** M7 relationship tags, M10/M11 registration (guardian-aware forms), M15/M16 messaging safety
> **Out of scope:** waiver signing (M11), payment collection

### Goal
Minors can sign up and use the app with just a username and password. Every minor account is linked to at least one guardian. Notifications meant for minors route to their guardians.

### Acceptance criteria
- A minor can log in with username/password, no email.
- A guardian can manage multiple linked minor accounts from their profile.
- Removing the last guardian from a minor is blocked.
- Email notifications for minor accounts are delivered to linked guardian(s).

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

## Milestone 7 — structured relationship tags and captain role

> **Depends on:** M6 minor accounts, M3 roster/contact schema
> **Enables:** M10/M11 registration (relationship-aware forms), M14 officials (role model patterns)
> **Out of scope:** volunteer roles (M13), referee role (M14)

### Goal
Guardian relationships use structured, selectable types instead of free text. Teams can designate captains with configurable permission levels.

### Acceptance criteria
- Contact forms use a dropdown with standard relationship options plus a custom "other" entry.
- Existing free-text values are migrated to the new structured field.
- A coach can assign CAPTAIN to a player with a full or restricted permission toggle.
- Removing PLAYER from a user auto-removes CAPTAIN.

### Work items

#### Relationship tags
- [ ] Define standard relationship types (parent, guardian, grandparent, stepparent, sibling, coach, emergency contact, other).
- [ ] Migration to convert existing free-text values to the new structured field.
- [ ] "Other" option with custom text entry for edge cases.
- [ ] Update player contact forms to use a dropdown with optional custom entry.
- [ ] Permission implications: relationship type can influence contact visibility rules.
- [ ] Tests for migration, form validation, and permission interactions.

#### Captain role
- [ ] Add CAPTAIN to the membership role enum.
- [ ] CAPTAIN is a dependent role: requires PLAYER on the same team. Assigning CAPTAIN without PLAYER is blocked. Removing PLAYER auto-removes CAPTAIN.
- [ ] Permission level toggle per captain assignment: full (can message team, view teammate contact info, help coordinate attendance) or restricted (title and roster visibility only, permissions stay close to PLAYER).
- [ ] Multiple captains per team with no cap.
- [ ] Cross-team independence: a user can be captain on one team and a regular player on another.
- [ ] Minor accounts default to restricted when assigned CAPTAIN. Coaches can override.
- [ ] Captain badge/indicator on roster views so the role is visible to the team.
- [ ] Tests for dependent role enforcement, permission toggle, minor defaults, and multi-team scenarios.

- [ ] Milestone checkpoint: update roster documentation.

## Milestone 8 — notification platform

> **Depends on:** M6 minor accounts (guardian routing)
> **Enables:** M10/M11 registration reminders, M12 calendar alerts, M13 volunteer reminders, M14 game assignments, M15/M16 message notifications
> **Out of scope:** message content delivery (M15), moderation alerts (M16)

### Goal
A unified notification system that handles routing, preferences, and delivery across all channels so downstream milestones can fire notifications without reinventing the plumbing.

### Acceptance criteria
- A notification event dispatches to the correct channels (email, in-app, push) based on user preferences.
- Minor notifications route to guardian devices and email.
- Users can configure preferences per event type.
- Failed deliveries retry with fallback behavior.

### Work items
- [ ] Notification event schema: typed event registry (event_reminder, rsvp_change, announcement, message, volunteer_reminder, assignment, registration_deadline, etc.).
- [ ] User notification preferences: per-event-type channel selection (email, in-app, push, off). Stored per user with sensible defaults.
- [ ] Guardian routing: notifications for minor accounts are dispatched to all linked guardian accounts across all channels.
- [ ] In-app notification feed: persistent notification list with read/unread state, accessible from the header.
- [ ] Push notification infrastructure via Capacitor Push Notifications plugin (APNs for iOS, FCM for Android).
- [ ] Device token registration and storage linked to user accounts.
- [ ] Scheduled delivery for time-based reminders (configurable lead times: 1 hour, 1 day, etc.).
- [ ] Badge count management (unread notifications).
- [ ] Delivery logging: record every dispatch attempt with channel, status, and timestamp. Ties into existing audit patterns.
- [ ] Retry and fallback: if push fails, fall back to email. If email fails, ensure in-app notification still persists.
- [ ] Tests for event dispatching, preference filtering, guardian routing, delivery logging, and fallback behavior.
- [ ] Milestone checkpoint: update README and notification documentation.

## Milestone 9 — template system

> **Depends on:** M2 league/team admin, M4 event schema
> **Enables:** M10 registration (form templates), M13 volunteer (opportunity templates)
> **Out of scope:** template versioning, template marketplace

### Goal
Admins can create and reuse templates for events, registration forms, announcements, and volunteer opportunities so they don't rebuild common items from scratch.

### Acceptance criteria
- An admin can create a template, and another admin can use it to pre-fill a new item.
- Starter templates ship out of the box and can be deleted or replaced.
- Team-level templates override league-level templates.

### Work items
- [ ] Template schema: unified template table with a `type` discriminator (event, registration_form, announcement, volunteer_opportunity) and a JSON `payload` column for type-specific field data.
- [ ] League-level templates: templates are scoped to a league and visible to all teams within it.
- [ ] Team-level overrides: teams can clone a league template and customize it, or create their own templates from scratch. Team templates are only visible to that team.
- [ ] Template CRUD: create, edit, rename, duplicate, and delete templates. Admin/role-gated.
- [ ] "Use template" flow: anywhere you create an event, announcement, registration form, or volunteer opportunity, a "Use template" button pre-fills the form from a selected template. The created item is independent of the template after creation (no live link).
- [ ] Starter templates: ship built-in defaults per type (e.g., "Weekly Practice", "Game Day", "Tournament" for events; "Rain Cancellation", "Field Change" for announcements; "Standard Season Registration" for forms; "Concession Stand Shift", "Field Setup" for volunteer slots). Leagues can delete or replace these.
- [ ] Template management UI: admin page to browse, edit, and organize templates by type. Shows which are league-level vs. team-level.
- [ ] Template preview: admins can preview what a template will look like before using it.
- [ ] Tests for template CRUD, clone/override behavior, starter template seeding, and permission gating.
- [ ] Milestone checkpoint: update README and admin documentation.

## Milestone 10 — seasonal registration: schema and forms

> **Depends on:** M6 minor accounts, M7 relationship tags, M9 templates (form templates)
> **Enables:** M11 waivers/medical/compliance, M13 volunteer intake
> **Out of scope:** waiver e-signatures (M11), payment processing, medical data collection (M11)

### Goal
Leagues can define seasons and families can self-register their players through a configurable form flow.

### Acceptance criteria
- An admin can create a season with open/close dates and configure a registration form.
- A guardian can register one or more minors through the self-service flow.
- Returning families see pre-filled data from the previous season.
- Admin dashboard shows registration status (registered, incomplete, missing).

### Work items
- [ ] Season schema: leagues can define seasons (name, year, registration open/close dates, active status) so rosters and forms are scoped to a time period.
- [ ] Registration form builder: admins can configure which fields are required per season (player info, guardian contacts, emergency contacts, address, custom fields).
- [ ] Self-service registration flow: parents/guardians fill out the form for their player(s), review, and submit. Returning families see pre-filled data from the previous season.
- [ ] Multi-child registration: guardians can register multiple linked minors in one flow.
- [ ] Season-based roster management: when a new season opens, rosters start fresh. Players from the previous season can re-register but aren't auto-carried over.
- [ ] Registration status dashboard: admins see who's registered, who's incomplete, and who's missing required fields.
- [ ] Email/push notifications for registration deadlines and incomplete submissions (via M8 notification platform).
- [ ] Tests for form validation, season transitions, multi-child flow, and pre-fill behavior.
- [ ] Milestone checkpoint: update README and admin documentation.

## Milestone 11 — registration: waivers, medical info, and compliance

> **Depends on:** M10 registration schema, M6 guardian accounts
> **Enables:** M14 officials (medical visibility scoping), M17 privacy hardening
> **Out of scope:** payment processing (placeholder only)

### Goal
Registration collects sensitive information (insurance, medical, waivers) with proper access controls, and includes a payment status placeholder.

### Acceptance criteria
- A guardian can sign a digital waiver during registration with audit trail.
- Insurance and medical info is stored with role-gated visibility (admin/coach only).
- Admins can view and export signed waivers.
- Payment status can be manually marked as received/pending.

### Work items
- [ ] Insurance information fields: carrier, policy number, group number, insured name. Stored securely with role-gated visibility (admin/coach only).
- [ ] Medical/allergy notes field: free-text for conditions coaches need to know about, with appropriate visibility controls.
- [ ] Digital waiver signatures: click-through liability/participation agreements with timestamp, IP, and signer identity recorded. Waiver text is configurable per league.
- [ ] Waiver storage and retrieval: admins can view and export signed waivers for compliance.
- [ ] Payment integration hook: registration form includes a "payment" step placeholder that can link to an external processor (Stripe, PayPal, etc.) in a future milestone. For now, admins can mark payment as received/pending/comped/scholarship manually.
- [ ] Payment status visibility on registration dashboard (ties into M10 dashboard).
- [ ] Audit logging for all access to medical and insurance data.
- [ ] Tests for waiver recording, role-gated field visibility, payment status, and audit logging.
- [ ] Milestone checkpoint: update README and admin documentation.

## Milestone 12 — live calendar subscriptions

> **Depends on:** M4 scheduling, M8 notification platform
> **Enables:** M14 officials (assignment calendar sync)
> **Out of scope:** two-way calendar sync (read-only feeds only)

### Goal
Users can subscribe to team and league calendars from Apple Calendar, Google Calendar, Outlook, or any iCal-compatible app, and see updates automatically.

### Acceptance criteria
- A user can copy a subscription URL from team/league settings.
- External calendars show events with RSVP status and auto-update on changes.
- Each subscription URL is unique per user for privacy.

### Work items
- [ ] Subscribable iCal feed URLs for team and league calendars (read-only `.ics` endpoint that Apple Calendar, Google Calendar, Outlook, etc. can poll).
- [ ] Per-team and per-league feed URLs with token-based authentication (no login required to subscribe, but URL is unique per user to respect privacy).
- [ ] Feed includes all events the user has access to, with RSVP status embedded as attendee metadata.
- [ ] Auto-updates: external calendars pick up new/changed/cancelled events on their next sync cycle.
- [ ] UI for copying the subscription URL from team and league settings pages.
- [ ] Tests for feed generation, token auth, and event update propagation.
- [ ] Milestone checkpoint: update scheduling documentation.

## Milestone 13 — volunteer tracking

> **Depends on:** M8 notification platform, M9 templates (opportunity templates), M10 seasons (seasonal volunteer needs)
> **Enables:** M14 officials (availability pattern reuse)
> **Out of scope:** background check tracking (future consideration)

### Goal
Leagues can post volunteer opportunities, volunteers can sign up, and admins can track hours and export reports.

### Acceptance criteria
- A volunteer can sign up for an open slot and see their own hours.
- An admin can see all volunteer activity across the league and export it as CSV.
- Hours are auto-calculated from slot times with optional manual entry.

### Work items
- [ ] Volunteer opportunity schema (title, description, date/time, location, slots available, associated event/team/league).
- [ ] Signup flow: volunteers can claim open slots from a list of opportunities.
- [ ] Check-in and hours tracking: auto-calculated from slot times, with optional manual hour entry for off-app work.
- [ ] Volunteer dashboard for users to see their own signups and logged hours.
- [ ] Admin volunteer management view: see all volunteers, hours, and signups across the league.
- [ ] Spreadsheet export (CSV) of volunteer hours and signups, admin-only, filterable by date range, team, and volunteer.
- [ ] Volunteer role integration: link volunteer status to existing role/membership system.
- [ ] Notifications for upcoming volunteer slots (opt-in, via M8 notification platform).
- [ ] Tests for signup flows, hour calculations, and export output.
- [ ] Milestone checkpoint: update README and admin documentation.

## Milestone 14 — officials and game management

> **Depends on:** M4 scheduling (game events), M8 notification platform, M12 calendar subscriptions
> **Enables:** M15 messaging (official group threads)
> **Out of scope:** incident/injury reports (future consideration), tournament brackets (M18)

### Goal
Leagues can manage referees and officials, assign them to games, and officials can log scores.

### Acceptance criteria
- An admin can assign an official to a game and the official can confirm or decline.
- Officials see their assignments in a personal calendar view.
- An official can submit a game score after a game.
- A parent who also refs can hold REFEREE alongside their other roles.

### Work items
- [ ] Add REFEREE role to the membership role enum. Refs are league-scoped members, not team-scoped.
- [ ] Official profiles: external officials can be invited to the system with a lightweight account, or existing users (e.g., a parent) can receive the REFEREE role alongside their other roles.
- [ ] Game assignment schema: link officials to specific events/games with assignment status (pending, confirmed, declined).
- [ ] Assignment workflow: league admins assign officials to games. Officials receive a notification and can confirm or decline.
- [ ] Official assignment calendar: refs see a personal view of their upcoming assignments with game details, venue, and team info.
- [ ] Permission scoping for officials: read access to game schedules, team rosters (player names, jersey numbers, eligibility), venue details, and coach contact info. No access to parent contacts, insurance/medical data, or team internal communications.
- [ ] Score logging: officials can submit game scores after a game. Scores are visible to league admins and can be published to teams.
- [ ] Admin assignment dashboard: league admins see all games, who's assigned, confirmation status, and gaps that need filling.
- [ ] Availability preferences: officials can set general availability (days/times) to help admins make assignments.
- [ ] Tests for role permissions, assignment workflows, score submission, and mixed-role scenarios (parent + referee on same account).
- [ ] Milestone checkpoint: update README and admin documentation.

## Milestone 15 — in-app messaging: threads and delivery

> **Depends on:** M8 notification platform, M6 minor accounts
> **Enables:** M16 messaging safety and moderation
> **Out of scope:** moderation tools (M16), minor safety restrictions (M16), message retention policies (M16)

### Goal
Users can send direct messages and participate in team/league group threads, replacing the need for external chat apps.

### Acceptance criteria
- A user can send a DM to another member within the same league.
- Team and league group threads are auto-created and usable.
- Messages deliver in near-real-time with unread counts.

### Work items
- [ ] Conversations schema: support both one-on-one DMs and group threads.
- [ ] Team and league group threads auto-created when teams/leagues are created.
- [ ] DM initiation between members within the same league scope.
- [ ] Real-time or near-real-time message delivery (polling or WebSocket).
- [ ] Unread counts and notification badges.
- [ ] Message composition with basic formatting (text, links).
- [ ] Push notification integration for new messages (via M8 notification platform).
- [ ] Tests for thread creation, message delivery, and unread tracking.
- [ ] Milestone checkpoint: update README and communication documentation.

## Milestone 16 — messaging: safety, moderation, and retention

> **Depends on:** M15 messaging threads, M6 minor accounts
> **Enables:** M17 privacy hardening (messaging data policies)
> **Out of scope:** message encryption, file/media attachments

### Goal
Messaging is safe for organizations with minor participants, with admin controls for moderation and retention.

### Acceptance criteria
- An admin can restrict which users a minor account can message.
- An admin can review flagged messages and mute users.
- Message retention policies are configurable per league.

### Work items
- [ ] Minor safety controls: admins/coaches can restrict who minor accounts can message (e.g., no unsupervised DMs, team threads only, or specific contact lists).
- [ ] Admin moderation tools: ability to review flagged messages, mute users, and set messaging policies per league.
- [ ] Message flagging: users can flag messages for admin review.
- [ ] Message retention and audit logging consistent with existing audit patterns.
- [ ] Configurable retention policies: leagues can set how long messages are kept before auto-archiving.
- [ ] Tests for messaging permissions, minor safety rules, moderation actions, and retention behavior.
- [ ] Milestone checkpoint: update communication and safety documentation.

## Milestone 17 — privacy and compliance hardening

> **Depends on:** M6 minor accounts, M11 medical/waiver data, M15/M16 messaging
> **Enables:** M18 extensibility (privacy-aware extension contracts)
> **Out of scope:** GDPR/COPPA legal certification (requires legal review, not just engineering)

### Goal
Cross-cutting privacy, safety, and data governance review to ensure the app handles minors, medical data, and messaging responsibly.

### Acceptance criteria
- A user can export or delete their account data.
- All access to sensitive data (medical, insurance, waivers) is audit-logged.
- Minor consent and guardian access rules are documented and enforced.
- Permission regression tests cover all sensitive data paths.

### Work items
- [ ] Account data export: users can download all their personal data (profile, memberships, messages, volunteer history).
- [ ] Account deletion flow: users can request account deletion with proper cascade handling (minor guardian reassignment, message anonymization).
- [ ] Consent documentation: document and enforce minor consent rules, guardian access boundaries, and data retention periods.
- [ ] Medical and insurance data audit: verify all access paths are logged and role-gated. Add regression tests.
- [ ] Message data minimization: ensure deleted accounts have messages anonymized, not orphaned.
- [ ] Guardian access boundaries: document what guardians can and can't see/do on behalf of linked minors.
- [ ] Permission regression test suite: comprehensive tests covering all sensitive data paths across the full permission model.
- [ ] Data retention policy documentation: what's kept, how long, and how it's purged.
- [ ] Tests for export, deletion, anonymization, and access control regression.
- [ ] Milestone checkpoint: update SECURITY.md and privacy documentation.

## Milestone 18 — extensibility and ecosystem

> **Depends on:** M6-M17 (core domains stabilized)
> **Enables:** payment integrations, stats modules, tournament brackets, third-party tools
> **Out of scope:** building full payment/stats/bracket products (proof-of-concept only)

### Goal
Make Teamsster easy to extend with optional modules and external integrations, now that the core domains are stable.

### Acceptance criteria
- A developer can build and register an add-on module following documented patterns.
- External clients can consume a versioned API.
- At least one proof-of-concept module (payments or stats) is delivered.

### Work items
- [ ] Extension strategy and package boundaries.
- [ ] Public hooks for integrations.
- [ ] Developer docs for new feature modules.
- [ ] Example advanced modules (payments, stats, brackets) as optional add-ons.
- [ ] API contracts for external consumers and mobile clients.
- [ ] Milestone checkpoint: refresh README and contributor-facing docs for extension points.

### Suggested issue-sized breakdown
- [ ] 18.1 Deployment hardening baseline
  - [ ] Finalize and maintain deployment runbook.
  - [ ] Keep environment matrix current across local/staging/production.
  - [ ] Keep migration/release/rollback steps current with platform changes.
- [ ] 18.2 Extension architecture
  - [ ] Define core-vs-optional package boundaries.
  - [ ] Identify stable extension seams for modules and feature toggles.
  - [ ] Document ownership and compatibility expectations for extension points.
- [ ] 18.3 Integration surface
  - [ ] Introduce domain event hooks for announcements, roster, scheduling, and membership changes.
  - [ ] Document supported lifecycle hooks and payload stability guarantees.
  - [ ] Add tests to protect hook contracts from accidental breakage.
- [ ] 18.4 Developer platform
  - [ ] Publish contributor guide for creating add-on modules.
  - [ ] Provide module templates for validation, permissions, and data access patterns.
  - [ ] Add a reference add-on module skeleton in the monorepo.
- [ ] 18.5 External API contracts
  - [ ] Define versioned external contract surface for web/mobile consumers.
  - [ ] Separate internal-only server actions from public API boundaries.
  - [ ] Document authentication and deprecation policy for external clients.
- [ ] 18.6 Proof modules
  - [ ] Deliver one payments prototype module.
  - [ ] Deliver one stats or tournament/bracket prototype module.
  - [ ] Run checkpoint review to confirm extension architecture supports both.

## Future considerations

The following areas aren't in the current roadmap but may influence schema design or become milestones as the product matures:

- **Divisions, age groups, and competitive levels** for leagues with multiple tiers.
- **Tryouts, evaluations, drafts, and team placement** workflows.
- **Waitlists** for full teams or leagues.
- **Equipment and uniform sizing** tracking and distribution.
- **Field and venue management** with availability calendars and weather-aware scheduling.
- **Weather cancellation workflows** with automated notifications.
- **Tournament and bracket support** (hinted in M18 proof modules).
- **Background check and certification tracking** for coaches and volunteers.
- **Incident and injury reporting** for officials and coaches.

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
