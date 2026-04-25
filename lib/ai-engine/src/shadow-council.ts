/**
 * Adversarial Shadow Council — The Contrarian
 *
 * Every high-stakes output is automatically challenged by an adversarial red-team
 * agent ("Contrarian") that tries to find logical flaws, data gaps, biased
 * assumptions, or regulatory risks before the result reaches the user.
 *
 * If the Contrarian finds issues above a severity threshold, the output is revised
 * before delivery. All challenges and outcomes are logged for the flywheel.
 */

import type { HFChatMessage } from './providers/hf-client.js';

export type ContrarianSeverity = 'none' | 'minor' | 'moderate' | 'major' | 'critical';

export interface ContrarianChallenge {
  challengeId: string;
  targetOutputId: string;
  domain: string;
  logicalFlaws: string[];
  dataGaps: string[];
  biasedAssumptions: string[];
  regulatoryRisks: string[];
  severity: ContrarianSeverity;
  severityScore: number;
  recommendation: 'pass' | 'warn' | 'revise' | 'block';
  challengeText: string;
  timestamp: string;
}

export interface ShadowCouncilResult {
  sessionId: string;
  originalContent: string;
  challenge: ContrarianChallenge;
  wasRevised: boolean;
  revisedContent: string;
  revisionRationale: string;
  totalLatencyMs: number;
}

type LlmChallengerCaller = (messages: HFChatMessage[], maxTokens: number) => Promise<{
  content: string;
  latencyMs: number;
}>;

let _challengerCaller: LlmChallengerCaller | null = null;

export function setShadowCouncilCaller(fn: LlmChallengerCaller): void {
  _challengerCaller = fn;
}

const CHALLENGE_SEVERITY_THRESHOLD: Record<ContrarianSeverity, number> = {
  none: 0,
  minor: 0.2,
  moderate: 0.4,
  major: 0.65,
  critical: 0.85,
};

const REVISION_THRESHOLD = 'moderate';

function buildContrarianPrompt(
  originalContent: string,
  domain: string,
  originalQuery: string,
): HFChatMessage[] {
  return [
    {
      role: 'system',
      content: `You are the Contrarian — an adversarial red-team agent within the Sovereign Intelligence platform.
Your role is to rigorously challenge AI-generated outputs to find weaknesses BEFORE they reach users.

You must identify:
1. **Logical flaws** — Where the reasoning is invalid, circular, or makes unsupported leaps
2. **Data gaps** — Missing information, unverified claims, or stale data that could invalidate conclusions
3. **Biased assumptions** — Hidden biases, framing effects, or one-sided perspectives
4. **Regulatory risks** — Compliance exposure, legal liability, or regulatory violations in the content

Respond ONLY in the following JSON format:
{
  "logicalFlaws": ["..."],
  "dataGaps": ["..."],
  "biasedAssumptions": ["..."],
  "regulatoryRisks": ["..."],
  "overallSeverity": "none|minor|moderate|major|critical",
  "recommendation": "pass|warn|revise|block",
  "summary": "..."
}`,
    },
    {
      role: 'user',
      content: `## Domain: ${domain}
## Original Query
${originalQuery.slice(0, 400)}

## Output to Challenge
${originalContent.slice(0, 3000)}`,
    },
  ];
}

function buildRevisionPrompt(
  originalContent: string,
  challenge: ContrarianChallenge,
  originalQuery: string,
): HFChatMessage[] {
  const issues = [
    ...challenge.logicalFlaws.map((f) => `Logical flaw: ${f}`),
    ...challenge.dataGaps.map((g) => `Data gap: ${g}`),
    ...challenge.biasedAssumptions.map((b) => `Bias: ${b}`),
    ...challenge.regulatoryRisks.map((r) => `Regulatory risk: ${r}`),
  ].join('\n');

  return [
    {
      role: 'system',
      content: `You are a revision agent. A Contrarian review found issues in a generated output. 
Your task: Produce a corrected version that addresses the identified issues while preserving the valid substance of the original.
- Fix logical flaws
- Acknowledge data gaps with appropriate caveats
- Remove or hedge biased assumptions
- Flag regulatory risks with explicit disclaimers
Be direct. Improve accuracy. Do not hallucinate fixes.`,
    },
    {
      role: 'user',
      content: `## Original Query\n${originalQuery.slice(0, 400)}\n\n## Original Output\n${originalContent.slice(0, 2500)}\n\n## Issues Identified\n${issues}`,
    },
  ];
}

