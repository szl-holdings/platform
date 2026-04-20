export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'none';
export type Trend = 'up' | 'down' | 'flat';
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'auto-executed' | 'blocked';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface CausalEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  domain: string;
  domainColor: string;
  severity?: Severity;
  causeOf?: string[];
  causedBy?: string[];
  metric?: string;
  delta?: string;
  owner?: string;
}

export interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  trend?: Trend;
  causalExplanation?: string;
  target?: string | number;
  domain?: string;
  domainColor?: string;
  severity?: 'good' | 'warn' | 'bad';
}

export interface Recommendation {
  id: string;
  rank: number;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  domain?: string;
  domainColor?: string;
  why: string;
  signals?: string[];
  action?: string;
  owner?: string;
  status?: 'new' | 'acknowledged' | 'in-progress' | 'done';
}

export interface RiskItem {
  id: string;
  title: string;
  domain: string;
  domainColor: string;
  probability: number;
  impact: number;
  level: RiskLevel;
  mitigation?: string;
  owner?: string;
  trend?: Trend;
}

export interface OpportunityItem {
  id: string;
  title: string;
  domain: string;
  domainColor: string;
  probability: number;
  value: number;
  level: 'high' | 'medium' | 'low';
  action?: string;
  owner?: string;
}

export interface ValueEntry {
  id: string;
  label: string;
  amount: number;
  currency?: string;
  type: 'at-risk' | 'protected' | 'created';
  domain?: string;
  domainColor?: string;
  description?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  status: ActionStatus;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  requiredBy?: string;
  owner?: string;
  domain?: string;
  domainColor?: string;
  approver?: string;
  blockedReason?: string;
  financialExposure?: string;
}
