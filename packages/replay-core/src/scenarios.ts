import { createSnapshot, type ReplaySnapshot } from './snapshot.js';

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
  return all.filter((s) => {
    if (filter?.domain && s.domain !== filter.domain) return false;
    if (filter?.tags?.length) {
      const hasAll = filter.tags.every((t) => s.tags.includes(t));
      if (!hasAll) return false;
    }
    return true;
  });
}

const AegisSOCThreatScenario: ScenarioDefinition = {
  id: 'aegis-soc-threat-triage-v1',
  name: 'Aegis SOC — Critical Threat Triage',
  domain: 'aegis',
  description:
    'A real-world SOC incident where a ransomware lateral movement was detected across 14 endpoints. Tests agent threat classification, escalation routing, and containment decision quality.',
  tags: ['security', 'ransomware', 'soc', 'triage', 'critical', 'ground-truth'],
  snapshots: [
    {
      id: 'snap-aegis-001',
      scenarioId: 'aegis-soc-threat-triage-v1',
      label: 'Initial alert ingestion — Endpoint anomaly detected',
      domain: 'aegis',
      snapshotType: 'incident',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-11-14T02:17:33Z',
      tags: ['initial-alert', 'endpoint', 'lateral-movement'],
      historicalContext: {
        orgThreatBaseline: 'medium',
        recentIncidents: 3,
        activeAlerts: 12,
        openVulnerabilities: 47,
        lastPatchCycle: '2025-11-01',
        securityPosture: 'degraded',
        slaRemaining: '4h 12m',
      },
      agentInputs: [
        {
          alertId: 'ALT-2025-11-9841',
          alertType: 'endpoint_anomaly',
          severity: 'critical',
          source: 'EDR',
          affectedEndpoints: ['WIN-SRV-04', 'WIN-SRV-09', 'WIN-WKS-221'],
          detectionSignature: 'ransomware_lateral_movement_v3',
          confidence: 0.94,
          processChain: ['explorer.exe', 'cmd.exe', 'powershell.exe', 'mshta.exe'],
          networkConnections: [
            { src: '10.0.4.221', dst: '185.220.101.42', port: 443, protocol: 'TLS' },
          ],
          fileOperations: ['*.docx → *.docx.enc', '*.xlsx → *.xlsx.enc'],
          impactedUsers: ['j.smith', 'a.reyes'],
          timestamp: '2025-11-14T02:17:31Z',
        },
      ],
      groundTruth: {
        classification: 'ransomware_active',
        severity: 'critical',
        priority: 'P0',
        escalate: true,
        escalateTo: 'soc-tier2',
        containmentAction: 'isolate_endpoints',
        notifyExec: true,
        slaBreachRisk: true,
        confidence: 0.94,
      },
      metadata: {
        capturedFrom: 'production-soc-2025-11-14',
        reviewedBy: 'senior-analyst',
        verified: true,
      },
    },
    {
      id: 'snap-aegis-002',
      scenarioId: 'aegis-soc-threat-triage-v1',
      label: 'Escalation decision — T2 analyst override',
      domain: 'aegis',
      snapshotType: 'decision',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-11-14T02:24:18Z',
      tags: ['escalation', 'override', 'analyst-decision'],
      historicalContext: {
        priorDecision: 'isolate_endpoints',
        endpointsIsolated: 3,
        spreadingDetected: true,
        newEndpointsAffected: ['WIN-SRV-11', 'WIN-SRV-14'],
        executiveOnCall: true,
      },
      agentInputs: [
        {
          decisionContext: 'ransomware_spreading_beyond_initial_scope',
          currentIsolationStatus: 'partial',
          newEndpointsDetected: 2,
          estimatedBlastRadius: '14 endpoints across 3 VLANs',
          recoveryEstimate: '6-8 hours',
          businessImpact: 'order-processing-halted',
          humanDecision: {
            analyst: 't2-lead',
            action: 'full_network_segment_isolation',
            reasoning: 'Spread faster than agent predicted; manual escalation to CISO',
            overrideReason: 'agent_underestimated_blast_radius',
          },
        },
      ],
      groundTruth: {
        agentWasCorrect: false,
        overrideJustified: true,
        overrideCategory: 'scope_underestimation',
        correctAction: 'full_network_segment_isolation',
        lessonLearned: 'blast_radius_estimation_needs_vlan_awareness',
      },
      metadata: {
        overrideRecorded: true,
        feedbackLoop: 'training-candidate',
      },
    },
    {
      id: 'snap-aegis-003',
      scenarioId: 'aegis-soc-threat-triage-v1',
      label: 'Post-incident artifact generation',
      domain: 'aegis',
      snapshotType: 'flow',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-11-14T10:45:00Z',
      tags: ['artifact', 'report', 'post-incident'],
      historicalContext: {
        incidentDuration: '8h 27m',
        endpointsAffected: 14,
        dataEncrypted: false,
        lateralMovementStopped: true,
        rootCauseIdentified: 'phishing_email_compromise',
        cveExploited: 'CVE-2025-19823',
      },
      agentInputs: [
        {
          requestType: 'post_incident_report',
          audience: 'executive',
          includeTimeline: true,
          includeRecommendations: true,
          includeFinancialImpact: true,
          complianceFrameworks: ['SOC2', 'ISO27001'],
        },
      ],
      groundTruth: {
        reportGenerated: true,
        sectionsRequired: [
          'executive-summary',
          'timeline',
          'impact-assessment',
          'recommendations',
          'compliance-impact',
        ],
        toneCorrect: 'executive',
        recommendationsCount: { min: 3, max: 8 },
        containsFinancialEstimate: true,
      },
      metadata: {
        templateVersion: 'executive-report-v2',
      },
    },
  ],
};

