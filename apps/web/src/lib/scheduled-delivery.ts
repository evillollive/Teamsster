/**
 * Scheduled delivery helpers for notification reminders.
 */

/**
 * Lead time presets for scheduled notification delivery.
 * Values represent minutes before the event start.
 */
export const LEAD_TIME_PRESETS = {
  "15m": 15,
  "1h": 60,
  "2h": 120,
  "1d": 24 * 60,
  "2d": 48 * 60,
} as const;

export type LeadTimePreset = keyof typeof LEAD_TIME_PRESETS;

/**
 * Checks whether a given event reminder is due based on lead time.
 */
export function isReminderDue(
  eventStartsAt: Date,
  leadTimeMinutes: number,
  now = new Date(),
): boolean {
  const reminderAt = new Date(
    eventStartsAt.getTime() - leadTimeMinutes * 60_000,
  );
  return now >= reminderAt;
}

/**
 * Calculates the reminder dispatch time for an event.
 */
export function getReminderDispatchTime(
  eventStartsAt: Date,
  leadTimeMinutes: number,
): Date {
  return new Date(eventStartsAt.getTime() - leadTimeMinutes * 60_000);
}

/**
 * Determines whether a reminder window is still valid (event hasn't passed).
 */
export function isReminderWindowValid(
  eventStartsAt: Date,
  now = new Date(),
): boolean {
  return eventStartsAt > now;
}
