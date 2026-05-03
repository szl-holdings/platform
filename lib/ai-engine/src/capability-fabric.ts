/**
 * A11OY Capability Fabric — Unified AI Operating System (Task #3553)
 *
 * The Capability Fabric is the registry + router that makes the Nuro Mesh
 * usable as a single AI operating system. It maps each high-level AI
 * capability category in the modern landscape (writing, presentations,
 * spreadsheets, image generation, scheduling, …) onto a governed Nuro Mesh
 * agent and exposes one Universal Prompt Router that any client can call.
 *
 * The router scores a natural-language prompt against every capability,
 * picks the winning agent, executes via the existing callAgent() Substrate
 * pipeline (so all governance / audit / consciousness signals fire), and
 * returns the response together with the full routing scoreboard for
 * transparency.
 */

import { AGENT_REGISTRY, callAgent, computeRoutingScores, type AgentDefinition } from './nuro-mesh';

export const CAPABILITY_DOMAINS = [
  'presentation',
  'chatbots',
  'email',
  'code',
  'spreadsheet',
  'image_generation',
  'workflow_automation',
  'graphic_design',
  'scheduling',
  'writing',
  'meeting_notes',
  'video_generation',
  'knowledge_management',
  'data_visualization',
  'general_intelligence',
] as const;

export type CapabilityDomain = (typeof CAPABILITY_DOMAINS)[number];

export interface CapabilityDefinition {
  domain: CapabilityDomain;
  displayName: string;
  description: string;
  agentId: string;
  agentDomain: string;
  governanceTier: 'sovereign' | 'governed' | 'autonomous';
  semanticIntents: string[];
  keywords: string[];
  tools: string[];
  crossDomainLinks: CapabilityDomain[];
}

/**
 * Canonical seed for the 15 capability domains. Each entry binds a capability
 * to a Nuro Mesh agent, declares its governance tier, and provides keyword /
 * semantic hints used by the Universal Prompt Router. Cross-domain links
 * encode common collaboration patterns (e.g. presentations frequently cite
 * data analysis, email frequently asks for scheduling).
 */
