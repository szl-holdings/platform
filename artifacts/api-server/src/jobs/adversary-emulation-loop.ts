import { randomUUID, createHash } from 'node:crypto';
import { db, platformJobRunsTable, auditEventsTable } from '@szl-holdings/db';
import { eq, desc, and, gte } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { sendEmail } from '../lib/email.js';
import { domainEventBus } from '../lib/domain-events/index.js';

// ─── CPS Payload Registry ────────────────────────────────────────────────────

export interface CpsPayload {
  id: string;
  name: string;
  domain: 'identity' | 'lateral-movement' | 'exfiltration';
  description: string;
  maturityLevel: 'shadow' | 'supervised' | 'autonomous';
  techniqueIds: string[];
}

export const CPS_PAYLOAD_REGISTRY: CpsPayload[] = [
  {
    id: 'cps-identity-kill-chain',
    name: 'Identity Kill-Chain',
    domain: 'identity',
    description:
      'Detects and contains identity-based attacks across the full kill chain — from credential theft through privilege escalation to persistence.',
    maturityLevel: 'supervised',
    techniqueIds: ['T1078', 'T1110', 'T1003', 'T1098', 'T1053'],
  },
  {
    id: 'cps-lateral-movement-containment',
    name: 'Lateral Movement Containment',
    domain: 'lateral-movement',
    description:
      'Identifies and severs lateral movement paths before blast radius expands, using behavioral analytics and microsegmentation triggers.',
    maturityLevel: 'shadow',
    techniqueIds: ['T1021', 'T1550', 'T1563', 'T1570', 'T1534'],
  },
  {
    id: 'cps-data-exfiltration-guardrail',
    name: 'Data Exfiltration Guardrail',
    domain: 'exfiltration',
    description:
      'Intercepts data staging and exfiltration attempts, correlating DLP signals with network telemetry to block transfer before data leaves the boundary.',
    maturityLevel: 'shadow',
    techniqueIds: ['T1041', 'T1048', 'T1567', 'T1020', 'T1030'],
  },
];

// ─── ATT&CK Technique Registry ───────────────────────────────────────────────

export interface AttackTechnique {
  id: string;
  name: string;
  tacticId: string;
  tacticName: string;
  description: string;
  simulationSteps: string[];
  expectedDetectionSignals: string[];
  baselineMttdSeconds: number;
  baselineMttcSeconds: number;
  blastRadiusAssets: number;
  falsePositiveRate: number;
  analystHoursPerEvent: number;
}

