export interface UseCase {
  id: string;
  title: string;
  audience: string;
  problem: string;
  inputs: string[];
  alloyRole: string;
  outputs: string[];
  businessImpact: string;
  relatedProduct: string;
  icon: string;
  category: string;
}

export const ALLOY_USE_CASES: UseCase[] = [
  {
    id: 'lyte-observability',
    title: 'Operational Signal Intelligence',
    audience: 'IT operators and engineering leads using KORA',
    problem:
      'High signal volumes produce alert fatigue. Teams struggle to differentiate critical incidents from noise.',
    inputs: [
      'KORA service health streams',
      'alert feeds',
      'performance metrics',
      'historical incident data',
    ],
    alloyRole:
      'Counsel normalises incoming signals, applies reasoning to distinguish noise from genuine incidents, generates structured insight briefs, and routes actionable alerts to the right operators — removing manual triage.',
    outputs: [
      'Prioritised incident brief',
      'Recommended response',
      'Escalation routing',
      'Trend analysis',
    ],
    businessImpact:
      'Faster incident response, reduced alert fatigue, accountable escalation trails',
    relatedProduct: 'Command',
    icon: '⚡',
    category: 'Observability',
  },
  {
    id: 'readiness-monitoring',
    title: 'Readiness Assessment Automation',
    audience: 'Operations teams and compliance leads',
    problem:
      'Manual readiness assessments are slow, inconsistent, and hard to evidence for audits.',
    inputs: [
      'System health metrics',
      'workflow completion data',
      'compliance checklists',
      'resource states',
    ],
    alloyRole:
      'Counsel runs continuous readiness assessments against defined criteria, generates scored readiness reports, identifies gaps with specific remediation steps, and produces audit-ready evidence records.',
    outputs: ['Readiness score', 'Gap analysis', 'Improvement roadmap', 'Audit-ready evidence'],
    businessImpact: 'Consistent assessments, faster audit preparation, proactive gap closure',
    relatedProduct: 'Command',
    icon: '✅',
    category: 'Assessment',
  },
  {
    id: 'document-generation',
    title: 'On-Demand Document Generation',
    audience: 'Consulting teams and operators at Carlota Jo',
    problem:
      'Producing accurate, on-brand documents from fragmented operational data takes significant manual effort.',
    inputs: ['Client data', 'engagement history', 'templates', 'workflow outputs'],
    alloyRole:
      'Counsel assembles context from multiple sources, generates structured document drafts using templates, routes drafts through human review workflows, and delivers approved documents.',
    outputs: [
      'Draft documents',
      'Approval-ready outputs',
      'Final delivered documents',
      'Approval audit trail',
    ],
    businessImpact:
      'Significant reduction in document turnaround time, consistent output quality, full traceability',
    relatedProduct: 'Carlota Jo Consulting',
    icon: '📄',
    category: 'Documents',
  },
  {
    id: 'workflow-routing',
    title: 'Intelligent Workflow Routing',
    audience: 'Operations managers across all SZL products',
    problem:
      'Tasks and requests arrive through multiple channels, leading to misrouting, duplication, and missed priorities.',
    inputs: ['Inbound requests', 'task queues', 'operator availability', 'priority rules'],
    alloyRole:
      'Counsel classifies and prioritises inbound requests, applies routing rules with contextual reasoning, assigns tasks to the correct workflow or operator, and produces triage summaries.',
    outputs: [
      'Routed task with priority',
      'Triage brief',
      'Assignment confirmation',
      'Queue management',
    ],
    businessImpact:
      'Reduced misrouting, faster task assignment, clear accountability for every request',
    relatedProduct: 'Carlota Jo Consulting',
    icon: '🔀',
    category: 'Operations',
  },
  {
    id: 'exception-handling',
    title: 'Exception Detection and Response',
    audience: 'Operations and engineering teams on KORA and SEXTANT',
    problem:
      'Edge cases and operational exceptions require significant manual investigation before appropriate responses can be formed.',
    inputs: ['System anomalies', 'threshold breaches', 'unclassified events', 'outlier signals'],
    alloyRole:
      'Counsel detects anomalous conditions, assesses scope and impact, retrieves relevant remediation context, produces structured action plans, and routes high-stakes decisions to human review.',
    outputs: [
      'Exception classification',
      'Impact assessment',
      'Remediation plan',
      'Escalation record',
    ],
    businessImpact:
      'Faster exception resolution, structured response process, accountability at every step',
    relatedProduct: 'Command',
    icon: '⚠️',
    category: 'Operations',
  },
  {
    id: 'maritime-signal',
    title: 'Maritime Signal Interpretation',
    audience: 'Fleet operators and maritime intelligence teams using SEXTANT',
    problem:
      'Raw AIS signals and vessel status data require domain expertise to interpret meaningfully.',
    inputs: [
      'AIS vessel position data',
      'speed and heading signals',
      'weather conditions',
      'port status',
    ],
    alloyRole:
      'Counsel interprets maritime signals against operational context, identifies deviations from expected routing or behaviour, generates structured fleet intelligence briefings, and flags anomalies for operator review.',
    outputs: [
      'Fleet intelligence brief',
      'Deviation alerts',
      'Voyage summaries',
      'Operator notifications',
    ],
    businessImpact:
      'Reduced manual signal analysis, proactive deviation detection, structured fleet intelligence',
    relatedProduct: 'SEXTANT Maritime Intelligence',
    icon: '🚢',
    category: 'Maritime',
  },
  {
    id: 'internal-concierge',
    title: 'Internal Concierge Workflows',
    audience: 'Internal teams across SZL operations',
    problem:
      'Operational requests — research queries, status checks, document drafts — consume significant time across teams.',
    inputs: [
      'Ad-hoc operator requests',
      'status queries',
      'research prompts',
      'data retrieval tasks',
    ],
    alloyRole:
      'Counsel acts as an intelligent internal concierge: receiving requests, retrieving and synthesising information, generating structured responses, and routing complex requests to the appropriate specialist workflow.',
    outputs: ['Structured responses', 'Research summaries', 'Status briefs', 'Task confirmations'],
    businessImpact:
      'Reduced manual research overhead, faster response to internal requests, consistent quality',
    relatedProduct: 'All Products',
    icon: '💼',
    category: 'Operations',
  },
  {
    id: 'founder-operator-command',
    title: 'Founder and Operator Command Workflows',
    audience: 'Founders and senior operators managing multiple SZL products',
    problem:
      'Managing across multiple products simultaneously creates cognitive load and information gaps.',
    inputs: [
      'Cross-product system states',
      'priority flags',
      'pending approvals',
      'performance summaries',
    ],
    alloyRole:
      'Counsel produces cross-product operational digests, surfaces pending decisions requiring attention, provides explainable status summaries, and routes founder-level decisions through appropriate approval flows.',
    outputs: [
      'Cross-product digest',
      'Pending decision queue',
      'Status summaries',
      'Priority flags',
    ],
    businessImpact:
      'Reduced cognitive load for senior operators, structured decision queues, full ecosystem visibility',
    relatedProduct: 'All Products',
    icon: '🎯',
    category: 'Command',
  },
];
