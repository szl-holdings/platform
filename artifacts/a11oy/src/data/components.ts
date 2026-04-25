export interface ComponentItem {
  id: string;
  name: string;
  category: string;
  description: string;
  canonicalVersion: string;
  adoptionPct: number;
  surfaces: string[];
  status: 'stable' | 'deprecated' | 'beta' | 'experimental';
  deprecatedReplacement?: string;
}

export const components: ComponentItem[] = [
  { id: 'c-1', name: 'DenseTable', category: 'Data Display', description: 'High-density data grid for command centers', canonicalVersion: '4.2.0', adoptionPct: 85, surfaces: ['Sentra', 'Vessels', 'Aegis', 'Terra', 'Pulse'], status: 'stable' },
  { id: 'c-2', name: 'StatusBadge', category: 'Data Display', description: 'Standardized operational status indicator', canonicalVersion: '2.1.1', adoptionPct: 95, surfaces: ['Sentra', 'Counsel', 'Pulse', 'Terra', 'Vessels', 'Aegis'], status: 'stable' },
  { id: 'c-3', name: 'TimelineLane', category: 'Data Display', description: 'Vertical incident/event timeline', canonicalVersion: '1.0.5', adoptionPct: 40, surfaces: ['Aegis', 'Counsel'], status: 'beta' },
  { id: 'c-4', name: 'NarrativePanel', category: 'Layout', description: 'Side panel for contextual intelligence', canonicalVersion: '3.0.0', adoptionPct: 60, surfaces: ['Pulse', 'Sentra', 'Terra'], status: 'stable' },
  { id: 'c-5', name: 'ApprovalDialog', category: 'Feedback', description: 'Governed confirmation dialog', canonicalVersion: '2.0.0', adoptionPct: 75, surfaces: ['Counsel', 'Command', 'Sentra', 'Terra'], status: 'stable' },
  { id: 'c-6', name: 'OldDataGrid', category: 'Data Display', description: 'Legacy data grid (use DenseTable)', canonicalVersion: '1.9.9', adoptionPct: 15, surfaces: ['Command'], status: 'deprecated', deprecatedReplacement: 'DenseTable' },
  { id: 'c-7', name: 'ThreatMap', category: 'Visualization', description: 'Geospatial threat visualization map', canonicalVersion: '0.9.0', adoptionPct: 20, surfaces: ['Aegis', 'Sentra'], status: 'experimental' },
  { id: 'c-8', name: 'MetricCard', category: 'Data Display', description: 'KPI display card with sparkline', canonicalVersion: '3.1.0', adoptionPct: 90, surfaces: ['Sentra', 'Counsel', 'Pulse', 'Terra', 'Vessels', 'Aegis', 'Command', 'Carlota Jo'], status: 'stable' },
  { id: 'c-9', name: 'ActionMenu', category: 'Navigation', description: 'Contextual actions dropdown', canonicalVersion: '2.2.0', adoptionPct: 80, surfaces: ['Counsel', 'Terra', 'Command', 'Sentra'], status: 'stable' },
  { id: 'c-10', name: 'ProofLedger', category: 'Data Display', description: 'Immutable log viewer', canonicalVersion: '1.5.0', adoptionPct: 55, surfaces: ['Counsel', 'Aegis', 'Command'], status: 'stable' },
  { id: 'c-11', name: 'SignalChart', category: 'Visualization', description: 'Real-time telemetry chart', canonicalVersion: '2.0.1', adoptionPct: 65, surfaces: ['Sentra', 'Vessels', 'Pulse'], status: 'stable' },
  { id: 'c-12', name: 'EntityAvatar', category: 'Data Display', description: 'User or system actor avatar', canonicalVersion: '1.1.0', adoptionPct: 88, surfaces: ['Counsel', 'Command', 'Terra', 'Carlota Jo'], status: 'stable' },
  { id: 'c-13', name: 'CommandBar', category: 'Navigation', description: 'Omnibar for quick actions', canonicalVersion: '1.0.0', adoptionPct: 45, surfaces: ['Command', 'Pulse'], status: 'beta' },
  { id: 'c-14', name: 'LegacyModal', category: 'Feedback', description: 'Old dialog component', canonicalVersion: '2.4.0', adoptionPct: 10, surfaces: ['Terra'], status: 'deprecated', deprecatedReplacement: 'ApprovalDialog' },
  { id: 'c-15', name: 'FilterBar', category: 'Forms', description: 'Multi-attribute filter controls', canonicalVersion: '3.0.0', adoptionPct: 70, surfaces: ['Sentra', 'Terra', 'Aegis', 'Vessels'], status: 'stable' },
  { id: 'c-16', name: 'RadarPlot', category: 'Visualization', description: 'Multi-axis radar chart', canonicalVersion: '0.5.0', adoptionPct: 5, surfaces: ['Pulse'], status: 'experimental' },
  { id: 'c-17', name: 'PropertyCard', category: 'Data Display', description: 'Real estate specific summary card', canonicalVersion: '1.2.0', adoptionPct: 20, surfaces: ['Terra'], status: 'stable' },
  { id: 'c-18', name: 'VesselTracker', category: 'Visualization', description: 'Ship movement visualization', canonicalVersion: '2.0.0', adoptionPct: 15, surfaces: ['Vessels'], status: 'stable' },
  { id: 'c-19', name: 'Toast', category: 'Feedback', description: 'Temporary notification', canonicalVersion: '3.1.2', adoptionPct: 92, surfaces: ['Sentra', 'Counsel', 'Pulse', 'Terra', 'Vessels', 'Aegis', 'Command'], status: 'stable' },
  { id: 'c-20', name: 'EmptyState', category: 'Layout', description: 'Standardized empty view', canonicalVersion: '2.0.0', adoptionPct: 85, surfaces: ['Sentra', 'Counsel', 'Pulse', 'Terra', 'Vessels', 'Aegis'], status: 'stable' }
];
