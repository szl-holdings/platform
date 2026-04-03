import {
  db,
  lytePrismScoresTable,
  lyteMetricsTable,
  lyteAlertsTable,
  lyteAlertEventsTable,
  lyteEscalationsTable,
  lyteSignalsTable,
} from "@szl-holdings/db";
import { sql } from "drizzle-orm";

const SERVICES = [
  "api-gateway", "lyte-core", "alloy-engine", "terra-beacon", "vessels-intel",
  "firestorm-soc", "signal-bus", "prism-engine", "alert-engine", "escalation-mgr",
  "metrics-store", "action-router", "notification-svc", "workflow-exec", "ml-inference",
];

const METRIC_TYPES = [
  { type: "latency",      unit: "ms",    base: 80,  variance: 120, spike: 350 },
  { type: "error_rate",   unit: "%",     base: 0.5, variance: 1.5, spike: 8   },
  { type: "throughput",   unit: "req/s", base: 120, variance: 80,  spike: 600 },
  { type: "cpu",          unit: "%",     base: 30,  variance: 25,  spike: 92  },
  { type: "memory",       unit: "%",     base: 45,  variance: 20,  spike: 88  },
  { type: "availability", unit: "%",     base: 99,  variance: 0.5, spike: 95  },
  { type: "queue_depth",  unit: "jobs",  base: 12,  variance: 30,  spike: 200 },
  { type: "revenue",      unit: "$",     base: 4200, variance: 800, spike: 8000 },
  { type: "churn_rate",   unit: "%",     base: 1.2, variance: 0.8, spike: 4.5 },
  { type: "nps",          unit: "pts",   base: 45,  variance: 15,  spike: 20  },
];

