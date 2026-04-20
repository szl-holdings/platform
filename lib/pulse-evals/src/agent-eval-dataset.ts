/**
 * Agent Eval Dataset Store
 *
 * Immutable, versioned JSON dataset registry per agent.
 * Datasets are keyed by dataset_id and cannot be modified after registration —
 * new versions must be registered as new dataset records.
 *
 * Per spec: docs/AGENT_EVAL_AND_REPLAY.md
 */

import type { AgentEvalDataset, AgentId } from './agent-eval-types.js';

const datasetRegistry = new Map<string, AgentEvalDataset>();

export function registerDataset(dataset: AgentEvalDataset): void {
  if (datasetRegistry.has(dataset.dataset_id)) {
    throw new Error(
      `Dataset '${dataset.dataset_id}' is already registered. Datasets are immutable. Register a new versioned dataset instead.`,
    );
  }
  datasetRegistry.set(dataset.dataset_id, Object.freeze(structuredClone(dataset)));
}

export function getDataset(datasetId: string): AgentEvalDataset | undefined {
  return datasetRegistry.get(datasetId);
}

export function listDatasets(agentId?: AgentId): AgentEvalDataset[] {
  const datasets = Array.from(datasetRegistry.values());
  if (!agentId) return datasets;
  return datasets.filter((d) => d.agent === agentId);
}

