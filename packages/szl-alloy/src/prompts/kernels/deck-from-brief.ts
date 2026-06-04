import type { PromptKernel } from '../types.js';

export const deckFromBriefKernel: PromptKernel = {
  id: 'deck-from-brief',
  version: '1.0.0',
  name: 'Deck from Brief',
  description:
    'Converts a business brief or document into a slide-by-slide narrative outline with speaker notes — Gamma-style.',
  pattern: 'deck-from-brief',
  domain: 'content',
  verticals: ['pulse', 'carlota-jo', 'szl-holdings', 'aegis'],
  inspirations: ['Gamma', 'Claude Cowork'],
  tags: ['presentation', 'deck', 'slides', 'narrative'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are an expert presentation strategist and narrative architect. Transform business briefs into compelling slide outlines that tell a clear story. Each slide should have one key message. Think McKinsey pyramid principle: conclusion first, then evidence. Speaker notes should prepare the presenter for executive-level delivery.',
  template: `Convert the following brief into a presentation outline:

Brief title: {{title}}
Audience: {{audience}}
Goal: {{goal}}
Time allotment: {{duration}} minutes
Brief content:
{{briefContent}}

Constraints:
- Max {{maxSlides}} slides
- Tone: {{tone}}
- Include data visualizations where relevant
- Each slide: headline (assertion) + 3 bullet points max + speaker note

Return: JSON array of slide objects`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 2500,
    temperature: 0.5,
    responseFormat: 'json',
  },
  codex: {
    role: 'Presentation strategist and narrative architect specializing in executive-level decks',
    contract:
      'Returns a JSON array of slide objects, each with: slideNumber, headline (assertive statement), bullets (max 3), speakerNote, visualSuggestion. Follows pyramid principle — conclusion first.',
    inputSchema: [
      {
        name: 'title',
        type: 'string',
        description: 'Presentation title',
        required: true,
        example: 'Q2 Market Expansion Strategy',
      },
      {
        name: 'audience',
        type: 'string',
        description: 'Target audience',
        required: true,
        example: 'Board of Directors',
      },
      {
        name: 'goal',
        type: 'string',
        description: 'What you want the audience to do or believe after the presentation',
        required: true,
        example: 'Approve $5M expansion budget',
      },
      {
        name: 'duration',
        type: 'number',
        description: 'Presentation duration in minutes',
        required: false,
        example: 20,
      },
      {
        name: 'briefContent',
        type: 'string',
        description: 'The source brief, document, or notes to convert',
        required: true,
        example: 'Revenue grew 34% YoY. Sunbelt markets represent 60% of pipeline...',
      },
      {
        name: 'maxSlides',
        type: 'number',
        description: 'Maximum number of slides',
        required: false,
        example: 12,
      },
      {
        name: 'tone',
        type: 'string',
        description: 'Presentation tone: executive | investor | technical | sales',
        required: false,
        example: 'executive',
      },
    ],
    outputSchema: [
      { name: 'slides', type: 'array', description: 'Array of slide objects' },
      { name: 'narrativeArc', type: 'string', description: 'One-paragraph narrative summary' },
      {
        name: 'suggestedTitle',
        type: 'string',
        description: 'Proposed presentation title if different from input',
      },
    ],
    evidenceRequirements: [
      {
        kind: 'document',
        label: 'Source brief',
        required: true,
        minCount: 1,
        description: 'Brief content must be provided to generate deck',
      },
    ],
    refusalPolicy: {
      triggers: [
        'brief is empty or under 50 words',
        'request to fabricate financial projections',
        'classified or NDA-protected material without authorization flag',
      ],
      refusalMessage:
        'Cannot generate a presentation without source content. Please provide a brief of at least 50 words.',
      logLevel: 'info',
    },
    evaluationRubric: [
      {
        id: 'slide-count',
        label: 'Slide Count Compliance',
        weight: 0.2,
        passingThreshold: 1.0,
        description: 'Number of slides respects maxSlides constraint',
        keywords: ['slide', 'slideNumber'],
      },
      {
        id: 'assertive-headlines',
        label: 'Assertive Headlines',
        weight: 0.4,
        passingThreshold: 0.7,
        description: 'Headlines make a claim, not just name a topic',
        keywords: ['grew', 'increased', 'exceeds', 'requires', 'enables'],
      },
      {
        id: 'speaker-notes',
        label: 'Speaker Note Quality',
        weight: 0.4,
        passingThreshold: 0.6,
        description: 'Speaker notes add context not visible on slide',
        keywords: ['note', 'speaker', 'mention', 'emphasize', 'if asked'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'Board expansion strategy deck',
        input: {
          title: 'Sunbelt Market Expansion',
          audience: 'Board of Directors',
          goal: 'Approve $5M expansion budget',
          duration: 15,
          briefContent:
            'Revenue grew 34% YoY. Sunbelt markets represent 60% of our pipeline. We need $5M to hire 12 regional brokers and open 3 offices. ROI projected at 3.2x over 24 months.',
          maxSlides: 8,
          tone: 'executive',
        },
        output: JSON.stringify(
          {
            slides: [
              {
                slideNumber: 1,
                headline: 'Sunbelt expansion delivers 3.2x ROI — approval needed today',
                bullets: [
                  '34% YoY revenue growth validates market thesis',
                  '60% of pipeline concentrated in Sunbelt',
                  '$5M investment unlocks $16M projected return',
                ],
                speakerNote:
                  "Start with the bottom line. They'll want to know the ask and the return before diving into details.",
                visualSuggestion: 'ROI waterfall chart',
              },
            ],
            narrativeArc: 'Open with ROI, prove with growth data, close with investment ask.',
            suggestedTitle: 'Sunbelt Expansion: A 3.2x Return Within Reach',
          },
          null,
          2,
        ),
      },
    ],
  },
};
