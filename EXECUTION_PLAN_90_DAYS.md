# Teamsster 90 day execution plan

## Purpose

This plan converts the competitive analysis into execution priorities for the next 90 days. It assumes Teamsster already has broad product depth and now needs productization, proof, and a clearer go-to-market story.

## Outcome targets for day 90

By the end of this window, Teamsster should feel demonstrably real to a new evaluator.

That means:

- a new user can get from sign-up to first useful league setup quickly
- the project has a working staging and production baseline
- core user journeys have believable automated proof
- a public demo and marketing surface explain the product clearly
- mobile packaging is moving from concept to usable internal beta
- the roadmap tells a focused story about polishing and proving the platform

## Guiding principles

- Prioritize first-run success over adding broad new feature surface area.
- Keep security, accessibility, observability, and testing inside each workstream, not as cleanup.
- Favor proof-rich work over speculative work.
- Use the existing product depth as leverage. Don't rebuild what the platform already has.
- Keep open-core positioning intact while clarifying where paid or optional extensions may fit later.

## Priority order

1. Onboarding polish and first-run clarity
2. Deployment, staging, and production readiness
3. Authenticated E2E and integration proof
4. Public demo, marketing site, and comparison messaging
5. Mobile shell and native push completion
6. Payments strategy and outward-facing website features

## Workstreams

### Workstream A, onboarding and UX polish

#### Goals

- Reduce time to first success for league admins
- Make the core route structure feel coherent to coaches, guardians, and volunteers
- Improve the product's perceived completeness without inventing major new domains

#### Deliverables

- First-run onboarding wizard for account to league to team setup
- Role-aware quick starts for admin, coach, parent, and guardian
- Strong empty states with recommended next actions
- Contextual help on complex forms
- Refined home and dashboard copy so the app presents as usable now, not just carefully scaffolded

#### Security, accessibility, and testing

- Keep all new onboarding mutations behind existing validation and permission helpers
- Add keyboard and screen-reader coverage for the guided flows
- Add Playwright coverage for first-run onboarding and the main empty-state to first-action journey

### Workstream B, operational readiness

#### Goals

- Make the repo deployable, monitorable, and demoable
- Replace theoretical readiness with visible operational confidence

#### Deliverables

- Staging environment with realistic seed data
- Production baseline deployment
- Health checks and uptime monitoring
- Error monitoring wiring
- Backup and disaster recovery checklist
- Infrastructure-level rate limiting plan

#### Security, accessibility, and testing

- Validate secrets handling and environment separation before publishing environments
- Keep staging seeded with realistic but non-sensitive data only
- Add deployment verification checks to release workflow documentation

### Workstream C, proof and quality

#### Goals

- Prove the most important flows actually work end to end
- Close the credibility gap between roadmap breadth and evaluator trust

#### Deliverables

- CI seed data for admin, coach, parent, guardian, and minor accounts
- Playwright coverage for sign-up, sign-in, onboarding, roster management, registration, and notifications
- Visual regression coverage for high-value pages
- Additional integration coverage for cross-domain workflows that are marked complete in the roadmap but still thin on proof

#### Security, accessibility, and testing

- Include permission assertions in end-to-end scenarios, not just happy-path outcomes
- Run automated accessibility checks in core flows
- Add regression coverage for guardian boundaries, notification routing, and sensitive registration data visibility

### Workstream D, public product packaging

#### Goals

- Help evaluators understand what Teamsster is, why it matters, and where it beats incumbents
- Turn internal strengths into externally legible product proof

#### Deliverables

- Marketing site or landing page
- Public demo instance with sample data
- Screenshots and workflow narratives
- Feature comparison matrix based on competitor positioning
- Positioning page for minors, privacy, safety, and league governance

#### Security, accessibility, and testing

- Ensure public demo uses scrubbed sample data and clear data-boundary messaging
- Keep public marketing pages accessible and performant
- Add smoke checks for demo and landing routes

### Workstream E, mobile completion

#### Goals

- Move mobile from implied compatibility to real distribution readiness
- Close a major expectation gap with mobile-first competitors

#### Deliverables

- Capacitor iOS and Android targets
- APNs and FCM wiring into existing notification infrastructure
- Offline-aware read behavior for common flows
- Internal beta packaging and install instructions

#### Security, accessibility, and testing

- Validate device token lifecycle and push routing carefully for minors and guardians
- Test key touch interactions, reduced motion behavior, and offline states
- Add mobile smoke coverage where practical

### Workstream F, monetization and public presence strategy

#### Goals

- Clarify how Teamsster becomes sustainable without undermining the open core
- Close high-visibility market gaps deliberately instead of reactively

#### Deliverables

- Decision memo on payments strategy: first-party, extension-first, or third-party integration only
- One credible next-step scope for payments proof if chosen
- Plan for public league pages, schedules, and branding basics
- Prioritized list of outward-facing features, such as public schedules, announcements, sponsors, and fundraising surfaces

#### Security, accessibility, and testing

- Treat payment and fundraising decisions as trust-critical architecture decisions
- Keep public website features role-aware and privacy-aware from the start
- Add acceptance criteria before implementation begins

## 30, 60, 90 day breakdown

## Days 1 to 30

### Main objective

Make first-run success and operational setup feel real.

