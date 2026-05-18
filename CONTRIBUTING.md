# Contributing to Teamsster

Thanks for helping build Teamsster.

## Before you start

1. Read the [README](./README.md) for setup steps.
2. Review the [Code of Conduct](./CODE_OF_CONDUCT.md).
3. Check the roadmap in [PLAN.md](./PLAN.md) so work aligns with current milestones.
4. Use the deployment runbook in [DEPLOYMENT.md](./DEPLOYMENT.md) for environment and release expectations.

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

## Development expectations

- Keep changes focused and easy to review.
- Use conventional commits.
- Validate new inputs with Zod.
- Route permission decisions through `apps/web/src/lib/permissions.ts`.
- Avoid direct database access from React components.
- Add or update tests when core helpers or shared utilities change.
- Keep communication and notification changes aligned with `/messages` workflow expectations (announcement audience scoping, templates, and delivery logs).
- Preserve accessible form semantics for composition workflows (labels, helper text, and keyboard-first operation).

## Pull requests

Please include:

- what changed
- why it changed
- how you tested it
- screenshots or recordings when UI is affected

The repository includes a PR template to help.

## Reporting bugs and proposing features

- Use the issue templates in `.github/ISSUE_TEMPLATE/`.
- For security issues, do **not** open a public issue—follow [SECURITY.md](./SECURITY.md) instead.
