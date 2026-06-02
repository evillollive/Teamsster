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
- [x] Add optional `username` field to user schema (unique, nullable).
- [x] Username/password auth flow alongside existing email/password and magic-link flows.
- [x] Username validation rules (length, allowed characters, uniqueness).
- [x] Account type flag (standard vs. minor) to enable safety guardrails downstream.
- [x] Guardian-minor link table: many-to-many relationship between minor accounts and guardian accounts. A minor must have at least one linked guardian at all times.
- [x] Enforce guardian requirement: minor account creation requires linking to an existing guardian account. Unlinking the last guardian from a minor is blocked.
- [x] Admin/coach ability to create minor accounts on behalf of a player, with guardian linking in the same flow.
- [x] Guardian dashboard: parent/guardian users can see and manage all linked minor accounts from their own profile.
- [x] Email routing for minors: all email notifications (reminders, announcements, digests) for minor accounts are delivered to their linked guardian(s) instead, with clear labeling of which child the email is about.
- [x] Profile settings page works for username-only accounts (no email change section).

#### Security
- [x] Add brute-force protection and per-IP plus per-username rate limiting for username login so repeated guesses can't succeed quietly.
- [x] Enforce guardian-minor link integrity in the database with foreign keys, uniqueness rules, and a guard that won't allow a minor record to exist without at least one guardian.
- [x] Apply stricter authorization for minor profiles, settings, and notification routing so unrelated members can't read or mutate child data.
- [x] Audit-log guardian link creation, relinking, and blocked unlink attempts, and ensure username-only auth tokens don't expose guardian-only actions.

#### Accessibility
- [x] Make the username login flow fully screen-reader friendly with explicit labels, described errors, and status messaging that doesn't rely on color alone.
- [x] Ensure the guardian dashboard supports complete keyboard navigation, visible focus states, and touch targets that won't frustrate mobile caregivers.
- [x] Manage focus correctly after login, account switching, and guardian-link actions so users don't lose their place.

#### Testing
- [x] Unit tests for username validation, password policy checks, guardian-link invariants, and minor email-routing helpers.
- [x] Integration tests for username-only sign-up and sign-in, guardian-linked minor creation, blocked last-guardian removal, and guardian dashboard actions.
- [ ] E2E or Playwright tests for the login journey, guardian account management flow, and minor notification routing behavior.
- [x] Permission regression tests to prove minor account data can't be viewed or edited outside allowed guardian and staff paths.
- [x] Automated accessibility tests for the login flow and guardian dashboard, including keyboard coverage and axe-style assertions.

- [x] Milestone checkpoint: update README and auth documentation.

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
- [x] Define standard relationship types (parent, guardian, grandparent, stepparent, sibling, coach, emergency contact, other).
- [x] Migration to convert existing free-text values to the new structured field.
- [x] "Other" option with custom text entry for edge cases.
- [x] Update player contact forms to use a dropdown with optional custom entry.
- [x] Permission implications: relationship type can influence contact visibility rules.

#### Captain role
- [x] Add CAPTAIN to the membership role enum.
- [x] CAPTAIN is a dependent role: requires PLAYER on the same team. Assigning CAPTAIN without PLAYER is blocked. Removing PLAYER auto-removes CAPTAIN.
- [x] Permission level toggle per captain assignment: full (can message team, view teammate contact info, help coordinate attendance) or restricted (title and roster visibility only, permissions stay close to PLAYER).
- [x] Multiple captains per team with no cap.
- [x] Cross-team independence: a user can be captain on one team and a regular player on another.
- [x] Minor accounts default to restricted when assigned CAPTAIN. Coaches can override.
- [x] Captain badge/indicator on roster views so the role is visible to the team.

#### Security
- [x] Audit-log every relationship type change, custom relationship edit, and captain permission toggle so privilege changes can't happen silently.
- [x] Enforce captain dependency rules in both service and database layers so CAPTAIN can't exist without PLAYER on the same team.
- [x] Harden the captain permission toggle against privilege escalation by validating allowed transitions and actor permissions on every update.

#### Accessibility
- [x] Make the relationship dropdown and custom entry flow screen-reader friendly with clear labels, roles, and help text that doesn't disappear on focus changes.
- [x] Ensure captain assignment controls work from the keyboard, announce permission toggle state changes, and keep focus stable after saves so users don't lose context.
- [x] Validate color contrast and touch target sizing for captain badges, dropdown options, and inline validation states so nobody has to fight the UI.

#### Testing
- [x] Unit tests for relationship normalization, custom relationship validation, captain dependency rules, and restricted-vs-full captain permission resolution.
- [x] Integration tests for free-text migration, relationship form submission, audit logging, and captain assignment updates across multiple teams.
- [ ] E2E or Playwright tests for selecting a structured relationship, entering an "other" value, and toggling captain permissions from roster management.
- [x] Permission regression tests to prove restricted captains don't inherit full captain capabilities and minors default correctly.
- [x] Automated accessibility tests for the relationship selector, custom entry field, and captain management controls.

