import type { PromptKernel } from '../types.js';

export const deepAnalyticsKernel: PromptKernel = {
  id: 'deep-analytics',
  version: '1.0.0',
  name: 'Deep Analytics',
  description:
    'Interprets natural-language analytics questions against structured data, produces SQL/calculation plan, executes analysis, and narrates findings — Julius AI style.',
  pattern: 'deep-analytics',
  domain: 'analytics',
  verticals: ['vessels', 'terra', 'szl-holdings', 'lyte-command-center', 'pulse'],
  inspirations: ['Julius AI', 'Perplexity'],
  tags: ['analytics', 'data', 'sql', 'insight', 'natural-language'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are a senior data scientist and business analyst. Translate natural-language questions into precise analytical plans, execute them against provided data, and narrate findings in plain business language. Show your reasoning. Distinguish correlation from causation. Always note data limitations.',
  template: `Answer the following analytics question:

Question: {{question}}
Dataset description: {{datasetDescription}}
Sample data or schema: {{sampleData}}
Time period: {{timePeriod}}
Business context: {{businessContext}}

Approach:
1. Restate the question in analytical terms
2. Outline the calculation or query plan
3. Show results (use tables where helpful)
4. Narrate findings in 2–3 sentences
5. Note confidence and data limitations
6. Suggest 2 follow-up questions`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 2000,
    temperature: 0.2,
    responseFormat: 'markdown',
  },
  codex: {
    role: 'Senior data scientist translating natural-language questions into analytical insights',
    contract:
      'Returns a structured analysis with: restated question, calculation plan, results (tabular where applicable), plain-language narrative, confidence note, data limitations, and 2 follow-up questions.',
    inputSchema: [
      {
        name: 'question',
        type: 'string',
        description: 'The natural-language analytics question',
        required: true,
        example: 'Which vessel routes had the highest demurrage costs last quarter?',
      },
      {
        name: 'datasetDescription',
        type: 'string',
        description: 'Description of the available dataset and its fields',
        required: true,
        example: 'Voyage ledger with fields: route, vessel_id, demurrage_usd, voyage_date',
      },
      {
        name: 'sampleData',
        type: 'string',
        description: 'Sample rows or schema snippet',
        required: false,
        example:
          'route | vessel_id | demurrage_usd | voyage_date\nRotterdam-Houston | MV-001 | 42000 | 2026-01-15',
      },
      {
        name: 'timePeriod',
        type: 'string',
        description: 'Analysis time period',
        required: false,
        example: 'Q1 2026 (Jan 1 – Mar 31)',
      },
      {
        name: 'businessContext',
        type: 'string',
        description: 'Relevant business context for interpretation',
        required: false,
        example: 'Port congestion increased 30% in February due to labor disputes',
      },
    ],
    outputSchema: [
      { name: 'restatedQuestion', type: 'string', description: 'Question in analytical terms' },
      { name: 'calculationPlan', type: 'string', description: 'Step-by-step analysis approach' },
      { name: 'results', type: 'string', description: 'Tabular or numeric results' },
      { name: 'narrative', type: 'string', description: '2–3 sentence plain-language finding' },
      { name: 'confidenceNote', type: 'string', description: 'Data quality and confidence notes' },
      { name: 'followUpQuestions', type: 'array', description: '2 suggested follow-up analyses' },
    ],
    evidenceRequirements: [
      {
        kind: 'metric',
        label: 'Dataset or schema',
        required: true,
        minCount: 1,
        description: 'At minimum a dataset description or schema must be provided',
      },
    ],
    refusalPolicy: {
      triggers: [
        'no dataset or schema provided',
        'question asks for PII-level individual tracking',
        'question involves inferring protected characteristics',
      ],
      refusalMessage:
        'Cannot perform analytics without a dataset description. Provide schema or sample data.',
      logLevel: 'warn',
    },
    evaluationRubric: [
      {
        id: 'calculation-transparency',
        label: 'Calculation Transparency',
        weight: 0.35,
        passingThreshold: 0.7,
        description: 'Analysis plan is explicit and reproducible',
        keywords: ['GROUP BY', 'sum', 'average', 'filter', 'sort', 'calculation'],
      },
      {
        id: 'narrative-clarity',
        label: 'Narrative Clarity',
        weight: 0.35,
        passingThreshold: 0.7,
        description: 'Finding is expressed in plain business language without jargon',
        keywords: ['highest', 'lowest', 'increased', 'decreased', 'represents'],
      },
      {
        id: 'limitations-noted',
        label: 'Limitations Noted',
        weight: 0.3,
        passingThreshold: 0.6,
        description: 'Data limitations or confidence caveats are surfaced',
        keywords: ['limitation', 'caveat', 'note', 'assumes', 'may not'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'Demurrage analysis by route',
        input: {
          question: 'Which routes had the highest demurrage costs in Q1 2026?',
          datasetDescription: 'Voyage ledger: route, vessel_id, demurrage_usd, voyage_date',
          sampleData:
            'Rotterdam-Houston | MV-001 | 42000 | 2026-01-15\nSingapore-LA | MV-003 | 18000 | 2026-02-10',
          timePeriod: 'Q1 2026',
          businessContext: 'Port congestion at Houston increased 40% in February',
        },
        output:
          '## Analytics: Q1 2026 Demurrage by Route\n\n**Restated Question:** Rank voyage routes by total demurrage_usd in Q1 2026 (Jan 1–Mar 31).\n\n**Calculation Plan:** GROUP BY route, SUM(demurrage_usd) WHERE voyage_date BETWEEN 2026-01-01 AND 2026-03-31, ORDER BY total DESC.\n\n**Results:**\n| Route | Total Demurrage |\n|-------|----------------|\n| Rotterdam-Houston | $42,000 |\n| Singapore-LA | $18,000 |\n\n**Finding:** Rotterdam-Houston was the most expensive route for demurrage in Q1, likely driven by the 40% increase in Houston port congestion in February.\n\n**Confidence:** MEDIUM — limited to 2 sample rows; full dataset would improve ranking reliability.\n\n**Follow-up Questions:**\n1. How did Houston congestion affect demurrage month-over-month?\n2. Which vessels on Rotterdam-Houston had the longest port wait times?',
      },
    ],
  },
};
