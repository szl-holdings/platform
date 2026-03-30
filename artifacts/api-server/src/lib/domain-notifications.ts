import { publish, WS_CHANNELS } from "./websocket";
import { logger } from "./logger";

export type NotifSeverity = "info" | "warning" | "critical";

export interface DomainNotif {
  appId: string;
  appName: string;
  title: string;
  message: string;
  severity: NotifSeverity;
  actionUrl?: string;
}

export function broadcastNotification(notif: DomainNotif): void {
  const payload = {
    id: `${notif.appId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    appId: notif.appId,
    appName: notif.appName,
    title: notif.title,
    message: notif.message,
    severity: notif.severity,
    actionUrl: notif.actionUrl ?? null,
    isRead: false,
    createdAt: new Date().toISOString(),
    type: notif.severity === "critical" ? "error" : notif.severity === "warning" ? "warning" : "info",
  };

  publish(WS_CHANNELS.NOTIFICATIONS, "new_notification", payload);
  logger.debug({ appId: notif.appId, title: notif.title, severity: notif.severity }, "Domain notification broadcast");
}

const NOTIFICATION_INTERVAL_MS = 45_000;

interface DomainNotifConfig {
  appId: string;
  appName: string;
  generators: Array<() => DomainNotif>;
}

const domainConfigs: DomainNotifConfig[] = [
  {
    appId: "firestorm",
    appName: "Firestorm",
    generators: [
      () => ({
        appId: "firestorm",
        appName: "Firestorm",
        title: "Critical Threat Detected",
        message: `APT group activity detected targeting infrastructure — CVE-2024-${1000 + Math.floor(Math.random() * 8999)} exploited`,
        severity: "critical" as NotifSeverity,
        actionUrl: "/firestorm/incidents",
      }),
      () => ({
        appId: "firestorm",
        appName: "Firestorm",
        title: "SLA Breach Warning",
        message: `P1 incident #INC-${1000 + Math.floor(Math.random() * 900)} approaching 4h SLA threshold`,
        severity: "warning" as NotifSeverity,
        actionUrl: "/firestorm/incidents",
      }),
      () => ({
        appId: "firestorm",
        appName: "Firestorm",
        title: "New MITRE ATT&CK Pattern",
        message: "TA0002 Execution tactic observed across 3 endpoints in Production VPC",
        severity: "warning" as NotifSeverity,
        actionUrl: "/firestorm/mitre-attack",
      }),
      () => ({
        appId: "firestorm",
        appName: "Firestorm",
        title: "Compliance Drift Detected",
        message: "SOC 2 Type II readiness score dropped 4.2 points — 6 new control gaps identified",
        severity: "warning" as NotifSeverity,
        actionUrl: "/firestorm/cr/dashboard",
      }),
    ],
  },
  {
    appId: "vessels",
    appName: "Vessels",
    generators: [
      () => ({
        appId: "vessels",
        appName: "Vessels",
        title: "Dark Vessel Alert",
        message: `Vessel ${["MV Prometheus", "MSC Aurora", "Pacific Star", "Nordic Eagle"][Math.floor(Math.random() * 4)]} AIS signal lost — possible dark vessel activity`,
        severity: "critical" as NotifSeverity,
        actionUrl: "/vessels/dark-vessel-detection",
      }),
      () => ({
        appId: "vessels",
        appName: "Vessels",
        title: "Fleet Route Deviation",
        message: `${["Pacific Express", "Atlantic Carrier", "Gulf Runner"][Math.floor(Math.random() * 3)]} deviated ${10 + Math.floor(Math.random() * 40)} NM from planned route`,
        severity: "warning" as NotifSeverity,
        actionUrl: "/vessels/route-planning",
      }),
      () => ({
        appId: "vessels",
        appName: "Vessels",
        title: "Port Congestion Alert",
        message: `${["Rotterdam", "Shanghai", "Singapore", "Los Angeles"][Math.floor(Math.random() * 4)]} port experiencing 18hr delays — 3 fleet vessels affected`,
        severity: "warning" as NotifSeverity,
        actionUrl: "/vessels/port-analytics",
      }),
      () => ({
        appId: "vessels",
        appName: "Vessels",
        title: "Cargo Status Update",
        message: "High-value cargo manifest signed — customs clearance required within 6 hours",
        severity: "info" as NotifSeverity,
        actionUrl: "/vessels/",
      }),
    ],
  },
  {
    appId: "msp",
    appName: "Rosie",
    generators: [
      () => ({
        appId: "msp",
        appName: "Rosie",
        title: "SLA Breach Imminent",
        message: `Client ${["Apex Industries", "TechCorp", "Nova Systems", "Pinnacle LLC"][Math.floor(Math.random() * 4)]} — P1 ticket ${Math.floor(Math.random() * 60)}min from SLA breach`,
        severity: "critical" as NotifSeverity,
        actionUrl: "/msp/tickets",
      }),
      () => ({
        appId: "msp",
        appName: "Rosie",
        title: "Device Offline Alert",
        message: `${2 + Math.floor(Math.random() * 8)} devices offline across client network — monitoring triggered`,
        severity: "warning" as NotifSeverity,
        actionUrl: "/msp/devices",
      }),
      () => ({
        appId: "msp",
        appName: "Rosie",
        title: "Contract Renewal Due",
        message: `${["Meridian Corp", "Atlas Partners", "Zenith Tech"][Math.floor(Math.random() * 3)]} contract expires in 14 days — renewal required`,
        severity: "info" as NotifSeverity,
        actionUrl: "/msp/contracts",
      }),
      () => ({
        appId: "msp",
        appName: "Rosie",
        title: "NOC Alert Escalation",
        message: "Network anomaly detected — auto-escalated to L2 support team",
        severity: "warning" as NotifSeverity,
        actionUrl: "/msp/noc",
      }),
    ],
  },
  {
    appId: "lyte",
    appName: "Lyte",
    generators: [
      () => ({
        appId: "lyte",
        appName: "Lyte",
        title: "P1 Incident Triggered",
        message: `Production service degradation detected — ${["API latency spike", "Database connection pool exhausted", "CDN edge failure"][Math.floor(Math.random() * 3)]}`,
        severity: "critical" as NotifSeverity,
        actionUrl: "/lyte-command-center/incidents",
      }),
      () => ({
        appId: "lyte",
        appName: "Lyte",
        title: "SLO Burn Rate Alert",
        message: `Error budget for ${["checkout-service", "auth-api", "payment-gateway"][Math.floor(Math.random() * 3)]} at ${60 + Math.floor(Math.random() * 35)}% — accelerated consumption detected`,
        severity: "warning" as NotifSeverity,
        actionUrl: "/lyte-command-center/slo-tracking",
      }),
      () => ({
        appId: "lyte",
        appName: "Lyte",
        title: "Anomaly Detected",
        message: "ML model flagged unusual traffic pattern — 3.4σ deviation from baseline",
        severity: "warning" as NotifSeverity,
        actionUrl: "/lyte-command-center/anomaly-detection",
      }),
      () => ({
        appId: "lyte",
        appName: "Lyte",
        title: "On-Call Escalation",
        message: `Incident #${1000 + Math.floor(Math.random() * 900)} auto-escalated after 15min without acknowledgment`,
        severity: "critical" as NotifSeverity,
        actionUrl: "/lyte-command-center/incidents",
      }),
    ],
  },
  {
    appId: "terra",
    appName: "Beacon",
    generators: [
      () => ({
        appId: "terra",
        appName: "Beacon",
        title: "Lease Expiry Alert",
        message: `${2 + Math.floor(Math.random() * 5)} properties have leases expiring within 30 days — renewal outreach needed`,
        severity: "warning" as NotifSeverity,
        actionUrl: "/terra/pipeline",
      }),
      () => ({
        appId: "terra",
        appName: "Beacon",
        title: "Vacancy Rate Spike",
        message: `Portfolio vacancy rate increased to ${8 + Math.floor(Math.random() * 7)}% — above 10% threshold approaching`,
        severity: "warning" as NotifSeverity,
        actionUrl: "/terra/dashboard",
      }),
      () => ({
        appId: "terra",
        appName: "Beacon",
        title: "Market Valuation Update",
        message: "Q1 2026 valuations complete — 3 properties show 12%+ appreciation",
        severity: "info" as NotifSeverity,
        actionUrl: "/terra/market",
      }),
      () => ({
        appId: "terra",
        appName: "Beacon",
        title: "Investment Alert",
        message: "High-yield acquisition opportunity flagged — cap rate 7.8% in target market",
        severity: "info" as NotifSeverity,
        actionUrl: "/terra/investment-analysis",
      }),
    ],
  },
  {
    appId: "inca",
    appName: "INCA",
    generators: [
      () => ({
        appId: "inca",
        appName: "INCA",
        title: "Model Drift Detected",
        message: `${["NeuralNet-v3", "ClassifyBERT", "ForecastXL"][Math.floor(Math.random() * 3)]} feature drift score ${(0.15 + Math.random() * 0.3).toFixed(2)} — retraining recommended`,
        severity: "warning" as NotifSeverity,
        actionUrl: "/inca/prediction-drift",
      }),
      () => ({
        appId: "inca",
        appName: "INCA",
        title: "Training Complete",
        message: `Experiment #EXP-${100 + Math.floor(Math.random() * 900)} finished — accuracy ${(88 + Math.random() * 10).toFixed(1)}% on validation set`,
        severity: "info" as NotifSeverity,
        actionUrl: "/inca/experiments",
      }),
      () => ({
        appId: "inca",
        appName: "INCA",
        title: "GPU Memory Warning",
        message: `Training cluster GPU utilization at ${90 + Math.floor(Math.random() * 9)}% — OOM risk on next batch`,
        severity: "warning" as NotifSeverity,
        actionUrl: "/inca/gpu-monitoring",
      }),
      () => ({
        appId: "inca",
        appName: "INCA",
        title: "Model Registered",
        message: `${["QuantumLLM-7B", "VisionNet-v2", "SentimentPro"][Math.floor(Math.random() * 3)]} promoted to production registry`,
        severity: "info" as NotifSeverity,
        actionUrl: "/inca/model-registry",
      }),
    ],
  },
  {
    appId: "dreamscape",
    appName: "Nimbus",
    generators: [
      () => ({
        appId: "dreamscape",
        appName: "Nimbus",
        title: "Campaign Milestone Reached",
        message: `${["Q2 Brand Launch", "Summer Campaign", "Product Drop"][Math.floor(Math.random() * 3)]} reached ${50 + Math.floor(Math.random() * 45)}% of engagement target`,
        severity: "info" as NotifSeverity,
        actionUrl: "/dreamscape/",
      }),
      () => ({
        appId: "dreamscape",
        appName: "Nimbus",
        title: "Content Approval Needed",
        message: `${3 + Math.floor(Math.random() * 5)} AI-generated assets pending review before scheduled publication`,
        severity: "warning" as NotifSeverity,
        actionUrl: "/dreamscape/ai-studio",
      }),
      () => ({
        appId: "dreamscape",
        appName: "Nimbus",
        title: "Brand Voice Deviation",
        message: "AI Studio generated content flagged — tone inconsistency with brand guidelines detected",
        severity: "warning" as NotifSeverity,
        actionUrl: "/dreamscape/brand-voice-engine",
      }),
      () => ({
        appId: "dreamscape",
        appName: "Nimbus",
        title: "Social Post Published",
        message: "Scheduled batch of 8 posts published across LinkedIn, X, and Instagram",
        severity: "info" as NotifSeverity,
        actionUrl: "/dreamscape/content-calendar",
      }),
    ],
  },
];

let notifTimers: ReturnType<typeof setInterval>[] = [];

export function startDomainNotificationGenerators(): void {
  stopDomainNotificationGenerators();

  for (const config of domainConfigs) {
    const jitter = Math.floor(Math.random() * 15_000);
    const timer = setInterval(() => {
      const generator = config.generators[Math.floor(Math.random() * config.generators.length)];
      if (generator) {
        broadcastNotification(generator());
      }
    }, NOTIFICATION_INTERVAL_MS + jitter);
    notifTimers.push(timer);
  }

  logger.info({ count: domainConfigs.length }, "Domain notification generators started");
}

export function stopDomainNotificationGenerators(): void {
  for (const timer of notifTimers) {
    clearInterval(timer);
  }
  notifTimers = [];
}