registerScenario(AegisSOCThreatScenario);

const VesselsVoyagePnLScenario: ScenarioDefinition = {
  id: 'vessels-voyage-pnl-optimization-v1',
  name: 'Vessels — Voyage P&L Optimization Decision',
  domain: 'vessels',
  description:
    'A voyage P&L optimization request where the agent recommends route changes based on fuel costs, weather, and port conditions. Tests reasoning quality and operator override patterns.',
  tags: ['maritime', 'voyage', 'pnl', 'optimization', 'routing'],
  snapshots: [
    {
      id: 'snap-vessels-001',
      scenarioId: 'vessels-voyage-pnl-optimization-v1',
      label: 'Voyage optimization request — MV Poseidon',
      domain: 'vessels',
      snapshotType: 'decision',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-10-03T09:12:00Z',
      tags: ['route-optimization', 'fuel', 'weather'],
      historicalContext: {
        vesselClass: 'cape-size',
        currentRoute: 'Rotterdam → Singapore via Suez',
        fuelPrice: 680,
        fuelPriceUnit: 'USD/MT',
        weatherAlert: 'cyclone_approaching_indian_ocean',
        portCongestionSingapore: 'moderate',
        charterRate: 28500,
        charterRateUnit: 'USD/day',
      },
      agentInputs: [
        {
          vesselId: 'MV-POSEIDON-001',
          requestType: 'route_optimization',
          currentPosition: { lat: 28.5, lng: 34.2 },
          destination: 'Singapore',
          cargoType: 'iron_ore',
          cargoTonnes: 180000,
          laycanWindow: '2025-10-18 to 2025-10-22',
          constraints: ['avoid_cyclone_zone', 'minimize_fuel', 'meet_laycan'],
        },
      ],
      groundTruth: {
        recommendedRoute: 'cape_of_good_hope_diversion',
        estimatedFuelSaving: null,
        estimatedDelay: '3.5 days',
        cycloneAvoidance: true,
        laycanMet: true,
        recommendedAction: 'divert',
        confidence: 0.87,
      },
      metadata: {
        capturedFrom: 'vessels-ops-2025-10-03',
        operatorApproved: true,
      },
    },
    {
      id: 'snap-vessels-pnl-002',
      scenarioId: 'vessels-voyage-pnl-optimization-v1',
      label: 'Post-diversion performance review — MV Poseidon voyage reconciliation',
      domain: 'vessels',
      snapshotType: 'audit',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-10-24T16:00:00Z',
      tags: ['voyage-reconciliation', 'pnl-actual', 'post-voyage'],
      historicalContext: {
        vesselId: 'MV-POSEIDON-001',
        originalRoute: 'Rotterdam → Singapore via Suez',
        actualRoute: 'Rotterdam → Singapore via Cape of Good Hope',
        diversionApprovedBy: 'fleet-operations-manager',
        cycloneStatus: 'dissipated_2025-10-09',
        actualArrival: '2025-10-21',
        laycanWindowEnd: '2025-10-22',
        laycanMet: true,
      },
      agentInputs: [
        {
          requestType: 'voyage_pnl_reconciliation',
          vesselId: 'MV-POSEIDON-001',
          budgetedFuelMT: 3200,
          actualFuelMT: 3510,
          fuelPriceUSD: 680,
          budgetedDays: 18,
          actualDays: 21.5,
          charterRate: 28500,
          charterRateUnit: 'USD/day',
          portDisbursements: 142000,
          freightRevenue: 6840000,
        },
      ],
      groundTruth: {
        voyagePnLUSD: 1286200,
        fuelOverrunUSD: 210800,
        additionalDaysRevenueLost: 99750,
        netDiversionCostUSD: 310550,
        cycloneAvoidanceBenefit: 'immeasurable_hull_and_cargo_loss_prevented',
        diversionDecisionJustified: true,
        agentRecommendationValidated: true,
        lessonLearned: 'cape_diversion_cost_acceptable_given_cyclone_category_4_risk',
      },
      metadata: {
        capturedFrom: 'vessels-ops-2025-10-24',
        operatorApproved: true,
        reviewedBy: 'fleet-operations-manager',
        verified: true,
      },
    },
  ],
};

registerScenario(VesselsVoyagePnLScenario);

