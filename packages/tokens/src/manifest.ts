/**
 * Canonical artifact manifest for the tokens-governance dashboard.
 * Order matches the registered-artifact list in the project view.
 *
 * 2026-05-02: Trimmed to the 6 keep artifacts after the monorepo cleanup.
 */
export interface ArtifactDescriptor {
  readonly id: string;
  readonly dir: string;
  readonly title: string;
  readonly kind: 'web' | 'mobile' | 'video' | 'design';
}

export const TOKEN_GOVERNED_ARTIFACTS: readonly ArtifactDescriptor[] = [
  { id: 'a11oy', dir: 'artifacts/a11oy', title: 'A11oy — Genetic AI Substrate', kind: 'web' },
  { id: 'sentra', dir: 'artifacts/sentra', title: 'Sentra — Cyber Resilience Command', kind: 'web' },
  { id: 'terra', dir: 'artifacts/terra', title: 'Terra — Real Estate Intelligence', kind: 'web' },
  { id: 'carlota-jo', dir: 'artifacts/carlota-jo', title: 'Carlota Jo Consulting', kind: 'web' },
  { id: 'counsel', dir: 'artifacts/counsel', title: 'Counsel — Legal Matter Command', kind: 'web' },
  { id: 'vessels', dir: 'artifacts/vessels', title: 'Vessels Maritime Intelligence', kind: 'web' },
];
