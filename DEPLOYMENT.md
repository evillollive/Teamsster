# Teamsster deployment runbook

This runbook defines the initial production deployment path and operational checklist for Teamsster.

## Hosting model

- **Primary target:** Vercel-hosted `@teamsster/web` application.
- **Database:** hosted Postgres-compatible provider (Neon recommended).
- **Email transport:** SMTP provider configured through `AUTH_SMTP_URL`.

This is the baseline model for local/staging/production consistency until a different infrastructure target is formally adopted.

## Environment matrix

| Variable | Local | Staging | Production |
| --- | --- | --- | --- |
| `DATABASE_URL` | required | required | required |
| `BETTER_AUTH_URL` | required (`http://localhost:3000`) | required (staging URL) | required (production URL) |
| `BETTER_AUTH_SECRET` | required (dev-safe value allowed) | required (unique secret) | required (unique secret, never default) |
| `AUTH_EMAIL_FROM` | required | required | required |
| `AUTH_SMTP_URL` | optional | required | required |
| `NEXT_PUBLIC_ENABLE_PLAUSIBLE` | optional | optional | optional |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | optional | optional | optional |
| `NEXT_PUBLIC_ENABLE_SENTRY` | optional | optional | optional |
| `SENTRY_DSN` | optional | optional | optional |
| `SENTRY_AUTH_TOKEN` | optional | optional | optional |
| `SENTRY_ORG` | optional | optional | optional |
| `SENTRY_PROJECT` | optional | optional | optional |

## Provisioning checklist

1. Create a Postgres database for the target environment.
2. Set all required environment variables in the hosting platform.
3. Confirm `BETTER_AUTH_SECRET` is not the development default.
4. Confirm `AUTH_SMTP_URL` is set for staging/production.
5. Run database migrations before first deploy and on each release.

## Migration workflow

### Generate migration files (schema changes only)

```bash
pnpm db:generate
```

### Apply migrations to a target database

```bash
DATABASE_URL=postgres://... pnpm db:migrate
```

Use staging credentials first, then production credentials after staging validation succeeds.

## Release workflow (staging -> production)

1. Merge to default branch after code review.
2. Run full validation suite:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
   - `pnpm e2e`
3. Deploy to staging.
4. Run staging smoke checks:
   - sign-in/sign-up/magic link
   - league/team/roster/event/message critical flows
   - outbound auth email delivery
5. Apply migrations in production.
6. Promote/deploy production build.
7. Run production smoke checks on auth and core workflows.

## Rollback approach

1. Redeploy the last known-good application version from the hosting provider.
2. If the incident is migration-related, halt additional writes and run a manual DB restore/forward-fix plan.
3. Validate auth, league dashboard, roster, events, and messages after rollback.
4. Record the incident timeline and follow-up actions.

## Backup expectations

- Enable automated daily database backups in the database provider.
- Retain at least 7 days of restorable snapshots for staging and production.
- Verify backup restore procedure at least once per quarter.

## Monitoring expectations

- Keep CI (`CI`, `E2E`, `CodeQL`) green before release.
- Enable Sentry and/or platform error monitoring in staging and production.
- Track auth delivery failures and notification delivery logs during rollout windows.

## Notes for future hardening

- Add platform-specific infrastructure configuration (for example, Terraform/Pulumi) when infrastructure needs stabilize.
- Add explicit uptime/SLO targets and alert thresholds once production traffic patterns are known.
