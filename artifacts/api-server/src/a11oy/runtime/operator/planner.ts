import { listTools, getTool } from '../tools/registry.js';
import { logger } from '../../../lib/logger.js';
import type { PlanStep } from './run-store.js';

type ToolRiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

interface RawStep {
  stepNumber: number;
  title: string;
  description: string;
  toolId: string;
  toolInput: Record<string, unknown>;
  sideEffects: string[];
  riskLevel: ToolRiskLevel;
  requiresApproval: boolean;
}

interface PlannerOutput {
  steps: Omit<PlanStep, 'stepId' | 'status'>[];
  planSummary: string;
  estimatedSideEffects: string[];
  vertical: string;
}

const DEMO_PLANS: Record<string, PlannerOutput> = {
  terra: {
    vertical: 'terra-real-estate',
    planSummary: 'Query enterprise ontology for deal context, then create a new Terra deal with covenant watch active, and draft a Pulse briefing to notify stakeholders.',
    estimatedSideEffects: [
      'New deal record created in Terra with covenant monitoring',
      'Pulse briefing staged for executive review',
      'Lender notification queued (requires approval)',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Query Ontology — Terra Deal Context',
        description: 'Retrieve entity relationships for the target property and lender to establish deal context.',
        toolId: 'queryOntology',
        toolName: 'Query Ontology',
        toolInput: { entity: 'Terra Portfolio', depth: 2, relationTypes: ['owns', 'contracts_with', 'regulates'] },
        sideEffects: [],
        riskLevel: 'safe',
        requiresApproval: false,
      },
      {
        stepNumber: 2,
        title: 'Create Terra Deal — Riverside Tower Acquisition',
        description: 'Create a new real estate deal record with covenant tracking and lender linkage.',
        toolId: 'createTerraDeal',
        toolName: 'Create Terra Deal',
        toolInput: {
          dealName: 'Riverside Tower Acquisition',
          propertyAddress: '450 Riverside Dr, New York, NY 10027',
          dealType: 'acquisition',
          dealValueUsd: 87500000,
          lenderId: 'hsbc-cre-001',
          covenantTerms: 'LTV < 65%, DSCR > 1.25x, occupancy > 85% within 90 days',
        },
        sideEffects: ['New deal record created in Terra', 'Covenant watch activated', 'Lender notification queued'],
        riskLevel: 'high',
        requiresApproval: true,
      },
      {
        stepNumber: 3,
        title: 'Draft Pulse Briefing — Acquisition Alert',
        description: 'Stage a Pulse briefing summarising the new acquisition for executive stakeholders.',
        toolId: 'draftPulseBriefing',
        toolName: 'Draft Pulse Briefing',
        toolInput: {
          title: 'New Acquisition: Riverside Tower — Executive Briefing',
          audience: 'executive',
          signalIds: ['sig-terra-001'],
          period: 'Q2 2026',
          tone: 'formal',
        },
        sideEffects: ['Briefing staged in Pulse (requires publish approval)'],
        riskLevel: 'low',
        requiresApproval: true,
      },
    ],
  },
  vessels: {
    vertical: 'vessels-maritime',
    planSummary: 'Query ontology for vessel relationships, create a Vessels alert rule for PSC deficiency tracking, and open a Counsel matter for regulatory exposure.',
    estimatedSideEffects: [
      'Persistent alert rule created in Vessels — triggers ~2.4/day',
      'New Counsel matter opened with ScopeStack entry',
      'Counsel team notified',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Query Ontology — Fleet & Regulatory Context',
        description: 'Retrieve regulatory and fleet entity relationships to understand exposure.',
        toolId: 'queryOntology',
        toolName: 'Query Ontology',
        toolInput: { entity: 'Tanker Fleet Alpha', depth: 2, relationTypes: ['regulates', 'owns', 'inspects'] },
        sideEffects: [],
        riskLevel: 'safe',
        requiresApproval: false,
      },
      {
        stepNumber: 2,
        title: 'Create Vessels Alert Rule — PSC Deficiency Watch',
        description: 'Create a persistent alert rule to monitor PSC deficiency events across the tanker fleet.',
        toolId: 'createVesselsAlertRule',
        toolName: 'Create Vessels Alert Rule',
        toolInput: {
          ruleName: 'PSC Deficiency — Tanker Fleet Alpha',
          vesselIds: ['MV-001', 'MV-002', 'MV-003', 'MV-004'],
          triggerCondition: 'psc_deficiency_count > 3 OR detention_risk = true',
          severity: 'high',
          notifyChannels: ['ops@vessels.io', 'compliance@vessels.io'],
        },
        sideEffects: ['Persistent alert rule active in Vessels', '4 vessels now monitored'],
        riskLevel: 'medium',
        requiresApproval: true,
      },
      {
        stepNumber: 3,
        title: 'Open Counsel Matter — SIRE 2.0 Regulatory Exposure',
        description: 'Open a legal matter to track regulatory exposure from PSC deficiencies.',
        toolId: 'openCounselMatter',
        toolName: 'Open Counsel Matter',
        toolInput: {
          matterTitle: 'SIRE 2.0 PSC Deficiency — Regulatory Exposure',
          matterType: 'regulatory',
          clientEntity: 'SZL Vessels Holdings',
          priority: 'high',
          assignedCounsel: 'maritime-counsel@szl.io',
          deadlineDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        },
        sideEffects: ['New Counsel matter opened', 'ScopeStack entry created', 'Counsel notified'],
        riskLevel: 'medium',
        requiresApproval: true,
      },
    ],
  },
  counsel: {
    vertical: 'prism-counsel',
    planSummary: 'Query ontology for legal entity context, open a new Counsel matter, and draft a Pulse briefing for stakeholder awareness.',
    estimatedSideEffects: [
      'New Counsel matter opened with ScopeStack entry',
      'Counsel team notified',
      'Pulse briefing staged for review',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Query Ontology — Legal Entity Context',
        description: 'Retrieve entity relationships relevant to the legal matter.',
        toolId: 'queryOntology',
        toolName: 'Query Ontology',
        toolInput: { entity: 'SZL Legal Entities', depth: 2, relationTypes: ['contracts_with', 'regulates', 'owns'] },
        sideEffects: [],
        riskLevel: 'safe',
        requiresApproval: false,
      },
      {
        stepNumber: 2,
        title: 'Open Counsel Matter',
        description: 'Open a new legal matter with assigned counsel and deadline tracking.',
        toolId: 'openCounselMatter',
        toolName: 'Open Counsel Matter',
        toolInput: {
          matterTitle: 'Contract Review — SZL Holdings',
          matterType: 'contract',
          clientEntity: 'SZL Holdings',
          priority: 'medium',
          assignedCounsel: 'general-counsel@szl.io',
          deadlineDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        },
        sideEffects: ['New Counsel matter opened', 'ScopeStack entry created', 'Counsel notified'],
        riskLevel: 'medium',
        requiresApproval: true,
      },
      {
        stepNumber: 3,
        title: 'Draft Pulse Briefing — Legal Update',
        description: 'Stage a Pulse briefing to inform executives of the new legal matter.',
        toolId: 'draftPulseBriefing',
        toolName: 'Draft Pulse Briefing',
        toolInput: {
          title: 'New Legal Matter: Contract Review — Stakeholder Update',
          audience: 'executive',
          signalIds: [],
          period: 'Current',
          tone: 'formal',
        },
        sideEffects: ['Briefing staged in Pulse (requires publish approval)'],
        riskLevel: 'low',
        requiresApproval: true,
      },
    ],
  },
  default: {
    vertical: 'alloy-core',
    planSummary: 'Query ontology for enterprise context, draft a Pulse briefing for stakeholders, and open a Counsel matter to track the identified issue.',
    estimatedSideEffects: [
      'Pulse briefing staged (requires publish approval)',
      'New Counsel matter opened',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Query Ontology — Enterprise Context',
        description: 'Retrieve entity relationships relevant to the stated intent.',
        toolId: 'queryOntology',
        toolName: 'Query Ontology',
        toolInput: { entity: 'SZL Holdings', depth: 2, relationTypes: ['owns', 'contracts_with', 'regulates'] },
        sideEffects: [],
        riskLevel: 'safe',
        requiresApproval: false,
      },
      {
        stepNumber: 2,
        title: 'Draft Pulse Briefing',
        description: 'Stage an executive briefing in Pulse for stakeholder review.',
        toolId: 'draftPulseBriefing',
        toolName: 'Draft Pulse Briefing',
        toolInput: {
          title: 'Operator Run — Executive Briefing',
          audience: 'executive',
          signalIds: [],
          period: 'Current',
          tone: 'formal',
        },
        sideEffects: ['Briefing staged in Pulse (requires publish approval)'],
        riskLevel: 'low',
        requiresApproval: true,
      },
      {
        stepNumber: 3,
        title: 'Open Counsel Matter',
        description: 'Open a Counsel matter to track any legal or compliance implications.',
        toolId: 'openCounselMatter',
        toolName: 'Open Counsel Matter',
        toolInput: {
          matterTitle: 'Operator Action Review',
          matterType: 'compliance',
          clientEntity: 'SZL Holdings',
          priority: 'medium',
          assignedCounsel: 'general-counsel@szl.io',
          deadlineDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        },
        sideEffects: ['New Counsel matter opened', 'ScopeStack entry created'],
        riskLevel: 'medium',
        requiresApproval: true,
      },
    ],
  },
};

