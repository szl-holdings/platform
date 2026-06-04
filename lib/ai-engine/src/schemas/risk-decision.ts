export interface RiskDecision {
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'negligible';
  riskScore: number;
  category: string;
  description: string;
  affectedAssets: string[];
  mitigationSteps: Array<{ step: string; priority: number; owner: string | null }>;
  escalationRequired: boolean;
  evidence: Array<{ source: string; content: string; relevanceScore: number }>;
  confidence: number;
}

export const RISK_DECISION_SCHEMA = {
  type: 'object',
  required: ['riskLevel', 'riskScore', 'category', 'description', 'confidence'],
  properties: {
    riskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'negligible'] },
    riskScore: { type: 'number', minimum: 0, maximum: 100 },
    category: { type: 'string' },
    description: { type: 'string' },
    affectedAssets: { type: 'array', items: { type: 'string' } },
    mitigationSteps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          step: { type: 'string' },
          priority: { type: 'number' },
          owner: { type: 'string', nullable: true },
        },
      },
    },
    escalationRequired: { type: 'boolean' },
    evidence: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          content: { type: 'string' },
          relevanceScore: { type: 'number' },
        },
      },
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
} as const;

export function validateRiskDecision(raw: unknown): {
  valid: boolean;
  decision: RiskDecision | null;
  errors: string[];
} {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object')
    return { valid: false, decision: null, errors: ['Not an object'] };
  const obj = raw as Record<string, unknown>;
  if (!['critical', 'high', 'medium', 'low', 'negligible'].includes(obj.riskLevel as string))
    errors.push('Invalid riskLevel');
  if (typeof obj.riskScore !== 'number') errors.push('Missing riskScore');
  if (typeof obj.category !== 'string') errors.push('Missing category');
  if (typeof obj.description !== 'string') errors.push('Missing description');
  if (typeof obj.confidence !== 'number') errors.push('Missing confidence');
  if (errors.length > 0) return { valid: false, decision: null, errors };
  return {
    valid: true,
    decision: {
      riskLevel: obj.riskLevel as RiskDecision['riskLevel'],
      riskScore: obj.riskScore as number,
      category: obj.category as string,
      description: obj.description as string,
      affectedAssets: (obj.affectedAssets as string[]) || [],
      mitigationSteps: (obj.mitigationSteps as RiskDecision['mitigationSteps']) || [],
      escalationRequired: (obj.escalationRequired as boolean) || false,
      evidence: (obj.evidence as RiskDecision['evidence']) || [],
      confidence: obj.confidence as number,
    },
    errors: [],
  };
}
