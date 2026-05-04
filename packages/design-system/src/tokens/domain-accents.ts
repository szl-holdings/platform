/**
 * Domain accent colours — v3 warm-light edition.
 *
 * Each domain has a single accent colour drawn from the GI enterprise palette.
 * Gold is the primary accent; blue is replaced by slate.
 */
import { color } from './index.js';

export const domainAccents = {
  command:  color.accent.gold,
  holdings: color.accent.teal,
  pulse:    color.accent.amber,
  lyte:     color.accent.amber,
  sentra:   color.accent.red,
  vessels:  color.accent.slate,
  terra:    color.accent.green,
  counsel:  color.accent.violet,
  aegis:    color.accent.violet,
  carlota:  color.accent.violet,
  prism:    color.accent.violet,
} as const;

export type DomainAccentKey = keyof typeof domainAccents;
