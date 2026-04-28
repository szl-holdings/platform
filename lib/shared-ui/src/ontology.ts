export type SignalSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SignalSource =
  | 'api'
  | 'webhook'
  | 'agent'
  | 'manual'
  | 'scheduled'
  | 'realtime'
  | 'ingestion';
export type ConfidenceLevel = 'verified' | 'high' | 'medium' | 'low' | 'unverified';
export type FreshnessWindow = 'realtime' | 'minutes' | 'hourly' | 'daily' | 'stale' | 'unknown';
export type WorkflowState =
  | 'pending'
  | 'active'
  | 'awaiting_approval'
  | 'escalated'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';
export type ActionType =
  | 'remediate'
  | 'approve'
  | 'escalate'
  | 'assign'
  | 'investigate'
  | 'dismiss'
  | 'defer'
  | 'automate';
export type BusinessImpact =
  | 'revenue'
  | 'compliance'
  | 'operational'
  | 'reputational'
  | 'security'
  | 'none';

export interface SZLSignal {
  id: string;
  title: string;
  source: SignalSource;
  severity: SignalSeverity;
  confidence: ConfidenceLevel;
  freshness: FreshnessWindow;
  timestamp: string;
  platform: 'lyte' | 'aegis' | 'terra' | 'vessels' | 'continuum';
  owner?: string;
  businessImpact?: BusinessImpact;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

export interface SZLRisk {
  id: string;
  signalIds: string[];
  title: string;
  severity: SignalSeverity;
  businessImpact: BusinessImpact;
  owner?: string;
  estimatedExposure?: string;
  mitigationStatus: 'unmitigated' | 'partial' | 'mitigated' | 'accepted';
  lastAssessedAt: string;
}

export interface SZLAction {
  id: string;
  type: ActionType;
  title: string;
  description?: string;
  riskId?: string;
  signalId?: string;
  assignee?: string;
  state: WorkflowState;
  priority: SignalSeverity;
  createdAt: string;
  dueAt?: string;
  completedAt?: string;
}

export interface SZLOutcome {
  id: string;
  actionId: string;
  result: 'resolved' | 'partially_resolved' | 'failed' | 'deferred' | 'accepted_risk';
  summary: string;
  resolvedAt: string;
  resolvedBy?: string;
  businessValueRecovered?: string;
  lessonLearned?: string;
}

export interface DataProvenanceInfo {
  source: string;
  lastUpdated: string;
  freshness: FreshnessWindow;
  confidence: ConfidenceLevel;
  dataState: 'live' | 'demo' | 'simulated' | 'cached';
  owner?: string;
  nextRefresh?: string;
}

export const SEVERITY_CONFIG: Record<SignalSeverity, { label: string; color: string; bg: string }> =
  {
    critical: { label: 'Critical', color: '#c45a4a', bg: 'rgba(239,68,68,0.12)' },
    high: { label: 'High', color: '#d4a054', bg: 'rgba(245,158,11,0.12)' },
    medium: { label: 'Medium', color: '#4a90b8', bg: 'rgba(59,130,246,0.12)' },
    low: { label: 'Low', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
    info: { label: 'Info', color: '#8b7ac8', bg: 'rgba(139,92,246,0.12)' },
  };

export const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; color: string }> = {
  verified: { label: 'Verified', color: '#6b8f71' },
  high: { label: 'High Confidence', color: '#6b8f71' },
  medium: { label: 'Medium Confidence', color: '#d4a054' },
  low: { label: 'Low Confidence', color: '#c45a4a' },
  unverified: { label: 'Unverified', color: '#6b7280' },
};

export const FRESHNESS_CONFIG: Record<FreshnessWindow, { label: string; color: string }> = {
  realtime: { label: 'Real-time', color: '#6b8f71' },
  minutes: { label: '< 5 min', color: '#6b8f71' },
  hourly: { label: 'Hourly', color: '#4a90b8' },
  daily: { label: 'Daily', color: '#d4a054' },
  stale: { label: 'Stale', color: '#c45a4a' },
  unknown: { label: 'Unknown', color: '#6b7280' },
};