const VesselsCharterNegotiationScenario: ScenarioDefinition = {
  id: 'vessels-charter-rate-negotiation-v1',
  name: 'Vessels — Charter Rate Negotiation Analysis',
  domain: 'vessels',
  description:
    'Agent evaluates competing charter party offers for a handymax vessel and recommends the optimal fixture. Tests commercial reasoning, rate benchmarking against Baltic indices, and clause risk assessment.',
  tags: ['maritime', 'charter', 'negotiation', 'commercial', 'fixture', 'ground-truth'],
  snapshots: [
    {
      id: 'snap-vessels-002',
      scenarioId: 'vessels-charter-rate-negotiation-v1',
      label: 'Charter offer comparison — MV Atlantic Trader',
      domain: 'vessels',
      snapshotType: 'decision',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-12-09T11:30:00Z',
      tags: ['charter-party', 'rate-benchmarking', 'fixture'],
      historicalContext: {
        vesselClass: 'handymax',
        vesselDWT: 58000,
        currentPosition: 'Rotterdam anchorage',
        openDate: '2025-12-14',
        balticHandymaxIndex: 1240,
        balticHandymaxUnit: 'USD/day',
        marketTrend: 'softening',
        lastFixtureRate: 13800,
        lastFixtureRateUnit: 'USD/day',
        daysOffHire90Day: 2.5,
      },
      agentInputs: [
        {
          vesselId: 'MV-ATLANTIC-TRADER-007',
          requestType: 'charter_offer_analysis',
          offers: [
            {
              chartererCode: 'CTR-A',
              cargoType: 'grain',
              loadPort: 'Amsterdam',
              dischargePort: 'Casablanca',
              laycan: '2025-12-15 to 2025-12-17',
              rate: 14200,
              rateUnit: 'USD/day',
              duration: '30 days',
              addressCommission: 3.75,
              brokerCommission: 1.25,
              deviationClause: false,
              demurrageRate: 8000,
            },
            {
              chartererCode: 'CTR-B',
              cargoType: 'fertilizer',
              loadPort: 'Gdansk',
              dischargePort: 'Lagos',
              laycan: '2025-12-16 to 2025-12-19',
              rate: 13500,
              rateUnit: 'USD/day',
              duration: '45 days',
              addressCommission: 2.5,
              brokerCommission: 1.25,
              deviationClause: true,
              deviationPenalty: 'USD 15,000 per event',
              demurrageRate: 7500,
              sanctionedPortRisk: 'low',
            },
          ],
          ownerConstraints: [
            'avoid_west_africa_rainy_season',
            'no_fertilizer_without_hold_cleaning_allowance',
          ],
        },
      ],
      groundTruth: {
        recommendedOffer: 'CTR-A',
        netDailyRate: 13765,
        netDailyRateUnit: 'USD/day',
        rejectionReason:
          'CTR-B fertilizer cargo triggers hold-cleaning cost without allowance; deviation clause creates unquantified liability',
        riskFlags: ['CTR-B: deviation_clause', 'CTR-B: no_hold_cleaning_allowance'],
        confidence: 0.91,
        recommendedAction: 'accept_CTR-A_subject_to_laytime_clause_review',
      },
      metadata: {
        capturedFrom: 'vessels-commercial-2025-12-09',
        operatorApproved: true,
        reviewedBy: 'chartering-superintendent',
        verified: true,
      },
    },
    {
      id: 'snap-vessels-003',
      scenarioId: 'vessels-charter-rate-negotiation-v1',
      label: 'Fixture recap review — laytime and demurrage clause risks',
      domain: 'vessels',
      snapshotType: 'audit',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-12-10T08:15:00Z',
      tags: ['fixture-recap', 'laytime', 'demurrage', 'clause-review'],
      historicalContext: {
        acceptedOffer: 'CTR-A',
        signedDate: '2025-12-09',
        expectedLoadingDate: '2025-12-15',
        portCongestionAmsterdam: 'low',
        weatherForecast: 'favorable',
      },
      agentInputs: [
        {
          requestType: 'fixture_recap_audit',
          recapText:
            'MV Atlantic Trader / CTR-A: 14200/day, 30 days, Amsterdam/Casablanca, laycan 15-17 Dec, demurrage USD 8,000/day, SHINC laytime, free pratique on arrival, WIBON WIPON WIFCON',
          focusAreas: [
            'laytime_calculation',
            'demurrage_exposure',
            'force_majeure',
            'off_hire_triggers',
          ],
        },
      ],
      groundTruth: {
        layTimeBasis: 'SHINC',
        estimatedLaytimeDays: 1.8,
        demurrageExposureUSD: 3200,
        redFlags: [],
        clauseRisks: [
          'WIBON: vessel cannot refuse a berth if weather turns; exposure if Amsterdam port closes',
        ],
        overallRisk: 'low',
        auditPassed: true,
        recommendedAmendments: ['Add weather exception to WIBON clause'],
      },
      metadata: {
        templateVersion: 'fixture-recap-audit-v1',
        reviewedBy: 'chartering-superintendent',
        verified: true,
      },
    },
  ],
};

registerScenario(VesselsCharterNegotiationScenario);

