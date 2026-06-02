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
