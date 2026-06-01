/**
 * AEEP Border Radius Tokens
 *
 * Restrained radius system. Enterprise preference for sharp-to-moderate
 * corners. No pill/full-radius UI elements in data-dense contexts.
 */

export const radius = {
  none: '0px',
  sm: '3px',
  base: '4px',
  md: '6px',
  lg: '8px',
  xl: '10px',
  '2xl': '12px',
  full: '9999px',
} as const;

export type RadiusKey = keyof typeof radius;