export const CAPABILITY_FABRIC_SEED: CapabilityDefinition[] = [
  {
    domain: 'presentation',
    displayName: 'Presentation generation',
    description: 'Slide decks, pitch decks, board presentations, narrative arc.',
    agentId: 'architect',
    agentDomain: 'presentation',
    governanceTier: 'governed',
    semanticIntents: [
      'build presentation',
      'pitch deck',
      'investor deck',
      'board deck',
      'slide outline',
      'storyboard',
      'speaker notes',
    ],
    keywords: ['slides', 'deck', 'pitch', 'pptx', 'keynote', 'storyboard'],
    tools: ['build_slides', 'outline_deck', 'design_chart', 'speaker_notes'],
    crossDomainLinks: ['data_visualization', 'graphic_design', 'writing'],
  },
  {
    domain: 'chatbots',
    displayName: 'Conversational chatbots',
    description: 'General multi-turn conversation and Q&A across the mesh.',
    agentId: 'alloy',
    agentDomain: 'orchestration',
    governanceTier: 'governed',
    semanticIntents: [
      'chat with assistant',
      'ask question',
      'conversational',
      'multi-turn',
      'help me think',
    ],
    keywords: ['chat', 'ask', 'question', 'conversation', 'assistant'],
    tools: ['chat_session', 'context_window', 'tool_call'],
    crossDomainLinks: ['general_intelligence', 'knowledge_management'],
  },
  {
    domain: 'email',
    displayName: 'Email intelligence',
    description: 'Compose, reply, triage, and summarize email.',
    agentId: 'scribe',
    agentDomain: 'writing',
    governanceTier: 'governed',
    semanticIntents: [
      'write email',
      'reply to email',
      'triage inbox',
      'summarize thread',
      'compose message',
    ],
    keywords: ['email', 'inbox', 'reply', 'thread', 'message'],
    tools: ['draft_email', 'inbox_triage', 'tone_check'],
    crossDomainLinks: ['scheduling', 'writing', 'knowledge_management'],
  },
  {
    domain: 'code',
    displayName: 'Code generation & review',
    description: 'Write, review, refactor, and debug source code.',
    agentId: 'forge',
    agentDomain: 'engineering',
    governanceTier: 'governed',
    semanticIntents: [
      'write code',
      'refactor',
      'fix bug',
      'code review',
      'unit test',
      'implementation',
      'function',
      'pull request',
    ],
    keywords: ['code', 'function', 'class', 'refactor', 'bug', 'pr', 'pull request', 'test'],
    tools: ['code_complete', 'code_review', 'unit_test_gen', 'static_analysis'],
    crossDomainLinks: ['general_intelligence', 'workflow_automation'],
  },
  {
    domain: 'spreadsheet',
    displayName: 'Spreadsheet analysis',
    description: 'Pivot tables, formulas, CSV cleanup, and tabular reasoning.',
    agentId: 'analyst',
    agentDomain: 'data_analysis',
    governanceTier: 'governed',
    semanticIntents: [
      'analyze spreadsheet',
      'pivot table',
      'excel formula',
      'csv',
      'tabular data',
      'descriptive statistics',
    ],
    keywords: ['spreadsheet', 'csv', 'excel', 'pivot', 'formula', 'sheet'],
    tools: ['build_spreadsheet', 'pivot_table', 'csv_clean'],
    crossDomainLinks: ['data_visualization', 'general_intelligence'],
  },
  {
    domain: 'image_generation',
    displayName: 'Image generation',
    description: 'Generate, edit, and brand-check images.',
    agentId: 'visionary',
    agentDomain: 'visual_generation',
    governanceTier: 'governed',
    semanticIntents: [
      'generate image',
      'create illustration',
      'photo edit',
      'brand visual',
      'banner',
      'thumbnail',
    ],
    keywords: ['image', 'photo', 'illustration', 'render', 'banner', 'thumbnail'],
    tools: ['generate_image', 'design_layout', 'brand_check'],
    crossDomainLinks: ['graphic_design', 'video_generation', 'presentation'],
  },
  {
    domain: 'workflow_automation',
    displayName: 'Workflow automation',
    description: 'Multi-step orchestration, integration glue, scheduled jobs.',
    agentId: 'alloy',
    agentDomain: 'orchestration',
    governanceTier: 'governed',
    semanticIntents: [
      'automate workflow',
      'orchestrate steps',
      'pipeline',
      'cron job',
      'integration glue',
      'multi-step',
    ],
    keywords: ['workflow', 'automation', 'pipeline', 'cron', 'orchestrate', 'integration'],
    tools: ['workflow_designer', 'job_scheduler', 'webhook_router'],
    crossDomainLinks: ['code', 'scheduling', 'general_intelligence'],
  },
  {
    domain: 'graphic_design',
    displayName: 'Graphic design',
    description: 'Logos, layouts, and brand-aligned visual systems.',
    agentId: 'visionary',
    agentDomain: 'visual_generation',
    governanceTier: 'governed',
    semanticIntents: [
      'logo design',
      'graphic design',
      'layout',
      'brand asset',
      'color palette',
      'typography',
    ],
    keywords: ['logo', 'graphic', 'layout', 'brand', 'palette', 'typography', 'design'],
    tools: ['design_layout', 'brand_check', 'palette_picker'],
    crossDomainLinks: ['image_generation', 'presentation'],
  },
  {
    domain: 'scheduling',
    displayName: 'Scheduling & calendar',
    description: 'Find time, book meetings, resolve calendar conflicts.',
    agentId: 'scheduler',
    agentDomain: 'scheduling',
    governanceTier: 'autonomous',
    semanticIntents: [
      'schedule meeting',
      'find available time',
      'reschedule',
      'time zone',
      'recurring meeting',
    ],
    keywords: ['schedule', 'calendar', 'meeting', 'invite', 'availability', 'reschedule'],
    tools: ['find_time', 'book_meeting', 'reschedule'],
    crossDomainLinks: ['email', 'meeting_notes'],
  },
  {
    domain: 'writing',
    displayName: 'Long-form writing',
    description: 'Documents, articles, announcements, editing.',
    agentId: 'scribe',
    agentDomain: 'writing',
    governanceTier: 'governed',
    semanticIntents: [
      'long-form writing',
      'edit document',
      'rewrite paragraph',
      'newsletter',
      'announcement',
      'tone of voice',
    ],
    keywords: ['write', 'draft', 'edit', 'rewrite', 'tone', 'document', 'article'],
    tools: ['draft_document', 'tone_check'],
    crossDomainLinks: ['email', 'presentation', 'knowledge_management'],
  },
  {
    domain: 'meeting_notes',
    displayName: 'Meeting notes & summaries',
    description: 'Transcript summarization, action items, decision capture.',
    agentId: 'chronicler',
    agentDomain: 'knowledge_management',
    governanceTier: 'governed',
    semanticIntents: [
      'meeting notes',
      'meeting summary',
      'action items',
      'transcript',
      'minutes',
      'capture decisions',
    ],
    keywords: ['meeting', 'notes', 'minutes', 'transcript', 'summary', 'action items'],
    tools: ['summarize_meeting', 'extract_actions'],
    crossDomainLinks: ['scheduling', 'knowledge_management', 'writing'],
  },
  {
    domain: 'video_generation',
    displayName: 'Video generation',
    description: 'Short-form animated and product-demo video.',
    agentId: 'visionary',
    agentDomain: 'visual_generation',
    governanceTier: 'governed',
    semanticIntents: [
      'generate video',
      'animated explainer',
      'video clip',
      'product demo video',
      'motion graphic',
    ],
    keywords: ['video', 'clip', 'animation', 'motion', 'reel'],
    tools: ['generate_video', 'storyboard_video'],
    crossDomainLinks: ['image_generation', 'presentation'],
  },
  {
    domain: 'knowledge_management',
    displayName: 'Knowledge management',
    description: 'Wiki, KB, institutional memory, indexed search.',
    agentId: 'chronicler',
    agentDomain: 'knowledge_management',
    governanceTier: 'governed',
    semanticIntents: [
      'knowledge base',
      'wiki article',
      'institutional memory',
      'index document',
      'searchable notes',
    ],
    keywords: ['wiki', 'kb', 'knowledge', 'note', 'index', 'memory'],
    tools: ['kb_index', 'note_search'],
    crossDomainLinks: ['meeting_notes', 'writing', 'general_intelligence'],
  },
  {
    domain: 'data_visualization',
    displayName: 'Data visualization',
    description: 'Charts, dashboards, and visual analysis of datasets.',
    agentId: 'analyst',
    agentDomain: 'data_analysis',
    governanceTier: 'governed',
    semanticIntents: [
      'data visualization',
      'build chart',
      'dashboard',
      'trend chart',
      'visualize dataset',
    ],
    keywords: ['chart', 'visualization', 'dashboard', 'graph', 'plot'],
    tools: ['chart_builder', 'dashboard_compose'],
    crossDomainLinks: ['spreadsheet', 'presentation'],
  },
  {
    domain: 'general_intelligence',
    displayName: 'General intelligence',
    description: 'Open-ended reasoning when no specialized domain wins.',
    agentId: 'alloy',
    agentDomain: 'orchestration',
    governanceTier: 'governed',
    semanticIntents: [
      'general question',
      'reasoning',
      'help me think',
      'open-ended',
      'brainstorm',
    ],
    keywords: ['help', 'think', 'reason', 'brainstorm', 'general'],
    tools: ['reasoning', 'tool_call', 'context_window'],
    crossDomainLinks: ['chatbots', 'knowledge_management'],
  },
];