### Must-ship items

- roadmap framing update
- onboarding UX specification and implementation start
- staging environment plan and deployment baseline start
- demo seed data model
- Playwright user seeding strategy
- marketing-site information architecture

### Suggested tickets

- onboarding wizard shell
- dashboard empty-state refresh
- seeded demo league data
- staging environment setup
- health check endpoint
- test account fixture generator
- landing page copy outline

## Days 31 to 60

### Main objective

Ship proof, not just plans.

### Must-ship items

- first-run onboarding flow in product
- staging running with seeded sample data
- first wave of authenticated E2E coverage
- public marketing surface live in draft or staging form
- comparison matrix adapted into website copy

### Suggested tickets

- onboarding completion and polish
- auth and onboarding Playwright suite
- roster and registration Playwright suite
- screenshots and product walkthrough copy
- comparison page draft
- monitoring and error capture setup

## Days 61 to 90

### Main objective

Turn the platform into something that can be shown, tested, and trusted repeatedly.

### Must-ship items

- public demo availability
- core journey regression coverage in CI
- production deployment baseline complete
- mobile shell internal beta progress
- decision on payments path

### Suggested tickets

- demo launch checklist
- visual regression pass
- production environment hardening
- internal mobile beta setup
- payments strategy memo
- public schedule and branding MVP plan

## Ready-to-open issue backlog

Use these as the first issue-sized backlog for the current execution window. They are ordered so Teamsster gets more convincing faster, with onboarding, proof, and public readiness leading the queue.

### Required on every ticket

Every implementation ticket in this backlog should explicitly carry these expectations in its definition of done:

- **Security and privacy review**: preserve permission boundaries, avoid exposing sensitive data, and document any new trust assumptions.
- **Accessibility review**: include keyboard support, screen-reader labeling, focus behavior, and reduced-motion or mobile considerations where relevant.
- **Targeted validation**: run the smallest relevant existing checks before merge, such as unit tests, Playwright coverage, Storybook checks, typecheck, or lint, depending on the surface touched.
- **Docs and roadmap updates**: update README, deployment docs, or roadmap notes whenever behavior, setup, or public claims change.
- **Push-to-main verification**: after merge or direct push to `main`, check the triggered GitHub Actions runs, confirm they pass, and treat follow-up fixes as part of the ticket until `main` is healthy again.
- **Evidence capture**: attach screenshots, recordings, logs, or test output to the issue or PR so product, accessibility, and quality claims are backed by proof.

### 1. First-run onboarding entrypoint and route map

**Why now**
- New evaluators still hit a broad surface area instead of a guided first success path.
- The current home page and account flow hint at onboarding, but they don't yet create a clear sequence.

**Scope**
- Define the canonical first-run route order from sign-in to account setup to league creation to first team setup.
- Decide which existing pages stay in the flow and which pages need a dedicated onboarding wrapper.
- Capture route-level success states, guardrails, and redirect behavior for invited users versus self-serve admins.

**Grounding in repo**
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/sign-in/page.tsx`
- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/league/page.tsx`
- `apps/web/src/app/league/new/page.tsx`
- `apps/web/src/app/league/[leagueId]/page.tsx`
- `apps/web/src/app/invite/[token]/page.tsx`
- `apps/web/src/lib/account.ts`

**Current route observations**
- The home page still routes people toward broad browsing and a generic account page instead of a single first-run path.
- Successful sign-in currently pushes users to `/account`.
- The account page already contains onboarding controls and documents that a Personal League is auto-created unless an invitation token is used.
- `/league/new` creates a league and redirects directly to `/league/[leagueId]`.
- `/league/[leagueId]` already has a useful empty-state CTA for creating the first team.
- Invitation acceptance lives at `/invite/[token]`, and unauthenticated acceptance currently redirects to `/account`, which should be treated as a flow decision to tighten during implementation.

**Canonical route map for the issue**

Self-serve admin flow:
1. `/` or marketing entry point
2. `/sign-in`
3. Successful sign-in redirects into a dedicated onboarding shell at `/account` (or `/account?flow=onboarding` if query-state is preferred)
4. Onboarding completion routes to `/league/new`
5. Successful league creation redirects to `/league/[leagueId]`
6. Primary empty-state CTA routes to `/league/[leagueId]/team/new`
7. First team creation routes to `/league/[leagueId]/team/[teamId]`
8. Follow-up checklist links the admin to roster, schedule, and invitation tasks

Invited adult flow:
1. `/invite/[token]`
2. If signed out, route through sign-in while preserving the invitation token and intended destination
3. After sign-in, return to `/invite/[token]`
4. Accept invitation and redirect to the invited league or team destination
5. If lightweight profile completion is still needed, complete it without creating a Personal League

Minor or username-only account flow:
1. `/sign-in` with username path
2. Redirect to `/account`
3. Show restricted profile and guardian-aware messaging only
4. Do not expose self-serve league creation or admin onboarding CTAs unless role and age rules explicitly allow it

**First-run success definition**
- A new self-serve adult admin can sign in, confirm basic profile details, create a league, create a first team, and clearly see the next three recommended setup tasks without needing to guess which page comes next.

