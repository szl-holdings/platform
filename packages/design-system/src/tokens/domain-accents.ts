/**
 * Domain accent colours.
 *
 * Each domain has a single accent colour drawn from the AEEP enterprise palette.
 * Import this file — not raw hex literals — wherever domain accent colours are needed.
 *
 * All values are sourced from the colour token system defined in `index.ts`.
 */
import { color } from './index.js';

export const domainAccents = {
  command:  color.accent.blue,
  holdings: color.accent.teal,
  pulse:    color.accent.amber,
  lyte:     color.accent.amber,
  sentra:   color.accent.red,
  vessels:  color.accent.blue,
  terra:    color.accent.green,
  counsel:  color.accent.violet,
  aegis:    color.accent.violet,
  carlota:  color.accent.violet,
  prism:    color.accent.violet,
} as const;

export type DomainAccentKey = keyof typeof domainAccents;
