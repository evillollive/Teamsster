/**
 * @module @teamsster/db
 *
 * Database access layer. All write operations (create/update/archive/assign)
 * are low-level and do NOT enforce authorization. They must only be called
 * through the auth-gated helpers in `apps/web/src/lib/`.
 *
 * Do NOT import write functions directly in page/route/action code.
 */
export * from "./captain-admin";
export * from "./client";
export * from "./event-admin";
export * from "./guardian-admin";
export * from "./league-admin";
export * from "./membership-admin";
export * from "./message-admin";
export * from "./player-admin";
export * from "./push-tokens";
export * from "./schema";
export * from "./team-admin";
export * from "./upload-admin";
export * from "./user-onboarding";