- [x] Milestone checkpoint: update roster documentation.

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
- [x] Notification event schema: typed event registry (event_reminder, rsvp_change, announcement, message, volunteer_reminder, assignment, registration_deadline, etc.).
- [x] User notification preferences: per-event-type channel selection (email, in-app, push, off). Stored per user with sensible defaults.
- [x] Guardian routing: notifications for minor accounts are dispatched to all linked guardian accounts across all channels.
- [x] In-app notification feed: persistent notification list with read/unread state, accessible from the header.
- [ ] Push notification infrastructure via Capacitor Push Notifications plugin (APNs for iOS, FCM for Android).
- [x] Device token registration and storage linked to user accounts.
- [x] Scheduled delivery for time-based reminders (configurable lead times: 1 hour, 1 day, etc.).
- [x] Badge count management (unread notifications).
- [x] Delivery logging: record every dispatch attempt with channel, status, and timestamp. Ties into existing audit patterns.
- [x] Retry and fallback: if push fails, fall back to email. If email fails, ensure in-app notification still persists.

#### Security
- [x] Store notification and push tokens with encryption or equivalent protected storage so leaked database reads can't expose active device credentials.
- [x] Add rate limiting and abuse detection to push token registration and refresh endpoints so token spam doesn't overwhelm delivery systems.
- [x] Sanitize email subject and body content before delivery so template data can't inject unsafe markup or headers.
- [x] Audit-log sensitive notification preference changes and guardian-routing overrides so delivery behavior won't drift without traceability.

#### Accessibility
- [x] Add an aria-live region to the in-app notification feed so newly delivered items are announced without stealing focus and users don't miss updates.
- [x] Ensure the notification center, read state controls, and preference forms support keyboard navigation and logical focus order so users don't get trapped.
- [x] Respect reduced-motion preferences for badges, toasts, and feed transitions, and keep contrast strong for unread indicators so motion doesn't become a barrier.

#### Testing
- [x] Unit tests for event-to-channel routing, preference filtering, guardian fan-out, token storage helpers, and retry selection logic.
- [ ] Integration tests for secure token registration, delivery logging, sanitized email rendering, and fallback behavior across channels.
- [x] E2E or Playwright tests for reviewing the notification feed, changing preferences, and receiving in-app updates during a live session.
- [x] Permission regression tests to prove notification settings and delivery logs don't leak across users, teams, or guardian boundaries.
- [x] Automated accessibility tests for the notification feed, preferences UI, and live announcement behavior.

- [x] Milestone checkpoint: update README and notification documentation.

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
- [x] Template schema: unified template table with a `type` discriminator (event, registration_form, announcement, volunteer_opportunity) and a JSON `payload` column for type-specific field data.
- [x] League-level templates: templates are scoped to a league and visible to all teams within it.
- [x] Team-level overrides: teams can clone a league template and customize it, or create their own templates from scratch. Team templates are only visible to that team.
- [x] Template CRUD: create, edit, rename, duplicate, and delete templates. Admin/role-gated.
- [x] "Use template" flow: anywhere you create an event, announcement, registration form, or volunteer opportunity, a "Use template" button pre-fills the form from a selected template. The created item is independent of the template after creation (no live link).
- [x] Starter templates: ship built-in defaults per type (e.g., "Weekly Practice", "Game Day", "Tournament" for events; "Rain Cancellation", "Field Change" for announcements; "Standard Season Registration" for forms; "Concession Stand Shift", "Field Setup" for volunteer slots). Leagues can delete or replace these.
- [x] Template management UI: admin page to browse, edit, and organize templates by type. Shows which are league-level vs. team-level.
- [x] Template preview: admins can preview what a template will look like before using it.

#### Security
- [x] Validate and sanitize template JSON payloads on create, update, duplicate, and use-template actions so injected fields can't reach downstream forms.
- [x] Enforce role-based access control on every template CRUD path, including league-to-team cloning, so template management doesn't bypass admin scopes.
- [x] Audit-log template creation, edits, deletions, and template application events so high-impact content changes are traceable.

#### Accessibility
- [x] Make the template management UI, preview states, and use-template chooser fully keyboard operable with predictable focus movement so admins don't need a mouse.
- [x] Provide screen-reader labels and contextual help for template type, scope, and preview content so admins don't lose meaning in dense forms.
- [x] Ensure preview dialogs and empty states meet contrast requirements and respect reduced-motion preferences so low-vision users don't lose cues.

#### Testing
- [x] Unit tests for payload validation, template sanitization, scope resolution, and starter-template seeding rules.
- [ ] Integration tests for template CRUD, clone and override behavior, audit logging, and role-based permission enforcement.
- [ ] E2E or Playwright tests for creating a template, previewing it, and using it to prefill a downstream form or event.
- [x] Permission regression tests to prove non-admin roles can't manage templates or consume team-only overrides outside their scope.
- [x] Automated accessibility tests for template lists, preview dialogs, and the use-template flow.

- [x] Milestone checkpoint: update README and admin documentation.

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
- [x] Season schema: leagues can define seasons (name, year, registration open/close dates, active status) so rosters and forms are scoped to a time period.
- [x] Registration form builder: admins can configure which fields are required per season (player info, guardian contacts, emergency contacts, address, custom fields).
- [x] Self-service registration flow: parents/guardians fill out the form for their player(s), review, and submit. Returning families see pre-filled data from the previous season.
- [x] Multi-child registration: guardians can register multiple linked minors in one flow.
- [x] Season-based roster management: when a new season opens, rosters start fresh. Players from the previous season can re-register but aren't auto-carried over.
- [x] Registration status dashboard: admins see who's registered, who's incomplete, and who's missing required fields.
- [x] Email/push notifications for registration deadlines and incomplete submissions (via M8 notification platform).

