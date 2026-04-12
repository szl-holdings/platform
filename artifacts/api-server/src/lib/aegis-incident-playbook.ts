import { logger } from "./logger";
import { pool } from "@szl-holdings/db";
import { getRecentCriticalCves } from "./nvd-cve-ingestion";
import { emitDomainEvent } from "./mastra/event-triggers";
import { publish, WS_CHANNELS } from "./websocket";
import { sendPushToApp } from "./expo-push";

export interface IncidentPlaybookResult {
  incidentId: string;
  severity: string;
  cveId?: string;
  githubIssueUrl?: string;
  githubIssueNumber?: number;
  complianceScoreUpdated: boolean;
  notificationSent: boolean;
  playbookSteps: PlaybookStep[];
}

export interface PlaybookStep {
  step: string;
  status: "completed" | "failed" | "skipped";
  details?: string;
  timestamp: string;
}

async function ensureIncidentTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS aegis_incident_playbook_runs (
      id BIGSERIAL PRIMARY KEY,
      incident_id TEXT NOT NULL UNIQUE,
      cve_id TEXT,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      github_issue_url TEXT,
      github_issue_number INTEGER,
      compliance_score_delta NUMERIC(4,1),
      playbook_steps JSONB DEFAULT '[]',
      triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_aegis_playbook_severity ON aegis_incident_playbook_runs(severity);
    CREATE INDEX IF NOT EXISTS idx_aegis_playbook_triggered ON aegis_incident_playbook_runs(triggered_at DESC);
  `);
}

async function updateComplianceScore(severity: string): Promise<{ updated: boolean; delta: number }> {
  const delta = severity === "critical" ? -5 : severity === "high" ? -2 : -1;

  try {
    await pool.query(`
      INSERT INTO aegis_compliance_scores (domain, score, last_updated)
      VALUES ('overall', 85 + $1, NOW())
      ON CONFLICT (domain) DO UPDATE SET
        score = GREATEST(0, LEAST(100, aegis_compliance_scores.score + $1)),
        last_updated = NOW()
    `, [delta]);
    return { updated: true, delta };
  } catch {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS aegis_compliance_scores (
          id BIGSERIAL PRIMARY KEY,
          domain TEXT NOT NULL UNIQUE,
          score NUMERIC(5,1) NOT NULL DEFAULT 85,
          last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(`
        INSERT INTO aegis_compliance_scores (domain, score, last_updated)
        VALUES ('overall', ${85 + delta}, NOW())
        ON CONFLICT (domain) DO UPDATE SET
          score = GREATEST(0, LEAST(100, aegis_compliance_scores.score + $1)),
          last_updated = NOW()
      `, [delta]);
      return { updated: true, delta };
    } catch (err) {
      logger.warn({ err }, "Failed to update compliance score");
      return { updated: false, delta };
    }
  }
}

async function createGitHubIssue(params: {
  title: string;
  body: string;
  labels: string[];
}): Promise<{ url?: string; number?: number; error?: string }> {
  const repoOwner = process.env["AEGIS_GITHUB_OWNER"];
  const repoName = process.env["AEGIS_GITHUB_REPO"];
  const token = process.env["GITHUB_TOKEN"];

  if (!repoOwner || !repoName || !token) {
    logger.debug("GitHub repo/token not configured for Aegis — skipping issue creation");
    return { error: "GitHub repository not configured (AEGIS_GITHUB_OWNER / AEGIS_GITHUB_REPO / GITHUB_TOKEN not set)" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "SZL-Aegis/1.0",
      },
      body: JSON.stringify({ title: params.title, body: params.body, labels: params.labels }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      logger.warn({ status: res.status, body: errText }, "GitHub issue creation failed");
      return { error: `GitHub API error ${res.status}: ${errText.slice(0, 200)}` };
    }

    const issue = (await res.json()) as { html_url: string; number: number };
    return { url: issue.html_url, number: issue.number };
  } catch (err) {
    logger.warn({ err }, "Failed to create GitHub issue");
    return { error: err instanceof Error ? err.message : "Unknown error" };
  } finally {
    clearTimeout(timer);
  }
}

export async function runIncidentResponsePlaybook(params: {
  cveId?: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium";
  cvssScore?: number;
  affectedSystems?: string[];
  source?: string;
}): Promise<IncidentPlaybookResult> {
  await ensureIncidentTable();

  const incidentId = `aegis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const steps: PlaybookStep[] = [];
  const timestamp = () => new Date().toISOString();

  logger.info({ incidentId, severity: params.severity, cveId: params.cveId }, "Aegis incident playbook started");

  let githubIssueUrl: string | undefined;
  let githubIssueNumber: number | undefined;

  const issueBody = [
    `## Aegis Incident Report`,
    ``,
    `**Incident ID:** ${incidentId}`,
    `**Severity:** ${params.severity.toUpperCase()}`,
    params.cveId ? `**CVE ID:** ${params.cveId}` : null,
    params.cvssScore ? `**CVSS Score:** ${params.cvssScore}` : null,
    `**Source:** ${params.source ?? "Aegis Automated Detection"}`,
    `**Detected At:** ${new Date().toISOString()}`,
    ``,
    `## Description`,
    ``,
    params.description,
    ``,
    params.affectedSystems && params.affectedSystems.length > 0 ? [
      `## Affected Systems`,
      ``,
      params.affectedSystems.map(s => `- ${s}`).join("\n"),
      ``,
    ].join("\n") : null,
    `## Response Checklist`,
    ``,
    `- [ ] Confirm vulnerability scope and affected assets`,
    `- [ ] Apply available patches or mitigations`,
    `- [ ] Verify compensating controls are in place`,
    `- [ ] Notify affected system owners`,
    `- [ ] Update compliance posture documentation`,
    `- [ ] Schedule post-incident review`,
    ``,
    `*Auto-generated by Aegis Incident Response Playbook*`,
  ].filter(Boolean).join("\n");

  const labels = [
    "security",
    `severity:${params.severity}`,
    params.cveId ? "cve" : "incident",
    "aegis",
  ].filter(Boolean);

  const issueResult = await createGitHubIssue({
    title: `[Aegis ${params.severity.toUpperCase()}] ${params.title}`,
    body: issueBody,
    labels,
  });

  if (issueResult.url) {
    githubIssueUrl = issueResult.url;
    githubIssueNumber = issueResult.number;
    steps.push({ step: "Create GitHub issue", status: "completed", details: `Issue #${githubIssueNumber}: ${issueResult.url}`, timestamp: timestamp() });
  } else {
    steps.push({ step: "Create GitHub issue", status: "skipped", details: issueResult.error, timestamp: timestamp() });
  }

  const { updated: complianceUpdated, delta } = await updateComplianceScore(params.severity);
  steps.push({
    step: "Update compliance score",
    status: complianceUpdated ? "completed" : "failed",
    details: complianceUpdated ? `Score adjusted by ${delta} points` : "Failed to update",
    timestamp: timestamp(),
  });

  await emitDomainEvent("new_threat_detected", {
    incidentId,
    cveId: params.cveId,
    title: params.title,
    severity: params.severity,
    cvssScore: params.cvssScore,
    source: params.source,
    githubIssueUrl,
    detectedAt: new Date().toISOString(),
  }, "aegis-playbook").catch(() => {});

  steps.push({ step: "Emit domain event", status: "completed", details: "new_threat_detected event emitted", timestamp: timestamp() });

  const notificationPayload = {
    incidentId,
    severity: params.severity,
    cveId: params.cveId,
    title: params.title,
    description: params.description.slice(0, 500),
    source: params.source,
    cvssScore: params.cvssScore,
    githubIssueUrl,
    detectedAt: new Date().toISOString(),
  };

  let notificationSent = false;
  const notificationChannels: string[] = [];
  try {
    publish(WS_CHANNELS.AEGIS_INCIDENTS, "incident_created", notificationPayload);
    publish(WS_CHANNELS.NOTIFICATIONS, "critical_alert", {
      domain: "aegis",
      type: "incident",
      ...notificationPayload,
    });
    notificationChannels.push("websocket:aegis-incidents", "websocket:notifications");

    const pushResult = await sendPushToApp("aegis", {
      title: `[${params.severity.toUpperCase()}] Security Alert`,
      body: `${params.title.slice(0, 100)} — Immediate response required`,
      data: {
        type: "aegis_incident",
        incidentId,
        severity: params.severity,
        cveId: params.cveId,
        githubIssueUrl,
      },
      sound: "default",
    }).catch(() => ({ sent: 0, failed: 0 }));

    if (pushResult.sent > 0) {
      notificationChannels.push(`push:aegis(${pushResult.sent} devices)`);
    }

    notificationSent = true;
    steps.push({
      step: "Notify on-call channels",
      status: "completed",
      details: `Alert dispatched to: ${notificationChannels.join(", ")}`,
      timestamp: timestamp(),
    });
  } catch (err) {
    logger.warn({ err, incidentId }, "On-call notification dispatch failed");
    steps.push({ step: "Notify on-call channels", status: "failed", details: err instanceof Error ? err.message : "Dispatch error", timestamp: timestamp() });
  }

  try {
    await pool.query(
      `INSERT INTO aegis_incident_playbook_runs
       (incident_id, cve_id, severity, title, github_issue_url, github_issue_number,
        compliance_score_delta, playbook_steps, triggered_at, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
       ON CONFLICT (incident_id) DO NOTHING`,
      [
        incidentId,
        params.cveId ?? null,
        params.severity,
        params.title,
        githubIssueUrl ?? null,
        githubIssueNumber ?? null,
        delta,
        JSON.stringify(steps),
      ]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to persist playbook run");
  }

  logger.info({ incidentId, steps: steps.length, githubIssueUrl, notificationSent }, "Aegis incident playbook completed");

  return {
    incidentId,
    severity: params.severity,
    cveId: params.cveId,
    githubIssueUrl,
    githubIssueNumber,
    complianceScoreUpdated: complianceUpdated,
    notificationSent,
    playbookSteps: steps,
  };
}

export async function runCveIncidentCheck(): Promise<{
  cvesChecked: number;
  playbooksTriggered: number;
  demoMode: boolean;
}> {
  const recentCritical = await getRecentCriticalCves(5);

  if (recentCritical.length === 0) {
    logger.info("CVE incident check: no recent critical CVEs found");
    return { cvesChecked: 0, playbooksTriggered: 0, demoMode: true };
  }

  let playbooksTriggered = 0;

  for (const cve of recentCritical.slice(0, 3)) {
    if (cve.severity !== "critical") continue;

    const existing = await pool.query(
      `SELECT id FROM aegis_incident_playbook_runs WHERE cve_id = $1`,
      [cve.cveId]
    ).catch(() => ({ rows: [] }));

    if (existing.rows.length > 0) continue;

    await runIncidentResponsePlaybook({
      cveId: cve.cveId,
      title: `${cve.cveId}: ${cve.description.slice(0, 100)}`,
      description: cve.description,
      severity: "critical",
      cvssScore: cve.cvssScore ?? undefined,
      source: "NVD CVE Feed",
      affectedSystems: [],
    });

    playbooksTriggered++;
    await new Promise(r => setTimeout(r, 500));
  }

  return { cvesChecked: recentCritical.length, playbooksTriggered, demoMode: false };
}