**Guardrails and decisions to capture in the issue**
- Invitation-token flows must preserve destination context across auth, not dump users into a dead-end generic page.
- Personal League auto-provisioning must stay skipped when an invitation token is present.
- Minor-account and guardian-managed flows must remain separate from self-serve admin onboarding.
- Redirects should prefer one canonical next step at each stage, not multiple equally weighted CTAs.
- Empty states must act as progression steps, not placeholders.
- Any new onboarding wrapper should reuse existing server actions and validation paths rather than fork business logic.

**Ticket-specific validation and ship requirements**
- Update the issue body with the route map, redirect rules, invite-path behavior, and first-run success definition.
- Include a simple state table or diagram covering signed-out, signed-in self-serve, invited, and minor-account branches.
- Add accessibility notes for focus order, heading structure, and screen-reader comprehension across the planned flow.
- Document which existing tests should expand when implementation starts, especially auth and onboarding Playwright coverage.
- When the implementation ticket for this route map eventually ships, it must be pushed to `main`, the triggered Actions runs must be checked, and any failures must be treated as part of the same delivery.

**Acceptance criteria**
- A written route map exists in the issue body.
- The issue names the first-run success definition for a new admin.
- The issue documents how invitation-token flows differ from self-serve onboarding.
- The issue documents how minor-account flows are intentionally excluded from the self-serve admin path.
- The issue lists the post-push verification expectation for the future implementation PR.

### 2. Guided onboarding shell for signed-in admins

**Why now**
- The account page already exposes onboarding controls, but it still reads like a power-user utility instead of a productized first-run experience.
- The existing onboarding logic is solid enough to reuse, but the presentation doesn't yet give new admins a clear sense of progress, completion, or what happens next.

**Scope**
- Add a dedicated onboarding shell that frames account setup as a guided experience.
- Reuse existing onboarding actions and validation instead of inventing parallel logic.
- Add progress copy, next-step messaging, and clear continuation into league creation.
- Separate onboarding from long-term account settings so first-run users aren't dropped into a dense general-purpose settings page.

**Grounding in repo**
- `apps/web/src/app/account/page.tsx`
- `packages/db/src/user-onboarding.ts`
- `apps/web/src/lib/account.ts`
- `apps/web/src/app/sign-in/page.tsx`
- `apps/web/src/app/league/new/page.tsx`

**Current UX observations**
- The account page combines onboarding, settings, password change, and account deletion in one place.
- The onboarding section currently reads like an admin utility: display name, timezone, optional invitation token, age confirmation, and a generic `Run onboarding` CTA.
- The underlying server path already does the right foundational work: it validates input, provisions the user profile, and creates a Personal League only when no invitation token is present.
- Minor accounts are already split out correctly and should stay on a restricted profile path.

**Shell definition for the issue**
- Introduce a first-run onboarding container for eligible signed-in adult admins.
- Present onboarding as a short sequence, not a loose form block.
- Frame the sequence around three user-facing outcomes:
  1. confirm identity and display name
  2. confirm timezone and basic account readiness
  3. continue into league creation or invited-destination flow
- Keep advanced account settings, notification preferences, password changes, and destructive actions outside the first-run shell.

**Recommended screen structure**
1. Header with clear title, short reassurance copy, and step indicator
2. Lightweight explanation of what Teamsster will do next
3. Focused onboarding form using the existing fields already required by server logic
4. Inline explanation of when a Personal League will or won't be created
5. Primary CTA that clearly states the next step, not just `Run onboarding`
6. Secondary path for invited users when an invitation token is present
7. Completion state that routes users directly into league creation or the invited destination

**Flow rules to document in the issue**
- A newly signed-in self-serve adult should land in the onboarding shell before broad settings UI.
- If the user is on an invitation flow, the shell should preserve that context and explain that Personal League creation will be skipped.
- Minor accounts must not see the admin onboarding shell.
- Returning users with an already provisioned account should not be forced through the shell again unless they explicitly re-enter onboarding.
- The primary CTA should be phrased around the next destination, such as continuing to create a league, not around internal implementation language.

**Content and UX requirements**
- Replace operator-style wording like `Run onboarding` with user-facing language.
- Add copy that makes the first success legible: what will be created, what won't, and what comes next.
- Keep the shell visually simpler than the full account settings view.
- Make progress obvious without turning the flow into a long wizard.
- Preserve the existing age-confirmation and guardian-safety messaging where relevant.

**Accessibility and safety requirements**
- Step structure, headings, and instructions must read clearly in screen readers.
- Focus should move predictably after sign-in and after submission errors.
- The shell must remain fully keyboard operable.
- Any explanatory UI must not rely on hover alone.
- Minor-account restrictions and invitation behavior must remain explicit so users aren't confused into unsafe or unauthorized paths.

**Implementation boundaries to capture in the issue**
- Reuse `runOnboardingForAuthenticatedUser` and existing account validation.
- Do not fork onboarding business rules into a separate form handler unless a technical limitation forces it.
- Keep notification preferences, password changes, and delete-account actions out of the first-run shell scope.
- If account state detection is needed, derive it from existing settings or provisioning state rather than inventing a parallel source of truth without a clear reason.

