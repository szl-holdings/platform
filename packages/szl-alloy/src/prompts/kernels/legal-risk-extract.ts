import type { PromptKernel } from '../types.js';

export const legalRiskExtractKernel: PromptKernel = {
  id: 'legal-risk-extract',
  version: '1.0.0',
  name: 'Legal Risk Extraction',
  description:
    'Performs automated legal risk scoring on contracts and legal documents, identifying problematic clauses, missing protections, and negotiation leverage points.',
  pattern: 'doc-to-action',
  domain: 'legal',
  verticals: ['counsel', 'terra', 'vessels'],
  inspirations: ['Claude Cowork', 'Notion'],
  tags: ['legal', 'contract', 'risk', 'clauses', 'negotiation'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are a senior commercial attorney specializing in contract risk analysis. Identify every clause that creates risk, missing protective language, and imbalanced terms. Score overall risk on a 1–10 scale. Provide specific redline recommendations. This is analysis only — not legal advice.',
  template: `Perform legal risk analysis on the following document:

Document type: {{documentType}}
Client party: {{clientParty}}
Counterparty: {{counterparty}}
Jurisdiction: {{jurisdiction}}
Transaction value: {{transactionValue}}

Document text:
{{documentText}}

Produce:
1. **Overall Risk Score** (1–10, where 10=highest risk) with rationale
2. **High-Risk Clauses** (clause | risk description | severity | recommended redline)
3. **Missing Protections** (what should be there but isn't)
4. **Negotiation Leverage** (clauses that favor the client for concession trading)
5. **Priority Actions** (top 3 things to fix before signing)`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 2500,
    temperature: 0.15,
    responseFormat: 'markdown',
  },
  codex: {
    role: 'Senior commercial attorney conducting automated contract risk analysis',
    contract:
      'Returns risk score, high-risk clauses with redlines, missing protections, negotiation leverage points, and priority actions. Explicitly disclaims this is analysis, not legal advice.',
    inputSchema: [
      {
        name: 'documentType',
        type: 'string',
        description: 'Document type: contract | NDA | lease | SOW | term-sheet | other',
        required: true,
        example: 'commercial contract',
      },
      {
        name: 'clientParty',
        type: 'string',
        description: 'The party whose interests to protect',
        required: true,
        example: 'SZL Holdings (Buyer)',
      },
      {
        name: 'counterparty',
        type: 'string',
        description: 'The counterparty name',
        required: false,
        example: 'Meridian Logistics LLC (Seller)',
      },
      {
        name: 'jurisdiction',
        type: 'string',
        description: 'Governing jurisdiction',
        required: false,
        example: 'New York',
      },
      {
        name: 'transactionValue',
        type: 'string',
        description: 'Approximate transaction value for context',
        required: false,
        example: '$4.2M',
      },
      {
        name: 'documentText',
        type: 'string',
        description: 'Contract or document text',
        required: true,
        example: 'Section 8.1: In no event shall Seller be liable for...',
      },
    ],
    outputSchema: [
      { name: 'riskScore', type: 'number', description: 'Overall risk 1–10' },
      { name: 'highRiskClauses', type: 'array', description: 'Risky clauses with redlines' },
      {
        name: 'missingProtections',
        type: 'array',
        description: 'Protective language that is absent',
      },
      {
        name: 'negotiationLeverage',
        type: 'array',
        description: 'Clauses favorable to client for trading',
      },
      {
        name: 'priorityActions',
        type: 'array',
        description: 'Top 3 pre-signing actions',
      },
    ],
    evidenceRequirements: [
      {
        kind: 'document',
        label: 'Contract text',
        required: true,
        minCount: 1,
        description: 'Document text must be provided for analysis',
      },
    ],
    refusalPolicy: {
      triggers: [
        'document text is empty',
        'request for legal advice rather than document analysis',
        'document classified or under court order',
      ],
      refusalMessage:
        'DISCLAIMER: This is automated document analysis, not legal advice. Consult qualified counsel before acting on this analysis. Cannot analyze empty documents.',
      logLevel: 'warn',
    },
    evaluationRubric: [
      {
        id: 'risk-scoring',
        label: 'Risk Score Justification',
        weight: 0.3,
        passingThreshold: 0.7,
        description: 'Risk score is accompanied by specific clause-level rationale',
        keywords: ['risk', 'score', 'rationale', 'because', 'severity'],
      },
      {
        id: 'redline-specificity',
        label: 'Redline Specificity',
        weight: 0.4,
        passingThreshold: 0.7,
        description: 'Redlines are specific proposed language changes, not vague suggestions',
        keywords: ['replace', 'add', 'delete', 'change', 'insert', 'suggest'],
      },
      {
        id: 'missing-protections',
        label: 'Missing Protections Coverage',
        weight: 0.3,
        passingThreshold: 0.6,
        description: 'Standard protective clauses that are missing are identified',
        keywords: ['missing', 'absent', 'should include', 'no provision for', 'lacks'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'Commercial contract liability cap analysis',
        input: {
          documentType: 'commercial contract',
          clientParty: 'SZL Holdings (Buyer)',
          counterparty: 'Meridian Logistics LLC (Seller)',
          transactionValue: '$4.2M',
          documentText:
            'Section 8.1: In no event shall Seller be liable for indirect, incidental, or consequential damages. Section 8.2: Seller\'s total liability shall not exceed $50,000. Section 12: This agreement shall be governed by Delaware law.',
        },
        output:
          '## Legal Risk Analysis — Commercial Contract\n*DISCLAIMER: This is automated analysis, not legal advice.*\n\n**Overall Risk Score: 7/10** — Liability cap at $50,000 creates severe exposure on a $4.2M transaction.\n\n**High-Risk Clauses:**\n| Clause | Risk | Severity | Redline |\n|--------|------|----------|----------|\n| §8.2 Liability Cap ($50K) | Cap is 1.2% of transaction value; grossly inadequate | CRITICAL | "Seller\'s total liability shall not exceed the greater of $500,000 or 12% of the contract value" |\n| §8.1 Consequential Damages | Buyer cannot recover lost profits from Seller\'s breach | HIGH | Add carve-out: "...except for damages arising from Seller\'s gross negligence or willful misconduct" |\n\n**Missing Protections:**\n- No indemnification clause for third-party IP claims\n- No representations and warranties from Seller\n- No termination for convenience clause\n\n**Priority Actions:**\n1. Negotiate liability cap to minimum 12% of contract value (~$500K)\n2. Add IP indemnification and reps/warranties sections\n3. Request termination for convenience with 30-day notice',
      },
    ],
  },
};
