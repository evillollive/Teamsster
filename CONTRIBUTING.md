# Contributing to Teamsster

Thanks for helping build Teamsster.

## Before you start

1. Read the [README](./README.md) for setup steps.
2. Review the [Code of Conduct](./CODE_OF_CONDUCT.md).
3. Check the roadmap in [PLAN.md](./PLAN.md) so work aligns with current milestones.
4. Use the deployment runbook in [DEPLOYMENT.md](./DEPLOYMENT.md) for environment and release expectations.

## Prerequisites

- **Node.js** 20+ (we recommend [Volta](https://volta.sh) for version management)
- **pnpm** 10.12+ (managed via corepack)
- **PostgreSQL** 16+ (for integration and E2E tests)

## Local workflow

```bash
corepack enable
corepack prepare pnpm@10.12.4 --activate
pnpm install
cp .env.example .env.local
pnpm lint
pnpm typecheck
pnpm test
pnpm db:migrate
```

### Storybook

```bash
pnpm --filter @teamsster/web storybook      # dev server on :6006
pnpm --filter @teamsster/web build-storybook # static build
```

Deployed Storybook: https://evillollive.github.io/Teamsster/

## Architecture rules

- **No database calls in components.** All data access goes through `apps/web/src/lib/` service helpers.
- **Soft deletes everywhere.** Always filter with `isNull(deletedAt)` in queries.
- **Audit logging for mutations.** Every create/update/delete writes to `audit_logs`.
- **Permission checks in service layer.** `packages/db/src/*-admin.ts` files are low-level; authorization goes in `apps/web/src/lib/*.ts`.
- **Zod validation on all inputs.** No unvalidated user data reaches the database.

## Testing

```bash
pnpm test   # 480+ unit tests across 34 files
pnpm e2e    # Playwright E2E (needs Postgres)
```

- Unit tests live next to source: `foo.ts` -> `foo.test.ts`.
- Mock `@teamsster/db` in web-layer tests.
- Test edge cases, not just happy paths.

## Accessibility

Every UI component must include:
- Keyboard navigation (tab, arrow keys for tab patterns).
- Screen-reader labels (`aria-label`, `aria-describedby`).
- Visible focus indicators.
- Text alongside color indicators.
- `motion-reduce:transition-none` on animations.

## Development expectations

- Keep changes focused and easy to review.
- Use conventional commits (lowercase subject, enforced by commitlint).
- Validate new inputs with Zod.
- Route permission decisions through `apps/web/src/lib/permissions.ts`.
- Avoid direct database access from React components.
- Add or update tests when core helpers or shared utilities change.
- Keep communication and notification changes aligned with `/messages` workflow expectations.
- Preserve accessible form semantics (labels, helper text, keyboard-first operation).

## Pull requests

Please include:

- what changed
- why it changed
- how you tested it
- screenshots or recordings when UI is affected

CI must pass: all 5 workflows (CI, E2E, CodeQL, Storybook, Renovate) must be green.

The repository includes a PR template to help.

## Good first issues

Look for the `good first issue` label. Good starter tasks:
- Adding unit tests for edge cases in `apps/web/src/lib/`
- Adding Storybook story variants for existing components
- Adding missing ARIA attributes to form elements
- Adding explicit return types to exported functions in `packages/db/src/`
- Documentation clarifications

## Project structure

```text
apps/web/                   Next.js application
  src/app/                  Page routes and server actions
  src/components/           Shared UI components
  src/lib/                  Service layer (auth-gated helpers)
  tests/e2e/                Playwright E2E tests
  .storybook/               Storybook configuration

packages/auth/              Better Auth configuration
packages/db/                Database layer
  src/schema.ts             Drizzle schema (all tables)
  src/*-admin.ts            Admin/data-access layers
  drizzle/                  SQL migrations (0000-0017)
```

## Reporting bugs and proposing features

- Use the issue templates in `.github/ISSUE_TEMPLATE/`.
- For security issues, do **not** open a public issue. Follow [SECURITY.md](./SECURITY.md) instead.