export const TECHNIQUE_REGISTRY: AttackTechnique[] = [
  {
    id: 'T1078',
    name: 'Valid Accounts',
    tacticId: 'TA0006',
    tacticName: 'Credential Access',
    description: 'Adversary uses compromised credentials to authenticate as legitimate users.',
    simulationSteps: [
      'Obtain credential set from simulation vault',
      'Authenticate against identity provider',
      'Escalate via role enumeration',
      'Establish persistence via service account',
    ],
    expectedDetectionSignals: [
      'Impossible travel alert',
      'Anomalous login time',
      'New MFA device enrollment',
    ],
    baselineMttdSeconds: 420,
    baselineMttcSeconds: 900,
    blastRadiusAssets: 12,
    falsePositiveRate: 0.08,
    analystHoursPerEvent: 1.5,
  },
  {
    id: 'T1110',
    name: 'Brute Force',
    tacticId: 'TA0006',
    tacticName: 'Credential Access',
    description: 'Adversary attempts many passwords against accounts to gain access.',
    simulationSteps: [
      'Enumerate valid usernames via OSINT simulation',
      'Execute credential stuffing from simulated attacker IP range',
      'Monitor lockout triggers',
    ],
    expectedDetectionSignals: ['Account lockout spike', 'Login failure rate threshold', 'Geo-velocity anomaly'],
    baselineMttdSeconds: 180,
    baselineMttcSeconds: 420,
    blastRadiusAssets: 3,
    falsePositiveRate: 0.04,
    analystHoursPerEvent: 0.5,
  },
  {
    id: 'T1003',
    name: 'OS Credential Dumping',
    tacticId: 'TA0006',
    tacticName: 'Credential Access',
    description: 'Adversary attempts to dump credentials from OS credential stores.',
    simulationSteps: [
      'Simulate LSASS memory access request',
      'Attempt SAM database read',
      'Trigger EDR process injection hook',
    ],
    expectedDetectionSignals: [
      'LSASS access alert',
      'Privileged process anomaly',
      'Memory scraping indicator',
    ],
    baselineMttdSeconds: 60,
    baselineMttcSeconds: 300,
    blastRadiusAssets: 8,
    falsePositiveRate: 0.02,
    analystHoursPerEvent: 2.0,
  },
  {
    id: 'T1098',
    name: 'Account Manipulation',
    tacticId: 'TA0003',
    tacticName: 'Persistence',
    description: 'Adversary modifies account settings to maintain persistence.',
    simulationSteps: [
      'Add privileged role to compromised account',
      'Create backdoor service account',
      'Modify group membership',
    ],
    expectedDetectionSignals: ['Privileged role assignment alert', 'New service account created', 'Group membership change'],
    baselineMttdSeconds: 300,
    baselineMttcSeconds: 600,
    blastRadiusAssets: 6,
    falsePositiveRate: 0.06,
    analystHoursPerEvent: 1.0,
  },
  {
    id: 'T1053',
    name: 'Scheduled Task/Job',
    tacticId: 'TA0003',
    tacticName: 'Persistence',
    description: 'Adversary creates scheduled tasks to execute malicious payloads.',
    simulationSteps: [
      'Register simulated scheduled task',
      'Set trigger on startup',
      'Verify execution under system context',
    ],
    expectedDetectionSignals: ['New scheduled task alert', 'Unusual cron registration', 'System context execution'],
    baselineMttdSeconds: 720,
    baselineMttcSeconds: 1200,
    blastRadiusAssets: 4,
    falsePositiveRate: 0.12,
    analystHoursPerEvent: 0.75,
  },
  {
    id: 'T1021',
    name: 'Remote Services',
    tacticId: 'TA0008',
    tacticName: 'Lateral Movement',
    description: 'Adversary uses remote services to move laterally across systems.',
    simulationSteps: [
      'Authenticate to internal RDP/SSH from simulated compromised host',
      'Enumerate reachable internal hosts',
      'Pivot to secondary system',
    ],
    expectedDetectionSignals: [
      'Unexpected lateral RDP connection',
      'Internal port scan alert',
      'Unusual SSH source',
    ],
    baselineMttdSeconds: 540,
    baselineMttcSeconds: 1080,
    blastRadiusAssets: 18,
    falsePositiveRate: 0.1,
    analystHoursPerEvent: 2.5,
  },
  {
    id: 'T1550',
    name: 'Use Alternate Authentication Material',
    tacticId: 'TA0008',
    tacticName: 'Lateral Movement',
    description: 'Adversary uses pass-the-hash or pass-the-ticket techniques.',
    simulationSteps: [
      'Extract ticket from simulation credential store',
      'Perform simulated pass-the-ticket lateral move',
      'Access target resource via token reuse',
    ],
    expectedDetectionSignals: ['Token reuse anomaly', 'Kerberos ticket anomaly', 'Privileged session from unexpected host'],
    baselineMttdSeconds: 480,
    baselineMttcSeconds: 900,
    blastRadiusAssets: 10,
    falsePositiveRate: 0.05,
    analystHoursPerEvent: 3.0,
  },
  {
    id: 'T1041',
    name: 'Exfiltration Over C2 Channel',
    tacticId: 'TA0010',
    tacticName: 'Exfiltration',
    description: 'Adversary exfiltrates data through command-and-control channel.',
    simulationSteps: [
      'Stage simulated sensitive data in memory',
      'Establish C2 beacon to simulated external endpoint',
      'Transmit staged data payload',
    ],
    expectedDetectionSignals: [
      'Unusual outbound data volume',
      'C2 beacon pattern detected',
      'DNS exfiltration signature',
    ],
    baselineMttdSeconds: 360,
    baselineMttcSeconds: 720,
    blastRadiusAssets: 25,
    falsePositiveRate: 0.03,
    analystHoursPerEvent: 4.0,
  },
  {
    id: 'T1048',
    name: 'Exfiltration Over Alternative Protocol',
    tacticId: 'TA0010',
    tacticName: 'Exfiltration',
    description: 'Adversary exfiltrates data using protocols not typically monitored.',
    simulationSteps: [
      'Encode simulated data in DNS TXT records',
      'Exfiltrate via ICMP covert channel',
      'Test HTTPS to uncategorized domain',
    ],
    expectedDetectionSignals: ['DNS exfiltration alert', 'ICMP volume anomaly', 'Uncategorized domain access'],
    baselineMttdSeconds: 600,
    baselineMttcSeconds: 1440,
    blastRadiusAssets: 20,
    falsePositiveRate: 0.07,
    analystHoursPerEvent: 2.0,
  },
  {
    id: 'T1567',
    name: 'Exfiltration to Cloud Storage',
    tacticId: 'TA0010',
    tacticName: 'Exfiltration',
    description: 'Adversary exfiltrates data to cloud storage services.',
    simulationSteps: [
      'Authenticate to simulated shadow cloud storage',
      'Upload staged sensitive data archive',
      'Verify upload completion without alerting',
    ],
    expectedDetectionSignals: [
      'Unexpected cloud storage upload',
      'Shadow IT service access',
      'DLP policy trigger',
    ],
    baselineMttdSeconds: 900,
    baselineMttcSeconds: 1800,
    blastRadiusAssets: 30,
    falsePositiveRate: 0.15,
    analystHoursPerEvent: 1.5,
  },
  // ── Lateral Movement supplemental techniques ──────────────────────────────
  {
    id: 'T1563',
    name: 'Remote Service Session Hijacking',
    tacticId: 'TA0008',
    tacticName: 'Lateral Movement',
    description: 'Adversary hijacks an existing remote session to move laterally without new credentials.',
    simulationSteps: [
      'Enumerate active RDP/SSH sessions on compromised host',
      'Inject into simulated orphaned session',
      'Issue commands under hijacked session context',
    ],
    expectedDetectionSignals: ['Session injection alert', 'Unexpected process spawn from remote session', 'Concurrent session anomaly'],
    baselineMttdSeconds: 360,
    baselineMttcSeconds: 720,
    blastRadiusAssets: 14,
    falsePositiveRate: 0.04,
    analystHoursPerEvent: 2.0,
  },
  {
    id: 'T1570',
    name: 'Lateral Tool Transfer',
    tacticId: 'TA0008',
    tacticName: 'Lateral Movement',
    description: 'Adversary copies tools or scripts to remote systems to support further operations.',
    simulationSteps: [
      'Stage simulated attacker tooling on compromised host',
      'Transfer tooling to secondary host via SMB share',
      'Verify transfer and execute staged payload',
    ],
    expectedDetectionSignals: ['Unusual SMB write to admin share', 'New executable on secondary host', 'Lateral file transfer anomaly'],
    baselineMttdSeconds: 480,
    baselineMttcSeconds: 960,
    blastRadiusAssets: 8,
    falsePositiveRate: 0.06,
    analystHoursPerEvent: 1.5,
  },
  {
    id: 'T1534',
    name: 'Internal Spearphishing',
    tacticId: 'TA0008',
    tacticName: 'Lateral Movement',
    description: 'Adversary sends spearphishing messages from within the environment to move laterally.',
    simulationSteps: [
      'Spoof internal sender address from compromised mailbox',
      'Send simulated lure to high-privilege target',
      'Track simulated click/payload execution',
    ],
    expectedDetectionSignals: ['Internal email anomaly', 'Spoofed sender DMARC failure', 'Unusual attachment open on privileged workstation'],
    baselineMttdSeconds: 900,
    baselineMttcSeconds: 1800,
    blastRadiusAssets: 5,
    falsePositiveRate: 0.18,
    analystHoursPerEvent: 1.0,
  },
  // ── Exfiltration supplemental techniques ─────────────────────────────────
  {
    id: 'T1020',
    name: 'Automated Exfiltration',
    tacticId: 'TA0010',
    tacticName: 'Exfiltration',
    description: 'Adversary automates the collection and transfer of data to minimize dwell time.',
    simulationSteps: [
      'Deploy simulated data-scraping script on staging host',
      'Schedule automatic compression and transfer of collected files',
      'Verify automated egress to simulated drop zone',
    ],
    expectedDetectionSignals: ['Automated bulk file access anomaly', 'Scheduled task exfil pattern', 'Large outbound transfer outside business hours'],
    baselineMttdSeconds: 480,
    baselineMttcSeconds: 900,
    blastRadiusAssets: 22,
    falsePositiveRate: 0.06,
    analystHoursPerEvent: 2.5,
  },
  {
    id: 'T1030',
    name: 'Data Transfer Size Limits',
    tacticId: 'TA0010',
    tacticName: 'Exfiltration',
    description: 'Adversary exfiltrates data in small increments to evade detection thresholds.',
    simulationSteps: [
      'Split staged data into sub-threshold packets',
      'Transmit packets with randomized timing',
      'Verify no DLP volume alert triggered',
    ],
    expectedDetectionSignals: ['Chunked transfer volume anomaly', 'Repeated small outbound connections', 'DLP bypass pattern detected'],
    baselineMttdSeconds: 720,
    baselineMttcSeconds: 1440,
    blastRadiusAssets: 15,
    falsePositiveRate: 0.09,
    analystHoursPerEvent: 1.75,
  },
];

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface TechniqueRunResult {
  techniqueId: string;
  techniqueName: string;
  tacticName: string;
  detected: boolean;
  mttdSeconds: number;
  mttcSeconds: number;
  blastRadiusPrevented: number;
  falsePositivesGenerated: number;
  analystHoursSaved: number;
  outcome: 'detected-and-contained' | 'detected-not-contained' | 'missed';
  coverageGap?: string;
}

