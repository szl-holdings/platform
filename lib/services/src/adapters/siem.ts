import { ServiceAdapter } from "../base.js";

export type SiemSourceFormat = "splunk_hec" | "microsoft_sentinel" | "cef" | "syslog" | "generic";

export interface NormalizedSiemEvent {
  id: string;
  source: SiemSourceFormat;
  rawFormat: string;
  timestamp: string;
  severity: "informational" | "low" | "medium" | "high" | "critical";
  sourceIp: string | null;
  destinationIp: string | null;
  sourcePort: number | null;
  destinationPort: number | null;
  protocol: string | null;
  action: string | null;
  outcome: "success" | "failure" | "unknown";
  user: string | null;
  hostname: string | null;
  process: string | null;
  message: string;
  category: string;
  tags: string[];
  mitreTactic: string | null;
  mitreTechnique: string | null;
  correlationId: string | null;
  rawPayload: Record<string, unknown>;
  ingestedAt: string;
}

export interface SiemCorrelationRule {
  id: string;
  name: string;
  description: string;
  pattern: {
    minEvents: number;
    windowMinutes: number;
    conditions: Array<{ field: string; operator: "eq" | "contains" | "regex"; value: string }>;
  };
  severity: NormalizedSiemEvent["severity"];
  mitreTactic: string | null;
  mitreTechnique: string | null;
  enabled: boolean;
}

export interface SiemCorrelatedAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: NormalizedSiemEvent["severity"];
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
  sourceIps: string[];
  mitreTactic: string | null;
  mitreTechnique: string | null;
  summary: string;
  events: NormalizedSiemEvent[];
  sentinelAgentFed: boolean;
}

export interface SiemIngestionResult {
  accepted: number;
  rejected: number;
  events: NormalizedSiemEvent[];
  correlatedAlerts: SiemCorrelatedAlert[];
}

export interface SiemConnectionStatus {
  connected: boolean;
  source?: string;
  endpoint?: string;
}

const CEF_FIELD_MAP: Record<string, string> = {
  src: "sourceIp",
  dst: "destinationIp",
  spt: "sourcePort",
  dpt: "destinationPort",
  proto: "protocol",
  act: "action",
  outcome: "outcome",
  suser: "user",
  dhost: "hostname",
  app: "process",
  msg: "message",
  cat: "category",
};

const MITRE_TACTIC_MAP: Record<string, { tactic: string; technique: string }> = {
  "brute_force": { tactic: "TA0006 — Credential Access", technique: "T1110 — Brute Force" },
  "lateral_movement": { tactic: "TA0008 — Lateral Movement", technique: "T1021 — Remote Services" },
  "privilege_escalation": { tactic: "TA0004 — Privilege Escalation", technique: "T1068 — Exploitation for Privilege Escalation" },
  "exfiltration": { tactic: "TA0010 — Exfiltration", technique: "T1041 — Exfiltration Over C2 Channel" },
  "initial_access": { tactic: "TA0001 — Initial Access", technique: "T1190 — Exploit Public-Facing Application" },
  "execution": { tactic: "TA0002 — Execution", technique: "T1059 — Command and Scripting Interpreter" },
  "persistence": { tactic: "TA0003 — Persistence", technique: "T1078 — Valid Accounts" },
  "defense_evasion": { tactic: "TA0005 — Defense Evasion", technique: "T1055 — Process Injection" },
  "discovery": { tactic: "TA0007 — Discovery", technique: "T1082 — System Information Discovery" },
  "collection": { tactic: "TA0009 — Collection", technique: "T1005 — Data from Local System" },
  "command_and_control": { tactic: "TA0011 — Command and Control", technique: "T1071 — Application Layer Protocol" },
  "impact": { tactic: "TA0040 — Impact", technique: "T1486 — Data Encrypted for Impact" },
};

