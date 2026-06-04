import type { PromptKernel } from '../types.js';

export const researchAndCiteKernel: PromptKernel = {
  id: 'research-and-cite',
  version: '1.0.0',
  name: 'Research & Cite',
  description:
    'Produces a structured research brief with numbered inline citations from provided sources, Perplexity-style.',
  pattern: 'research-and-cite',
  domain: 'intelligence',
  verticals: ['sentra', 'aegis', 'vessels', 'pulse'],
  inspirations: ['Perplexity', 'Claude Cowork'],
  tags: ['research', 'citations', 'intelligence', 'briefing'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are a senior intelligence analyst with expertise in synthesizing multi-source evidence into concise, auditable briefings. Every claim you make must be supported by an inline citation in [Source N] format. If you cannot cite a claim, omit it. Never hallucinate sources.',
  template: `Produce a research brief on the following topic:

Topic: {{topic}}

Available sources:
{{sources}}

Additional context: {{context}}

Requirements:
- Write a 3–5 paragraph executive summary
- Use inline citations [Source N] for every factual claim
- End with a "Key Takeaways" section (3–5 bullet points)
- Flag any information gaps with [UNVERIFIED]
- Confidence level: {{confidenceThreshold}} minimum

Return format: Markdown`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 2048,
    temperature: 0.3,
    responseFormat: 'markdown',
  },
  codex: {
    role: 'Senior intelligence analyst specializing in cited, evidence-backed research briefings',
    contract:
      'Produces a structured markdown brief where every factual claim carries an inline [Source N] citation drawn from the provided sources. Refuses to assert claims it cannot cite.',
    inputSchema: [
      {
        name: 'topic',
        type: 'string',
        description: 'The research topic or question to investigate',
        required: true,
        example: 'APT-41 infrastructure changes Q1 2026',
      },
      {
        name: 'sources',
        type: 'array',
        description: 'Array of source objects with title, url, and excerpt fields',
        required: true,
        example: '[{"title":"...", "url":"...", "excerpt":"..."}]',
      },
      {
        name: 'context',
        type: 'string',
        description: 'Additional context or framing for the research',
        required: false,
        example: 'Focus on nation-state attribution',
      },
      {
        name: 'confidenceThreshold',
        type: 'string',
        description: 'Minimum confidence level: low | medium | high',
        required: false,
        example: 'high',
      },
    ],
    outputSchema: [
      {
        name: 'brief',
        type: 'string',
        description: 'Markdown research brief with inline citations',
      },
      {
        name: 'keyTakeaways',
        type: 'array',
        description: 'Extracted bullet-point takeaways',
      },
      {
        name: 'informationGaps',
        type: 'array',
        description: 'Topics flagged as UNVERIFIED or missing sources',
      },
    ],
    evidenceRequirements: [
      {
        kind: 'citation',
        label: 'Source references',
        required: true,
        minCount: 2,
        description: 'At least 2 cited sources must back the brief',
      },
    ],
    refusalPolicy: {
      triggers: [
        'no sources provided',
        'topic involves classified material not in sources',
        'all sources are stale (>90 days)',
      ],
      refusalMessage:
        'Cannot produce a cited brief without verifiable sources. Please provide at least 2 source documents.',
      escalationTarget: 'intelligence-review',
      logLevel: 'warn',
    },
    evaluationRubric: [
      {
        id: 'citation-coverage',
        label: 'Citation Coverage',
        weight: 0.4,
        passingThreshold: 0.7,
        description: 'Fraction of factual claims backed by inline citations',
        keywords: ['[Source', 'citation', 'according to'],
      },
      {
        id: 'executive-summary',
        label: 'Executive Summary Quality',
        weight: 0.3,
        passingThreshold: 0.6,
        description: 'Presence of a coherent 3–5 paragraph executive summary',
        keywords: ['summary', 'key takeaway', 'finding'],
      },
      {
        id: 'gap-flagging',
        label: 'Gap Flagging',
        weight: 0.3,
        passingThreshold: 0.5,
        description: 'Unverified or missing information is explicitly flagged',
        keywords: ['[UNVERIFIED]', 'information gap', 'not confirmed'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'Threat actor infrastructure research',
        input: {
          topic: 'Volt Typhoon C2 infrastructure shifts in 2026',
          sources: [
            {
              title: 'CISA Advisory AA26-010A',
              url: 'https://cisa.gov/advisory/aa26-010a',
              excerpt:
                'Volt Typhoon has been observed pivoting to compromised SOHO routers as C2 relay nodes...',
            },
          ],
          context: 'Assess impact on critical infrastructure operators',
          confidenceThreshold: 'high',
        },
        output:
          '## Volt Typhoon Infrastructure Shift — Research Brief\n\n### Executive Summary\n\nVolt Typhoon, a Chinese state-sponsored threat actor, has demonstrably shifted its command-and-control (C2) infrastructure toward compromised small-office/home-office (SOHO) routers [Source 1]. This pivot complicates attribution and blocking efforts for critical infrastructure defenders.\n\n### Key Takeaways\n- C2 relay nodes now primarily use legitimate SOHO hardware [Source 1]\n- Attribution confidence remains high based on TTPs\n- [UNVERIFIED]: Exact number of compromised routers in active use',
        notes: 'Demonstrates proper citation format and UNVERIFIED flagging',
      },
    ],
  },
};
