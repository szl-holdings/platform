/**
 * Cross-Case Pattern Detection
 *
 * After each case decision, scans recent case memory for recurring themes:
 * - Same attack vector (inferred from decision type + content keywords)
 * - Same impacted scope (asset class / department / domain)
 * - Same risk level (critical/high/medium)
 * - Same decision type cluster (triage / escalation / risk)
 * - Approval gap pattern (humanReviewRequired across cases)
 *
 * Surfaces pattern alerts as new memory facts so the shared context layer
 * can inform future decisions. Facts carry importance=9 and 7-day TTL.
 */
import { agentMemoryFacts, db } from '@szl-holdings/db';
import type { CaseMemoryEntry } from '../tradecraft/case-memory.js';

const PATTERN_WINDOW = 10;
const PATTERN_THRESHOLD = 3;

interface PatternCandidate {
  dimension: string;
  value: string;
  count: number;
  caseIds: string[];
  significance: 'high' | 'medium' | 'low';
  summary: string;
}

const ATTACK_VECTOR_KEYWORDS: Record<string, string[]> = {
  phishing: ['phish', 'credential', 'spear', 'email', 'social_engineering', 'bec'],
  lateral_movement: ['lateral', 'pivot', 'spread', 'network_propagation'],
  ransomware: ['ransom', 'encrypt', 'wiper', 'extort', 'lockbit', 'blackcat'],
  data_exfiltration: [
    'exfil',
    'exfiltrat',
    'steal',
    'upload',
    'c2',
    'command_control',
    'data_loss',
  ],
  privilege_escalation: ['privilege', 'escalat', 'root', 'admin', 'sudo', 'elevation'],
  supply_chain: ['supply_chain', 'third_party', 'vendor', 'dependency', 'package'],
  insider: ['insider', 'rogue', 'disgruntled', 'employee'],
  zero_day: ['zero_day', '0day', 'cve', 'exploit', 'patch'],
  vulnerability: ['vuln', 'misconfigur', 'exposed', 'unpatched', 'hardening'],
  ddos: ['ddos', 'denial_of_service', 'flood', 'amplification'],
};

const SCOPE_KEYWORDS: Record<string, string[]> = {
  cloud_infra: ['azure', 'aws', 'cloud', 'kubernetes', 'container', 's3'],
  endpoint: ['endpoint', 'workstation', 'laptop', 'desktop', 'edr'],
  network: ['network', 'firewall', 'router', 'switch', 'vpn', 'dns'],
  identity: ['identity', 'iam', 'sso', 'mfa', 'active_directory', 'ldap'],
  data: ['database', 'storage', 'data_lake', 'data_warehouse', 'pii', 'sensitive'],
  email: ['email', 'exchange', 'outlook', 'smtp', 'mail'],
  production: ['production', 'prod', 'live', 'critical_system'],
};

function extractAttackVector(text: string): string | null {
  const lower = text.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  for (const [vector, keywords] of Object.entries(ATTACK_VECTOR_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return vector;
  }
  return null;
}

function extractScope(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [scope, keywords] of Object.entries(SCOPE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return scope;
  }
  return null;
}

function extractDimensions(entry: CaseMemoryEntry): Record<string, string[]> {
  const dims: Record<string, string[]> = {
    riskLevel: [],
    decisionType: [],
    attackVector: [],
    affectedScope: [],
    approvalRequired: [],
    humanReviewRequired: [],
  };

  const caseText = entry.decisions
    .map(
      (d) => `${d.decisionType} ${d.summary} ${d.recommendedAction} ${d.gapsAndUnknowns.join(' ')}`,
    )
    .join(' ');
  const noteText = entry.analystNotes.map((n) => n.content).join(' ');
  const allText = `${caseText} ${noteText}`;

  for (const d of entry.decisions) {
    if (d.impactLevel) dims.riskLevel?.push(d.impactLevel);
    if (d.decisionType) dims.decisionType?.push(d.decisionType);
    if (d.approvalRequired) dims.approvalRequired?.push('approval_required');
    if (d.humanReviewRequired) dims.humanReviewRequired?.push('human_review_required');
  }

  const vector = extractAttackVector(allText);
  if (vector) dims.attackVector?.push(vector);

  const scope = extractScope(allText);
  if (scope) dims.affectedScope?.push(scope);

  return dims;
}

export async function detectCrossPatterns(
  recentCases: CaseMemoryEntry[],
): Promise<PatternCandidate[]> {
  const windowCases = recentCases.slice(-PATTERN_WINDOW);
  if (windowCases.length < PATTERN_THRESHOLD) return [];

  const dimensionCounts: Record<string, Record<string, { count: number; cases: string[] }>> = {};

  for (const entry of windowCases) {
    const dims = extractDimensions(entry);
    for (const [dimension, values] of Object.entries(dims)) {
      if (!dimensionCounts[dimension]) dimensionCounts[dimension] = {};
      for (const value of values) {
        if (!value) continue;
        if (!dimensionCounts[dimension]?.[value]) {
          dimensionCounts[dimension]![value] = { count: 0, cases: [] };
        }
        if (!dimensionCounts[dimension]?.[value]?.cases.includes(entry.caseId)) {
          const bucket = dimensionCounts[dimension]![value]!;
          bucket.count++;
          bucket.cases.push(entry.caseId);
        }
      }
    }
  }

  const patterns: PatternCandidate[] = [];
  for (const [dimension, values] of Object.entries(dimensionCounts)) {
    for (const [value, { count, cases }] of Object.entries(values)) {
      if (count < PATTERN_THRESHOLD) continue;
      const ratio = count / windowCases.length;
      const significance: PatternCandidate['significance'] =
        ratio >= 0.7 ? 'high' : ratio >= 0.5 ? 'medium' : 'low';

      let summary = `${count}/${windowCases.length} recent cases share ${dimension}="${value}"`;
      if (dimension === 'attackVector') {
        summary = `Recurring attack vector detected: "${value}" appears in ${count} of last ${windowCases.length} cases — possible campaign or systematic exploitation`;
      } else if (dimension === 'affectedScope') {
        summary = `Repeated scope impact: "${value}" affected in ${count} of last ${windowCases.length} cases — targeted area may require hardening`;
      } else if (dimension === 'riskLevel') {
        summary = `${count} consecutive ${value}-risk decisions — risk level concentration may indicate systemic threat`;
      } else if (dimension === 'approvalRequired' || dimension === 'humanReviewRequired') {
        summary = `${count} cases require ${value.replace(/_/g, ' ')} — governance workload concentration detected`;
      }

      patterns.push({ dimension, value, count, caseIds: cases, significance, summary });
    }
  }

  return patterns.sort((a, b) => b.count - a.count);
}

export async function runPatternDetectionAndStore(allCases: CaseMemoryEntry[]): Promise<void> {
  try {
    const patterns = await detectCrossPatterns(allCases);
    if (patterns.length === 0) return;

    for (const pattern of patterns) {
      const importanceBySignificance: Record<string, number> = { high: 9, medium: 7, low: 5 };
      const importance = importanceBySignificance[pattern.significance] ?? 6;

      await db
        .insert(agentMemoryFacts)
        .values({
          agentId: 'alloy',
          domain: 'orchestration',
          factType: 'pattern_alert',
          content: pattern.summary,
          importance,
          tags: ['cross_case_pattern', pattern.dimension, pattern.value, pattern.significance],
          retrievalCount: 0,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        .onConflictDoNothing();
    }
  } catch (_err) {
  }
}
