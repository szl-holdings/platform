export let signals = [
  { id: 1, source: "AWS CloudWatch", sourceType: "monitoring", severity: "critical" as const, title: "RDS Primary (prod-db-01) replication lag exceeds 120s — us-east-1", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
  { id: 2, source: "PagerDuty", sourceType: "alerting", severity: "critical" as const, title: "P1 Escalation: Payment processing pipeline stalled — Stripe webhook queue depth 14.2k", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString() },
  { id: 3, source: "Datadog APM", sourceType: "monitoring", severity: "critical" as const, title: "API Gateway p99 latency 8.4s (threshold 2s) — Kong ingress controller", status: "acknowledged", receivedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
  { id: 4, source: "Sentry", sourceType: "error_tracking", severity: "high" as const, title: "TypeError: Cannot read properties of undefined — auth-service v3.14.2 (2.4k events/hr)", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  { id: 5, source: "AWS CloudWatch", sourceType: "monitoring", severity: "high" as const, title: "EKS cluster prod-k8s-01 node group at 94% capacity — autoscaler throttled", status: "acknowledged", receivedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
  { id: 6, source: "Grafana", sourceType: "monitoring", severity: "high" as const, title: "Redis cluster (elasticache-prod) memory utilization 91% — eviction policy active", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
  { id: 7, source: "Datadog", sourceType: "monitoring", severity: "medium" as const, title: "Lambda function order-processor cold starts increased 340% after deployment", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString() },
  { id: 8, source: "Stripe", sourceType: "webhook", severity: "high" as const, title: "Payment decline rate 12.3% (baseline 2.1%) — issuer_decline_code: insufficient_funds spike", status: "acknowledged", receivedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
  { id: 9, source: "CloudFlare", sourceType: "cdn", severity: "medium" as const, title: "Edge cache hit ratio dropped to 62% (baseline 94%) — purge event detected", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
  { id: 10, source: "GitHub Actions", sourceType: "ci_cd", severity: "medium" as const, title: "Deploy pipeline main→prod timed out after 45m — Docker build stage OOM killed", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString() },
  { id: 11, source: "AWS GuardDuty", sourceType: "security", severity: "high" as const, title: "UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration — prod account 441902834", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 12, source: "Datadog", sourceType: "monitoring", severity: "medium" as const, title: "PostgreSQL connection pool exhaustion — RDS proxy max_connections 95% utilized", status: "acknowledged", receivedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString() },
  { id: 13, source: "PagerDuty", sourceType: "alerting", severity: "low" as const, title: "Scheduled maintenance window approaching — us-west-2 RDS Multi-AZ failover test", status: "acknowledged", receivedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: 14, source: "Sentry", sourceType: "error_tracking", severity: "medium" as const, title: "New issue regression: CORS preflight failures on /api/v2/checkout (Chrome 122+)", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 100).toISOString() },
  { id: 15, source: "AWS CloudTrail", sourceType: "audit", severity: "low" as const, title: "Unusual S3 bucket policy modification detected — bucket: prod-analytics-datalake", status: "resolved", receivedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: 16, source: "New Relic", sourceType: "monitoring", severity: "medium" as const, title: "Apdex score degraded to 0.72 (target 0.90) — user-facing search service", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 140).toISOString() },
  { id: 17, source: "Datadog", sourceType: "monitoring", severity: "low" as const, title: "Kafka consumer group lag increasing on topic: order-events (partition 3, lag: 45k)", status: "acknowledged", receivedAt: new Date(Date.now() - 1000 * 60 * 160).toISOString() },
  { id: 18, source: "Zendesk", sourceType: "support", severity: "info" as const, title: "Daily support digest: 142 tickets (12 escalated), CSAT 94.2%, avg response 4.1m", status: "dismissed", receivedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { id: 19, source: "AWS Cost Explorer", sourceType: "finops", severity: "low" as const, title: "Daily spend anomaly: $2,847 above 30-day rolling average — NAT Gateway data transfer", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 200).toISOString() },
  { id: 20, source: "Prometheus", sourceType: "monitoring", severity: "info" as const, title: "Kubernetes HPA scaled deployment/checkout-api from 8 to 14 replicas — CPU trigger", status: "resolved", receivedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
  { id: 21, source: "Splunk", sourceType: "siem", severity: "medium" as const, title: "Brute force pattern detected: 847 failed login attempts from CIDR 203.0.113.0/24", status: "acknowledged", receivedAt: new Date(Date.now() - 1000 * 60 * 280).toISOString() },
  { id: 22, source: "CloudFlare", sourceType: "cdn", severity: "info" as const, title: "WAF rule triggered 2.1k times in 1hr — managed rule: SQL injection attempts blocked", status: "dismissed", receivedAt: new Date(Date.now() - 1000 * 60 * 320).toISOString() },
  { id: 23, source: "Datadog Synthetics", sourceType: "monitoring", severity: "low" as const, title: "Synthetic check failing: /health endpoint returning 503 on canary deployment v3.15.0-rc1", status: "new", receivedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString() },
  { id: 24, source: "AWS CloudWatch", sourceType: "monitoring", severity: "info" as const, title: "CloudFront distribution E2K4G1XYZABC invalidation completed — 12,847 objects purged", status: "resolved", receivedAt: new Date(Date.now() - 1000 * 60 * 400).toISOString() },
];

export let incidents = [
  {
    id: 101,
    title: "Payment Processing Pipeline Complete Failure",
    description: "Stripe webhook ingestion pipeline stalled at 14.2k queued events. Customer-facing checkout returns 500 errors. Revenue impact estimated at $47k/hr. Root cause suspected: RDS primary connection pool exhaustion cascading into order-service timeout spiral.",
    severity: "critical",
    status: "investigating",
    assignee: "Alex Chen (SRE Lead)",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 102,
    title: "API Gateway Cascading Latency Degradation",
    description: "Kong ingress controller reporting p99 latency of 8.4s across all upstream services. Circuit breakers triggered on auth-service, inventory-service, and notification-service. Customer-facing SLA breach imminent. EKS pod restarts increasing — suspected memory leak in gateway plugin v2.8.1.",
    severity: "critical",
    status: "mitigating",
    assignee: "Priya Patel (Platform Eng)",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 103,
    title: "RDS Multi-AZ Failover — Replication Lag Critical",
    description: "Primary RDS instance prod-db-01 (db.r6g.4xlarge) reporting replication lag >120s to standby. Write IOPS at 42k (provisioned 40k). Automatic failover may trigger if lag exceeds 300s. Application team notified to prepare for potential 30-60s connection drop. Binlog position: mysql-bin.004847:position 847291.",
    severity: "critical",
    status: "open",
    assignee: "Jordan Kim (DBA)",
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 104,
    title: "Authentication Service Crash Loop — OAuth Token Validation",
    description: "auth-service v3.14.2 entering CrashLoopBackOff on EKS cluster prod-k8s-01. Sentry capturing TypeError at token validation middleware. Affects SSO login for enterprise customers. 2.4k error events/hr. Rollback to v3.14.1 prepared but blocked by DB migration dependency.",
    severity: "high",
    status: "investigating",
    assignee: "Sarah Martinez (Backend Lead)",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 105,
    title: "Redis Cluster Memory Pressure — Eviction Active",
    description: "ElastiCache cluster elasticache-prod (cache.r6g.2xlarge, 6-node) at 91% memory. Volatile-lru eviction policy actively removing session keys. Session loss reports from customer support increasing. Need to evaluate key TTL policies and potentially upsize cluster. Current key count: 847M.",
    severity: "high",
    status: "mitigating",
    assignee: "Marcus Thompson (Infrastructure)",
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: 106,
    title: "CDN Cache Purge — Origin Load Spike",
    description: "CloudFront distribution cache hit ratio dropped from 94% to 62% following unplanned purge event. Origin server load increased 4x. ALB target group healthy host count at minimum. Auto-scaling group launching additional instances. ETA to cache warm: ~45 minutes.",
    severity: "medium",
    status: "investigating",
    assignee: "David Park (DevOps)",
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
  {
    id: 107,
    title: "CI/CD Pipeline Failure — Production Deploy Blocked",
    description: "GitHub Actions workflow main→prod failed at Docker build stage. OOM killed after 45 minutes. Build context size 14GB (expected 2GB). Suspected: node_modules cache invalidation caused full rebuild. Production hotfix deploy for INC-101 blocked until pipeline restored.",
    severity: "medium",
    status: "open",
    assignee: "Elena Rodriguez (Release Eng)",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 108,
    title: "IAM Credential Exfiltration Alert — GuardDuty Finding",
    description: "AWS GuardDuty flagged UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration on account 441902834. EC2 instance metadata credentials used from external IP 198.51.100.42. Instance role: prod-worker-node-role. Immediate credential rotation initiated. Security team engaged for forensic analysis.",
    severity: "high",
    status: "investigating",
    assignee: "Lisa Wang (Security Eng)",
    createdAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
  },
  {
    id: 109,
    title: "Kafka Consumer Lag — Order Event Processing Delayed",
    description: "Consumer group order-processor showing increasing lag on topic order-events, partition 3. Current lag: 45k messages. Processing throughput dropped from 12k/s to 2.1k/s. Root cause: downstream inventory-service circuit breaker open causing consumer backpressure. Customer order confirmations delayed 15-20 minutes.",
    severity: "medium",
    status: "mitigating",
    assignee: "Ryan Foster (Backend)",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 110,
    title: "Mobile App Crash — iOS 17.4 WebView Regression",
    description: "Crash rate spiked to 4.2% on iOS 17.4+ devices after App Store release v5.8.0. WKWebView rendering crash in checkout flow. Firebase Crashlytics showing 8.4k crashes in 6 hours. Hotfix v5.8.1 submitted for expedited App Store review. Temporary server-side feature flag disabled WebView checkout for affected OS versions.",
    severity: "high",
    status: "resolved",
    assignee: "Mike Dawson (Mobile Lead)",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 111,
    title: "DNS Resolution Failures — Route 53 Health Check",
    description: "Route 53 health check for api.production.szl.io intermittently failing from eu-west-1 and ap-southeast-1 regions. TTL-based failover to secondary endpoints activating. Investigating potential BGP routing issue with upstream provider. Customer reports of intermittent 'server not found' errors from European users.",
    severity: "high",
    status: "resolved",
    assignee: "Carlos Mendez (Network Eng)",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 112,
    title: "Delayed Email Notifications — SES Sending Quota",
    description: "AWS SES sending rate throttled at 85% of quota. Transactional emails (order confirmations, password resets) delayed 5-15 minutes. Marketing campaign blast consumed 60% of daily quota ahead of schedule. Temporary rate limiting applied to non-critical notification channels. Quota increase request submitted.",
    severity: "medium",
    status: "resolved",
    assignee: "Nina Johansson (Comms Eng)",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

export let recommendations = [
  {
    id: 201,
    title: "Deploy RDS Read Replicas with ProxySQL Load Balancing",
    description: "Primary RDS instance prod-db-01 CPU consistently at 78% during peak (14:00-22:00 UTC). Adding 2 read replicas with ProxySQL query routing will reduce primary load by ~45%. Current read/write ratio is 8:1. Estimated cost: $1,840/mo for 2x db.r6g.2xlarge replicas. Based on Google SRE capacity planning methodology.",
    category: "operational",
    impact: "high",
    effort: "medium",
    status: "suggested",
    savings: "",
    compliance: "",
  },
  {
    id: 202,
    title: "S3 Intelligent-Tiering for Analytics Data Lake",
    description: "58.4TB in S3 Standard across prod-analytics-datalake bucket. Access pattern analysis shows 72% of objects not accessed in 90+ days. Migrating to S3 Intelligent-Tiering with Archive Access tier will reduce storage costs by $1,420/mo. Glacier Deep Archive for compliance-retained data (>1yr) saves additional $380/mo. Total annual savings: $21,600.",
    category: "cost_optimization",
    impact: "high",
    effort: "low",
    status: "suggested",
    savings: "$21,600/yr",
    compliance: "",
  },
  {
    id: 203,
    title: "Implement WAF Rate Limiting + CAPTCHA Challenge",
    description: "Detected 847 credential stuffing attempts in past 24h from CIDR 203.0.113.0/24. Current CloudFront WAF rules block known bad IPs but lack adaptive rate limiting. Recommend deploying AWS WAF rate-based rules (2,000 req/5min threshold) with CAPTCHA challenge for suspicious patterns. Aligns with OWASP Top 10 2021 — A07:2021 Identification and Authentication Failures.",
    category: "risk_mitigation",
    impact: "high",
    effort: "low",
    status: "in_progress",
    savings: "",
    compliance: "OWASP Top 10, SOC 2 CC6.1",
  },
  {
    id: 204,
    title: "SOC 2 Type II Continuous Compliance Automation",
    description: "Annual SOC 2 Type II audit due in 8 weeks. Current evidence collection is 70% manual. Deploy Vanta or Drata for continuous compliance monitoring. Automate access reviews (IAM), encryption verification (KMS key rotation), and change management audit trails (CloudTrail → SIEM). Reduces audit prep from 6 weeks to 1 week. Addresses CC1.1 through CC9.9 trust service criteria.",
    category: "compliance",
    impact: "medium",
    effort: "medium",
    status: "suggested",
    savings: "",
    compliance: "SOC 2 Type II, ISO 27001 A.12",
  },
  {
    id: 205,
    title: "Reserved Instance + Savings Plan Optimization",
    description: "On-demand EC2 spend is $34,200/mo across 47 instances. Workload analysis shows 31 instances maintain >80% utilization 24/7. Converting to 1-year All Upfront Reserved Instances saves 42% ($14,364/mo). Additional Compute Savings Plans for Lambda and Fargate at $2,100/mo commitment saves 28%. Total estimated annual savings: $197,568. ROI payback period: 2.1 months.",
    category: "cost_optimization",
    impact: "high",
    effort: "low",
    status: "suggested",
    savings: "$197,568/yr",
    compliance: "",
  },
  {
    id: 206,
    title: "GDPR Data Subject Request Automation Pipeline",
    description: "Processing DSR (Right to Erasure, Right to Access) requests manually — current SLA 28 days, GDPR requires 30 days. Volume increasing 15% QoQ. Build automated pipeline: ingest via API → scan PostgreSQL, S3, ElasticSearch, Redis → generate data map → execute deletion/export → audit log. Reduces processing time to <48 hours. Addresses GDPR Articles 15-17, 20.",
    category: "compliance",
    impact: "high",
    effort: "high",
    status: "suggested",
    savings: "",
    compliance: "GDPR Art. 15-17, 20",
  },
  {
    id: 207,
    title: "Spot Fleet with Fallback for Batch Processing",
    description: "Batch processing workloads (ETL, report generation, ML training) running on on-demand instances at $8,400/mo. Workloads are fault-tolerant and interruptible. Deploy EC2 Spot Fleet with diversified instance strategy (c5.2xlarge, c5a.2xlarge, c6i.2xlarge) and on-demand fallback. Historical spot savings: 62-78%. Estimated monthly savings: $5,880. Use Spot interruption notices for graceful checkpoint/resume.",
    category: "cost_optimization",
    impact: "medium",
    effort: "medium",
    status: "suggested",
    savings: "$70,560/yr",
    compliance: "",
  },
  {
    id: 208,
    title: "Zero-Trust Network Architecture Migration",
    description: "Current perimeter-based security model relies on VPN + security groups. Migrate to zero-trust architecture: implement AWS Verified Access for application-level access, replace VPN with identity-aware proxy (BeyondCorp model), deploy microsegmentation via Cilium network policies in EKS. Aligns with NIST SP 800-207 and addresses ISO 27001 A.13 network security controls.",
    category: "risk_mitigation",
    impact: "high",
    effort: "high",
    status: "suggested",
    savings: "",
    compliance: "NIST SP 800-207, ISO 27001 A.13",
  },
  {
    id: 209,
    title: "Implement SLO/Error Budget Framework",
    description: "No formal SLO framework in place. Define SLOs for Tier-1 services: availability (99.95%), latency p99 (<500ms), error rate (<0.1%). Implement error budgets per Google SRE methodology. Deploy Datadog SLO monitors with burn-rate alerting. When error budget is exhausted, freeze feature releases and prioritize reliability. Track monthly error budget consumption in executive dashboards.",
    category: "operational",
    impact: "high",
    effort: "medium",
    status: "in_progress",
    savings: "",
    compliance: "",
  },
  {
    id: 210,
    title: "NAT Gateway Cost Reduction — VPC Endpoints",
    description: "NAT Gateway data processing charges $2,847/day above baseline. Analysis shows 68% of NAT traffic is to AWS services (S3, DynamoDB, SQS, CloudWatch). Deploy VPC Gateway Endpoints (S3, DynamoDB — free) and Interface Endpoints (SQS, CloudWatch, ECR — $0.01/GB vs $0.045/GB NAT). Estimated monthly savings: $52,400. Implement VPC flow log analysis for ongoing optimization.",
    category: "cost_optimization",
    impact: "high",
    effort: "low",
    status: "suggested",
    savings: "$628,800/yr",
    compliance: "",
  },
];

export let playbooks = [
  {
    id: 301,
    title: "SEV-1 Major Outage Response",
    category: "incident_response",
    description: "Standard operating procedure for customer-impacting service outages. Based on PagerDuty incident response methodology and Google SRE on-call practices.",
    content: `# SEV-1 Major Outage Response

## Trigger Criteria
- Complete loss of customer-facing service availability
- Revenue-impacting system failure (>$10k/hr estimated impact)
- Data integrity concerns affecting production databases
- Security breach with active exploitation

## 1. Immediate Response (0-5 minutes)
- Acknowledge PagerDuty alert within 5 minutes per SLA
- Establish incident bridge: dedicated Slack channel #inc-YYYYMMDD-brief
- Open Zoom war room (link auto-generated by PagerDuty)
- Designate Incident Commander (IC) — on-call SRE by default
- Designate Communications Lead — notify VP Engineering and CTO
- Update StatusPage to "Investigating" with initial customer-facing message
- Begin incident timeline documentation in Confluence

## 2. Triage and Diagnosis (5-15 minutes)
- Check Datadog Service Map for dependency failures and error propagation
- Review AWS Health Dashboard for regional service disruptions
- Examine CloudWatch alarms and Grafana dashboards for anomalous metrics
- Query Sentry for new/regressed error spikes correlated with incident start time
- Check recent deployments in ArgoCD — was anything deployed in the last 2 hours?
- Verify DNS resolution (Route 53) and certificate validity (ACM)
- Run kubectl get pods -n production to check for CrashLoopBackOff or OOMKilled

## 3. Containment and Mitigation
- If deployment-related: initiate rollback via ArgoCD to last known good revision
- If traffic-related: enable CloudFront rate limiting or activate DDoS runbook
- If database-related: engage DBA on-call, consider promoting read replica
- If third-party: check vendor status pages, activate fallback/degraded mode
- Scale horizontally if resource-constrained: kubectl scale deployment --replicas=N
- Enable maintenance mode if customer data integrity is at risk

## 4. Communication Cadence
- Internal Slack updates every 15 minutes during active incident
- StatusPage updates every 30 minutes with honest, clear customer messaging
- Executive briefing at 30-minute and 1-hour marks
- Customer Support team briefed with talking points and known workarounds
- If incident exceeds 1 hour: notify account managers for enterprise customers

## 5. Resolution and Verification
- Confirm fix via synthetic monitoring (Datadog Synthetics) and real user monitoring
- Monitor error rates for 30 minutes post-fix before declaring resolved
- Update StatusPage to "Resolved" with root cause summary
- Send internal all-clear notification to engineering and support channels

## 6. Post-Incident Review (within 48 hours)
- Schedule blameless postmortem per Google SRE postmortem culture guidelines
- Document timeline, root cause, contributing factors, and detection gap
- Identify action items with owners and deadlines
- Update monitoring and alerting to detect this class of failure earlier
- Calculate incident cost (revenue impact + engineering hours + customer churn risk)
- File postmortem in Confluence under Incident Archive with severity tag`,
  },
  {
    id: 302,
    title: "RDS Multi-AZ Failover Protocol",
    category: "database_operations",
    description: "Controlled and emergency failover procedures for Amazon RDS Multi-AZ PostgreSQL deployments. Covers planned maintenance windows and unplanned failure scenarios.",
    content: `# RDS Multi-AZ Failover Protocol

## Pre-Failover Assessment
- Verify current replication lag via CloudWatch ReplicaLag metric (<10s acceptable)
- Confirm standby instance health in AWS Console → RDS → Instances
- Check active connection count: SELECT count(*) FROM pg_stat_activity
- Verify application connection pooling configuration (PgBouncer/RDS Proxy)
- Notify on-call team and open incident channel if unplanned

## 1. Planned Failover (Maintenance Window)
- Schedule during lowest-traffic period (typically 04:00-06:00 UTC)
- Notify stakeholders 48 hours in advance via #platform-announcements
- Enable application-level maintenance mode or read-only mode
- Drain active connections gracefully (set statement_timeout = '30s')
- Initiate failover: aws rds reboot-db-instance --db-instance-identifier prod-db-01 --force-failover
- Expected DNS propagation: 60-120 seconds (CNAME update)
- Monitor via CloudWatch: FreeableMemory, DatabaseConnections, WriteIOPS

## 2. Unplanned Failover (Auto-triggered)
- Automated failover triggers: storage failure, host failure, OS patching, network failure
- Expected failover time: 60-120 seconds for Multi-AZ
- Application should use RDS Proxy to mask failover from connection pool
- If using direct connections: implement retry with exponential backoff (base 1s, max 30s)
- Check CloudWatch Events for RDS-EVENT-0049 (Multi-AZ failover started)

## 3. Post-Failover Verification
- Confirm new primary endpoint resolves correctly: dig +short prod-db-01.cluster-xyz.us-east-1.rds.amazonaws.com
- Run application health checks against all services using database
- Verify replication to new standby is established (ReplicaLag < 5s)
- Check connection pool metrics in Datadog for connection errors or timeouts
- Validate read replica connections are functional
- Monitor application error rates for 30 minutes post-failover

## 4. Connection String Management
- Connection strings stored in AWS Systems Manager Parameter Store
- Path: /production/database/primary-endpoint
- Application reads at startup — no manual update needed for Multi-AZ
- For read replicas: /production/database/reader-endpoint
- If manual DNS update required: update Route 53 CNAME with 60s TTL

## 5. Rollback Procedure
- If new primary is unhealthy, do NOT force another failover immediately
- Wait minimum 10 minutes between failover events (AWS limitation)
- If data corruption suspected: stop all write traffic immediately
- Engage AWS Support (Enterprise tier) for assisted recovery
- Consider point-in-time recovery (PITR) to pre-incident snapshot`,
  },
  {
    id: 303,
    title: "Kubernetes Cluster Scaling Runbook",
    category: "operations",
    description: "Procedures for horizontal and vertical scaling of EKS production clusters. Covers node group management, HPA tuning, and capacity planning based on SRE load testing principles.",
    content: `# Kubernetes Cluster Scaling Runbook

## Monitoring Thresholds
- Node CPU utilization > 70% sustained 15 minutes → investigate
- Node CPU utilization > 85% sustained 5 minutes → scale immediately
- Memory utilization > 80% → evaluate pod resource requests
- Pod pending > 5 minutes → check node capacity and resource quotas

## 1. Horizontal Pod Autoscaler (HPA) Adjustment
- Review current HPA config: kubectl get hpa -n production -o wide
- Verify metrics-server is healthy: kubectl top pods -n production
- Adjust CPU target: kubectl patch hpa checkout-api -n production -p '{"spec":{"targetCPUUtilizationPercentage":65}}'
- Set appropriate min/max replicas based on load testing baseline
- Recommended: minReplicas = peak_traffic_pods * 0.5, maxReplicas = peak_traffic_pods * 2.0
- Monitor scale events: kubectl describe hpa checkout-api -n production

## 2. Node Group Scaling
- Current managed node groups: prod-general (m6i.2xlarge), prod-compute (c6i.4xlarge), prod-memory (r6i.2xlarge)
- Scale via EKS Console or eksctl: eksctl scale nodegroup --cluster prod-k8s-01 --name prod-general --nodes 12 --nodes-max 20
- Cluster Autoscaler lag: ~2-3 minutes for new node registration
- Karpenter (if deployed): automatically provisions optimal instance types

## 3. Vertical Scaling (Resource Requests/Limits)
- Review VPA recommendations: kubectl describe vpa -n production
- Never set CPU limits on latency-sensitive services (causes throttling)
- Memory limits should be 1.5x the p99 memory usage observed in production
- Apply resource changes via Helm values, not direct kubectl edit
- Rollout changes during low-traffic windows with canary strategy

## 4. Emergency Capacity Response
- If cluster is full and pods are pending critical services:
- Taint non-critical workloads: kubectl taint nodes <node> priority=critical:NoSchedule
- Scale down non-essential deployments: kubectl scale deployment/analytics-worker --replicas=0
- Manually add nodes: aws autoscaling set-desired-capacity --auto-scaling-group-name eks-prod-general --desired-capacity 20
- Consider Fargate for burst capacity on non-GPU workloads

## 5. Post-Scaling Verification
- Confirm all pods running: kubectl get pods -n production --field-selector status.phase!=Running
- Check service endpoints: kubectl get endpoints -n production
- Verify load balancer target health in AWS Console
- Monitor Datadog for latency improvements and error rate reduction
- Update capacity planning spreadsheet with new baseline`,
  },
  {
    id: 304,
    title: "SOC 2 Type II Audit Preparation",
    category: "compliance",
    description: "Comprehensive preparation checklist for SOC 2 Type II annual audit. Covers all five Trust Service Criteria: Security, Availability, Processing Integrity, Confidentiality, and Privacy.",
    content: `# SOC 2 Type II Audit Preparation

## Timeline
- T-8 weeks: Begin evidence collection and gap analysis
- T-4 weeks: Internal readiness review with compliance team
- T-2 weeks: Pre-audit walkthrough with external auditor
- T-0: Audit fieldwork begins (typically 2-3 weeks)

## 1. Security (CC6 — Logical and Physical Access Controls)
- Pull IAM access reviews from AWS Organizations — quarterly review evidence
- Verify MFA enforcement: aws iam get-account-summary (MFADevicesInUse)
- Generate least-privilege analysis report from AWS IAM Access Analyzer
- Confirm KMS key rotation policy: aws kms get-key-rotation-status
- Document network security: VPC flow logs, security groups, NACLs
- Verify endpoint protection: CrowdStrike agent deployment coverage >99%
- Background check records for all employees with production access

## 2. Availability (A1 — System Availability and Redundancy)
- Gather uptime metrics from Datadog SLO monitors (target: 99.95%)
- Document disaster recovery plan and last DR test results
- Verify backup schedules: RDS automated snapshots (daily, 35-day retention)
- Confirm Multi-AZ deployment for all Tier-1 services
- Business continuity plan review — last updated date and stakeholder sign-off

## 3. Processing Integrity (PI1 — Completeness and Accuracy)
- Document data validation controls in application layer
- Provide evidence of automated testing: CI/CD pipeline test coverage >80%
- Gather change management records: Jira tickets linked to PRs in GitHub
- Verify code review requirements: branch protection rules evidence
- Data reconciliation reports for financial transactions

## 4. Confidentiality (C1 — Data Classification and Protection)
- Data classification policy document — last review date
- Encryption at rest: RDS (AES-256), S3 (SSE-S3/SSE-KMS), EBS (AES-256)
- Encryption in transit: TLS 1.2+ enforced, certificate inventory from ACM
- Data retention and disposal policy with evidence of execution
- Third-party vendor risk assessments (critical vendors reviewed annually)

## 5. Privacy (P1-P8 — Personal Information Handling)
- Privacy policy — published and accessible, last update date
- Data subject request (DSR) log — response times within 30-day SLA
- Cookie consent mechanism verification (OneTrust/CookieBot configuration)
- Data processing agreements (DPAs) with all sub-processors
- Privacy impact assessments for new features handling PII

## 6. Evidence Collection Tools
- Vanta/Drata continuous compliance dashboard screenshots
- AWS Config conformance pack reports
- CloudTrail logs for administrative actions (90-day minimum retention)
- GitHub audit log for repository access changes
- PagerDuty incident reports for availability metrics`,
  },
  {
    id: 305,
    title: "Security Incident Response — Data Breach Protocol",
    category: "incident_response",
    description: "Response procedure for confirmed or suspected data breaches. Aligned with NIST SP 800-61r2 Computer Security Incident Handling Guide and GDPR Article 33/34 notification requirements.",
    content: `# Security Incident Response — Data Breach Protocol

## Classification
- Level 1 (Indicator): Suspicious activity, no confirmed compromise
- Level 2 (Investigation): Confirmed unauthorized access, scope unknown
- Level 3 (Breach): Confirmed data exfiltration or exposure of PII/sensitive data

## 1. Immediate Containment (0-30 minutes)
- Isolate affected systems: revoke IAM credentials, rotate access keys
- Preserve forensic evidence: snapshot EBS volumes, export CloudTrail logs
- Enable VPC Network ACL deny rules for suspicious source IPs
- DO NOT reboot or terminate instances — preserves volatile memory evidence
- Notify Security Lead, CISO, and Legal counsel immediately
- Open dedicated secure incident channel (not general Slack)

## 2. Investigation and Scoping (30 min - 4 hours)
- Analyze CloudTrail for unauthorized API calls: filter by sourceIPAddress, errorCode
- Review VPC Flow Logs for data exfiltration patterns (large outbound transfers)
- Check GuardDuty findings for correlated alerts
- Query SIEM (Splunk) for IOCs: unusual login locations, privilege escalations
- Determine blast radius: which systems, which data, which customers affected
- Engage AWS Incident Response team if Enterprise Support (TAM escalation)

## 3. Eradication
- Rotate all potentially compromised credentials (API keys, database passwords, tokens)
- Patch exploited vulnerability if identified
- Deploy updated WAF rules to block attack vector
- Force password reset for affected user accounts
- Revoke and reissue TLS certificates if private key compromise suspected

## 4. Regulatory Notification (GDPR Article 33/34)
- GDPR: Notify supervisory authority within 72 hours of awareness
- GDPR: Notify affected data subjects "without undue delay" if high risk
- CCPA: Notify affected California residents
- PCI DSS: Notify acquiring bank and payment card brands if cardholder data involved
- Prepare breach notification with: nature of breach, categories of data, approximate number of affected individuals, contact point, likely consequences, mitigation measures

## 5. Recovery and Monitoring
- Restore systems from known-clean backups if necessary
- Implement enhanced monitoring for 90 days post-incident
- Deploy additional detection rules based on observed TTPs (MITRE ATT&CK mapping)
- Conduct lessons-learned review within 1 week of resolution

## 6. Post-Breach Requirements
- Retain all forensic evidence for minimum 7 years
- Update incident response plan based on findings
- Brief board of directors on material incidents
- Engage external forensic firm for Level 3 breaches (contractual requirement per cyber insurance)
- File with law enforcement if criminal activity suspected`,
  },
  {
    id: 306,
    title: "On-Call Engineer Handoff Procedure",
    category: "operations",
    description: "Standardized on-call rotation handoff process. Based on Google SRE on-call best practices to ensure continuity of operational awareness across shift changes.",
    content: `# On-Call Engineer Handoff Procedure

## Rotation Schedule
- Primary on-call: 7-day rotation (Monday 09:00 UTC to Monday 09:00 UTC)
- Secondary on-call: shadows primary, escalation path for SEV-1
- Managed via PagerDuty schedule: Team-SRE-Primary, Team-SRE-Secondary
- Maximum consecutive on-call: 1 week (per Google SRE toil budget guidelines)

## 1. Pre-Handoff Preparation (outgoing engineer)
- Write shift summary in Confluence: On-Call Log YYYY-WXX
- Document all active incidents and their current status
- List any ongoing maintenance windows or scheduled changes
- Note any flaky alerts that should be investigated (noise reduction backlog)
- Record any temporary workarounds or manual interventions in place
- Update PagerDuty notes on any snoozed or maintenance-windowed alerts

## 2. Handoff Meeting (15 minutes, synchronous)
- Walk through active incidents and their blast radius
- Review recent deployments and any rollback candidates
- Highlight any systems in degraded state or under enhanced monitoring
- Share any context from upstream team escalations
- Confirm incoming engineer has VPN, SSH keys, and kubectl access working
- Verify PagerDuty mobile app is configured and receiving test notifications

## 3. Incoming Engineer Checklist
- Confirm PagerDuty schedule shows you as primary on-call
- Open Datadog dashboards: SRE Overview, Service Health, Infrastructure
- Review last 24h of PagerDuty alerts for pattern awareness
- Verify access to war room tools: Zoom, Slack, StatusPage admin
- Check that laptop is charged and mobile hotspot is available as backup
- Confirm escalation contacts are up to date in PagerDuty

## 4. Escalation Path
- Tier 1: Primary on-call SRE (PagerDuty auto-page)
- Tier 2: Secondary on-call SRE (auto-escalation after 10 minutes)
- Tier 3: SRE Team Lead (auto-escalation after 20 minutes)
- Tier 4: VP Engineering (manual escalation for SEV-1 lasting >1 hour)
- Security incidents: bypass normal chain, page Security Lead directly

## 5. Post-Shift Wrap-up
- File any toil reduction tickets identified during shift
- Update runbooks if any undocumented procedures were needed
- Log on-call hours for compensation/time-off tracking
- Provide feedback on alert quality to improve signal-to-noise ratio`,
  },
  {
    id: 307,
    title: "Production Deployment Checklist",
    category: "change_management",
    description: "Pre-deployment, deployment, and post-deployment verification checklist for production releases. Follows ITIL change management framework adapted for continuous delivery.",
    content: `# Production Deployment Checklist

## Change Classification (ITIL)
- Standard Change: pre-approved, low-risk (config updates, minor patches)
- Normal Change: requires CAB review for medium/high risk changes
- Emergency Change: expedited approval for SEV-1 incident hotfixes

## 1. Pre-Deployment Verification
- All CI checks passing: unit tests, integration tests, security scans (Snyk/Trivy)
- Code review approved by minimum 2 reviewers (branch protection enforced)
- Staging environment smoke test completed and signed off
- Feature flags configured for gradual rollout (LaunchDarkly)
- Rollback plan documented: specific ArgoCD revision or Helm chart version
- Database migration reviewed by DBA (if applicable): check for locks, index impact
- Load test results reviewed if significant traffic pattern change expected
- Change ticket approved in Jira with deployment window noted

## 2. Deployment Execution
- Announce in #deployments Slack channel with PR link and change description
- Verify deployment window is outside peak traffic (default: 10:00-14:00 UTC)
- Deploy via ArgoCD sync or GitHub Actions production workflow
- Use canary deployment strategy: 5% → 25% → 50% → 100% traffic shift
- Monitor Datadog canary dashboard during each traffic shift stage
- Each stage minimum soak time: 10 minutes (5 minutes for hotfixes)

## 3. Post-Deployment Verification
- Check application health endpoints: /health, /readiness returning 200
- Verify error rate in Sentry has not increased above baseline
- Monitor p50/p95/p99 latency in Datadog APM for affected services
- Run Datadog Synthetic tests for critical user flows (login, checkout, search)
- Check Kubernetes pod status: no CrashLoopBackOff, OOMKilled, or ImagePullBackOff
- Verify database migration completed successfully (if applicable)
- Monitor business metrics: conversion rate, order volume, sign-up rate

## 4. Rollback Criteria
- Error rate exceeds 5x baseline for >5 minutes
- p99 latency exceeds SLO threshold for >10 minutes
- Any data corruption or inconsistency detected
- Security vulnerability discovered in deployed code
- Rollback command: argocd app rollback <app-name> --revision <previous-revision>

## 5. Post-Deployment Reporting
- Update Jira deployment ticket with status and any issues encountered
- Close change request with actual deployment time and verification results
- Update deployment calendar for team visibility
- If issues encountered: create follow-up tickets for improvement`,
  },
  {
    id: 308,
    title: "Disaster Recovery Test Procedure",
    category: "compliance",
    description: "Quarterly disaster recovery test procedure for business continuity compliance. Validates RTO/RPO targets and cross-region failover capabilities per ISO 22301 requirements.",
    content: `# Disaster Recovery Test Procedure

## DR Architecture Overview
- Primary region: us-east-1 (N. Virginia)
- DR region: us-west-2 (Oregon)
- RPO target: 15 minutes (RDS cross-region replication)
- RTO target: 4 hours (full service restoration)
- DR tests conducted quarterly per ISO 22301 and SOC 2 requirements

## 1. Pre-Test Preparation (1 week before)
- Notify all stakeholders: engineering, product, customer support, executive team
- Verify cross-region RDS read replica is healthy and lag < 30 seconds
- Confirm S3 cross-region replication status for critical buckets
- Validate Route 53 failover records and health check configurations
- Ensure DR region has sufficient EC2 capacity reserved
- Prepare test plan document with specific success criteria

## 2. Tabletop Exercise (before live test)
- Walkthrough failure scenarios with engineering and operations team
- Validate communication chain: who contacts whom, in what order
- Review runbooks for completeness — are all steps actionable?
- Identify gaps in documentation or tooling
- Confirm third-party service failover (CDN, DNS, email)

## 3. Live Failover Test Execution
- Simulate primary region failure: disable Route 53 health checks
- Monitor DNS failover propagation (expected: 60-120 seconds)
- Verify DR region EKS cluster activates with correct configurations
- Promote DR RDS replica to standalone primary
- Validate application functionality in DR region: run full test suite
- Measure actual RTO against target — document any delays
- Test data integrity: compare checksums between primary and DR datasets

## 4. Failback Procedure
- Re-establish replication from DR region back to primary
- Wait for full data synchronization (verify replication lag = 0)
- Perform controlled failback during maintenance window
- Validate primary region service health post-failback
- Confirm all monitoring and alerting is restored to normal configuration

## 5. Test Documentation and Reporting
- Document actual RTO/RPO achieved vs. targets
- List any failures, workarounds, or gaps identified
- Create remediation tickets for any issues with owners and deadlines
- Present results to compliance team and executive stakeholders
- File report in Confluence under DR Test Archive
- Update SOC 2 evidence binder with test results and sign-off`,
  },
];

export let commandCards = [
  { id: 401, title: "Q3 Board Deck — Infrastructure Reliability Review", category: "strategy", priority: "high", status: "in_progress", assignee: "Elena R. (VP Eng)", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString() },
  { id: 402, title: "AWS Enterprise Agreement Renewal — $2.4M Annual Commit", category: "finance", priority: "medium", status: "pending", assignee: "Marcus T. (FinOps)", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString() },
  { id: 403, title: "Enterprise Pilot Review — Fortune 500 Onboarding Decision", category: "growth", priority: "critical", status: "pending", assignee: "Elena R. (VP Eng)", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString() },
  { id: 404, title: "SOC 2 Type II Audit Kickoff — Auditor Fieldwork Start", category: "compliance", priority: "high", status: "pending", assignee: "Lisa W. (Security)", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString() },
  { id: 405, title: "Production K8s Cluster Upgrade — EKS 1.29 Migration", category: "operations", priority: "medium", status: "in_progress", assignee: "Priya P. (Platform)", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString() },
];