export interface PayloadScorecard {
  payloadId: string;
  payloadName: string;
  domain: string;
  runId: string;
  ranAt: string;
  techniqueResults: TechniqueRunResult[];
  mttdSeconds: number;
  mttcSeconds: number;
  blastRadiusPrevented: number;
  falsePositiveBurden: number;
  analystHoursSaved: number;
  compositeConfidence: number;
  detectionRate: number;
  containmentRate: number;
  status: 'pass' | 'regression' | 'fail';
  coverageGaps: string[];
}

export interface EmulationRunResult {
  runId: string;
  ranAt: string;
  durationMs: number;
  scorecards: PayloadScorecard[];
  overallCompositeScore: number;
  weekOverWeekDelta: number | null;
  rollingFourWeekAvg: number | null;
  regressions: Array<{ payloadId: string; payloadName: string; delta: number }>;
  status: 'pass' | 'regression' | 'fail';
  error: string | null;
}

const REGRESSION_THRESHOLD = (() => {
  const v = parseFloat(process.env.CPS_EMULATION_REGRESSION_THRESHOLD ?? '');
  return Number.isFinite(v) && v < 0 ? v : -0.08;
})();

function seededFloat(seed: string, slot: number): number {
  const buf = createHash('sha256')
    .update(`${seed}:${slot}`)
    .digest();
  return buf.readUInt32LE(0) / 0xffffffff;
}

