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
  lyte: color.accent.blue,
  vessels: color.accent.blue,
  terra: color.accent.green,
  aegis: color.accent.violet,
  prism: color.accent.violet,
  carlota: color.accent.blue,
} as const;

export type DomainAccentKey = keyof typeof domainAccents;