**Ticket-specific validation and ship requirements**
- Document the intended entry conditions, exit conditions, and re-entry behavior in the issue body.
- Identify the smallest existing checks to run when implementation starts, likely targeted Playwright auth/onboarding coverage plus any touched unit or type checks.
- Include screenshots or mockups showing the shell state and the post-completion handoff.
- Update roadmap or onboarding docs if the user-visible flow changes.
- When the implementation ticket ships, it must be pushed to `main`, the triggered GitHub Actions runs must be checked, and follow-up fixes must be treated as part of the same delivery until `main` is green.

**Acceptance criteria**
- Signed-in admins see a guided onboarding container instead of only raw controls.
- Minor accounts keep their current restricted experience.
- Keyboard flow and screen-reader labels are covered in the issue requirements.
- The issue defines what content stays inside the shell versus the full settings page.
- The issue defines how invited users and returning users bypass or re-enter the shell.

### 3. League creation follow-through and team-setup handoff

**Why now**
- Creating a league is straightforward, but the next action after redirect still needs to feel intentionally guided.
- The current redirect lands on a real dashboard, but new admins still have to infer the first setup sequence for teams, members, and events.

**Scope**
- Improve the post-create handoff from `/league/new` into the newly created league.
- Add a visible next-step checklist for team creation, roster setup, and schedule setup.
- Make the empty league state feel like progress, not a dead end.
- Clarify which actions belong immediately after league creation versus later operational setup.

**Grounding in repo**
- `apps/web/src/app/league/new/page.tsx`
- `apps/web/src/app/league/[leagueId]/page.tsx`
- `apps/web/src/app/league/[leagueId]/team/new/page.tsx`
- `apps/web/src/lib/league`
- `apps/web/src/lib/team`

**Current UX observations**
- `/league/new` is intentionally simple: name, timezone, submit, redirect.
- The redirected league dashboard already has useful building blocks: a `New team` CTA, member summary, audit entrypoint, and league event agenda.
- The first empty state is helpful but still narrow. It tells the admin to add a team, but it doesn't frame the broader first-run setup path.
- The team creation page is also simple and grounded, but the overall journey doesn't yet celebrate progress or explain what to do after the first team exists.

**Issue definition**
- Turn the first post-create visit into a guided handoff, not just a raw dashboard load.
- Define a lightweight setup checklist that appears for eligible admins when a league is newly created or still mostly empty.
- Sequence the checklist around the first league-operating outcomes:
  1. create the first team
  2. add or invite the first staff members
  3. open roster or schedule setup
- Keep the checklist lightweight and dismissible so the league dashboard still works as an everyday workspace.

**Recommended handoff structure**
1. Confirmation treatment after league creation that reassures the admin the league was created successfully
2. A top-of-page setup panel with clear next steps and progress state
3. Primary CTA to create the first team
4. Secondary CTA to manage member invitations from settings
5. Follow-up CTA to open events once a team exists
6. Optional progress copy that explains why rosters and schedules are blocked until a team exists

**Flow rules to capture in the issue**
- A brand-new league with zero teams should show the setup handoff at the top of the dashboard.
- The first primary action should stay `Create team` or equivalent user-facing language.
- Once at least one team exists, the guidance should shift from creation to roster and schedule setup.
- Returning league owners should not get stuck in a permanent onboarding banner once the league is clearly active.
- Non-owner or lower-permission members should see role-appropriate guidance, not admin setup copy they can't act on.

**Content requirements**
- Copy should explicitly name the first-success path: create league, create team, invite staff, start scheduling.
- The members card and events card should reinforce the setup sequence instead of reading like unrelated dashboard fragments.
- Empty-state messaging should feel optimistic and operational, not like a placeholder.
- Any progress or checklist wording should stay short enough for mobile layout without collapsing into vague labels.

**Accessibility and trust requirements**
- Checklist or progress UI must use real headings, lists, and buttons so screen readers can understand the sequence.
- The first post-create screen must have an obvious keyboard path from success state to the primary CTA.
- Any role-aware content must not expose admin-only actions to users without permission.
- Success messaging must not rely on color alone.

**Implementation boundaries to capture in the issue**
- Reuse the existing redirect into `/league/[leagueId]` unless a tighter route change is clearly justified.
- Prefer composition inside the existing dashboard cards and layout before inventing an entirely separate setup page.
- Keep team creation and member management on their existing routes for the first iteration.
- Do not expand scope into roster editing or event creation flows in this ticket, only the handoff into them.

**Ticket-specific validation and ship requirements**
- Include mocked or real screenshots of the zero-team dashboard before and after the new handoff treatment.
- Identify the smallest existing checks to run when implementation starts, likely targeted component or route tests plus the relevant Playwright navigation flow.
- Update the roadmap or onboarding docs if the first league setup sequence changes materially.
- When this ticket ships, push to `main`, confirm the triggered GitHub Actions runs finish green, and treat follow-up fixes as part of the same delivery.

**Acceptance criteria**
- New league creation lands on a page with explicit next actions.
- The first empty-state CTA points to the next meaningful setup step.
- Copy is role-aware for league owners and admins.
- The issue defines when the setup panel appears, progresses, and disappears.
- The issue keeps the existing route flow but clarifies the user-facing sequence after league creation.

### 4. Empty-state refresh across league, team, roster, and events