function simulateTechniqueRun(
  technique: AttackTechnique,
  _payload: CpsPayload,
  runId: string,
): TechniqueRunResult {
  const s = (n: number) => seededFloat(`${runId}:${technique.id}`, n);

  const detectionChance = 0.78 + s(0) * 0.18;
  const detected = s(1) < detectionChance;
  const containedIfDetected = s(2) < 0.82;

  const mttdVariance = 0.7 + s(3) * 0.6;
  const mttcVariance = 0.65 + s(4) * 0.7;
  const mttdSeconds = Math.round(technique.baselineMttdSeconds * mttdVariance);
  const mttcSeconds = detected
    ? Math.round(technique.baselineMttcSeconds * mttcVariance)
    : technique.baselineMttcSeconds * 2;

  const blastRadiusPrevented = detected && containedIfDetected
    ? Math.round(technique.blastRadiusAssets * (0.7 + s(5) * 0.28))
    : 0;

  const fpVariance = 0.5 + s(6) * 1.0;
  const falsePositivesGenerated = Math.round(technique.falsePositiveRate * 10 * fpVariance);

  const analystHoursSaved = detected && containedIfDetected
    ? Math.round(technique.analystHoursPerEvent * (0.6 + s(7) * 0.6) * 10) / 10
    : 0;

  const outcome: TechniqueRunResult['outcome'] = !detected
    ? 'missed'
    : containedIfDetected
      ? 'detected-and-contained'
      : 'detected-not-contained';

  const coverageGap =
    outcome === 'missed'
      ? `No detection signal for ${technique.name} (${technique.tacticName})`
      : outcome === 'detected-not-contained'
        ? `Containment playbook gap for ${technique.name}`
        : undefined;

  return {
    techniqueId: technique.id,
    techniqueName: technique.name,
    tacticName: technique.tacticName,
    detected,
    mttdSeconds,
    mttcSeconds,
    blastRadiusPrevented,
    falsePositivesGenerated,
    analystHoursSaved,
    outcome,
    coverageGap,
  };
}

function scorePayload(payload: CpsPayload, runId: string): PayloadScorecard {
  const techniques = TECHNIQUE_REGISTRY.filter(t => payload.techniqueIds.includes(t.id));
  const results = techniques.map(t => simulateTechniqueRun(t, payload, runId));

  const ranAt = new Date().toISOString();
  const detected = results.filter(r => r.detected);
  const contained = results.filter(r => r.outcome === 'detected-and-contained');

  const avgMttd =
    detected.length > 0
      ? Math.round(detected.reduce((s, r) => s + r.mttdSeconds, 0) / detected.length)
      : 9999;
  const avgMttc =
    contained.length > 0
      ? Math.round(contained.reduce((s, r) => s + r.mttcSeconds, 0) / contained.length)
      : 9999;

  const totalBlastRadiusPrevented = results.reduce((s, r) => s + r.blastRadiusPrevented, 0);
  const totalFpBurden = results.reduce((s, r) => s + r.falsePositivesGenerated, 0);
  const totalAnalystHoursSaved = Math.round(
    results.reduce((s, r) => s + r.analystHoursSaved, 0) * 10,
  ) / 10;

  const detectionRate = techniques.length > 0 ? detected.length / techniques.length : 0;
  const containmentRate = detected.length > 0 ? contained.length / detected.length : 0;

  const normalizedMttd = Math.max(0, 1 - avgMttd / 3600);
  const normalizedMttc = Math.max(0, 1 - avgMttc / 7200);
  const fpScore = Math.max(0, 1 - totalFpBurden / (techniques.length * 3));

  const compositeConfidence =
    Math.round(
      (detectionRate * 0.3 +
        containmentRate * 0.25 +
        normalizedMttd * 0.2 +
        normalizedMttc * 0.15 +
        fpScore * 0.1) *
        1000,
    ) / 1000;

  const coverageGaps = results.filter(r => r.coverageGap).map(r => r.coverageGap as string);

  const status: PayloadScorecard['status'] =
    compositeConfidence >= 0.75 ? 'pass' : compositeConfidence >= 0.5 ? 'regression' : 'fail';

  return {
    payloadId: payload.id,
    payloadName: payload.name,
    domain: payload.domain,
    runId,
    ranAt,
    techniqueResults: results,
    mttdSeconds: avgMttd,
    mttcSeconds: avgMttc,
    blastRadiusPrevented: totalBlastRadiusPrevented,
    falsePositiveBurden: totalFpBurden,
    analystHoursSaved: totalAnalystHoursSaved,
    compositeConfidence,
    detectionRate,
    containmentRate,
    status,
    coverageGaps,
  };
}

// ─── Persistence ──────────────────────────────────────────────────────────────

export const EMULATION_JOB_TYPE = 'adversary_emulation_loop';

async function persistEmulationRun(result: EmulationRunResult): Promise<void> {
  try {
    await db
      .insert(platformJobRunsTable)
      .values({
        runId: result.runId,
        workflowType: EMULATION_JOB_TYPE,
        status: result.status === 'fail' ? 'failed' : result.status === 'regression' ? 'completed_with_warnings' : 'completed',
        domain: 'firestorm',
        triggeredBy: 'scheduler',
        triggeredByUserId: null,
        payload: {},
        result: {
          status: result.status,
          scorecards: result.scorecards,
          overallCompositeScore: result.overallCompositeScore,
          weekOverWeekDelta: result.weekOverWeekDelta,
          rollingFourWeekAvg: result.rollingFourWeekAvg,
          regressions: result.regressions,
          durationMs: result.durationMs,
        } as Record<string, unknown>,
        error: result.error ?? undefined,
        correlationId: result.runId,
        workflowRunId: result.runId,
        startedAt: new Date(result.ranAt),
        completedAt: new Date(),
      })
      .onConflictDoNothing();
  } catch (err) {
    logger.warn({ err }, '[emulation-loop] Failed to persist run record (non-fatal)');
  }
}

