// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
export type SignalKind = 'capability' | 'market' | 'threat' | 'regulation' | 'vendor' | 'benchmark';

export interface Signal {
  id: string;
  kind: SignalKind;
  title: string;
  summary: string;
  soWhat: string;
  sourceUrl: string;
  sourceName: string;
  confidence: number;
  impactScore: number;
  entities: string[];
  claims: string[];
  affectedAgents: string[];
  createdAt: string;
  scanner: string;
}

export interface KhipuNode {
  id: string;
  kind: 'concept' | 'repo' | 'paper' | 'vendor' | 'benchmark' | 'technique' | 'person';
  label: string;
  description: string;
  tags: string[];
  relevanceScore: number;
  linkedSignalCount: number;
}

export interface KhipuEdge {
  source: string;
  target: string;
  relation: 'cites' | 'implements' | 'competes-with' | 'benchmarked-on' | 'authored-by' | 'extends';
}

export interface CapabilityProposal {
  id: string;
  status: 'new' | 'accepted' | 'deferred' | 'rejected';
  title: string;
  description: string;
  rationale: string;
  targetAgent: string;
  impactArea: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  signalIds: string[];
  estimatedEffort: string;
  createdAt: string;
  updatedAt: string;
  statusReason?: string;
}

export interface Scanner {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
  status: 'healthy' | 'degraded' | 'error' | 'idle';
  signalsToday: number;
  totalSignals: number;
  errorMessage?: string;
  requiresLicense?: boolean;
}

export interface RecalibrationMemo {
  id: string;
  weekOf: string;
  title: string;
  audit: string;
  blueprint: string;
  roadmap: string;
  signalCount: number;
  proposalCount: number;
  createdAt: string;
  status?: 'draft' | 'published';
  generated?: boolean;
}

export interface BenchmarkScore {
  agentId: string;
  agentName: string;
  benchmark: string;
  score: number;
  sotaScore: number;
  delta: number;
  recordedAt: string;
}

export interface BenchmarkTimeSeries {
  agentId: string;
  agentName: string;
  benchmark: string;
  history: Array<{ date: string; score: number; sotaScore: number }>;
}