**Why now**
- Empty states are one of the fastest ways to improve perceived completeness without inventing new domains.
- Teamsster already has working empty-state copy in several places, but the tone, CTA quality, and setup guidance are still inconsistent across surfaces.

**Scope**
- Audit existing empty states on league, team, roster, events, and notifications pages.
- Replace generic blanks with action-oriented guidance and primary CTAs.
- Keep copy consistent with the new product positioning.
- Define a reusable empty-state pattern so future pages don't drift back into one-off placeholder copy.

**Grounding in repo**
- `apps/web/src/app/league/page.tsx`
- `apps/web/src/app/league/[leagueId]/page.tsx`
- `apps/web/src/app/roster/page.tsx`
- `apps/web/src/app/events/page.tsx`
- `apps/web/src/app/notifications/page.tsx`

**Current UX observations**
- `/league` already has a strong create-league empty state with a clear CTA.
- `/league/[leagueId]` has a decent team-empty state, but the surrounding cards don't yet reinforce the broader setup sequence.
- `/roster` tells users there are no players or no teams, but it doesn't provide a direct next action from the aggregate roster view.
- `/events` has a helpful no-events message, but it sits inside a dense workspace where the path forward could be clearer.
- `/notifications` distinguishes guest and signed-in states, but the empty feed state is mostly informational rather than action-oriented.

**Issue definition**
- Create a shared empty-state content and layout pattern for first-run and no-data conditions.
- Standardize the core ingredients on audited pages:
  1. clear statement of current state
  2. short explanation of why the page is empty
  3. one primary CTA
  4. optional secondary CTA or supporting link
  5. role-aware fallback copy when the viewer can't take the action
- Keep the pattern flexible enough for cards, page-level states, and embedded workspace panels.

**Pages the issue should explicitly cover first**
- League list with zero leagues
- League dashboard with zero teams
- Aggregate roster view with zero players or zero teams
- Events workspace with zero events
- Notification feed with zero items

**Content requirements**
- Copy should sound like an intentional product moment, not a temporary placeholder.
- CTA labels should use destination language such as `Create a team`, `Open events`, or `Edit notification settings`.
- Empty states should reflect role and auth context, especially where guests, members, and admins see different next actions.
- Messaging should stay aligned with the broader positioning shift toward trustworthy league operations.

**Accessibility and design requirements**
- Empty states must preserve heading hierarchy and predictable tab order.
- Icons or illustrations are optional, but meaning can't depend on them.
- If a CTA is the only actionable element, it should be reachable immediately after the state description.
- Embedded empty states inside cards must remain readable on narrow screens.

**Implementation boundaries to capture in the issue**
- Prefer a reusable component or shared pattern only if it actually simplifies the first audited pages.
- Do not expand scope into creating brand-new workflows. This ticket is about clarity, framing, and actionability.
- Keep copy changes evidence-based and grounded in the current route architecture.

**Ticket-specific validation and ship requirements**
- Capture before-and-after screenshots for every page touched.
- Include Storybook coverage if a shared empty-state component or variant is introduced.
- Identify the smallest existing checks to run when implementation starts, likely targeted route/component tests and any affected visual snapshots.
- Push to `main`, review the triggered GitHub Actions runs, and keep follow-up polish in scope until `main` is green.

**Acceptance criteria**
- Each audited page has a clear empty-state message plus at least one primary CTA.
- Empty states don't block keyboard navigation or screen-reader comprehension.
- The issue includes before-and-after screenshots or Storybook references.
- The issue names the first audited pages and the shared pattern they should follow.
- Role-aware and guest-aware empty-state behavior is documented.

### 5. Contextual help pattern for complex forms

**Why now**
- Form depth is a strength, but some screens need lightweight guidance so they feel safer and easier to use.
- The current `FormField` component already supports label, description, and error states, which gives this work a clean starting point instead of requiring a new form system.

**Scope**
- Define a reusable contextual-help pattern for complex forms.
- Start with league setup, roster management, and registration-related forms.
- Prefer inline help and progressive disclosure over noisy tooltip spam.
- Document where short descriptions are enough versus where expandable help or examples are justified.

**Grounding in repo**
- `apps/web/src/components/form-field.tsx`
- `apps/web/src/components/stories/FormField.stories.tsx`
- `apps/web/src/app/league/new/page.tsx`
- `apps/web/src/app/league/[leagueId]/team/new/page.tsx`
- `apps/web/src/app/events/page.tsx`
- `apps/web/src/lib/registration.ts`

**Current UX observations**
- `FormField` currently gives us description and error affordances, but no standardized richer help treatment.
- Simple forms like league and team creation are fine today, though field descriptions could be more user-facing.
- The events workspace already exposes recurrence, timezone, and scheduling controls that will benefit from clearer guidance.
- Registration configuration and guardian-related workflows are exactly the kind of trust-sensitive forms where users need reassurance and examples.

**Issue definition**
- Choose a contextual-help pattern family for Teamsster forms.
- Define three levels of help so the product stays consistent:
  1. always-visible inline description for simple clarification
  2. expandable help for nuanced or risky fields
  3. example-driven helper content for advanced workflows such as recurrence or registration setup
- Document which form families should adopt the pattern first and why.