const BUILT_IN_RULES: SiemCorrelationRule[] = [
  {
    id: "rule_brute_force",
    name: "Brute Force Detection",
    description: "Multiple failed authentication attempts from a single source IP",
    pattern: {
      minEvents: 5,
      windowMinutes: 5,
      conditions: [
        { field: "category", operator: "contains", value: "authentication" },
        { field: "outcome", operator: "eq", value: "failure" },
      ],
    },
    severity: "high",
    mitreTactic: "TA0006 — Credential Access",
    mitreTechnique: "T1110 — Brute Force",
    enabled: true,
  },
  {
    id: "rule_port_scan",
    name: "Port Scan Detection",
    description: "Single source IP connecting to multiple destination ports in short window",
    pattern: {
      minEvents: 10,
      windowMinutes: 2,
      conditions: [
        { field: "category", operator: "contains", value: "network" },
      ],
    },
    severity: "medium",
    mitreTactic: "TA0007 — Discovery",
    mitreTechnique: "T1046 — Network Service Discovery",
    enabled: true,
  },
  {
    id: "rule_privilege_escalation",
    name: "Privilege Escalation Attempt",
    description: "User account attempting to elevate privileges",
    pattern: {
      minEvents: 1,
      windowMinutes: 1,
      conditions: [
        { field: "category", operator: "contains", value: "privilege" },
      ],
    },
    severity: "critical",
    mitreTactic: "TA0004 — Privilege Escalation",
    mitreTechnique: "T1068 — Exploitation for Privilege Escalation",
    enabled: true,
  },
  {
    id: "rule_data_exfiltration",
    name: "Data Exfiltration Indicator",
    description: "Large outbound data transfer to external IP",
    pattern: {
      minEvents: 1,
      windowMinutes: 10,
      conditions: [
        { field: "category", operator: "contains", value: "exfiltration" },
      ],
    },
    severity: "critical",
    mitreTactic: "TA0010 — Exfiltration",
    mitreTechnique: "T1041 — Exfiltration Over C2 Channel",
    enabled: true,
  },
];

function parseCefEvent(cefLine: string): Partial<NormalizedSiemEvent> {
  const parts = cefLine.split("|");
  if (parts.length < 8) return { message: cefLine };

  const severity = parseInt(parts[6] ?? "0", 10);
  const severityMap: Array<NormalizedSiemEvent["severity"]> = [
    "informational", "low", "low", "medium", "medium",
    "medium", "high", "high", "critical", "critical", "critical",
  ];

  const extensionStr = parts.slice(7).join("|");
  const extFields: Record<string, string> = {};
  const extPattern = /(\w+)=([^=]+?)(?=\s+\w+=|$)/g;
  let match;
  while ((match = extPattern.exec(extensionStr)) !== null) {
    extFields[match[1]!] = match[2]!.trim();
  }

  return {
    severity: severityMap[Math.min(severity, 10)] ?? "medium",
    message: parts[7] ?? cefLine,
    category: parts[5] ?? "security",
    sourceIp: extFields["src"] ?? null,
    destinationIp: extFields["dst"] ?? null,
    sourcePort: extFields["spt"] ? parseInt(extFields["spt"], 10) : null,
    destinationPort: extFields["dpt"] ? parseInt(extFields["dpt"], 10) : null,
    protocol: extFields["proto"] ?? null,
    action: extFields["act"] ?? null,
    user: extFields["suser"] ?? extFields["duser"] ?? null,
    hostname: extFields["dhost"] ?? extFields["shost"] ?? null,
    process: extFields["app"] ?? null,
    rawPayload: extFields as Record<string, unknown>,
  };
}

function parseSyslogEvent(syslogLine: string): Partial<NormalizedSiemEvent> {
  const severityPattern = /^\<(\d+)\>/;
  const priMatch = severityPattern.exec(syslogLine);
  const pri = priMatch ? parseInt(priMatch[1]!, 10) : 14;
  const facility = Math.floor(pri / 8);
  const syslogSeverity = pri % 8;

  const severityMap: Array<NormalizedSiemEvent["severity"]> = [
    "critical", "critical", "critical", "high",
    "medium", "medium", "low", "informational",
  ];

  return {
    severity: severityMap[Math.min(syslogSeverity, 7)] ?? "informational",
    message: syslogLine.replace(severityPattern, "").trim(),
    category: facility === 4 || facility === 10 ? "authentication" : "system",
    rawPayload: { raw: syslogLine, facility, severity: syslogSeverity },
  };
}

