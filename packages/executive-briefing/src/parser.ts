
import {
  type Citation,
  type StructuredExecutiveBrief,
  StructuredExecutiveBriefSchema,
} from './types.js';

interface RawBriefJson {
  headline?: unknown;
  situation?: unknown;
  whatWeBelieve?: unknown;
  whatWeRecommend?: unknown;
  autonomyTier?: unknown;
  confidence?: unknown;
  overallRisk?: unknown;
  gaps?: unknown;
  sections?: unknown;
}

export interface ParseResult {
  success: true;
  brief: Omit<
    StructuredExecutiveBrief,
    'id' | 'generatedAt' | 'verifierStatus' | 'verifierFeedback' | 'sourceTraceIds' | 'briefingId'
  >;
}

export interface ParseError {
  success: false;
  error: string;
  raw?: string;
}

export function parseBriefResponse(
  aiContent: string,
  domain: string,
  citations: Citation[],
  entityProvenance: StructuredExecutiveBrief['entityProvenance'],
): ParseResult | ParseError {
  let raw = aiContent.trim();

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) raw = fenceMatch[1]?.trim();

  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    return {
      success: false,
      error: 'No JSON object found in AI response',
      raw: aiContent.slice(0, 500),
    };
  }
  raw = raw.slice(jsonStart, jsonEnd + 1);

  let parsed: RawBriefJson;
  try {
    parsed = JSON.parse(raw) as RawBriefJson;
  } catch (e) {
    return {
      success: false,
      error: `JSON parse error: ${e instanceof Error ? e.message : String(e)}`,
      raw: raw.slice(0, 500),
    };
  }

  const headline =
    typeof parsed.headline === 'string'
      ? parsed.headline.slice(0, 180)
      : `${domain} executive brief`;
  const situation =
    typeof parsed.situation === 'string' ? parsed.situation : 'Situation assessment pending.';
  const autonomyTier = isValidAutonomyTier(parsed.autonomyTier)
    ? parsed.autonomyTier
    : 'human-in-the-loop';
  const confidence =
    typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.7;
  const overallRisk = isValidRisk(parsed.overallRisk) ? parsed.overallRisk : 'MEDIUM';

  const whatWeBelieve = Array.isArray(parsed.whatWeBelieve)
    ? (parsed.whatWeBelieve as unknown[]).map((b, i) => sanitizeBelief(b, i))
    : [];

  const whatWeRecommend = Array.isArray(parsed.whatWeRecommend)
    ? (parsed.whatWeRecommend as unknown[]).map((r, i) => sanitizeRecommendation(r, i))
    : [];

  const sections = Array.isArray(parsed.sections)
    ? (parsed.sections as unknown[]).map((s, i) => sanitizeSection(s, i, domain))
    : [];

  const result: Omit<
    StructuredExecutiveBrief,
    'id' | 'generatedAt' | 'verifierStatus' | 'verifierFeedback' | 'sourceTraceIds' | 'briefingId'
  > = {
    domain,
    headline,
    situation,
    whatWeBelieve,
    whyCitations: citations,
    whatWeRecommend,
    autonomyTier,
    confidence,
    overallRisk,
    entityProvenance,
    sections,
  };

  const validated = StructuredExecutiveBriefSchema.omit({
    id: true,
    generatedAt: true,
    verifierStatus: true,
    verifierFeedback: true,
    sourceTraceIds: true,
    briefingId: true,
  }).safeParse(result);

  if (!validated.success) {
    return {
      success: false,
      error: `Schema validation failed: ${validated.error.message}`,
      raw: raw.slice(0, 300),
    };
  }

  return { success: true, brief: validated.data };
}

function isValidAutonomyTier(
  v: unknown,
): v is 'human-approval-mandatory' | 'human-in-the-loop' | 'supervised-autonomy' | 'full-autonomy' {
  return (
    typeof v === 'string' &&
    [
      'human-approval-mandatory',
      'human-in-the-loop',
      'supervised-autonomy',
      'full-autonomy',
    ].includes(v)
  );
}

function isValidRisk(v: unknown): v is 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  return typeof v === 'string' && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(v);
}

function isValidPriority(v: unknown): v is 'P0' | 'P1' | 'P2' | 'P3' {
  return typeof v === 'string' && ['P0', 'P1', 'P2', 'P3'].includes(v);
}

function isValidRiskLevel(v: unknown): v is 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  return isValidRisk(v);
}

function sanitizeBelief(b: unknown, idx: number) {
  const obj = (b && typeof b === 'object' ? b : {}) as Record<string, unknown>;
  return {
    id: typeof obj.id === 'string' ? obj.id : `b-${String(idx + 1).padStart(3, '0')}`,
    claim: typeof obj.claim === 'string' ? obj.claim : 'Belief claim not specified.',
    confidence:
      typeof obj.confidence === 'number' ? Math.max(0, Math.min(1, obj.confidence)) : 0.6,
    citationIds: Array.isArray(obj.citationIds)
      ? (obj.citationIds as string[]).filter((s) => typeof s === 'string')
      : [],
    supported: obj.supported !== false,
    caveats: Array.isArray(obj.caveats)
      ? (obj.caveats as string[]).filter((s) => typeof s === 'string')
      : [],
  };
}

function sanitizeRecommendation(r: unknown, idx: number) {
  const obj = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>;
  return {
    id: typeof obj.id === 'string' ? obj.id : `r-${String(idx + 1).padStart(3, '0')}`,
    priority: isValidPriority(obj.priority) ? obj.priority : 'P2',
    action: typeof obj.action === 'string' ? obj.action : 'Action not specified.',
    rationale: typeof obj.rationale === 'string' ? obj.rationale : '',
    owner: typeof obj.owner === 'string' ? obj.owner : undefined,
    dueBy: typeof obj.dueBy === 'string' ? obj.dueBy : undefined,
    autonomyTier: isValidAutonomyTier(obj.autonomyTier)
      ? obj.autonomyTier
      : 'human-in-the-loop',
    citationIds: Array.isArray(obj.citationIds)
      ? (obj.citationIds as string[]).filter((s) => typeof s === 'string')
      : [],
  };
}

function sanitizeSection(s: unknown, idx: number, defaultDomain: string) {
  const obj = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>;
  const beliefs = Array.isArray(obj.beliefs)
    ? (obj.beliefs as unknown[]).map((b, i) => sanitizeBelief(b, i))
    : [];
  return {
    id: typeof obj.id === 'string' ? obj.id : `sec-${String(idx + 1).padStart(3, '0')}`,
    domain: typeof obj.domain === 'string' ? obj.domain : defaultDomain,
    title: typeof obj.title === 'string' ? obj.title : `Section ${idx + 1}`,
    agentId: typeof obj.agentId === 'string' ? obj.agentId : 'FORGE',
    situation: typeof obj.situation === 'string' ? obj.situation : '',
    beliefs,
    gaps: Array.isArray(obj.gaps)
      ? (obj.gaps as string[]).filter((g) => typeof g === 'string')
      : [],
    confidence:
      typeof obj.confidence === 'number' ? Math.max(0, Math.min(1, obj.confidence)) : 0.6,
    riskLevel: isValidRiskLevel(obj.riskLevel) ? obj.riskLevel : 'MEDIUM',
    freshness: typeof obj.freshness === 'string' ? obj.freshness : 'Unknown',
  };
}