**Recommended first adoption targets**
- League creation timezone guidance
- Team creation timezone inheritance and naming guidance
- Event recurrence and timing fields
- Registration form configuration and custom-field setup
- Any guardian or minor-sensitive forms where the safety implications need plain-language explanation

**Accessibility requirements**
- Help content must be reachable and understandable without hover.
- Expandable help controls need clear button semantics, labels, and state announcements.
- Helper text and error text must coexist cleanly in `aria-describedby` relationships.
- The pattern must remain readable in mobile layouts and with large text sizes.

**Content requirements**
- Help copy should explain why a field matters, not just restate the label.
- Examples should be realistic and brief.
- Safety-sensitive guidance should avoid sounding punitive or overly technical.
- The issue should explicitly discourage tooltip-only help for important concepts.

**Implementation boundaries to capture in the issue**
- Extend the existing form-field system if possible rather than introducing an unrelated component stack.
- Keep the first ticket focused on the pattern and the first few adoption points, not every form in the app.
- Storybook should be the source of truth for shared help variants if the shared component changes.

**Ticket-specific validation and ship requirements**
- Include Storybook states for every new shared help variant.
- Add screenshots or clips from at least one simple form and one advanced form using the new pattern.
- Identify the smallest existing checks to run when implementation starts, likely Storybook-related validation, targeted component tests, and touched route tests.
- Push to `main`, review the triggered GitHub Actions runs, and keep any accessibility fixups within the same delivery.

**Acceptance criteria**
- The issue chooses a reusable help pattern and documents where it should appear first.
- Accessibility requirements cover focus order, hover independence, and screen-reader text.
- Storybook coverage is included if shared components change.
- The issue defines at least three help levels and the first forms that should adopt them.
- The issue explicitly keeps important guidance inline or expandable, not hover-only.

### 6. In-app feedback capture for onboarding friction

**Why now**
- Onboarding polish will move faster if evaluators can report where they get stuck.
- Today we have basic observability flags and console-based error capture, but no structured product-feedback path tied to onboarding moments.

**Scope**
- Add a lightweight in-app feedback widget or form for onboarding and setup pages.
- Keep the first version simple, structured, and low-risk.
- Decide where submissions go before implementation starts.
- Capture enough context to make the feedback actionable without collecting sensitive setup data.

