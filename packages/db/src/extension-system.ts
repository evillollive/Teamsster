/**
 * Extension architecture for Teamsster.
 *
 * This module defines the hook system, extension registration,
 * and API contract patterns that third-party modules can use.
 */

// ── Domain event hooks ───────────────────────────────────────────────────────

export const DOMAIN_EVENTS = [
  "announcement.created",
  "announcement.updated",
  "event.created",
  "event.updated",
  "event.cancelled",
  "event.rsvp_changed",
  "league.created",
  "league.updated",
  "membership.added",
  "membership.removed",
  "membership.role_changed",
  "player.created",
  "player.updated",
  "player.archived",
  "registration.submitted",
  "registration.approved",
  "registration.rejected",
  "roster.updated",
  "score.submitted",
  "score.published",
  "team.created",
  "team.updated",
  "volunteer.signup",
  "volunteer.checkin",
  "volunteer.checkout",
] as const;

export type DomainEvent = (typeof DOMAIN_EVENTS)[number];

export type HookPayload = {
  event: DomainEvent;
  timestamp: Date;
  leagueId: string;
  teamId?: string;
  actorUserId?: string;
  data: Record<string, unknown>;
};

export type HookHandler = (payload: HookPayload) => Promise<void> | void;

type RegisteredHook = {
  id: string;
  event: DomainEvent;
  handler: HookHandler;
  moduleId: string;
};

const hookRegistry: RegisteredHook[] = [];
let hookIdCounter = 0;

/**
 * Registers a hook handler for a domain event.
 * Returns a hook ID that can be used to unregister.
 */
export function registerHook(
  moduleId: string,
  event: DomainEvent,
  handler: HookHandler,
): string {
  const id = `hook_${++hookIdCounter}`;
  hookRegistry.push({ id, event, handler, moduleId });
  return id;
}

/**
 * Unregisters a hook by ID.
 */
export function unregisterHook(hookId: string): boolean {
  const index = hookRegistry.findIndex((h) => h.id === hookId);
  if (index === -1) return false;
  hookRegistry.splice(index, 1);
  return true;
}

/**
 * Fires all registered hooks for a domain event.
 * Errors in individual handlers don't block other handlers.
 */
export async function fireHooks(payload: HookPayload): Promise<void> {
  const handlers = hookRegistry.filter((h) => h.event === payload.event);
  await Promise.allSettled(handlers.map((h) => h.handler(payload)));
}

/**
 * Returns all registered hooks (for debugging/admin).
 */
export function getRegisteredHooks(): ReadonlyArray<{
  id: string;
  event: DomainEvent;
  moduleId: string;
}> {
  return hookRegistry.map(({ id, event, moduleId }) => ({
    id,
    event,
    moduleId,
  }));
}

/**
 * Clears all hooks (for testing).
 */
export function clearAllHooks(): void {
  hookRegistry.length = 0;
  hookIdCounter = 0;
}

// ── Extension module registration ────────────────────────────────────────────

export type ExtensionModule = {
  id: string;
  name: string;
  version: string;
  description: string;
  hooks: Array<{ event: DomainEvent; description: string }>;
  apiRoutes?: Array<{ method: string; path: string; description: string }>;
};

const moduleRegistry = new Map<string, ExtensionModule>();

export function registerModule(module: ExtensionModule): void {
  if (moduleRegistry.has(module.id)) {
    throw new Error(`Module "${module.id}" is already registered.`);
  }
  moduleRegistry.set(module.id, module);
}

export function getRegisteredModules(): ExtensionModule[] {
  return [...moduleRegistry.values()];
}

export function getModule(moduleId: string): ExtensionModule | undefined {
  return moduleRegistry.get(moduleId);
}

// ── API contract helpers ─────────────────────────────────────────────────────

export type ApiVersion = "v1";

export type ApiKeyScope = {
  leagueId: string;
  permissions: string[];
};

/**
 * Validates an API key format (expected: 32-char hex string).
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^[a-f0-9]{64}$/.test(key);
}

/**
 * Rate limit configuration for external API consumers.
 */
export const API_RATE_LIMITS = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  burstLimit: 10,
} as const;

/**
 * Validates that a request includes required auth headers.
 */
export function validateApiAuth(headers: Record<string, string | undefined>): {
  valid: boolean;
  error?: string;
} {
  const authHeader = headers.authorization;
  if (!authHeader) {
    return { valid: false, error: "Missing Authorization header." };
  }
  if (!authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Authorization must use Bearer scheme." };
  }
  const token = authHeader.slice(7);
  if (!token || token.length < 32) {
    return { valid: false, error: "Invalid API token." };
  }
  return { valid: true };
}
