// Shared local state for demo purposes

export let signals = [
  { id: 1, source: "AWS CloudWatch", sourceType: "monitoring", severity: "critical", title: "API Latency Spike in us-east-1", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 2, source: "Stripe", sourceType: "webhook", severity: "high", title: "Elevated Payment Failure Rate", status: "acknowledged", receivedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 3, source: "GitHub Actions", sourceType: "connector", severity: "medium", title: "Deploy Pipeline Timeout", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 4, source: "Datadog", sourceType: "monitoring", severity: "low", title: "Database CPU Utilization at 75%", status: "resolved", receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { id: 5, source: "Zendesk", sourceType: "connector", severity: "info", title: "Daily Support Ticket Summary", status: "dismissed", receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
  { id: 6, source: "Sentry", sourceType: "monitoring", severity: "critical", title: "Uncaught Exception: Auth Flow Failed", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
];

export let incidents = [
  { id: 101, title: "Checkout Gateway Outage", description: "Users unable to complete purchases due to downstream timeout.", severity: "critical", status: "investigating", assignee: "Alex C.", createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
  { id: 102, title: "Delayed Email Notifications", description: "Welcome emails taking >5 mins to send.", severity: "medium", status: "mitigating", assignee: "Sarah J.", createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: 103, title: "Reporting Dashboard 500 Errors", description: "Select customers seeing errors when generating Q3 reports.", severity: "high", status: "open", assignee: "Unassigned", createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 104, title: "Mobile App Crash on iOS 17", description: "Splash screen crash for subset of users on latest OS.", severity: "high", status: "resolved", assignee: "Mike D.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
];

export let recommendations = [
  { id: 201, title: "Scale RDS Read Replicas", description: "Database CPU consistently above 70% during peak hours. Adding a read replica will stabilize query latency.", category: "operational", impact: "high", effort: "medium", status: "suggested" },
  { id: 202, title: "Optimize S3 Storage Classes", description: "Over 50TB of rarely accessed objects in Standard tier. Transitioning to Infrequent Access will save ~$1,200/mo.", category: "cost_optimization", impact: "medium", effort: "low", status: "suggested" },
  { id: 203, title: "Implement Auth Rate Limiting", description: "Detected credential stuffing attempts. Implementing stricter IP rate limits is strongly advised.", category: "risk_mitigation", impact: "high", effort: "low", status: "in_progress" },
  { id: 204, title: "Update Terms of Service", description: "New EU regulations require updated data processing terms by end of quarter.", category: "compliance", impact: "medium", effort: "medium", status: "suggested" },
];

export let playbooks = [
  { id: 301, title: "Severity 1 Outage Response", category: "incident_response", description: "Standard operating procedure for handling total system outages.", content: "# Severity 1 Response\n\n## 1. Initial Triage\n- Establish incident bridge (Zoom/Slack).\n- Page on-call engineers.\n- Update statuspage.io to 'Investigating'.\n\n## 2. Investigation\n- Check Datadog for latency drops.\n- Verify AWS health dashboard.\n\n## 3. Mitigation\n- Rollback last deployment if within 1hr.\n- Scale resources if bottlenecked." },
  { id: 302, title: "Database Failover Protocol", category: "operations", description: "Steps to manually promote a read replica to primary.", content: "# DB Failover\n\n1. Stop application traffic (enable maintenance mode).\n2. Drain current connections.\n3. Promote replica via AWS Console.\n4. Update connection strings in Parameter Store." },
  { id: 303, title: "New Employee Onboarding", category: "onboarding", description: "IT checklist for new engineering hires.", content: "# Engineering Onboarding\n\n- Provision GitHub access.\n- Grant AWS SSO roles.\n- Invite to 1Password.\n- Ship hardware kit." },
  { id: 304, title: "SOC2 Compliance Audit", category: "compliance", description: "Annual preparation steps for SOC2 Type II audit.", content: "# SOC2 Audit Prep\n\n- Gather access reviews.\n- Validate background checks.\n- Verify encryption at rest." },
];

export let commandCards = [
  { id: 401, title: "Q3 Board Deck Prep", category: "strategy", priority: "high", status: "in_progress", assignee: "Elena R.", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString() },
  { id: 402, title: "Vendor Contract Renewals", category: "finance", priority: "medium", status: "pending", assignee: "Marcus T.", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString() },
  { id: 403, title: "Enterprise Pilot Review", category: "growth", priority: "critical", status: "pending", assignee: "Elena R.", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString() },
];