**Grounding in repo**
- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/league/[leagueId]/page.tsx`
- `apps/web/src/lib/observability.ts`
- `apps/web/src/app/sign-in/page.tsx`

**Current UX observations**
- The onboarding and setup surfaces are where first-run friction is most likely, but there is currently no direct way for evaluators to report confusion from inside the app.
- Existing observability is environment-flag based and error-oriented, not product-feedback oriented.
- The most useful feedback will likely come from a few specific moments: sign-in, onboarding, first league creation, and first team setup.

**Issue definition**
- Define a low-friction in-app feedback pattern for setup journeys.
- Keep the first version structured rather than fully freeform so triage is easier.
- Require the issue to choose and document:
  1. trigger location and visual treatment
  2. minimum feedback fields
  3. submission destination
  4. privacy and retention rules
  5. reviewer ownership for incoming reports

**Recommended first feedback model**
- A compact, non-blocking entrypoint such as `Something confusing? Tell us.` on onboarding and setup pages.
- Structured fields like:
  - page or flow step
  - what the user was trying to do
  - severity or blocker level
  - optional notes
- Automatic context limited to route, auth state category, and maybe league/team identifiers when safe and necessary.
- Explicit exclusion of raw form payloads, passwords, invitation secrets, and sensitive guardian or minor data.

**Submission-handling requirements**
- The issue must choose a first destination before implementation, for example database table, inbox artifact, email digest, or another internal-only sink.
- Failed submissions should degrade safely and never block the main onboarding action.
- Users should get a brief confirmation that feedback was received.
- If the first version sends notifications internally, rate limits and abuse handling need to be documented.

**Privacy and safety requirements**
- No secret tokens, passwords, invitation tokens, or full freeform dumps of surrounding form state.
- Avoid capturing data that could reveal a minor's identity or sensitive registration details unless the issue defines a narrowly justified and protected path.
- The issue should define retention expectations and who can review submissions.
- If analytics tooling is involved later, the first ticket should still default to least-privilege collection.

**Implementation boundaries to capture in the issue**
- Keep the first version focused on onboarding and setup surfaces only.
- Do not expand scope into a site-wide feedback system, NPS program, or customer-support inbox.
- Reuse existing app layout patterns where possible rather than introducing a heavy widget framework.

**Ticket-specific validation and ship requirements**
- Include mockups or screenshots of the entrypoint and submission confirmation state.
- Identify the smallest existing checks to run when implementation starts, likely targeted route tests plus any touched server action or persistence tests.
- Update docs if the feedback destination or privacy policy needs to be explained.
- Push to `main`, verify the triggered GitHub Actions runs, and keep post-push fixes in scope until `main` is green.

**Acceptance criteria**
- The issue defines fields, submission handling, and privacy expectations.
- Feedback collection is available without interrupting the main setup flow.
- Sensitive data handling is explicitly constrained.
- The issue names the first surfaces where feedback appears and who reviews submissions.
- The issue defines what context is captured automatically and what is intentionally excluded.

### 7. Demo and CI seed data model

**Why now**
- Both public proof and automated proof depend on realistic, non-sensitive seeded accounts and league data.
- The schema already supports rich roles, guardian relationships, events, notifications, and more, but the repo does not yet define a durable seeded story that powers both demos and authenticated E2E.

**Scope**
- Define seed fixtures for admin, coach, parent, guardian, and minor scenarios.
- Separate public demo fixtures from CI test fixtures where needed.
- Make sure seeded data covers at least one realistic league setup journey.
- Define reset and determinism expectations so seeded environments stay stable.

**Grounding in repo**
- `packages/db/src/schema.ts`
- `packages/db/src/user-onboarding.ts`
- `apps/web/tests/e2e/auth.spec.ts`
- `apps/web/tests/e2e/roster.spec.ts`
- `apps/web/src/lib/guardian.ts`
- `apps/web/src/lib/registration.ts`

**Current observations**
- Current Playwright coverage is mostly unauthenticated smoke coverage, which strongly suggests the lack of seeded authenticated users and setup data.
- The schema and domain layer can already model the personas we need: owners, admins, coaches, guardians, minors, notifications, registrations, and recurring events.
- Public demo needs and CI needs overlap, but they are not identical. Demo data needs polish and safety, CI data needs determinism and resetability.

**Issue definition**
- Define a shared seed-data strategy with explicit boundaries between public-demo fixtures and CI fixtures.
- Require the issue to name:
  1. persona set
  2. canonical league and team relationships
  3. seeded flow states
  4. reset mechanism
  5. storage location for fixture generation code

**Required seeded personas for the issue**
- self-serve league owner/admin
- invited adult staff member
- coach with limited but realistic permissions
- guardian account
- minor account linked to a guardian
- at least one player profile tied into roster and registration flows

**Required seeded states**
- a brand-new account ready for onboarding proof
- a newly created league with minimal setup completed
- a team with players on the roster
- a season or registration-ready example
- at least one scheduled event with RSVP data
- at least one notification feed example

**Boundary rules to document**
- Demo fixtures must be privacy-safe, visually polished, and free of real personal or medical data.
- CI fixtures must be deterministic, resettable, and concise enough for fast automated setup.
- Public demo data should avoid admin secrets, invitation leakage, and any content that implies a real child or family.
- If demo and CI share core factories, the issue should define how they diverge safely.

**Recommended implementation direction to capture in the issue**
- Put shared fixture generation close to the domain or DB layer, not only inside Playwright tests.
- Give fixtures stable identifiers or lookup names so tests don't rely on brittle discovery.
- Document how onboarding-created entities and pre-seeded entities coexist.
- Include a cleanup or reset strategy for local, CI, and staging environments.

**Ticket-specific validation and ship requirements**
- Include a fixture inventory table in the issue body.
- Add notes about which future E2E suites consume which fixtures.
- Identify the smallest existing checks to run when implementation starts, likely DB-layer tests, targeted Playwright usage, and touched type checks.
- Update docs or runbooks if fixture setup becomes part of local or CI workflows.
- Push to `main`, verify the triggered GitHub Actions runs, and keep follow-up data-shape fixes within the same delivery.

**Acceptance criteria**
- The issue lists required personas and data relationships.
- Demo-safe and CI-safe data boundaries are documented.
- The issue identifies where fixture generation should live.
- The issue documents seeded states, reset expectations, and deterministic identifiers.
- The issue distinguishes which fixtures exist for public demo, CI, staging, or shared use.

### 8. Auth and onboarding Playwright journey

**Why now**
- The repo already has E2E coverage, but the key trust gap is proof around first-run success.
- Current auth tests verify rendering and navigation basics, not whether a real user can complete the first-run path successfully.

**Scope**
- Add a Playwright journey for sign-in, onboarding, and first league setup.
- Include assertions that the correct next-step UI appears after each milestone.
- Add automated accessibility checks in the flow.
- Tie the journey to seeded data instead of brittle, ad hoc setup.

**Grounding in repo**
- `apps/web/tests/e2e/auth.spec.ts`
- `apps/web/tests/e2e/navigation.spec.ts`
- `apps/web/playwright.config.ts`
- `apps/web/src/app/sign-in/page.tsx`
- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/league/new/page.tsx`
- `apps/web/src/app/league/[leagueId]/page.tsx`

**Current observations**
- `auth.spec.ts` currently checks that the homepage and sign-in page render and that tab choices exist.
- `navigation.spec.ts` covers broad route smoke rather than authenticated first-run behavior.
- Playwright is already configured and wired into the repo, so the missing piece is journey depth, not tool adoption.

**Issue definition**
- Define the first trusted Playwright journey for a new or newly provisioned adult account.
- Require the issue to specify:
  1. seeded user state
  2. auth entry method
  3. expected route sequence
  4. key UI assertions after each step
  5. cleanup or reset behavior

**Required journey outline**
1. open the sign-in page
2. authenticate as the seeded first-run user
3. land in the onboarding shell or current onboarding surface
4. complete onboarding with valid inputs
5. confirm the handoff into league creation or league dashboard
6. create the first league if that remains part of the first-run path
7. verify the next-step guidance appears afterward

