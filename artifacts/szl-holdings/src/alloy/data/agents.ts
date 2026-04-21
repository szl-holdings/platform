export interface AgentDefinition {
  id: string;
  name: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  escalationMode: 'auto' | 'threshold' | 'always' | 'never';
  approvalRequired: boolean;
  systemsConnected: string[];
  status: 'active' | 'standby' | 'building';
  icon: string;
  category: string;
  confidenceThreshold?: number;
}

export const ALLOY_AGENTS: AgentDefinition[] = [
  {
    id: 'intake',
    name: 'Intake Agent',
    purpose:
      'Receives, classifies, and normalises raw inputs from connected systems before passing them downstream.',
    inputs: [
      'API signals',
      'webhook payloads',
      'form submissions',
      'file uploads',
      'system events',
    ],
    outputs: [
      'Normalised data objects',
      'classification tags',
      'priority scores',
      'routing instructions',
    ],
    escalationMode: 'threshold',
    approvalRequired: false,
    systemsConnected: ['KORA', 'SEXTANT', 'Carlota Jo', 'External APIs'],
    status: 'active',
    icon: '📥',
    category: 'Processing',
    confidenceThreshold: 0.85,
  },
  {
    id: 'monitoring',
    name: 'Monitoring Agent',
    purpose:
      'Continuously watches connected systems for anomalies, threshold breaches, and status changes.',
    inputs: [
      'System health metrics',
      'service status streams',
      'vessel AIS signals',
      'operational logs',
    ],
    outputs: ['Health summaries', 'anomaly alerts', 'degradation warnings', 'trend reports'],
    escalationMode: 'threshold',
    approvalRequired: false,
    systemsConnected: ['KORA', 'SEXTANT', 'API Server'],
    status: 'active',
    icon: '📡',
    category: 'Observability',
    confidenceThreshold: 0.9,
  },
  {
    id: 'routing',
    name: 'Routing Agent',
    purpose:
      'Determines where tasks, escalations, and outputs should go based on context, priority, and system state.',
    inputs: ['Classified tasks', 'escalation triggers', 'team availability', 'workflow rules'],
    outputs: [
      'Routed task assignments',
      'escalation paths',
      'notification targets',
      'queue entries',
    ],
    escalationMode: 'auto',
    approvalRequired: false,
    systemsConnected: ['KORA', 'Carlota Jo', 'Admin Panel'],
    status: 'active',
    icon: '🔀',
    category: 'Orchestration',
  },
  {
    id: 'summary',
    name: 'Summary Agent',
    purpose:
      'Synthesises complex inputs into structured, human-readable summaries and operational digests.',
    inputs: [
      'Multi-source data sets',
      'conversation logs',
      'system state snapshots',
      'event histories',
    ],
    outputs: [
      'Executive summaries',
      'operational digests',
      'status briefings',
      'incident narratives',
    ],
    escalationMode: 'never',
    approvalRequired: false,
    systemsConnected: ['KORA', 'SEXTANT', 'SZL Cortex', 'Carlota Jo'],
    status: 'active',
    icon: '📋',
    category: 'Output',
  },
  {
    id: 'document',
    name: 'Document Agent',
    purpose:
      'Generates structured documents, reports, and proposals from structured data and workflow context.',
    inputs: ['Workflow outputs', 'structured data', 'templates', 'approval contexts'],
    outputs: ['Generated reports', 'proposals', 'compliance documents', 'case notes', 'briefs'],
    escalationMode: 'threshold',
    approvalRequired: true,
    systemsConnected: ['Carlota Jo', 'SEXTANT', 'KORA'],
    status: 'active',
    icon: '📄',
    category: 'Output',
    confidenceThreshold: 0.8,
  },
  {
    id: 'exception',
    name: 'Exception Agent',
    purpose:
      'Detects, flags, and handles anomalous conditions that fall outside defined operating parameters.',
    inputs: ['System alerts', 'threshold breach events', 'unclassified inputs', 'outlier signals'],
    outputs: [
      'Exception reports',
      'escalation triggers',
      'remediation suggestions',
      'human review flags',
    ],
    escalationMode: 'always',
    approvalRequired: true,
    systemsConnected: ['KORA', 'SEXTANT', 'PARAGON', 'Admin Panel'],
    status: 'active',
    icon: '⚠️',
    category: 'Control',
  },
  {
    id: 'readiness',
    name: 'Readiness Agent',
    purpose:
      'Assesses operational readiness across systems, teams, and workflows against defined criteria.',
    inputs: [
      'System health reports',
      'compliance data',
      'workflow completion rates',
      'resource states',
    ],
    outputs: ['Readiness scores', 'gap analyses', 'improvement roadmaps', 'readiness certificates'],
    escalationMode: 'threshold',
    approvalRequired: false,
    systemsConnected: ['KORA', 'SEXTANT', 'Carlota Jo'],
    status: 'active',
    icon: '✅',
    category: 'Assessment',
    confidenceThreshold: 0.75,
  },
  {
    id: 'approval',
    name: 'Approval Agent',
    purpose:
      'Manages human-in-the-loop approval flows, routing decisions to the right people with full context.',
    inputs: ['Pending actions', 'document drafts', 'exception flags', 'high-stakes outputs'],
    outputs: [
      'Approval requests',
      'decision records',
      'audit trails',
      'approved/rejected outcomes',
    ],
    escalationMode: 'always',
    approvalRequired: true,
    systemsConnected: ['All systems'],
    status: 'active',
    icon: '🔐',
    category: 'Governance',
  },
  {
    id: 'research',
    name: 'Research Agent',
    purpose:
      'Retrieves, synthesises, and contextualises information from knowledge bases and external sources.',
    inputs: [
      'Research queries',
      'knowledge base documents',
      'system context',
      'external data requests',
    ],
    outputs: [
      'Research summaries',
      'sourced answers',
      'contextual recommendations',
      'intelligence briefs',
    ],
    escalationMode: 'never',
    approvalRequired: false,
    systemsConnected: ['SZL Cortex', 'Alloy KB', 'External APIs'],
    status: 'active',
    icon: '🔍',
    category: 'Intelligence',
  },
  {
    id: 'coordinator',
    name: 'Workflow Coordinator',
    purpose:
      'Orchestrates multi-step, multi-agent workflows ensuring correct sequencing, handoffs, and completion.',
    inputs: ['Workflow definitions', 'agent outputs', 'approval decisions', 'system states'],
    outputs: [
      'Workflow progress updates',
      'completion confirmations',
      'handoff instructions',
      'audit logs',
    ],
    escalationMode: 'threshold',
    approvalRequired: false,
    systemsConnected: ['All agents', 'All systems'],
    status: 'active',
    icon: '🎯',
    category: 'Orchestration',
    confidenceThreshold: 0.85,
  },
];
