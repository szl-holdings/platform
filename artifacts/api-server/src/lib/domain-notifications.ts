import { logger } from './logger';
import { dispatchExternalAlert } from './notification-dispatch';
import { queueExternalAlert } from './queued-jobs';
import { publish, WS_CHANNELS } from './websocket';

export type NotifSeverity = 'info' | 'warning' | 'critical';

export interface DomainNotif {
  appId: string;
  appName: string;
  title: string;
  message: string;
  severity: NotifSeverity;
  actionUrl?: string;
  // Optional CORTEX mobile deep-link (overrides the workspace-root default).
  // Should be an Expo Router path like "/(shell)/defense/incident/INC-1234".
  mobileRoute?: string;
  // Optional CORTEX mobile workspace domain override (defaults to the value
  // derived from `appId`). Useful when one server appId can target multiple
  // workspaces depending on the notification (e.g. lyte vs prism).
  mobileDomain?: string;
}

// Maps the legacy per-app `appId` used here to the unified CORTEX mobile
// workspace domain so push consumers (mobile shell) can deep-link into the
// correct workspace tab without knowing the legacy app taxonomy.
const APP_ID_TO_CORTEX_DOMAIN: Record<string, string> = {
  aegis: 'defense',
  vessels: 'fleet',
  terra: 'properties',
  lyte: 'operations',
  'aegis-ops': 'operations',
  msp: 'operations',
  carlota: 'advisory',
  'carlota-jo': 'advisory',
  prism: 'advisory',
  'aegis-intel': 'intelligence',
  inca: 'intelligence',
  cortex: 'intelligence',
  'alloy-creative': 'portfolio',
  szl: 'portfolio',
  stephen: 'founder',
};

const DOMAIN_TO_CORTEX_ROUTE: Record<string, string> = {
  defense: '/(shell)/defense',
  fleet: '/(shell)/fleet',
  properties: '/(shell)/properties',
  operations: '/(shell)/operations',
  advisory: '/(shell)/advisory',
  portfolio: '/(shell)/portfolio',
  founder: '/(shell)/founder',
  intelligence: '/(shell)/intelligence',
  command: '/(shell)/',
};