function detectVertical(intent: string): string {
  const lower = intent.toLowerCase();
  if (lower.includes('terra') || lower.includes('deal') || lower.includes('property') || lower.includes('real estate') || lower.includes('covenant') || lower.includes('lender')) return 'terra';
  if (lower.includes('vessel') || lower.includes('maritime') || lower.includes('ship') || lower.includes('tanker') || lower.includes('psc') || lower.includes('sire')) return 'vessels';
  if (lower.includes('counsel') || lower.includes('legal') || lower.includes('matter') || lower.includes('contract')) return 'counsel';
  return 'default';
}

async function callAnthropicAPI(systemPrompt: string, userMessage: string): Promise<string | null> {
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com';
  if (!apiKey) return null;

  try {
    const resp = await fetch(`${baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!resp.ok) {
      logger.warn({ status: resp.status }, '[operator/planner] Anthropic API error');
      return null;
    }

    const json = (await resp.json()) as { content: Array<{ type: string; text: string }> };
    return json.content[0]?.text ?? null;
  } catch (e) {
    logger.warn({ err: e }, '[operator/planner] Anthropic API call failed');
    return null;
  }
}

async function planWithAI(intent: string): Promise<PlannerOutput | null> {
  const tools = listTools().slice(0, 15).map((t) => ({
    name: t.id,
    description: t.description,
    riskLevel: t.riskLevel,
    requiresApproval: t.requiresApproval,
    inputSchema: t.inputSchema,
  }));

  const systemPrompt = `You are A11oy's governed agentic operator planner. Take a natural language intent and produce a structured execution plan using the available tools.

Rules:
- Start with a queryOntology step for domain context (safe, no approval needed).
- Include at least one write-action tool that requiresApproval=true.
- Describe concrete side effects for each write step.
- Use riskLevel and requiresApproval from the tool catalogue.
- Return ONLY valid JSON — no markdown, no prose, no code fences.

JSON schema:
{
  "planSummary": "1-2 sentence summary",
  "estimatedSideEffects": ["global side effects"],
  "vertical": "terra-real-estate|vessels-maritime|prism-counsel|alloy-core|lyte-revenue|aegis-defense",
  "steps": [{
    "stepNumber": 1,
    "title": "Step title",
    "description": "What this step does",
    "toolId": "toolId from catalog",
    "toolInput": { "field": "value" },
    "sideEffects": ["side effects for this step"],
    "riskLevel": "safe|low|medium|high|critical",
    "requiresApproval": true
  }]
}`;

  const userMessage = `Available tools:\n${JSON.stringify(tools, null, 2)}\n\nUser intent: "${intent}"\n\nGenerate a governed execution plan with 2-5 steps. Return only the JSON object.`;

  const text = await callAnthropicAPI(systemPrompt, userMessage);
  if (!text) return null;

  try {
    const jsonText = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    const raw = JSON.parse(jsonText) as {
      planSummary: string;
      estimatedSideEffects: string[];
      vertical: string;
      steps: RawStep[];
    };

    const steps: Omit<PlanStep, 'stepId' | 'status'>[] = raw.steps.map((s) => {
      const tool = getTool(s.toolId);
      return {
        stepNumber: s.stepNumber,
        title: s.title,
        description: s.description,
        toolId: s.toolId,
        toolName: tool?.name ?? s.toolId,
        toolInput: s.toolInput ?? {},
        sideEffects: s.sideEffects ?? [],
        riskLevel: (s.riskLevel ?? tool?.riskLevel ?? 'medium') as ToolRiskLevel,
        requiresApproval: s.requiresApproval ?? tool?.requiresApproval ?? true,
      };
    });

    return {
      steps,
      planSummary: raw.planSummary,
      estimatedSideEffects: raw.estimatedSideEffects ?? [],
      vertical: raw.vertical ?? 'alloy-core',
    };
  } catch (e) {
    logger.warn({ err: e }, '[operator/planner] Failed to parse AI plan JSON');
    return null;
  }
}

export async function generatePlan(intent: string, isDemoMode: boolean): Promise<PlannerOutput> {
  if (!isDemoMode) {
    const aiPlan = await planWithAI(intent);
    if (aiPlan) return aiPlan;
  }

  const verticalKey = detectVertical(intent);
  const demoPlan = DEMO_PLANS[verticalKey] ?? DEMO_PLANS.default;

  return {
    ...demoPlan,
    steps: demoPlan.steps.map((s) => ({
      ...s,
      toolName: getTool(s.toolId)?.name ?? s.toolId,
    })),
    planSummary: `[Demo] ${demoPlan.planSummary}`,
  };
}