function inferMitreMapping(event: Partial<NormalizedSiemEvent>): { tactic: string; technique: string } | null {
  const msg = (event.message ?? "").toLowerCase();
  const cat = (event.category ?? "").toLowerCase();

  for (const [keyword, mapping] of Object.entries(MITRE_TACTIC_MAP)) {
    if (msg.includes(keyword) || cat.includes(keyword)) {
      return mapping;
    }
  }

  if (msg.includes("fail") && cat.includes("auth")) {
    return MITRE_TACTIC_MAP["brute_force"]!;
  }
  if (msg.includes("sudo") || msg.includes("privilege") || msg.includes("escalat")) {
    return MITRE_TACTIC_MAP["privilege_escalation"]!;
  }
  if (msg.includes("scan") || msg.includes("probe")) {
    return MITRE_TACTIC_MAP["discovery"]!;
  }

  return null;
}

export class SiemAdapter extends ServiceAdapter {
  readonly name = "siem";
  readonly description = "SIEM integration layer — normalized ingestion from Splunk HEC, Microsoft Sentinel, CEF/syslog, and event correlation engine with MITRE ATT&CK mapping";
  readonly requiredEnvVars: string[] = [];

  private readonly eventBuffer: NormalizedSiemEvent[] = [];
  private readonly correlatedAlerts: SiemCorrelatedAlert[] = [];
  private readonly correlationRules: SiemCorrelationRule[] = [...BUILT_IN_RULES];
  private readonly MAX_BUFFER = 10_000;

  override get status(): import("../base.js").ServiceStatus {
    return "LIVE_CONFIGURED";
  }

  override get supportsMockMode(): boolean {
    return true;
  }

  protected override async performHealthCheck(): Promise<void> {
    // SIEM adapter is always ready — it is an inbound receiver
  }

  ingestSplunkHec(body: Record<string, unknown> | Array<Record<string, unknown>>): SiemIngestionResult {
    const events = Array.isArray(body) ? body : [body];
    const normalized: NormalizedSiemEvent[] = [];
    let rejected = 0;

    for (const raw of events) {
      try {
        const eventData = raw["event"] as Record<string, unknown> ?? raw;
        const time = raw["time"] as number | undefined;
        const timestamp = time ? new Date(time * 1000).toISOString() : new Date().toISOString();

        const severity = this.mapSplunkSeverity(
          (eventData["severity"] as string) ?? (eventData["level"] as string) ?? "informational",
        );

        const partial: Partial<NormalizedSiemEvent> = {
          severity,
          timestamp,
          sourceIp: (eventData["src"] as string) ?? (eventData["src_ip"] as string) ?? null,
          destinationIp: (eventData["dest"] as string) ?? (eventData["dest_ip"] as string) ?? null,
          sourcePort: eventData["src_port"] ? parseInt(String(eventData["src_port"]), 10) : null,
          destinationPort: eventData["dest_port"] ? parseInt(String(eventData["dest_port"]), 10) : null,
          protocol: (eventData["protocol"] as string) ?? null,
          action: (eventData["action"] as string) ?? null,
          outcome: this.mapOutcome((eventData["result"] as string) ?? (eventData["outcome"] as string)),
          user: (eventData["user"] as string) ?? (eventData["src_user"] as string) ?? null,
          hostname: (eventData["host"] as string) ?? (raw["host"] as string) ?? null,
          process: (eventData["process"] as string) ?? null,
          message: (eventData["message"] as string) ?? (eventData["msg"] as string) ?? JSON.stringify(eventData),
          category: (raw["sourcetype"] as string) ?? (eventData["category"] as string) ?? "security",
          rawPayload: raw,
        };

        const mitreMapping = inferMitreMapping(partial);
        partial.mitreTactic = mitreMapping?.tactic ?? null;
        partial.mitreTechnique = mitreMapping?.technique ?? null;

        normalized.push(this.buildEvent("splunk_hec", partial));
      } catch {
        rejected++;
      }
    }

    return this.finalizeIngestion("splunk_hec", normalized, rejected);
  }

