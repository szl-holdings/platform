export interface WorkflowStep {
  step: number;
  name: string;
  agentId: string;
  description: string;
  approvalPoint?: boolean;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  trigger: string;
  description: string;
  steps: WorkflowStep[];
  agentSequence: string[];
  outputs: string[];
  approvalPoints: number;
  category: string;
  connectedProducts: string[];
  estimatedDuration: string;
  icon: string;
}

export const ALLOY_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "signal-to-insight",
    name: "Signal to Insight",
    trigger: "Inbound signal from Lyte monitoring or Vessels AIS",
    description: "Turns raw operational signals into structured, explainable insights with recommended actions. The standard intelligence pipeline.",
    steps: [
      { step: 1, name: "Signal Intake", agentId: "intake", description: "Receives and normalises the raw signal" },
      { step: 2, name: "Anomaly Classification", agentId: "monitoring", description: "Classifies against baseline and identifies patterns" },
      { step: 3, name: "Context Enrichment", agentId: "research", description: "Retrieves relevant history and knowledge base context" },
      { step: 4, name: "Insight Synthesis", agentId: "summary", description: "Produces structured insight with confidence score" },
      { step: 5, name: "Routing Decision", agentId: "routing", description: "Routes insight to relevant operators or systems" },
    ],
    agentSequence: ["intake", "monitoring", "research", "summary", "routing"],
    outputs: ["Structured insight brief", "Recommended actions", "Routed notification"],
    approvalPoints: 0,
    category: "Intelligence",
    connectedProducts: ["Lyte", "Vessels"],
    estimatedDuration: "45–90 seconds",
    icon: "📡",
  },
  {
    id: "document-request-to-output",
    name: "Document Request to Output",
    trigger: "Operator request or workflow trigger for a structured document",
    description: "Takes a document request and produces a reviewed, approval-ready document using system context and structured templates.",
    steps: [
      { step: 1, name: "Request Intake", agentId: "intake", description: "Receives and classifies the document request" },
      { step: 2, name: "Context Research", agentId: "research", description: "Pulls relevant data, history, and templates" },
      { step: 3, name: "Draft Generation", agentId: "document", description: "Generates structured document draft" },
      { step: 4, name: "Quality Review", agentId: "summary", description: "Reviews draft for completeness and accuracy" },
      { step: 5, name: "Human Approval", agentId: "approval", description: "Routes draft to approver with full context", approvalPoint: true },
      { step: 6, name: "Final Output", agentId: "coordinator", description: "Confirms approval and delivers final document" },
    ],
    agentSequence: ["intake", "research", "document", "summary", "approval", "coordinator"],
    outputs: ["Approved document", "Approval audit trail", "Delivery confirmation"],
    approvalPoints: 1,
    category: "Documents",
    connectedProducts: ["Carlota Jo", "Lyte", "Vessels"],
    estimatedDuration: "2–10 minutes",
    icon: "📄",
  },
  {
    id: "exception-to-action",
    name: "Exception to Action",
    trigger: "System exception, threshold breach, or anomaly detection",
    description: "Converts detected exceptions into structured remediation actions with human oversight for high-stakes decisions.",
    steps: [
      { step: 1, name: "Exception Detection", agentId: "exception", description: "Detects and classifies the exception" },
      { step: 2, name: "Impact Assessment", agentId: "monitoring", description: "Assesses scope and severity" },
      { step: 3, name: "Remediation Research", agentId: "research", description: "Identifies remediation options from knowledge base" },
      { step: 4, name: "Action Plan", agentId: "document", description: "Produces structured remediation plan" },
      { step: 5, name: "Escalation Decision", agentId: "approval", description: "Routes to appropriate responder with full context", approvalPoint: true },
    ],
    agentSequence: ["exception", "monitoring", "research", "document", "approval"],
    outputs: ["Exception report", "Remediation plan", "Escalation record", "Action confirmation"],
    approvalPoints: 1,
    category: "Operations",
    connectedProducts: ["Lyte", "Vessels", "Aegis"],
    estimatedDuration: "1–5 minutes",
    icon: "⚠️",
  },
  {
    id: "intake-to-triage",
    name: "Intake to Triage",
    trigger: "New request, submission, or inbound task from any connected system",
    description: "Processes inbound requests through structured triage, assigns priority, and routes to the correct workflow or team.",
    steps: [
      { step: 1, name: "Input Normalisation", agentId: "intake", description: "Standardises input format and extracts structured data" },
      { step: 2, name: "Classification", agentId: "routing", description: "Classifies by type, urgency, and required skills" },
      { step: 3, name: "Priority Scoring", agentId: "monitoring", description: "Assigns priority based on impact and urgency" },
      { step: 4, name: "Triage Summary", agentId: "summary", description: "Produces triage brief with recommended next steps" },
      { step: 5, name: "Assignment", agentId: "routing", description: "Routes to the correct queue, workflow, or operator" },
    ],
    agentSequence: ["intake", "routing", "monitoring", "summary", "routing"],
    outputs: ["Triaged task", "Priority assignment", "Routing decision", "Triage brief"],
    approvalPoints: 0,
    category: "Operations",
    connectedProducts: ["Carlota Jo", "Lyte", "Vessels"],
    estimatedDuration: "20–60 seconds",
    icon: "🔀",
  },
  {
    id: "human-review-to-execution",
    name: "Human Review to Execution",
    trigger: "Pending approval action requiring human decision before system execution",
    description: "Ensures high-stakes actions are reviewed by the right person with full context before any system executes them.",
    steps: [
      { step: 1, name: "Action Preparation", agentId: "coordinator", description: "Assembles all context for the pending action" },
      { step: 2, name: "Risk Assessment", agentId: "exception", description: "Evaluates risks and flags concerns" },
      { step: 3, name: "Briefing Generation", agentId: "document", description: "Generates human-readable decision brief" },
      { step: 4, name: "Human Review", agentId: "approval", description: "Presents brief to approver, captures decision", approvalPoint: true },
      { step: 5, name: "Conditional Execution", agentId: "coordinator", description: "Executes approved action or records rejection" },
    ],
    agentSequence: ["coordinator", "exception", "document", "approval", "coordinator"],
    outputs: ["Decision record", "Execution confirmation or rejection", "Audit trail"],
    approvalPoints: 1,
    category: "Governance",
    connectedProducts: ["All products"],
    estimatedDuration: "Operator-dependent",
    icon: "🔐",
  },
  {
    id: "multi-step-agentic",
    name: "Multi-Step Agentic Orchestration",
    trigger: "Complex operator request or compound workflow trigger",
    description: "Coordinates multiple agents across a compound task — combining research, analysis, document generation, and conditional approvals in a single coordinated flow.",
    steps: [
      { step: 1, name: "Task Decomposition", agentId: "coordinator", description: "Breaks compound request into agent-level subtasks" },
      { step: 2, name: "Parallel Research", agentId: "research", description: "Multiple research threads run in parallel" },
      { step: 3, name: "Synthesis", agentId: "summary", description: "Combines parallel outputs into coherent result" },
      { step: 4, name: "Document Generation", agentId: "document", description: "Produces output artifacts" },
      { step: 5, name: "Readiness Check", agentId: "readiness", description: "Validates completeness and quality" },
      { step: 6, name: "Approval Gate", agentId: "approval", description: "Human review before final delivery", approvalPoint: true },
      { step: 7, name: "Final Delivery", agentId: "coordinator", description: "Confirms completion and archives results" },
    ],
    agentSequence: ["coordinator", "research", "summary", "document", "readiness", "approval", "coordinator"],
    outputs: ["Complete task outputs", "Audit chain", "Quality certification", "Delivery record"],
    approvalPoints: 1,
    category: "Advanced",
    connectedProducts: ["All products"],
    estimatedDuration: "5–30 minutes",
    icon: "🎯",
  },
];