const TerraPortfolioStressScenario: ScenarioDefinition = {
  id: 'terra-portfolio-stress-test-v1',
  name: 'Terra — Portfolio Stress Test Under Rate Shock',
  domain: 'terra',
  description:
    'Agent models the impact of a 200bps rate shock on a mixed-use real estate portfolio and recommends repositioning actions. Tests DCF sensitivity, LTV covenant breach detection, and disposition prioritization.',
  tags: ['real-estate', 'stress-test', 'portfolio', 'rate-shock', 'dcf', 'ground-truth'],
  snapshots: [
    {
      id: 'snap-terra-001',
      scenarioId: 'terra-portfolio-stress-test-v1',
      label: 'Rate shock impact modeling — 12-asset portfolio',
      domain: 'terra',
      snapshotType: 'incident',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-09-22T14:00:00Z',
      tags: ['stress-test', 'rate-shock', 'ltv', 'covenant-breach'],
      historicalContext: {
        portfolioName: 'SZL Opportunity Fund IV',
        totalAssets: 12,
        totalGAV: 480000000,
        totalGAVUnit: 'USD',
        weightedAvgCapRate: 5.2,
        currentBenchmarkRate: 4.75,
        activeLoans: 9,
        avgLTV: 62,
        ltvCovenantMax: 70,
        nearCovenantBreachCount: 2,
        vacancyRate: 8.4,
        wale: 4.2,
        waleUnit: 'years',
        lastAppraisalDate: '2025-06-30',
      },
      agentInputs: [
        {
          requestType: 'portfolio_stress_test',
          scenario: 'rate_shock_200bps',
          interestRateShift: 2.0,
          capRateExpansionAssumption: 0.75,
          noiDeclineAssumption: 0.05,
          assets: [
            {
              id: 'TERRA-ASSET-001',
              type: 'office',
              city: 'London',
              currentValue: 85000000,
              currentLTV: 58,
              loanMaturity: '2027-03',
            },
            {
              id: 'TERRA-ASSET-002',
              type: 'logistics',
              city: 'Amsterdam',
              currentValue: 62000000,
              currentLTV: 55,
              loanMaturity: '2028-06',
            },
            {
              id: 'TERRA-ASSET-003',
              type: 'retail-park',
              city: 'Manchester',
              currentValue: 44000000,
              currentLTV: 68,
              loanMaturity: '2026-09',
            },
            {
              id: 'TERRA-ASSET-004',
              type: 'multifamily',
              city: 'Berlin',
              currentValue: 97000000,
              currentLTV: 61,
              loanMaturity: '2028-12',
            },
            {
              id: 'TERRA-ASSET-005',
              type: 'office',
              city: 'Paris',
              currentValue: 71000000,
              currentLTV: 67,
              loanMaturity: '2026-11',
            },
          ],
          outputRequirements: [
            'covenant_breach_flags',
            'revised_ltv_table',
            'disposition_priority_rank',
          ],
        },
      ],
      groundTruth: {
        covenantBreachAssets: ['TERRA-ASSET-003', 'TERRA-ASSET-005'],
        estimatedPortfolioValuePost: 448000000,
        portfolioValueDeclinePct: 6.7,
        avgLTVPost: 66.4,
        immediateActionRequired: true,
        dispositionPriorityOrder: ['TERRA-ASSET-003', 'TERRA-ASSET-005', 'TERRA-ASSET-001'],
        recommendedAction: 'initiate_managed_disposition_TERRA-ASSET-003',
        confidence: 0.89,
      },
      metadata: {
        capturedFrom: 'terra-portfolio-ops-2025-09-22',
        reviewedBy: 'fund-manager',
        verified: true,
      },
    },
    {
      id: 'snap-terra-002',
      scenarioId: 'terra-portfolio-stress-test-v1',
      label: 'Disposition decision — TERRA-ASSET-003 retail park',
      domain: 'terra',
      snapshotType: 'decision',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-09-23T09:45:00Z',
      tags: ['disposition', 'retail', 'covenant-breach', 'sale-advisory'],
      historicalContext: {
        assetId: 'TERRA-ASSET-003',
        assetType: 'retail-park',
        city: 'Manchester',
        currentBookValue: 44000000,
        postStressValue: 40700000,
        currentLTV: 68,
        postStressLTV: 73.4,
        ltvCovenantMax: 70,
        loanMaturity: '2026-09',
        occupancy: 82,
        wale: 2.1,
        waleUnit: 'years',
        activeDebtBalance: 29700000,
        estimatedSaleTimeline: '4-6 months',
      },
      agentInputs: [
        {
          requestType: 'disposition_recommendation',
          assetId: 'TERRA-ASSET-003',
          options: [
            { action: 'sell_now', expectedProceeds: 40000000, timelineMonths: 5, brokerFee: 0.015 },
            {
              action: 'refinance_and_hold',
              newLTV: 60,
              additionalEquityRequired: 5800000,
              holdPeriodYears: 3,
            },
            { action: 'partial_sale_jv', jvPartnerEquity: 0.49, impliedValuation: 41500000 },
          ],
        },
      ],
      groundTruth: {
        recommendedAction: 'sell_now',
        rationale:
          'WALE below 2.5 years makes refinance difficult; JV dilutes returns without resolving covenant; sale proceeds cover debt and preserves fund NAV',
        netProceedsEstimate: 39400000,
        debtRepayment: 29700000,
        equityReturn: 9700000,
        irr: null,
        overrideRequired: false,
        confidence: 0.85,
      },
      metadata: {
        reviewedBy: 'fund-manager',
        verified: true,
        feedbackLoop: 'training-candidate',
      },
    },
    {
      id: 'snap-terra-003',
      scenarioId: 'terra-portfolio-stress-test-v1',
      label: 'Board-level stress report generation',
      domain: 'terra',
      snapshotType: 'flow',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-09-24T15:00:00Z',
      tags: ['board-report', 'stress-test', 'artifact-generation'],
      historicalContext: {
        reportingPeriod: 'Q3 2025',
        stressScenario: '200bps rate shock',
        portfolioAssetsAnalyzed: 12,
        covenantBreaches: 2,
        recommendedDispositions: 1,
      },
      agentInputs: [
        {
          requestType: 'board_stress_report',
          audience: 'board',
          includeHeatmap: true,
          includeDispositionPlan: true,
          includeSensitivityTable: true,
          complianceFrameworks: ['AIFMD', 'Basel-III-LTV'],
        },
      ],
      groundTruth: {
        reportGenerated: true,
        sectionsRequired: [
          'executive-summary',
          'stress-scenario-assumptions',
          'asset-heat-map',
          'covenant-breach-detail',
          'disposition-plan',
          'sensitivity-table',
        ],
        audienceTone: 'board',
        containsQuantifiedRisk: true,
        recommendationsCount: { min: 2, max: 6 },
      },
      metadata: {
        templateVersion: 'board-stress-report-v1',
      },
    },
  ],
};