**Assertion requirements**
- Assert route transitions and visible headings, not just HTTP success.
- Assert the correct CTA or setup panel appears after onboarding.
- Assert at least one error or validation behavior if the flow meaningfully depends on it.
- Avoid overly brittle selectors that are likely to churn during polish work.

**Accessibility requirements**
- Include at least one automated accessibility assertion pass in the journey.
- If an approved accessibility helper is needed, the issue must call that out explicitly before implementation.
- At minimum, the issue should require focus-visible or semantic assertions around the main onboarding transition.
- The a11y check should target a real first-run state, not only a static page load.

**Implementation boundaries to capture in the issue**
- Reuse seeded data from ticket 7 rather than creating test-local one-off fixtures.
- Keep the first journey focused on the main adult admin path.
- Invite flows and minor flows can be follow-up suites unless they are needed to stabilize the core path.
- Do not expand this ticket into broad visual regression or every auth method in one pass.

**Ticket-specific validation and ship requirements**
- Document the exact seeded account and setup state in the issue body.
- Record the intended runtime environment for the test, local, CI, or both.
- Identify the smallest existing checks to run when implementation starts, likely the targeted Playwright spec plus touched type or helper tests.
- Update roadmap or testing docs if this becomes a headline proof journey.
- Push to `main`, verify the triggered GitHub Actions runs, and keep follow-up flake fixes in scope until `main` is green.

**Acceptance criteria**
- The flow covers sign-in to onboarding to league creation.
- The test includes at least one accessibility assertion pass.
- The issue identifies required seeded users and cleanup strategy.
- The issue names the exact route sequence and key post-step assertions.
- The issue explicitly keeps the first proof journey focused on the main adult admin path.

### 9. Roster and registration proof suite

**Why now**
- Teamsster's depth matters most when it proves league-to-family workflows, not just authentication.

**Scope**
- Expand Playwright coverage for roster management and registration journeys.
- Include permission-sensitive assertions, especially for guardians and minor-related flows.
- Cover at least one realistic admin-to-family handoff.

**Grounding in repo**
- `apps/web/tests/e2e/roster.spec.ts`
- `apps/web/src/lib/registration.ts`
- `apps/web/src/lib/guardian.ts`

**Acceptance criteria**
- Tests cover a seeded admin and at least one family scenario.
- Permission assertions are part of the suite, not only happy-path rendering.
- The issue calls out sensitive-data visibility boundaries.

### 10. Staging environment baseline and health checks

**Why now**
- Product trust still depends too much on reading the repo instead of seeing a live system.

**Scope**
- Define the first staging environment target and the minimum services it needs.
- Add health-check expectations and a deployment verification checklist.
- Decide which seeded data belongs in staging.

**Grounding in repo**
- `DEPLOYMENT.md`
- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`
- `apps/web/src/lib/env.ts`

**Acceptance criteria**
- The issue names the initial staging topology.
- Health-check responsibilities and ownership are documented.
- Secrets, environment separation, and non-sensitive data rules are explicit.

### 11. Landing page refresh and comparison-page copy

**Why now**
- The home page still undersells the platform relative to what the repo already supports.

**Scope**
- Refresh the landing page so it presents Teamsster as a trustworthy league operating system.
- Adapt the competitive matrix into a website-ready comparison page structure.
- Keep claims aligned with demonstrable product proof.

**Grounding in repo**
- `apps/web/src/app/page.tsx`
- `MARKETING_FEATURE_MATRIX.md`
- `COMPETITIVE_ANALYSIS.md`

**Acceptance criteria**
- Updated page copy reflects league governance, minors, privacy, and trust strengths.
- The issue lists claims that still require proof before launch.
- Accessibility and performance requirements are included in the definition of done.

### 12. Public demo packaging checklist

**Why now**
- A demo is one of the fastest ways to close the gap between roadmap depth and perceived readiness.

**Scope**
- Define the first public demo format, data rules, and walkthrough path.
- Identify which routes and personas the demo must support.
- Add a checklist for screenshots, smoke checks, and privacy review.

**Grounding in repo**
- `EXECUTION_PLAN_90_DAYS.md`
- `MARKETING_FEATURE_MATRIX.md`
- `apps/web/src/app/page.tsx`

**Acceptance criteria**
- The issue defines the demo scope, route list, and supported personas.
- Sample data rules are explicit and privacy-safe.
- A smoke-test list exists for demo-critical routes.

## Exit criteria

Treat the 90-day effort as successful if all of these are true:

- a new admin can create a league and team quickly without confusion
- the project has a reliable demo path
- the repo has staged and production-ready deployment guidance with monitoring basics
- critical end-to-end journeys run in CI with seeded users
- the public story explains why Teamsster is a stronger trust and governance choice than lighter competitors
- the next post-90-day priorities are clearly narrowed, not expanding in every direction

## Risks to manage

- spending too long on strategy docs without shipping proof
- adding marketing promises that product UX doesn't yet support
- over-investing in plugin-marketplace ideas before the core platform feels finished
- pushing mobile packaging before web onboarding and deployment basics are credible
- letting accessibility or permission checks slip because work is framed as polish

## Recommended owner mindset

For the next 90 days, think like a productization team, not a feature-expansion team.

The question is no longer, "What else can Teamsster do?"

It is, "How quickly can a real league understand it, trust it, try it, and believe it will hold up?"