function rng(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function generateMetricValue(m: typeof METRIC_TYPES[0], isAnomaly: boolean): number {
  if (isAnomaly) return m.spike + rng(-m.spike * 0.1, m.spike * 0.15);
  return m.base + rng(-m.variance * 0.5, m.variance);
}

export async function seedLyteObservability() {
  const results: Record<string, number> = {};

  // ── 1. PRISM Scores ───────────────────────────────────────────────────────
  await db.execute(sql`TRUNCATE lyte_prism_scores CASCADE`);
  const lenses = ["financial_health", "operational_risk", "growth_velocity", "customer_sentiment", "compliance_drift", "talent_stability", "market_position"] as const;
  const scoreTuples: Parameters<typeof db.insert>[0] extends infer T ? any[] : any[] = [];
  for (const lens of lenses) {
    const score = Math.round(rng(40, 92));
    const prevScore = Math.round(rng(35, 95));
    const delta = score - prevScore;
    const trend = delta > 2 ? "up" : delta < -2 ? "down" : "flat";
    scoreTuples.push({
      lens,
      score,
      previousScore: prevScore,
      trend,
      trendDelta: parseFloat(delta.toFixed(1)),
      summary: getSummaryForLens(lens, score, trend),
      topSignals: getTopSignalsForLens(lens),
      scoredAt: new Date(Date.now() - rng(0, 1800000)),
    });
  }
  await db.insert(lytePrismScoresTable).values(scoreTuples);
  results.lyte_prism_scores = scoreTuples.length;

  // ── 2. Metrics (1200+ data points, 100+ per service over 7 days) ─────────
  await db.execute(sql`TRUNCATE lyte_metrics CASCADE`);
  const metricBatches: any[] = [];
  const now = Date.now();
  const sevenDays = 7 * 24 * 3600 * 1000;

  for (const service of SERVICES) {
    for (const mt of METRIC_TYPES) {
      const count = Math.floor(rng(110, 160));
      for (let i = 0; i < count; i++) {
        const isAnomaly = Math.random() < 0.07;
        const value = generateMetricValue(mt, isAnomaly);
        const recordedAt = new Date(now - rng(0, sevenDays));
        metricBatches.push({
          service,
          metricName: mt.type,
          metricType: mt.type,
          value: parseFloat(value.toFixed(2)),
          unit: mt.unit,
          tags: { env: "production" },
          anomaly: isAnomaly,
          anomalyScore: isAnomaly ? parseFloat(rng(0.7, 1.0).toFixed(3)) : null,
          recordedAt,
        });
      }
    }
  }

  // Insert in batches of 500
  for (let i = 0; i < metricBatches.length; i += 500) {
    await db.insert(lyteMetricsTable).values(metricBatches.slice(i, i + 500));
  }
  results.lyte_metrics = metricBatches.length;

  // ── 3. Alerts (25 alerts) ─────────────────────────────────────────────────
  await db.execute(sql`TRUNCATE lyte_alerts CASCADE`);
  const alertDefs = buildAlertDefs();
  const insertedAlerts = await db.insert(lyteAlertsTable).values(alertDefs).returning();
  results.lyte_alerts = insertedAlerts.length;

  // ── 4. Alert Events (500+ events) ────────────────────────────────────────
  await db.execute(sql`TRUNCATE lyte_alert_events CASCADE`);
  const alertEventBatches: any[] = [];
  for (const alert of insertedAlerts) {
    const eventCount = Math.floor(rng(8, 40));
    for (let i = 0; i < eventCount; i++) {
      const eventType = i === 0 ? "fired" : (Math.random() > 0.4 ? "fired" : "resolved");
      const occurred = new Date(now - rng(0, sevenDays));
      alertEventBatches.push({
        alertId: alert.id,
        eventType,
        triggerValue: alert.threshold ? parseFloat((alert.threshold * rng(1.0, 1.5)).toFixed(2)) : null,
        message: `Alert ${eventType} for ${alert.service}/${alert.metricName}`,
        occurredAt: occurred,
      });
    }
  }
  await db.insert(lyteAlertEventsTable).values(alertEventBatches);
  results.lyte_alert_events = alertEventBatches.length;

  // ── 5. Escalations (30+ escalations) ────────────────────────────────────
  await db.execute(sql`TRUNCATE lyte_escalations CASCADE`);
  const escalationDefs = buildEscalationDefs(insertedAlerts);
  await db.insert(lyteEscalationsTable).values(escalationDefs);
  results.lyte_escalations = escalationDefs.length;

  // ── 6. Lyte Signals (1000+) ───────────────────────────────────────────────
  await db.execute(sql`TRUNCATE lyte_signals CASCADE`);
  const signalBatches: any[] = [];
  const signalSources = ["alloy", "terra", "vessels", "firestorm", "prism", "manual", "api", "monitor"];
  const signalTypes = ["anomaly", "alert_fired", "sla_breach", "owner_gap", "compliance_flag", "cost_spike", "churn_risk", "deployment"];
  const signalSeverities = ["critical", "high", "medium", "low", "info"];

  const sourceTypeOptions = ["connector", "webhook", "manual", "monitoring", "scheduler"] as const;
  const statusOptions = ["new", "acknowledged", "resolved", "dismissed"] as const;

  for (let i = 0; i < 1100; i++) {
    const severity = signalSeverities[Math.floor(Math.random() * signalSeverities.length)];
    const sigType = signalTypes[Math.floor(Math.random() * signalTypes.length)];
    const source = signalSources[Math.floor(Math.random() * signalSources.length)];
    const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    const sourceType = sourceTypeOptions[Math.floor(Math.random() * sourceTypeOptions.length)];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    signalBatches.push({
      title: getSignalTitle(sigType, service),
      body: `Automated signal detected by ${source} on ${service}`,
      severity,
      source,
      sourceType,
      status,
      metadata: { service, signalType: sigType, metricType: METRIC_TYPES[Math.floor(Math.random() * METRIC_TYPES.length)].type },
      receivedAt: new Date(now - rng(0, sevenDays)),
    });
  }

  for (let i = 0; i < signalBatches.length; i += 500) {
    await db.insert(lyteSignalsTable).values(signalBatches.slice(i, i + 500));
  }
  results.lyte_signals = signalBatches.length;

  return results;
}

function getSummaryForLens(lens: string, score: number, trend: string): string {
  const level = score >= 75 ? "strong" : score >= 50 ? "moderate" : "at-risk";
  const summaries: Record<string, string> = {
    financial_health: `Revenue posture is ${level}. ${trend === "up" ? "ARR growth accelerating." : trend === "down" ? "Margin pressure detected." : "Stable cash position."}`,
    operational_risk: `Operational posture is ${level}. ${trend === "up" ? "SLA compliance improving." : "Incident rate elevated — review runbooks."}`,
    growth_velocity: `Pipeline momentum is ${level}. ${score >= 70 ? "Deal flow above benchmark." : "Conversion rates below target."}`,
    customer_sentiment: `Customer health is ${level}. ${trend === "up" ? "NPS trending up." : "Churn signals detected in enterprise segment."}`,
    compliance_drift: `Compliance posture is ${level}. ${score >= 70 ? "No critical audit gaps." : "Policy drift detected — remediation required."}`,
    talent_stability: `Team capacity is ${level}. ${trend === "down" ? "Key ownership gaps in critical roles." : "Retention benchmarks met."}`,
    market_position: `Competitive position is ${level}. ${score >= 70 ? "Win rates above industry average." : "Deal velocity declining vs. Q4."}`,
  };
  return summaries[lens] ?? `Score ${score}/100 — ${trend} trend.`;
}

function getTopSignalsForLens(lens: string): Array<{ title: string; severity: string; source: string }> {
  const pools: Record<string, Array<{ title: string; severity: string; source: string }>> = {
    financial_health: [
      { title: "ARR expansion exceeds Q1 forecast", severity: "info", source: "alloy" },
      { title: "COGS spike in cloud infrastructure", severity: "high", source: "monitor" },
      { title: "Invoice aging > 60 days on 3 accounts", severity: "medium", source: "terra" },
    ],
    operational_risk: [
      { title: "SLA breach detected on API gateway", severity: "critical", source: "monitor" },
      { title: "Escalation backlog growing", severity: "high", source: "prism" },
      { title: "Runbook coverage below 80%", severity: "medium", source: "alloy" },
    ],
    growth_velocity: [
      { title: "Pipeline velocity +23% MoM", severity: "info", source: "terra" },
      { title: "Conversion rate drop in SMB segment", severity: "high", source: "alloy" },
      { title: "Feature adoption stalling post-launch", severity: "medium", source: "monitor" },
    ],
    customer_sentiment: [
      { title: "NPS dropped 8 points in enterprise tier", severity: "high", source: "alloy" },
      { title: "CSAT below threshold for 3 accounts", severity: "medium", source: "prism" },
      { title: "Churn signal in 2 strategic accounts", severity: "critical", source: "prism" },
    ],
    compliance_drift: [
      { title: "SOC2 evidence gap — access logs", severity: "critical", source: "firestorm" },
      { title: "Data retention policy exception", severity: "high", source: "firestorm" },
      { title: "GDPR DPA review outstanding", severity: "medium", source: "monitor" },
    ],
    talent_stability: [
      { title: "Senior IC departure risk flagged", severity: "high", source: "prism" },
      { title: "Ownership gap in ML Inference team", severity: "medium", source: "alloy" },
      { title: "Capacity utilization >95% in DevOps", severity: "medium", source: "monitor" },
    ],
    market_position: [
      { title: "Competitor pricing pressure on mid-market", severity: "high", source: "alloy" },
      { title: "Win rate down 12% in EMEA", severity: "medium", source: "terra" },
      { title: "New entrant captured 3 target accounts", severity: "high", source: "prism" },
    ],
  };
  return pools[lens] ?? [];
}

function buildAlertDefs() {
  return [
    { name: "API Gateway Latency Spike", description: "P95 latency exceeds SLA threshold", alertType: "threshold" as const, service: "api-gateway", metricName: "latency", condition: "gt" as const, threshold: 300, severity: "critical" as const, status: "firing" as const, notificationChannels: ["slack", "pagerduty"], firingCount: 7, lastFiredAt: new Date(Date.now() - 900000) },
    { name: "Error Rate Critical", description: "Error rate above acceptable threshold", alertType: "threshold" as const, service: "lyte-core", metricName: "error_rate", condition: "gt" as const, threshold: 5, severity: "critical" as const, status: "firing" as const, notificationChannels: ["pagerduty", "email"], firingCount: 3, lastFiredAt: new Date(Date.now() - 1800000) },
    { name: "ML Inference CPU Saturation", description: "CPU usage approaching capacity limit", alertType: "threshold" as const, service: "ml-inference", metricName: "cpu", condition: "gt" as const, threshold: 85, severity: "high" as const, status: "active" as const, notificationChannels: ["slack"], firingCount: 12, lastFiredAt: new Date(Date.now() - 3600000) },
    { name: "Signal Bus Queue Depth", description: "Queue depth exceeds processing capacity", alertType: "threshold" as const, service: "signal-bus", metricName: "queue_depth", condition: "gt" as const, threshold: 150, severity: "high" as const, status: "firing" as const, notificationChannels: ["slack", "email"], firingCount: 5, lastFiredAt: new Date(Date.now() - 600000) },
    { name: "Alert Engine Anomaly", description: "Anomalous behavior detected in alert engine", alertType: "anomaly" as const, service: "alert-engine", metricName: "latency", condition: "anomaly" as const, threshold: null, severity: "medium" as const, status: "active" as const, notificationChannels: ["slack"], firingCount: 2, lastFiredAt: new Date(Date.now() - 7200000) },
    { name: "Alloy Engine Throughput Drop", description: "Request throughput fell below minimum", alertType: "threshold" as const, service: "alloy-engine", metricName: "throughput", condition: "lt" as const, threshold: 40, severity: "high" as const, status: "active" as const, notificationChannels: ["slack"], firingCount: 4, lastFiredAt: new Date(Date.now() - 86400000) },
    { name: "Vessels Intel Memory", description: "Memory usage above safe operating threshold", alertType: "threshold" as const, service: "vessels-intel", metricName: "memory", condition: "gt" as const, threshold: 80, severity: "medium" as const, status: "active" as const, notificationChannels: ["email"], firingCount: 8, lastFiredAt: new Date(Date.now() - 43200000) },
    { name: "PRISM Engine Availability", description: "Availability dropped below SLA commitment", alertType: "threshold" as const, service: "prism-engine", metricName: "availability", condition: "lt" as const, threshold: 99.5, severity: "critical" as const, status: "resolved" as const, notificationChannels: ["pagerduty", "slack", "email"], firingCount: 1, lastFiredAt: new Date(Date.now() - 172800000) },
    { name: "Terra Beacon Latency Warn", description: "API latency exceeding warning threshold", alertType: "threshold" as const, service: "terra-beacon", metricName: "latency", condition: "gt" as const, threshold: 200, severity: "medium" as const, status: "active" as const, notificationChannels: ["slack"], firingCount: 15, lastFiredAt: new Date(Date.now() - 21600000) },
    { name: "Firestorm SOC Error Rate", description: "Elevated error rate in security operations", alertType: "threshold" as const, service: "firestorm-soc", metricName: "error_rate", condition: "gt" as const, threshold: 3, severity: "high" as const, status: "active" as const, notificationChannels: ["pagerduty"], firingCount: 6, lastFiredAt: new Date(Date.now() - 10800000) },
    { name: "Notification SVC Queue", description: "Notification delivery queue backed up", alertType: "threshold" as const, service: "notification-svc", metricName: "queue_depth", condition: "gt" as const, threshold: 100, severity: "medium" as const, status: "active" as const, notificationChannels: ["slack"], firingCount: 9, lastFiredAt: new Date(Date.now() - 14400000) },
    { name: "Revenue Anomaly Detection", description: "Unexpected revenue pattern detected", alertType: "anomaly" as const, service: "lyte-core", metricName: "revenue", condition: "anomaly" as const, threshold: null, severity: "critical" as const, status: "active" as const, notificationChannels: ["email", "slack"], firingCount: 1, lastFiredAt: new Date(Date.now() - 259200000) },
    { name: "Action Router CPU", description: "CPU spike in action routing service", alertType: "threshold" as const, service: "action-router", metricName: "cpu", condition: "gt" as const, threshold: 80, severity: "medium" as const, status: "silenced" as const, notificationChannels: ["slack"], firingCount: 3, lastFiredAt: new Date(Date.now() - 86400000) },
    { name: "Workflow Exec Throughput", description: "Workflow execution rate below SLA", alertType: "threshold" as const, service: "workflow-exec", metricName: "throughput", condition: "lt" as const, threshold: 30, severity: "high" as const, status: "active" as const, notificationChannels: ["pagerduty"], firingCount: 2, lastFiredAt: new Date(Date.now() - 18000000) },
    { name: "Metrics Store Memory", description: "Metrics database memory pressure", alertType: "threshold" as const, service: "metrics-store", metricName: "memory", condition: "gt" as const, threshold: 85, severity: "high" as const, status: "firing" as const, notificationChannels: ["slack", "pagerduty"], firingCount: 4, lastFiredAt: new Date(Date.now() - 1200000) },
    { name: "Geo Index Latency", description: "Geospatial index query latency spiking", alertType: "threshold" as const, service: "terra-beacon", metricName: "latency", condition: "gt" as const, threshold: 500, severity: "high" as const, status: "resolved" as const, notificationChannels: ["slack"], firingCount: 2, lastFiredAt: new Date(Date.now() - 432000000) },
    { name: "Composite: Core Platform Degraded", description: "Multiple core services showing degradation simultaneously", alertType: "composite" as const, service: "api-gateway", metricName: "availability", condition: "lt" as const, threshold: 98, severity: "critical" as const, status: "active" as const, notificationChannels: ["pagerduty", "slack", "email"], firingCount: 0, lastFiredAt: null },
    { name: "Churn Rate Warning", description: "Customer churn rate trending above threshold", alertType: "threshold" as const, service: "lyte-core", metricName: "churn_rate", condition: "gt" as const, threshold: 3, severity: "high" as const, status: "active" as const, notificationChannels: ["email"], firingCount: 1, lastFiredAt: new Date(Date.now() - 604800000) },
    { name: "NPS Below Target", description: "Net Promoter Score fell below company target", alertType: "threshold" as const, service: "lyte-core", metricName: "nps", condition: "lt" as const, threshold: 35, severity: "medium" as const, status: "active" as const, notificationChannels: ["slack"], firingCount: 3, lastFiredAt: new Date(Date.now() - 86400000) },
    { name: "AIS Stream Throughput", description: "AIS data stream throughput degraded", alertType: "threshold" as const, service: "vessels-intel", metricName: "throughput", condition: "lt" as const, threshold: 50, severity: "medium" as const, status: "resolved" as const, notificationChannels: ["email"], firingCount: 5, lastFiredAt: new Date(Date.now() - 345600000) },
    { name: "Threat DB Query Latency", description: "Threat intelligence database slow", alertType: "threshold" as const, service: "firestorm-soc", metricName: "latency", condition: "gt" as const, threshold: 250, severity: "medium" as const, status: "active" as const, notificationChannels: ["slack"], firingCount: 7, lastFiredAt: new Date(Date.now() - 28800000) },
    { name: "PRISM Engine Error Rate Anomaly", description: "Anomalous error patterns in PRISM scoring", alertType: "anomaly" as const, service: "prism-engine", metricName: "error_rate", condition: "anomaly" as const, threshold: null, severity: "high" as const, status: "draft" as const, notificationChannels: ["slack"], firingCount: 0, lastFiredAt: null },
    { name: "Escalation Manager Overload", description: "Escalation processing capacity exceeded", alertType: "threshold" as const, service: "escalation-mgr", metricName: "queue_depth", condition: "gt" as const, threshold: 80, severity: "critical" as const, status: "firing" as const, notificationChannels: ["pagerduty", "slack"], firingCount: 2, lastFiredAt: new Date(Date.now() - 300000) },
    { name: "Revenue Delta > 20%", description: "Revenue delta exceeds ±20% from 7-day avg", alertType: "threshold" as const, service: "alloy-engine", metricName: "revenue", condition: "gt" as const, threshold: 8000, severity: "high" as const, status: "active" as const, notificationChannels: ["email", "slack"], firingCount: 0, lastFiredAt: null },
    { name: "ML Inference Availability", description: "ML serving availability below SLA", alertType: "threshold" as const, service: "ml-inference", metricName: "availability", condition: "lt" as const, threshold: 99, severity: "critical" as const, status: "active" as const, notificationChannels: ["pagerduty"], firingCount: 1, lastFiredAt: new Date(Date.now() - 604800000) },
  ];
}

function buildEscalationDefs(alerts: any[]) {
  const firingAlerts = alerts.filter(a => ["firing", "active"].includes(a.status));
  const now = Date.now();

  const OWNERS = ["alice.morgan", "ben.tucker", "cris.wu", "diana.osei", "evan.cole"];
  const PATHS_3 = [
    [{ stage: 1, owner: "on-call-eng", label: "On-Call Engineer" }, { stage: 2, owner: "team-lead", label: "Team Lead" }, { stage: 3, owner: "vp-engineering", label: "VP Engineering" }],
    [{ stage: 1, owner: "sre-primary", label: "SRE Primary" }, { stage: 2, owner: "platform-lead", label: "Platform Lead" }, { stage: 3, owner: "cto-office", label: "CTO Office" }],
  ];
  const PATHS_4 = [
    [{ stage: 1, owner: "l1-support", label: "L1 Support" }, { stage: 2, owner: "l2-engineering", label: "L2 Engineering" }, { stage: 3, owner: "team-lead", label: "Team Lead" }, { stage: 4, owner: "vp-ops", label: "VP Operations" }],
  ];

  const defs: any[] = [];

  // Active critical escalations
  defs.push({
    title: "P0: API Gateway latency affecting all tenants",
    description: "API gateway latency exceeding 500ms P95 — multi-tenant impact across all SZL platforms",
    alertId: firingAlerts[0]?.id ?? null,
    severity: "critical",
    status: "in_progress",
    stage: 2,
    maxStage: 3,
    owner: OWNERS[0],
    assignedTo: OWNERS[1],
    escalationPath: PATHS_3[0],
    slaDeadlineAt: new Date(now + 3600000),
    metadata: { service: "api-gateway", affectedTenants: 47 },
  });

  defs.push({
    title: "Critical: Metrics Store memory exhaustion imminent",
    description: "Metrics database approaching 90% memory utilization — risk of OOM and data loss",
    alertId: firingAlerts[1]?.id ?? null,
    severity: "critical",
    status: "open",
    stage: 1,
    maxStage: 4,
    owner: OWNERS[2],
    assignedTo: OWNERS[2],
    escalationPath: PATHS_4[0],
    slaDeadlineAt: new Date(now + 1800000),
    metadata: { service: "metrics-store", currentMemoryPct: 89 },
  });

  defs.push({
    title: "High: Signal Bus queue depth — processing backlog",
    description: "Signal processing queue backed up with 180+ pending signals, SLA at risk",
    alertId: firingAlerts[2]?.id ?? null,
    severity: "high",
    status: "escalated",
    stage: 3,
    maxStage: 3,
    owner: OWNERS[1],
    assignedTo: OWNERS[3],
    escalationPath: PATHS_3[1],
    slaDeadlineAt: new Date(now - 900000),
    metadata: { service: "signal-bus", queueDepth: 183 },
  });

  defs.push({
    title: "P1: Escalation Manager capacity exceeded",
    description: "Escalation processing at 120% capacity — new incidents not being routed",
    alertId: firingAlerts[3]?.id ?? null,
    severity: "critical",
    status: "in_progress",
    stage: 2,
    maxStage: 3,
    owner: OWNERS[4],
    assignedTo: OWNERS[0],
    escalationPath: PATHS_3[0],
    slaDeadlineAt: new Date(now + 7200000),
    metadata: { service: "escalation-mgr" },
  });

  // Medium severity active escalations
  for (let i = 0; i < 5; i++) {
    const service = SERVICES[i + 3];
    const path = i % 2 === 0 ? PATHS_3[0] : PATHS_3[1];
    defs.push({
      title: `Elevated: ${service} performance degradation`,
      description: `${service} exhibiting degraded performance metrics — investigation in progress`,
      alertId: firingAlerts[i + 4]?.id ?? null,
      severity: i === 0 ? "high" : "medium",
      status: "in_progress",
      stage: Math.floor(Math.random() * 2) + 1,
      maxStage: 3,
      owner: OWNERS[i % 5],
      assignedTo: OWNERS[(i + 1) % 5],
      escalationPath: path,
      slaDeadlineAt: new Date(now + rng(3600000, 14400000)),
      metadata: { service },
    });
  }

  // Resolved escalations (historical)
  for (let i = 0; i < 10; i++) {
    const service = SERVICES[i % SERVICES.length];
    defs.push({
      title: `Resolved: ${service} incident #${1000 + i}`,
      description: `Incident on ${service} — fully resolved after escalation to stage 2`,
      alertId: null,
      severity: ["critical", "high", "medium"][i % 3] as any,
      status: "resolved",
      stage: 2,
      maxStage: 3,
      owner: OWNERS[i % 5],
      assignedTo: OWNERS[(i + 2) % 5],
      escalationPath: PATHS_3[i % 2],
      slaDeadlineAt: new Date(now - rng(3600000, 604800000)),
      resolvedAt: new Date(now - rng(1800000, 86400000)),
      metadata: { service, resolution: "auto-scaled and patched" },
    });
  }

  // Closed/low escalations
  for (let i = 0; i < 8; i++) {
    defs.push({
      title: `Closed: Minor ${SERVICES[i % SERVICES.length]} anomaly`,
      description: "Low severity anomaly — auto-resolved by platform",
      alertId: null,
      severity: "low",
      status: "closed",
      stage: 1,
      maxStage: 3,
      owner: OWNERS[i % 5],
      assignedTo: OWNERS[i % 5],
      escalationPath: PATHS_3[0],
      slaDeadlineAt: null,
      resolvedAt: new Date(now - rng(86400000, 604800000)),
      metadata: {},
    });
  }

  return defs;
}

function getSignalTitle(type: string, service: string): string {
  const titles: Record<string, string[]> = {
    anomaly: [`Anomalous metric pattern in ${service}`, `Unusual activity detected: ${service}`, `Behavioral deviation flagged for ${service}`],
    alert_fired: [`Alert triggered on ${service}`, `Threshold breach on ${service}`, `Alert condition met: ${service}`],
    sla_breach: [`SLA breach: ${service} response time`, `SLO violation detected on ${service}`, `Uptime commitment missed: ${service}`],
    owner_gap: [`Ownership gap identified in ${service}`, `No active owner for ${service}`, `${service} missing on-call coverage`],
    compliance_flag: [`Compliance gap: ${service} audit trail`, `Policy violation detected in ${service}`, `Regulatory exposure: ${service}`],
    cost_spike: [`Cost anomaly detected: ${service}`, `Unexpected resource spend on ${service}`, `Budget overrun signal: ${service}`],
    churn_risk: [`Churn risk signal from ${service}`, `Customer health score declining via ${service}`, `Retention risk detected: ${service}`],
    deployment: [`Deployment event on ${service}`, `Configuration change: ${service}`, `Version rollout completed: ${service}`],
  };
  const options = titles[type] ?? [`Signal detected: ${service}`];
  return options[Math.floor(Math.random() * options.length)];
}
