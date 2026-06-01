import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getUserTimeZone } from './use-user-preferences';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve the time zone to apply to a formatter. Honors the user's preference
 * when set; otherwise returns `undefined` so `Intl.DateTimeFormat` falls back
 * to the runtime's default zone.
 *
 * Accepts an explicit override so callers (tests, server-rendered surfaces)
 * can opt out of the user preference.
 */
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

export interface FormatDateTimeOptions extends FormatDateOptions {
  /** Include seconds in the rendered time. Default: true. */
  withSeconds?: boolean;
  /** Use 24-hour clock. Default: false (locale default). */
  hour12?: boolean;
}

/**
 * Format a date with both date and time components in the user's preferred
 * time zone. Used for audit logs, notification rows, and "last updated" labels.
 */
export function formatDateTime(
  dateString: string | Date,
  options: FormatDateTimeOptions = {},
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const withSeconds = options.withSeconds ?? true;
  return new Intl.DateTimeFormat(options.locale ?? 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
    ...(typeof options.hour12 === 'boolean' ? { hour12: options.hour12 } : {}),
    timeZone: resolveTimeZone(options.timeZone),
  }).format(date);
}

/**
 * Format just the time-of-day component in the user's preferred time zone.
 */
export function formatTime(dateString: string | Date, options: FormatDateTimeOptions = {}): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const withSeconds = options.withSeconds ?? true;
  return new Intl.DateTimeFormat(options.locale ?? 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
    ...(typeof options.hour12 === 'boolean' ? { hour12: options.hour12 } : {}),
    timeZone: resolveTimeZone(options.timeZone),
  }).format(date);
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function getApiUrl(path: string): string {
  return `/api${path}`;
}

/**
 * Add an alpha channel to any CSS color string (hex, hsl, rgb, or named color).
 * Returns an rgba() value that works universally.
 *
 * @param color - CSS color string (e.g. "#3b82f6", "hsl(210 12% 7%)", "rgb(59,130,246)")
 * @param alpha - Opacity 0–1
 */
export function toAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));

  if (color.startsWith('#')) {
    let hex = color.replace('#', '');
    if (hex.length === 3)
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }

  if (color.startsWith('hsl(') || color.startsWith('hsla(')) {
    const isHsla = color.startsWith('hsla(');
    const inner = color.slice(isHsla ? 5 : 4, -1).trim();
    const isModern = !inner.includes(',');
    if (isModern) {
      const base = inner.replace(/\s*\/\s*[\d.]+$/, '').trim();
      return `hsl(${base} / ${a})`;
    }
    const base = inner.replace(/,\s*[\d.]+$/, '').trim();
    return `hsla(${base}, ${a})`;
  }

  if (color.startsWith('rgba(')) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${a})`);
  }

  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${a})`);
  }

  return color;
}
