// Shared seed-status vocabulary used by every "innovation seed" / "capability
// seed" surface in A11oy (ARGO Forge, Aerial Twin, and any future surface that
// catalogues seeded capabilities). Defining the union AND the badge style in
// one place is the whole point — adding, renaming, or recolouring a status
// must only require editing this file. Surfaces import both the type and the
// style map from here; the original data modules re-export the type so existing
// `import { SeedStatus } from '../data/argoForge'` paths keep working.

export type SeedStatus = 'active' | 'integrated' | 'adoptable' | 'piloted';

export interface SeedStatusStyle {
  color: string;
  bg: string;
  label: string;
}

// Palette matches the existing a11oy gold/text tokens used across the doctrine
// surfaces — the previous per-page maps were already identical, this is the
// canonical copy.
const GOLD = '#c9b787';

export const SEED_STATUS_STYLE: Record<SeedStatus, SeedStatusStyle> = {
  active:     { color: '#7afa7a', bg: 'rgba(122,250,122,0.08)', label: 'ACTIVE' },
  integrated: { color: '#c9b787', bg: 'rgba(201,183,135,0.10)', label: 'INTEGRATED' },
  adoptable:  { color: GOLD,      bg: 'rgba(201,183,135,0.18)', label: 'ADOPTABLE' },
  piloted:    { color: '#f5f5f5', bg: 'rgba(245,245,245,0.10)', label: 'PILOTED' },
};

/**
 * Look up the badge style for a given seed status. Wrapped in a helper so
 * surfaces can call it without importing the constant directly; this also
 * gives us a single point to add fallback behaviour if a future status string
 * leaks in from a non-typed source.
 */
export function seedStatusStyle(status: SeedStatus): SeedStatusStyle {
  return SEED_STATUS_STYLE[status];
}