#### Security
- [x] Sanitize and validate every registration field, especially PII and custom field input, so malformed or hostile data doesn't persist.
- [x] Enforce season-level authorization and CSRF-safe submission patterns so only permitted admins can publish forms and families can't submit forged changes.
- [x] Add submission rate limiting and duplicate-request protection so registration flows won't create accidental duplicate records.

#### Accessibility
- [x] Treat the multi-step registration flow as a first-class accessible wizard with progress indication, keyboard support, and headings that screen readers can follow so families don't have to guess progress.
- [x] Move focus to the step title or first invalid field after each transition so families don't get stranded during multi-child registration.
- [x] Present validation errors, required state, and save progress messaging in ways that don't rely on color and work on mobile touch targets.

#### Testing
- [x] Unit tests for registration field validation, season state rules, multi-child form state management, and prefill merge behavior.
- [ ] Integration tests for season creation, configurable form publishing, family submissions, incomplete-state recovery, and deadline reminders.
- [ ] E2E or Playwright tests for single-child and multi-child registration journeys, including resume and review steps.
- [x] Permission regression tests to prove only allowed admins can configure forms and only linked guardians can submit or edit minor registrations.
- [x] Automated accessibility tests for the registration wizard, progress UI, validation messaging, and submission confirmation screens.

- [x] Milestone checkpoint: update README and admin documentation.

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
- [x] Insurance information fields: carrier, policy number, group number, insured name. Stored securely with role-gated visibility (admin/coach only).
- [x] Medical/allergy notes field: free-text for conditions coaches need to know about, with appropriate visibility controls.
- [x] Digital waiver signatures: click-through liability/participation agreements with timestamp, IP, and signer identity recorded. Waiver text is configurable per league.
- [x] Waiver storage and retrieval: admins can view and export signed waivers for compliance.
- [x] Payment integration hook: registration form includes a "payment" step placeholder that can link to an external processor (Stripe, PayPal, etc.) in a future milestone. For now, admins can mark payment as received/pending/comped/scholarship manually.
- [x] Payment status visibility on registration dashboard (ties into M10 dashboard).
- [x] Audit logging for all access to medical and insurance data.

#### Security
- [x] Encrypt medical and insurance fields at rest and keep decryption tightly scoped so raw sensitive values can't be read outside approved service paths.
- [x] Store waiver signatures with tamper-evident metadata, immutable revision references, and signer context so legal records won't be silently altered.
- [x] Audit-log every read, export, and update of medical, insurance, waiver, and payment-status fields with actor and target context.
- [x] Re-validate role-gated visibility on every access path, including exports, so sensitive registration data can't leak through convenience tooling.

#### Accessibility
- [x] Make the waiver review and signature flow fully accessible from keyboard and screen readers so users with disabilities aren't blocked from completing legal steps.
- [x] Use clear headings, readable summary text, and focus management for waiver confirmation, payment placeholder, and sensitive field disclosures so users don't lose context.
- [x] Ensure error messaging, required acknowledgements, and signature confirmation states meet contrast and touch target expectations so nobody has to hunt for next steps.

#### Testing
- [x] Unit tests for field encryption helpers, waiver integrity metadata, access control guards, and payment-status visibility rules.
- [ ] Integration tests for waiver capture, sensitive field storage and retrieval, audit logging, admin export paths, and manual payment updates.
- [ ] E2E or Playwright tests for completing registration with waiver signing, reviewing stored records, and exporting signed waivers as an admin.
- [x] Permission regression tests to prove coaches, admins, guardians, and unrelated users only see the sensitive fields they're allowed to access.
- [x] Automated accessibility tests for the waiver flow, signature step, sensitive-field review UI, and export controls.

- [x] Milestone checkpoint: update README and admin documentation.

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
- [x] Subscribable iCal feed URLs for team and league calendars (read-only `.ics` endpoint that Apple Calendar, Google Calendar, Outlook, etc. can poll).
- [x] Per-team and per-league feed URLs with token-based authentication (no login required to subscribe, but URL is unique per user to respect privacy).
- [x] Feed includes all events the user has access to, with RSVP status embedded as attendee metadata.
- [x] Auto-updates: external calendars pick up new/changed/cancelled events on their next sync cycle.
- [x] UI for copying the subscription URL from team and league settings pages.

#### Security
- [x] Generate feed tokens with cryptographically secure randomness, store only what the app needs, and support revocation and rotation so feed URLs can't be guessed or reused forever.
- [x] Add rate limiting and abuse monitoring on calendar feed endpoints so scraping or token guessing doesn't become an easy denial-of-service path.
- [x] Audit-log feed issuance, revocation, and copy actions so privacy-sensitive subscription links won't change hands without traceability.

#### Accessibility
- [x] Make the subscription URL copy flow keyboard friendly and announce copy success or failure with screen-reader feedback so users don't wonder whether it worked.
- [x] Provide accessible helper text that explains how read-only feeds work, how to revoke them, and what data each URL exposes so people don't have to infer privacy rules.
- [x] Keep copy buttons, token management controls, and settings layouts compliant with contrast and touch target guidance.

#### Testing
- [x] Unit tests for token generation, hashing or storage helpers, revocation logic, and feed visibility filtering.
- [ ] Integration tests for authenticated feed generation, revoked-token failures, rate limiting, and event update propagation.
- [ ] E2E or Playwright tests for copying a subscription URL, revoking it, and confirming the regenerated feed still works.
- [x] Permission regression tests to prove feeds only include events the requesting user is allowed to see.
- [x] Automated accessibility tests for the copy flow, subscription settings UI, and success feedback states.

- [x] Milestone checkpoint: update scheduling documentation.

