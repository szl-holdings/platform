import { useEffect, useMemo, useState } from 'react';
import { useUserPreferences } from './use-user-preferences';

export interface LiveClockProps {
  className?: string;
  style?: React.CSSProperties;
  /**
   * - `utc`: forced UTC (e.g. for SOC headers that must show UTC)
   * - `local`: user's preferred time zone (falls back to browser default)
   * - `iso`: HH:MM:SS slice from the ISO string in UTC
   */
  format?: 'utc' | 'local' | 'iso';
  /** Explicit time zone override that wins over the user preference. */
  timeZone?: string;
}

function formatLocalTime(time: Date, timeZone: string | undefined): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone,
    }).format(time);
  } catch {
    return time.toLocaleTimeString();
  }
}

export function LiveClock({ className, style, format = 'utc', timeZone }: LiveClockProps) {
  const [time, setTime] = useState(new Date());
  const { prefs } = useUserPreferences();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const resolvedZone = useMemo(
    () => timeZone ?? prefs.time_zone ?? undefined,
    [timeZone, prefs.time_zone],
  );

  const display =
    format === 'iso'
      ? time.toISOString().slice(11, 19)
      : format === 'local'
        ? formatLocalTime(time, resolvedZone)
        : `UTC ${time.toISOString().slice(11, 19)}`;

  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
}