  ingestMicrosoftSentinel(alerts: Array<Record<string, unknown>>): SiemIngestionResult {
    const normalized: NormalizedSiemEvent[] = [];
    let rejected = 0;

    for (const alert of alerts) {
      try {
        const entities = (alert["Entities"] as Array<Record<string, unknown>>) ?? [];
        const ipEntity = entities.find((e) => e["Type"] === "ip");
        const accountEntity = entities.find((e) => e["Type"] === "account");

        const severityStr = (alert["Severity"] as string) ?? "Informational";
        const severity = this.mapSentinelSeverity(severityStr);

        const partial: Partial<NormalizedSiemEvent> = {
          severity,
          timestamp: (alert["TimeGenerated"] as string) ?? new Date().toISOString(),
          sourceIp: (ipEntity?.["Address"] as string) ?? null,
          destinationIp: null,
          sourcePort: null,
          destinationPort: null,
          protocol: null,
          action: (alert["AlertName"] as string) ?? null,
          outcome: "unknown",
          user: (accountEntity?.["Name"] as string) ?? null,
          hostname: (alert["CompromisedEntity"] as string) ?? null,
          process: null,
          message: (alert["Description"] as string) ?? (alert["AlertName"] as string) ?? "",
          category: (alert["ProductName"] as string) ?? "microsoft_sentinel",
          tags: [(alert["AlertType"] as string) ?? "sentinel"].filter(Boolean),
          correlationId: (alert["SystemAlertId"] as string) ?? null,
          rawPayload: alert,
        };

        const mitreMapping = inferMitreMapping(partial);
        partial.mitreTactic = (alert["Tactics"] as string) ?? mitreMapping?.tactic ?? null;
        partial.mitreTechnique = (alert["Techniques"] as string) ?? mitreMapping?.technique ?? null;

        normalized.push(this.buildEvent("microsoft_sentinel", partial));
      } catch {
        rejected++;
      }
    }

    return this.finalizeIngestion("microsoft_sentinel", normalized, rejected);
  }

  ingestCef(lines: string[]): SiemIngestionResult {
    const normalized: NormalizedSiemEvent[] = [];
    let rejected = 0;

    for (const line of lines) {
      try {
        if (!line.trim() || !line.startsWith("CEF:")) {
          rejected++;
          continue;
        }
        const partial = parseCefEvent(line);
        partial.timestamp = partial.timestamp ?? new Date().toISOString();
        const mitreMapping = inferMitreMapping(partial);
        partial.mitreTactic = mitreMapping?.tactic ?? null;
        partial.mitreTechnique = mitreMapping?.technique ?? null;
        normalized.push(this.buildEvent("cef", partial));
      } catch {
        rejected++;
      }
    }

    return this.finalizeIngestion("cef", normalized, rejected);
  }

  ingestSyslog(lines: string[]): SiemIngestionResult {
    const normalized: NormalizedSiemEvent[] = [];
    let rejected = 0;

    for (const line of lines) {
      try {
        if (!line.trim()) {
          rejected++;
          continue;
        }
        const partial = parseSyslogEvent(line);
        partial.timestamp = partial.timestamp ?? new Date().toISOString();
        const mitreMapping = inferMitreMapping(partial);
        partial.mitreTactic = mitreMapping?.tactic ?? null;
        partial.mitreTechnique = mitreMapping?.technique ?? null;
        normalized.push(this.buildEvent("syslog", partial));
      } catch {
        rejected++;
      }
    }

    return this.finalizeIngestion("syslog", normalized, rejected);
  }

