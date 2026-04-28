import type { PromptKernel } from '../types.js';

export const meetingToCrmUpdateKernel: PromptKernel = {
  id: 'meeting-to-crm-update',
  version: '1.0.0',
  name: 'Meeting to CRM Update',
  description:
    'Converts a post-meeting transcript or voice note into structured CRM field updates, next steps, and sentiment scoring — combining Granola capture with Clay pipeline intelligence.',
  pattern: 'meeting-to-crm-update',
  domain: 'crm',
  verticals: ['szl-holdings', 'terra', 'carlota-jo'],
  inspirations: ['Granola', 'Clay', 'Superhuman'],
  tags: ['crm', 'meeting', 'pipeline', 'sentiment', 'update'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are a CRM intelligence engine. After a sales or relationship meeting, analyze the transcript to update CRM fields, score sentiment, identify objections, and set next steps. Output must be immediately importable into a CRM system as structured JSON.',
  template: `Convert the following meeting to CRM updates:

Contact: {{contactName}} at {{company}}
Current deal stage: {{currentStage}}
Meeting type: {{meetingType}}

Transcript:
{{transcript}}

Extract and return JSON with:
- dealStageUpdate (new stage if changed, else null)
- sentimentScore (1–5, where 5=very positive)
- engagementLevel (cold | warm | hot | champion)
- objections (list of objections raised)
- nextSteps (list with owner and due date)
- noteForCrm (one-paragraph CRM note)
- followUpEmail (draft subject line + first sentence)
- probabilityUpdate (updated win probability 0–1, null if unchanged)`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 1200,
    temperature: 0.3,
    responseFormat: 'json',
  },
  codex: {
    role: 'CRM intelligence engine converting meeting transcripts into structured pipeline updates',
    contract:
      'Returns a JSON object with deal stage update, sentiment score, engagement level, objections, next steps, CRM note, follow-up email draft, and probability update. All fields must be present; use null for unchanged fields.',
    inputSchema: [
      {
        name: 'contactName',
        type: 'string',
        description: 'Contact name',
        required: true,
        example: 'Marcus Webb',
      },
      {
        name: 'company',
        type: 'string',
        description: 'Company name',
        required: true,
        example: 'Sunbelt Realty Group',
      },
      {
        name: 'currentStage',
        type: 'string',
        description: 'Current CRM deal stage',
        required: true,
        example: 'Qualified',
      },
      {
        name: 'meetingType',
        type: 'string',
        description: 'Type of meeting: discovery | demo | negotiation | check-in | close',
        required: false,
        example: 'demo',
      },
      {
        name: 'transcript',
        type: 'string',
        description: 'Meeting transcript text',
        required: true,
        example: '[00:00] Rep: Thanks for joining today...',
      },
    ],
    outputSchema: [
      { name: 'dealStageUpdate', type: 'string', description: 'New deal stage or null' },
      { name: 'sentimentScore', type: 'number', description: 'Sentiment 1–5' },
      {
        name: 'engagementLevel',
        type: 'string',
        description: 'cold | warm | hot | champion',
      },
      { name: 'objections', type: 'array', description: 'List of objections raised' },
      {
        name: 'nextSteps',
        type: 'array',
        description: 'Steps with task, owner, and due date',
      },
      { name: 'noteForCrm', type: 'string', description: 'CRM-ready paragraph note' },
      {
        name: 'followUpEmail',
        type: 'object',
        description: 'Draft email with subject and opener',
      },
      {
        name: 'probabilityUpdate',
        type: 'number',
        description: 'Win probability 0–1 or null',
      },
    ],
    evidenceRequirements: [
      {
        kind: 'document',
        label: 'Meeting transcript',
        required: true,
        minCount: 1,
        description: 'Meeting transcript is required for CRM update extraction',
      },
    ],
    refusalPolicy: {
      triggers: [
        'transcript is empty',
        'no contact or company provided',
        'transcript involves personal non-business conversation',
      ],
      refusalMessage:
        'Cannot generate a CRM update without a meeting transcript and contact information.',
      logLevel: 'info',
    },
    evaluationRubric: [
      {
        id: 'json-completeness',
        label: 'JSON Completeness',
        weight: 0.4,
        passingThreshold: 1.0,
        description: 'All required JSON fields are present (nulls allowed)',
        keywords: ['dealStageUpdate', 'sentimentScore', 'objections', 'nextSteps'],
      },
      {
        id: 'objection-capture',
        label: 'Objection Capture',
        weight: 0.3,
        passingThreshold: 0.7,
        description: 'Objections raised in transcript are accurately captured',
        keywords: ['pricing', 'timeline', 'concern', 'objection', 'not sure'],
      },
      {
        id: 'follow-up-quality',
        label: 'Follow-up Email Quality',
        weight: 0.3,
        passingThreshold: 0.6,
        description: 'Follow-up email subject and opener are personalized and relevant',
        keywords: ['following up', 'great speaking', 'per our discussion', 'next step'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'Demo call CRM update',
        input: {
          contactName: 'Marcus Webb',
          company: 'Sunbelt Realty Group',
          currentStage: 'Qualified',
          meetingType: 'demo',
          transcript:
            "[00:00] Rep: Thanks Marcus. [00:30] Marcus: The analytics look powerful. My concern is the price — can you do better? [01:30] Rep: We can discuss volume pricing. [02:00] Marcus: I'll need to loop in our CFO before moving forward. [02:30] Rep: Let's set a call with her next week.",
        },
        output: JSON.stringify(
          {
            dealStageUpdate: 'Proposal',
            sentimentScore: 4,
            engagementLevel: 'warm',
            objections: ['Pricing concern — requesting discount', 'CFO approval required'],
            nextSteps: [
              { task: 'Schedule CFO call', owner: 'Rep', dueDate: 'Next week' },
              { task: 'Prepare volume pricing proposal', owner: 'Rep', dueDate: 'Before CFO call' },
            ],
            noteForCrm:
              'Demo went well. Marcus engaged with analytics product. Primary objection is pricing — open to volume discount. CFO approval required before moving to Proposal. Next step: 3-way call with CFO.',
            followUpEmail: {
              subject: 'Next Steps — Sunbelt Realty x DOMAINE',
              opener:
                "Marcus, great connecting today — I'm putting together a volume pricing scenario and would love to get 30 minutes with you and your CFO next week.",
            },
            probabilityUpdate: 0.55,
          },
          null,
          2,
        ),
      },
    ],
  },
};
