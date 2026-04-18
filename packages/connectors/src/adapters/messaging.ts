/**
 * Messaging (Slack/Teams) Demo Adapter
 *
 * Synthetic messaging signals: critical channel alerts, incident notifications,
 * and cross-domain escalation messages.
 */

import type { SignalInput } from "@workspace/ontology";
import type { MessagingConnector, ConnectorMetadata, ConnectorStatus } from "../interfaces.js";
import type { Signal } from "@workspace/ontology";

export class MessagingDemoAdapter implements MessagingConnector {
  readonly category = "messaging" as const;
  readonly metadata: ConnectorMetadata = {
    connectorId: "demo-messaging",
    connectorName: "Messaging Demo Connector (Slack/Teams)",
    category: "messaging",
    version: "1.0.0",
    description: "Synthetic Slack/Teams alerts for multi-domain incident escalation",
    synthetic: true,
  };

  private _status: ConnectorStatus = "idle";
  private _emitSignal?: (input: SignalInput) => Promise<Signal>;

  status(): ConnectorStatus { return this._status; }

  getActiveAlerts() {
    return [
      { channel: "#fleet-ops-critical", message: "MV Soltana AIS dark — 134min — sanctions corridor proximity", sentAt: new Date(Date.now() - 120 * 60_000).toISOString() },
      { channel: "#estate-readiness", message: "Castellano Estate: 4 open checklist items — VIP arrival T-18h", sentAt: new Date(Date.now() - 30 * 60_000).toISOString() },
      { channel: "#treasury-risk", message: "FX hedge ratio drifted beyond 15% — review required", sentAt: new Date(Date.now() - 45 * 60_000).toISOString() },
    ];
  }

  async start(emitSignal: (input: SignalInput) => Promise<Signal>): Promise<void> {
    this._emitSignal = emitSignal;
    this._status = "polling";
    await this._emitInitialSignals();
  }

  async stop(): Promise<void> { this._status = "stopped"; }

  async poll(): Promise<Signal[]> { return []; }

  private async _emitInitialSignals(): Promise<void> {
    if (!this._emitSignal) return;

    await this._emitSignal({
      source: "connector",
      type: "escalation",
      domain: "cross-domain",
      occurredAt: new Date(Date.now() - 45 * 60_000).toISOString(),
      freshness: 0.88,
      confidence: 0.9,
      severity: "high",
      entityRefs: [],
      rawPayload: {
        eventType: "slack_alert",
        channel: "#treasury-risk",
        message: "FX hedge ratio drifted beyond 15% threshold — treasury review required",
        sender: "risk-bot",
        domain: "finance",
      },
      tags: ["slack", "treasury", "fx-hedge", "szl-holdings"],
      provenance: { connectorId: "demo-messaging", connectorCategory: "messaging" },
    });
  }
}
