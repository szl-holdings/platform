export type DomainId = 'aegis' | 'terra' | 'vessels' | 'lyte' | 'prism' | 'carlota';

export type RiskActionState = {
  type: 'playbook' | 'ticket';
  status: 'running' | 'done';
  result?: string;
  ticketId?: string;
  ticketUrl?: string;
  at?: string;
  actor?: string;
};

export type OppDecision = {
  decision: 'accept' | 'reject' | 'snooze';
  reason?: string;
  snoozeUntil?: string;
  at: string;
  actor?: string;
};

export type RecDecision = {
  decision: 'accept' | 'reject' | 'snooze';
  reason?: string;
  snoozeUntil?: string;
  at: string;
  actor?: string;
};

export type RiskLinearOverride = { teamKey?: string | null; labels?: string[] };

export type LinearTeamOption = { id: string; key: string; name: string };

export interface ActionStore {
  riskOwners: Record<string, string>;
  riskActions: Record<string, RiskActionState>;
  oppDecisions: Record<string, OppDecision>;
  recDecisions: Record<string, RecDecision>;
  riskLinearOverrides: Record<string, RiskLinearOverride>;
}

export type ActionStorePatch = Partial<{
  riskOwners: Record<string, string | null>;
  riskActions: Record<string, RiskActionState | null>;
  oppDecisions: Record<string, OppDecision | null>;
  recDecisions: Record<string, RecDecision | null>;
  riskLinearOverrides: Record<string, RiskLinearOverride | null>;
}>;

export type ToastMsg = { id: number; text: string; type: 'success' | 'info' | 'error' };

export type LiveKpi = {
  id: string;
  domain: string;
  name: string;
  current: string;
  target: string;
  status: string;
  trend: 'up' | 'down' | 'flat';
  causal: string;
};

export type LiveRisk = {
  id: string;
  title: string;
  domain: string;
  probability: number;
  impact: string;
  level: string;
  owner: string;
  mitigation: string;
  trend: 'up' | 'down' | 'flat';
};

export type LiveOpp = {
  id: string;
  title: string;
  domain: string;
  probability: number;
  value: string;
  level: string;
  action: string;
  owner: string;
};

export type LiveValueItem = {
  id: string;
  type: 'at-risk' | 'protected' | 'created';
  label: string;
  amount: number;
  domain: string;
  note: string;
};

export type LivePolicy = {
  id: string;
  title: string;
  status: string;
  owner: string;
  domains: string[];
  lastReview: string;
  enforcement: string;
};

export type LiveAgent = {
  id: string;
  agent: string;
  domain: string;
  trustScore: number;
  accuracy: number;
  actionsExecuted: number;
  humanOverrides: number;
  status: string;
};

export type LiveExecHealth = {
  score: number;
  delta: string;
  trend: 'up' | 'down';
  exposure: string;
  topIssues: { title: string; severity: string; domain: string }[];
  topOpps: { title: string; value: string; domain: string }[];
  blockedActions: { title: string; reason: string; exposure: string }[];
  changesYesterday: string[];
  changesLastWeek: string[];
};

export type LiveBusinessState = {
  execHealth: LiveExecHealth;
  kpiHealth: LiveKpi[];
  riskRegister: LiveRisk[];
  oppRegister: LiveOpp[];
  valueLedger: LiveValueItem[];
  policiesSummary: LivePolicy[];
  agentTrust: LiveAgent[];
  summary: { compositeScore: number; slaBreaching: number; firingAlerts: number };
  generatedAt: string;
  dataSource: string;
};

export type ModuleId =
  | 'exec'
  | 'kpi'
  | 'flow'
  | 'risk'
  | 'opp'
  | 'policy'
  | 'value'
  | 'workflow'
  | 'agent'
  | 'log';

export type LogEntry = {
  key: string;
  at: string;
  category: 'Risk' | 'Opportunity' | 'Recommendation';
  title: string;
  decision: string;
  decisionColor: string;
  reason?: string;
  detail?: string;
  actor: string;
};
