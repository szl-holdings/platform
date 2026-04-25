/**
 * Agent Coalition Formation
 *
 * Instead of routing to a single agent, the orchestrator can form ad-hoc coalitions
 * of 2-4 agents based on query domain overlap. Coalition agents share a scratchpad
 * (backed by CognitiveWorkspace), challenge each other's intermediate conclusions,
 * and produce a consensus output. The orchestrator dissolves the coalition after
 * the query completes.
 */

import type { WorkingMemoryItem } from '../consciousness/cognitive-workspace.js';

export interface CoalitionMember {
  agentId: string;
  agentName: string;
  domain: string;
  role: 'lead' | 'specialist' | 'validator';
}

export interface CoalitionScratchpadEntry {
  entryId: string;
  agentId: string;
  agentName: string;
  content: string;
  type: 'hypothesis' | 'challenge' | 'evidence' | 'consensus_vote';
  timestamp: string;
  referencedEntries: string[];
}

export interface CoalitionConsensus {
  consensusId: string;
  agreeingAgents: string[];
  dissenter: string | null;
  dissenterReason: string | null;
  finalStatement: string;
  confidenceScore: number;
}

export interface CoalitionResult {
  coalitionId: string;
  query: string;
  members: CoalitionMember[];
  scratchpad: CoalitionScratchpadEntry[];
  consensus: CoalitionConsensus;
  intermediateOutputs: Record<string, string>;
  dissolveDurationMs: number;
  coalitionLatencyMs: number;
  formationReason: string;
}

type AgentCaller = (
  agentId: string,
  query: string,
  context: string,
  role: CoalitionMember['role'],
) => Promise<{ content: string; confidence: number; latencyMs: number }>;

let _agentCaller: AgentCaller | null = null;

export function setCoalitionAgentCaller(fn: AgentCaller): void {
  _agentCaller = fn;
}

const DOMAIN_OVERLAP_MATRIX: Record<string, string[]> = {
  maritime: ['security', 'legal', 'financial'],
  security: ['infrastructure', 'legal', 'maritime'],
  legal: ['financial', 'maritime', 'security'],
  financial: ['real_estate', 'legal', 'analytics'],
  real_estate: ['financial', 'legal', 'analytics'],
  analytics: ['financial', 'infrastructure', 'research'],
  research: ['analytics', 'creative'],
  creative: ['client_relations', 'research'],
  client_relations: ['financial', 'creative', 'readiness'],
  infrastructure: ['security', 'analytics'],
  readiness: ['analytics', 'client_relations'],
};

export function computeCoalitionMembers(
  primaryDomain: string,
  queryDomains: string[],
  allAgents: Array<{ id: string; name: string; domain: string }>,
  maxSize = 4,
): CoalitionMember[] {
  const relatedDomains = new Set<string>([
    primaryDomain,
    ...(DOMAIN_OVERLAP_MATRIX[primaryDomain] ?? []),
    ...queryDomains,
  ]);

  const eligible = allAgents.filter((a) => relatedDomains.has(a.domain));
  const deduped = Array.from(new Map(eligible.map((a) => [a.domain, a])).values());

  const sorted = deduped.sort((a, b) => {
    const aDirect = queryDomains.includes(a.domain) ? 1 : 0;
    const bDirect = queryDomains.includes(b.domain) ? 1 : 0;
    return bDirect - aDirect;
  });

  const selected = sorted.slice(0, maxSize);

  return selected.map((agent, i): CoalitionMember => ({
    agentId: agent.id,
    agentName: agent.name,
    domain: agent.domain,
    role: i === 0 ? 'lead' : i === selected.length - 1 ? 'validator' : 'specialist',
  }));
}

class CoalitionScratchpad {
  private entries: CoalitionScratchpadEntry[] = [];

