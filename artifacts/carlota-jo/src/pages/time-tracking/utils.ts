import { CLIENT_EMAIL_KEY, DEFAULT_CLIENT_EMAILS, type TimeEntry } from './constants';

export function loadClientEmails(): Record<string, string> {
  if (typeof window === 'undefined') return { ...DEFAULT_CLIENT_EMAILS };
  try {
    const raw = window.localStorage.getItem(CLIENT_EMAIL_KEY);
    if (!raw) return { ...DEFAULT_CLIENT_EMAILS };
    return { ...DEFAULT_CLIENT_EMAILS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CLIENT_EMAILS };
  }
}

export function saveClientEmails(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CLIENT_EMAIL_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function formatToday(): string {
  const d = new Date();
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function entryValue(e: TimeEntry): number {
  if (!e.billable) return 0;
  if (e.rateType === 'fixed') return e.rate;
  return e.hours * e.rate;
}