## Milestone 13 — volunteer tracking

> **Depends on:** M8 notification platform, M9 templates (opportunity templates), M10 seasons (seasonal volunteer needs)
> **Enables:** M14 officials (availability pattern reuse)
> **Out of scope:** background check tracking (future consideration)

### Goal
Leagues can post volunteer opportunities, volunteers can sign up, and admins can track hours and export reports. Standing organizational roles (Travel Coordinator, Social Coordinator, etc.) can be defined, assigned, and displayed in team and league directories.

### Acceptance criteria
- A volunteer can sign up for an open slot and see their own hours.
- An admin can see all volunteer activity across the league and export it as CSV.
- Hours are auto-calculated from slot times with optional manual entry.
- Admins can define standing volunteer roles at team or league scope with custom labels.
- Assigned volunteer roles (name, title, contact info) are visible to all team/league members in a directory view.

### Work items

#### Event-based volunteer opportunities
- [x] Volunteer opportunity schema (title, description, date/time, location, slots available, associated event/team/league).
- [x] Signup flow: volunteers can claim open slots from a list of opportunities.
- [x] Check-in and hours tracking: auto-calculated from slot times, with optional manual hour entry for off-app work.
- [x] Volunteer dashboard for users to see their own signups and logged hours.
- [x] Admin volunteer management view: see all volunteers, hours, and signups across the league.
- [x] Spreadsheet export (CSV) of volunteer hours and signups, admin-only, filterable by date range, team, and volunteer.
- [x] Notifications for upcoming volunteer slots (opt-in, via M8 notification platform).

#### Standing volunteer roles
- [x] Volunteer role definition schema: title (text), description (optional), scope (team or league), and a `scopeId` FK to the team or league. Admins can create, rename, and archive role definitions.
- [x] Starter role list shipped by default: Travel Coordinator, Social Coordinator, Communications Manager, Fundraising Chair, Equipment Manager, Team Parent, Snack Coordinator. Leagues can delete or rename these and add custom ones.
- [x] Role assignment: admins assign one or more users to a volunteer role. Multiple holders per role are supported (e.g., two Snack Coordinators). A user can hold multiple roles.
- [x] Directory view: team and league pages display a "Volunteer roles" section showing each active role, the assigned holder(s), and their contact info (name, email, phone). Visible to all members of the team/league.
- [x] Volunteer role integration: link volunteer role assignments to existing membership and role system so permission checks work naturally.
- [x] Season lifecycle: volunteer role assignments can optionally carry over to the next season or be cleared at season boundary.

