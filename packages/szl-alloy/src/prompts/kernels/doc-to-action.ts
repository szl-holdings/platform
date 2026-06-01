import type { PromptKernel } from '../types.js';

export const docToActionKernel: PromptKernel = {
  id: 'doc-to-action',
  version: '1.0.0',
  name: 'Document to Action',
  description:
    'Extracts obligations, deadlines, risks, and executable actions from unstructured documents — Notion AI plus document intelligence pattern.',
  pattern: 'doc-to-action',
  domain: 'document-intelligence',
  verticals: ['counsel', 'terra', 'aegis', 'vessels', 'szl-holdings'],
  inspirations: ['Notion', 'Claude Cowork'],
  tags: ['document', 'extraction', 'obligations', 'actions', 'risk'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are an expert document analyst specializing in extracting actionable intelligence from contracts, briefs, and reports. Identify every obligation, deadline, risk, and required action. Be precise — miss nothing. Flag ambiguous language. Return a structured action register.',
  template: `Analyze the following document and extract actions:

Document type: {{documentType}}
Party perspective: {{partyPerspective}}
Document text:
{{documentText}}

Extract and return:
1. **Obligations Register** (table: obligation | responsible party | deadline | consequence)
2. **Deadline Calendar** (sorted by urgency)
3. **Risk Flags** (ambiguous terms, missing definitions, one-sided clauses)
4. **Executable Actions** (what must be done next, in priority order)
5. **Summary** (3-sentence executive overview)`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 2500,
    temperature: 0.1,
    responseFormat: 'markdown',
  },
  codex: {
    role: 'Expert document analyst extracting obligations, deadlines, risks, and actions from contracts and reports',
    contract:
      'Returns an obligations register, deadline calendar, risk flags, executable action list, and executive summary. Uses precise document language; flags ambiguities explicitly.',
    inputSchema: [
      {
        name: 'documentType',
        type: 'string',
        description: 'Type of document: contract | brief | report | lease | policy | other',
        required: true,
        example: 'commercial lease',
      },
      {
        name: 'partyPerspective',
        type: 'string',
        description: 'Which party\'s perspective to analyze from',
        required: false,
        example: 'Tenant',
      },
      {
        name: 'documentText',
        type: 'string',
        description: 'Full document text or relevant excerpts',
        required: true,
        example: 'Section 4.2: Tenant shall pay rent by the 1st of each month...',
      },
    ],
    outputSchema: [
      {
        name: 'obligationsRegister',
        type: 'array',
        description: 'Obligations with party, deadline, and consequence',
      },
      {
        name: 'deadlineCalendar',
        type: 'array',
        description: 'Sorted list of deadlines with urgency flags',
      },
      { name: 'riskFlags', type: 'array', description: 'Ambiguous or problematic clauses' },
      {
        name: 'executableActions',
        type: 'array',
        description: 'Priority-ordered actions to take',
      },
      { name: 'summary', type: 'string', description: '3-sentence executive overview' },
    ],
    evidenceRequirements: [
      {
        kind: 'document',
        label: 'Source document',
        required: true,
        minCount: 1,
        description: 'Document text must be provided',
      },
    ],
    refusalPolicy: {
      triggers: [
        'document text is empty',
        'document contains classified government information',
        'request for legal advice rather than document analysis',
      ],
      refusalMessage:
        'This tool extracts obligations and actions from documents. It does not provide legal advice. Please provide document text and consult qualified legal counsel for advice.',
      logLevel: 'warn',
    },
    evaluationRubric: [
      {
        id: 'obligation-completeness',
        label: 'Obligation Completeness',
        weight: 0.4,
        passingThreshold: 0.75,
        description: 'All explicit obligations in the document are captured',
        keywords: ['shall', 'must', 'required', 'obligation', 'responsible'],
      },
      {
        id: 'risk-identification',
        label: 'Risk Identification',
        weight: 0.35,
        passingThreshold: 0.6,
        description: 'Ambiguous language and risky clauses are flagged',
        keywords: ['risk', 'ambiguous', 'unclear', 'one-sided', 'flag'],
      },
      {
        id: 'action-specificity',
        label: 'Action Specificity',
        weight: 0.25,
        passingThreshold: 0.7,
        description: 'Actions are specific and immediately executable',
        keywords: ['by', 'before', 'send', 'review', 'confirm', 'sign'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'Commercial lease obligations extract',
        input: {
          documentType: 'commercial lease',
          partyPerspective: 'Tenant',
          documentText:
            'Section 4.2: Tenant shall pay base rent of $45,000 monthly by the 1st. Late fee of 5% applies after the 5th. Section 7.1: Tenant must obtain Landlord approval for alterations exceeding $10,000. Section 12: Tenant shall maintain $2M general liability insurance at all times.',
        },
        output:
          '## Document Action Extraction: Commercial Lease (Tenant Perspective)\n\n**Obligations Register:**\n| Obligation | Party | Deadline | Consequence |\n|------------|-------|----------|-------------|\n| Pay $45,000 rent | Tenant | 1st of month | 5% late fee after 5th |\n| Obtain approval for >$10K alterations | Tenant | Before alteration | Breach of lease |\n| Maintain $2M liability insurance | Tenant | Ongoing | Breach of lease |\n\n**Risk Flags:**\n- "Alterations exceeding $10,000" — threshold amount ambiguous for multi-phase projects\n\n**Executable Actions:**\n1. Confirm liability insurance policy meets $2M requirement\n2. Calendar rent due date and 5-day grace period\n3. Document approval process for any planned alterations\n\n**Summary:** Tenant faces three primary obligations: monthly rent, alteration approval, and insurance maintenance. The alteration threshold language should be clarified before any renovation planning.',
      },
    ],
  },
};
