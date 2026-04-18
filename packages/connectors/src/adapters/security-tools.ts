/**
 * Security Tools Demo Adapter
 *
 * Synthetic security signals: threat detections, SOC alerts,
 * compliance drift, and SIEM events.
 */

import type { SignalInput } from "@workspace/ontology";
import type { SecurityToolsConnector, ConnectorMetadata, ConnectorStatus } from "../interfaces.js";
import type { Signal } from "@workspace/ontology";

export class SecurityToolsDemoAdapter implements SecurityToolsConnector {
  readonly category = "security-tools" as const;
  readonly metadata: ConnectorMetadata = {
    connectorId: "demo-security-tools",
    connectorName: "Security Tools Demo Connector (SIEM/EDR)",
    category: "security-tools",
    version: "1.0.0",
    description: "Synthetic SIEM, EDR, and compliance signals for SOC workflows",
    synthetic: true,
  };

  private _status: ConnectorStatus = "idle";
  private _emitSignal?: (input: SignalInput) => Promise<Signal>;

  status(): ConnectorStatus { return this._status; }

  getActiveThreats() {
    return [
      { threatId: "threat-001", name: "Lateral Movement Attempt", severity: "high", affectedAssets: ["ws-finance-03", "file-server-01"], detectedAt: new Date(Date.now() - 45 * 60_000).toISOString() },
      { threatId: "threat-002", name: "Credential Stuffing — Admin Portal", severity: "medium", affectedAssets: ["auth-service"], detectedAt: new Date(Date.now() - 20 * 60_000).toISOString() },
    ];
  }

  getComplianceScore() {
    return { score: 81, passing: 97, failing: 23, lastAssessedAt: new Date(Date.now() - 24 * 3600_000).toISOString() };
  }

  async start(emitSignal: (input: SignalInput) => Promise<Signal>): Promise<void> {
    this._emitSignal = emitSignal;
    this._status = "streaming";
    await this._emitInitialSignals();
  }

  async stop(): Promise<void> { this._status = "stopped"; }

  async poll(): Promise<Signal[]> { return []; }

  private async _emitInitialSignals(): Promise<void> {
    if (!this._emitSignal) return;

    await this._emitSignal({
      source: "connector",
      type: "risk",
      domain: "security",
      occurredAt: new Date(Date.now() - 45 * 60_000).toISOString(),
      freshness: 0.88,
      confidence: 0.87,
      severity: "high",
      entityRefs: [{ entityId: "asset-ws-finance-03", entityType: "custom", displayName: "Finance Workstation 03", domain: "security" }],
      rawPayload: {
        eventType: "lateral_movement_detected",
        threatId: "threat-001",
        mitreId: "T1021",
        mitreName: "Remote Services",
        affectedAssets: ["ws-finance-03", "file-server-01"],
        sourceIP: "10.42.18.33",
        destIP: "10.42.20.5",
        confidence: 0.87,
      },
      tags: ["mitre", "lateral-movement", "soc", "security"],
      provenance: { connectorId: "demo-security-tools", connectorCategory: "security-tools" },
    });

    await this._emitSignal({
      source: "connector",
      type: "compliance-flag",
      domain: "security",
      occurredAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
      freshness: 0.7,
      confidence: 0.99,
      severity: "medium",
      entityRefs: [],
      rawPayload: {
        eventType: "compliance_drift",
        framework: "SOC 2 Type II",
        score: 81,
        failing: 23,
        criticalFailing: 3,
        lastAssessedAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
      },
      tags: ["compliance", "soc2", "drift", "security"],
      provenance: { connectorId: "demo-security-tools", connectorCategory: "security-tools" },
    });
  }
}