#### Security
- [x] Sanitize CSV export values to prevent formula injection so exported volunteer reports can't execute when opened in spreadsheet tools.
- [x] Validate manual hour edits, check-in updates, and opportunity capacity changes so volunteers or admins can't tamper with totals unnoticed.
- [x] Enforce admin-only export access and audit-log hour overrides, bulk edits, and report downloads so sensitive volunteer history stays accountable.
- [x] Restrict volunteer role definition creation, renaming, and assignment to league/team admins. Audit-log all role assignment changes.
- [x] Contact info shown in the volunteer directory must respect existing field-level permission rules (e.g., don't expose phone numbers to non-members).

#### Accessibility
- [x] Ensure volunteer signup lists, dashboard summaries, and export controls are keyboard operable and announced clearly to screen readers so volunteers don't miss key actions.
- [x] Use accessible status messaging for claimed slots, wait states, and check-in confirmation so volunteers don't rely on visual cues alone.
- [x] Keep mobile signup actions and filters large enough for touch use and compliant with contrast guidance so volunteers don't mistap critical actions.
- [x] Make the volunteer role directory section keyboard navigable with clear heading hierarchy and role-holder grouping.

#### Testing
- [x] Unit tests for slot availability rules, hour calculations, manual override validation, and CSV export sanitization.
- [ ] Integration tests for volunteer signup, check-in, dashboard aggregation, admin reporting, and protected export endpoints.
- [x] Unit tests for volunteer role definition CRUD, assignment logic, multi-holder constraints, and starter role seeding.
- [ ] Integration tests for directory view rendering with assigned roles, contact info visibility, and season carryover/clear behavior.
- [ ] E2E or Playwright tests for claiming a slot, reviewing logged hours, and exporting filtered volunteer reports as an admin.
- [x] Permission regression tests to prove volunteers can see only their own hours while admins can manage league-wide reporting.
- [x] Automated accessibility tests for the signup flow, dashboard, filters, export UI, and volunteer role directory.

- [x] Milestone checkpoint: update README and admin documentation.

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
- [x] Add REFEREE role to the membership role enum. Refs are league-scoped members, not team-scoped.
- [x] Official profiles: external officials can be invited to the system with a lightweight account, or existing users (e.g., a parent) can receive the REFEREE role alongside their other roles.
- [x] Game assignment schema: link officials to specific events/games with assignment status (pending, confirmed, declined).
- [x] Assignment workflow: league admins assign officials to games. Officials receive a notification and can confirm or decline.
- [x] Official assignment calendar: refs see a personal view of their upcoming assignments with game details, venue, and team info.
- [x] Permission scoping for officials: read access to game schedules, team rosters (player names, jersey numbers, eligibility), venue details, and coach contact info. No access to parent contacts, insurance/medical data, or team internal communications.
- [x] Score logging: officials can submit game scores after a game. Scores are visible to league admins and can be published to teams.
- [x] Admin assignment dashboard: league admins see all games, who's assigned, confirmation status, and gaps that need filling.
- [x] Availability preferences: officials can set general availability (days/times) to help admins make assignments.

#### Security
- [x] Validate score submissions, assignment state changes, and availability updates so malformed or tampered game data doesn't persist.
- [x] Audit-log official assignments, confirmations, declines, score edits, and score publication so competitive outcomes won't change without traceability.
- [x] Enforce permission boundaries on assignment notifications and official data views so referee tools can't expose parent contacts or restricted records.

#### Accessibility
- [x] Make the assignment calendar, confirm or decline actions, and score entry forms work fully from the keyboard with stable focus behavior so officials don't lose their place.
- [x] Provide screen-reader labels and status announcements for assignment changes, schedule filters, and score submission outcomes so officials don't miss updates.
- [x] Ensure score-entry controls, availability toggles, and calendar affordances meet contrast and touch target guidance.

#### Testing
- [x] Unit tests for score validation, assignment transitions, official availability rules, and referee permission resolution.
- [ ] Integration tests for assignment notifications, confirm or decline flows, audit logging, score publishing, and mixed-role account behavior.
- [ ] E2E or Playwright tests for accepting an assignment, viewing the personal official calendar, and submitting a post-game score.
- [x] Permission regression tests to prove officials only receive the roster, venue, and contact data they're explicitly allowed to access.
- [x] Automated accessibility tests for the assignment calendar, response actions, and score-entry experience.

- [x] Milestone checkpoint: update README and admin documentation.

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
- [x] Conversations schema: support both one-on-one DMs and group threads.
- [x] Team and league group threads auto-created when teams/leagues are created.
- [x] DM initiation between members within the same league scope.
- [x] Real-time or near-real-time message delivery (polling or WebSocket).
- [x] Unread counts and notification badges.
- [x] Message composition with basic formatting (text, links).
- [x] Push notification integration for new messages (via M8 notification platform).

#### Security
- [x] Sanitize message content, link previews, and rendered formatting so thread views can't become an XSS delivery surface.
- [x] Require authenticated WebSocket or real-time connections with secure token handling and reconnect checks so stale sessions don't keep receiving messages.
- [x] Enforce thread membership and same-league permission boundaries on every send, read, and notification path so messages won't leak across scopes.
- [x] Add rate limiting for message send bursts and thread creation so abuse doesn't degrade delivery or notification systems.

#### Accessibility
- [x] Make the chat interface keyboard navigable, including thread switching, composer actions, and unread-jump controls so users don't depend on pointer-only actions.
- [x] Announce new messages with aria-live without yanking focus away from the active composer or message list.
- [x] Support reduced motion for incoming-message effects and keep message status, timestamps, and unread indicators readable with strong contrast so animation doesn't block comprehension.

#### Testing
- [x] Unit tests for message sanitization, formatting helpers, unread-count logic, and real-time auth token lifecycle helpers.
- [ ] Integration tests for thread creation, secure real-time delivery, membership enforcement, notification fan-out, and message persistence.
- [ ] E2E or Playwright tests for sending a DM, participating in a group thread, and seeing unread counts update across sessions.
- [x] Permission regression tests to prove users can't open or post into threads outside their league or membership scope.
- [x] Automated accessibility tests for thread lists, message announcements, composer controls, and keyboard navigation paths.

- [x] Milestone checkpoint: update README and communication documentation.

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
- [x] Minor safety controls: admins/coaches can restrict who minor accounts can message (e.g., no unsupervised DMs, team threads only, or specific contact lists).
- [x] Admin moderation tools: ability to review flagged messages, mute users, and set messaging policies per league.
- [x] Message flagging: users can flag messages for admin review.
- [x] Message retention and audit logging consistent with existing audit patterns.
- [x] Configurable retention policies: leagues can set how long messages are kept before auto-archiving.

#### Security
- [x] Audit-log moderation actions, policy changes, message review decisions, and retention updates so safety enforcement won't happen without an accountable trail.
- [x] Rate limit message flagging and moderation-trigger endpoints so abuse reports can't be spammed into uselessness.
- [x] Validate every minor messaging restriction against actor, target, and thread context so policy gaps don't allow unsafe contact paths.
- [x] Enforce moderator permission checks on review, mute, and policy controls so safety tooling can't become its own escalation vector.

#### Accessibility
- [x] Make moderation queues, review drawers, and mute dialogs fully keyboard accessible with clear focus management so moderators don't lose the active item.
- [x] Provide screen-reader labels and live status updates for flag counts, policy changes, and review outcomes.
- [x] Keep warning states, muted indicators, and retention settings understandable without color dependence and usable on mobile touch targets.

#### Testing
- [x] Unit tests for flagging thresholds, minor messaging rule evaluation, mute duration logic, and retention policy calculations.
- [ ] Integration tests for abuse-rate limiting, moderation review flows, audit logging, and league policy enforcement.
- [ ] E2E or Playwright tests for flagging a message, reviewing it as an admin, muting a user, and exercising minor restriction scenarios.
- [x] Permission regression tests to prove minor safety rules and moderator tools behave correctly across guardians, coaches, admins, and peers.
- [x] Automated accessibility tests for moderation dashboards, review forms, and policy-management controls.

- [x] Milestone checkpoint: update communication and safety documentation.

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
- [x] Account data export: users can download all their personal data (profile, memberships, messages, volunteer history).
- [x] Account deletion flow: users can request account deletion with proper cascade handling (minor guardian reassignment, message anonymization).
- [x] Consent documentation: document and enforce minor consent rules, guardian access boundaries, and data retention periods.
- [x] Medical and insurance data audit: verify all access paths are logged and role-gated. Add regression tests.
- [x] Message data minimization: ensure deleted accounts have messages anonymized, not orphaned.
- [x] Guardian access boundaries: document what guardians can and can't see/do on behalf of linked minors.
- [x] Permission regression test suite: comprehensive tests covering all sensitive data paths across the full permission model.
- [x] Data retention policy documentation: what's kept, how long, and how it's purged.

#### Security
- [x] Make account deletion thorough across primary records, linked minors, messages, exports, and audit references so personal data doesn't linger unintentionally.
- [x] Sanitize exported data so generated files can't inject formulas, unsafe markup, or hidden fields the requester shouldn't receive.
- [x] Verify guardian-boundary rules, sensitive-field logging, and purge or anonymization jobs across all privacy-sensitive domains so compliance work won't stop at the happy path.
- [x] Add explicit operational checklists for deletion failures, retry handling, and support escalations so privacy incidents can't be hand-waved.

#### Accessibility
- [x] Make export and deletion flows keyboard friendly, screen-reader understandable, and clear about irreversible actions so users don't trigger high-stakes actions blindly.
- [x] Manage focus carefully through confirmation dialogs, progress states, and success or failure messaging so users don't lose context during high-stakes actions.
- [x] Ensure privacy notices, consent explanations, and retention summaries meet contrast and readability expectations.

#### Testing
- [x] Unit tests for export serializers, deletion planners, anonymization helpers, and consent-boundary evaluators.
- [ ] Integration tests for account export, account deletion, guardian reassignment, message anonymization, and sensitive-audit verification.
- [ ] E2E or Playwright tests for requesting an export, completing account deletion, and verifying post-delete user experience.
- [x] Permission regression tests to prove sensitive data exports and guardian access paths stay within documented boundaries.
- [x] Automated accessibility tests for export requests, deletion confirmations, privacy notices, and completion states.

- [x] Milestone checkpoint: update SECURITY.md and privacy documentation.

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
- [x] Extension strategy and package boundaries.
- [x] Public hooks for integrations.
- [x] Developer docs for new feature modules.
- [x] Example advanced modules (payments, stats, brackets) as optional add-ons.
- [x] API contracts for external consumers and mobile clients.

#### Security
- [x] Require authentication, rate limiting, and strict input validation on public API contracts so extension consumers can't bypass core safeguards.
- [x] Ensure extension hooks run through centralized permission checks and typed contracts so add-ons won't escalate privileges or read hidden data.
- [x] Define secure token handling, secret rotation expectations, and audit logging for external integrations so ecosystem access stays accountable.
- [x] Add threat-model reviews for proof modules and extension examples so convenience scaffolds don't normalize unsafe patterns.

#### Accessibility
- [x] Publish developer docs and extension guides with accessible structure, link text, code samples, and heading hierarchy so extension authors don't miss critical guidance.
- [x] Ensure example add-on UIs, config panels, and integration setup flows are keyboard operable and screen-reader understandable so add-on authors don't copy inaccessible patterns.
- [x] Document accessibility expectations for third-party modules so extension authors don't treat inclusive UX as optional.

#### Testing
- [x] Unit tests for public contract validators, hook registration guards, permission wrappers, and auth token validation helpers.
- [ ] Integration tests for authenticated API access, rate limiting, extension hook execution, and proof-module permission boundaries.
- [ ] E2E or Playwright tests for a sample add-on setup flow and a representative external-client API journey.
- [x] Permission regression tests to prove extension points and public APIs can't bypass league, team, field, or minor-data restrictions.
- [x] Automated accessibility tests for developer docs examples, extension setup screens, and sample module interfaces.

- [x] Milestone checkpoint: refresh README and contributor-facing docs for extension points.

### Suggested issue-sized breakdown
- [x] 18.1 Deployment hardening baseline
  - [x] Finalize and maintain deployment runbook.
  - [x] Keep environment matrix current across local/staging/production.
  - [x] Keep migration/release/rollback steps current with platform changes.
- [x] 18.2 Extension architecture
  - [x] Define core-vs-optional package boundaries.
  - [x] Identify stable extension seams for modules and feature toggles.
  - [x] Document ownership and compatibility expectations for extension points.
- [x] 18.3 Integration surface
  - [x] Introduce domain event hooks for announcements, roster, scheduling, and membership changes.
  - [x] Document supported lifecycle hooks and payload stability guarantees.
  - [x] Add tests to protect hook contracts from accidental breakage.
- [x] 18.4 Developer platform
  - [x] Publish contributor guide for creating add-on modules.
  - [x] Provide module templates for validation, permissions, and data access patterns.
  - [x] Add a reference add-on module skeleton in the monorepo.
- [x] 18.5 External API contracts
  - [x] Define versioned external contract surface for web/mobile consumers.
  - [x] Separate internal-only server actions from public API boundaries.
  - [x] Document authentication and deprecation policy for external clients.
- [x] 18.6 Proof modules
  - [x] Deliver one payments prototype module.
  - [x] Deliver one stats or tournament/bracket prototype module.
  - [x] Run checkpoint review to confirm extension architecture supports both.

## Future considerations

The following areas aren't in the current roadmap but may influence schema design or become milestones as the product matures:

- **Tryouts, evaluations, drafts, and team placement** workflows.
- **Waitlists** for full teams or leagues.
- **Equipment and uniform sizing** tracking and distribution.
- **Background check and certification tracking** for coaches and volunteers.

---

# Phase 2 — Product depth

## Milestone 19 — divisions, age groups, and competitive levels

> **Depends on:** M3 roster, M10 seasons
> **Enables:** M21 tournament brackets (division-scoped brackets), M22 field scheduling (division-aware)

### Goal
Leagues with multiple tiers can organize teams by division, age group, and competitive level so scheduling, standings, and registration are scoped appropriately.

### Acceptance criteria
- An admin can create divisions within a league (e.g., U10, U12, U14).
- Teams are assigned to a division. A team belongs to exactly one division per season.
- Standings, schedules, and registration forms are filterable by division.
- Division metadata (age range, competitive level) is visible on league and team pages.

### Work items
- [x] Division schema: name, age range (min/max birth year), competitive level (recreational, competitive, elite), league-scoped.
- [x] Team-division assignment: many-to-one per season, with migration support for existing teams.
- [x] Division-aware standings: stats module filters by division.
- [x] Division-aware scheduling: events can be scoped to a division.
- [x] Division management UI: admin page to create, edit, reorder, and archive divisions.
- [x] Registration form integration: division selection during registration.

#### Security
- [x] Enforce admin-only division management. Audit-log all division changes.
- [x] Validate division assignments (team can't be in a division from a different league).

#### Accessibility
- [x] Division selector is keyboard operable with clear labels.
- [x] Division filter on standings/schedule pages is screen-reader friendly.

#### Testing
- [x] Unit tests for division validation, assignment rules, and filter logic.
- [x] Permission regression tests for division management.

- [x] Milestone checkpoint: update README and admin documentation.

## Milestone 20 — tournament and bracket support

> **Depends on:** M4 scheduling, M14 officials, M19 divisions
> **Enables:** cross-league tournament hosting

### Goal
Leagues can run single-elimination, double-elimination, or round-robin tournaments with auto-generated brackets and score-driven advancement.

### Acceptance criteria
- An admin can create a tournament with a bracket format and seed teams.
- Scores advance teams through the bracket automatically.
- Bracket visualization shows current state, completed matches, and upcoming games.
- Officials can be assigned to tournament games.

### Work items
- [x] Tournament schema: name, format (single_elim, double_elim, round_robin, pool_play), league/division scope, seeding order.
- [x] Bracket generation: auto-create matches from seeded team list based on format.
- [x] Score-driven advancement: when a match score is published, the winner advances to the next round automatically.
- [x] Bracket visualization component: interactive bracket display showing matchups, scores, and progression.
- [x] Tournament management UI: admin page to create tournaments, seed teams, manage schedule.
- [x] Official assignment integration: assign refs to tournament games using M14 patterns.
- [x] Pool play support: round-robin groups with crossover brackets.

#### Security
- [x] Validate bracket integrity (teams can't be injected into wrong slots). Audit-log seeding and advancement.

#### Accessibility
- [x] Bracket visualization is keyboard navigable with screen-reader announcements for match results.

#### Testing
- [x] Unit tests for bracket generation, advancement logic, seeding validation.
- [x] Storybook stories for bracket visualization component.

- [x] Milestone checkpoint: update README.

## Milestone 21 — field and venue management

> **Depends on:** M4 scheduling, M19 divisions
> **Enables:** weather-aware scheduling, facility booking

### Goal
Leagues can manage fields and venues with availability calendars so scheduling avoids conflicts and weather cancellations are streamlined.

### Acceptance criteria
- An admin can create venues with fields, addresses, and availability windows.
- Scheduling shows field conflicts and suggests available slots.
- Weather cancellation can be triggered from a venue, cascading to all affected events.

### Work items
- [x] Venue and field schema: name, address, capacity, surface type, amenities, availability windows.
- [x] Field availability calendar: admin sets recurring availability per field (days/times). Scheduling respects these windows.
- [x] Conflict detection: warn when scheduling an event on a field that's already booked.
- [x] Venue management UI: admin page to create/edit venues, manage fields, set availability.
- [x] Weather cancellation flow: cancel all events at a venue for a date range, with automatic M8 notifications to affected teams.
- [x] Map integration placeholder: venue address displayed with link to external maps.

#### Security
- [x] Enforce admin-only venue management. Audit-log all venue and cancellation changes.

#### Accessibility
- [x] Availability calendar is keyboard navigable. Cancellation confirmation is clearly announced.

#### Testing
- [x] Unit tests for conflict detection, availability window validation, cancellation cascade.
- [x] Storybook stories for venue management and availability calendar.

- [x] Milestone checkpoint: update README.

## Milestone 22 — incident and injury reporting

> **Depends on:** M14 officials, M11 medical data
> **Enables:** compliance reporting, insurance claims

### Goal
Coaches and officials can file incident and injury reports during or after games, with proper access controls and export capabilities for compliance.

### Work items
- [x] Incident report schema: type (injury, conduct, facility), severity, narrative, involved parties, event/game reference.
- [x] Report filing UI: coaches and officials can submit reports from the event page.
- [x] Role-gated visibility: reports visible to league admins and involved parties only. Medical details follow M11 encryption patterns.
- [x] Export for compliance: admin can export incident reports as PDF or CSV for insurance/league review.
- [x] Notification integration: alert league admins when a report is filed.

#### Security
- [x] Encrypt sensitive narrative content. Audit-log all report access. Role-gate exports.

#### Testing
- [x] Unit tests for report validation, visibility rules, export sanitization.

- [x] Milestone checkpoint: update SECURITY.md and README.

## Current execution focus

Most milestone-level feature depth from Milestones 0 through 22 is now in place. The next public phase should focus on productization and proof, not broadening feature surface area.

Priority order for the next execution window:

1. Milestone 26, onboarding polish and first-run clarity
2. Milestone 24, deployment and infrastructure readiness
3. Milestone 25, authenticated E2E and visual proof
4. Milestone 28, demo and marketing packaging
5. Milestone 23, mobile shell and native push completion
6. Payments strategy and public-facing website features, using the extension and league-public-surface work already mapped elsewhere

When roadmap tradeoffs come up, bias toward:

- faster time to first success for a new league admin
- public trust signals, such as staging, demos, monitoring, and believable test coverage
- visible UX polish in core journeys, especially onboarding, dashboards, scheduling, notifications, and registration
- competitive differentiation around minors, permissions, privacy, and volunteer-run governance

The supporting planning artifacts for this phase live in `COMPETITIVE_ANALYSIS.md`, `EXECUTION_PLAN_90_DAYS.md`, and `MARKETING_FEATURE_MATRIX.md`.

## Milestone 23 — mobile app shell via Capacitor

> **Depends on:** M8 push notifications (designed for Capacitor)
> **Enables:** native push notifications, offline support

### Goal
Wrap the Next.js web app in a Capacitor shell for iOS and Android, enabling native push notifications and app store distribution.

### Work items
- [ ] Capacitor project setup: iOS and Android targets wrapping the web app.
- [ ] Push notification wiring: connect APNs (iOS) and FCM (Android) to the M8 device token system.
- [ ] App icon, splash screen, and native navigation shell.
- [ ] Build and signing pipeline for TestFlight/Play Store internal testing.
- [ ] Offline-aware UI: graceful degradation when network is unavailable.

- [ ] Milestone checkpoint: update README with mobile build instructions.

---

# Phase 3 — Operational readiness

## Milestone 24 — deployment and infrastructure

### Work items
- [ ] Deploy to Vercel (web) + Neon (Postgres) with environment configuration.
- [ ] Error monitoring with Sentry or equivalent.
- [ ] Uptime monitoring and health check endpoints.
- [ ] Database backup strategy and disaster recovery plan.
- [ ] Rate limiting at the infrastructure level (Vercel Edge, Cloudflare).
- [ ] Staging environment with seed data for QA.

## Milestone 25 — authenticated E2E test suite

### Work items
- [ ] Test user seeding script for CI (admin, coach, parent, minor accounts).
- [ ] Playwright tests for full auth flows (sign up, sign in, onboard).
- [ ] Playwright tests for roster management with relationship dropdown.
- [ ] Playwright tests for registration wizard (single and multi-child).
- [ ] Playwright tests for notification preferences and feed.
- [ ] Visual regression testing with Playwright screenshots.

## Milestone 26 — onboarding polish and user feedback

### Work items
- [ ] First-run onboarding wizard with guided league/team setup.
- [ ] Contextual help tooltips on complex forms.
- [ ] In-app feedback widget (simple form, not a full support system).
- [ ] Empty state illustrations and CTAs across all pages.
- [ ] Performance audit and Core Web Vitals optimization.

---

# Phase 4 — Community growth

## Milestone 27 — contributor experience

### Work items
- [x] CONTRIBUTING.md with setup instructions, code standards, and PR process.
- [ ] "Good first issue" label strategy with starter tasks.
- [ ] Development environment setup script (one-command local dev).
- [ ] Architecture decision records (ADRs) for key design choices.

## Milestone 28 — demo and marketing

### Work items
- [ ] Public demo instance with sample data (read-only or time-limited).
- [ ] Landing page / marketing site explaining features and target audience.
- [ ] Feature comparison matrix vs. existing league management tools.
- [ ] Social media presence and community channels (Discord/GitHub Discussions).

## Milestone 29 — plugin marketplace

### Work items
- [ ] Plugin registry UI: browse, install, and configure extension modules.
- [ ] Plugin sandboxing: extensions run with scoped permissions and can't access raw DB.
- [ ] Plugin developer portal with documentation, examples, and submission process.
- [ ] First-party plugin examples: advanced stats, photo galleries, fundraising tracker.

## Continuous best practices

- Every form and API payload must be validated and sanitized with shared Zod schemas before persistence.
- Every permission decision must go through centralized helpers, and new sensitive fields can't ship without explicit read and write rules.
- Every milestone should add audit logging for sensitive mutations, rate limiting for abuse-prone endpoints, and secure token or secret handling where applicable.
- Every new UI flow should ship with keyboard navigation, visible focus states, screen-reader labels, contrast checks, and reduced-motion support where motion is introduced.
- Every critical journey should include layered tests: focused unit coverage, integration coverage for cross-system behavior, and E2E or Playwright coverage for the highest-risk user paths.
- Every milestone should add permission regression coverage and automated accessibility checks for the new screens and workflows it introduces.
- Keep CI green with lint, typecheck, unit tests, integration tests, build, and E2E coverage where appropriate.
- No direct database access from UI components, and prefer small composable server-side modules over route-specific duplication.
- Review and update the README, SECURITY.md, and contributor-facing docs at milestone checkpoints when capabilities, setup, architecture, or safety expectations change.
- Validation, permission integrity, accessibility, and observability aren't optional for volunteer-organization, role, contact, messaging, and registration features.