registerScenario(TerraPortfolioStressScenario);

const TerraAssetValuationScenario: ScenarioDefinition = {
  id: 'terra-asset-valuation-override-v1',
  name: 'Terra — Asset Valuation Dispute & Appraisal Override',
  domain: 'terra',
  description:
    'Agent reconciles a 12% discrepancy between internal model valuation and third-party appraisal for a Grade-A office asset. Tests valuation methodology reasoning, assumption sensitivity, and flagging of appraisal override risk.',
  tags: ['real-estate', 'valuation', 'appraisal', 'dispute', 'office', 'ground-truth'],
  snapshots: [
    {
      id: 'snap-terra-004',
      scenarioId: 'terra-asset-valuation-override-v1',
      label: 'Valuation discrepancy detected — TERRA-ASSET-001',
      domain: 'terra',
      snapshotType: 'incident',
      version: '1.0',
      sanitized: true,
      createdAt: '2026-01-15T10:20:00Z',
      tags: ['valuation', 'discrepancy', 'appraisal', 'office'],
      historicalContext: {
        assetId: 'TERRA-ASSET-001',
        assetType: 'office',
        city: 'London',
        grade: 'A',
        totalNIA: 48500,
        totalNIAUnit: 'sqm',
        occupancy: 91,
        wale: 5.8,
        waleUnit: 'years',
        passingRent: 7280000,
        passingRentUnit: 'GBP/year',
        lastThirdPartyAppraisal: 85000000,
        lastThirdPartyAppraisalUnit: 'GBP',
        lastThirdPartyAppraisalDate: '2025-12-31',
        internalModelValue: 96200000,
        internalModelValueUnit: 'GBP',
        discrepancyPct: 13.2,
      },
      agentInputs: [
        {
          requestType: 'valuation_reconciliation',
          assetId: 'TERRA-ASSET-001',
          internalAssumptions: {
            capRate: 4.8,
            marketRentGrowthPct: 2.5,
            voidAllowance: 0.06,
            discountRate: 6.75,
          },
          thirdPartyAssumptions: {
            capRate: 5.5,
            marketRentGrowthPct: 1.0,
            voidAllowance: 0.12,
            discountRate: 7.25,
          },
          marketComparables: [
            { address: '[REDACTED]', saleDate: '2025-10-01', capRateAchieved: 5.1, grade: 'A' },
            { address: '[REDACTED]', saleDate: '2025-08-15', capRateAchieved: 5.3, grade: 'A' },
          ],
        },
      ],
      groundTruth: {
        primaryDiscrepancyDriver: 'capRate_assumption',
        capRateGap: 0.7,
        marketEvidenceCapRateRange: [5.0, 5.4],
        internalCapRateJustified: false,
        recommendedAdjustment: 'revise_internal_cap_rate_to_5.2',
        revisedInternalValue: 88500000,
        revisedInternalValueUnit: 'GBP',
        remainingDiscrepancyPostAdj: 4.1,
        remainingDiscrepancyJustified: true,
        remainingJustificationReason: 'superior_occupancy_and_wale_vs_comparables',
        escalateToValuationCommittee: false,
        confidence: 0.88,
      },
      metadata: {
        capturedFrom: 'terra-valuation-ops-2026-01-15',
        reviewedBy: 'head-of-valuations',
        verified: true,
      },
    },
    {
      id: 'snap-terra-005',
      scenarioId: 'terra-asset-valuation-override-v1',
      label: 'RICS compliance check — valuation methodology audit',
      domain: 'terra',
      snapshotType: 'audit',
      version: '1.0',
      sanitized: true,
      createdAt: '2026-01-15T14:30:00Z',
      tags: ['rics', 'compliance', 'methodology-audit', 'valuation'],
      historicalContext: {
        assetId: 'TERRA-ASSET-001',
        revisedValue: 88500000,
        complianceFramework: 'RICS Red Book 2024',
        valuationPurpose: 'fund-NAV-reporting',
        auditTrigger: 'material_discrepancy_threshold_exceeded',
      },
      agentInputs: [
        {
          requestType: 'rics_compliance_audit',
          assetId: 'TERRA-ASSET-001',
          valuationReport: {
            methodology: 'income_capitalisation_and_DCF',
            comparableEvidence: 2,
            marketCommentaryIncluded: true,
            sensitivityAnalysisIncluded: true,
            valuationDate: '2026-01-15',
          },
          checklistVersion: 'RICS-RB-2024-v3',
        },
      ],
      groundTruth: {
        compliancePassed: true,
        criticalDeficiencies: [],
        minorDeficiencies: ['sensitivity_analysis_lacks_downside_scenario'],
        recommendedActions: ['add_downside_sensitivity_table_before_submission'],
        reportReadyForNAV: true,
        ricsCertificationEligible: true,
      },
      metadata: {
        reviewedBy: 'head-of-valuations',
        verified: true,
      },
    },
  ],
};

