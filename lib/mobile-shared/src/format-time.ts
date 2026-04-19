/**
 * Time formatting helpers that honour the user's chosen IANA time zone.
 *
 * Mirrors the web `formatInTimeZone` helper: when the user has set a
 * `time_zone` preference, dates are formatted in that zone; otherwise we
 * fall back to the device's local zone (`Intl.DateTimeFormat` default).
 */

import { getUserTimeZone } from "./hooks/useUserPreferences";

function resolveZone(explicit?: string | null): string | undefined {
  if (explicit) return explicit;
  return getUserTimeZone();
}

/**
 * Format an ISO date string / Date / timestamp using `Intl.DateTimeFormat`,
 * automatically applying the user's preferred time zone.
 */
export function formatInUserTimeZone(
  date: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
  locale: string | string[] = "en-US",
  explicitZone?: string | null,
): string {
  if (date === null || date === undefined || date === "") return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const timeZone = resolveZone(explicitZone);
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(d);
  } catch {
    return new Intl.DateTimeFormat(locale, options).format(d);
  }
}

/**
 * Returns the resolved IANA zone we'd use right now — useful for displaying
 * "Times shown in {zone}" hints. `undefined` means we'd fall back to the
 * runtime default (which the caller can derive itself).
 */
export function getResolvedUserTimeZone(): string | undefined {
  return getUserTimeZone();
}

/**
 * Returns the device's IANA time zone (best effort), used as a fallback when
 * the user has no explicit preference set.
 */
export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
