import type { PromptKernel } from '../types.js';

export const decisionIntelligenceKernel: PromptKernel = {
  id: 'decision-intelligence',
  version: '1.0.0',
  name: 'Decision Intelligence',
  description:
    'Analyzes a decision scenario across multiple options using structured evidence, produces a ranked recommendation with confidence and dissent flags.',
  pattern: 'decision-intelligence',
  domain: 'strategy',
  verticals: ['lyte-command-center', 'command', 'aegis', 'szl-holdings', 'pulse'],
  inspirations: ['Claude Cowork', 'Julius AI', 'Motion'],
  tags: ['decision', 'strategy', 'ranking', 'recommendation', 'risk'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are a senior strategy advisor and decision analyst. Apply structured analytical frameworks (MCDA, decision trees, risk matrices) to evaluate options. Be explicit about uncertainty. Separate facts from assumptions. Surface dissenting considerations that favor alternatives. Return a defensible ranked recommendation.',
  template: `Analyze the following decision:

Decision question: {{question}}
Stakeholder: {{stakeholder}}
Constraints: {{constraints}}
Deadline: {{deadline}}

Options under consideration:
{{options}}

Evidence base:
{{evidence}}

Criteria weights (0–1):
{{criteriaWeights}}

Produce:
1. **Situation Summary** (2 sentences)
2. **Option Scorecard** (table: option | criteria scores | weighted total)
3. **Recommendation** (top option with reasoning)
4. **Confidence Level** (HIGH / MEDIUM / LOW + rationale)
5. **Dissent & Risk** (strongest argument for each non-recommended option)
6. **Decision Dependencies** (what must be true for this recommendation to hold)`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 2000,
    temperature: 0.2,
    responseFormat: 'markdown',
  },
  codex: {
    role: 'Senior strategy advisor applying multi-criteria decision analysis to complex business choices',
    contract:
      'Returns a structured decision analysis with scored options, ranked recommendation, confidence level, dissent considerations, and explicit decision dependencies. Does not make decisions autonomously — produces analysis for human review.',
    inputSchema: [
      {
        name: 'question',
        type: 'string',
        description: 'The decision question being analyzed',
        required: true,
        example: 'Should we acquire the Port of Miami berth lease or pursue organic expansion?',
      },
      {
        name: 'stakeholder',
        type: 'string',
        description: 'Who is making this decision',
        required: true,
        example: 'CEO, SZL Holdings',
      },
      {
        name: 'constraints',
        type: 'string',
        description: 'Hard constraints: budget, time, regulatory, etc.',
        required: false,
        example: 'Budget cap: $12M. Decision needed by Q3.',
      },
      {
        name: 'deadline',
        type: 'string',
        description: 'Decision deadline',
        required: false,
        example: '2026-06-30',
      },
      {
        name: 'options',
        type: 'array',
        description: 'Array of option strings or objects describing each alternative',
        required: true,
        example: '["Option A: Acquire lease for $8M", "Option B: Expand existing berth capacity"]',
      },
      {
        name: 'evidence',
        type: 'string',
        description: 'Supporting evidence, data, or analysis to consider',
        required: false,
        example: 'Port throughput grew 18% YoY. Competitor secured adjacent berth last month.',
      },
      {
        name: 'criteriaWeights',
        type: 'object',
        description: 'Criteria and their weights (must sum to 1)',
        required: false,
        example: '{"ROI": 0.4, "Risk": 0.3, "Strategic fit": 0.3}',
      },
    ],
    outputSchema: [
      { name: 'situationSummary', type: 'string', description: '2-sentence situation summary' },
      { name: 'optionScorecard', type: 'array', description: 'Scored options with weighted totals' },
      { name: 'recommendation', type: 'string', description: 'Top-ranked option with reasoning' },
      {
        name: 'confidenceLevel',
        type: 'string',
        description: 'HIGH / MEDIUM / LOW with rationale',
      },
      {
        name: 'dissentAndRisk',
        type: 'string',
        description: 'Strongest counter-arguments for non-recommended options',
      },
      {
        name: 'decisionDependencies',
        type: 'array',
        description: 'Assumptions that must hold for recommendation to be valid',
      },
    ],
    evidenceRequirements: [
      {
        kind: 'document',
        label: 'Decision brief',
        required: true,
        minCount: 1,
        description: 'Decision question and options must be provided',
      },
      {
        kind: 'metric',
        label: 'Supporting data',
        required: false,
        minCount: 0,
        description: 'Quantitative evidence strengthens scoring validity',
      },
    ],
    refusalPolicy: {
      triggers: [
        'fewer than 2 options provided',
        'decision involves illegal activity',
        'stakeholder is not identified',
      ],
      refusalMessage:
        'Cannot produce a decision analysis without at least 2 options and an identified decision-maker.',
      logLevel: 'warn',
    },
    evaluationRubric: [
      {
        id: 'scorecard-presence',
        label: 'Scorecard Completeness',
        weight: 0.35,
        passingThreshold: 0.8,
        description: 'All options are scored against all criteria',
        keywords: ['score', 'weighted', 'criteria', 'total'],
      },
      {
        id: 'dissent-quality',
        label: 'Dissent Quality',
        weight: 0.3,
        passingThreshold: 0.6,
        description: 'Non-recommended options get a fair counter-argument',
        keywords: ['however', 'alternatively', 'risk', 'if', 'dissent'],
      },
      {
        id: 'confidence-reasoning',
        label: 'Confidence Reasoning',
        weight: 0.35,
        passingThreshold: 0.7,
        description: 'Confidence level is justified with specific rationale',
        keywords: ['HIGH', 'MEDIUM', 'LOW', 'confidence', 'because', 'assuming'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'Port acquisition vs organic expansion',
        input: {
          question: 'Acquire Miami berth lease or expand existing berth capacity?',
          stakeholder: 'CEO, SZL Maritime',
          options: ['Acquire Miami berth lease ($8M)', 'Expand existing berth (+$3M CapEx)'],
          evidence: 'Miami port throughput +18% YoY. Competitor secured adjacent berth.',
          criteriaWeights: { ROI: 0.4, Risk: 0.3, 'Strategic fit': 0.3 },
        },
        output:
          '## Decision Analysis: Port Berth Strategy\n\n**Situation:** SZL Maritime faces a time-sensitive decision on berth capacity expansion amid 18% YoY throughput growth. A competitor\'s adjacent berth acquisition adds urgency.\n\n**Recommendation:** Acquire Miami berth lease. Strategic positioning and competitive dynamics favor the higher-cost option.\n\n**Confidence:** MEDIUM — assumes lease terms are negotiable below $8M and throughput growth sustains through 2027.\n\n**Dissent:** Organic expansion (Option B) preserves capital and avoids execution risk if growth decelerates.\n\n**Dependencies:** Lease terms confirmed, financing secured, throughput growth continues.',
      },
    ],
  },
};
