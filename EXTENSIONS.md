# Teamsster Extension Guide

This guide explains how to build extension modules for Teamsster using the hook system and API contracts.

## Architecture

Teamsster's extension system has three layers:

1. **Domain event hooks**: Subscribe to lifecycle events (e.g., `registration.submitted`, `score.published`).
2. **Extension modules**: Self-contained packages that register hooks and optionally expose API routes.
3. **External API**: Versioned REST contracts for mobile clients and third-party integrations.

## Domain events

There are 25 domain events you can subscribe to:

| Category | Events |
|----------|--------|
| Announcements | `announcement.created`, `announcement.updated` |
| Events | `event.created`, `event.updated`, `event.cancelled`, `event.rsvp_changed` |
| Leagues | `league.created`, `league.updated` |
| Membership | `membership.added`, `membership.removed`, `membership.role_changed` |
| Players | `player.created`, `player.updated`, `player.archived` |
| Registration | `registration.submitted`, `registration.approved`, `registration.rejected` |
| Roster | `roster.updated` |
| Scores | `score.submitted`, `score.published` |
| Teams | `team.created`, `team.updated` |
| Volunteers | `volunteer.signup`, `volunteer.checkin`, `volunteer.checkout` |

## Registering a hook

```typescript
import { registerHook } from "@teamsster/db";

registerHook("my-module", "score.published", async (payload) => {
  console.log(`Score published for event ${payload.data.eventId}`);
  // Your logic here
});
```

### Hook payload

Every hook receives a `HookPayload`:

```typescript
type HookPayload = {
  event: DomainEvent;    // Which event fired
  timestamp: Date;       // When it happened
  leagueId: string;      // Always present
  teamId?: string;       // When team-scoped
  actorUserId?: string;  // Who triggered it
  data: Record<string, unknown>; // Event-specific data
};
```

### Error isolation

Hook errors don't block other hooks. Each handler runs independently via `Promise.allSettled`.

## Registering a module

```typescript
import { registerModule } from "@teamsster/db";

registerModule({
  id: "my-stats",
  name: "Advanced Stats",
  version: "1.0.0",
  description: "Custom statistics and analytics.",
  hooks: [
    { event: "score.published", description: "Recalculates standings." },
  ],
  apiRoutes: [
    { method: "GET", path: "/api/stats/:leagueId", description: "Get standings." },
  ],
});
```

## External API contracts

### Authentication

All external API requests require a Bearer token:

```
Authorization: Bearer <64-char-hex-api-key>
```

### Rate limits

| Limit | Value |
|-------|-------|
| Requests per minute | 60 |
| Requests per hour | 1,000 |
| Burst limit | 10 |

### Validation helper

```typescript
import { validateApiAuth } from "@teamsster/db";

const result = validateApiAuth(request.headers);
if (!result.valid) {
  return new Response(result.error, { status: 401 });
}
```

## Proof modules

Two proof-of-concept modules ship with Teamsster:

### Payments (`proof-payments.ts`)

Demonstrates Stripe-style payment integration:
- `createPaymentIntent()` for registration fees
- `verifyWebhookSignature()` for Stripe webhook validation
- `formatAmount()` for currency display
- Hooks into `registration.submitted` and `registration.approved`

### Stats (`proof-stats.ts`)

Demonstrates standings and statistics:
- `calculatePoints()` (3 for win, 1 for tie)
- `updateStandingFromScore()` for match result processing
- `sortStandings()` by points, goal difference, goals for
- Hooks into `score.published`

## Security expectations

Extensions must:
- Run through centralized permission checks (don't bypass `canAccessFeature`/`canAccessField`).
- Sanitize all user input before rendering or persisting.
- Use the audit logging pattern for sensitive mutations.
- Respect minor account safety rules and guardian boundaries.
- Never expose raw database credentials or encryption keys.

## Accessibility expectations

Extension UIs must:
- Be fully keyboard operable (tab, enter, escape, arrow keys where appropriate).
- Include screen-reader labels on all interactive elements.
- Use visible focus indicators.
- Not rely on color alone for status or state information.
- Support `prefers-reduced-motion` for animations.
- Meet WCAG AA contrast ratios.

## File locations

```text
packages/db/src/extension-system.ts   Hook system and module registry
packages/db/src/proof-payments.ts     Payment proof module
packages/db/src/proof-stats.ts        Stats proof module
```
