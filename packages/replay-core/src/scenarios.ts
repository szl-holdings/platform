import { createSnapshot, type ReplaySnapshot } from "./snapshot.ts";

export interface ScenarioDefinition {
  id: string;
  name: string;
  domain: string;
  description: string;
  tags: string[];
  snapshots: ReplaySnapshot[];
}

const registeredScenarios = new Map<string, ScenarioDefinition>();

export function registerScenario(scenario: ScenarioDefinition): void {
  for (const snapshot of scenario.snapshots) {
    createSnapshot(snapshot);
  }
  registeredScenarios.set(scenario.id, scenario);
}

export function getScenario(id: string): ScenarioDefinition | undefined {
  return registeredScenarios.get(id);
}

export function listScenarios(filter?: { domain?: string; tags?: string[] }): ScenarioDefinition[] {
  const all = Array.from(registeredScenarios.values());
  return all.filter(s => {
    if (filter?.domain && s.domain !== filter.domain) return false;
    if (filter?.tags?.length) {
      const hasAll = filter.tags.every(t => s.tags.includes(t));
      if (!hasAll) return false;
    }
    return true;
  });
}

const AegisSOCThreatScenario: ScenarioDefinition = {
  id: "aegis-soc-threat-triage-v1",
  name: "Aegis SOC — Critical Threat Triage",
  domain: "aegis",
  description: "A real-world SOC incident where a ransomware lateral movement was detected across 14 endpoints. Tests agent threat classification, escalation routing, and containment decision quality.",
  tags: ["security", "ransomware", "soc", "triage", "critical", "ground-truth"],
  snapshots: [
    {
      id: "snap-aegis-001",
      scenarioId: "aegis-soc-threat-triage-v1",
      label: "Initial alert ingestion — Endpoint anomaly detected",
      domain: "aegis",
      snapshotType: "incident",
      version: "1.0",
      sanitized: true,
      createdAt: "2025-11-14T02:17:33Z",
      tags: ["initial-alert", "endpoint", "lateral-movement"],
      historicalContext: {
        orgThreatBaseline: "medium",
        recentIncidents: 3,
        activeAlerts: 12,
        openVulnerabilities: 47,
        lastPatchCycle: "2025-11-01",
        securityPosture: "degraded",
        slaRemaining: "4h 12m",
      },
      agentInputs: [
        {
          alertId: "ALT-2025-11-9841",
          alertType: "endpoint_anomaly",
          severity: "critical",
          source: "EDR",
          affectedEndpoints: ["WIN-SRV-04", "WIN-SRV-09", "WIN-WKS-221"],
          detectionSignature: "ransomware_lateral_movement_v3",
          confidence: 0.94,
          processChain: ["explorer.exe", "cmd.exe", "powershell.exe", "mshta.exe"],
          networkConnections: [
            { src: "10.0.4.221", dst: "185.220.101.42", port: 443, protocol: "TLS" },
          ],
          fileOperations: ["*.docx → *.docx.enc", "*.xlsx → *.xlsx.enc"],
          impactedUsers: ["j.smith", "a.reyes"],
          timestamp: "2025-11-14T02:17:31Z",
        },
      ],
      groundTruth: {
        classification: "ransomware_active",
        severity: "critical",
        priority: "P0",
        escalate: true,
        escalateTo: "soc-tier2",
        containmentAction: "isolate_endpoints",
        notifyExec: true,
        slaBreachRisk: true,
        confidence: 0.94,
      },
      metadata: {
        capturedFrom: "production-soc-2025-11-14",
        reviewedBy: "senior-analyst",
        verified: true,
      },
    },
    {
      id: "snap-aegis-002",
      scenarioId: "aegis-soc-threat-triage-v1",
      label: "Escalation decision — T2 analyst override",
      domain: "aegis",
      snapshotType: "decision",
      version: "1.0",
      sanitized: true,
      createdAt: "2025-11-14T02:24:18Z",
      tags: ["escalation", "override", "analyst-decision"],
      historicalContext: {
        priorDecision: "isolate_endpoints",
        endpointsIsolated: 3,
        spreadingDetected: true,
        newEndpointsAffected: ["WIN-SRV-11", "WIN-SRV-14"],
        executiveOnCall: true,
      },
      agentInputs: [
        {
          decisionContext: "ransomware_spreading_beyond_initial_scope",
          currentIsolationStatus: "partial",
          newEndpointsDetected: 2,
          estimatedBlastRadius: "14 endpoints across 3 VLANs",
          recoveryEstimate: "6-8 hours",
          businessImpact: "order-processing-halted",
          humanDecision: {
            analyst: "t2-lead",
            action: "full_network_segment_isolation",
            reasoning: "Spread faster than agent predicted; manual escalation to CISO",
            overrideReason: "agent_underestimated_blast_radius",
          },
        },
      ],
      groundTruth: {
        agentWasCorrect: false,
        overrideJustified: true,
        overrideCategory: "scope_underestimation",
        correctAction: "full_network_segment_isolation",
        lessonLearned: "blast_radius_estimation_needs_vlan_awareness",
      },
      metadata: {
        overrideRecorded: true,
        feedbackLoop: "training-candidate",
      },
    },
    {
      id: "snap-aegis-003",
      scenarioId: "aegis-soc-threat-triage-v1",
      label: "Post-incident artifact generation",
      domain: "aegis",
      snapshotType: "flow",
      version: "1.0",
      sanitized: true,
      createdAt: "2025-11-14T10:45:00Z",
      tags: ["artifact", "report", "post-incident"],
      historicalContext: {
        incidentDuration: "8h 27m",
        endpointsAffected: 14,
        dataEncrypted: false,
        lateralMovementStopped: true,
        rootCauseIdentified: "phishing_email_compromise",
        cveExploited: "CVE-2025-19823",
      },
      agentInputs: [
        {
          requestType: "post_incident_report",
          audience: "executive",
          includeTimeline: true,
          includeRecommendations: true,
          includeFinancialImpact: true,
          complianceFrameworks: ["SOC2", "ISO27001"],
        },
      ],
      groundTruth: {
        reportGenerated: true,
        sectionsRequired: ["executive-summary", "timeline", "impact-assessment", "recommendations", "compliance-impact"],
        toneCorrect: "executive",
        recommendationsCount: { min: 3, max: 8 },
        containsFinancialEstimate: true,
      },
      metadata: {
        templateVersion: "executive-report-v2",
      },
    },
  ],
};