  ingestGeneric(events: Array<Record<string, unknown>>): SiemIngestionResult {
    const normalized: NormalizedSiemEvent[] = [];
    let rejected = 0;

    for (const raw of events) {
      try {
        const partial: Partial<NormalizedSiemEvent> = {
          severity: this.mapSplunkSeverity((raw["severity"] as string) ?? (raw["level"] as string) ?? "informational"),
          timestamp: (raw["timestamp"] as string) ?? (raw["time"] as string) ?? new Date().toISOString(),
          sourceIp: (raw["src_ip"] as string) ?? (raw["source_ip"] as string) ?? null,
          destinationIp: (raw["dst_ip"] as string) ?? (raw["dest_ip"] as string) ?? null,
          sourcePort: raw["src_port"] ? parseInt(String(raw["src_port"]), 10) : null,
          destinationPort: raw["dst_port"] ? parseInt(String(raw["dst_port"]), 10) : null,
          protocol: (raw["protocol"] as string) ?? null,
          action: (raw["action"] as string) ?? null,
          outcome: this.mapOutcome((raw["outcome"] as string) ?? (raw["result"] as string)),
          user: (raw["user"] as string) ?? (raw["username"] as string) ?? null,
          hostname: (raw["hostname"] as string) ?? (raw["host"] as string) ?? null,
          process: (raw["process"] as string) ?? (raw["application"] as string) ?? null,
          message: (raw["message"] as string) ?? (raw["msg"] as string) ?? JSON.stringify(raw),
          category: (raw["category"] as string) ?? (raw["type"] as string) ?? "generic",
          correlationId: (raw["correlation_id"] as string) ?? null,
          rawPayload: raw,
        };
        const mitreMapping = inferMitreMapping(partial);
        partial.mitreTactic = (raw["mitre_tactic"] as string) ?? mitreMapping?.tactic ?? null;
        partial.mitreTechnique = (raw["mitre_technique"] as string) ?? mitreMapping?.technique ?? null;
        normalized.push(this.buildEvent("generic", partial));
      } catch {
        rejected++;
      }
    }

    return this.finalizeIngestion("generic", normalized, rejected);
  }

