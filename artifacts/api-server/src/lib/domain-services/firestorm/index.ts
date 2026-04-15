import { domainEventBus } from "../../domain-events/index.js";

// ─── Port Interfaces ───────────────────────────────────────────────────────────

export interface FirestormStoragePort {
  listAssessments(args: { limit: number; offset: number }): Promise<unknown[]>;
  getAssessment(id: number): Promise<unknown | null>;
  listFindings(args: { assessmentId?: number; severity?: string; limit: number; offset: number }): Promise<unknown[]>;
  listIncidents(args: { status?: string; severity?: string; limit: number; offset: number }): Promise<unknown[]>;
  getIncident(id: number): Promise<unknown | null>;
  updateIncident(id: number, data: { status: string }): Promise<unknown>;
  listAssets(args: { limit: number; offset: number }): Promise<unknown[]>;
}

// ─── MITRE ATT&CK Classification ─────────────────────────────────────────────

export interface MitreTactic {
  id: string;
  name: string;
  technique?: string;
  subtechnique?: string;
}

export function classifyMitreTactic(finding: {
  affectedAsset?: string | null;
  recommendation?: string | null;
  severity?: string | null;
}): MitreTactic | null {
  const description = [finding.affectedAsset, finding.recommendation].join(" ").toLowerCase();

  if (description.includes("credential") || description.includes("password") || description.includes("login")) {
    return { id: "TA0006", name: "Credential Access", technique: "T1078", subtechnique: "Valid Accounts" };
  }
  if (description.includes("lateral") || description.includes("pivot") || description.includes("movement")) {
    return { id: "TA0008", name: "Lateral Movement", technique: "T1021" };
  }
  if (description.includes("exfiltrat") || description.includes("data theft") || description.includes("exfil")) {
    return { id: "TA0010", name: "Exfiltration", technique: "T1041" };
  }
  if (description.includes("persist") || description.includes("backdoor") || description.includes("scheduled task")) {
    return { id: "TA0003", name: "Persistence", technique: "T1053" };
  }
  if (description.includes("escalat") || description.includes("privilege") || description.includes("admin")) {
    return { id: "TA0004", name: "Privilege Escalation", technique: "T1078" };
  }
  if (description.includes("command") && description.includes("control")) {
    return { id: "TA0011", name: "Command and Control", technique: "T1071" };
  }
  if (finding.severity === "critical") {
    return { id: "TA0001", name: "Initial Access", technique: "T1190", subtechnique: "Exploit Public-Facing Application" };
  }
  return null;
}

// ─── CVSS Scoring ─────────────────────────────────────────────────────────────

export interface CvssScore {
  base: number;
  severity: "Critical" | "High" | "Medium" | "Low" | "None";
  vector: string;
}

export function calculateCvssScore(params: {
  severity?: string | null;
  exposureLevel?: string | null;
  hasInternetExposure?: boolean;
}): CvssScore {
  let base = 5.0;

  if (params.severity === "critical") base = 9.1;
  else if (params.severity === "high") base = 7.5;
  else if (params.severity === "medium") base = 5.0;
  else if (params.severity === "low") base = 2.5;

  if (params.hasInternetExposure) base = Math.min(base + 1.0, 10.0);
  if (params.exposureLevel === "public") base = Math.min(base + 0.5, 10.0);

  const severity: CvssScore["severity"] =
    base >= 9.0 ? "Critical" :
    base >= 7.0 ? "High" :
    base >= 4.0 ? "Medium" :
    base > 0 ? "Low" : "None";

  const vector = `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`;

  return { base, severity, vector };
}

// ─── Incident Response Generation ────────────────────────────────────────────

export function generateIncidentResponse(incident: {
  title?: string | null;
  severity?: string | null;
  status?: string | null;
}): string[] {
  const steps: string[] = [];

  steps.push("1. Confirm incident scope and affected systems");

  if (incident.severity === "critical") {
    steps.push("2. Immediately isolate affected systems from network");
    steps.push("3. Notify CISO and executive leadership");
    steps.push("4. Engage incident response retainer");
  } else if (incident.severity === "high") {
    steps.push("2. Contain the threat by restricting network access");
    steps.push("3. Notify security team lead");
  } else {
    steps.push("2. Monitor for escalation");
    steps.push("3. Document findings in incident log");
  }

  steps.push("4. Preserve forensic evidence and chain of custody");
  steps.push("5. Begin root cause analysis");
  steps.push("6. Document timeline and affected assets");
  steps.push("7. Prepare stakeholder communication");
  steps.push("8. Schedule post-incident review");

  return steps;
}

// ─── Domain Service Functions ─────────────────────────────────────────────────

export async function listFirestormAssessments(storage: FirestormStoragePort, args: { limit?: number; offset?: number }) {
  return storage.listAssessments({ limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function getFirestormAssessment(storage: FirestormStoragePort, id: number) {
  return storage.getAssessment(id);
}

export async function listFirestormFindings(storage: FirestormStoragePort, args: { assessmentId?: number; severity?: string; limit?: number; offset?: number }) {
  return storage.listFindings({ assessmentId: args.assessmentId, severity: args.severity, limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function listFirestormIncidents(storage: FirestormStoragePort, args: { status?: string; severity?: string; limit?: number; offset?: number }) {
  return storage.listIncidents({ status: args.status, severity: args.severity, limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function getFirestormIncident(storage: FirestormStoragePort, id: number) {
  return storage.getIncident(id);
}

export async function updateFirestormIncident(
  storage: FirestormStoragePort,
  id: number,
  status: string,
) {
  const incident = await storage.getIncident(id) as Record<string, unknown> | null;
  const previousStatus = incident?.status as string ?? "unknown";

  const updated = await storage.updateIncident(id, { status }) as Record<string, unknown>;

  domainEventBus.publish("firestorm.incident-updated", {
    incidentId: id,
    previousStatus,
    newStatus: status,
    severity: updated.severity as string | null,
  });

  if (status === "escalated" || (updated.severity === "critical" && previousStatus !== "critical")) {
    domainEventBus.publish("firestorm.incident-escalated", {
      incidentId: id,
      title: updated.title as string,
      severity: updated.severity as string | null,
    });
  }

  return updated;
}

export async function listFirestormAssets(storage: FirestormStoragePort, args: { limit?: number; offset?: number }) {
  return storage.listAssets({ limit: args.limit ?? 50, offset: args.offset ?? 0 });
}
