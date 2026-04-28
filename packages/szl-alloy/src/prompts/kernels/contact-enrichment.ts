import type { PromptKernel } from '../types.js';

export const contactEnrichmentKernel: PromptKernel = {
  id: 'contact-enrichment',
  version: '1.0.0',
  name: 'Contact Enrichment',
  description:
    'Enriches a sparse contact or lead record with inferred attributes, buying signals, and outreach personalization — Clay/Juicebox style.',
  pattern: 'contact-enrichment',
  domain: 'crm',
  verticals: ['terra', 'carlota-jo', 'vessels', 'szl-holdings'],
  inspirations: ['Clay', 'Juicebox', 'Superhuman'],
  tags: ['enrichment', 'crm', 'leads', 'personalization'],
  createdAt: '2026-04-25T00:00:00.000Z',
  systemPrompt:
    'You are an expert CRM analyst and growth researcher. Given sparse contact data and publicly available context, infer the most relevant business signals, decision-making power, and outreach angles. Always mark inferred fields clearly. Never fabricate specific facts — use "likely" or "probable" language for inferences.',
  template: `Enrich the following contact record:

Name: {{name}}
Company: {{company}}
Title: {{title}}
Email: {{email}}
LinkedIn: {{linkedinUrl}}
Recent activity: {{recentActivity}}
Industry context: {{industryContext}}

Produce an enriched profile with:
1. **Decision-Making Role** (economic buyer | champion | influencer | gatekeeper)
2. **Buying Signals** (list of inferred signals with confidence HIGH/MED/LOW)
3. **Personalization Hooks** (3 conversation starters based on their likely priorities)
4. **Outreach Angle** (one-paragraph cold outreach rationale)
5. **Risk Flags** (job changes, company stress signals, competitive relationships)`,
  modelHints: {
    preferredModel: 'claude-3-5-sonnet',
    maxTokens: 1200,
    temperature: 0.4,
    responseFormat: 'markdown',
  },
  codex: {
    role: 'Expert CRM analyst inferring buying signals and personalization from sparse contact data',
    contract:
      'Returns a structured enrichment profile. Inferred fields are marked with confidence levels. No fabrication of specific facts — only evidence-based inference from provided context.',
    inputSchema: [
      {
        name: 'name',
        type: 'string',
        description: 'Contact full name',
        required: true,
        example: 'Sarah Chen',
      },
      {
        name: 'company',
        type: 'string',
        description: 'Company name',
        required: true,
        example: 'Meridian Capital Partners',
      },
      {
        name: 'title',
        type: 'string',
        description: 'Job title',
        required: false,
        example: 'Head of Acquisitions',
      },
      {
        name: 'email',
        type: 'string',
        description: 'Email address',
        required: false,
        example: 'sarah.chen@meridiancap.com',
      },
      {
        name: 'linkedinUrl',
        type: 'string',
        description: 'LinkedIn profile URL',
        required: false,
        example: 'https://linkedin.com/in/sarahchen',
      },
      {
        name: 'recentActivity',
        type: 'string',
        description: 'Recent web, news, or social activity snippets',
        required: false,
        example: 'Posted about ESG due diligence process on LinkedIn 3 days ago',
      },
      {
        name: 'industryContext',
        type: 'string',
        description: 'Industry context, market trends, or competitive landscape',
        required: false,
        example: 'CRE investment in Sunbelt markets surging in 2026',
      },
    ],
    outputSchema: [
      {
        name: 'decisionMakingRole',
        type: 'string',
        description: 'Inferred role in buying process',
      },
      { name: 'buyingSignals', type: 'array', description: 'Signals with confidence levels' },
      {
        name: 'personalizationHooks',
        type: 'array',
        description: 'Conversation starters tailored to contact',
      },
      { name: 'outreachAngle', type: 'string', description: 'One-paragraph outreach rationale' },
      { name: 'riskFlags', type: 'array', description: 'Job change or stress signals' },
    ],
    evidenceRequirements: [
      {
        kind: 'signal',
        label: 'Contact data',
        required: true,
        minCount: 1,
        description: 'At minimum, name and company must be provided',
      },
    ],
    refusalPolicy: {
      triggers: [
        'request to fabricate email addresses',
        'request to infer home address or personal details',
        'GDPR-restricted jurisdiction without consent flag',
      ],
      refusalMessage:
        'Cannot enrich contact with personally identifiable or non-business information. Provide company and professional context only.',
      logLevel: 'warn',
    },
    evaluationRubric: [
      {
        id: 'signal-confidence',
        label: 'Signal Confidence Labeling',
        weight: 0.35,
        passingThreshold: 0.7,
        description: 'Buying signals include HIGH/MED/LOW confidence labels',
        keywords: ['HIGH', 'MED', 'LOW', 'likely', 'probable'],
      },
      {
        id: 'personalization-quality',
        label: 'Personalization Quality',
        weight: 0.35,
        passingThreshold: 0.6,
        description: 'Conversation starters are specific to the contact, not generic',
        keywords: ['you', 'your', 'based on', 'given that'],
      },
      {
        id: 'outreach-angle',
        label: 'Outreach Angle Clarity',
        weight: 0.3,
        passingThreshold: 0.6,
        description: 'One-paragraph outreach rationale is clear and actionable',
        keywords: ['reach out', 'contact', 'opportunity', 'value'],
      },
    ],
    examples: [
      {
        id: 'ex-001',
        description: 'CRE acquisition lead enrichment',
        input: {
          name: 'Marcus Webb',
          company: 'Sunbelt Realty Group',
          title: 'Director of Acquisitions',
          recentActivity: 'Commented on multifamily rent growth article, shared ESG report',
          industryContext: 'Sunbelt multifamily market seeing 8% rent growth YoY in 2026',
        },
        output:
          '## Contact Enrichment: Marcus Webb — Sunbelt Realty Group\n\n**Decision-Making Role:** Economic Buyer (likely approves acquisition budgets)\n\n**Buying Signals:**\n- Active in ESG/sustainability content — HIGH\n- Sunbelt multifamily focus aligns with current market — HIGH\n- Director title suggests budget authority — MED\n\n**Personalization Hooks:**\n1. Reference the ESG report he shared — ask about their sustainability scoring approach for acquisitions\n2. Mention the Sunbelt rent growth data and ask how it\'s affecting their cap rate models\n3. Ask about their current deal pipeline velocity given market conditions\n\n**Outreach Angle:** Marcus is actively engaged with ESG and Sunbelt market content, suggesting he\'s currently evaluating acquisitions with sustainability criteria. Lead with how DOMAINE\'s climate risk scoring aligns with ESG due diligence to earn a conversation about current pipeline.\n\n**Risk Flags:** None identified.',
      },
    ],
  },
};
