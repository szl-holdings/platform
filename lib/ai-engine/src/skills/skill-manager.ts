import {
  discoverSkillsForQuery,
  getSkillsForAgent,
  resolveSkillChain,
  type SkillPackage,
} from './skill-registry.js';

export interface SkillComposition {
  primarySkill: SkillPackage;
  chainedSkills: SkillPackage[];
  systemPromptInjection: string;
  estimatedTotalTokens: number;
  executionOrder: string[];
}

export interface SkillSelectionResult {
  selectedSkills: SkillPackage[];
  composition: SkillComposition | null;
  rationale: string;
}

export function selectSkillsForTask(
  query: string,
  agentId: string,
  options: { maxSkills?: number; allowChaining?: boolean } = {},
): SkillSelectionResult {
  const maxSkills = options.maxSkills ?? 3;
  const allowChaining = options.allowChaining ?? true;

  const discovered = discoverSkillsForQuery(query, agentId);
  const agentSkills = getSkillsForAgent(agentId);

  const candidates = discovered.length > 0 ? discovered : agentSkills.slice(0, 3);

  const selected = candidates.slice(0, maxSkills);

  if (selected.length === 0) {
    return {
      selectedSkills: [],
      composition: null,
      rationale: `No applicable skills found for agent ${agentId} on this query`,
    };
  }

  const primarySkill = selected[0]!;
  let chainedSkills: SkillPackage[] = [];

  if (allowChaining && primarySkill.chainable && primarySkill.chainableWith.length > 0) {
    const chain = resolveSkillChain(primarySkill.skillId, 2);
    chainedSkills = chain.slice(1).filter((s) => s.applicableAgents.includes(agentId));
  }

  const composition = buildComposition(primarySkill, chainedSkills);

  const rationale =
    selected.length === 0
      ? 'No skills matched — using base agent reasoning'
      : `Selected ${selected.map((s) => s.name).join(', ')} based on query intent`;

  return { selectedSkills: selected, composition, rationale };
}

function buildComposition(primary: SkillPackage, chained: SkillPackage[]): SkillComposition {
  const allSkills = [primary, ...chained];
  const promptParts: string[] = [];

  promptParts.push(`## Active Skills\n`);
  for (const skill of allSkills) {
    promptParts.push(
      `### ${skill.name} (${skill.skillId})\n${skill.systemPromptFragment}\n**Hint:** ${skill.executionHint}`,
    );
  }

  const systemPromptInjection = promptParts.join('\n\n');
  const estimatedTotalTokens = allSkills.reduce((sum, s) => sum + s.estimatedTokens, 0);
  const executionOrder = allSkills.map((s) => s.skillId);

  return {
    primarySkill: primary,
    chainedSkills: chained,
    systemPromptInjection,
    estimatedTotalTokens,
    executionOrder,
  };
}

export function buildEnhancedSystemPrompt(
  basePrompt: string,
  composition: SkillComposition | null,
): string {
  if (!composition) return basePrompt;
  return `${basePrompt}\n\n${composition.systemPromptInjection}`;
}

export interface SkillUsageRecord {
  skillId: string;
  agentId: string;
  query: string;
  timestamp: string;
  tokensSaved?: number;
}

const skillUsageLog: SkillUsageRecord[] = [];
const MAX_USAGE_LOG = 500;

export function recordSkillUsage(record: SkillUsageRecord): void {
  skillUsageLog.unshift(record);
  if (skillUsageLog.length > MAX_USAGE_LOG) skillUsageLog.length = MAX_USAGE_LOG;
}

export function getSkillUsageStats(): {
  totalInvocations: number;
  bySkill: Record<string, { invocations: number; agents: string[] }>;
  byAgent: Record<string, { invocations: number; skills: string[] }>;
  recentUsage: SkillUsageRecord[];
} {
  const bySkill: Record<string, { invocations: number; agents: string[] }> = {};
  const byAgent: Record<string, { invocations: number; skills: string[] }> = {};

  for (const record of skillUsageLog) {
    if (!bySkill[record.skillId]) bySkill[record.skillId] = { invocations: 0, agents: [] };
    bySkill[record.skillId]!.invocations++;
    if (!bySkill[record.skillId]?.agents.includes(record.agentId)) {
      bySkill[record.skillId]?.agents.push(record.agentId);
    }

    if (!byAgent[record.agentId]) byAgent[record.agentId] = { invocations: 0, skills: [] };
    byAgent[record.agentId]!.invocations++;
    if (!byAgent[record.agentId]?.skills.includes(record.skillId)) {
      byAgent[record.agentId]?.skills.push(record.skillId);
    }
  }

  return {
    totalInvocations: skillUsageLog.length,
    bySkill,
    byAgent,
    recentUsage: skillUsageLog.slice(0, 20),
  };
}
