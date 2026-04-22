import { randomUUID } from 'node:crypto';
import {
  type SkillCapability,
  type SkillChain,
  type SkillManifest,
  skillRegistry,
} from './skill-registry.js';

export interface SkillSelectionResult {
  selected: SkillManifest[];
  rejected: Array<{ skill: SkillManifest; reason: string }>;
  reasoning: string;
}

export interface ChainCompositionResult {
  chain: SkillChain;
  warnings: string[];
  estimatedTotalLatencyMs: number;
  parallelGroups: Array<SkillManifest[]>;
}

export interface ChainExecutionPlan {
  chainId: string;
  phases: Array<{
    phase: number;
    skills: Array<{
      skillId: string;
      capability: SkillCapability;
      inputs: Record<string, unknown>;
      dependsOnPhase: number | null;
    }>;
    canRunInParallel: boolean;
  }>;
  totalEstimatedMs: number;
}

export class SkillManager {
  private chains = new Map<string, SkillChain>();

  discover(context: {
    capabilities?: SkillCapability[];
    domain?: string;
    tags?: string[];
    triggerContext?: Record<string, unknown>;
  }): SkillManifest[] {
    let candidates = skillRegistry.getAll();

    if (context.capabilities && context.capabilities.length > 0) {
      const capSet = new Set(context.capabilities);
      candidates = candidates.filter((s) => capSet.has(s.capability));
    }

    if (context.domain) {
      candidates = candidates.filter(
        (s) => s.domain === context.domain || s.domain === 'cross_domain',
      );
    }

    if (context.tags && context.tags.length > 0) {
      const tagSet = new Set(context.tags.map((t) => t.toLowerCase()));
      candidates = candidates.filter((s) => s.tags.some((t) => tagSet.has(t.toLowerCase())));
    }

    if (context.triggerContext) {
      const triggered = skillRegistry.matchTriggers(context.triggerContext);
      const triggeredIds = new Set(triggered.map((s) => s.skillId));
      candidates = candidates.filter((s) => triggeredIds.has(s.skillId) || !context.triggerContext);
    }

    return candidates;
  }

  select(task: string, context: Record<string, unknown>, maxSkills = 4): SkillSelectionResult {
    const allSkills = skillRegistry.getAll();
    const taskLower = task.toLowerCase();
    const selected: SkillManifest[] = [];
    const rejected: Array<{ skill: SkillManifest; reason: string }> = [];

    const scores = allSkills.map((skill) => {
      let score = 0;

      const keywordMatches = skill.tags.filter((t) => taskLower.includes(t.toLowerCase())).length;
      score += keywordMatches * 10;

      if (taskLower.includes(skill.capability.replace(/_/g, ' '))) score += 20;
      if (taskLower.includes(skill.name.toLowerCase())) score += 15;

      const triggered = skillRegistry.matchTriggers(context);
      if (triggered.some((t) => t.skillId === skill.skillId)) score += 25;

      if (skill.domain === context.domain) score += 10;

      return { skill, score };
    });

    scores.sort((a, b) => b.score - a.score);

    for (const { skill, score } of scores) {
      if (selected.length >= maxSkills) {
        rejected.push({ skill, reason: `Max skill limit (${maxSkills}) reached` });
        continue;
      }

      const missingRequired = skill.requiredInputs.filter(
        (inp) => !(inp.name in context) && inp.name !== 'context' && inp.name !== 'tenantId',
      );
      if (missingRequired.length > 0 && score < 20) {
        rejected.push({
          skill,
          reason: `Missing required inputs: ${missingRequired.map((i) => i.name).join(', ')}`,
        });
        continue;
      }

      if (score === 0 && selected.length > 0) {
        rejected.push({ skill, reason: 'No relevance signal' });
        continue;
      }

      selected.push(skill);
    }

    const reasoning =
      selected.length > 0
        ? `Selected ${selected.length} skill(s): ${selected.map((s) => s.name).join(', ')}. ` +
          `Task keywords matched: ${selected.flatMap((s) => s.tags.filter((t) => taskLower.includes(t))).join(', ') || 'none'}.`
        : 'No matching skills found for the given task and context.';

    return { selected, rejected, reasoning };
  }

