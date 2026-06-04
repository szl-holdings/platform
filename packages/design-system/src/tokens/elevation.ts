/**
 * AEEP Elevation Tokens
 *
 * Restrained elevation system. Dark surfaces use opacity-based lift,
 * not hard drop shadows. No glow or bloom effects in product UX.
 */

export const elevation = {
  none: 'none',
  card: '0 1px 3px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.24)',
  panel: '0 2px 8px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.28)',
  overlay: '0 4px 16px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.32)',
  modal: '0 8px 32px rgba(0,0,0,0.50), 0 4px 16px rgba(0,0,0,0.40)',
  drawer: '0 12px 48px rgba(0,0,0,0.55), 0 6px 24px rgba(0,0,0,0.44)',
} as const;

export type ElevationKey = keyof typeof elevation;
