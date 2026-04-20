import { promptRegistry as baseRegistry } from '@szl-holdings/prompt-registry';
import { promotePromptVersion, registerPrompt } from './registry.js';

let seeded = false;

const SEED_PROMPTS: Array<{
  id: string;
  name: string;
  description: string;
  domain: string;
  routeClass: string;
  template: string;
  systemPrompt?: string;
  tags?: string[];
}> = [
  {
    id: 'agents.perceive',
    name: 'Perceive Phase',
    description:
      'System prompt for the perceive phase — parse raw signals into structured observations',
    domain: 'agents-core',
    routeClass: 'cognitive-loop',
    systemPrompt:
      'You are an expert signal analyst. Parse the incoming signals into structured observations. Be concise and factual.',
    template:
      'Analyze the following signals and extract structured observations:\n\n{{signals}}\n\nContext: {{context}}\n\nReturn a JSON object with keys: entities, events, anomalies, confidence.',
    tags: ['cognitive-loop', 'perceive'],
  },
  {
    id: 'agents.orient',
    name: 'Orient Phase',
    description: 'Orient phase — assess situation and build world model update',
    domain: 'agents-core',
    routeClass: 'cognitive-loop',
    systemPrompt:
      'You are a strategic analyst. Your job is to assess the current situation and its implications.',
    template:
      'Given the following observations:\n\n{{observations}}\n\nAnd the current world model:\n\n{{worldModel}}\n\nAssess the situation and return: riskScore (0-1), noveltyScore (0-1), recommendedActions (list), missingContext (list).',
    tags: ['cognitive-loop', 'orient'],
  },
  {
    id: 'agents.plan',
    name: 'Plan Phase',
    description: 'Plan phase — decompose objective into an ordered, risk-estimated plan graph',
    domain: 'agents-core',
    routeClass: 'cognitive-loop',
    systemPrompt:
      'You are an expert planner. Decompose the objective into a minimal, ordered set of steps with risk estimates.',
    template:
      'Objective: {{objective}}\n\nSituation assessment: {{assessment}}\n\nAvailable tools: {{tools}}\n\nConstraints: {{constraints}}\n\nProduce a JSON plan with: steps (array of { id, name, tool, estimatedRisk, requiresApproval }), totalRisk, estimatedDurationMs.',
    tags: ['cognitive-loop', 'plan'],
  },
  {
    id: 'agents.reflect',
    name: 'Reflect Phase',
    description: 'Reflect phase — analyze run outcomes and extract lessons learned',
    domain: 'agents-core',
    routeClass: 'cognitive-loop',
    systemPrompt:
      'You are an expert in post-mortem analysis. Extract actionable lessons from the run outcome.',
    template:
      'Run objective: {{objective}}\n\nSteps executed: {{steps}}\n\nOutcome: {{outcome}}\n\nErrors encountered: {{errors}}\n\nExtract: lessons (list), skillGaps (list), proposedImprovements (list), overallScore (0-1).',
    tags: ['cognitive-loop', 'reflect'],
  },
  {
    id: 'agents.verify',
    name: 'Verify Phase',
    description: 'Verify phase — validate step outputs against expected criteria',
    domain: 'agents-core',
    routeClass: 'cognitive-loop',
    systemPrompt:
      'You are a quality assurance expert. Verify outputs against the expected criteria.',
    template:
      'Expected outcome: {{expectedOutcome}}\n\nActual output: {{actualOutput}}\n\nCriteria: {{criteria}}\n\nReturn: passed (boolean), score (0-1), failures (list), suggestions (list).',
    tags: ['cognitive-loop', 'verify'],
  },
  {
    id: 'agents.approval-justification',
    name: 'Approval Justification',
    description: 'Generate a clear justification message for human approval requests',
    domain: 'agents-core',
    routeClass: 'approval-gate',
    systemPrompt:
      'You are a compliance officer. Write a clear, concise justification for a human approval request.',
    template:
      'Action requested: {{action}}\n\nProjected impact: {{impact}}\n\nProjected risk: {{risk}}\n\nContext: {{context}}\n\nWrite a 2-3 sentence justification that a human approver can act on quickly.',
    tags: ['approval-gate'],
  },
];

export function registerSeedPrompts(): void {
  if (seeded) return;
  seeded = true;

  for (const p of SEED_PROMPTS) {
    if (baseRegistry.get(p.id)) continue;

    const definition = registerPrompt(p);
    const versionId = definition.versions[0]?.versionId;
    if (!versionId) {
      throw new Error(
        `[agents-prompts:seed] Seed prompt '${p.id}' was registered but has no initial version — cannot promote`,
      );
    }

    promotePromptVersion(p.id, versionId);
  }
}

export function isSeedComplete(): boolean {
  return seeded;
}
