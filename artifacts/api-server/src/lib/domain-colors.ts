/**
 * Canonical domain accent colors for API payloads (chart series, cross-platform summaries).
 *
 * All values match the GI Design Language enterprise accent palette defined in
 * packages/design-system/src/tokens/gi-tokens.css and domain-accents.ts.
 *
 * Import from here — do not hardcode hex literals in route files.
 */

/** Lowercase-keyed map for programmatic lookups */
export const DOMAIN_COLORS = {
  command:  '#4d8fcc',
  holdings: '#3ea89a',
  pulse:    '#c9a85c',
  lyte:     '#c9a85c',
  sentra:   '#c96070',
  vessels:  '#4d8fcc',
  maritime: '#4d8fcc',
  terra:    '#5baa8a',
  counsel:  '#9b7cc8',
  aegis:    '#9b7cc8',
  carlota:  '#9b7cc8',
  prism:    '#9b7cc8',
} as const;

export type DomainColorKey = keyof typeof DOMAIN_COLORS;

/**
 * Display-name-keyed map for routes that use mixed-case product names in
 * their domain schemas (e.g. command.ts's DOMAIN_COLOR map).
 * Mirrors DOMAIN_COLORS — do not introduce new hex literals here.
 */
export const DOMAIN_COLOR_BY_NAME: Record<string, string> = {
  Aegis:         DOMAIN_COLORS.aegis,
  Vessels:       DOMAIN_COLORS.vessels,
  Lyte:          DOMAIN_COLORS.lyte,
  Terra:         DOMAIN_COLORS.terra,
  PRISM:         DOMAIN_COLORS.prism,
  Counsel:       DOMAIN_COLORS.counsel,
  SZL:           DOMAIN_COLORS.holdings,
  'SZL Holdings': DOMAIN_COLORS.holdings,
  Sentra:        DOMAIN_COLORS.sentra,
  Pulse:         DOMAIN_COLORS.pulse,
  Command:       DOMAIN_COLORS.command,
  'Carlota Jo':  DOMAIN_COLORS.carlota,
  Stephen:       DOMAIN_COLORS.counsel,
};