  private buildEvent(source: SiemSourceFormat, partial: Partial<NormalizedSiemEvent>): NormalizedSiemEvent {
    const id = `siem_${source}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      source,
      rawFormat: source,
      timestamp: partial.timestamp ?? new Date().toISOString(),
      severity: partial.severity ?? "informational",
      sourceIp: partial.sourceIp ?? null,
      destinationIp: partial.destinationIp ?? null,
      sourcePort: partial.sourcePort ?? null,
      destinationPort: partial.destinationPort ?? null,
      protocol: partial.protocol ?? null,
      action: partial.action ?? null,
      outcome: partial.outcome ?? "unknown",
      user: partial.user ?? null,
      hostname: partial.hostname ?? null,
      process: partial.process ?? null,
      message: partial.message ?? "",
      category: partial.category ?? "security",
      tags: partial.tags ?? [],
      mitreTactic: partial.mitreTactic ?? null,
      mitreTechnique: partial.mitreTechnique ?? null,
      correlationId: partial.correlationId ?? null,
      rawPayload: partial.rawPayload ?? {},
      ingestedAt: new Date().toISOString(),
    };
  }

  private finalizeIngestion(
    source: SiemSourceFormat,
    events: NormalizedSiemEvent[],
    rejected: number,
  ): SiemIngestionResult {
    for (const event of events) {
      this.eventBuffer.unshift(event);
    }
    if (this.eventBuffer.length > this.MAX_BUFFER) {
      this.eventBuffer.length = this.MAX_BUFFER;
    }

    const correlatedAlerts = this.runCorrelationRules(events);
    for (const alert of correlatedAlerts) {
      this.correlatedAlerts.unshift(alert);
    }

    return {
      accepted: events.length,
      rejected,
      events,
      correlatedAlerts,
    };
  }

  private runCorrelationRules(newEvents: NormalizedSiemEvent[]): SiemCorrelatedAlert[] {
    const alerts: SiemCorrelatedAlert[] = [];
    const enabledRules = this.correlationRules.filter((r) => r.enabled);

    for (const rule of enabledRules) {
      const windowMs = rule.pattern.windowMinutes * 60 * 1000;
      const cutoff = new Date(Date.now() - windowMs).toISOString();

      const windowEvents = this.eventBuffer.filter((e) => e.ingestedAt >= cutoff);

      const matchingEvents = windowEvents.filter((event) => {
        return rule.pattern.conditions.every((cond) => {
          const fieldValue = String((event as unknown as Record<string, unknown>)[cond.field] ?? "").toLowerCase();
          switch (cond.operator) {
            case "eq": return fieldValue === cond.value.toLowerCase();
            case "contains": return fieldValue.includes(cond.value.toLowerCase());
            case "regex": return new RegExp(cond.value, "i").test(fieldValue);
            default: return false;
          }
        });
      });

      if (matchingEvents.length >= rule.pattern.minEvents) {
        const sourceIps = [...new Set(matchingEvents.map((e) => e.sourceIp).filter((ip): ip is string => !!ip))];
        const firstSeen = matchingEvents.map((e) => e.timestamp).sort()[0] ?? new Date().toISOString();
        const lastSeen = matchingEvents.map((e) => e.timestamp).sort().reverse()[0] ?? new Date().toISOString();

        alerts.push({
          id: `siem_alert_${rule.id}_${Date.now()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          eventCount: matchingEvents.length,
          firstSeen,
          lastSeen,
          sourceIps,
          mitreTactic: rule.mitreTactic,
          mitreTechnique: rule.mitreTechnique,
          summary: `${rule.name}: ${matchingEvents.length} events matched in ${rule.pattern.windowMinutes} min window${sourceIps.length ? ` from ${sourceIps.slice(0, 3).join(", ")}` : ""}`,
          events: matchingEvents.slice(0, 20),
          sentinelAgentFed: false,
        });
      }
    }

    return alerts;
  }

  getRecentEvents(limit = 100, severity?: NormalizedSiemEvent["severity"]): NormalizedSiemEvent[] {
    let events = [...this.eventBuffer];
    if (severity) events = events.filter((e) => e.severity === severity);
    return events.slice(0, limit);
  }

  getCorrelatedAlerts(limit = 50): SiemCorrelatedAlert[] {
    return this.correlatedAlerts.slice(0, limit);
  }

  getCorrelationRules(): SiemCorrelationRule[] {
    return [...this.correlationRules];
  }

  addCorrelationRule(rule: SiemCorrelationRule): void {
    const existing = this.correlationRules.findIndex((r) => r.id === rule.id);
    if (existing >= 0) {
      this.correlationRules[existing] = rule;
    } else {
      this.correlationRules.push(rule);
    }
  }

  getEventStats(): {
    total: number;
    bySeverity: Record<string, number>;
    bySource: Record<string, number>;
    withMitreMapping: number;
    correlatedAlerts: number;
  } {
    const bySeverity: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let withMitreMapping = 0;

    for (const event of this.eventBuffer) {
      bySeverity[event.severity] = (bySeverity[event.severity] ?? 0) + 1;
      bySource[event.source] = (bySource[event.source] ?? 0) + 1;
      if (event.mitreTactic) withMitreMapping++;
    }

    return {
      total: this.eventBuffer.length,
      bySeverity,
      bySource,
      withMitreMapping,
      correlatedAlerts: this.correlatedAlerts.length,
    };
  }

  private mapSplunkSeverity(level: string): NormalizedSiemEvent["severity"] {
    const l = level.toLowerCase();
    if (l === "critical" || l === "fatal") return "critical";
    if (l === "high" || l === "error") return "high";
    if (l === "medium" || l === "warning" || l === "warn") return "medium";
    if (l === "low" || l === "notice") return "low";
    return "informational";
  }

  private mapSentinelSeverity(level: string): NormalizedSiemEvent["severity"] {
    const l = level.toLowerCase();
    if (l === "high") return "high";
    if (l === "medium") return "medium";
    if (l === "low") return "low";
    if (l === "informational") return "informational";
    return "informational";
  }

  private mapOutcome(outcome?: string): NormalizedSiemEvent["outcome"] {
    if (!outcome) return "unknown";
    const o = outcome.toLowerCase();
    if (o === "success" || o === "allowed" || o === "permit" || o === "pass") return "success";
    if (o === "failure" || o === "failed" || o === "deny" || o === "block" || o === "reject") return "failure";
    return "unknown";
  }
}
