export interface ExecutiveSummary {
  decisionId: string;
  workflowId: string | null;
  signalIds: string[];
  headline: string;
  situationOverview: string;
  keyFindings: Array<{
    finding: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
    evidenceRef: string | null;
  }>;
  recommendedActions: Array<{
    action: string;
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    owner: string | null;
    deadline: string | null;
  }>;
  riskSummary: {
    overallRisk: 'critical' | 'high' | 'medium' | 'low' | 'negligible';
    topRisks: string[];
    mitigationStatus: string;
  };
  metricsSnapshot: Record<string, string | number> | null;
  audienceLevel: 'board' | 'executive' | 'management' | 'operational';
  confidence: number;
  evidenceRefs: string[];
  modelRoute: string;
  schemaVersion: '1.0.0';
  createdAt: string;
}

const VALID_AUDIENCE_LEVELS = ['board', 'executive', 'management', 'operational'];

export function validateExecutiveSummary(obj: unknown): obj is ExecutiveSummary {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.decisionId === 'string' &&
    o.decisionId.length > 0 &&
    Array.isArray(o.signalIds) &&
    typeof o.headline === 'string' &&
    o.headline.length > 0 &&
    typeof o.situationOverview === 'string' &&
    Array.isArray(o.keyFindings) &&
    Array.isArray(o.recommendedActions) &&
    typeof o.audienceLevel === 'string' &&
    VALID_AUDIENCE_LEVELS.includes(o.audienceLevel as string) &&
    typeof o.confidence === 'number' &&
    o.confidence >= 0 &&
    o.confidence <= 1 &&
    o.riskSummary !== null &&
    typeof o.riskSummary === 'object' &&
    Array.isArray(o.evidenceRefs) &&
    typeof o.modelRoute === 'string' &&
    o.schemaVersion === '1.0.0' &&
    typeof o.createdAt === 'string'
  );
}