registerScenario(TerraAssetValuationScenario);

const PrismSARFilingScenario: ScenarioDefinition = {
  id: 'prism-sar-filing-workflow-v1',
  name: 'Prism Counsel — SAR Filing Workflow',
  domain: 'prism',
  description:
    'Agent identifies suspicious transaction patterns across two accounts and guides the compliance team through the SAR preparation, internal escalation, and FinCEN submission workflow. Tests AML reasoning, threshold analysis, and reporting accuracy.',
  tags: ['compliance', 'aml', 'sar', 'fincen', 'suspicious-activity', 'ground-truth'],
  snapshots: [
    {
      id: 'snap-prism-001',
      scenarioId: 'prism-sar-filing-workflow-v1',
      label: 'Suspicious activity detection — structuring pattern identified',
      domain: 'prism',
      snapshotType: 'incident',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-11-28T09:05:00Z',
      tags: ['aml', 'structuring', 'suspicious-activity', 'detection'],
      historicalContext: {
        institutionType: 'registered-investment-adviser',
        amlProgramVersion: 'v4.2',
        monthlyTransactionVolume: 18400,
        priorSARsFiledYTD: 7,
        highRiskClientCount: 34,
        currentWatchlistHits: 3,
      },
      agentInputs: [
        {
          requestType: 'suspicious_activity_analysis',
          flaggedAccounts: [
            {
              accountRef: 'ACCT-0471',
              clientRiskRating: 'high',
              transactionPattern: 'structuring',
              transactions: [
                { date: '2025-11-01', amount: 9800, type: 'cash_deposit', currency: 'USD' },
                { date: '2025-11-03', amount: 9600, type: 'cash_deposit', currency: 'USD' },
                { date: '2025-11-07', amount: 9500, type: 'cash_deposit', currency: 'USD' },
                { date: '2025-11-12', amount: 9750, type: 'cash_deposit', currency: 'USD' },
              ],
              totalAmount30Days: 38650,
              ctrFiledPrior: false,
            },
            {
              accountRef: 'ACCT-1882',
              clientRiskRating: 'medium',
              transactionPattern: 'layering',
              transactions: [
                {
                  date: '2025-11-05',
                  amount: 250000,
                  type: 'wire_in',
                  currency: 'USD',
                  originCountry: 'NG',
                },
                {
                  date: '2025-11-06',
                  amount: 248000,
                  type: 'wire_out',
                  currency: 'USD',
                  destinationCountry: 'AE',
                },
              ],
              totalAmount30Days: 498000,
            },
          ],
          sarThreshold: 5000,
          sarThresholdCurrency: 'USD',
        },
      ],
      groundTruth: {
        sarRequired: true,
        accountsRequiringSAR: ['ACCT-0471', 'ACCT-1882'],
        primaryActivity: {
          'ACCT-0471': 'structuring_below_CTR_threshold',
          'ACCT-1882': 'layering_high_risk_jurisdictions',
        },
        sarFilingDeadline: '2025-12-28',
        escalateToMLRO: true,
        accountAction: 'enhanced_monitoring',
        confidence: 0.93,
      },
      metadata: {
        capturedFrom: 'prism-compliance-2025-11-28',
        reviewedBy: 'mlro',
        verified: true,
      },
    },
    {
      id: 'snap-prism-002',
      scenarioId: 'prism-sar-filing-workflow-v1',
      label: 'SAR narrative drafting — ACCT-0471 structuring',
      domain: 'prism',
      snapshotType: 'flow',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-11-28T14:20:00Z',
      tags: ['sar-narrative', 'fincen', 'structuring', 'artifact-generation'],
      historicalContext: {
        accountRef: 'ACCT-0471',
        sarFormVersion: 'FinCEN SAR 111 rev.2022',
        filingDeadline: '2025-12-28',
        mlroApprovalReceived: true,
        priorRelatedSARs: 0,
      },
      agentInputs: [
        {
          requestType: 'sar_narrative_draft',
          accountRef: 'ACCT-0471',
          activityType: 'structuring',
          transactionSummary:
            'Four cash deposits totalling $38,650 over 12 days, each below $10,000 CTR threshold',
          suspicionBasis: [
            'transactions_structured_to_avoid_CTR',
            'no_apparent_business_purpose',
            'high_risk_profile',
          ],
          narrativeGuidelines: 'FinCEN SAR narrative guidance 2022',
        },
      ],
      groundTruth: {
        narrativeGenerated: true,
        requiredElements: [
          'description_of_suspicious_activity',
          'transaction_details_with_dates_and_amounts',
          'why_activity_is_suspicious',
          'any_explanation_provided_by_subject',
          'action_taken_by_institution',
        ],
        wordCountRange: { min: 150, max: 500 },
        containsSpecificAmounts: true,
        containsDateRange: true,
        avoidsConclusoryLanguage: true,
        piiProperlyHandled: true,
      },
      metadata: {
        templateVersion: 'sar-narrative-v3',
        reviewedBy: 'mlro',
      },
    },
    {
      id: 'snap-prism-003',
      scenarioId: 'prism-sar-filing-workflow-v1',
      label: 'Post-SAR filing review and tipping-off guardrail check',
      domain: 'prism',
      snapshotType: 'audit',
      version: '1.0',
      sanitized: true,
      createdAt: '2025-12-10T11:00:00Z',
      tags: ['sar-filed', 'tipping-off', 'guardrail', 'post-filing'],
      historicalContext: {
        sarFileDate: '2025-12-10',
        sarRef: 'SAR-2025-0047',
        filedBy: 'mlro',
        subjectNotified: false,
        relatedAccountsMonitored: true,
      },
      agentInputs: [
        {
          requestType: 'post_sar_guardrail_review',
          sarRef: 'SAR-2025-0047',
          proposedActions: [
            { action: 'send_account_closure_notice_to_client', risk: 'tipping_off' },
            { action: 'freeze_account_quietly', risk: 'none' },
            { action: 'escalate_to_law_enforcement', risk: 'none' },
          ],
        },
      ],
      groundTruth: {
        blockedActions: ['send_account_closure_notice_to_client'],
        blockedReason: 'tipping_off_prohibition_under_BSA_31USC5318',
        permittedActions: ['freeze_account_quietly', 'escalate_to_law_enforcement'],
        guardrailTriggered: true,
        complianceStatus: 'protected_under_safe_harbor',
      },
      metadata: {
        reviewedBy: 'general-counsel',
        verified: true,
      },
    },
  ],
};

