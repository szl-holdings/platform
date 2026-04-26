/**
 * Canonical artifact manifest for the tokens-governance dashboard.
 * Order matches the registered-artifact list in the project view.
 */
export interface ArtifactDescriptor {
  readonly id: string;
  readonly dir: string;
  readonly title: string;
  readonly kind: 'web' | 'mobile' | 'video' | 'design';
}

export const TOKEN_GOVERNED_ARTIFACTS: readonly ArtifactDescriptor[] = [
  { id: 'sentra', dir: 'artifacts/sentra', title: 'Sentra — Cyber Resilience Command', kind: 'web' },
  { id: 'counsel', dir: 'artifacts/counsel', title: 'Counsel — Legal Matter Command', kind: 'web' },
  { id: 'szl-holdings-mobile', dir: 'artifacts/szl-holdings-mobile', title: 'SZL Holdings — Mobile Command', kind: 'mobile' },
  { id: 'szl-demo-video', dir: 'artifacts/szl-demo-video', title: 'SZL Holdings — Governed Autonomy Demo', kind: 'video' },
  { id: 'pulse', dir: 'artifacts/pulse', title: 'Pulse — AI Executive Briefing', kind: 'web' },
  { id: 'aegis', dir: 'artifacts/aegis', title: 'SZL Holdings — Investor Pitch Deck', kind: 'web' },
  { id: 'command', dir: 'artifacts/command', title: 'Unified Command', kind: 'web' },
  { id: 'terra', dir: 'artifacts/terra', title: 'Terra — Real Estate Intelligence', kind: 'web' },
  { id: 'carlota-jo', dir: 'artifacts/carlota-jo', title: 'Carlota Jo Consulting', kind: 'web' },
  { id: 'szl-holdings', dir: 'artifacts/szl-holdings', title: 'SZL Holdings Dashboard', kind: 'web' },
  { id: 'vessels', dir: 'artifacts/vessels', title: 'Vessels Maritime Intelligence', kind: 'web' },
  { id: 'lyte-command-center', dir: 'artifacts/lyte-command-center', title: 'Lyte — Decision Intelligence', kind: 'web' },
  { id: 'mockup-sandbox', dir: 'artifacts/mockup-sandbox', title: 'PRAXIS — Unified Agentic AI Layer', kind: 'design' },
  { id: 'api-server', dir: 'artifacts/api-server', title: 'API Server', kind: 'web' },
];
