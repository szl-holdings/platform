export interface GovernanceControl {
  id: string;
  name: string;
  description: string;
  mechanism: string;
  appliesTo: string[];
  icon: string;
  category: string;
}

export const GOVERNANCE_CONTROLS: GovernanceControl[] = [
  {
    id: "human-approval",
    name: "Human Approval Flows",
    description: "High-stakes actions require explicit human approval before execution. Alloy never acts unilaterally on consequential decisions.",
    mechanism: "Approval agent routes pending actions to the correct role with full context. Decision is captured and audited before execution proceeds.",
    appliesTo: ["Document delivery", "Exception actions", "External communications", "System-modifying actions"],
    icon: "👤",
    category: "Approval",
  },
  {
    id: "confidence-signals",
    name: "Confidence Signals",
    description: "Every Alloy output includes a confidence score. Low-confidence outputs are flagged for human review rather than silently delivered.",
    mechanism: "Agents emit confidence scores with outputs. Outputs below configurable thresholds are routed to the exception queue or approval agent automatically.",
    appliesTo: ["All agent outputs", "Document drafts", "Recommendations", "Routing decisions"],
    icon: "📊",
    category: "Quality",
  },
  {
    id: "auditability",
    name: "Complete Audit Trails",
    description: "Every workflow execution is logged with full provenance — what data was used, which agents processed it, what decisions were made, and who approved what.",
    mechanism: "Immutable workflow execution logs capture every step, agent decision, and human interaction. Audit records are retained and queryable.",
    appliesTo: ["All workflows", "All agent executions", "All approvals", "All deliveries"],
    icon: "📋",
    category: "Audit",
  },
  {
    id: "explainability",
    name: "Explainable Outputs",
    description: "Alloy outputs include plain-language explanations of why a conclusion was reached, what data was used, and what assumptions were made.",
    mechanism: "Agents are instructed to produce explainable outputs. Summary agent adds rationale sections. Complex reasoning is surfaced, not hidden.",
    appliesTo: ["Recommendations", "Escalation triggers", "Anomaly classifications", "Document drafts"],
    icon: "💬",
    category: "Transparency",
  },
  {
    id: "escalation-logic",
    name: "Structured Escalation Logic",
    description: "Alloy applies configurable escalation rules — ensuring the right person sees the right issue at the right time, without bypassing oversight.",
    mechanism: "Exception and routing agents apply escalation rules by severity, type, and system state. Escalation paths are pre-defined and audited.",
    appliesTo: ["Anomaly alerts", "Exception handling", "High-priority tasks", "Approval timeouts"],
    icon: "🔼",
    category: "Control",
  },
  {
    id: "role-based-control",
    name: "Role-Based Control Patterns",
    description: "Approval requirements and access to high-stakes outputs are governed by operator role — not every user can approve every action.",
    mechanism: "Approval agent checks role permissions before routing for approval. Role definitions are configurable per product and action type.",
    appliesTo: ["Document approvals", "Exception actions", "High-stakes routing", "System commands"],
    icon: "🔑",
    category: "Access",
  },
  {
    id: "workflow-boundaries",
    name: "Safe Workflow Boundaries",
    description: "Agents operate within defined boundaries. Alloy agents cannot take actions outside their defined scope without explicit configuration.",
    mechanism: "Agents are scoped to specific input types, output types, and connected systems. Out-of-scope requests are routed to the coordinator for human-defined expansion.",
    appliesTo: ["All agent operations", "System connections", "External data access", "Action execution"],
    icon: "🚧",
    category: "Boundaries",
  },
  {
    id: "rejection-records",
    name: "Rejection and Override Records",
    description: "When a human rejects an Alloy recommendation or overrides an approval, the decision and reasoning are captured.",
    mechanism: "Approval agent captures rejection decisions with optional reasoning. Override records are maintained in the audit trail alongside approvals.",
    appliesTo: ["All approval flows", "Recommendation decisions", "Exception actions"],
    icon: "📝",
    category: "Audit",
  },
];