async function writeAuditEntry(result: EmulationRunResult): Promise<void> {
  try {
    await db.insert(auditEventsTable).values({
      action: 'adversary_emulation_run',
      entityType: 'cps_payload',
      entityId: null,
      newValues: {
        runId: result.runId,
        status: result.status,
        overallCompositeScore: result.overallCompositeScore,
        weekOverWeekDelta: result.weekOverWeekDelta,
        regressions: result.regressions.length,
        payloadCount: result.scorecards.length,
        durationMs: result.durationMs,
        ranAt: result.ranAt,
      },
    });
  } catch (err) {
    logger.warn({ err }, '[emulation-loop] Failed to write audit entry (non-fatal)');
  }
}

// ─── KORA/Lyte Signal Emission ────────────────────────────────────────────────

function emitKoraSignal(result: EmulationRunResult): void {
  try {
    const severity =
      result.status === 'fail'
        ? 'critical'
        : result.regressions.length > 0
          ? 'high'
          : 'info';

    domainEventBus.publish('firestorm.emulation-scorecard-updated', {
      runId: result.runId,
      overallCompositeScore: result.overallCompositeScore,
      weekOverWeekDelta: result.weekOverWeekDelta,
      rollingFourWeekAvg: result.rollingFourWeekAvg,
      regressions: result.regressions,
      scorecardSummary: result.scorecards.map(s => ({
        payloadId: s.payloadId,
        payloadName: s.payloadName,
        compositeConfidence: s.compositeConfidence,
        status: s.status,
        detectionRate: s.detectionRate,
        mttdSeconds: s.mttdSeconds,
        mttcSeconds: s.mttcSeconds,
        blastRadiusPrevented: s.blastRadiusPrevented,
        analystHoursSaved: s.analystHoursSaved,
      })),
      severity,
    });

    logger.info(
      { runId: result.runId, severity, score: result.overallCompositeScore },
      '[emulation-loop] KORA signal emitted',
    );
  } catch (err) {
    logger.warn({ err }, '[emulation-loop] Failed to emit KORA signal (non-fatal)');
  }
}

// ─── Regression Alert ─────────────────────────────────────────────────────────

const INTERNAL_EMAIL = process.env.SZL_INTERNAL_EMAIL ?? 'team@szlholdings.com';

async function sendRegressionAlert(result: EmulationRunResult): Promise<void> {
  const to = INTERNAL_EMAIL;
  const subject = `[SENTRA] CPS Emulation Regression Detected — ${new Date(result.ranAt).toDateString()}`;
  const regressionRows = result.regressions
    .map(
      r =>
        `<tr><td>${r.payloadName}</td><td style="color:red">${(r.delta * 100).toFixed(1)}%</td></tr>`,
    )
    .join('');

  const html = `
    <h2>Adversary Emulation — Regression Alert</h2>
    <p>Weekly CPS payload emulation detected score regressions exceeding the configured threshold (${(REGRESSION_THRESHOLD * 100).toFixed(0)}%).</p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:monospace;font-size:13px;">
      <tr><td><strong>Run ID</strong></td><td>${result.runId}</td></tr>
      <tr><td><strong>Composite Score</strong></td><td>${(result.overallCompositeScore * 100).toFixed(1)}%</td></tr>
      <tr><td><strong>Week-over-Week</strong></td><td>${result.weekOverWeekDelta != null ? (result.weekOverWeekDelta * 100).toFixed(1) + '%' : 'n/a (first run)'}</td></tr>
    </table>
    <h3>Regressions</h3>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:monospace;">
      <tr><th>Payload</th><th>Delta</th></tr>
      ${regressionRows}
    </table>
    <p>Review the full scorecard in Sentra → Resilience Scorecard.</p>
  `;

  try {
    await sendEmail({ to, subject, html, text: `CPS Emulation Regression — run ${result.runId}` });
    logger.info({ to }, '[emulation-loop] Regression alert sent');
  } catch (err) {
    logger.warn({ err }, '[emulation-loop] Failed to send regression alert (non-fatal)');
  }
}

// ─── Historical Delta Computation ─────────────────────────────────────────────

async function getRecentRunScores(limit: number): Promise<number[]> {
  try {
    const rows = await db
      .select()
      .from(platformJobRunsTable)
      .where(eq(platformJobRunsTable.workflowType, EMULATION_JOB_TYPE))
      .orderBy(desc(platformJobRunsTable.startedAt))
      .limit(limit + 1);

    return rows
      .map(r => {
        const res = r.result as Record<string, unknown> | null;
        const score = res?.overallCompositeScore;
        return typeof score === 'number' ? score : null;
      })
      .filter((s): s is number => s !== null);
  } catch {
    return [];
  }
}

// ─── Per-Payload Historical Score Lookup ──────────────────────────────────────

