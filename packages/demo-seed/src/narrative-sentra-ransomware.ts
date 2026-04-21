/**
 * Demo Narrative: Sentra — Ransomware-Adjacent OT Event + Recovery Posture Gap
 *
 * Scenario: A ransomware-adjacent encrypted payload detected on 3 OT assets + anomalous C2 beacon.
 * Recovery posture is 42%. Backup for 2 critical servers is stale.
 * Control drift detected in Respond family.
 * Signal mesh clusters into isolation+recovery recommendation worth $2.8M cost avoidance.
 */

import type { Signal } from '@workspace/ontology/signal';
import type { EvidenceItem, Recommendation } from '@workspace/ontology';
import { createSignal, createEvidenceItem, createRecommendation } from '@workspace/ontology';

export type SentraRansomwareNarrative = typeof SENTRA_RANSOMWARE_NARRATIVE;

export const SENTRA_RANSOMWARE_NARRATIVE = {
  id: 'sentra-ransomware',
  title: 'Sentra — Ransomware-Adjacent OT Event + Recovery Posture Gap',
  domain: 'security' as const,
  org: 'Global Industrial Corp',
  personas: ['ciso', 'soc-manager', 'incident-commander'],
  duration: '12 minutes',

  scenario: {
    name: 'OT Ransomware Infiltration + Recovery Gap',
    summary:
      'A ransomware-adjacent encrypted payload was detected on 3 OT assets (SCADA Server, HMI Workstation, PLC Controller) alongside anomalous C2 beaconing. Recovery posture is critically low at 42% due to stale backups on 2 critical servers. Control drift detected in NIST Respond family. Signal mesh recommends immediate isolation and prioritized recovery, avoiding an estimated $2.8M in downtime costs.',
    clusterSize: 4,
    estimatedSavingsPerDayUsd: 2_800_000,
    peakRiskExposureUsd: 12_500_000,
  },

  entities: {
    scadaServer: {
      entityId: 'asset-scada-01',
      entityType: 'cyber_asset' as const,
      displayName: 'SCADA Production Server',
      domain: 'security' as const,
    },
    hmiWorkstation: {
      entityId: 'asset-hmi-04',
      entityType: 'cyber_asset' as const,
      displayName: 'HMI Workstation - Line 4',
      domain: 'security' as const,
    },
    plcController: {
      entityId: 'asset-plc-12',
      entityType: 'cyber_asset' as const,
      displayName: 'PLC Controller - Zone B',
      domain: 'security' as const,
    },
    c2Beacon: {
      entityId: 'threat-c2-99',
      entityType: 'indicator' as const,
      displayName: 'Anomalous C2 Beacon',
      domain: 'security' as const,
    },
  },

  buildSignals(): Signal[] {
    const now = Date.now();

    return [
      createSignal({
        source: 'connector',
        type: 'anomaly',
        domain: 'security',
        occurredAt: new Date(now - 45 * 60_000).toISOString(),
        freshness: 0.95,
        confidence: 0.92,
        severity: 'critical',
        entityRefs: [
          this.entities.scadaServer,
          this.entities.hmiWorkstation,
          this.entities.plcController,
        ],
        rawPayload: {
          eventType: 'encrypted_payload_detected',
          detectionEngine: 'Sentra-OT-Shield',
          payloadEntropy: 7.9,
          filePattern: 'random_extension_enc',
        },
        tags: ['ransomware', 'ot-security', 'payload-detection'],
        provenance: { connectorId: 'sentra-edr-ot', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'anomaly',
        domain: 'security',
        occurredAt: new Date(now - 30 * 60_000).toISOString(),
        freshness: 0.98,
        confidence: 0.89,
        severity: 'high',
        entityRefs: [this.entities.c2Beacon, this.entities.scadaServer],
        rawPayload: {
          eventType: 'c2_beaconing',
          destinationIp: '185.220.101.42',
          protocol: 'HTTPS/443',
          packetSize: 'uniform',
          frequency: '60s',
        },
        tags: ['c2', 'beaconing', 'threat-intel'],
        provenance: { connectorId: 'sentra-network-sentinel', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'threshold-breach',
        domain: 'security',
        occurredAt: new Date(now - 120 * 60_000).toISOString(),
        freshness: 0.85,
        confidence: 0.99,
        severity: 'high',
        entityRefs: [this.entities.scadaServer],
        rawPayload: {
          eventType: 'backup_staleness',
          lastSuccessfulBackup: new Date(now - 72 * 3600_000).toISOString(),
          status: 'failed',
          criticalSla: '24h',
        },
        tags: ['backup', 'recovery', 'resilience'],
        provenance: { connectorId: 'sentra-backup-monitor', sourceService: 'signal-mesh-seed' },
      }),

      createSignal({
        source: 'connector',
        type: 'compliance-flag',
        domain: 'security',
        occurredAt: new Date(now - 180 * 60_000).toISOString(),
        freshness: 0.8,
        confidence: 0.94,
        severity: 'medium',
        entityRefs: [],
        rawPayload: {
          eventType: 'control_drift',
          family: 'Respond',
          controlId: 'RS.RP-1',
          currentStatus: 'degraded',
          evidence: 'Incident response plan not updated for OT segment',
        },
        tags: ['nist-csf', 'compliance', 'drift'],
        provenance: { connectorId: 'sentra-governance-engine', sourceService: 'signal-mesh-seed' },
      }),
    ];
  },

  buildEvidenceItems(signals: Signal[]): EvidenceItem[] {
    return [
      createEvidenceItem({
        type: 'signal',
        domain: 'security',
        signalId: signals[0]?.signalId,
        entityRefs: [
          this.entities.scadaServer,
          this.entities.hmiWorkstation,
          this.entities.plcController,
        ],
        summary:
          'High-entropy encrypted payload detected across 3 critical OT assets — indicative of active ransomware',
        confidence: 0.92,
        freshness: 0.95,
        weight: 0.45,
        observedAt: signals[0]?.occurredAt ?? new Date().toISOString(),
        tags: ['ransomware', 'payload'],
      }),
      createEvidenceItem({
        type: 'external-data',
        domain: 'security',
        signalId: signals[1]?.signalId,
        entityRefs: [this.entities.c2Beacon],
        summary: 'C2 beaconing to known ransomware-associated IP detected from SCADA segment',
        confidence: 0.89,
        freshness: 0.98,
        weight: 0.3,
        observedAt: signals[1]?.occurredAt ?? new Date().toISOString(),
        tags: ['c2', 'threat-intel'],
      }),
      createEvidenceItem({
        type: 'threshold-trigger',
        domain: 'security',
        signalId: signals[2]?.signalId,
        entityRefs: [this.entities.scadaServer],
        summary: 'Recovery posture failure: Backups for SCADA Server are 72h stale (SLA: 24h)',
        confidence: 0.99,
        freshness: 0.85,
        weight: 0.15,
        observedAt: signals[2]?.occurredAt ?? new Date().toISOString(),
        tags: ['recovery', 'backup'],
      }),
      createEvidenceItem({
        type: 'regulatory-rule',
        domain: 'security',
        signalId: signals[3]?.signalId,
        entityRefs: [],
        summary: 'NIST CSF Respond family drift: degraded IR readiness for OT segment',
        confidence: 0.94,
        freshness: 0.8,
        weight: 0.1,
        observedAt: signals[3]?.occurredAt ?? new Date().toISOString(),
        tags: ['compliance', 'drift'],
      }),
    ];
  },

  buildRecommendation(signals: Signal[], evidenceItems: EvidenceItem[]): Recommendation {
    return createRecommendation({
      domain: 'security',
      title: 'Isolate OT Assets + Trigger Emergency Recovery Sequence',
      summary:
        'Active ransomware-adjacent activity detected on 3 OT assets. Combined with stale backups and IR drift, the organization faces a $2.8M downtime risk. Immediate network isolation and manual backup verification are required.',
      rationale:
        '4-signal correlation cluster (Payload + C2 + Backup Failure + IR Drift). ' +
        'Current recovery posture 42%. SCADA server backup exceeds 72h staleness. ' +
        "High confidence match for 'Phantom Cluster' ransomware TTPs.",
      suggestedAction: 'quarantine',
      actionPayload: {
        assetsToIsolate: ['asset-scada-01', 'asset-hmi-04', 'asset-plc-12'],
        recoveryPriority: 'high',
        manualVerificationRequired: true,
        estimatedCostAvoidanceUsd: 2_800_000,
      },
      confidence: 0.91,
      freshness: 0.96,
      projectedImpact:
        'Network isolation contains ransomware spread to 3 identified OT assets, preserving $2.8M cost-avoidance window and maintaining production continuity.',
      projectedRisk:
        'Without isolation, SCADA and HMI breach containment within 4 hours — $2.8M estimated downtime and potential multi-site OT shutdown.',
      projectedImpactUsd: 2_800_000,
      projectedRiskReductionPct: 88,
      policyEvaluation: { outcome: 'pending', policyIds: [] },
      evidenceIds: evidenceItems.map((e) => e.evidenceId),
      signalIds: signals.map((s) => s.signalId),
      entityRefs: [
        this.entities.scadaServer,
        this.entities.hmiWorkstation,
        this.entities.plcController,
      ],
      generatedBy: 'sentra-resilience-orchestrator',
      provenance: { sourceService: 'signal-mesh-seed' },
      generatedAt: new Date().toISOString(),
      tags: ['sentra', 'security', 'ransomware', 'ot-protection', 'resilience'],
    });
  },
} as const;