export function getLatestDatasetForAgent(agentId: AgentId): AgentEvalDataset | undefined {
  const datasets = listDatasets(agentId);
  if (datasets.length === 0) return undefined;
  return datasets.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

registerDataset({
  dataset_id: 'eval_ds_maritime_dark_vessel_v1',
  domain: 'maritime',
  agent: 'sentinel-maritime',
  version: '1.0.0',
  created_at: '2026-01-10T00:00:00Z',
  description: 'Core dark vessel detection eval — AIS gap, sanctioned proximity, route deviation',
  cases: [
    {
      case_id: 'case_001',
      name: 'AIS gap + sanctioned port proximity',
      difficulty: 'hard',
      tags: ['sanctions', 'ais_manipulation', 'regression_critical'],
      input: {
        signals: [
          { type: 'ais_gap', duration_minutes: 127, vessel_id: 'vsl_test_001' },
          { type: 'sanctioned_proximity', port: 'Bandar Abbas', distance_km: 12 },
        ],
        entity_context: { vessel_type: 'tanker', flag_state: 'Panama', risk_history: 'medium' },
        policy_context: { applicable_policies: ['maritime_sanctions_001'], jurisdiction: 'OFAC' },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.75,
        recommended_action: 'flag_for_sanctions_screening',
        prohibited_recommendations: ['notify_vessel_directly', 'clear_vessel'],
        required_evidence_types: ['ais_gap', 'sanctioned_proximity'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'case_002',
      name: 'AIS gap only — below threshold',
      difficulty: 'medium',
      tags: ['ais_manipulation', 'low_risk'],
      input: {
        signals: [{ type: 'ais_gap', duration_minutes: 25, vessel_id: 'vsl_test_002' }],
        entity_context: { vessel_type: 'bulk_carrier', flag_state: 'Norway', risk_history: 'low' },
        policy_context: { applicable_policies: ['maritime_monitoring_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.4,
        confidence_max: 0.7,
        recommended_action: 'monitor',
        prohibited_recommendations: ['flag_for_sanctions_screening'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'case_003',
      name: 'Route deviation + cargo mismatch',
      difficulty: 'hard',
      tags: ['route_deviation', 'cargo_fraud', 'regression_critical'],
      input: {
        signals: [
          { type: 'route_deviation', deviation_nm: 89, declared_route: 'Rotterdam → Singapore' },
          { type: 'cargo_mismatch', declared: 'grain', transponder_class: 'tanker' },
        ],
        entity_context: {
          vessel_type: 'general_cargo',
          flag_state: 'Liberia',
          risk_history: 'high',
        },
        policy_context: {
          applicable_policies: ['maritime_sanctions_001', 'cargo_verification_001'],
        },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.7,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['route_deviation', 'cargo_mismatch'],
        prohibited_recommendations: ['clear_vessel'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'case_004',
      name: 'Routine vessel — no anomaly',
      difficulty: 'easy',
      tags: ['clean', 'negative_case'],
      input: {
        signals: [{ type: 'position_update', on_declared_route: true, ais_continuous: true }],
        entity_context: {
          vessel_type: 'container_ship',
          flag_state: 'Denmark',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['maritime_monitoring_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.6,
        recommended_action: 'no_action',
        prohibited_recommendations: ['flag_for_sanctions_screening'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'case_005',
      name: 'AIS gap + sanctioned proximity + prior incident',
      difficulty: 'hard',
      tags: ['sanctions', 'ais_manipulation', 'repeat_offender', 'regression_critical'],
      input: {
        signals: [
          { type: 'ais_gap', duration_minutes: 203, vessel_id: 'vsl_test_005' },
          { type: 'sanctioned_proximity', port: 'Kharg Island', distance_km: 8 },
          { type: 'prior_incident', count: 2, last_incident: '2025-09-15' },
        ],
        entity_context: { vessel_type: 'tanker', flag_state: 'Togo', risk_history: 'critical' },
        policy_context: { applicable_policies: ['maritime_sanctions_001', 'repeat_offender_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.88,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['ais_gap', 'sanctioned_proximity', 'prior_incident'],
        prohibited_recommendations: ['notify_vessel_directly', 'clear_vessel'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
  ],
});

registerDataset({
  dataset_id: 'eval_ds_voyage_pnl_v1',
  domain: 'voyage',
  agent: 'helmsman-voyage',
  version: '1.0.0',
  created_at: '2026-01-15T00:00:00Z',
  description: 'Voyage P&L estimation eval — fuel, port costs, charter rate assessment',
  cases: [
    {
      case_id: 'voy_001',
      name: 'Standard tanker voyage estimate',
      difficulty: 'medium',
      tags: ['pnl', 'tanker', 'baseline'],
      input: {
        signals: [{ type: 'voyage_plan', route: 'Rotterdam → Singapore', vessel_class: 'aframax' }],
        entity_context: { dwt: 115000, fuel_type: 'VLSFO', charter_type: 'spot' },
        policy_context: { applicable_policies: ['voyage_economics_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.65,
        required_fields: [
          'estimated_revenue_usd',
          'estimated_cost_usd',
          'net_pnl_usd',
          'voyage_days',
        ],
        recommended_action: 'approve_voyage',
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    {
      case_id: 'voy_002',
      name: 'Loss-making voyage — should recommend review',
      difficulty: 'medium',
      tags: ['pnl', 'negative_case', 'review_required'],
      input: {
        signals: [{ type: 'voyage_plan', route: 'Houston → Lagos', vessel_class: 'vlcc' }],
        entity_context: {
          dwt: 300000,
          fuel_type: 'HFO',
          charter_type: 'spot',
          current_market_rate: 'below_breakeven',
        },
        policy_context: { applicable_policies: ['voyage_economics_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.6,
        recommended_action: 'escalate_to_commercial',
        prohibited_recommendations: ['approve_voyage'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
  ],
});

registerDataset({
  dataset_id: 'eval_ds_security_threat_v1',
  domain: 'security',
  agent: 'guardian-security',
  version: '1.0.0',
  created_at: '2026-02-01T00:00:00Z',
  description:
    'Security threat triage eval — intrusion detection, access anomalies, vulnerability assessment',
  cases: [
    {
      case_id: 'sec_001',
      name: 'Critical CVE in production with active exploit',
      difficulty: 'easy',
      tags: ['vulnerability', 'critical', 'production'],
      input: {
        signals: [
          {
            type: 'vulnerability',
            cvss: 9.8,
            cve: 'CVE-2026-0001',
            exploit_available: true,
            asset_tier: 'production',
          },
        ],
        entity_context: { asset_type: 'api_gateway', internet_facing: true },
        policy_context: { applicable_policies: ['security_response_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.85,
        recommended_action: 'emergency_patch',
        prohibited_recommendations: ['defer_to_next_cycle', 'no_action'],
        required_evidence_types: ['vulnerability'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_002',
      name: 'Low CVSS in staging — no exploit',
      difficulty: 'easy',
      tags: ['vulnerability', 'low_risk', 'staging'],
      input: {
        signals: [
          { type: 'vulnerability', cvss: 3.1, exploit_available: false, asset_tier: 'staging' },
        ],
        entity_context: { asset_type: 'internal_service', internet_facing: false },
        policy_context: { applicable_policies: ['security_monitoring_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.55,
        recommended_action: 'schedule_patching',
        prohibited_recommendations: ['emergency_patch'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_003',
      name: 'Brute force login — active credential stuffing',
      difficulty: 'medium',
      tags: ['access_anomaly', 'brute_force', 'account_takeover'],
      input: {
        signals: [
          { type: 'login_anomaly', failed_attempts: 847, time_window_minutes: 5, source_ips: 23 },
          { type: 'geo_anomaly', countries: ['RU', 'CN', 'IR'], baseline_country: 'US' },
        ],
        entity_context: { account_tier: 'enterprise', mfa_enabled: false },
        policy_context: { applicable_policies: ['access_security_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.8,
        recommended_action: 'block_and_alert',
        required_evidence_types: ['login_anomaly'],
        prohibited_recommendations: ['no_action', 'monitor_only'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
  ],
});
