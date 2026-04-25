import type { PromptKernel } from '../types.js';

export const executiveBriefingKernel: PromptKernel = {
  id: 'executive-briefing',
  version: '1.0.0',
  name: 'Executive Briefing',
  description:
    'Synthesizes signals, news, and internal metrics into a personalized daily executive briefing — LUMINA/Superhuman Morning Brief style with priority ranking and decision prompts.',
  pattern: 'research-and-cite',
  domain: 'executive',
  verticals: ['pulse', 'command', 'szl-holdings', 'aegis'],
  inspirations: ['Superhuman', 'Perplexity', 'Claude Cowork', 'Granola'],
  tags: ['executive', 'briefing', 'daily', 'priority', 'decisions', 'synthesis'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are a world-class executive chief of staff. Synthesize signals into a crisp morning brief that surfaces only what requires the executive\'s attention today. Lead with decisions needed. Prioritize ruthlessly. Surface risks before opportunities. Cut noise. Cite sources.',
  template: `Generate an executive morning briefing for:

Executive: {{executiveName}}, {{executiveRole}}
Organization: {{organization}}
Date: {{date}}

Priority signals (ranked by urgency):
{{signals}}

Internal metrics snapshot:
{{metricsSnapshot}}

Open decisions awaiting response:
{{openDecisions}}

News/external context:
{{externalContext}}

Format:
1. **Decisions Needed Today** (max 3, ranked)
2. **Top Risks to Monitor** (max 3)
3. **Key Opportunities** (max 2)
4. **Metrics Pulse** (one-line each, vs prior period)
5. **What Can Wait** (items deprioritized today)
6. **Suggested First Action** (single most important thing to do in the next hour)`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 1500,
    temperature: 0.3,
    responseFormat: 'markdown',
  },
  codex: {
    role: "World-class chief of staff synthesizing executive-level morning briefs with ruthless prioritization",
    contract:
      'Returns a structured brief with decisions needed, risks, opportunities, metrics pulse, deprioritized items, and a single suggested first action. Maximum 3 items per section — no padding.',
    inputSchema: [
      {
        name: 'executiveName',
        type: 'string',
        description: 'Executive name',
        required: true,
        example: 'Sarah Chen',
      },
      {
        name: 'executiveRole',
        type: 'string',
        description: 'Executive role',
        required: true,
        example: 'CEO',
      },
      {
        name: 'organization',
        type: 'string',
        description: 'Organization name',
        required: true,
        example: 'SZL Holdings',
      },
      {
        name: 'date',
        type: 'string',
        description: 'Briefing date',
        required: true,
        example: '2026-04-25',
      },
      {
        name: 'signals',
        type: 'array',
        description: 'Priority signals from internal and external sources',
        required: true,
        example: '[{"title": "Q2 revenue at risk", "urgency": "high", "summary": "..."}]',
      },
      {
        name: 'metricsSnapshot',
        type: 'object',
        description: 'Key metrics snapshot vs prior period',
        required: false,
        example: '{"revenue": "+12% MoM", "pipeline": "-8% WoW", "headcount": "342"}',
      },
      {
        name: 'openDecisions',
        type: 'array',
        description: 'Decisions awaiting the executive\'s input',
        required: false,
        example: '[{"decision": "Approve $4.2M capex", "deadline": "Today", "owner": "CFO"}]',
      },
      {
        name: 'externalContext',
        type: 'string',
        description: 'Relevant external news or market signals',
        required: false,
        example: 'Fed rate decision today 2pm. Competitor announced layoffs.',
      },
    ],
    outputSchema: [
      { name: 'decisionsNeeded', type: 'array', description: 'Max 3 decisions needed today' },
      { name: 'topRisks', type: 'array', description: 'Max 3 risks to monitor' },
      { name: 'keyOpportunities', type: 'array', description: 'Max 2 opportunities' },
      { name: 'metricsPulse', type: 'array', description: 'One-line metric summaries' },
      { name: 'whatCanWait', type: 'array', description: 'Deprioritized items' },
      { name: 'suggestedFirstAction', type: 'string', description: 'Single most important action' },
    ],
    evidenceRequirements: [
      {
        kind: 'signal',
        label: 'Briefing signals',
        required: true,
        minCount: 1,
        description: 'At least one signal must be provided to generate the brief',
      },
    ],
    refusalPolicy: {
      triggers: [
        'no signals provided',
        'brief would contain speculation about named individuals',
      ],
      refusalMessage:
        'Cannot generate an executive brief without signals. Please provide at least one priority signal.',
      logLevel: 'info',
    },
    evaluationRubric: [
      {
        id: 'decisions-first',
        label: 'Decisions-First Ordering',
        weight: 0.35,
        passingThreshold: 1.0,
        description: 'Decisions needed appear first and are max 3 items',
        keywords: ['decision', 'approve', 'decide', 'respond', 'confirm'],
      },
      {
        id: 'ruthless-brevity',
        label: 'Ruthless Brevity',
        weight: 0.35,
        passingThreshold: 0.8,
        description: 'No section exceeds its stated maximum; no padding',
        keywords: [],
      },
      {
        id: 'first-action-specificity',
        label: 'First Action Specificity',
        weight: 0.3,
        passingThreshold: 0.8,
        description: 'Suggested first action is specific and immediately executable',
        keywords: ['call', 'approve', 'email', 'review', 'sign', 'schedule'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'CEO morning brief',
        input: {
          executiveName: 'Sarah Chen',
          executiveRole: 'CEO',
          organization: 'SZL Holdings',
          date: '2026-04-25',
          signals: [
            {
              title: 'Q2 revenue projection revised down',
              urgency: 'high',
              summary: 'CFO projects Q2 miss by $2.1M',
            },
            {
              title: 'Board capex approval pending',
              urgency: 'medium',
              summary: '$4.2M expansion requires CEO signature by EOD',
            },
          ],
          metricsSnapshot: { revenue: '-8% WoW', pipeline: '+12% MoM', headcount: '342' },
          openDecisions: [{ decision: 'Sign $4.2M capex', deadline: 'EOD today', owner: 'CFO' }],
          externalContext: 'Fed rate decision at 2pm may affect financing terms',
        },
        output:
          '## Executive Brief — April 25, 2026 | Sarah Chen, CEO, SZL Holdings\n\n**Decisions Needed Today:**\n1. 🔴 Sign $4.2M capex (CFO waiting — EOD deadline). Review before Fed announcement at 2pm.\n2. 🟡 Respond to CFO on Q2 revenue miss ($2.1M) — mitigation plan needed by EOW.\n\n**Top Risks:**\n1. Q2 revenue miss if pipeline conversion rate holds\n2. Fed rate change could increase expansion financing costs\n3. Board capex signature delay risks Q3 timeline\n\n**Key Opportunities:**\n1. Pipeline is up +12% MoM — convert 3 deals to offset Q2 risk\n\n**Metrics Pulse:**\n- Revenue: -8% WoW (monitor)\n- Pipeline: +12% MoM (strong)\n- Headcount: 342 (stable)\n\n**What Can Wait:**\n- Weekly ops review (reschedule to tomorrow)\n\n**Suggested First Action:** Sign the capex document now before the Fed announcement changes financing assumptions.',
      },
    ],
  },
};