export interface CapabilityRouteScore {
  domain: CapabilityDomain;
  agentId: string;
  score: number;
  keywordHits: string[];
  intentHits: string[];
}

/**
 * Score a prompt against every capability domain. Pure / synchronous so it
 * can be unit-tested or rendered in a UI without invoking any model.
 */
export function scoreCapabilities(prompt: string): CapabilityRouteScore[] {
  const lower = prompt.toLowerCase();
  const meshScores = new Map(computeRoutingScores(prompt).map((s) => [s.domain, s.combinedScore]));

  const results: CapabilityRouteScore[] = [];
  for (const cap of CAPABILITY_FABRIC_SEED) {
    const keywordHits = cap.keywords.filter((kw) => lower.includes(kw.toLowerCase()));
    const intentHits = cap.semanticIntents.filter((it) => {
      const itl = it.toLowerCase();
      if (lower.includes(itl)) return true;
      const words = itl.split(/\s+/).filter((w) => w.length > 3);
      return words.length > 0 && words.every((w) => lower.includes(w));
    });

    const keywordScore = Math.min(1, keywordHits.length / Math.max(1, cap.keywords.length * 0.25));
    const intentScore = Math.min(
      1,
      intentHits.length / Math.max(1, cap.semanticIntents.length * 0.25),
    );
    const meshBoost = meshScores.get(cap.agentDomain) ?? 0;
    const score = keywordScore * 0.4 + intentScore * 0.4 + meshBoost * 0.2;

    if (score > 0 || keywordHits.length > 0 || intentHits.length > 0) {
      results.push({ domain: cap.domain, agentId: cap.agentId, score, keywordHits, intentHits });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

export interface UniversalRouterOptions {
  orgId?: number | null;
  callerUserId?: number | null;
  callerRoles?: string[];
  workflowId?: string;
  traceId?: string;
  forceDomain?: CapabilityDomain;
}

export interface UniversalRouterResult {
  invocationId: string;
  prompt: string;
  selectedDomain: CapabilityDomain;
  selectedAgentId: string;
  agentName: string;
  routingScores: CapabilityRouteScore[];
  response: string;
  confidence: number;
  latencyMs: number;
  tokensUsed: number;
  tier: 'sovereign' | 'governed' | 'autonomous';
}

function findAgent(agentId: string): AgentDefinition | undefined {
  return AGENT_REGISTRY.find((a) => a.id === agentId);
}

function findCapability(domain: CapabilityDomain): CapabilityDefinition | undefined {
  return CAPABILITY_FABRIC_SEED.find((c) => c.domain === domain);
}

function generateInvocationId(): string {
  return `cap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Universal Prompt Router. Scores a prompt across all 15 capabilities, picks
 * the highest-scoring one (or honors forceDomain), and executes via the
 * Substrate-governed callAgent pipeline. Returns the answer along with the
 * full routing scoreboard so the caller can show users *why* a particular
 * capability was chosen.
 */
export async function routeUniversalPrompt(
  prompt: string,
  context: string,
  options: UniversalRouterOptions = {},
): Promise<UniversalRouterResult> {
  const invocationId = generateInvocationId();
  const scores = scoreCapabilities(prompt);

  let selectedDomain: CapabilityDomain;
  if (options.forceDomain && findCapability(options.forceDomain)) {
    selectedDomain = options.forceDomain;
  } else if (scores.length > 0 && scores[0]!.score > 0.05) {
    selectedDomain = scores[0]!.domain;
  } else {
    selectedDomain = 'general_intelligence';
  }

  const capability = findCapability(selectedDomain)!;
  const agent = findAgent(capability.agentId) ?? findAgent('alloy');
  if (!agent) {
    throw new Error(`Capability Fabric: no agent available for ${selectedDomain}`);
  }

  const result = await callAgent(agent, prompt, context, {
    orgId: options.orgId ?? null,
    action: `capability:${selectedDomain}`,
    callerUserId: options.callerUserId ?? null,
    callerRoles: options.callerRoles ?? [],
    workflowId: options.workflowId,
    traceId: options.traceId,
  });

  return {
    invocationId,
    prompt,
    selectedDomain,
    selectedAgentId: agent.id,
    agentName: agent.name,
    routingScores: scores,
    response: result.response,
    confidence: result.confidence,
    latencyMs: result.latencyMs,
    tokensUsed: result.tokensUsed,
    tier: capability.governanceTier,
  };
}
