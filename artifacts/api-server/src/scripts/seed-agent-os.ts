import {
  a2aAgentCards,
  a2aAgentHeartbeats,
  a2aDelegationTasks,
  a2aDiscoveryQueries,
  advisoryAudit,
  agentBehaviorPrefs,
  agentFeedback,
  agentKnowledgeTable,
  agentRunsTable,
  agentTrainingPairs,
  alloyAgentPerformanceSnapshots,
  alloyConfidenceAlerts,
  alloyDecisionOutcomes,
  alloySkillRegistryTable,
  db,
  fineTunedModelRegistry,
  fineTuningDatasets,
  fineTuningJobs,
} from '@szl-holdings/db';
import { randomUUID } from 'node:crypto';

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}

export async function seedAgentOS() {

  const existing = await db.select({ id: a2aAgentCards.id }).from(a2aAgentCards).limit(1);
  if (existing.length > 0) {
    return { skipped: true };
  }

  const _agentCards = await db
    .insert(a2aAgentCards)
    .values([
      {
        agentId: 'lyte-signal-agent',
        name: 'Lyte Signal Detection Agent',
        domain: 'lyte',
        version: '2.1.0',
        description:
          'Monitors platform signals across all domains — detects anomalies, generates actionable alerts, and routes to appropriate decision makers.',
        capabilities: [
          'signal_detection',
          'anomaly_scoring',
          'alert_routing',
          'trend_analysis',
          'executive_summarization',
        ],
        preferredModel: 'claude-sonnet-4-5',
        preferredProvider: 'anthropic',
        collaboratesWith: ['prism-forecast-agent', 'vessels-route-analyzer', 'aegis-threat-intel'],
        costPerCallUsd: 0.028,
        avgLatencyMs: 2400,
        successRate: 0.97,
        status: 'online',
        lastHeartbeatAt: new Date(),
      },
      {
        agentId: 'prism-forecast-agent',
        name: 'PRISM Settlement Forecast Agent',
        domain: 'prism_counsel',
        version: '1.4.0',
        description:
          'Analyzes legal matter data to generate settlement range forecasts, demand readiness scores, and next-best-action recommendations for plaintiff law firms.',
        capabilities: [
          'settlement_forecasting',
          'demand_readiness_scoring',
          'lien_analysis',
          'deadline_risk_assessment',
          'offer_movement_prediction',
        ],
        preferredModel: 'claude-opus-4-5',
        preferredProvider: 'anthropic',
        collaboratesWith: ['lyte-signal-agent', 'document-intelligence-agent'],
        costPerCallUsd: 0.142,
        avgLatencyMs: 4800,
        successRate: 0.94,
        status: 'online',
        lastHeartbeatAt: new Date(),
      },
      {
        agentId: 'vessels-route-analyzer',
        name: 'Vessels Route Intelligence Agent',
        domain: 'vessels',
        version: '1.8.0',
        description:
          'Real-time maritime route analysis — evaluates weather, port congestion, fuel optimization, and geopolitical risk for active vessel voyages.',
        capabilities: [
          'route_optimization',
          'weather_risk_assessment',
          'fuel_optimization',
          'port_congestion_prediction',
          'eta_forecasting',
        ],
        preferredModel: 'claude-sonnet-4-5',
        preferredProvider: 'anthropic',
        collaboratesWith: ['lyte-signal-agent', 'marine-insurance-pricer'],
        costPerCallUsd: 0.031,
        avgLatencyMs: 3200,
        successRate: 0.96,
        status: 'online',
        lastHeartbeatAt: new Date(),
      },
      {
        agentId: 'aegis-threat-intel',
        name: 'Aegis Threat Intelligence Agent',
        domain: 'aegis',
        version: '1.2.0',
        description:
          'Cybersecurity threat detection and analysis — processes security signals, maps to MITRE ATT&CK framework, and generates prioritized remediation guidance.',
        capabilities: [
          'threat_detection',
          'mitre_mapping',
          'cve_analysis',
          'incident_triage',
          'compliance_assessment',
        ],
        preferredModel: 'claude-sonnet-4-5',
        preferredProvider: 'anthropic',
        collaboratesWith: ['lyte-signal-agent'],
        costPerCallUsd: 0.048,
        avgLatencyMs: 3800,
        successRate: 0.95,
        status: 'online',
        lastHeartbeatAt: new Date(),
      },
      {
        agentId: 'terra-distress-scorer',
        name: 'Terra Distress Property Scorer',
        domain: 'terra',
        version: '1.1.0',
        description:
          'Evaluates distressed real estate opportunities — scores properties on equity cushion, distress depth, market demand, and investment timeline.',
        capabilities: [
          'property_scoring',
          'equity_analysis',
          'distress_classification',
          'market_demand_assessment',
          'outreach_prioritization',
        ],
        preferredModel: 'gpt-4o-mini',
        preferredProvider: 'openai',
        collaboratesWith: ['lyte-signal-agent'],
        costPerCallUsd: 0.008,
        avgLatencyMs: 1200,
        successRate: 0.98,
        status: 'online',
        lastHeartbeatAt: new Date(),
      },
      {
        agentId: 'marine-insurance-pricer',
        name: 'Marine Insurance Risk & Pricing Agent',
        domain: 'vessels',
        version: '1.0.0',
        description:
          'Computes marine insurance risk scores and generates premium pricing for cargo, hull, and P&I coverage requests.',
        capabilities: [
          'risk_scoring',
          'premium_calculation',
          'route_chokepoint_analysis',
          'cargo_hazard_assessment',
          'vessel_profile_analysis',
        ],
        preferredModel: 'gpt-4o',
        preferredProvider: 'openai',
        collaboratesWith: ['vessels-route-analyzer'],
        costPerCallUsd: 0.012,
        avgLatencyMs: 1800,
        successRate: 0.97,
        status: 'online',
        lastHeartbeatAt: new Date(),
      },
      {
        agentId: 'document-intelligence-agent',
        name: 'Document Intelligence Agent',
        domain: 'prism_counsel',
        version: '2.0.0',
        description:
          'Extracts structured facts from legal documents — medical records, police reports, pleadings, and correspondence — for matter building and chronology construction.',
        capabilities: [
          'document_extraction',
          'fact_structuring',
          'chronology_building',
          'privilege_detection',
          'inconsistency_flagging',
        ],
        preferredModel: 'claude-sonnet-4-5',
        preferredProvider: 'anthropic',
        collaboratesWith: ['prism-forecast-agent'],
        costPerCallUsd: 0.038,
        avgLatencyMs: 5200,
        successRate: 0.92,
        status: 'online',
        lastHeartbeatAt: new Date(),
      },
      {
        agentId: 'communication-agent',
        name: 'Communication & Notification Agent',
        domain: 'platform',
        version: '1.3.0',
        description:
          'Routes notifications, drafts communications, and manages alert delivery across all platform domains.',
        capabilities: [
          'notification_routing',
          'email_drafting',
          'slack_delivery',
          'alert_prioritization',
          'digest_generation',
        ],
        preferredModel: 'gpt-4o-mini',
        preferredProvider: 'openai',
        collaboratesWith: ['lyte-signal-agent', 'prism-forecast-agent'],
        costPerCallUsd: 0.004,
        avgLatencyMs: 800,
        successRate: 0.99,
        status: 'online',
        lastHeartbeatAt: new Date(),
      },
    ])
    .onConflictDoNothing()
    .returning();

  await db.insert(a2aAgentHeartbeats).values([
    {
      agentId: 'lyte-signal-agent',
      status: 'online',
      load: 0.32,
      activeTasks: 2,
      uptimeMs: 8640000,
    },
    {
      agentId: 'prism-forecast-agent',
      status: 'online',
      load: 0.18,
      activeTasks: 1,
      uptimeMs: 8640000,
    },
    {
      agentId: 'vessels-route-analyzer',
      status: 'online',
      load: 0.41,
      activeTasks: 3,
      uptimeMs: 8640000,
    },
    {
      agentId: 'aegis-threat-intel',
      status: 'online',
      load: 0.28,
      activeTasks: 2,
      uptimeMs: 8640000,
    },
    {
      agentId: 'terra-distress-scorer',
      status: 'online',
      load: 0.08,
      activeTasks: 0,
      uptimeMs: 8640000,
    },
    {
      agentId: 'marine-insurance-pricer',
      status: 'online',
      load: 0.15,
      activeTasks: 1,
      uptimeMs: 8640000,
    },
    {
      agentId: 'document-intelligence-agent',
      status: 'online',
      load: 0.55,
      activeTasks: 4,
      uptimeMs: 8640000,
    },
    {
      agentId: 'communication-agent',
      status: 'online',
      load: 0.12,
      activeTasks: 1,
      uptimeMs: 8640000,
    },
  ]);

  const now = Date.now();
  await db.insert(a2aDelegationTasks).values([
    {
      taskId: `task-${randomUUID().slice(0, 8)}`,
      requestingAgentId: 'lyte-signal-agent',
      targetAgentId: 'prism-forecast-agent',
      query:
        'Update settlement forecast for matter PC-2024-0081 based on new MRI report received today.',
      context:
        'Medical records added: new MRI confirms disc herniation C5-C6 with nerve root compression. Damages estimate increase expected.',
      status: 'completed',
      priority: 'high',
      result:
        'Settlement range updated: $95K–$280K → $110K–$320K. Demand readiness score increased 4 points to 79.',
      resultConfidence: 0.88,
      timeoutMs: 30000,
      requestedAt: now - 3600000,
      acceptedAt: now - 3595000,
      completedAt: now - 3572000,
      durationMs: 23000,
    },
    {
      taskId: `task-${randomUUID().slice(0, 8)}`,
      requestingAgentId: 'vessels-route-analyzer',
      targetAgentId: 'marine-insurance-pricer',
      query:
        'Request updated risk assessment for SS Pacific Guardian voyage — typhoon warning issued in South China Sea.',
      context:
        'NWS typhoon track shows Category 2 system developing. Expected route intercept in 72 hours. Current policy MIP-2026-NOR-0043.',
      status: 'completed',
      priority: 'critical',
      result:
        'Risk score updated: 45.3 → 68.2. Recommend additional war risk endorsement $42,000. Carrier notified.',
      resultConfidence: 0.91,
      timeoutMs: 30000,
      requestedAt: now - 1800000,
      acceptedAt: now - 1795000,
      completedAt: now - 1762000,
      durationMs: 33000,
    },
    {
      taskId: `task-${randomUUID().slice(0, 8)}`,
      requestingAgentId: 'aegis-threat-intel',
      targetAgentId: 'lyte-signal-agent',
      query:
        'Escalate critical security finding: Redis cluster accessible without authentication in production.',
      context:
        'Aegis scan found prod-redis-cluster accepting connections without AUTH from any internal host. CVSS 9.8. Immediate action required.',
      status: 'completed',
      priority: 'critical',
      result:
        'Critical signal created in Lyte. Assigned to Platform team with 4-hour SLA. Executive notification sent.',
      resultConfidence: 0.99,
      timeoutMs: 15000,
      requestedAt: now - 900000,
      acceptedAt: now - 898000,
      completedAt: now - 885000,
      durationMs: 13000,
    },
    {
      taskId: `task-${randomUUID().slice(0, 8)}`,
      requestingAgentId: 'lyte-signal-agent',
      targetAgentId: 'communication-agent',
      query:
        'Send weekly portfolio digest to Stephen L. — include signals summary, PRISM matter updates, and vessel exception status.',
      context:
        'Weekly digest window: 2026-04-08 to 2026-04-15. Include 5 critical/high signals, 3 PRISM AI recommendations, 4 vessel exceptions.',
      status: 'running',
      priority: 'normal',
      timeoutMs: 60000,
      requestedAt: now - 120000,
    },
  ]);

  await db.insert(a2aDiscoveryQueries).values([
    {
      queryId: `disc-${randomUUID().slice(0, 8)}`,
      requestingAgentId: 'lyte-signal-agent',
      capability: 'settlement_forecasting',
      domain: 'prism_counsel',
      queryText:
        'Find agent capable of generating settlement range forecast for plaintiff legal matter',
      resultCount: 1,
      topMatchAgentId: 'prism-forecast-agent',
    },
    {
      queryId: `disc-${randomUUID().slice(0, 8)}`,
      requestingAgentId: 'vessels-route-analyzer',
      capability: 'risk_scoring',
      domain: 'vessels',
      queryText: 'Find agent capable of marine insurance risk assessment and premium calculation',
      resultCount: 1,
      topMatchAgentId: 'marine-insurance-pricer',
    },
    {
      queryId: `disc-${randomUUID().slice(0, 8)}`,
      requestingAgentId: 'document-intelligence-agent',
      capability: 'fact_structuring',
      domain: 'prism_counsel',
      queryText: 'Find agent capable of extracting structured facts from medical records',
      resultCount: 1,
      topMatchAgentId: 'document-intelligence-agent',
    },
  ]);

  await db
    .insert(alloySkillRegistryTable)
    .values([
      {
        skillId: 'skill-settlement-forecast-v1',
        name: 'Settlement Range Forecaster',
        version: '1.4.0',
        capability: 'settlement_forecasting',
        domain: 'prism_counsel',
        description:
          'Computes probabilistic settlement range (low/mid/high) for a plaintiff legal matter using medical specials, liability strength, venue velocity, and insurer behavior signals.',
        triggerConditions: [
          'matter_created',
          'damages_updated',
          'medical_record_added',
          'offer_received',
        ],
        requiredInputs: ['matter_id', 'total_damages', 'liability_strength', 'jurisdiction'],
        optionalInputs: ['insurer_behavior_history', 'prior_offers', 'lien_amounts'],
        outputSchema: [
          { field: 'settlement_low', type: 'number' },
          { field: 'settlement_mid', type: 'number' },
          { field: 'settlement_high', type: 'number' },
          { field: 'confidence', type: 'number' },
        ],
        outputDecisionType: 'recommendation',
        analyticMode: 'generative',
        policyClass: 'attorney_review_required',
        estimatedLatencyMs: 4800,
        tags: ['legal', 'prism', 'settlement', 'forecast'],
        isBuiltin: true,
        isActive: true,
        registeredBy: 'system',
      },
      {
        skillId: 'skill-route-optimizer-v1',
        name: 'Maritime Route Optimizer',
        version: '1.8.0',
        capability: 'route_optimization',
        domain: 'vessels',
        description:
          'Evaluates vessel voyage routes against weather forecasts, port congestion data, and fuel pricing to recommend optimal routing and speed profile.',
        triggerConditions: ['voyage_created', 'weather_alert_issued', 'port_congestion_updated'],
        requiredInputs: ['vessel_id', 'voyage_origin', 'voyage_destination', 'cargo_type'],
        optionalInputs: [
          'fuel_price_at_bunker_ports',
          'charter_speed_constraint',
          'weather_routing_preference',
        ],
        outputSchema: [
          { field: 'recommended_route', type: 'object' },
          { field: 'estimated_fuel_saving_usd', type: 'number' },
          { field: 'eta_range', type: 'object' },
        ],
        outputDecisionType: 'recommendation',
        analyticMode: 'analytical',
        policyClass: 'operator_review',
        estimatedLatencyMs: 3200,
        tags: ['vessels', 'maritime', 'route', 'optimization'],
        isBuiltin: true,
        isActive: true,
        registeredBy: 'system',
      },
      {
        skillId: 'skill-threat-classifier-v1',
        name: 'Security Threat Classifier',
        version: '1.2.0',
        capability: 'threat_detection',
        domain: 'aegis',
        description:
          'Classifies security alerts by severity, MITRE ATT&CK tactic, and affected asset — generates remediation priority score and recommended next action.',
        triggerConditions: [
          'security_alert_created',
          'finding_severity_changed',
          'cve_alert_received',
        ],
        requiredInputs: ['alert_data', 'affected_asset', 'environment'],
        optionalInputs: ['prior_incidents', 'asset_criticality'],
        outputSchema: [
          { field: 'severity', type: 'string' },
          { field: 'mitre_tactic', type: 'string' },
          { field: 'priority_score', type: 'number' },
          { field: 'remediation', type: 'string' },
        ],
        outputDecisionType: 'classification',
        analyticMode: 'analytical',
        policyClass: 'auto_execute',
        estimatedLatencyMs: 2800,
        tags: ['security', 'aegis', 'threat', 'mitre'],
        isBuiltin: true,
        isActive: true,
        registeredBy: 'system',
      },
      {
        skillId: 'skill-demand-readiness-v1',
        name: 'Demand Packet Readiness Scorer',
        version: '1.0.0',
        capability: 'demand_readiness_scoring',
        domain: 'prism_counsel',
        description:
          'Evaluates whether a plaintiff legal matter has sufficient evidence, documentation, and lien resolution to support sending a formal demand.',
        triggerConditions: ['matter_status_changed', 'document_added', 'lien_resolved'],
        requiredInputs: ['matter_id'],
        optionalInputs: ['target_demand_amount'],
        outputSchema: [
          { field: 'readiness_score', type: 'number' },
          { field: 'missing_items', type: 'array' },
          { field: 'blocking_items', type: 'array' },
        ],
        outputDecisionType: 'readiness_assessment',
        analyticMode: 'analytical',
        policyClass: 'attorney_review_required',
        estimatedLatencyMs: 2200,
        tags: ['legal', 'prism', 'demand', 'readiness'],
        isBuiltin: true,
        isActive: true,
        registeredBy: 'system',
      },
      {
        skillId: 'skill-distress-scorer-v1',
        name: 'Property Distress Opportunity Scorer',
        version: '1.1.0',
        capability: 'property_scoring',
        domain: 'terra',
        description:
          'Scores distressed properties on investment opportunity — equity cushion, distress stage urgency, market demand, and off-market outreach potential.',
        triggerConditions: ['property_ingested', 'property_status_updated'],
        requiredInputs: ['property_data'],
        optionalInputs: ['market_comparables'],
        outputSchema: [
          { field: 'opportunity_score', type: 'number' },
          { field: 'confidence_level', type: 'string' },
          { field: 'score_rationale', type: 'string' },
        ],
        outputDecisionType: 'scoring',
        analyticMode: 'analytical',
        policyClass: 'auto_execute',
        estimatedLatencyMs: 1200,
        tags: ['terra', 'real-estate', 'distress', 'scoring'],
        isBuiltin: true,
        isActive: true,
        registeredBy: 'system',
      },
    ])
    .onConflictDoNothing()
    .returning();

  await db.insert(alloyDecisionOutcomes).values([
    {
      decisionId: `dec-${randomUUID().slice(0, 8)}`,
      agentId: 'prism-forecast-agent',
      tenantId: 'szl-holdings',
      skillId: 'skill-settlement-forecast-v1',
      capability: 'settlement_forecasting',
      predictedConfidence: 0.87,
      actualOutcome: 'settlement_achieved',
      wasActedOn: true,
      wasOverridden: false,
      predictedImpactLevel: 'high',
      actualImpactLevel: 'high',
      recommendedAction:
        'Send demand at $290,000 — insurer likely to respond favorably within 30 days',
      finalAction: 'Demand sent at $350,000 (attorney override)',
      executionResult: 'Insurer responded with $225,000 counter offer',
      humanReviewRequired: true,
      humanReviewRequested: true,
      decisionType: 'settlement_demand',
    },
    {
      decisionId: `dec-${randomUUID().slice(0, 8)}`,
      agentId: 'vessels-route-analyzer',
      tenantId: 'szl-holdings',
      skillId: 'skill-route-optimizer-v1',
      capability: 'route_optimization',
      predictedConfidence: 0.92,
      actualOutcome: 'fuel_saved',
      wasActedOn: true,
      wasOverridden: false,
      predictedImpactLevel: 'medium',
      actualImpactLevel: 'medium',
      recommendedAction:
        'Reduce speed to 12.5 knots and route via Azores waypoint — saves $18,400 fuel vs. direct great circle',
      finalAction: 'Routing recommendation accepted by fleet ops',
      executionResult: 'Voyage completed with $16,200 fuel saving — 88% of predicted',
      humanReviewRequired: false,
      decisionType: 'route_optimization',
    },
    {
      decisionId: `dec-${randomUUID().slice(0, 8)}`,
      agentId: 'aegis-threat-intel',
      tenantId: 'szl-holdings',
      skillId: 'skill-threat-classifier-v1',
      capability: 'threat_detection',
      predictedConfidence: 0.99,
      actualOutcome: 'threat_remediated',
      wasActedOn: true,
      wasOverridden: false,
      predictedImpactLevel: 'critical',
      actualImpactLevel: 'critical',
      recommendedAction:
        'Immediately restrict Redis cluster to authenticated connections. Rotate all service account credentials.',
      finalAction: 'Redis AUTH enabled and credentials rotated within 2 hours',
      executionResult: 'Vulnerability remediated — no unauthorized access detected in audit logs',
      humanReviewRequired: false,
      decisionType: 'security_remediation',
    },
    {
      decisionId: `dec-${randomUUID().slice(0, 8)}`,
      agentId: 'terra-distress-scorer',
      tenantId: 'szl-holdings',
      skillId: 'skill-distress-scorer-v1',
      capability: 'property_scoring',
      predictedConfidence: 0.84,
      actualOutcome: 'lead_converted',
      wasActedOn: true,
      wasOverridden: false,
      predictedImpactLevel: 'medium',
      actualImpactLevel: 'high',
      recommendedAction:
        'Priority outreach to owner of 234 W 145th St — auction in 11 days, score 92/100',
      finalAction: 'Direct mail + agent contact attempted. Owner responded to agent contact.',
      executionResult: 'Owner agreed to off-market negotiation at $3.8M — auction avoided',
      humanReviewRequired: false,
      decisionType: 'distress_outreach',
    },
  ]);

  await db.insert(alloyAgentPerformanceSnapshots).values([
    {
      agentId: 'prism-forecast-agent',
      tenantId: 'szl-holdings',
      windowDays: 30,
      totalDecisions: 47,
      acceptanceRate: 0.81,
      overrideRate: 0.13,
      rejectionRate: 0.06,
      weightedAccuracyScore: 0.84,
      meanPredictedConfidence: 0.86,
      meanActualAcceptanceRate: 0.81,
      calibrationBias: -0.05,
      calibrationVerdict: 'well_calibrated',
      overallHealthScore: 0.87,
      healthLabel: 'excellent',
      flags: [],
      trend: 'improving',
    },
    {
      agentId: 'vessels-route-analyzer',
      tenantId: 'szl-holdings',
      windowDays: 30,
      totalDecisions: 82,
      acceptanceRate: 0.94,
      overrideRate: 0.04,
      rejectionRate: 0.02,
      weightedAccuracyScore: 0.91,
      meanPredictedConfidence: 0.89,
      meanActualAcceptanceRate: 0.94,
      calibrationBias: 0.05,
      calibrationVerdict: 'slight_underconfidence',
      overallHealthScore: 0.92,
      healthLabel: 'excellent',
      flags: [],
      trend: 'stable',
    },
    {
      agentId: 'aegis-threat-intel',
      tenantId: 'szl-holdings',
      windowDays: 30,
      totalDecisions: 138,
      acceptanceRate: 0.97,
      overrideRate: 0.02,
      rejectionRate: 0.01,
      weightedAccuracyScore: 0.96,
      meanPredictedConfidence: 0.94,
      meanActualAcceptanceRate: 0.97,
      calibrationBias: 0.03,
      calibrationVerdict: 'well_calibrated',
      overallHealthScore: 0.96,
      healthLabel: 'excellent',
      flags: [],
      trend: 'stable',
    },
    {
      agentId: 'terra-distress-scorer',
      tenantId: 'szl-holdings',
      windowDays: 30,
      totalDecisions: 214,
      acceptanceRate: 0.88,
      overrideRate: 0.08,
      rejectionRate: 0.04,
      weightedAccuracyScore: 0.86,
      meanPredictedConfidence: 0.82,
      meanActualAcceptanceRate: 0.88,
      calibrationBias: 0.06,
      calibrationVerdict: 'slight_underconfidence',
      overallHealthScore: 0.88,
      healthLabel: 'good',
      flags: ['low_sample_for_high_confidence_tier'],
      trend: 'improving',
    },
  ]);

  await db.insert(alloyConfidenceAlerts).values([
    {
      alertId: `alert-${randomUUID().slice(0, 8)}`,
      agentId: 'prism-forecast-agent',
      tenantId: 'szl-holdings',
      alertType: 'override_pattern',
      severity: 'warning',
      title: 'High Override Rate — Settlement Forecasts',
      description:
        '13% override rate on settlement forecasts — attorneys consistently increasing demand above AI recommendation. Review calibration for NY Supreme Court cases.',
      currentValue: 0.13,
      threshold: 0.1,
      trend: 'worsening',
      recommendedAction:
        'Review forecast calibration for NY Supreme Court premises liability cases. Consider adding venue-specific adjustment factor.',
      requiresHumanReview: true,
      autoResolvable: false,
      metadata: { affectedCaseType: 'premises_liability', jurisdiction: 'NY Supreme Court' },
    },
    {
      alertId: `alert-${randomUUID().slice(0, 8)}`,
      agentId: 'terra-distress-scorer',
      tenantId: 'szl-holdings',
      alertType: 'low_sample_tier',
      severity: 'info',
      title: 'Low Sample Count — High Confidence Tier',
      description:
        'High confidence tier (>90 score) has only 12 data points. Confidence calibration may be unreliable at extremes.',
      currentValue: 12,
      threshold: 30,
      trend: 'stable',
      recommendedAction:
        'Collect more high-confidence tier data points before relying on calibration at this score range. Flag predictions >90 for human review.',
      requiresHumanReview: false,
      autoResolvable: true,
      metadata: { tier: 'high_confidence', minRequired: 30 },
    },
  ]);

  await db.insert(agentKnowledgeTable).values([
    {
      entryId: `know-${randomUUID().slice(0, 8)}`,
      type: 'pattern',
      domain: 'prism_counsel',
      sourceAgent: 'prism-forecast-agent',
      title: 'NY Supreme Court — Travelers Insurance Negotiation Pattern',
      summary:
        'Travelers consistently makes first offer at 24–28% of demand amount for NYC premises liability claims. Typical settlement reached at 62–71% of demand after 2–3 rounds of negotiation.',
      confidence: 0.84,
      tags: ['travelers', 'premises', 'ny-supreme-court', 'negotiation'],
      relatedEntryIds: [],
      timestamp: Date.now() - 7200000,
    },
    {
      entryId: `know-${randomUUID().slice(0, 8)}`,
      type: 'insight',
      domain: 'vessels',
      sourceAgent: 'vessels-route-analyzer',
      title: 'LA Port Congestion — Peak Window Q2 2026',
      summary:
        'Port of Los Angeles experiencing 3.8–4.5 day anchor wait times for container vessels arriving on Tuesdays–Thursdays. Friday and weekend arrivals average 1.2 days. Recommend adjusting speed to target Friday arrival windows.',
      confidence: 0.91,
      tags: ['la-port', 'congestion', 'container', 'routing'],
      relatedEntryIds: [],
      timestamp: Date.now() - 86400000,
    },
    {
      entryId: `know-${randomUUID().slice(0, 8)}`,
      type: 'fact',
      domain: 'aegis',
      sourceAgent: 'aegis-threat-intel',
      title: 'Redis Without Auth — Production Risk Pattern',
      summary:
        'Multiple organizations running Redis in production without AUTH. Default configuration does not require authentication. This is consistently rated CVSS 9.8 when internet-reachable or accessible to lateral movement paths.',
      confidence: 0.99,
      tags: ['redis', 'authentication', 'critical-vulnerability', 'production'],
      relatedEntryIds: [],
      timestamp: Date.now() - 3600000,
    },
    {
      entryId: `know-${randomUUID().slice(0, 8)}`,
      type: 'trend',
      domain: 'terra',
      sourceAgent: 'terra-distress-scorer',
      title: 'Harlem Pre-Foreclosure — Auction Conversion Rate Rising',
      summary:
        'Q1 2026 data shows 34% of Harlem pre-foreclosure properties reaching auction stage within 90 days of lis pendens filing — up from 21% in 2025. Outreach window is narrowing.',
      confidence: 0.78,
      tags: ['harlem', 'pre-foreclosure', 'auction', 'timeline'],
      relatedEntryIds: [],
      timestamp: Date.now() - 43200000,
    },
  ]);

  const nowMs = Date.now();
  await db.insert(agentRunsTable).values([
    {
      runId: `run-${randomUUID().slice(0, 8)}`,
      agentId: 'prism-forecast-agent',
      domain: 'prism_counsel',
      status: 'completed',
      startedAt: nowMs - 14400000,
      completedAt: nowMs - 14371000,
      durationMs: 29000,
      summary:
        'Updated settlement forecast for 6 matters. 2 matters show improving trajectory. 1 matter (PC-2024-0199 Torres) flagged as trial-ready — max leverage window.',
      knowledgeEntryIds: [],
      eventsPublished: ['forecast.updated', 'signal.created'],
    },
    {
      runId: `run-${randomUUID().slice(0, 8)}`,
      agentId: 'vessels-route-analyzer',
      domain: 'vessels',
      status: 'completed',
      startedAt: nowMs - 7200000,
      completedAt: nowMs - 7158000,
      durationMs: 42000,
      summary:
        'Analyzed routes for 5 active vessels. Generated 3 route optimization recommendations. Flagged 1 typhoon risk for Pacific Guardian.',
      knowledgeEntryIds: [],
      eventsPublished: ['route.analyzed', 'exception.created', 'signal.created'],
    },
    {
      runId: `run-${randomUUID().slice(0, 8)}`,
      agentId: 'aegis-threat-intel',
      domain: 'aegis',
      status: 'completed',
      startedAt: nowMs - 3600000,
      completedAt: nowMs - 3547000,
      durationMs: 53000,
      summary:
        'Processed 42 security signals. Escalated 1 critical (Redis no-auth). Classified 3 high-severity findings. Updated MITRE coverage map.',
      knowledgeEntryIds: [],
      eventsPublished: ['threat.critical', 'signal.escalated', 'incident.created'],
    },
    {
      runId: `run-${randomUUID().slice(0, 8)}`,
      agentId: 'lyte-signal-agent',
      domain: 'lyte',
      status: 'running',
      startedAt: nowMs - 120000,
      durationMs: 0,
      summary: null,
      knowledgeEntryIds: [],
      eventsPublished: [],
    },
  ]);

  await db.insert(agentTrainingPairs).values([
    {
      agentId: 'prism-forecast-agent',
      question:
        'What factors most influence settlement value for a premises liability claim in New York?',
      answer:
        "Key factors include: (1) liability strength and clarity — clear negligence commands premium, (2) total economic damages (medical specials + lost wages), (3) non-economic damages — injury severity and permanence, (4) venue — Manhattan and Brooklyn juries award significantly higher than Queens or Bronx, (5) insurer characteristics — carrier reserving style and litigation tolerance, (6) plaintiff's credibility and ability to present at trial.",
      category: 'legal_analysis',
      isActive: true,
    },
    {
      agentId: 'prism-forecast-agent',
      question: 'When should we send a demand letter vs. waiting for more medical treatment?',
      answer:
        'Demand should be sent when: (1) plaintiff has reached maximum medical improvement (MMI) or treatment is substantially complete, (2) all medical records have been obtained and reviewed, (3) damages are fully documented and verifiable, (4) statute of limitations creates urgency. Wait if: treatment is actively ongoing with expected significant improvement, major diagnostic findings are pending, or lien resolution is incomplete.',
      category: 'strategy',
      isActive: true,
    },
    {
      agentId: 'vessels-route-analyzer',
      question:
        'How do we calculate optimal slow steaming vs. normal speed for a Pacific crossing?',
      answer:
        'Optimal speed calculation considers: (1) fuel consumption curve — typically cubic relationship (10% speed reduction = ~27% fuel saving), (2) current bunker price at origin and destination ports, (3) charter party speed/consumption warranties — deviation penalties, (4) cargo delivery deadline and demurrage exposure at destination, (5) weather window — slow steaming may avoid adverse weather. Rule of thumb: break-even analysis at $450–500/MT bunker usually favors slow steaming when schedule allows 1.5+ additional days.',
      category: 'operations',
      isActive: true,
    },
    {
      agentId: 'aegis-threat-intel',
      question:
        'How do we prioritize remediation when multiple critical CVEs are detected simultaneously?',
      answer:
        'Priority framework: (1) internet-exposed assets with public exploits take highest priority — immediate action, (2) assets in critical business functions (payment systems, auth services, data stores), (3) CVSS score + exploitability — actively exploited CVEs (CISA KEV list) over theoretical ones, (4) blast radius — compromise of identity/IAM systems can cascade, (5) ease of remediation — quick wins reduce risk rapidly. Sequence: block/isolate first, then patch in priority order.',
      category: 'security',
      isActive: true,
    },
  ]);

  await db.insert(agentBehaviorPrefs).values([
    {
      agentId: 'prism-forecast-agent',
      tone: 'professional',
      detailLevel: 'detailed',
      domainJargon: true,
      responseLength: 'comprehensive',
      customInstructions:
        'Always cite specific evidence when making recommendations. Flag any missing documents that could strengthen a case. Use legal terminology appropriate for experienced plaintiff attorneys.',
    },
    {
      agentId: 'vessels-route-analyzer',
      tone: 'concise',
      detailLevel: 'balanced',
      domainJargon: true,
      responseLength: 'medium',
      customInstructions:
        'Prioritize operational actionability. Provide specific ETA, fuel cost, and delay estimates. Use nautical terminology.',
    },
    {
      agentId: 'aegis-threat-intel',
      tone: 'direct',
      detailLevel: 'detailed',
      domainJargon: true,
      responseLength: 'comprehensive',
      customInstructions:
        'Lead with severity and immediate action required. Map all findings to MITRE ATT&CK. Provide specific remediation steps, not general guidance.',
    },
    {
      agentId: 'lyte-signal-agent',
      tone: 'professional',
      detailLevel: 'balanced',
      domainJargon: false,
      responseLength: 'medium',
      customInstructions:
        'Translate technical signals into business language for executive audiences. Quantify business impact in dollars where possible.',
    },
  ]);

  await db.insert(agentFeedback).values([
    {
      agentId: 'prism-forecast-agent',
      rating: 5,
      messageContent: 'Predict settlement range for Chen v. Apex matter',
      responseContent:
        "Settlement range: $95K–$280K mid $165K. Key drivers: cervical herniation confirmed, Nationwide's historical settlement at 60% of demand, mediation April 28.",
      feedbackNote: 'Excellent — accurate and actionable. Exactly what we needed before mediation.',
    },
    {
      agentId: 'prism-forecast-agent',
      rating: 4,
      messageContent: 'What is the demand readiness score for Rivera v. MTA?',
      responseContent:
        'Demand readiness: 79/100. Missing: independent medical exam report, lien negotiation final figure. Strong: all medical records obtained, liability clear, CCTV footage secured.',
      feedbackNote: 'Good analysis. Could have been more specific about the IME report timing.',
    },
    {
      agentId: 'vessels-route-analyzer',
      rating: 5,
      messageContent: 'Optimize fuel for Atlantic Voyager Newark to Rotterdam',
      responseContent:
        'Recommended: reduce speed to 13.2 kts (vs. 15.0 charter speed) via 45.2°N waypoint. Estimated fuel saving $22,400. ETA Rotterdam extended 18 hours — within charter party tolerance.',
      feedbackNote: 'Exactly right. Saved significant fuel cost on this voyage.',
    },
    {
      agentId: 'aegis-threat-intel',
      rating: 5,
      messageContent: 'Assess Redis cluster risk finding',
      responseContent:
        'CRITICAL: Production Redis cluster accessible without AUTH. CVSS 9.8. Any internal host can read/write/delete all cache data. Recommended: (1) Enable requirepass immediately, (2) Bind to private interface only, (3) Rotate all session tokens, (4) Review access logs for prior unauthorized activity.',
      feedbackNote: 'Caught a serious issue that could have been catastrophic. Perfect response.',
    },
  ]);

  await db.insert(advisoryAudit).values([
    {
      agentId: 'prism-forecast-agent',
      recommendationType: 'demand_readiness',
      riskLevel: 'medium',
      title: 'Send demand for Patel v. QPM — readiness sufficient',
      description:
        'Demand readiness score 88/100. Recommend sending demand at $135,000. Medical specials $42K, lost wages $8K verified. Lien of $22K identified — recommend holdback provision in settlement.',
      runbook:
        '1. Prepare demand letter with medical chronology attached\n2. Include lien holdback provision\n3. Send via certified mail to Liberty Mutual claims department\n4. Log send date — start 30-day response clock',
      status: 'actioned',
      actionedAt: new Date(),
    },
    {
      agentId: 'vessels-route-analyzer',
      recommendationType: 'exception_response',
      riskLevel: 'critical',
      title: 'Divert SS Gulf Explorer to Fujairah for engine inspection',
      description:
        'Main engine cylinder temperature anomaly detected — predictive failure risk 91%. Diversion to Fujairah (280nm) recommended within 24 hours. MAN Energy Solutions service team should be pre-alerted.',
      runbook:
        '1. Contact vessel master with deviation authorization\n2. Alert charter counterparty — NOR delay notice\n3. Pre-book Fujairah drydock slot\n4. Dispatch MAN Energy Solutions surveyor',
      status: 'pending',
    },
  ]);

  const datasets = await db
    .insert(fineTuningDatasets)
    .values([
      {
        version: 'prism-forecast-v1.4-2026Q1',
        agentId: 'prism-forecast-agent',
        domain: 'prism_counsel',
        format: 'openai-jsonl',
        sampleCount: 842,
        sourceBreakdown: {
          human_attorney_feedback: 312,
          verified_outcomes: 418,
          synthetic_augmentation: 112,
        },
      },
      {
        version: 'vessels-route-v1.8-2026Q1',
        agentId: 'vessels-route-analyzer',
        domain: 'vessels',
        format: 'openai-jsonl',
        sampleCount: 1240,
        sourceBreakdown: {
          voyage_completion_data: 890,
          human_feedback: 210,
          weather_correlation_data: 140,
        },
      },
      {
        version: 'aegis-threat-v1.2-2026Q1',
        agentId: 'aegis-threat-intel',
        domain: 'aegis',
        format: 'openai-jsonl',
        sampleCount: 2180,
        sourceBreakdown: {
          cve_database: 1200,
          incident_response_logs: 680,
          analyst_annotations: 300,
        },
      },
    ])
    .onConflictDoNothing()
    .returning();

  const ftJobs = await db
    .insert(fineTuningJobs)
    .values([
      {
        jobId: `ftjob-${randomUUID().slice(0, 8)}`,
        agentId: 'prism-forecast-agent',
        provider: 'anthropic',
        baseModel: 'claude-sonnet-4-5',
        fineTunedModelId: 'ft:claude-sonnet-4-5:prism-forecast:2026q1',
        status: 'succeeded',
        datasetVersion: datasets[0].version,
        datasetSize: 842,
        hyperparameters: { epochs: 3, learning_rate: '2e-5', batch_size: 8 },
        evalScores: { accuracy: 0.91, f1: 0.89, precision: 0.92 },
        baseModelEvalScores: { accuracy: 0.84, f1: 0.82, precision: 0.85 },
        promotedToLifecycle: 'production',
        trainingCostUsd: 148.4,
        submittedAt: daysAgo(30),
        completedAt: daysAgo(25),
        validatedAt: daysAgo(22),
      },
      {
        jobId: `ftjob-${randomUUID().slice(0, 8)}`,
        agentId: 'vessels-route-analyzer',
        provider: 'openai',
        baseModel: 'gpt-4o',
        status: 'succeeded',
        datasetVersion: datasets[1].version,
        datasetSize: 1240,
        hyperparameters: { epochs: 4, learning_rate: '1.5e-5', batch_size: 16 },
        evalScores: { accuracy: 0.93, route_accuracy: 0.91, fuel_estimate_mae: 0.048 },
        baseModelEvalScores: { accuracy: 0.88, route_accuracy: 0.85 },
        promotedToLifecycle: 'production',
        trainingCostUsd: 312.2,
        submittedAt: daysAgo(45),
        completedAt: daysAgo(38),
        validatedAt: daysAgo(35),
      },
      {
        jobId: `ftjob-${randomUUID().slice(0, 8)}`,
        agentId: 'aegis-threat-intel',
        provider: 'anthropic',
        baseModel: 'claude-sonnet-4-5',
        status: 'running',
        datasetVersion: datasets[2].version,
        datasetSize: 2180,
        hyperparameters: { epochs: 5, learning_rate: '1e-5', batch_size: 8 },
        submittedAt: daysAgo(5),
      },
    ])
    .onConflictDoNothing()
    .returning();

  await db.insert(fineTunedModelRegistry).values([
    {
      modelId: 'ft:claude-sonnet-4-5:prism-forecast:2026q1',
      agentId: 'prism-forecast-agent',
      jobId: ftJobs[0].jobId,
      baseModel: 'claude-sonnet-4-5',
      provider: 'anthropic',
      datasetVersion: datasets[0].version,
      lifecycle: 'production',
      evalPassRate: 0.91,
      evalScores: { accuracy: 0.91, f1: 0.89 },
      baseModelEvalScores: { accuracy: 0.84, f1: 0.82 },
      costPer1kInput: 0.0032,
      costPer1kOutput: 0.0096,
      isActive: true,
      registeredAt: daysAgo(22),
      promotedAt: daysAgo(20),
    },
    {
      modelId: 'ft:gpt-4o:vessels-route:2026q1',
      agentId: 'vessels-route-analyzer',
      jobId: ftJobs[1].jobId,
      baseModel: 'gpt-4o',
      provider: 'openai',
      datasetVersion: datasets[1].version,
      lifecycle: 'production',
      evalPassRate: 0.93,
      evalScores: { accuracy: 0.93, route_accuracy: 0.91 },
      baseModelEvalScores: { accuracy: 0.88 },
      costPer1kInput: 0.0025,
      costPer1kOutput: 0.01,
      isActive: true,
      registeredAt: daysAgo(35),
      promotedAt: daysAgo(32),
    },
  ]);
  return { seeded: true };
}
