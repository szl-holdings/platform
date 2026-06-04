import type { PromptKernel } from '../types.js';

export const ambientCaptureRecapKernel: PromptKernel = {
  id: 'ambient-capture-recap',
  version: '1.0.0',
  name: 'Ambient Capture & Recap',
  description:
    'Converts raw meeting transcript or audio notes into a structured recap with action items, decisions, and open questions — Granola-style.',
  pattern: 'ambient-capture-recap',
  domain: 'productivity',
  verticals: ['counsel', 'command', 'pulse', 'szl-holdings'],
  inspirations: ['Granola', 'Notion'],
  tags: ['meeting', 'recap', 'action-items', 'transcript'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are an expert meeting scribe and business analyst. Convert raw transcripts into clean, actionable meeting recaps. Extract every commitment, decision, and open question. Attribute items to speakers when identified. Be concise — executives read these in under 2 minutes.',
  template: `Produce a structured meeting recap from the following transcript:

Meeting title: {{title}}
Date: {{date}}
Participants: {{participants}}

Transcript:
{{transcript}}

Additional notes from host: {{hostNotes}}

Output format:
1. **TL;DR** (2–3 sentences max)
2. **Decisions Made** (bulleted list with owner)
3. **Action Items** (table: task | owner | due date)
4. **Open Questions** (bulleted list)
5. **Next Meeting** (if mentioned)`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 1500,
    temperature: 0.2,
    responseFormat: 'markdown',
  },
  codex: {
    role: 'Expert meeting scribe and business analyst specializing in actionable recaps',
    contract:
      'Produces a structured meeting recap with TL;DR, decisions, action items (with owners), open questions, and next steps. Does not add information not present in the transcript.',
    inputSchema: [
      {
        name: 'title',
        type: 'string',
        description: 'Meeting title or subject',
        required: true,
        example: 'Q2 Budget Review',
      },
      {
        name: 'date',
        type: 'string',
        description: 'Meeting date in ISO format',
        required: true,
        example: '2026-04-25',
      },
      {
        name: 'participants',
        type: 'array',
        description: 'List of participant names and roles',
        required: false,
        example: '["Alice Chen (CFO)", "Bob Marsh (VP Eng)"]',
      },
      {
        name: 'transcript',
        type: 'string',
        description: 'Raw meeting transcript text or voice-to-text output',
        required: true,
        example: '[00:00] Alice: Let\'s start with the budget review...',
      },
      {
        name: 'hostNotes',
        type: 'string',
        description: 'Any additional notes added by the meeting host',
        required: false,
        example: 'Follow up with legal before Friday.',
      },
    ],
    outputSchema: [
      { name: 'tldr', type: 'string', description: '2–3 sentence summary' },
      { name: 'decisions', type: 'array', description: 'Decisions made with owners' },
      {
        name: 'actionItems',
        type: 'array',
        description: 'Action items with task, owner, due date',
      },
      { name: 'openQuestions', type: 'array', description: 'Unresolved questions' },
      { name: 'nextMeeting', type: 'string', description: 'Next meeting details if mentioned' },
    ],
    evidenceRequirements: [
      {
        kind: 'document',
        label: 'Meeting transcript',
        required: true,
        minCount: 1,
        description: 'Raw transcript or voice note must be provided as source material',
      },
    ],
    refusalPolicy: {
      triggers: [
        'transcript is empty',
        'transcript contains personally identifiable medical or legal privilege information without consent flag',
      ],
      refusalMessage:
        'Cannot generate recap without a transcript. For privileged content, set the privileged=true flag to acknowledge attorney-client or physician-patient context.',
      logLevel: 'warn',
    },
    evaluationRubric: [
      {
        id: 'action-item-completeness',
        label: 'Action Item Completeness',
        weight: 0.4,
        passingThreshold: 0.7,
        description: 'Action items have owner and deadline where mentioned in transcript',
        keywords: ['action', 'owner', 'due', 'by', 'will'],
      },
      {
        id: 'decision-capture',
        label: 'Decision Capture',
        weight: 0.35,
        passingThreshold: 0.6,
        description: 'Decisions are accurately extracted and attributed',
        keywords: ['decided', 'agreed', 'confirmed', 'approved'],
      },
      {
        id: 'tldr-quality',
        label: 'TL;DR Quality',
        weight: 0.25,
        passingThreshold: 0.6,
        description: 'TL;DR is concise and captures the meeting purpose',
        keywords: ['meeting', 'discussed', 'agreed'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'Legal deposition prep recap',
        input: {
          title: 'Deposition Prep — Hartwell v. Meridian',
          date: '2026-04-24',
          participants: ['Sarah Kim (Lead Counsel)', 'James Ortiz (Client)'],
          transcript:
            "[00:00] Sarah: James, let's walk through the timeline. [00:30] James: The contract was signed March 3rd. I have the email. [01:00] Sarah: We'll need that email by Thursday. I'll file for an extension if needed. [02:00] Sarah: Any other documents you remember? [02:15] James: There might be a memo from February. [02:20] Sarah: Find it — it could be key.",
          hostNotes: 'Remind James to check his archive folder.',
        },
        output:
          "## Deposition Prep — Hartwell v. Meridian\n\n**TL;DR:** Prep session covered the March 3rd contract signing timeline. Client confirmed email evidence exists and a February memo may be relevant. Key documents needed by Thursday.\n\n**Decisions Made:**\n- Pursue extension filing if documents aren't received by Thursday (Sarah Kim)\n\n**Action Items:**\n| Task | Owner | Due |\n|------|-------|-----|\n| Provide contract signing email | James Ortiz | Thursday |\n| Locate February memo | James Ortiz | ASAP |\n| File for extension if needed | Sarah Kim | Thursday |\n\n**Open Questions:**\n- Exact contents and date of the February memo",
        notes: 'Shows attorney-client context with action items and open questions',
      },
    ],
  },
};