registerScenario(AegisSOCThreatScenario);

const VesselsVoyagePnLScenario: ScenarioDefinition = {
  id: "vessels-voyage-pnl-optimization-v1",
  name: "Vessels — Voyage P&L Optimization Decision",
  domain: "vessels",
  description: "A voyage P&L optimization request where the agent recommends route changes based on fuel costs, weather, and port conditions. Tests reasoning quality and operator override patterns.",
  tags: ["maritime", "voyage", "pnl", "optimization", "routing"],
  snapshots: [
    {
      id: "snap-vessels-001",
      scenarioId: "vessels-voyage-pnl-optimization-v1",
      label: "Voyage optimization request — MV Poseidon",
      domain: "vessels",
      snapshotType: "decision",
      version: "1.0",
      sanitized: true,
      createdAt: "2025-10-03T09:12:00Z",
      tags: ["route-optimization", "fuel", "weather"],
      historicalContext: {
        vesselClass: "cape-size",
        currentRoute: "Rotterdam → Singapore via Suez",
        fuelPrice: 680,
        fuelPriceUnit: "USD/MT",
        weatherAlert: "cyclone_approaching_indian_ocean",
        portCongestionSingapore: "moderate",
        charterRate: 28500,
        charterRateUnit: "USD/day",
      },
      agentInputs: [
        {
          vesselId: "MV-POSEIDON-001",
          requestType: "route_optimization",
          currentPosition: { lat: 28.5, lng: 34.2 },
          destination: "Singapore",
          cargoType: "iron_ore",
          cargoTonnes: 180000,
          laycanWindow: "2025-10-18 to 2025-10-22",
          constraints: ["avoid_cyclone_zone", "minimize_fuel", "meet_laycan"],
        },
      ],
      groundTruth: {
        recommendedRoute: "cape_of_good_hope_diversion",
        estimatedFuelSaving: null,
        estimatedDelay: "3.5 days",
        cycloneAvoidance: true,
        laycanMet: true,
        recommendedAction: "divert",
        confidence: 0.87,
      },
      metadata: {
        capturedFrom: "vessels-ops-2025-10-03",
        operatorApproved: true,
      },
    },
  ],
};

registerScenario(VesselsVoyagePnLScenario);

export { AegisSOCThreatScenario, VesselsVoyagePnLScenario };

export function getSeededScenarios(): ScenarioDefinition[] {
  return listScenarios();
}