  composeChain(
    capabilities: SkillCapability[],
    name: string,
    description: string,
  ): ChainCompositionResult {
    const warnings: string[] = [];
    const chainSkills: SkillChain['skills'] = [];
    let totalLatency = 0;
    const parallelGroups: Array<SkillManifest[]> = [];

    const resolvedSkills: SkillManifest[] = [];
    for (const cap of capabilities) {
      const skill = skillRegistry.findByCapability(cap);
      if (!skill) {
        warnings.push(`No active skill found for capability: ${cap}`);
        continue;
      }
      resolvedSkills.push(skill);
    }

    for (let i = 0; i < resolvedSkills.length; i++) {
      const skill = resolvedSkills[i]!;
      const prev = i > 0 ? resolvedSkills[i - 1]! : null;

      if (prev && !prev.chainMetadata.canChainTo.includes(skill.capability)) {
        warnings.push(
          `Skill '${prev.name}' cannot directly chain to '${skill.name}'. Chain may produce incomplete inputs.`,
        );
      }

      if (skill.chainMetadata.parallelizable && i > 0) {
        const lastGroup = parallelGroups[parallelGroups.length - 1];
        if (lastGroup?.every((s) => s.chainMetadata.parallelizable)) {
          lastGroup.push(skill);
        } else {
          parallelGroups.push([skill]);
        }
      } else {
        parallelGroups.push([skill]);
      }

      const inputMapping: Record<string, string> = {};
      if (prev) {
        for (const outputField of prev.chainMetadata.outputsFedToNext) {
          const matchingInput =
            skill.requiredInputs.find((inp) => inp.name === outputField) ||
            skill.optionalInputs.find((inp) => inp.name === outputField);
          if (matchingInput) {
            inputMapping[outputField] = `${prev.skillId}.${outputField}`;
          }
        }
      }

      chainSkills.push({
        skillId: skill.skillId,
        capability: skill.capability,
        order: i + 1,
        inputMapping,
      });

      totalLatency += skill.estimatedLatencyMs;
    }

    let adjustedLatency = 0;
    for (const group of parallelGroups) {
      const maxInGroup = Math.max(...group.map((s) => s.estimatedLatencyMs));
      adjustedLatency += maxInGroup;
    }
    totalLatency = adjustedLatency;

    const maxDepth = Math.max(...resolvedSkills.map((s) => s.chainMetadata.maxChainDepth), 0);
    if (capabilities.length > maxDepth && maxDepth > 0) {
      warnings.push(
        `Chain depth (${capabilities.length}) exceeds maximum recommended depth (${maxDepth}).`,
      );
    }

    const chain: SkillChain = {
      chainId: `chain_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      name,
      description,
      skills: chainSkills,
      totalEstimatedLatencyMs: totalLatency,
      createdAt: new Date().toISOString(),
    };

    this.chains.set(chain.chainId, chain);

    return { chain, warnings, estimatedTotalLatencyMs: totalLatency, parallelGroups };
  }

  buildExecutionPlan(chainId: string, inputs: Record<string, unknown>): ChainExecutionPlan | null {
    const chain = this.chains.get(chainId);
    if (!chain) return null;

    const phases: ChainExecutionPlan['phases'] = [];
    let currentPhase = 0;
    const processedIds = new Set<string>();

    const phaseMap = new Map<string, number>();

    for (const step of chain.skills) {
      const skill = skillRegistry.get(step.skillId);
      if (!skill) continue;

      let phase = 0;
      if (Object.keys(step.inputMapping).length > 0) {
        const dependentPhases = Object.values(step.inputMapping).map((mapping) => {
          const sourceSkillId = mapping.split('.')[0]!;
          return phaseMap.get(sourceSkillId) ?? 0;
        });
        phase = Math.max(...dependentPhases) + 1;
      } else if (skill.chainMetadata.parallelizable && currentPhase > 0) {
        phase = currentPhase;
      }

      phaseMap.set(step.skillId, phase);
      currentPhase = Math.max(currentPhase, phase);

      if (!phases[phase]) {
        phases[phase] = { phase, skills: [], canRunInParallel: skill.chainMetadata.parallelizable };
      }

      const phaseInputs: Record<string, unknown> = { ...inputs };
      for (const [inputName, sourceMapping] of Object.entries(step.inputMapping)) {
        phaseInputs[inputName] = `{{${sourceMapping}}}`;
      }

      phases[phase]?.skills.push({
        skillId: step.skillId,
        capability: step.capability,
        inputs: phaseInputs,
        dependsOnPhase: phase > 0 ? phase - 1 : null,
      });

      processedIds.add(step.skillId);
    }

    const totalMs = phases.reduce((sum, phase) => {
      const maxSkillLatency = Math.max(
        ...phase.skills.map((s) => skillRegistry.get(s.skillId)?.estimatedLatencyMs ?? 0),
      );
      return sum + maxSkillLatency;
    }, 0);

    return {
      chainId,
      phases: phases.filter(Boolean),
      totalEstimatedMs: totalMs,
    };
  }

  getChain(chainId: string): SkillChain | null {
    return this.chains.get(chainId) ?? null;
  }

  listChains(): SkillChain[] {
    return [...this.chains.values()];
  }

  deleteChain(chainId: string): boolean {
    return this.chains.delete(chainId);
  }

  getPrebuiltChain(
    scenario: 'full_incident' | 'quick_triage' | 'compliance_review' | 'executive_brief',
  ): ChainCompositionResult {
    const scenarios: Record<
      string,
      { capabilities: SkillCapability[]; name: string; description: string }
    > = {
      full_incident: {
        capabilities: [
          'triage',
          'incident_assessment',
          'risk_scoring',
          'escalation',
          'response_planning',
          'executive_briefing',
        ],
        name: 'Full Incident Response Chain',
        description: 'Complete incident lifecycle from triage through executive briefing',
      },
      quick_triage: {
        capabilities: ['triage', 'escalation'],
        name: 'Quick Triage Chain',
        description: 'Rapid triage and escalation decision for time-sensitive signals',
      },
      compliance_review: {
        capabilities: ['control_gap', 'risk_scoring', 'executive_briefing'],
        name: 'Compliance Review Chain',
        description: 'Control gap analysis through risk assessment to executive reporting',
      },
      executive_brief: {
        capabilities: ['risk_scoring', 'executive_briefing'],
        name: 'Executive Brief Chain',
        description: 'Risk assessment followed by executive briefing',
      },
    };

    const config = scenarios[scenario]!;
    return this.composeChain(config.capabilities, config.name, config.description);
  }
}

export const skillManager = new SkillManager();
