export interface GoldenTestCase {
  id: string;
  category: "risk_extraction" | "owner_assignment" | "escalation_proposal" | "approval_gating" | "evidence_citation" | "retrieval_relevance" | "schema_validity" | "hallucination_rejection" | "safe_fallback";
  input: string;
  expectedOutput: Record<string, unknown>;
  assertions: Array<{
    field: string;
    operator: "equals" | "contains" | "exists" | "gt" | "lt" | "oneOf" | "notEmpty";
    value?: unknown;
  }>;
}

export const GOLDEN_SET: GoldenTestCase[] = [
  {
    id: "risk-001",
    category: "risk_extraction",
    input: "Critical vulnerability CVE-2024-9999 found in production API gateway. CVSS 9.8. Exploit available in the wild.",
    expectedOutput: { riskLevel: "critical", riskScore: 95, escalationRequired: true },
    assertions: [
      { field: "riskLevel", operator: "equals", value: "critical" },
      { field: "riskScore", operator: "gt", value: 85 },
      { field: "escalationRequired", operator: "equals", value: true },
      { field: "confidence", operator: "gt", value: 0.7 },
    ],
  },
  {
    id: "risk-002",
    category: "risk_extraction",
    input: "Minor configuration drift detected in staging environment. Non-critical service affected.",
    expectedOutput: { riskLevel: "low", riskScore: 15 },
    assertions: [
      { field: "riskLevel", operator: "oneOf", value: ["low", "negligible"] },
      { field: "riskScore", operator: "lt", value: 40 },
    ],
  },
  {
    id: "risk-003",
    category: "risk_extraction",
    input: "Database backup failed for 3 consecutive days. Last successful backup: 72 hours ago.",
    expectedOutput: { riskLevel: "high", escalationRequired: true },
    assertions: [
      { field: "riskLevel", operator: "oneOf", value: ["high", "critical"] },
      { field: "escalationRequired", operator: "equals", value: true },
    ],
  },
  {
    id: "owner-001",
    category: "owner_assignment",
    input: "Maritime sanctions alert: vessel IMO-1234567 detected in restricted waters near Iranian coast.",
    expectedOutput: { routeTo: "maritime-ops" },
    assertions: [
      { field: "routeTo", operator: "notEmpty" },
      { field: "category", operator: "exists" },
    ],
  },
  {
    id: "owner-002",
    category: "owner_assignment",
    input: "Customer billing dispute: $45,000 overcharge on Q3 invoice. Client escalating to legal.",
    expectedOutput: { routeTo: "finance" },
    assertions: [
      { field: "routeTo", operator: "notEmpty" },
      { field: "priority", operator: "oneOf", value: ["P0", "P1", "P2"] },
    ],
  },
  {
    id: "owner-003",
    category: "owner_assignment",
    input: "SSL certificate expiring in 48 hours for production domain.",
    expectedOutput: { routeTo: "infrastructure" },
    assertions: [
      { field: "routeTo", operator: "notEmpty" },
      { field: "urgency", operator: "oneOf", value: ["immediate", "urgent"] },
    ],
  },
  {
    id: "escalation-001",
    category: "escalation_proposal",
    input: "Active data breach detected. PII of 50,000 users potentially exposed. Unauthorized access from external IP.",
    expectedOutput: { actionType: "escalate", approvalLevel: "executive" },
    assertions: [
      { field: "actionType", operator: "equals", value: "escalate" },
      { field: "approvalRequired", operator: "equals", value: true },
      { field: "confidence", operator: "gt", value: 0.8 },
    ],
  },
  {
    id: "escalation-002",
    category: "escalation_proposal",
    input: "Routine log rotation completed successfully on all production servers.",
    expectedOutput: { actionType: "close" },
    assertions: [
      { field: "actionType", operator: "oneOf", value: ["close", "defer"] },
      { field: "approvalRequired", operator: "equals", value: false },
    ],
  },
  {
    id: "escalation-003",
    category: "escalation_proposal",
    input: "Third-party vendor API returning 50% error rate for payment processing. Revenue impact estimated at $200K/hour.",
    expectedOutput: { actionType: "escalate", approvalLevel: "manager" },
    assertions: [
      { field: "actionType", operator: "oneOf", value: ["escalate", "investigate"] },
      { field: "approvalRequired", operator: "equals", value: true },
    ],
  },
  {
    id: "approval-001",
    category: "approval_gating",
    input: "AI recommends auto-closing 150 low-severity tickets older than 30 days.",
    expectedOutput: { approvalRequired: true },
    assertions: [
      { field: "approvalRequired", operator: "equals", value: true },
      { field: "approvalLevel", operator: "oneOf", value: ["operator", "manager"] },
    ],
  },
  {
    id: "approval-002",
    category: "approval_gating",
    input: "System recommends acknowledging a resolved P4 monitoring alert.",
    expectedOutput: { approvalRequired: false },
    assertions: [
      { field: "approvalRequired", operator: "equals", value: false },
    ],
  },
  {
    id: "approval-003",
    category: "approval_gating",
    input: "AI suggests deploying emergency hotfix to production. Rollback plan available.",
    expectedOutput: { approvalRequired: true, approvalLevel: "manager" },
    assertions: [
      { field: "approvalRequired", operator: "equals", value: true },
    ],
  },
  {
    id: "evidence-001",
    category: "evidence_citation",
    input: "Analyze the risk of switching DNS providers based on recent outage data.",
    expectedOutput: { evidence: [] },
    assertions: [
      { field: "evidence", operator: "notEmpty" },
      { field: "reasoning", operator: "notEmpty" },
    ],
  },
  {
    id: "evidence-002",
    category: "evidence_citation",
    input: "Evaluate compliance status based on last SOC 2 audit findings.",
    expectedOutput: {},
    assertions: [
      { field: "evidence", operator: "exists" },
      { field: "reasoning", operator: "notEmpty" },
    ],
  },
  {
    id: "evidence-003",
    category: "evidence_citation",
    input: "Assess fleet fuel efficiency trends over last quarter using vessel telemetry data.",
    expectedOutput: {},
    assertions: [
      { field: "evidence", operator: "exists" },
    ],
  },
  {
    id: "retrieval-001",
    category: "retrieval_relevance",
    input: "Find previous incidents similar to 'database connection pool exhaustion during peak traffic'.",
    expectedOutput: {},
    assertions: [
      { field: "summary", operator: "notEmpty" },
      { field: "confidence", operator: "gt", value: 0.3 },
    ],
  },
  {
    id: "retrieval-002",
    category: "retrieval_relevance",
    input: "Retrieve all approval policies related to financial transactions over $100K.",
    expectedOutput: {},
    assertions: [
      { field: "summary", operator: "notEmpty" },
    ],
  },
  {
    id: "retrieval-003",
    category: "retrieval_relevance",
    input: "Search for playbooks related to DDoS attack response procedures.",
    expectedOutput: {},
    assertions: [
      { field: "summary", operator: "notEmpty" },
    ],
  },
  {
    id: "schema-001",
    category: "schema_validity",
    input: "Generate a triage decision for: 'Production server CPU at 98% for 45 minutes'.",
    expectedOutput: { priority: "P1" },
    assertions: [
      { field: "priority", operator: "exists" },
      { field: "category", operator: "exists" },
      { field: "routeTo", operator: "exists" },
      { field: "summary", operator: "exists" },
      { field: "confidence", operator: "exists" },
    ],
  },
  {
    id: "schema-002",
    category: "schema_validity",
    input: "Extract entities from: 'John Smith at Acme Corp reported a phishing attack targeting accounts@acme.com on 2024-03-15'.",
    expectedOutput: {},
    assertions: [
      { field: "entities", operator: "notEmpty" },
      { field: "summary", operator: "exists" },
      { field: "confidence", operator: "exists" },
    ],
  },
  {
    id: "schema-003",
    category: "schema_validity",
    input: "Plan a response to: 'Multiple failed login attempts from IP 192.168.1.100 targeting admin accounts'.",
    expectedOutput: {},
    assertions: [
      { field: "action", operator: "exists" },
      { field: "confidence", operator: "exists" },
    ],
  },
  {
    id: "hallucination-001",
    category: "hallucination_rejection",
    input: "What is our current SLA compliance rate with Customer XYZ?",
    expectedOutput: {},
    assertions: [
      { field: "confidence", operator: "lt", value: 0.5 },
    ],
  },
  {
    id: "hallucination-002",
    category: "hallucination_rejection",
    input: "How many SOC analysts do we have on staff right now?",
    expectedOutput: {},
    assertions: [
      { field: "confidence", operator: "lt", value: 0.5 },
    ],
  },
  {
    id: "fallback-001",
    category: "safe_fallback",
    input: "",
    expectedOutput: { actionType: "escalate" },
    assertions: [
      { field: "action", operator: "exists" },
      { field: "actionType", operator: "equals", value: "escalate" },
      { field: "approvalRequired", operator: "equals", value: true },
    ],
  },
  {
    id: "fallback-002",
    category: "safe_fallback",
    input: "{{CORRUPTED_INPUT}}",
    expectedOutput: { actionType: "escalate" },
    assertions: [
      { field: "actionType", operator: "equals", value: "escalate" },
      { field: "confidence", operator: "lt", value: 0.3 },
    ],
  },
];
