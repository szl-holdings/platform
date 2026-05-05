export type RecDecision = {
  decision: 'accept' | 'reject' | 'snooze';
  reason?: string;
  snoozeUntil?: string;
  at: string;
  actor?: string;
};

export interface ActionStore {
  riskOwners: Record<string, string>;
  riskActions: Record<
    string,
    {
      type: string;
      status: string;
      result?: string;
      ticketId?: string;
      at?: string;
      actor?: string;
    }
  >;
  oppDecisions: Record<
    string,
    { decision: string; reason?: string; snoozeUntil?: string; at: string; actor?: string }
  >;
  recDecisions: Record<string, RecDecision>;
}

export type ActionStorePatch = Partial<{
  riskOwners: Record<string, string | null>;
  riskActions: Record<string, ActionStore['riskActions'][string] | null>;
  oppDecisions: Record<string, ActionStore['oppDecisions'][string] | null>;
  recDecisions: Record<string, RecDecision | null>;
}>;

export type LiveKpiBoard = {
  id: string;
  label: string;
  value: string | number;
  unit: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  color: string;
  causal: string;
};

export type LiveCausalEvent = {
  id: string;
  time: string;
  domain: string;
  title: string;
  description: string;
  severity: string;
  causedBy: string[];
  causeOf: string[];
};

export type LiveRecommendation = {
  id: string;
  rank: number;
  title: string;
  domain: string;
  impact: string;
  effort: string;
  why: string;
  signals: string[];
  action: string;
};

export type LiveAction = {
  id: string;
  title: string;
  domain: string;
  priority: string;
  status: string;
  owner: string;
  approver: string;
  due: string;
  exposure: string;
  description: string;
  blockedReason?: string;
};

export type LiveHeatmapRisk = {
  id: string;
  title: string;
  domain: string;
  domainColor: string;
  probability: number;
  impact: number;
  level: string;
  mitigation: string;
  owner: string;
};

export type LiveHeatmapOpp = {
  id: string;
  title: string;
  domain: string;
  domainColor: string;
  probability: number;
  valueScore: number;
  level: string;
  action: string;
  owner: string;
};

export type LiveCrossDomainImpact = {
  source: string;
  target: string;
  label: string;
  type: 'risk' | 'positive' | 'neutral';
};

export type LiveEnterpriseState = {
  stateBoardKpis: LiveKpiBoard[];
  causalEvents: LiveCausalEvent[];
  recommendations: LiveRecommendation[];
  actions: LiveAction[];
  heatmapRisks: LiveHeatmapRisk[];
  heatmapOpps: LiveHeatmapOpp[];
  crossDomainImpacts: LiveCrossDomainImpact[];
  generatedAt: string;
  dataSource: string;
};
