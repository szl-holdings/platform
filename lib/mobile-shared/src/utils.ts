/**
 * Mobile-side timestamp formatters that mirror the API of
 * `@szl-holdings/shared-ui/utils` so feature code can stay consistent across
 * web and React Native surfaces.
 *
 * The web `useUserPreferences` store cannot run in React Native (it depends on
 * `localStorage`, `document`, and `window`). On mobile we currently default to
 * the device time zone — `setMobileUserTimeZone()` is provided so a future
 * preferences sync layer can plumb the user's chosen IANA zone through here
 * without touching call sites.
 */

let _mobileUserTimeZone: string | undefined;

/**
 * Returns the user's preferred IANA time zone if one has been set via
 * `setMobileUserTimeZone()`. Returns `undefined` when no preference is known
 * so that `Intl.DateTimeFormat` falls back to the runtime default.
 */
export function getUserTimeZone(): string | undefined {
  return _mobileUserTimeZone;
}

/**
 * Set the user's preferred IANA time zone. Call this from the mobile
 * preferences sync layer once it is plumbed in.
 */
export function setMobileUserTimeZone(zone: string | null | undefined): void {
  if (!zone) {
    _mobileUserTimeZone = undefined;
    return;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    _mobileUserTimeZone = zone;
  } catch {
    _mobileUserTimeZone = undefined;
  }
}

export function resolveTimeZone(override?: string | null): string | undefined {
  if (override === null) return undefined;
  if (typeof override === 'string' && override.length > 0) return override;
  return getUserTimeZone();
}

export interface FormatDateOptions {
  /** Explicit time zone override. Pass `null` to force the runtime default. */
  timeZone?: string | null;
  /** Locale override. Defaults to "en-US" to keep output stable across surfaces. */
  locale?: string;
  /** Override the default Intl options (month/day/year). */
  intlOptions?: Intl.DateTimeFormatOptions;
}

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

export function formatDate(dateString: string | Date, options: FormatDateOptions = {}): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat(options.locale ?? 'en-US', {
    ...(options.intlOptions ?? DEFAULT_DATE_OPTIONS),
    timeZone: resolveTimeZone(options.timeZone),
  }).format(date);
}