function parseChallengerResponse(
  raw: string,
  targetOutputId: string,
  domain: string,
): ContrarianChallenge {
  const challengeId = `cc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed = JSON.parse(jsonMatch[0]) as {
      logicalFlaws?: string[];
      dataGaps?: string[];
      biasedAssumptions?: string[];
      regulatoryRisks?: string[];
      overallSeverity?: string;
      recommendation?: string;
      summary?: string;
    };

    const severity = (['none', 'minor', 'moderate', 'major', 'critical'].includes(
      parsed.overallSeverity ?? '',
    )
      ? parsed.overallSeverity
      : 'none') as ContrarianSeverity;

    const severityScore = CHALLENGE_SEVERITY_THRESHOLD[severity];

    return {
      challengeId,
      targetOutputId,
      domain,
      logicalFlaws: parsed.logicalFlaws ?? [],
      dataGaps: parsed.dataGaps ?? [],
      biasedAssumptions: parsed.biasedAssumptions ?? [],
      regulatoryRisks: parsed.regulatoryRisks ?? [],
      severity,
      severityScore,
      recommendation: (parsed.recommendation ?? 'pass') as ContrarianChallenge['recommendation'],
      challengeText: parsed.summary ?? raw.slice(0, 500),
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      challengeId,
      targetOutputId,
      domain,
      logicalFlaws: [],
      dataGaps: [],
      biasedAssumptions: [],
      regulatoryRisks: [],
      severity: 'none',
      severityScore: 0,
      recommendation: 'pass',
      challengeText: raw.slice(0, 500),
      timestamp: new Date().toISOString(),
    };
  }
}

const _challengeLog: ContrarianChallenge[] = [];
const MAX_CHALLENGE_LOG = 500;

export function getContrarianLog(limit = 20): ContrarianChallenge[] {
  return _challengeLog.slice(-limit).reverse();
}

export function getContrarianStats(): {
  totalChallenges: number;
  severityDistribution: Record<ContrarianSeverity, number>;
  revisedCount: number;
  blockedCount: number;
} {
  const dist: Record<ContrarianSeverity, number> = {
    none: 0,
    minor: 0,
    moderate: 0,
    major: 0,
    critical: 0,
  };
  let revisedCount = 0;
  let blockedCount = 0;

  for (const c of _challengeLog) {
    dist[c.severity]++;
    if (c.recommendation === 'revise') revisedCount++;
    if (c.recommendation === 'block') blockedCount++;
  }

  return { totalChallenges: _challengeLog.length, severityDistribution: dist, revisedCount, blockedCount };
}

export async function runShadowCouncil(
  originalContent: string,
  domain: string,
  originalQuery: string,
  outputId: string,
): Promise<ShadowCouncilResult> {
  const sessionId = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const start = Date.now();

  let challenge: ContrarianChallenge;
  let revisedContent = originalContent;
  let wasRevised = false;
  let revisionRationale = '';

  if (!_challengerCaller) {
    challenge = {
      challengeId: `cc_noop_${Date.now()}`,
      targetOutputId: outputId,
      domain,
      logicalFlaws: [],
      dataGaps: [],
      biasedAssumptions: [],
      regulatoryRisks: [],
      severity: 'none',
      severityScore: 0,
      recommendation: 'pass',
      challengeText: '[Shadow Council unavailable — challenger caller not registered]',
      timestamp: new Date().toISOString(),
    };
  } else {
    const challengerMessages = buildContrarianPrompt(originalContent, domain, originalQuery);
    const challengeResult = await _challengerCaller(challengerMessages, 1024);
    challenge = parseChallengerResponse(challengeResult.content, outputId, domain);

    _challengeLog.push(challenge);
    if (_challengeLog.length > MAX_CHALLENGE_LOG) {
      _challengeLog.splice(0, _challengeLog.length - MAX_CHALLENGE_LOG);
    }

    const severityOrder: ContrarianSeverity[] = ['none', 'minor', 'moderate', 'major', 'critical'];
    const shouldRevise =
      severityOrder.indexOf(challenge.severity) >=
      severityOrder.indexOf(REVISION_THRESHOLD);

    if (shouldRevise && challenge.recommendation !== 'block') {
      const revisionMessages = buildRevisionPrompt(originalContent, challenge, originalQuery);
      const revisionResult = await _challengerCaller(revisionMessages, 2048);
      revisedContent = revisionResult.content;
      wasRevised = true;
      revisionRationale = `Revised due to ${challenge.severity} issues: ${challenge.challengeText.slice(0, 200)}`;
    } else if (challenge.recommendation === 'block') {
      revisedContent = `[BLOCKED by Shadow Council — ${challenge.severity} issues detected]\n\n${challenge.challengeText}\n\nOriginal response withheld pending human review.`;
      wasRevised = true;
      revisionRationale = `Blocked: ${challenge.challengeText.slice(0, 200)}`;
    }
  }

  return {
    sessionId,
    originalContent,
    challenge,
    wasRevised,
    revisedContent,
    revisionRationale,
    totalLatencyMs: Date.now() - start,
  };
}

export function shouldRunShadowCouncil(
  isHighStakes: boolean,
  stakesLevel: 'low' | 'medium' | 'high' | 'critical',
): boolean {
  return isHighStakes || stakesLevel === 'critical' || stakesLevel === 'high';
}
