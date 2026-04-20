/**
 * Domain-profile accent colours.
 *
 * These are the only hex values permitted outside packages/design-system.
 * Each value must mirror an entry in packages/design-system/src/tokens/index.ts
 * — update both files in sync.
 */
export const PROFILE_ACCENT = {
  lyte: '#4d8fcc',
  vessels: '#4d8fcc',
  terra: '#5baa8a',
  aegis: '#9b7cc8',
  prism: '#4d8fcc',
  carlota: '#9b7cc8',
} as const;

export type ProfileAccentKey = keyof typeof PROFILE_ACCENT;
