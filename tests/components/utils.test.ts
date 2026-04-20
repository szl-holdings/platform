import { describe, expect, it } from 'vitest';
import { setUserPreference } from '../../lib/shared-ui/src/use-user-preferences';
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatTime,
  resolveTimeZone,
} from '../../lib/shared-ui/src/utils';

describe('cn (class merge utility)', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('removes falsy values', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar');
  });

  it('handles conditional class names', () => {
    const active = true;
    const disabled = false;
    expect(cn('base', active && 'active', disabled && 'disabled')).toBe('base active');
  });

  it('merges tailwind classes with proper deduplication', () => {
    const result = cn('p-2 p-4');
    expect(result).toBe('p-4');
  });

  it('returns empty string with no args', () => {
    expect(cn()).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a date string to readable format', () => {
    const result = formatDate('2024-01-15');
    expect(result).toMatch(/Jan/i);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  it('accepts a Date object', () => {
    const date = new Date('2024-06-01');
    const result = formatDate(date);
    expect(result).toMatch(/Jun/i);
    expect(result).toMatch(/2024/);
  });
});

describe('formatCurrency', () => {
  it('formats a number as USD by default', () => {
    const result = formatCurrency(1000000);
    expect(result).toMatch(/\$1,000,000/);
  });

  it('accepts a custom currency', () => {
    const result = formatCurrency(500, 'EUR');
    expect(result).toContain('500');
  });

  it('rounds to zero decimal places', () => {
    const result = formatCurrency(1234.56);
    expect(result).not.toContain('.');
  });
});

describe('formatNumber', () => {
  it('formats a number with commas', () => {
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('formats small numbers without commas', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('time zone–aware formatters', () => {
  // 2024-06-01T05:30:00Z → 22:30 the previous day in Los Angeles, 14:30 in Tokyo
  const ISO = '2024-06-01T05:30:00Z';

  afterEach(() => {
    // Reset preference so tests stay isolated
    setUserPreference('time_zone', null);
  });

  it('respects an explicit time zone override on formatDateTime', () => {
    const la = formatDateTime(ISO, { timeZone: 'America/Los_Angeles', withSeconds: false });
    const tokyo = formatDateTime(ISO, { timeZone: 'Asia/Tokyo', withSeconds: false });
    expect(la).toMatch(/May 31/);
    expect(la).toMatch(/10:30/);
    expect(tokyo).toMatch(/Jun 1/);
    expect(tokyo).toMatch(/2:30/);
  });

  it('formatTime honors an explicit time zone', () => {
    expect(formatTime(ISO, { timeZone: 'Asia/Tokyo', withSeconds: false, hour12: false })).toMatch(
      /14:30/,
    );
    expect(
      formatTime(ISO, { timeZone: 'Europe/London', withSeconds: false, hour12: false }),
    ).toMatch(/06:30/);
  });

  it('formatDate honors an explicit time zone for date rollover', () => {
    expect(formatDate(ISO, { timeZone: 'America/Los_Angeles' })).toMatch(/May 31/);
    expect(formatDate(ISO, { timeZone: 'Asia/Tokyo' })).toMatch(/Jun 1/);
  });

  it('uses the user preference when no override is provided', () => {
    setUserPreference('time_zone', 'Asia/Tokyo');
    expect(formatTime(ISO, { withSeconds: false, hour12: false })).toMatch(/14:30/);
    setUserPreference('time_zone', 'America/Los_Angeles');
    expect(formatTime(ISO, { withSeconds: false, hour12: false })).toMatch(/22:30/);
  });

  it('resolveTimeZone falls back to user preference and then runtime default', () => {
    setUserPreference('time_zone', 'Asia/Tokyo');
    expect(resolveTimeZone()).toBe('Asia/Tokyo');
    expect(resolveTimeZone('Europe/Paris')).toBe('Europe/Paris');
    expect(resolveTimeZone(null)).toBeUndefined();
    setUserPreference('time_zone', null);
    expect(resolveTimeZone()).toBeUndefined();
  });

  it('ignores invalid preference values (validation in store)', () => {
    setUserPreference('time_zone', 'Not/A_Zone' as never);
    // Invalid value never makes it into the store, so resolveTimeZone stays undefined
    expect(resolveTimeZone()).toBeUndefined();
  });
});
