import type { PromptKernel } from '../types.js';

export const coldOutreachKernel: PromptKernel = {
  id: 'cold-outreach',
  version: '1.0.0',
  name: 'Cold Outreach Generator',
  description:
    'Generates hyper-personalized cold outreach sequences using enriched contact data — Superhuman + Clay pattern for 1:1 at scale.',
  pattern: 'contact-enrichment',
  domain: 'sales',
  verticals: ['carlota-jo', 'terra', 'szl-holdings'],
  inspirations: ['Superhuman', 'Clay', 'Juicebox'],
  tags: ['outreach', 'sales', 'email', 'personalization', 'sequence'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are an elite sales writer specializing in hyper-personalized cold outreach that feels like 1:1 correspondence, not mass email. Every line must reference something specific to the prospect. First lines must be original and research-based. Subject lines must be curiosity-triggering, not spammy. Write like a human, not a template.',
  template: `Generate a cold outreach sequence for:

Sender: {{senderName}} at {{senderCompany}}
Prospect: {{prospectName}} at {{prospectCompany}}
Prospect role: {{prospectRole}}
Prospect signals: {{prospectSignals}}
Value proposition: {{valueProp}}
Sequence length: {{sequenceLength}} touches
Channel: {{channel}}

Write each touch with:
- subject (email) or opening line (LinkedIn)
- body (under 120 words)
- personalization note (explain why this is specific to them)
- optimal send time suggestion`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 2000,
    temperature: 0.7,
    responseFormat: 'json',
  },
  codex: {
    role: 'Elite sales writer creating hyper-personalized cold outreach that feels like 1:1 correspondence',
    contract:
      'Returns a JSON array of outreach touches, each with subject/opener, body (≤120 words), personalization note, and send timing. No generic phrases — every touch must reference prospect-specific signals.',
    inputSchema: [
      {
        name: 'senderName',
        type: 'string',
        description: 'Sender name',
        required: true,
        example: 'Alex Rivera',
      },
      {
        name: 'senderCompany',
        type: 'string',
        description: 'Sender company',
        required: true,
        example: 'DOMAINE Intelligence',
      },
      {
        name: 'prospectName',
        type: 'string',
        description: 'Prospect name',
        required: true,
        example: 'Marcus Webb',
      },
      {
        name: 'prospectCompany',
        type: 'string',
        description: 'Prospect company',
        required: true,
        example: 'Sunbelt Realty Group',
      },
      {
        name: 'prospectRole',
        type: 'string',
        description: 'Prospect job title',
        required: false,
        example: 'Director of Acquisitions',
      },
      {
        name: 'prospectSignals',
        type: 'string',
        description: 'Enriched prospect signals: recent activity, interests, company news',
        required: true,
        example: 'Shared ESG report on LinkedIn, attending CRE Forum next month',
      },
      {
        name: 'valueProp',
        type: 'string',
        description: 'Core value proposition to communicate',
        required: true,
        example: 'DOMAINE helps acquisition teams surface ESG-scored properties 3x faster',
      },
      {
        name: 'sequenceLength',
        type: 'number',
        description: 'Number of outreach touches (1–5)',
        required: false,
        example: 3,
      },
      {
        name: 'channel',
        type: 'string',
        description: 'Outreach channel: email | linkedin | both',
        required: false,
        example: 'email',
      },
    ],
    outputSchema: [
      { name: 'sequence', type: 'array', description: 'Array of outreach touch objects' },
      {
        name: 'sequenceSummary',
        type: 'string',
        description: 'One-line rationale for this sequence approach',
      },
    ],
    evidenceRequirements: [
      {
        kind: 'signal',
        label: 'Prospect signals',
        required: true,
        minCount: 1,
        description: 'At least one prospect-specific signal must be provided for personalization',
      },
    ],
    refusalPolicy: {
      triggers: [
        'prospect signals are empty',
        'request for spam or mass email without personalization',
        'request to send from fake identity',
      ],
      refusalMessage:
        'Cannot generate personalized outreach without prospect signals. Provide at least one specific detail about the prospect.',
      logLevel: 'info',
    },
    evaluationRubric: [
      {
        id: 'personalization-depth',
        label: 'Personalization Depth',
        weight: 0.5,
        passingThreshold: 0.8,
        description: 'Each touch references at least one specific prospect signal',
        keywords: ['your', 'you', 'noticed', 'saw', 'based on', 'congrats'],
      },
      {
        id: 'brevity',
        label: 'Brevity',
        weight: 0.3,
        passingThreshold: 0.9,
        description: 'Each touch body is under 120 words',
        keywords: [],
      },
      {
        id: 'subject-quality',
        label: 'Subject Line Quality',
        weight: 0.2,
        passingThreshold: 0.7,
        description: 'Subject lines are specific, not generic or spammy',
        keywords: [],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'CRE acquisition outreach',
        input: {
          senderName: 'Alex Rivera',
          senderCompany: 'DOMAINE Intelligence',
          prospectName: 'Marcus Webb',
          prospectCompany: 'Sunbelt Realty Group',
          prospectRole: 'Director of Acquisitions',
          prospectSignals: 'Shared ESG due diligence post on LinkedIn 3 days ago',
          valueProp: 'DOMAINE surfaces ESG-scored Sunbelt properties 3x faster',
          sequenceLength: 2,
          channel: 'email',
        },
        output: JSON.stringify(
          {
            sequence: [
              {
                touchNumber: 1,
                subject: 'ESG scoring for Sunbelt acquisitions',
                body: "Marcus — saw your post on ESG due diligence frameworks. We're seeing acquisition teams in the Sunbelt spend 2–3 weeks on ESG scoring per deal.\n\nTerra cuts that to under a week by layering climate risk, tenant ESG profiles, and regulatory exposure directly onto property comps.\n\nWould a 20-minute look be worth it? Happy to show you a Sunbelt-specific example.\n\nAlex",
                personalizationNote: 'References specific LinkedIn post on ESG due diligence',
                sendTiming: 'Tuesday or Thursday, 8–9am prospect local time',
              },
              {
                touchNumber: 2,
                subject: 'Re: ESG scoring — one data point',
                body: "Marcus — following up. One quick data point: of the 47 Sunbelt deals we scored this quarter, 23 had hidden climate exposure that standard comps missed.\n\nNot a pitch — just thought it might be relevant given your ESG focus. Happy to share the methodology if useful.\n\nAlex",
                personalizationNote: 'Adds specific data point relevant to ESG interest',
                sendTiming: '5 days after Touch 1, same time window',
              },
            ],
            sequenceSummary:
              'Lead with prospect-specific ESG signal, follow with credibility data point rather than another CTA.',
          },
          null,
          2,
        ),
      },
    ],
  },
};