  addEntry(
    agentId: string,
    agentName: string,
    content: string,
    type: CoalitionScratchpadEntry['type'],
    referencedEntries: string[] = [],
  ): CoalitionScratchpadEntry {
    const entry: CoalitionScratchpadEntry = {
      entryId: `cse_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      agentId,
      agentName,
      content: content.slice(0, 1500),
      type,
      timestamp: new Date().toISOString(),
      referencedEntries,
    };
    this.entries.push(entry);
    return entry;
  }

  buildContextForAgent(agentId: string, maxChars = 3000): string {
    const relevant = this.entries
      .filter((e) => e.agentId !== agentId)
      .slice(-10);

    const lines = relevant.map(
      (e) => `[${e.agentName} — ${e.type}] ${e.content.slice(0, 300)}`,
    );

    const joined = lines.join('\n');
    return joined.slice(0, maxChars);
  }

  buildWorkingMemoryItems(): Array<Omit<WorkingMemoryItem, 'id' | 'addedAt' | 'lastAccessedAt' | 'accessCount' | 'decayRate'>> {
    return this.entries.map((e) => ({
      content: `[${e.agentName}/${e.type}] ${e.content.slice(0, 500)}`,
      source: `coalition_${e.agentId}`,
      priority: e.type === 'challenge' ? 8 : e.type === 'consensus_vote' ? 9 : 6,
      tags: ['coalition', e.agentId],
    }));
  }

  getEntries(): CoalitionScratchpadEntry[] {
    return [...this.entries];
  }
}

function buildConsensus(
  members: CoalitionMember[],
  intermediateOutputs: Record<string, string>,
  confidences: Record<string, number>,
): CoalitionConsensus {
  const consensusId = `cons_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const avgConfidence =
    Object.values(confidences).reduce((s, c) => s + c, 0) /
    Math.max(1, Object.values(confidences).length);

  const agentOutputs = Object.entries(intermediateOutputs);
  if (agentOutputs.length === 0) {
    return {
      consensusId,
      agreeingAgents: members.map((m) => m.agentId),
      dissenter: null,
      dissenterReason: null,
      finalStatement: 'No outputs received from coalition members.',
      confidenceScore: 0.1,
    };
  }

  const sortedByConfidence = Object.entries(confidences).sort((a, b) => b[1] - a[1]);
  const leadAgentId = sortedByConfidence[0]?.[0] ?? members[0]?.agentId ?? 'unknown';
  const leadOutput = intermediateOutputs[leadAgentId] ?? '';

  const lowestConfidenceAgent = sortedByConfidence[sortedByConfidence.length - 1];
  let dissenter: string | null = null;
  let dissenterReason: string | null = null;

  if (
    lowestConfidenceAgent &&
    lowestConfidenceAgent[0] !== leadAgentId &&
    lowestConfidenceAgent[1] < avgConfidence - 0.2
  ) {
    dissenter = lowestConfidenceAgent[0];
    const dissenterOutput = intermediateOutputs[dissenter] ?? '';
    dissenterReason = dissenterOutput.slice(0, 300);
  }

  const agreeingAgents = members
    .map((m) => m.agentId)
    .filter((id) => id !== dissenter);

  const finalStatement = buildConsensusStatement(
    leadOutput,
    agreeingAgents.map((id) => intermediateOutputs[id] ?? ''),
    dissenter,
    dissenterReason,
  );

  return {
    consensusId,
    agreeingAgents,
    dissenter,
    dissenterReason,
    finalStatement,
    confidenceScore: avgConfidence,
  };
}

function buildConsensusStatement(
  leadOutput: string,
  otherOutputs: string[],
  dissenter: string | null,
  dissenterReason: string | null,
): string {
  const base = leadOutput.slice(0, 1500);
  const supplements = otherOutputs
    .filter((o) => o.length > 50)
    .map((o) => o.slice(0, 300))
    .join('\n\n---\n\n');

  let statement = base;
  if (supplements) {
    statement += `\n\n**Additional coalition perspectives:**\n${supplements}`;
  }
  if (dissenter && dissenterReason) {
    statement += `\n\n**Dissenting view (flagged for review):**\n${dissenterReason}`;
  }
  return statement;
}

export async function formAndRunCoalition(
  query: string,
  primaryDomain: string,
  queryDomains: string[],
  allAgents: Array<{ id: string; name: string; domain: string }>,
  formationReason: string,
): Promise<CoalitionResult> {
  const coalitionId = `coalition_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const start = Date.now();

  const members = computeCoalitionMembers(primaryDomain, queryDomains, allAgents);
  const scratchpad = new CoalitionScratchpad();
  const intermediateOutputs: Record<string, string> = {};
  const confidences: Record<string, number> = {};

  if (!_agentCaller) {
    for (const member of members) {
      const placeholder = `[Coalition member ${member.agentName} — agent caller not registered]`;
      intermediateOutputs[member.agentId] = placeholder;
      confidences[member.agentId] = 0.3;
      scratchpad.addEntry(member.agentId, member.agentName, placeholder, 'hypothesis');
    }
  } else {
    for (const member of members) {
      const sharedContext = scratchpad.buildContextForAgent(member.agentId);
      try {
        const result = await _agentCaller(member.agentId, query, sharedContext, member.role);
        intermediateOutputs[member.agentId] = result.content;
        confidences[member.agentId] = result.confidence / 100;
        scratchpad.addEntry(member.agentId, member.agentName, result.content, 'hypothesis');

        if (member.role === 'validator' && Object.keys(intermediateOutputs).length > 1) {
          const prevLeadOutput = Object.values(intermediateOutputs)[0] ?? '';
          if (
            result.confidence < 60 &&
            !result.content.toLowerCase().includes(prevLeadOutput.slice(0, 50).toLowerCase())
          ) {
            scratchpad.addEntry(
              member.agentId,
              member.agentName,
              `Validator challenge: ${result.content.slice(0, 300)}`,
              'challenge',
            );
          }
        }
      } catch {
        const errorMsg = `[${member.agentName} failed to respond]`;
        intermediateOutputs[member.agentId] = errorMsg;
        confidences[member.agentId] = 0.1;
        scratchpad.addEntry(member.agentId, member.agentName, errorMsg, 'hypothesis');
      }
    }
  }

  for (const member of members) {
    const conf = confidences[member.agentId] ?? 0.5;
    const vote = conf > 0.7 ? 'strong agreement' : conf > 0.5 ? 'agreement' : 'reserved';
    scratchpad.addEntry(
      member.agentId,
      member.agentName,
      `${member.agentName} consensus vote: ${vote} (confidence ${(conf * 100).toFixed(0)}%)`,
      'consensus_vote',
    );
  }

  const consensus = buildConsensus(members, intermediateOutputs, confidences);
  const coalitionLatencyMs = Date.now() - start;

  return {
    coalitionId,
    query: query.slice(0, 200),
    members,
    scratchpad: scratchpad.getEntries(),
    consensus,
    intermediateOutputs,
    dissolveDurationMs: 5,
    coalitionLatencyMs,
    formationReason,
  };
}

export function shouldFormCoalition(
  queryDomains: string[],
  primaryDomain: string,
): boolean {
  if (queryDomains.length < 2) return false;
  const overlaps = DOMAIN_OVERLAP_MATRIX[primaryDomain] ?? [];
  const crossDomainCount = queryDomains.filter(
    (d) => d !== primaryDomain && overlaps.includes(d),
  ).length;
  return crossDomainCount >= 1;
}