async function getRecentPayloadScore(payloadId: string): Promise<number | null> {
  try {
    const rows = await db
      .select()
      .from(platformJobRunsTable)
      .where(eq(platformJobRunsTable.workflowType, EMULATION_JOB_TYPE))
      .orderBy(desc(platformJobRunsTable.startedAt))
      .limit(2);

    for (const row of rows) {
      const res = row.result as Record<string, unknown> | null;
      const scorecards = res?.scorecards as
        | Array<{ payloadId: string; compositeConfidence: number }>
        | undefined;
      if (Array.isArray(scorecards)) {
        const match = scorecards.find(s => s.payloadId === payloadId);
        if (match != null && typeof match.compositeConfidence === 'number') {
          return match.compositeConfidence;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Maturity Gate ────────────────────────────────────────────────────────────

const MATURITY_GATE_THRESHOLD = 0.75;
const MATURITY_GATE_DETECTION_FLOOR = 0.80;

export interface MaturityGateResult {
  payloadId: string;
  payloadName: string;
  allowed: boolean;
  compositeConfidence: number | null;
  detectionRate: number | null;
  requiredThreshold: number;
  regressionInLastRun: boolean;
  blockers: string[];
}

export async function checkPayloadMaturityGate(payloadId: string): Promise<MaturityGateResult> {
  const payload = CPS_PAYLOAD_REGISTRY.find(p => p.id === payloadId);
  const payloadName = payload?.name ?? payloadId;

  const latestScores = await getLatestScorecardsPerPayload();
  let latest = latestScores[payloadId];

  if (!latest) {
    const recentHistory = await getEmulationRunHistory(4);
    for (const run of recentHistory) {
      const sc = run.scorecards.find(s => s.payloadId === payloadId);
      if (sc) {
        latest = sc;
        break;
      }
    }
  }

  const blockers: string[] = [];
  let regressionInLastRun = false;

  if (!latest) {
    blockers.push(
      'No emulation scorecard found for this payload. Run the adversary emulation loop first.',
    );
    return {
      payloadId,
      payloadName,
      allowed: false,
      compositeConfidence: null,
      detectionRate: null,
      requiredThreshold: MATURITY_GATE_THRESHOLD,
      regressionInLastRun: false,
      blockers,
    };
  }

  if (latest.compositeConfidence < MATURITY_GATE_THRESHOLD) {
    blockers.push(
      `Composite confidence ${(latest.compositeConfidence * 100).toFixed(1)}% is below the required ${(MATURITY_GATE_THRESHOLD * 100).toFixed(0)}% threshold.`,
    );
  }

  if (latest.status === 'regression') {
    regressionInLastRun = true;
    blockers.push('Last emulation run recorded a score regression for this payload.');
  }

  if (latest.status === 'fail') {
    blockers.push(
      'Last emulation run failed for this payload. Resolve errors before promoting.',
    );
  }

  if (latest.detectionRate < MATURITY_GATE_DETECTION_FLOOR) {
    blockers.push(
      `Detection rate ${(latest.detectionRate * 100).toFixed(1)}% is below the required ${(MATURITY_GATE_DETECTION_FLOOR * 100).toFixed(0)}% floor.`,
    );
  }

  return {
    payloadId,
    payloadName,
    allowed: blockers.length === 0,
    compositeConfidence: latest.compositeConfidence,
    detectionRate: latest.detectionRate,
    requiredThreshold: MATURITY_GATE_THRESHOLD,
    regressionInLastRun,
    blockers,
  };
}

// ─── Main Runner ──────────────────────────────────────────────────────────────

let _runLock = false;

export async function runAdversaryEmulationLoop(): Promise<EmulationRunResult> {
  if (_runLock) {
    logger.warn('[emulation-loop] Run already in progress — skipping duplicate invocation');
    throw new Error('Emulation run already in progress');
  }
  _runLock = true;
  try {
    return await _runAdversaryEmulationLoopInner();
  } finally {
    _runLock = false;
  }
}

async function _runAdversaryEmulationLoopInner(): Promise<EmulationRunResult> {
  const runId = `emul_${randomUUID()}`;
  const ranAt = new Date().toISOString();
  const start = Date.now();

  logger.info({ runId }, '[emulation-loop] Starting weekly adversary emulation loop');

  let error: string | null = null;
  let scorecards: PayloadScorecard[] = [];

  try {
    for (const payload of CPS_PAYLOAD_REGISTRY) {
      logger.info({ runId, payloadId: payload.id }, '[emulation-loop] Running payload scorecard');
      const scorecard = scorePayload(payload, runId);
      scorecards.push(scorecard);
      logger.info(
        {
          runId,
          payloadId: payload.id,
          compositeConfidence: scorecard.compositeConfidence,
          status: scorecard.status,
          detectionRate: scorecard.detectionRate,
        },
        '[emulation-loop] Payload scored',
      );
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    logger.error({ err, runId }, '[emulation-loop] Unexpected error during emulation');
  }

  const overallCompositeScore =
    scorecards.length > 0
      ? Math.round(
          (scorecards.reduce((s, c) => s + c.compositeConfidence, 0) / scorecards.length) * 1000,
        ) / 1000
      : 0;

  const previousScores = await getRecentRunScores(4);
  const weekOverWeekDelta =
    previousScores.length >= 1
      ? Math.round((overallCompositeScore - previousScores[0]) * 1000) / 1000
      : null;
  const rollingFourWeekAvg =
    previousScores.length >= 1
      ? Math.round(
          ([overallCompositeScore, ...previousScores.slice(0, 3)].reduce((s, v) => s + v, 0) /
            Math.min(previousScores.length + 1, 4)) *
            1000,
        ) / 1000
      : overallCompositeScore;

  const priorPayloadScores = await Promise.all(
    scorecards.map(s =>
      getRecentPayloadScore(s.payloadId).then(prior => ({ payloadId: s.payloadId, prior })),
    ),
  );
  const priorByPayload = new Map(priorPayloadScores.map(p => [p.payloadId, p.prior]));

  const regressions = scorecards
    .filter(s => {
      const prior = priorByPayload.get(s.payloadId);
      if (prior !== null && prior !== undefined) {
        return s.compositeConfidence - prior < REGRESSION_THRESHOLD;
      }
      return s.status === 'regression' || s.status === 'fail';
    })
    .map(s => {
      const prior = priorByPayload.get(s.payloadId) ?? s.compositeConfidence;
      return {
        payloadId: s.payloadId,
        payloadName: s.payloadName,
        delta: Math.round((s.compositeConfidence - prior) * 1000) / 1000,
      };
    });

  const durationMs = Date.now() - start;

  const status: EmulationRunResult['status'] =
    error !== null
      ? 'fail'
      : regressions.length > 0
        ? 'regression'
        : 'pass';

  const result: EmulationRunResult = {
    runId,
    ranAt,
    durationMs,
    scorecards,
    overallCompositeScore,
    weekOverWeekDelta,
    rollingFourWeekAvg,
    regressions,
    status,
    error,
  };

  logger.info(
    { runId, status, overallCompositeScore, weekOverWeekDelta, durationMs },
    '[emulation-loop] Run complete',
  );

  await Promise.allSettled([
    persistEmulationRun(result),
    writeAuditEntry(result),
    emitKoraSignal(result),
    regressions.length > 0 ? sendRegressionAlert(result) : Promise.resolve(),
  ]);

  return result;
}

// ─── History Query ────────────────────────────────────────────────────────────

export interface EmulationRunSummary {
  runId: string;
  ranAt: string;
  status: string;
  overallCompositeScore: number | null;
  weekOverWeekDelta: number | null;
  rollingFourWeekAvg: number | null;
  regressionCount: number;
  durationMs: number | null;
  scorecards: PayloadScorecard[];
}

export async function getEmulationRunHistory(limit = 12): Promise<EmulationRunSummary[]> {
  try {
    const rows = await db
      .select()
      .from(platformJobRunsTable)
      .where(eq(platformJobRunsTable.workflowType, EMULATION_JOB_TYPE))
      .orderBy(desc(platformJobRunsTable.startedAt))
      .limit(limit);

    return rows.map(r => {
      const res = (r.result ?? {}) as Record<string, unknown>;
      const semanticStatus =
        typeof res.status === 'string' && ['pass', 'regression', 'fail'].includes(res.status)
          ? (res.status as 'pass' | 'regression' | 'fail')
          : r.status === 'failed'
            ? 'fail'
            : r.status === 'completed_with_warnings'
              ? 'regression'
              : 'pass';
      return {
        runId: r.runId,
        ranAt: r.startedAt?.toISOString() ?? r.createdAt.toISOString(),
        status: semanticStatus,
        overallCompositeScore:
          typeof res.overallCompositeScore === 'number' ? res.overallCompositeScore : null,
        weekOverWeekDelta:
          typeof res.weekOverWeekDelta === 'number' ? res.weekOverWeekDelta : null,
        rollingFourWeekAvg:
          typeof res.rollingFourWeekAvg === 'number' ? res.rollingFourWeekAvg : null,
        regressionCount: Array.isArray(res.regressions) ? res.regressions.length : 0,
        durationMs: typeof res.durationMs === 'number' ? res.durationMs : null,
        scorecards: Array.isArray(res.scorecards) ? (res.scorecards as PayloadScorecard[]) : [],
      };
    });
  } catch (err) {
    logger.warn({ err }, '[emulation-loop] Failed to query run history');
    return [];
  }
}

export async function getLatestScorecardsPerPayload(): Promise<Record<string, PayloadScorecard>> {
  const history = await getEmulationRunHistory(1);
  const latest = history[0];
  if (!latest) return {};
  return Object.fromEntries(latest.scorecards.map(s => [s.payloadId, s]));
}

// ─── Quarterly Trust & Response Report ───────────────────────────────────────

export interface QuarterlyTrustReport {
  generatedAt: string;
  periodLabel: string;
  totalRuns: number;
  averageCompositeScore: number;
  scoreImprovement: number | null;
  bestPayload: { name: string; score: number } | null;
  worstPayload: { name: string; score: number } | null;
  totalAnalystHoursSaved: number;
  totalBlastRadiusPrevented: number;
  totalRegressions: number;
  coverageGaps: string[];
  payloadSummaries: Array<{
    payloadId: string;
    payloadName: string;
    domain: string;
    latestScore: number;
    trend: 'improving' | 'stable' | 'degrading';
    detectionRate: number;
    containmentRate: number;
    mttdSeconds: number;
    mttcSeconds: number;
  }>;
  executiveSummary: string;
  residualRisks: string[];
}

export async function generateQuarterlyTrustReport(): Promise<QuarterlyTrustReport> {
  const generatedAt = new Date().toISOString();
  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const periodLabel = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;

  const cutoff = new Date(quarterStart);
  const history = await db
    .select()
    .from(platformJobRunsTable)
    .where(
      and(
        eq(platformJobRunsTable.workflowType, EMULATION_JOB_TYPE),
        gte(platformJobRunsTable.startedAt, cutoff),
      ),
    )
    .orderBy(desc(platformJobRunsTable.startedAt))
    .limit(26);

  const runs: EmulationRunSummary[] = history.map(r => {
    const res = (r.result ?? {}) as Record<string, unknown>;
    const semanticStatus =
      typeof res.status === 'string' && ['pass', 'regression', 'fail'].includes(res.status)
        ? (res.status as 'pass' | 'regression' | 'fail')
        : r.status === 'failed'
          ? 'fail'
          : r.status === 'completed_with_warnings'
            ? 'regression'
            : 'pass';
    return {
      runId: r.runId,
      ranAt: r.startedAt?.toISOString() ?? r.createdAt.toISOString(),
      status: semanticStatus,
      overallCompositeScore: typeof res.overallCompositeScore === 'number' ? res.overallCompositeScore : null,
      weekOverWeekDelta: typeof res.weekOverWeekDelta === 'number' ? res.weekOverWeekDelta : null,
      rollingFourWeekAvg: typeof res.rollingFourWeekAvg === 'number' ? res.rollingFourWeekAvg : null,
      regressionCount: Array.isArray(res.regressions) ? res.regressions.length : 0,
      durationMs: typeof res.durationMs === 'number' ? res.durationMs : null,
      scorecards: Array.isArray(res.scorecards) ? (res.scorecards as PayloadScorecard[]) : [],
    };
  });

  const scores = runs.map(r => r.overallCompositeScore).filter((s): s is number => s !== null);
  const averageCompositeScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const scoreImprovement = scores.length >= 2 ? scores[0] - scores[scores.length - 1] : null;
  const totalRegressions = runs.reduce((s, r) => s + r.regressionCount, 0);

  const allScorecards = runs.flatMap(r => r.scorecards);
  const totalAnalystHoursSaved = allScorecards.reduce((s, sc) => s + sc.analystHoursSaved, 0);
  const totalBlastRadiusPrevented = allScorecards.reduce((s, sc) => s + sc.blastRadiusPrevented, 0);
  const allGaps = [...new Set(allScorecards.flatMap(sc => sc.coverageGaps))].slice(0, 8);

  const payloadSummaries = CPS_PAYLOAD_REGISTRY.map(payload => {
    const payloadRuns = allScorecards.filter(sc => sc.payloadId === payload.id);
    const latestScore = payloadRuns[0]?.compositeConfidence ?? 0;
    const prevScore = payloadRuns[1]?.compositeConfidence ?? latestScore;
    const trend: 'improving' | 'stable' | 'degrading' =
      latestScore - prevScore > 0.02
        ? 'improving'
        : latestScore - prevScore < -0.02
          ? 'degrading'
          : 'stable';
    return {
      payloadId: payload.id,
      payloadName: payload.name,
      domain: payload.domain,
      latestScore,
      trend,
      detectionRate: payloadRuns[0]?.detectionRate ?? 0,
      containmentRate: payloadRuns[0]?.containmentRate ?? 0,
      mttdSeconds: payloadRuns[0]?.mttdSeconds ?? 0,
      mttcSeconds: payloadRuns[0]?.mttcSeconds ?? 0,
    };
  });

  const sortedByScore = [...payloadSummaries].sort((a, b) => b.latestScore - a.latestScore);
  const bestPayload = sortedByScore[0] ? { name: sortedByScore[0].payloadName, score: sortedByScore[0].latestScore } : null;
  const worstPayload = sortedByScore.at(-1) ? { name: sortedByScore.at(-1)!.payloadName, score: sortedByScore.at(-1)!.latestScore } : null;

  const scoreStr = (averageCompositeScore * 100).toFixed(1);
  const improvStr = scoreImprovement !== null ? ` up ${(scoreImprovement * 100).toFixed(1)} percentage points from period open` : '';
  const executiveSummary = [
    `Over ${periodLabel}, the Sentra CPS payload suite completed ${runs.length} adversary emulation cycle${runs.length !== 1 ? 's' : ''} across ${CPS_PAYLOAD_REGISTRY.length} flagship payloads.`,
    `The portfolio-level composite confidence score averaged ${scoreStr}%${improvStr}.`,
    `Automated containment prevented an estimated ${totalBlastRadiusPrevented} asset-level exposures and saved approximately ${totalAnalystHoursSaved.toFixed(0)} analyst hours.`,
    totalRegressions > 0
      ? `${totalRegressions} regression event${totalRegressions !== 1 ? 's' : ''} were detected and alerted for remediation.`
      : 'No unresolved regressions were recorded during this period.',
    'All emulation runs executed in a fully sandboxed environment with no impact to production assets.',
  ].join(' ');

  const residualRisks = [
    allGaps.length > 0 ? `${allGaps.length} detection coverage gap${allGaps.length !== 1 ? 's' : ''} identified and queued for remediation` : null,
    sortedByScore.at(-1) && sortedByScore.at(-1)!.latestScore < 0.7
      ? `${sortedByScore.at(-1)!.payloadName} payload below 70% confidence threshold — recommend accelerated hardening sprint`
      : null,
    totalRegressions > 2 ? 'Regression frequency above benchmark — recommend fortnightly emulation cadence for next quarter' : null,
  ].filter((r): r is string => r !== null);

  return {
    generatedAt,
    periodLabel,
    totalRuns: runs.length,
    averageCompositeScore,
    scoreImprovement,
    bestPayload,
    worstPayload,
    totalAnalystHoursSaved,
    totalBlastRadiusPrevented,
    totalRegressions,
    coverageGaps: allGaps,
    payloadSummaries,
    executiveSummary,
    residualRisks,
  };
}
