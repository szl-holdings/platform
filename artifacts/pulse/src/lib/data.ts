export type ConfidenceLevel = 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type DomainKey =
  | 'maritime'
  | 'security'
  | 'real_estate'
  | 'legal'
  | 'financial'
  | 'platform'
  | 'executive';

export interface Agent {
  id: string;
  name: string;
  domain: DomainKey;
  color: string;
  borderColor: string;
  bgColor: string;
}

export const AGENTS: Record<string, Agent> = {
  helmsman: {
    id: 'helmsman',
    name: 'Helmsman',
    domain: 'maritime',
    color: '#5090e8',
    borderColor: 'rgba(80,144,232,0.4)',
    bgColor: 'rgba(80,144,232,0.1)',
  },
  sentinel: {
    id: 'sentinel',
    name: 'Sentinel',
    domain: 'security',
    color: '#e05050',
    borderColor: 'rgba(224,80,80,0.4)',
    bgColor: 'rgba(224,80,80,0.1)',
  },
  terra: {
    id: 'terra',
    name: 'Terra',
    domain: 'real_estate',
    color: '#4eca8b',
    borderColor: 'rgba(78,202,139,0.4)',
    bgColor: 'rgba(78,202,139,0.1)',
  },
  lexis: {
    id: 'lexis',
    name: 'Lexis',
    domain: 'legal',
    color: '#9b70e8',
    borderColor: 'rgba(155,112,232,0.4)',
    bgColor: 'rgba(155,112,232,0.1)',
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    domain: 'financial',
    color: '#e08c40',
    borderColor: 'rgba(224,140,64,0.4)',
    bgColor: 'rgba(224,140,64,0.1)',
  },
  lyte: {
    id: 'lyte',
    name: 'Lyte',
    domain: 'platform',
    color: '#40c8d8',
    borderColor: 'rgba(64,200,216,0.4)',
    bgColor: 'rgba(64,200,216,0.1)',
  },
  alloy: {
    id: 'alloy',
    name: 'Counsel',
    domain: 'executive',
    color: '#c8a84b',
    borderColor: 'rgba(200,168,75,0.4)',
    bgColor: 'rgba(200,168,75,0.1)',
  },
};

export interface BriefingSection {
  id: string;
  title: string;
  agentId: string;
  confidence: number;
  confidenceLabel: ConfidenceLevel;
  riskLevel: RiskLevel;
  keyJudgment: string;
  narrative: string[];
  keyFindings: Array<{ finding: string; severity: RiskLevel }>;
  assumptions: string[];
  gaps: string[];
  lastUpdated: string;
}

export interface Briefing {
  id: string;
  date: string;
  edition: string;
  classification: string;
  status: 'published' | 'draft' | 'archived';
  overallRisk: RiskLevel;
  overallConfidence: number;
  headline: string;
  leadSentence: string;
  domains: DomainKey[];
  sections: BriefingSection[];
  recommendedActions: Array<{
    action: string;
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    owner: string;
    rationale: string;
    dueBy: string;
  }>;
  generatedAt: string;
  retrievalSource?: 'adapter' | 'synthetic' | 'inline' | 'dry-run';
  retrievalAdapterId?: string | null;
}

export interface DissentRecord {
  id: string;
  briefingId: string;
  sectionId: string;
  sectionTitle: string;
  dissentingView: string;
  basis: string;
  filedBy: string;
  filedAt: string;
  status: 'open' | 'under_review' | 'acknowledged' | 'resolved';
  resolution?: string;
  resolvedAt?: string;
  impactIfCorrect: string;
}

export interface CustomBriefRequest {
  id: string;
  topic: string;
  entity?: string;
  scenario?: string;
  domains: DomainKey[];
  agents: string[];
  requestedAt: string;
  status: 'pending' | 'generating' | 'complete' | 'failed';
  briefingId?: string;
}

export function getConfidenceLabel(score: number): ConfidenceLevel {
  if (score >= 0.75) return 'HIGH';
  if (score >= 0.5) return 'MODERATE';
  if (score >= 0.25) return 'LOW';
  return 'INSUFFICIENT';
}

export function getConfidenceClass(label: ConfidenceLevel): string {
  switch (label) {
    case 'HIGH':
      return 'conf-high';
    case 'MODERATE':
      return 'conf-moderate';
    case 'LOW':
      return 'conf-low';
    case 'INSUFFICIENT':
      return 'conf-low';
  }
}

export function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'CRITICAL':
      return '#e05050';
    case 'HIGH':
      return '#e08c40';
    case 'MEDIUM':
      return '#c8a84b';
    case 'LOW':
      return '#4eca8b';
  }
}
