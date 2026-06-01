import type { PromptKernel } from '../types.js';

export const conversationalCrmKernel: PromptKernel = {
  id: 'conversational-crm',
  version: '1.0.0',
  name: 'Conversational CRM',
  description:
    'Maintains a natural-language dialogue with users to capture, update, and query CRM records — combining ManyChat conversational flow with Clay enrichment logic.',
  pattern: 'conversational-crm',
  domain: 'crm',
  verticals: ['carlota-jo', 'terra', 'szl-holdings'],
  inspirations: ['ManyChat', 'Clay', 'Superhuman'],
  tags: ['crm', 'conversational', 'dialogue', 'capture', 'update'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are a friendly, efficient CRM assistant. Help users capture, update, and retrieve contact and deal information through natural conversation. Extract structured data from casual language. Always confirm changes before writing. Suggest next best actions based on pipeline stage.',
  template: `CRM conversation session:

User message: "{{userMessage}}"
Current contact context: {{contactContext}}
Current deal stage: {{dealStage}}
Pipeline stage: {{pipelineStage}}
Recent interaction history: {{interactionHistory}}

Instructions:
- Extract any new contact info, deal updates, or notes from the message
- Confirm any data changes with the user before applying
- Suggest a next best action based on the current stage
- Keep responses under 100 words
- If clarification needed, ask one focused question

Respond naturally as a CRM assistant.`,
  modelHints: {
    preferredModel: 'gpt-4o',
    maxTokens: 400,
    temperature: 0.6,
    responseFormat: 'text',
  },
  codex: {
    role: 'Friendly CRM assistant capturing, updating, and querying records through natural dialogue',
    contract:
      'Extracts structured CRM data from natural language, confirms changes, suggests next actions, and keeps responses conversational and brief (<100 words). Never writes to CRM without user confirmation.',
    inputSchema: [
      {
        name: 'userMessage',
        type: 'string',
        description: 'The user\'s natural-language message',
        required: true,
        example: 'Just got off the phone with Marcus. He\'s interested but wants pricing first.',
      },
      {
        name: 'contactContext',
        type: 'object',
        description: 'Current contact record',
        required: false,
        example: '{"name": "Marcus Webb", "company": "Sunbelt Realty", "stage": "Qualified"}',
      },
      {
        name: 'dealStage',
        type: 'string',
        description: 'Current deal stage',
        required: false,
        example: 'Qualified',
      },
      {
        name: 'pipelineStage',
        type: 'string',
        description: 'Pipeline context',
        required: false,
        example: 'Mid-funnel',
      },
      {
        name: 'interactionHistory',
        type: 'array',
        description: 'Recent interaction log entries',
        required: false,
        example: '[{"date": "2026-04-24", "type": "email", "summary": "Sent deck"}]',
      },
    ],
    outputSchema: [
      { name: 'response', type: 'string', description: 'Conversational response to user' },
      { name: 'extractedUpdates', type: 'object', description: 'Structured CRM updates extracted' },
      { name: 'nextBestAction', type: 'string', description: 'Suggested next action' },
      {
        name: 'confirmationRequired',
        type: 'boolean',
        description: 'Whether user must confirm before changes apply',
      },
    ],
    evidenceRequirements: [],
    refusalPolicy: {
      triggers: [
        'request to delete all records for a contact',
        'request to impersonate contact in outreach',
      ],
      refusalMessage: 'I can\'t perform that action. Please confirm what you\'d like to update.',
      logLevel: 'info',
    },
    evaluationRubric: [
      {
        id: 'extraction-accuracy',
        label: 'Data Extraction',
        weight: 0.4,
        passingThreshold: 0.7,
        description: 'Structured CRM fields extracted from natural language',
        keywords: ['interested', 'stage', 'update', 'note', 'extract'],
      },
      {
        id: 'conversational-tone',
        label: 'Conversational Tone',
        weight: 0.3,
        passingThreshold: 0.7,
        description: 'Response is natural, brief, and friendly',
        keywords: ['got it', 'sure', 'great', 'noted', 'I\'ll'],
      },
      {
        id: 'next-action',
        label: 'Next Action Suggestion',
        weight: 0.3,
        passingThreshold: 0.6,
        description: 'A relevant next step is suggested',
        keywords: ['send', 'follow up', 'schedule', 'share', 'next'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'Post-call CRM update',
        input: {
          userMessage: "Just got off the phone with Marcus. He's interested but wants pricing first.",
          contactContext: { name: 'Marcus Webb', company: 'Sunbelt Realty', stage: 'Qualified' },
          dealStage: 'Qualified',
          interactionHistory: [{ date: '2026-04-24', type: 'email', summary: 'Sent intro deck' }],
        },
        output:
          "Got it! I'll log Marcus as interested and note he's requesting pricing. Should I move him to 'Pricing Review' stage and set a reminder to send the pricing deck tomorrow?",
        notes: 'Confirms before updating stage, suggests next action',
      },
    ],
  },
};