export function broadcastNotification(notif: DomainNotif): void {
  const cortexDomain = notif.mobileDomain ?? APP_ID_TO_CORTEX_DOMAIN[notif.appId] ?? 'command';
  const cortexRoute = notif.mobileRoute ?? DOMAIN_TO_CORTEX_ROUTE[cortexDomain] ?? '/(shell)/';

  const payload = {
    id: `${notif.appId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    appId: notif.appId,
    appName: notif.appName,
    title: notif.title,
    message: notif.message,
    severity: notif.severity,
    actionUrl: notif.actionUrl ?? null,
    domain: cortexDomain,
    route: cortexRoute,
    isRead: false,
    createdAt: new Date().toISOString(),
    type:
      notif.severity === 'critical' ? 'error' : notif.severity === 'warning' ? 'warning' : 'info',
  };

  publish(WS_CHANNELS.NOTIFICATIONS, 'new_notification', payload);
  logger.debug(
    { appId: notif.appId, title: notif.title, severity: notif.severity },
    'Domain notification broadcast',
  );

  if (notif.severity === 'critical' || notif.severity === 'warning') {
    // GAP-017: enqueue durably so a server restart between WS broadcast
    // and external fanout (Slack/Teams/SMS/voice/email) does not lose
    // the alert. Falls back to inline dispatch if the queue is offline.
    queueExternalAlert({
      appName: notif.appName,
      title: notif.title,
      message: notif.message,
      severity: notif.severity,
      actionUrl: notif.actionUrl,
    }).catch((err) => {
      logger.warn({ err }, 'queueExternalAlert failed — falling back to inline dispatch');
      dispatchExternalAlert({
        appName: notif.appName,
        title: notif.title,
        message: notif.message,
        severity: notif.severity,
        actionUrl: notif.actionUrl,
      }).catch((innerErr) => {
        logger.warn({ err: innerErr }, 'External alert inline dispatch fallback failed');
      });
    });
  }
}

const NOTIFICATION_INTERVAL_MS = 45_000;

interface DomainNotifConfig {
  appId: string;
  appName: string;
  generators: Array<() => DomainNotif>;
}

const domainConfigs: DomainNotifConfig[] = [
  {
    appId: 'aegis',
    appName: 'PARAGON',
    generators: [
      () => ({
        appId: 'aegis',
        appName: 'PARAGON',
        title: 'Critical Threat Detected',
        message: `APT group activity detected targeting infrastructure — CVE-2024-${1000 + Math.floor(Math.random() * 8999)} exploited`,
        severity: 'critical' as NotifSeverity,
        actionUrl: '/firestorm/soc',
      }),
      () => {
        const incidentId = `INC-${1000 + Math.floor(Math.random() * 900)}`;
        return {
          appId: 'aegis',
          appName: 'PARAGON',
          title: 'SLA Breach Warning',
          message: `P1 incident #${incidentId} approaching 4h SLA threshold`,
          severity: 'warning' as NotifSeverity,
          actionUrl: '/firestorm/soc',
          mobileRoute: `/(shell)/defense/incident/${incidentId}`,
        };
      },
      () => ({
        appId: 'aegis',
        appName: 'PARAGON',
        title: 'New MITRE ATT&CK Pattern',
        message: 'TA0002 Execution tactic observed across 3 endpoints in Production VPC',
        severity: 'warning' as NotifSeverity,
        actionUrl: '/firestorm/mitre-attack',
      }),
      () => ({
        appId: 'aegis',
        appName: 'PARAGON',
        title: 'Compliance Drift Detected',
        message: 'SOC 2 Type II readiness score dropped 4.2 points — 6 new control gaps identified',
        severity: 'warning' as NotifSeverity,
        actionUrl: '/firestorm/cr/dashboard',
      }),
    ],
  },
  {
    appId: 'vessels',
    appName: 'SEXTANT',
    generators: [
      () => {
        const vessels = ['MV Prometheus', 'MSC Aurora', 'Pacific Star', 'Nordic Eagle'];
        const vesselSlugs = ['mv-prometheus', 'msc-aurora', 'pacific-star', 'nordic-eagle'];
        const idx = Math.floor(Math.random() * vessels.length);
        return {
          appId: 'vessels',
          appName: 'SEXTANT',
          title: 'Dark Vessel Alert',
          message: `Vessel ${vessels[idx]} AIS signal lost — possible dark vessel activity`,
          severity: 'critical' as NotifSeverity,
          actionUrl: '/vessels/dark-vessel-detection',
          mobileRoute: `/(shell)/fleet/vessel/${vesselSlugs[idx]}`,
        };
      },
      () => ({
        appId: 'vessels',
        appName: 'SEXTANT',
        title: 'Fleet Route Deviation',
        message: `${['Pacific Express', 'Atlantic Carrier', 'Gulf Runner'][Math.floor(Math.random() * 3)]} deviated ${10 + Math.floor(Math.random() * 40)} NM from planned route`,
        severity: 'warning' as NotifSeverity,
        actionUrl: '/vessels/route-planning',
      }),
      () => ({
        appId: 'vessels',
        appName: 'SEXTANT',
        title: 'Port Congestion Alert',
        message: `${['Rotterdam', 'Shanghai', 'Singapore', 'Los Angeles'][Math.floor(Math.random() * 4)]} port experiencing 18hr delays — 3 fleet vessels affected`,
        severity: 'warning' as NotifSeverity,
        actionUrl: '/vessels/port-analytics',
      }),
      () => ({
        appId: 'vessels',
        appName: 'SEXTANT',
        title: 'Cargo Status Update',
        message: 'High-value cargo manifest signed — customs clearance required within 6 hours',
        severity: 'info' as NotifSeverity,
        actionUrl: '/vessels/',
      }),
    ],
  },
  {
    appId: 'aegis-ops',
    appName: 'Aegis Operations',
    generators: [
      () => ({
        appId: 'aegis-ops',
        appName: 'Aegis Operations',
        title: 'SLA Breach Imminent',
        message: `Client ${['Apex Industries', 'TechCorp', 'Nova Systems', 'Pinnacle LLC'][Math.floor(Math.random() * 4)]} — P1 ticket ${Math.floor(Math.random() * 60)}min from SLA breach`,
        severity: 'critical' as NotifSeverity,
        actionUrl: '/firestorm/ops/tickets',
      }),
      () => ({
        appId: 'aegis-ops',
        appName: 'Aegis Operations',
        title: 'Device Offline Alert',
        message: `${2 + Math.floor(Math.random() * 8)} devices offline across client network — monitoring triggered`,
        severity: 'warning' as NotifSeverity,
        actionUrl: '/firestorm/ops/devices',
      }),
      () => ({
        appId: 'aegis-ops',
        appName: 'Aegis Operations',
        title: 'Contract Renewal Due',
        message: `${['Meridian Corp', 'Atlas Partners', 'Zenith Tech'][Math.floor(Math.random() * 3)]} contract expires in 14 days — renewal required`,
        severity: 'info' as NotifSeverity,
        actionUrl: '/firestorm/ops/contracts',
      }),
      () => ({
        appId: 'aegis-ops',
        appName: 'Aegis Operations',
        title: 'NOC Alert Escalation',
        message: 'Network anomaly detected — auto-escalated to L2 support team',
        severity: 'warning' as NotifSeverity,
        actionUrl: '/firestorm/ops/noc',
      }),
    ],
  },
  {
    appId: 'lyte',
    appName: 'KORA',
    generators: [
      () => ({
        appId: 'lyte',
        appName: 'KORA',
        title: 'P1 Incident Triggered',
        message: `Production service degradation detected — ${['API latency spike', 'Database connection pool exhausted', 'CDN edge failure'][Math.floor(Math.random() * 3)]}`,
        severity: 'critical' as NotifSeverity,
        actionUrl: '/command/operations/inbox',
      }),
      () => ({
        appId: 'lyte',
        appName: 'KORA',
        title: 'SLO Burn Rate Alert',
        message: `Error budget for ${['checkout-service', 'auth-api', 'payment-gateway'][Math.floor(Math.random() * 3)]} at ${60 + Math.floor(Math.random() * 35)}% — accelerated consumption detected`,
        severity: 'warning' as NotifSeverity,
        actionUrl: '/command/operations/prism/pulse',
      }),
      () => ({
        appId: 'lyte',
        appName: 'KORA',
        title: 'Anomaly Detected',
        message: 'ML model flagged unusual traffic pattern — 3.4σ deviation from baseline',
        severity: 'warning' as NotifSeverity,
        actionUrl: '/command/operations/prism/signals',
      }),
      () => ({
        appId: 'lyte',
        appName: 'KORA',
        title: 'On-Call Escalation',
        message: `Incident #${1000 + Math.floor(Math.random() * 900)} auto-escalated after 15min without acknowledgment`,
        severity: 'critical' as NotifSeverity,
        actionUrl: '/command/operations/inbox',
      }),
    ],
  },
  {
    appId: 'terra',
    appName: 'DOMAINE',
    generators: [
      () => ({
        appId: 'terra',
        appName: 'DOMAINE',
        title: 'Lease Expiry Alert',
        message: `${2 + Math.floor(Math.random() * 5)} properties have leases expiring within 30 days — renewal outreach needed`,
        severity: 'warning' as NotifSeverity,
        actionUrl: '/terra/pipeline',
      }),
      () => ({
        appId: 'terra',
        appName: 'DOMAINE',
        title: 'Vacancy Rate Spike',
        message: `Portfolio vacancy rate increased to ${8 + Math.floor(Math.random() * 7)}% — above 10% threshold approaching`,
        severity: 'warning' as NotifSeverity,
        actionUrl: '/terra/dashboard',
      }),
      () => ({
        appId: 'terra',
        appName: 'DOMAINE',
        title: 'Market Valuation Update',
        message: 'Q1 2026 valuations complete — 3 properties show 12%+ appreciation',
        severity: 'info' as NotifSeverity,
        actionUrl: '/terra/market',
      }),
      () => ({
        appId: 'terra',
        appName: 'DOMAINE',
        title: 'Investment Alert',
        message: 'High-yield acquisition opportunity flagged — cap rate 7.8% in target market',
        severity: 'info' as NotifSeverity,
        actionUrl: '/terra/investment-analysis',
      }),
    ],
  },
  {
    appId: 'aegis-intel',
    appName: 'Aegis Intelligence',
    generators: [
      () => ({
        appId: 'aegis-intel',
        appName: 'Aegis Intelligence',
        title: 'Model Drift Detected',
        message: `${['NeuralNet-v3', 'ClassifyBERT', 'ForecastXL'][Math.floor(Math.random() * 3)]} feature drift score ${(0.15 + Math.random() * 0.3).toFixed(2)} — retraining recommended`,
        severity: 'warning' as NotifSeverity,
        actionUrl: '/firestorm/intel/predictions',
      }),
      () => ({
        appId: 'aegis-intel',
        appName: 'Aegis Intelligence',
        title: 'Training Complete',
        message: `Experiment #EXP-${100 + Math.floor(Math.random() * 900)} finished — accuracy ${(88 + Math.random() * 10).toFixed(1)}% on validation set`,
        severity: 'info' as NotifSeverity,
        actionUrl: '/firestorm/intel/experiments',
      }),
      () => ({
        appId: 'aegis-intel',
        appName: 'Aegis Intelligence',
        title: 'GPU Memory Warning',
        message: `Training cluster GPU utilization at ${90 + Math.floor(Math.random() * 9)}% — OOM risk on next batch`,
        severity: 'warning' as NotifSeverity,
        actionUrl: '/firestorm/intel/gpu-monitoring',
      }),
      () => ({
        appId: 'aegis-intel',
        appName: 'Aegis Intelligence',
        title: 'Model Registered',
        message: `${['QuantumLLM-7B', 'VisionNet-v2', 'SentimentPro'][Math.floor(Math.random() * 3)]} promoted to production registry`,
        severity: 'info' as NotifSeverity,
        actionUrl: '/firestorm/intel/model-registry',
      }),
    ],
  },
  {
    appId: 'alloy-creative',
    appName: 'Alloy Creative',
    generators: [
      () => ({
        appId: 'alloy-creative',
        appName: 'Alloy Creative',
        title: 'Campaign Review Ready',
        message: `${['Spring Launch', 'Brand Refresh', 'Product Reveal'][Math.floor(Math.random() * 3)]} campaign — ${2 + Math.floor(Math.random() * 4)} storyboards awaiting approval`,
        severity: 'info' as NotifSeverity,
        actionUrl: '/alloy/creative',
      }),
      () => ({
        appId: 'alloy-creative',
        appName: 'Alloy Creative',
        title: 'Script Generation Complete',
        message: `AI script for ${['30s Social Cut', '60s Brand Spot', 'Product Demo'][Math.floor(Math.random() * 3)]} ready — ${88 + Math.floor(Math.random() * 10)}% confidence score`,
        severity: 'info' as NotifSeverity,
        actionUrl: '/alloy/creative',
      }),
      () => ({
        appId: 'alloy-creative',
        appName: 'Alloy Creative',
        title: 'Approval Deadline Approaching',
        message: `${2 + Math.floor(Math.random() * 3)} creative assets pending client sign-off — deadline in ${4 + Math.floor(Math.random() * 20)}h`,
        severity: 'warning' as NotifSeverity,
        actionUrl: '/alloy/creative',
      }),
      () => ({
        appId: 'alloy-creative',
        appName: 'Alloy Creative',
        title: 'Brand Voice Analysis Done',
        message: `${['Homepage copy', 'Social captions', 'Press release'][Math.floor(Math.random() * 3)]} transformed — tone alignment ${80 + Math.floor(Math.random() * 18)}%`,
        severity: 'info' as NotifSeverity,
        actionUrl: '/alloy/creative',
      }),
    ],
  },
];

let notifTimers: ReturnType<typeof setInterval>[] = [];

export function startDomainNotificationGenerators(): void {
  if (process.env.SYNTHETIC_ALERTS !== 'true') {
    logger.info(
      'Synthetic alert generators disabled (SYNTHETIC_ALERTS != true). Notifications will only come from real system events.',
    );
    return;
  }

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

  logger.info(
    { count: domainConfigs.length },
    'Synthetic domain notification generators started (SYNTHETIC_ALERTS=true)',
  );
}

export function stopDomainNotificationGenerators(): void {
  for (const timer of notifTimers) {
    clearInterval(timer);
  }
  notifTimers = [];
}