registerScenario(PrismSARFilingScenario);

const PrismComplianceBreachScenario: ScenarioDefinition = {
  id: 'prism-compliance-breach-response-v1',
  name: 'Prism Counsel — Compliance Breach Response',
  domain: 'prism',
  description:
    'A regulatory data breach notification scenario where the agent identifies GDPR breach severity, calculates the 72-hour reporting window, drafts the supervisory authority notification, and tracks remediation obligations. Tests regulatory deadline reasoning, severity classification, and notification quality.',
  tags: ['compliance', 'gdpr', 'data-breach', 'notification', 'regulatory', 'ground-truth'],
  snapshots: [
    {
      id: 'snap-prism-004',
      scenarioId: 'prism-compliance-breach-response-v1',
      label: 'GDPR breach classification — unauthorised access to client records',
      domain: 'prism',
      snapshotType: 'incident',
      version: '1.0',
      sanitized: true,
      createdAt: '2026-02-11T03:47:00Z',
      tags: ['gdpr', 'data-breach', 'severity-classification', '72-hour-clock'],
      historicalContext: {
        organisation: 'SZL Holdings EU Entity',
        supervisoryAuthority: 'ICO',
        lastBreachNotification: '2024-08-14',
        gdprComplianceScore: 82,
        dpoAppointed: true,
        privacyNoticeVersion: 'v3.1',
        incidentResponsePlanVersion: 'IRP-2025-v2',
      },
      agentInputs: [
        {
          requestType: 'breach_classification',
          breachDiscoveredAt: '2026-02-11T03:47:00Z',
          breachDescription:
            'Unauthorised access to CRM database via compromised service account. Attacker exfiltrated records for approximately 2,400 clients including names, email addresses, portfolio values, and national identification numbers.',
          affectedDataCategories: ['name', 'email', 'portfolio_value', 'national_id'],
          affectedDataSubjectCount: 2400,
          dataSubjectCategories: ['retail_investors', 'hnwi'],
          containedAt: '2026-02-11T05:12:00Z',
          attackVector: 'compromised_service_account',
          dataExfiltrated: true,
          encryptionAtRest: false,
        },
      ],
      groundTruth: {
        breachSeverity: 'high',
        notificationRequired: true,
        supervisoryAuthorityNotificationDeadline: '2026-02-14T03:47:00Z',
        hoursRemaining: 72,
        dataSubjectNotificationRequired: true,
        dataSubjectNotificationBasis: 'high_risk_to_rights_and_freedoms',
        riskToDataSubjects: 'high',
        riskFactors: ['national_id_exfiltrated', 'no_encryption_at_rest', 'hnwi_data_exposed'],
        immediateActions: [
          'reset_all_service_account_credentials',
          'isolate_crm_system',
          'preserve_forensic_evidence',
        ],
        confidence: 0.96,
      },
      metadata: {
        capturedFrom: 'prism-incident-2026-02-11',
        reviewedBy: 'dpo',
        verified: true,
      },
    },
    {
      id: 'snap-prism-005',
      scenarioId: 'prism-compliance-breach-response-v1',
      label: 'ICO notification draft — Article 33 mandatory report',
      domain: 'prism',
      snapshotType: 'flow',
      version: '1.0',
      sanitized: true,
      createdAt: '2026-02-11T09:30:00Z',
      tags: ['ico-notification', 'article-33', 'gdpr', 'regulatory-report'],
      historicalContext: {
        breachRef: 'BREACH-2026-0004',
        hoursElapsedSinceDiscovery: 5.7,
        deadlineHoursRemaining: 66.3,
        icoPortalVersion: 'Report a Breach v2.1',
        dpoNotified: true,
        ceoNotified: true,
      },
      agentInputs: [
        {
          requestType: 'ico_notification_draft',
          breachRef: 'BREACH-2026-0004',
          audience: 'supervisory_authority',
          reportingObligation: 'GDPR Article 33',
          knownFacts: {
            natureOfBreach: 'confidentiality_and_integrity',
            categoriesOfData: ['name', 'email', 'portfolio_value', 'national_id'],
            approximateRecords: 2400,
            likelyConsequences: 'identity_theft_financial_fraud_reputational_harm',
            measuresTaken: [
              'service_account_reset',
              'crm_isolation',
              'forensic_investigation_initiated',
            ],
          },
        },
      ],
      groundTruth: {
        reportGenerated: true,
        requiredSections: [
          'nature_of_breach',
          'categories_and_numbers_of_data_subjects',
          'categories_and_numbers_of_records',
          'dpo_contact_details',
          'likely_consequences',
          'measures_taken_or_proposed',
        ],
        phrasing: 'factual_and_not_speculative',
        timelySubmission: true,
        containsContactDetails: true,
        containsRemediationPlan: true,
      },
      metadata: {
        templateVersion: 'ico-article33-v2',
        reviewedBy: 'dpo',
        verified: true,
      },
    },
    {
      id: 'snap-prism-006',
      scenarioId: 'prism-compliance-breach-response-v1',
      label: 'Data subject notification decision — Article 34 threshold',
      domain: 'prism',
      snapshotType: 'decision',
      version: '1.0',
      sanitized: true,
      createdAt: '2026-02-12T10:00:00Z',
      tags: ['article-34', 'data-subject-notification', 'gdpr', 'threshold'],
      historicalContext: {
        icoNotifiedAt: '2026-02-11T14:22:00Z',
        forensicReportReceived: false,
        attackerIdentified: false,
        dataRecoveryStatus: 'not_recovered',
        affectedClientPortals: 'temporarily_suspended',
      },
      agentInputs: [
        {
          requestType: 'article34_notification_decision',
          breachRef: 'BREACH-2026-0004',
          riskAssessment: {
            likelihoodOfHarm: 'high',
            severityOfHarm: 'high',
            mitigationApplied: 'none_post_exfiltration',
            vulnerableSubjectsAffected: false,
          },
          proposedExceptions: ['sufficient_technical_measures_applied'],
          exceptionBasis: null,
        },
      ],
      groundTruth: {
        dataSubjectNotificationMandatory: true,
        exceptionApplicable: false,
        exceptionRejectionReason:
          'encryption_was_not_in_place_at_breach_time_so_technical_measure_exception_does_not_apply',
        notificationDeadline: 'without_undue_delay',
        notificationChannels: ['email', 'secure_portal_message'],
        notificationContentRequired: [
          'nature_of_breach',
          'contact_of_dpo',
          'likely_consequences',
          'protective_measures_advised',
        ],
        agentWasCorrect: true,
        confidence: 0.94,
      },
      metadata: {
        reviewedBy: 'dpo',
        verified: true,
      },
    },
  ],
};

registerScenario(PrismComplianceBreachScenario);

export {
  AegisSOCThreatScenario,
  PrismComplianceBreachScenario,
  PrismSARFilingScenario,
  TerraAssetValuationScenario,
  TerraPortfolioStressScenario,
  VesselsCharterNegotiationScenario,
  VesselsVoyagePnLScenario,
};

export function getSeededScenarios(): ScenarioDefinition[] {
  return listScenarios();
}
