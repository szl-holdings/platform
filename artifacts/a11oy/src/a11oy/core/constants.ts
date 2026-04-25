export const A11OY_VERSION = '0.1.0';
export const A11OY_API_VERSION = '2026-04-25';

export const VERTICALS = [
  { id: 'lyte-revenue',     label: 'Lyte Revenue',       color: '#f59e0b' },
  { id: 'vessels-maritime', label: 'Vessels Maritime',    color: '#3b82f6' },
  { id: 'terra-real-estate', label: 'Terra Real Estate',  color: '#10b981' },
  { id: 'aegis-defense',    label: 'Aegis Defense',       color: '#8b5cf6' },
  { id: 'prism-counsel',    label: 'Counsel',             color: '#6366f1' },
  { id: 'carlota-jo',       label: 'Carlota Jo',          color: '#ec4899' },
  { id: 'alloy-core',       label: 'Alloy Core',          color: '#b08d52' },
] as const;

export const FABRIC_LAYERS = [
  { id: 'coverage_graph',  label: 'Coverage Graph',  description: 'Maps which business domains are sensed and how completely' },
  { id: 'signal_mesh',     label: 'Signal Mesh',      description: 'Ingests and routes business signals across domains' },
  { id: 'state_engine',    label: 'State Engine',     description: 'Maintains authoritative current state of the enterprise' },
  { id: 'causal_core',     label: 'Causal Core',      description: 'Explains why states changed and correlates cause-effect chains' },
  { id: 'action_rail',     label: 'Action Rail',      description: 'Recommends and queues governed actions' },
  { id: 'covenant_layer',  label: 'Covenant Layer',   description: 'Enforces policies, approvals, and guardrails' },
  { id: 'proof_ledger',    label: 'Proof Ledger',     description: 'Records cryptographic proof of every decision and execution' },
] as const;

export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'] as const;

export const MAX_DEMO_SIGNALS = 150;
export const MAX_DEMO_WORKCELLS = 20;
export const CURRENT_DEMO_SIGNALS = 32;
export const CURRENT_DEMO_WORKCELLS = 5;
