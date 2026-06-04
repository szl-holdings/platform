import type { PromptKernel } from '../types.js';

export const voiceToActionKernel: PromptKernel = {
  id: 'voice-to-action',
  version: '1.0.0',
  name: 'Voice to Action',
  description:
    'Parses a voice or typed natural-language command into a structured executable action with confidence scoring — Wispr Flow style.',
  pattern: 'voice-to-action',
  domain: 'automation',
  verticals: ['command', 'szl-holdings-mobile', 'aegis', 'lyte-command-center'],
  inspirations: ['Wispr Flow', 'Motion'],
  tags: ['voice', 'nlp', 'automation', 'intent', 'action'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are an intelligent command parser. Convert natural-language user utterances into structured, executable actions. Always confirm ambiguous intent rather than guessing. Return a JSON action envelope with intent, entity, parameters, confidence, and clarification fields.',
  template: `Parse the following user utterance into an executable action:

Utterance: "{{utterance}}"

Available action types: {{availableActions}}
User context: {{userContext}}
Tenant: {{tenantId}}

Rules:
- If confidence < 0.7, set needsClarification=true and provide a clarifying question
- Extract all named entities (people, dates, amounts, locations)
- Map to the closest available action type
- Flag if the action requires approval

Return valid JSON.`,
  modelHints: {
    preferredModel: 'gpt-4o',
    maxTokens: 512,
    temperature: 0.1,
    responseFormat: 'json',
  },
  codex: {
    role: 'Intelligent command parser that maps natural language to structured executable actions',
    contract:
      'Returns a JSON envelope with: intent, actionType, entities, parameters, confidence (0–1), needsClarification (bool), clarifyingQuestion, requiresApproval. Never executes actions, only parses intent.',
    inputSchema: [
      {
        name: 'utterance',
        type: 'string',
        description: 'The natural-language voice or typed command from the user',
        required: true,
        example: 'Schedule a meeting with David next Tuesday at 2pm about Q2 forecasts',
      },
      {
        name: 'availableActions',
        type: 'array',
        description: 'List of action type strings the system can execute',
        required: true,
        example: '["schedule-meeting", "send-email", "create-task", "run-report"]',
      },
      {
        name: 'userContext',
        type: 'object',
        description: 'User metadata: role, timezone, recent activities',
        required: false,
        example: '{"role": "VP Sales", "timezone": "America/New_York"}',
      },
      {
        name: 'tenantId',
        type: 'string',
        description: 'Tenant identifier for policy scoping',
        required: false,
        example: 'szl-holdings',
      },
    ],
    outputSchema: [
      {
        name: 'intent',
        type: 'string',
        description: 'Human-readable description of detected intent',
      },
      { name: 'actionType', type: 'string', description: 'Matched action type from available list' },
      {
        name: 'entities',
        type: 'object',
        description: 'Extracted named entities (people, dates, amounts)',
      },
      {
        name: 'parameters',
        type: 'object',
        description: 'Action parameters ready for execution',
      },
      { name: 'confidence', type: 'number', description: 'Confidence score 0–1' },
      {
        name: 'needsClarification',
        type: 'boolean',
        description: 'Whether clarification is needed',
      },
      {
        name: 'clarifyingQuestion',
        type: 'string',
        description: 'Question to ask user if needsClarification=true',
      },
      {
        name: 'requiresApproval',
        type: 'boolean',
        description: 'Whether this action needs human approval before execution',
      },
    ],
    evidenceRequirements: [],
    refusalPolicy: {
      triggers: [
        'utterance requests deletion of all records',
        'utterance targets external systems not in availableActions',
        'utterance contains PII exposure patterns',
      ],
      refusalMessage:
        'This command cannot be parsed into a safe executable action. Please rephrase or contact your administrator.',
      logLevel: 'warn',
    },
    evaluationRubric: [
      {
        id: 'json-validity',
        label: 'JSON Validity',
        weight: 0.4,
        passingThreshold: 1.0,
        description: 'Output is valid JSON with all required fields',
        keywords: ['intent', 'actionType', 'confidence', 'entities'],
      },
      {
        id: 'entity-extraction',
        label: 'Entity Extraction',
        weight: 0.35,
        passingThreshold: 0.7,
        description: 'Named entities (people, dates, amounts) are correctly extracted',
        keywords: ['person', 'date', 'amount', 'location'],
      },
      {
        id: 'ambiguity-handling',
        label: 'Ambiguity Handling',
        weight: 0.25,
        passingThreshold: 0.6,
        description: 'Ambiguous commands trigger needsClarification with a useful question',
        keywords: ['clarification', 'confirm', 'which', 'do you mean'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'Schedule meeting command',
        input: {
          utterance: 'Set up a call with Maria about the contract renewal next Monday at 10am EST',
          availableActions: ['schedule-meeting', 'send-email', 'create-task'],
          userContext: { role: 'Legal Counsel', timezone: 'America/New_York' },
          tenantId: 'szl-holdings',
        },
        output: JSON.stringify(
          {
            intent: 'Schedule a meeting with Maria about contract renewal',
            actionType: 'schedule-meeting',
            entities: {
              person: 'Maria',
              date: 'next Monday',
              time: '10:00 AM EST',
              topic: 'contract renewal',
            },
            parameters: {
              attendees: ['Maria'],
              proposedTime: '2026-04-27T10:00:00-05:00',
              subject: 'Contract Renewal Discussion',
            },
            confidence: 0.92,
            needsClarification: false,
            clarifyingQuestion: null,
            requiresApproval: false,
          },
          null,
          2,
        ),
        notes: 'High-confidence parse with full entity extraction',
      },
    ],
  },
};
