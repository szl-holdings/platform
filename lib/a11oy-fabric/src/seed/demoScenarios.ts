export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  workcellIds: string[];
  initialSignals: string[];
}

export const SEED_DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'scenario-revenue-friction',
    name: 'Revenue Friction',
    description: 'Investigate and remediate enterprise ARR growth deceleration and churn spikes.',
    workcellIds: ['wc-001', 'wc-008', 'wc-013', 'wc-020'],
    initialSignals: ['sig-lyte-001', 'sig-lyte-002'],
  },
  {
    id: 'scenario-voyage-risk',
    name: 'Voyage Risk',
    description: 'Manage maritime operational risks including port diversions and compliance gaps.',
    workcellIds: ['wc-004', 'wc-011', 'wc-016'],
    initialSignals: ['sig-vessels-001', 'sig-vessels-002'],
  },
  {
    id: 'scenario-board-packet',
    name: 'Board Packet Preparation',
    description: 'Consolidate cross-vertical risks and governance evidence for board-level reporting.',
    workcellIds: ['wc-010', 'wc-017'],
    initialSignals: ['sig-aegis-001', 'sig-counsel-004'],
  },
  {
    id: 'scenario-aegis-incident',
    name: 'PARAGON Incident Response',
    description: 'Coordinate defense response to state-level APT attribution and supply chain compromise.',
    workcellIds: ['wc-010', 'wc-015'],
    initialSignals: ['sig-aegis-001', 'sig-aegis-004'],
  },
  {
    id: 'scenario-cross-vertical-risk',
    name: 'Cross-Vertical Exposure',
    description: 'Analyze systemic risks impacting multiple business units simultaneously.',
    workcellIds: ['wc-019', 'wc-014', 'wc-009'],
    initialSignals: ['sig-alloy-002', 'sig-terra-003'],
  },
];
