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

**Scope**
- Add a dedicated onboarding shell that frames account setup as a guided experience.
- Reuse existing onboarding actions and validation instead of inventing parallel logic.
- Add progress copy, next-step messaging, and clear continuation into league creation.

**Grounding in repo**
- `apps/web/src/app/account/page.tsx`
- `packages/db/src/user-onboarding.ts`
- `apps/web/src/lib/account.ts`

**Acceptance criteria**
- Signed-in admins see a guided onboarding container instead of only raw controls.
- Minor accounts keep their current restricted experience.
- Keyboard flow and screen-reader labels are covered in the issue requirements.

### 3. League creation follow-through and team-setup handoff

**Why now**
- Creating a league is straightforward, but the next action after redirect still needs to feel intentionally guided.

**Scope**
- Improve the post-create handoff from `/league/new` into the newly created league.
- Add a visible next-step checklist for team creation, roster setup, and schedule setup.
- Make the empty league state feel like progress, not a dead end.

**Grounding in repo**
- `apps/web/src/app/league/new/page.tsx`
- `apps/web/src/app/league/[leagueId]/page.tsx`
- `apps/web/src/app/league/[leagueId]/team/new/page.tsx`

**Acceptance criteria**
- New league creation lands on a page with explicit next actions.
- The first empty-state CTA points to the next meaningful setup step.
- Copy is role-aware for league owners and admins.

### 4. Empty-state refresh across league, team, roster, and events

**Why now**
- Empty states are one of the fastest ways to improve perceived completeness without inventing new domains.

**Scope**
- Audit existing empty states on league, team, roster, events, and notifications pages.
- Replace generic blanks with action-oriented guidance and primary CTAs.
- Keep copy consistent with the new product positioning.

**Grounding in repo**
- `apps/web/src/app/league/page.tsx`
- `apps/web/src/app/roster/page.tsx`
- `apps/web/src/app/events/page.tsx`
- `apps/web/src/app/notifications/page.tsx`

**Acceptance criteria**
- Each audited page has a clear empty-state message plus at least one primary CTA.
- Empty states don't block keyboard navigation or screen-reader comprehension.
- The issue includes before-and-after screenshots or Storybook references.

### 5. Contextual help pattern for complex forms

**Why now**
- Form depth is a strength, but some screens need lightweight guidance so they feel safer and easier to use.

**Scope**
- Define a reusable contextual-help pattern for complex forms.
- Start with league setup, roster management, and registration-related forms.
- Prefer inline help and progressive disclosure over noisy tooltip spam.

**Grounding in repo**
- `apps/web/src/components/form-field.tsx`
- `apps/web/src/app/league/new/page.tsx`
- `apps/web/src/components/stories/FormField.stories.tsx`

**Acceptance criteria**
- The issue chooses a reusable help pattern and documents where it should appear first.
- Accessibility requirements cover focus order, hover independence, and screen-reader text.
- Storybook coverage is included if shared components change.

### 6. In-app feedback capture for onboarding friction

**Why now**
- Onboarding polish will move faster if evaluators can report where they get stuck.

**Scope**
- Add a lightweight in-app feedback widget or form for onboarding and setup pages.
- Keep the first version simple, structured, and low-risk.
- Decide where submissions go before implementation starts.

**Grounding in repo**
- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/league/[leagueId]/page.tsx`
- `apps/web/src/lib/observability.ts`

**Acceptance criteria**
- The issue defines fields, submission handling, and privacy expectations.
- Feedback collection is available without interrupting the main setup flow.
- Sensitive data handling is explicitly constrained.

### 7. Demo and CI seed data model

**Why now**
- Both public proof and automated proof depend on realistic, non-sensitive seeded accounts and league data.

**Scope**
- Define seed fixtures for admin, coach, parent, guardian, and minor scenarios.
- Separate public demo fixtures from CI test fixtures where needed.
- Make sure seeded data covers at least one realistic league setup journey.

**Grounding in repo**
- `packages/db/src/schema.ts`
- `packages/db/src/user-onboarding.ts`
- `apps/web/tests/e2e/auth.spec.ts`

**Acceptance criteria**
- The issue lists required personas and data relationships.
- Demo-safe and CI-safe data boundaries are documented.
- The issue identifies where fixture generation should live.

### 8. Auth and onboarding Playwright journey

**Why now**
- The repo already has E2E coverage, but the key trust gap is proof around first-run success.

**Scope**
- Add a Playwright journey for sign-in, onboarding, and first league setup.
- Include assertions that the correct next-step UI appears after each milestone.
- Add automated accessibility checks in the flow.

**Grounding in repo**
- `apps/web/tests/e2e/auth.spec.ts`
- `apps/web/tests/e2e/navigation.spec.ts`
- `apps/web/playwright.config.ts`

**Acceptance criteria**
- The flow covers sign-in to onboarding to league creation.
- The test includes at least one accessibility assertion pass.
- The issue identifies required seeded users and cleanup strategy.

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
