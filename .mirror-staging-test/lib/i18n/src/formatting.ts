export type SupportedLocale = "en" | "es";

const LOCALE_BCP47: Record<SupportedLocale, string> = {
  en: "en-US",
  es: "es-ES",
};

export function formatDate(
  date: Date | string | number,
  locale: SupportedLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  const bcp47 = LOCALE_BCP47[locale] ?? "en-US";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(bcp47, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(d);
}

export function formatNumber(
  value: number,
  locale: SupportedLocale,
  options?: Intl.NumberFormatOptions
): string {
  const bcp47 = LOCALE_BCP47[locale] ?? "en-US";
  return new Intl.NumberFormat(bcp47, options).format(value);
}

export function formatCurrency(
  value: number,
  locale: SupportedLocale,
  currency: string = "USD"
): string {
  const bcp47 = LOCALE_BCP47[locale] ?? "en-US";
  return new Intl.NumberFormat(bcp47, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRelativeTime(
  date: Date | string | number,
  locale: SupportedLocale
): string {
  const bcp47 = LOCALE_BCP47[locale] ?? "en-US";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat(bcp47, { numeric: "auto" });

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return rtf.format(diffMinutes, "minute");
    }
    return rtf.format(diffHours, "hour");
  }
  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, "day");
  }
  if (Math.abs(diffDays) < 365) {
    return rtf.format(Math.round(diffDays / 30), "month");
  }
  return rtf.format(Math.round(diffDays / 365), "year");
}
