/**
 * @module @teamsster/db
 *
 * Database access layer. All write operations (create/update/archive/assign)
 * are low-level and do NOT enforce authorization. They must only be called
 * through the auth-gated helpers in `apps/web/src/lib/`.
 *
 * Do NOT import write functions directly in page/route/action code.
 */
export * from "./calendar-feed-admin";
export * from "./captain-admin";
export * from "./client";
export * from "./compliance-admin";
export * from "./event-admin";
export * from "./extension-system";
export * from "./guardian-admin";
export * from "./league-admin";
export * from "./membership-admin";
export * from "./message-admin";
export * from "./messaging-admin";
export * from "./moderation-admin";
export * from "./notification-admin";
export * from "./official-admin";
export * from "./player-admin";
export * from "./privacy-admin";
export * from "./proof-payments";
export * from "./proof-stats";
export * from "./push-tokens";
export * from "./schema";
export * from "./season-admin";
export * from "./team-admin";
export * from "./template-admin";
export * from "./upload-admin";
export * from "./user-onboarding";
export * from "./volunteer-admin";
