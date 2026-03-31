export interface OutputType {
  id: string;
  name: string;
  description: string;
  examples: string[];
  format: string;
  approvalRequired: boolean;
  connectedProducts: string[];
  icon: string;
  category: string;
}

export const ALLOY_OUTPUTS: OutputType[] = [
  {
    id: "summaries",
    name: "Operational Summaries",
    description: "Structured, human-readable summaries of complex multi-source data sets, system states, and workflow outcomes.",
    examples: ["Fleet status summary", "Incident narrative", "Daily ops digest", "Session brief"],
    format: "Structured markdown with key metrics and recommended actions",
    approvalRequired: false,
    connectedProducts: ["Lyte", "Vessels", "Carlota Jo"],
    icon: "📋",
    category: "Intelligence",
  },
  {
    id: "alerts",
    name: "Structured Alerts",
    description: "Contextualised, prioritised alerts with root cause context and recommended response — not raw system notifications.",
    examples: ["Anomaly alert with context", "Threshold breach with trend", "Service degradation with history"],
    format: "Prioritised alert with severity, context, and recommended action",
    approvalRequired: false,
    connectedProducts: ["Lyte", "Vessels"],
    icon: "🔔",
    category: "Operations",
  },
  {
    id: "action-queues",
    name: "Action Queues",
    description: "Ordered, contextualised lists of pending actions requiring human attention or operator execution.",
    examples: ["Approval queue", "Exception queue", "Pending decisions queue", "Task assignment queue"],
    format: "Prioritised queue items with context, deadline, and ownership",
    approvalRequired: false,
    connectedProducts: ["All products"],
    icon: "📬",
    category: "Operations",
  },
  {
    id: "routed-tasks",
    name: "Routed Tasks",
    description: "Tasks classified, prioritised, and assigned to the correct operator, team, or workflow.",
    examples: ["Triaged support task", "Classified incident", "Prioritised request", "Escalated case"],
    format: "Task record with classification, priority, assignee, and context",
    approvalRequired: false,
    connectedProducts: ["Carlota Jo", "Lyte", "Vessels"],
    icon: "🎯",
    category: "Operations",
  },
  {
    id: "documents",
    name: "Generated Documents",
    description: "Structured, approval-ready documents produced from data and templates — reports, proposals, case notes, and briefs.",
    examples: ["Engagement proposal", "Compliance report", "Incident case note", "Readiness certificate"],
    format: "Formatted document with metadata, approval chain, and delivery record",
    approvalRequired: true,
    connectedProducts: ["Carlota Jo", "Lyte", "Vessels"],
    icon: "📄",
    category: "Documents",
  },
  {
    id: "proposals",
    name: "Proposals and Recommendations",
    description: "Structured recommendations with supporting evidence, options analysis, and confidence signals.",
    examples: ["Strategic recommendation", "Remediation proposal", "Investment thesis", "Operational recommendation"],
    format: "Recommendation with rationale, options, confidence score, and evidence",
    approvalRequired: true,
    connectedProducts: ["Carlota Jo", "All products"],
    icon: "💡",
    category: "Intelligence",
  },
  {
    id: "digests",
    name: "Operational Digests",
    description: "Periodic cross-product intelligence digests for senior operators and founders providing ecosystem-wide visibility.",
    examples: ["Daily cross-product digest", "Weekly fleet summary", "Incident week-in-review", "Founder command brief"],
    format: "Structured digest with status by product, priority items, and decision queue",
    approvalRequired: false,
    connectedProducts: ["All products"],
    icon: "📰",
    category: "Intelligence",
  },
  {
    id: "case-notes",
    name: "Case Notes",
    description: "Structured records of interactions, decisions, and outcomes attached to specific cases or engagements.",
    examples: ["Client engagement note", "Incident case record", "Vessel voyage note", "Exception resolution record"],
    format: "Timestamped case note with context, decision record, and linked artifacts",
    approvalRequired: false,
    connectedProducts: ["Carlota Jo", "Vessels", "Lyte"],
    icon: "📝",
    category: "Records",
  },
  {
    id: "approval-ready",
    name: "Approval-Ready Outputs",
    description: "Fully contextualised outputs prepared for human decision — containing everything needed for an informed approval.",
    examples: ["Decision brief", "Action authorisation request", "Document approval package", "Escalation review package"],
    format: "Decision package with context, options, risks, and approval interface",
    approvalRequired: true,
    connectedProducts: ["All products"],
    icon: "🔐",
    category: "Governance",
  },
];
