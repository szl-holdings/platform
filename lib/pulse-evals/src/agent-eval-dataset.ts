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

// ---------------------------------------------------------------------------
// Maritime v2 — 42 cases covering AIS manipulation, cargo fraud,
// flag-of-convenience, port state control, sanction evasion, adversarial
// ---------------------------------------------------------------------------
registerDataset({
  dataset_id: 'eval_ds_maritime_v2',
  domain: 'maritime',
  agent: 'sentinel-maritime',
  version: '2.0.0',
  created_at: '2026-04-27T00:00:00Z',
  description:
    'Expanded maritime risk eval — 42 cases covering AIS manipulation, cargo fraud, flag-of-convenience, port state control, sanction evasion, and adversarial edge cases',
  cases: [
    // --- AIS Manipulation (8 cases) ---
    {
      case_id: 'mar_v2_001',
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
      case_id: 'mar_v2_002',
      name: 'AIS gap only — below monitoring threshold',
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
      case_id: 'mar_v2_003',
      name: 'AIS transponder manipulation — coordinate spoofing detected',
      difficulty: 'hard',
      tags: ['ais_manipulation', 'spoofing', 'regression_critical'],
      input: {
        signals: [
          {
            type: 'ais_spoofing',
            vessel_id: 'vsl_test_003',
            reported_position: { lat: 25.2048, lon: 55.2708 },
            satellite_derived_position: { lat: 26.9, lon: 56.2 },
            discrepancy_km: 204,
          },
        ],
        entity_context: { vessel_type: 'tanker', flag_state: 'Comoros', risk_history: 'high' },
        policy_context: { applicable_policies: ['maritime_sanctions_001'], jurisdiction: 'EU' },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.85,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['ais_spoofing'],
        prohibited_recommendations: ['clear_vessel', 'monitor'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_004',
      name: 'AIS gap + prior incident + repeat flag state',
      difficulty: 'hard',
      tags: ['ais_manipulation', 'repeat_offender', 'sanctions', 'regression_critical'],
      input: {
        signals: [
          { type: 'ais_gap', duration_minutes: 203, vessel_id: 'vsl_test_004' },
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
    {
      case_id: 'mar_v2_005',
      name: 'Frequent AIS on/off cycling — evasion pattern',
      difficulty: 'hard',
      tags: ['ais_manipulation', 'evasion_pattern'],
      input: {
        signals: [
          {
            type: 'ais_cycling',
            vessel_id: 'vsl_test_005',
            cycles_in_24h: 14,
            avg_gap_minutes: 47,
            near_sanctioned_zone: true,
          },
        ],
        entity_context: { vessel_type: 'tanker', flag_state: 'Palau', risk_history: 'medium' },
        policy_context: { applicable_policies: ['maritime_sanctions_001', 'maritime_monitoring_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.78,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['ais_cycling'],
        prohibited_recommendations: ['clear_vessel'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_006',
      name: 'AIS gap — legitimate fishing grounds excursion',
      difficulty: 'medium',
      tags: ['ais_manipulation', 'negative_case', 'legitimate_activity'],
      input: {
        signals: [
          {
            type: 'ais_gap',
            duration_minutes: 45,
            vessel_id: 'vsl_test_006',
            location_context: 'established_fishing_zone',
          },
        ],
        entity_context: {
          vessel_type: 'fishing_vessel',
          flag_state: 'Iceland',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['maritime_monitoring_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.35,
        confidence_max: 0.65,
        recommended_action: 'monitor',
        prohibited_recommendations: ['flag_for_sanctions_screening', 'emergency_detention'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_007',
      name: 'AIS blackout during ship-to-ship transfer window',
      difficulty: 'hard',
      tags: ['ais_manipulation', 'sts_transfer', 'sanctions'],
      input: {
        signals: [
          { type: 'ais_gap', duration_minutes: 312, vessel_id: 'vsl_test_007' },
          {
            type: 'sts_indicator',
            ais_matched_vessel: 'vsl_sanctioned_009',
            proximity_km: 0.4,
            duration_minutes: 180,
          },
        ],
        entity_context: { vessel_type: 'tanker', flag_state: 'Mongolia', risk_history: 'high' },
        policy_context: { applicable_policies: ['maritime_sanctions_001'], jurisdiction: 'OFAC' },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.9,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['ais_gap', 'sts_indicator'],
        prohibited_recommendations: ['clear_vessel', 'no_action'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_008',
      name: 'Minimal AIS gap — coastal dead zone known coverage issue',
      difficulty: 'easy',
      tags: ['ais_manipulation', 'negative_case', 'infrastructure'],
      input: {
        signals: [
          {
            type: 'ais_gap',
            duration_minutes: 18,
            vessel_id: 'vsl_test_008',
            location_context: 'known_ais_shadow_zone',
          },
        ],
        entity_context: {
          vessel_type: 'container_ship',
          flag_state: 'Singapore',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['maritime_monitoring_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.2,
        confidence_max: 0.5,
        recommended_action: 'no_action',
        prohibited_recommendations: ['flag_for_sanctions_screening'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    // --- Cargo Fraud (8 cases) ---
    {
      case_id: 'mar_v2_009',
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
      case_id: 'mar_v2_010',
      name: 'Underdeclared cargo weight — customs anomaly',
      difficulty: 'medium',
      tags: ['cargo_fraud', 'customs'],
      input: {
        signals: [
          {
            type: 'cargo_weight_anomaly',
            declared_mt: 12000,
            draft_derived_mt: 18400,
            discrepancy_pct: 53,
          },
        ],
        entity_context: { vessel_type: 'bulk_carrier', flag_state: 'Malta', risk_history: 'medium' },
        policy_context: { applicable_policies: ['cargo_verification_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.65,
        recommended_action: 'request_cargo_inspection',
        required_evidence_types: ['cargo_weight_anomaly'],
        prohibited_recommendations: ['clear_vessel'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_011',
      name: 'Bill of lading mismatch — dual invoicing suspected',
      difficulty: 'hard',
      tags: ['cargo_fraud', 'document_fraud', 'trade_finance'],
      input: {
        signals: [
          {
            type: 'bol_mismatch',
            vessel_id: 'vsl_test_011',
            declared_commodity: 'machinery',
            hs_code_commodity: 'crude_oil',
            value_discrepancy_usd: 4200000,
          },
        ],
        entity_context: {
          vessel_type: 'general_cargo',
          flag_state: 'Belize',
          risk_history: 'high',
        },
        policy_context: { applicable_policies: ['cargo_verification_001', 'trade_sanctions_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.82,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['bol_mismatch'],
        prohibited_recommendations: ['clear_vessel', 'no_action'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_012',
      name: 'Correct cargo — minor documentation error',
      difficulty: 'easy',
      tags: ['cargo_fraud', 'negative_case', 'admin_error'],
      input: {
        signals: [
          {
            type: 'doc_discrepancy',
            field: 'shipper_address',
            severity: 'minor',
            cargo_consistent: true,
          },
        ],
        entity_context: {
          vessel_type: 'container_ship',
          flag_state: 'Germany',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['cargo_verification_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.3,
        confidence_max: 0.6,
        recommended_action: 'request_documentation_correction',
        prohibited_recommendations: ['flag_for_sanctions_screening', 'emergency_detention'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_013',
      name: 'Petroleum cargo declared as vegetable oil — sanctions evasion',
      difficulty: 'hard',
      tags: ['cargo_fraud', 'sanctions', 'petroleum'],
      input: {
        signals: [
          {
            type: 'cargo_mismatch',
            declared: 'vegetable_oil',
            spectroscopy_result: 'petroleum_distillate',
            confidence: 0.94,
          },
          { type: 'sanctioned_proximity', port: 'Latakia', distance_km: 30 },
        ],
        entity_context: { vessel_type: 'tanker', flag_state: 'Sierra Leone', risk_history: 'high' },
        policy_context: {
          applicable_policies: ['maritime_sanctions_001', 'cargo_verification_001'],
          jurisdiction: 'EU',
        },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.88,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['cargo_mismatch', 'sanctioned_proximity'],
        prohibited_recommendations: ['clear_vessel', 'monitor'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_014',
      name: 'Cargo substitution at sea — transshipment fraud',
      difficulty: 'hard',
      tags: ['cargo_fraud', 'transshipment', 'sts_transfer'],
      input: {
        signals: [
          {
            type: 'sts_transfer',
            vessel_id: 'vsl_test_014',
            partner_vessel: 'vsl_high_risk_022',
            duration_hours: 6,
            international_waters: true,
          },
          {
            type: 'cargo_change',
            pre_transfer_manifest: 'electronics',
            post_transfer_manifest: 'electronics',
            weight_change_mt: 2200,
          },
        ],
        entity_context: { vessel_type: 'general_cargo', flag_state: 'Togo', risk_history: 'high' },
        policy_context: { applicable_policies: ['cargo_verification_001', 'maritime_sanctions_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.72,
        recommended_action: 'request_cargo_inspection',
        required_evidence_types: ['sts_transfer', 'cargo_change'],
        prohibited_recommendations: ['clear_vessel'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_015',
      name: 'False destination declared — vessel diverted post-clearance',
      difficulty: 'medium',
      tags: ['cargo_fraud', 'route_deviation', 'destination_fraud'],
      input: {
        signals: [
          {
            type: 'destination_change',
            declared_destination: 'Hamburg',
            actual_destination: 'Tripoli',
            change_detected_hours_after_departure: 18,
          },
        ],
        entity_context: { vessel_type: 'ro_ro', flag_state: 'Cyprus', risk_history: 'medium' },
        policy_context: { applicable_policies: ['cargo_verification_001', 'maritime_sanctions_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.68,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['destination_change'],
        prohibited_recommendations: ['no_action'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_016',
      name: 'Legitimate transshipment — documented and pre-authorised',
      difficulty: 'easy',
      tags: ['cargo_fraud', 'negative_case', 'transshipment'],
      input: {
        signals: [
          {
            type: 'sts_transfer',
            vessel_id: 'vsl_test_016',
            pre_authorised: true,
            customs_notified: true,
            duration_hours: 4,
          },
        ],
        entity_context: {
          vessel_type: 'feeder_container',
          flag_state: 'Netherlands',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['cargo_verification_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.2,
        confidence_max: 0.5,
        recommended_action: 'no_action',
        prohibited_recommendations: ['flag_for_sanctions_screening', 'emergency_detention'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    // --- Flag-of-Convenience (6 cases) ---
    {
      case_id: 'mar_v2_017',
      name: 'High-risk flag state + sanctions proximity + AIS gap',
      difficulty: 'hard',
      tags: ['flag_of_convenience', 'sanctions', 'ais_manipulation'],
      input: {
        signals: [
          { type: 'ais_gap', duration_minutes: 95, vessel_id: 'vsl_test_017' },
          { type: 'sanctioned_proximity', port: 'Tartus', distance_km: 22 },
        ],
        entity_context: {
          vessel_type: 'tanker',
          flag_state: 'Comoros',
          recent_reflag: true,
          reflag_date: '2025-11-01',
          risk_history: 'high',
        },
        policy_context: { applicable_policies: ['maritime_sanctions_001', 'flag_risk_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.82,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['ais_gap', 'sanctioned_proximity'],
        prohibited_recommendations: ['clear_vessel'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_018',
      name: 'Recent reflagging to open registry — no other signals',
      difficulty: 'medium',
      tags: ['flag_of_convenience', 'reflagging'],
      input: {
        signals: [
          {
            type: 'reflag_event',
            from_flag: 'Marshall Islands',
            to_flag: 'Palau',
            days_since_reflag: 12,
          },
        ],
        entity_context: {
          vessel_type: 'bulk_carrier',
          flag_state: 'Palau',
          risk_history: 'low',
        },
        policy_context: { applicable_policies: ['flag_risk_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.4,
        confidence_max: 0.7,
        recommended_action: 'enhanced_monitoring',
        prohibited_recommendations: ['flag_for_sanctions_screening', 'emergency_detention'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_019',
      name: 'Multiple reflaggings in 12 months — shell ownership suspected',
      difficulty: 'hard',
      tags: ['flag_of_convenience', 'ownership_opacity', 'reflagging'],
      input: {
        signals: [
          {
            type: 'reflag_pattern',
            reflag_count_12m: 4,
            flags_used: ['Palau', 'Togo', 'Comoros', 'Bolivia'],
            beneficial_owner_unknown: true,
          },
        ],
        entity_context: {
          vessel_type: 'tanker',
          flag_state: 'Bolivia',
          risk_history: 'high',
        },
        policy_context: { applicable_policies: ['flag_risk_001', 'beneficial_owner_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.8,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['reflag_pattern'],
        prohibited_recommendations: ['clear_vessel', 'no_action'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_020',
      name: 'Open registry flag — clean history, major operator',
      difficulty: 'easy',
      tags: ['flag_of_convenience', 'negative_case'],
      input: {
        signals: [{ type: 'flag_check', flag: 'Marshall Islands', flag_risk_tier: 'medium' }],
        entity_context: {
          vessel_type: 'container_ship',
          flag_state: 'Marshall Islands',
          operator: 'Maersk',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['flag_risk_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.2,
        confidence_max: 0.5,
        recommended_action: 'no_action',
        prohibited_recommendations: ['flag_for_sanctions_screening'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_021',
      name: 'Flag state under UN arms embargo — tanker inbound',
      difficulty: 'hard',
      tags: ['flag_of_convenience', 'arms_embargo', 'sanctions'],
      input: {
        signals: [
          {
            type: 'flag_check',
            flag: 'North Korea',
            flag_risk_tier: 'critical',
            un_embargo: true,
          },
          { type: 'vessel_inbound', destination_port: 'Busan' },
        ],
        entity_context: {
          vessel_type: 'tanker',
          flag_state: 'North Korea',
          risk_history: 'critical',
        },
        policy_context: { applicable_policies: ['maritime_sanctions_001', 'un_embargo_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.95,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['flag_check'],
        prohibited_recommendations: ['clear_vessel', 'monitor', 'no_action'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_022',
      name: 'Known flag state — temporary flag during drydock registration',
      difficulty: 'medium',
      tags: ['flag_of_convenience', 'negative_case', 'drydock'],
      input: {
        signals: [
          {
            type: 'reflag_event',
            from_flag: 'Norway',
            to_flag: 'Malta',
            reason: 'drydock_registration',
            documented: true,
            duration_days: 45,
          },
        ],
        entity_context: {
          vessel_type: 'cruise_ship',
          flag_state: 'Malta',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['flag_risk_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.2,
        confidence_max: 0.55,
        recommended_action: 'monitor',
        prohibited_recommendations: ['flag_for_sanctions_screening', 'emergency_detention'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    // --- Port State Control (6 cases) ---
    {
      case_id: 'mar_v2_023',
      name: 'PSC detention history — multiple port bans',
      difficulty: 'hard',
      tags: ['port_state_control', 'detention', 'deficiency'],
      input: {
        signals: [
          {
            type: 'psc_history',
            detentions_24m: 3,
            deficiencies_24m: 47,
            port_bans: ['Tokyo MOU', 'Paris MOU'],
          },
        ],
        entity_context: {
          vessel_type: 'bulk_carrier',
          flag_state: 'Tanzania',
          risk_history: 'critical',
        },
        policy_context: { applicable_policies: ['psc_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.85,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['psc_history'],
        prohibited_recommendations: ['clear_vessel', 'no_action'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_024',
      name: 'PSC inspection due — no historical deficiencies',
      difficulty: 'easy',
      tags: ['port_state_control', 'negative_case'],
      input: {
        signals: [{ type: 'psc_due', months_overdue: 0, last_inspection_deficiencies: 0 }],
        entity_context: {
          vessel_type: 'container_ship',
          flag_state: 'Denmark',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['psc_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.15,
        confidence_max: 0.45,
        recommended_action: 'schedule_inspection',
        prohibited_recommendations: ['flag_for_sanctions_screening', 'emergency_detention'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_025',
      name: 'PSC overdue + structural deficiency reported by crew',
      difficulty: 'medium',
      tags: ['port_state_control', 'structural', 'safety'],
      input: {
        signals: [
          { type: 'psc_due', months_overdue: 8, last_inspection_deficiencies: 12 },
          {
            type: 'crew_report',
            category: 'structural',
            description: 'hull_cracking_in_cargo_hold',
            severity: 'high',
          },
        ],
        entity_context: {
          vessel_type: 'bulk_carrier',
          flag_state: 'Indonesia',
          risk_history: 'medium',
        },
        policy_context: { applicable_policies: ['psc_001', 'safety_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.75,
        recommended_action: 'request_emergency_inspection',
        required_evidence_types: ['psc_due', 'crew_report'],
        prohibited_recommendations: ['no_action', 'clear_vessel'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_026',
      name: 'ISM non-compliance — SMS not updated post-casualty',
      difficulty: 'hard',
      tags: ['port_state_control', 'ism', 'compliance'],
      input: {
        signals: [
          {
            type: 'ism_deficiency',
            sms_version_date: '2022-03-01',
            last_casualty_date: '2024-11-15',
            sms_updated_post_casualty: false,
            deficiency_category: 'ISM_9.1',
          },
        ],
        entity_context: {
          vessel_type: 'tanker',
          flag_state: 'Panama',
          risk_history: 'high',
        },
        policy_context: { applicable_policies: ['psc_001', 'ism_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.78,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['ism_deficiency'],
        prohibited_recommendations: ['clear_vessel'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_027',
      name: 'Recently inspected — zero deficiencies, top-rated operator',
      difficulty: 'easy',
      tags: ['port_state_control', 'negative_case', 'clean'],
      input: {
        signals: [
          {
            type: 'psc_result',
            inspection_date: '2026-04-01',
            deficiencies: 0,
            rating: 'excellent',
          },
        ],
        entity_context: {
          vessel_type: 'cruise_ship',
          flag_state: 'Bahamas',
          operator: 'Carnival',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['psc_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.1,
        confidence_max: 0.35,
        recommended_action: 'no_action',
        prohibited_recommendations: ['flag_for_sanctions_screening', 'emergency_detention'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_028',
      name: 'Crew certification lapsed — STCW non-compliance',
      difficulty: 'medium',
      tags: ['port_state_control', 'crew_certification', 'stcw'],
      input: {
        signals: [
          {
            type: 'crew_certification',
            stcw_expired_count: 3,
            role: ['chief_officer', 'second_engineer', 'bosun'],
            days_overdue: [45, 12, 78],
          },
        ],
        entity_context: {
          vessel_type: 'general_cargo',
          flag_state: 'Philippines',
          risk_history: 'medium',
        },
        policy_context: { applicable_policies: ['psc_001', 'stcw_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.65,
        recommended_action: 'request_emergency_inspection',
        required_evidence_types: ['crew_certification'],
        prohibited_recommendations: ['clear_vessel', 'no_action'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    // --- Sanction Evasion (6 cases) ---
    {
      case_id: 'mar_v2_029',
      name: 'Beneficial owner on OFAC SDN list — indirect ownership',
      difficulty: 'hard',
      tags: ['sanctions', 'beneficial_owner', 'ofac'],
      input: {
        signals: [
          {
            type: 'ownership_match',
            match_type: 'indirect',
            sdn_entity: 'entity_xyz_iran',
            ownership_chain_depth: 3,
            confidence_score: 0.87,
          },
        ],
        entity_context: {
          vessel_type: 'tanker',
          flag_state: 'Malta',
          risk_history: 'medium',
        },
        policy_context: { applicable_policies: ['maritime_sanctions_001'], jurisdiction: 'OFAC' },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.8,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['ownership_match'],
        prohibited_recommendations: ['clear_vessel'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_030',
      name: 'Vessel previously named and renamed to evade sanctions',
      difficulty: 'hard',
      tags: ['sanctions', 'vessel_identity', 'rename'],
      input: {
        signals: [
          {
            type: 'identity_history',
            previous_name: 'FORTUNE STAR',
            previous_imo: '9023441',
            renamed_date: '2025-06-15',
            sanctioned_under_previous_identity: true,
          },
        ],
        entity_context: {
          vessel_type: 'tanker',
          flag_state: 'Gabon',
          risk_history: 'critical',
        },
        policy_context: {
          applicable_policies: ['maritime_sanctions_001'],
          jurisdiction: 'EU',
        },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.92,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['identity_history'],
        prohibited_recommendations: ['clear_vessel', 'monitor', 'no_action'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_031',
      name: 'Vessel calling at Cuban port — US nexus charterer',
      difficulty: 'medium',
      tags: ['sanctions', 'cuba', 'ofac'],
      input: {
        signals: [
          {
            type: 'port_call',
            port: 'Havana',
            country: 'Cuba',
            charterer_nexus: 'US',
            charterer_type: 'listed_entity',
          },
        ],
        entity_context: {
          vessel_type: 'bulk_carrier',
          flag_state: 'Liberia',
          risk_history: 'medium',
        },
        policy_context: { applicable_policies: ['maritime_sanctions_001'], jurisdiction: 'OFAC' },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.72,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['port_call'],
        prohibited_recommendations: ['clear_vessel'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_032',
      name: 'Vessel calling at sanctioned port — EU flagged, EU owned',
      difficulty: 'hard',
      tags: ['sanctions', 'eu_exposure', 'port_call'],
      input: {
        signals: [
          {
            type: 'port_call',
            port: 'Tartus',
            country: 'Syria',
            vessel_flag: 'Cyprus',
            owner_nationality: 'Greece',
          },
        ],
        entity_context: {
          vessel_type: 'tanker',
          flag_state: 'Cyprus',
          risk_history: 'medium',
        },
        policy_context: {
          applicable_policies: ['maritime_sanctions_001'],
          jurisdiction: 'EU',
        },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.82,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['port_call'],
        prohibited_recommendations: ['clear_vessel', 'no_action'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_033',
      name: 'Insurance provider on designated list',
      difficulty: 'medium',
      tags: ['sanctions', 'insurance', 'designation'],
      input: {
        signals: [
          {
            type: 'insurance_check',
            p_and_i_club: 'INGOSSTRAKH',
            designated: true,
            designation_date: '2022-04-01',
            jurisdiction: 'EU',
          },
        ],
        entity_context: {
          vessel_type: 'tanker',
          flag_state: 'Russia',
          risk_history: 'high',
        },
        policy_context: {
          applicable_policies: ['maritime_sanctions_001'],
          jurisdiction: 'EU',
        },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.85,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['insurance_check'],
        prohibited_recommendations: ['clear_vessel', 'no_action'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_034',
      name: 'Port call in Iran-adjacent UAE hub — commercial routing',
      difficulty: 'medium',
      tags: ['sanctions', 'transshipment_hub', 'negative_case'],
      input: {
        signals: [
          {
            type: 'port_call',
            port: 'Jebel Ali',
            country: 'UAE',
            cargo: 'consumer_electronics',
            known_iran_transshipment_hub: true,
            iran_onward_shipment_evidence: false,
          },
        ],
        entity_context: {
          vessel_type: 'container_ship',
          flag_state: 'Singapore',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['maritime_sanctions_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.35,
        confidence_max: 0.65,
        recommended_action: 'enhanced_monitoring',
        prohibited_recommendations: ['flag_for_sanctions_screening', 'emergency_detention'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    // --- Clean / Negative Cases (4 cases) ---
    {
      case_id: 'mar_v2_035',
      name: 'Routine vessel — no anomaly signals',
      difficulty: 'easy',
      tags: ['negative_case', 'clean'],
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
      case_id: 'mar_v2_036',
      name: 'Vessel with top-tier operator, recent PSC clean pass, continuous AIS',
      difficulty: 'easy',
      tags: ['negative_case', 'clean', 'tier_one_operator'],
      input: {
        signals: [
          { type: 'position_update', on_declared_route: true, ais_continuous: true },
          {
            type: 'psc_result',
            inspection_date: '2026-03-15',
            deficiencies: 0,
            rating: 'excellent',
          },
        ],
        entity_context: {
          vessel_type: 'lng_carrier',
          flag_state: 'France',
          operator: 'TotalEnergies',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['maritime_monitoring_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.1,
        confidence_max: 0.3,
        recommended_action: 'no_action',
        prohibited_recommendations: ['flag_for_sanctions_screening', 'monitor'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_037',
      name: 'Patrol vessel — government operated, AIS scheduled off',
      difficulty: 'medium',
      tags: ['negative_case', 'government_vessel', 'legitimate_ais_off'],
      input: {
        signals: [
          {
            type: 'ais_gap',
            duration_minutes: 240,
            vessel_id: 'vsl_gov_037',
            vessel_class: 'patrol',
            government_registry: true,
          },
        ],
        entity_context: {
          vessel_type: 'patrol_vessel',
          flag_state: 'Australia',
          operator: 'Australian Border Force',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['maritime_monitoring_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.1,
        confidence_max: 0.45,
        recommended_action: 'no_action',
        prohibited_recommendations: ['flag_for_sanctions_screening'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_038',
      name: 'Emergency distress diversion — vessel assisting MAYDAY',
      difficulty: 'medium',
      tags: ['negative_case', 'humanitarian', 'distress'],
      input: {
        signals: [
          {
            type: 'route_deviation',
            deviation_nm: 120,
            declared_route: 'Piraeus → Tunis',
            reason: 'MAYDAY_response',
            coast_guard_confirmed: true,
          },
        ],
        entity_context: {
          vessel_type: 'bulk_carrier',
          flag_state: 'Greece',
          risk_history: 'none',
        },
        policy_context: { applicable_policies: ['maritime_monitoring_001'] },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.1,
        confidence_max: 0.4,
        recommended_action: 'no_action',
        prohibited_recommendations: ['flag_for_sanctions_screening', 'emergency_detention'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    // --- Adversarial Cases (4 cases) ---
    {
      case_id: 'mar_v2_039',
      name: 'Adversarial: plausible cover story masking sanctioned port visit',
      difficulty: 'adversarial',
      tags: ['adversarial', 'sanctions', 'cover_story', 'regression_critical'],
      input: {
        signals: [
          {
            type: 'port_call',
            port: 'Bandar Abbas',
            country: 'Iran',
            stated_reason: 'emergency_bunkering',
            bunkering_invoice_provided: true,
            invoice_authenticity_score: 0.41,
          },
          { type: 'ais_gap', duration_minutes: 180, vessel_id: 'vsl_adv_039' },
        ],
        entity_context: {
          vessel_type: 'tanker',
          flag_state: 'Panama',
          risk_history: 'medium',
          operator_presentation: 'tier_one_mimicry',
        },
        policy_context: { applicable_policies: ['maritime_sanctions_001'], jurisdiction: 'OFAC' },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.75,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['port_call', 'ais_gap'],
        prohibited_recommendations: ['clear_vessel', 'accept_invoice_at_face_value'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_040',
      name: 'Adversarial: injected legitimate signals to suppress risk score',
      difficulty: 'adversarial',
      tags: ['adversarial', 'signal_injection', 'sanctions'],
      input: {
        signals: [
          {
            type: 'psc_result',
            inspection_date: '2026-04-20',
            deficiencies: 0,
            rating: 'excellent',
            source_authenticity_score: 0.32,
          },
          { type: 'ais_gap', duration_minutes: 410, vessel_id: 'vsl_adv_040' },
          { type: 'sanctioned_proximity', port: 'Kharg Island', distance_km: 5 },
        ],
        entity_context: {
          vessel_type: 'tanker',
          flag_state: 'Comoros',
          risk_history: 'critical',
        },
        policy_context: { applicable_policies: ['maritime_sanctions_001'], jurisdiction: 'OFAC' },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.85,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['ais_gap', 'sanctioned_proximity'],
        prohibited_recommendations: ['clear_vessel', 'no_action'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_041',
      name: 'Adversarial: contradictory policy signals — agent must not hallucinate clearance',
      difficulty: 'adversarial',
      tags: ['adversarial', 'policy_conflict', 'hallucination_risk'],
      input: {
        signals: [
          {
            type: 'policy_override_claim',
            claimed_exemption: 'humanitarian_cargo',
            exemption_code: 'OFAC_GL_2A',
            cargo: 'crude_oil',
            exemption_applicability: false,
          },
          { type: 'sanctioned_proximity', port: 'Bandar Abbas', distance_km: 9 },
        ],
        entity_context: {
          vessel_type: 'tanker',
          flag_state: 'Malta',
          risk_history: 'high',
        },
        policy_context: {
          applicable_policies: ['maritime_sanctions_001'],
          jurisdiction: 'OFAC',
          conflicting_claim: true,
        },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.78,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['sanctioned_proximity'],
        prohibited_recommendations: ['clear_vessel', 'apply_claimed_exemption'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
    {
      case_id: 'mar_v2_042',
      name: 'Adversarial: obfuscated beneficial owner using nested shell companies',
      difficulty: 'adversarial',
      tags: ['adversarial', 'beneficial_owner', 'sanctions', 'shell_company'],
      input: {
        signals: [
          {
            type: 'ownership_match',
            match_type: 'indirect',
            sdn_entity: 'entity_russian_bank',
            ownership_chain_depth: 6,
            jurisdictions: ['BVI', 'Cayman', 'Seychelles', 'UAE', 'Malta', 'Cyprus'],
            confidence_score: 0.61,
          },
        ],
        entity_context: {
          vessel_type: 'tanker',
          flag_state: 'Cyprus',
          risk_history: 'medium',
          beneficial_owner_disclosed: false,
        },
        policy_context: {
          applicable_policies: ['maritime_sanctions_001', 'beneficial_owner_001'],
          jurisdiction: 'EU',
        },
      },
      expected_output: {
        inference_type: 'risk_assessment',
        confidence_min: 0.72,
        recommended_action: 'flag_for_sanctions_screening',
        required_evidence_types: ['ownership_match'],
        prohibited_recommendations: ['clear_vessel', 'no_action'],
      },
      annotated_by: 'domain_expert:maritime_compliance',
    },
  ],
});

// ---------------------------------------------------------------------------
// Voyage P&L v2 — 16 cases covering bunker surcharges, port congestion,
// weather routing, charter rate edge cases, and adversarial inputs
// ---------------------------------------------------------------------------
registerDataset({
  dataset_id: 'eval_ds_voyage_pnl_v2',
  domain: 'voyage',
  agent: 'helmsman-voyage',
  version: '2.0.0',
  created_at: '2026-04-27T00:00:00Z',
  description:
    'Expanded voyage P&L eval — 16 cases covering bunker surcharges, port congestion, weather routing, charter edge cases, and adversarial inputs',
  cases: [
    // --- Standard P&L Estimates (3 cases) ---
    {
      case_id: 'voy_v2_001',
      name: 'Standard tanker voyage estimate — Aframax Rotterdam → Singapore',
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
        required_fields: ['estimated_revenue_usd', 'estimated_cost_usd', 'net_pnl_usd', 'voyage_days'],
        recommended_action: 'approve_voyage',
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    {
      case_id: 'voy_v2_002',
      name: 'Loss-making voyage — VLCC Houston → Lagos at below-breakeven rate',
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
    {
      case_id: 'voy_v2_003',
      name: 'Time-charter voyage — flat earnings, predictable cost base',
      difficulty: 'easy',
      tags: ['pnl', 'time_charter', 'baseline'],
      input: {
        signals: [{ type: 'voyage_plan', route: 'Singapore → Yokohama', vessel_class: 'panamax' }],
        entity_context: { dwt: 76000, fuel_type: 'VLSFO', charter_type: 'time_charter', tcp_rate_usd: 18500 },
        policy_context: { applicable_policies: ['voyage_economics_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.7,
        required_fields: ['estimated_revenue_usd', 'estimated_cost_usd', 'net_pnl_usd', 'voyage_days'],
        recommended_action: 'approve_voyage',
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    // --- Bunker Surcharge Scenarios (3 cases) ---
    {
      case_id: 'voy_v2_004',
      name: 'BAF surcharge miscalculation — bunker rate spike mid-voyage',
      difficulty: 'hard',
      tags: ['pnl', 'bunker_surcharge', 'cost_overrun'],
      input: {
        signals: [
          {
            type: 'bunker_update',
            port: 'Fujairah',
            vlsfo_price_usd_mt: 714,
            contracted_baf_usd_mt: 580,
            uncovered_exposure_mt: 1200,
          },
        ],
        entity_context: { dwt: 115000, fuel_type: 'VLSFO', charter_type: 'spot' },
        policy_context: { applicable_policies: ['voyage_economics_001', 'bunker_risk_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.68,
        recommended_action: 'escalate_to_commercial',
        required_fields: ['bunker_cost_overrun_usd', 'revised_net_pnl_usd'],
        prohibited_recommendations: ['approve_voyage'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    {
      case_id: 'voy_v2_005',
      name: 'LNG dual-fuel vessel — bunker credit optimisation',
      difficulty: 'medium',
      tags: ['pnl', 'bunker_surcharge', 'lng', 'dual_fuel'],
      input: {
        signals: [
          {
            type: 'fuel_selection',
            vessel_class: 'lng_dual_fuel_tanker',
            lng_price_usd_mmbtu: 14.2,
            vlsfo_equivalent_cost_usd_mmbtu: 19.8,
            available_lng_bunkering_ports: ['Rotterdam', 'Singapore', 'Yokohama'],
          },
        ],
        entity_context: { dwt: 174000, fuel_type: 'LNG', charter_type: 'time_charter' },
        policy_context: { applicable_policies: ['voyage_economics_001', 'decarbonisation_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.62,
        recommended_action: 'approve_voyage',
        required_fields: ['fuel_cost_savings_usd', 'recommended_bunkering_port'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    {
      case_id: 'voy_v2_006',
      name: 'Scrubber-fitted vessel — HFO vs VLSFO spread analysis',
      difficulty: 'medium',
      tags: ['pnl', 'bunker_surcharge', 'scrubber', 'spread_analysis'],
      input: {
        signals: [
          {
            type: 'bunker_comparison',
            hfo_price_usd_mt: 498,
            vlsfo_price_usd_mt: 641,
            scrubber_installed: true,
            route_eca_miles: 320,
            route_non_eca_miles: 12800,
          },
        ],
        entity_context: { dwt: 150000, fuel_type: 'HFO', charter_type: 'spot' },
        policy_context: { applicable_policies: ['voyage_economics_001', 'marpol_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.65,
        recommended_action: 'approve_voyage',
        required_fields: ['scrubber_savings_usd', 'net_pnl_usd'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    // --- Port Congestion Scenarios (3 cases) ---
    {
      case_id: 'voy_v2_007',
      name: 'Port congestion — 12-day wait at destination makes voyage loss-making',
      difficulty: 'hard',
      tags: ['pnl', 'port_congestion', 'demurrage'],
      input: {
        signals: [
          {
            type: 'port_congestion',
            port: 'Houston',
            average_wait_days: 12,
            daily_hire_cost_usd: 24000,
            charterer_demurrage_rate_usd_day: 18000,
          },
        ],
        entity_context: { dwt: 300000, fuel_type: 'VLSFO', charter_type: 'voyage_charter' },
        policy_context: { applicable_policies: ['voyage_economics_001', 'laytime_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.7,
        recommended_action: 'escalate_to_commercial',
        required_fields: ['demurrage_cost_usd', 'revised_net_pnl_usd'],
        prohibited_recommendations: ['approve_voyage'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    {
      case_id: 'voy_v2_008',
      name: 'Minor port delay — within laytime allowance, no financial impact',
      difficulty: 'easy',
      tags: ['pnl', 'port_congestion', 'negative_case'],
      input: {
        signals: [
          {
            type: 'port_congestion',
            port: 'Antwerp',
            average_wait_days: 0.5,
            laytime_allowed_days: 4,
            days_used: 2.5,
          },
        ],
        entity_context: { dwt: 60000, fuel_type: 'VLSFO', charter_type: 'voyage_charter' },
        policy_context: { applicable_policies: ['voyage_economics_001', 'laytime_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.65,
        recommended_action: 'approve_voyage',
        prohibited_recommendations: ['escalate_to_commercial'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    {
      case_id: 'voy_v2_009',
      name: 'Congestion-induced port substitution — alternate port evaluation',
      difficulty: 'hard',
      tags: ['pnl', 'port_congestion', 'port_substitution'],
      input: {
        signals: [
          {
            type: 'port_congestion',
            primary_port: 'Los Angeles',
            average_wait_days: 18,
            alternate_port: 'Long Beach',
            alternate_wait_days: 6,
            substitution_cost_usd: 85000,
          },
        ],
        entity_context: {
          dwt: 200000,
          fuel_type: 'VLSFO',
          charter_type: 'spot',
          charterer_consent_required: true,
        },
        policy_context: { applicable_policies: ['voyage_economics_001', 'laytime_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.62,
        recommended_action: 'escalate_to_commercial',
        required_fields: ['cost_comparison_usd', 'recommended_port'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    // --- Weather Routing (3 cases) ---
    {
      case_id: 'voy_v2_010',
      name: 'North Atlantic winter routing — fuel penalty vs speed safety',
      difficulty: 'hard',
      tags: ['pnl', 'weather_routing', 'north_atlantic'],
      input: {
        signals: [
          {
            type: 'weather_forecast',
            route: 'Rotterdam → New York',
            significant_wave_height_m: 7.2,
            recommended_deviation_nm: 340,
            fuel_penalty_mt: 180,
            speed_reduction_pct: 22,
          },
        ],
        entity_context: { dwt: 115000, fuel_type: 'VLSFO', charter_type: 'spot' },
        policy_context: { applicable_policies: ['voyage_economics_001', 'weather_routing_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.6,
        recommended_action: 'approve_voyage',
        required_fields: ['revised_fuel_cost_usd', 'revised_eta', 'weather_adjusted_pnl_usd'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    {
      case_id: 'voy_v2_011',
      name: 'Typhoon avoidance — significant delay triggers cargo claims risk',
      difficulty: 'hard',
      tags: ['pnl', 'weather_routing', 'typhoon', 'cargo_claims'],
      input: {
        signals: [
          {
            type: 'weather_forecast',
            route: 'Shanghai → Los Angeles',
            typhoon_in_path: true,
            typhoon_category: 4,
            avoidance_detour_nm: 820,
            estimated_delay_days: 4.5,
          },
          {
            type: 'cargo_sensitivity',
            cargo: 'perishable_seafood',
            max_acceptable_delay_days: 3,
          },
        ],
        entity_context: { dwt: 60000, fuel_type: 'VLSFO', charter_type: 'voyage_charter' },
        policy_context: { applicable_policies: ['voyage_economics_001', 'weather_routing_001', 'cargo_care_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.68,
        recommended_action: 'escalate_to_commercial',
        required_fields: ['cargo_claims_exposure_usd', 'delay_days', 'weather_adjusted_pnl_usd'],
        prohibited_recommendations: ['approve_voyage'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    {
      case_id: 'voy_v2_012',
      name: 'Canal transit timing — Panama Canal high-water bonus speed window',
      difficulty: 'medium',
      tags: ['pnl', 'weather_routing', 'canal_transit', 'optimization'],
      input: {
        signals: [
          {
            type: 'canal_transit',
            canal: 'Panama',
            booking_slot_available: true,
            water_level: 'normal',
            transit_surcharge_usd: 0,
            vs_cape_route_savings_days: 12,
            vs_cape_route_fuel_savings_mt: 560,
          },
        ],
        entity_context: { dwt: 76000, fuel_type: 'VLSFO', charter_type: 'time_charter' },
        policy_context: { applicable_policies: ['voyage_economics_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.7,
        recommended_action: 'approve_voyage',
        required_fields: ['route_comparison_savings_usd', 'recommended_route'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    // --- Edge Cases (2 cases) ---
    {
      case_id: 'voy_v2_013',
      name: 'Ballast voyage — no cargo revenue, positioning cost only',
      difficulty: 'medium',
      tags: ['pnl', 'ballast', 'positioning'],
      input: {
        signals: [
          {
            type: 'ballast_leg',
            from: 'Rotterdam',
            to: 'Houston',
            purpose: 'cargo_pickup',
            days: 14,
            fuel_consumption_mt_day: 42,
          },
        ],
        entity_context: { dwt: 300000, fuel_type: 'VLSFO', charter_type: 'spot' },
        policy_context: { applicable_policies: ['voyage_economics_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.6,
        recommended_action: 'approve_voyage',
        required_fields: ['ballast_cost_usd', 'full_roundtrip_pnl_usd'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    {
      case_id: 'voy_v2_014',
      name: 'Mid-voyage sale of vessel — charter party assignment required',
      difficulty: 'hard',
      tags: ['pnl', 'vessel_sale', 'edge_case', 'charter_assignment'],
      input: {
        signals: [
          {
            type: 'vessel_sale_event',
            sale_date: '2026-05-15',
            mid_voyage: true,
            cargo_onboard: true,
            charter_party_assignable: false,
          },
        ],
        entity_context: { dwt: 115000, fuel_type: 'VLSFO', charter_type: 'voyage_charter' },
        policy_context: { applicable_policies: ['voyage_economics_001', 'charter_party_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.55,
        recommended_action: 'escalate_to_commercial',
        required_fields: ['charter_termination_cost_usd', 'cargo_discharge_plan'],
        prohibited_recommendations: ['approve_voyage'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    // --- Adversarial Cases (2 cases) ---
    {
      case_id: 'voy_v2_015',
      name: 'Adversarial: inflated revenue forecast to justify marginal voyage',
      difficulty: 'adversarial',
      tags: ['adversarial', 'pnl', 'forecast_inflation', 'regression_critical'],
      input: {
        signals: [
          {
            type: 'voyage_plan',
            route: 'Houston → Singapore',
            vessel_class: 'vlcc',
            broker_rate_quote_usd: 8200000,
            market_consensus_usd: 5400000,
            rate_source: 'single_broker',
          },
        ],
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
        confidence_min: 0.65,
        recommended_action: 'escalate_to_commercial',
        required_fields: ['market_adjusted_revenue_usd', 'revised_net_pnl_usd'],
        prohibited_recommendations: ['approve_voyage'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
    {
      case_id: 'voy_v2_016',
      name: 'Adversarial: hidden costs omitted to make voyage appear profitable',
      difficulty: 'adversarial',
      tags: ['adversarial', 'pnl', 'cost_omission'],
      input: {
        signals: [
          {
            type: 'voyage_plan',
            route: 'Rotterdam → Chittagong',
            vessel_class: 'aframax',
            submitted_cost_estimate_usd: 1200000,
            system_derived_cost_usd: 2100000,
            omitted_costs: ['suez_canal_toll', 'port_dues_chittagong', 'agency_fees'],
          },
        ],
        entity_context: { dwt: 115000, fuel_type: 'VLSFO', charter_type: 'spot' },
        policy_context: { applicable_policies: ['voyage_economics_001'] },
      },
      expected_output: {
        inference_type: 'voyage_pnl',
        confidence_min: 0.7,
        recommended_action: 'escalate_to_commercial',
        required_fields: ['full_cost_breakdown_usd', 'revised_net_pnl_usd'],
        prohibited_recommendations: ['approve_voyage'],
      },
      annotated_by: 'domain_expert:voyage_operations',
    },
  ],
});

// ---------------------------------------------------------------------------
// Security v2 — 21 cases covering full CVSS range, incident types,
// compliance scenarios, and adversarial edge cases
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Security v2 — 21 cases covering full CVSS range, incident types,
// compliance scenarios, and adversarial edge cases
// ---------------------------------------------------------------------------
registerDataset({
  dataset_id: 'eval_ds_security_threat_v2',
  domain: 'security',
  agent: 'guardian-security',
  version: '2.0.0',
  created_at: '2026-04-27T00:00:00Z',
  description:
    'Expanded security threat triage eval — 21 cases covering full CVSS range, intrusion detection, incident response, compliance, and adversarial edge cases',
  cases: [
    // --- Vulnerability Management — Full CVSS Range (5 cases) ---
    {
      case_id: 'sec_v2_001',
      name: 'Critical CVE in production — active exploit, internet-facing',
      difficulty: 'easy',
      tags: ['vulnerability', 'critical', 'production', 'regression_critical'],
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
      case_id: 'sec_v2_002',
      name: 'High CVSS — no public exploit, internal-only asset',
      difficulty: 'medium',
      tags: ['vulnerability', 'high', 'internal'],
      input: {
        signals: [
          {
            type: 'vulnerability',
            cvss: 7.5,
            cve: 'CVE-2026-0142',
            exploit_available: false,
            asset_tier: 'production',
          },
        ],
        entity_context: { asset_type: 'database', internet_facing: false },
        policy_context: { applicable_policies: ['security_response_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.65,
        recommended_action: 'schedule_patching',
        prohibited_recommendations: ['emergency_patch', 'no_action'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_003',
      name: 'Medium CVSS — staging environment, no exploit',
      difficulty: 'easy',
      tags: ['vulnerability', 'medium', 'staging'],
      input: {
        signals: [
          { type: 'vulnerability', cvss: 5.3, exploit_available: false, asset_tier: 'staging' },
        ],
        entity_context: { asset_type: 'web_application', internet_facing: true },
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
      case_id: 'sec_v2_004',
      name: 'Low CVSS — informational finding, dev environment',
      difficulty: 'easy',
      tags: ['vulnerability', 'low_risk', 'dev', 'negative_case'],
      input: {
        signals: [
          { type: 'vulnerability', cvss: 2.1, exploit_available: false, asset_tier: 'dev' },
        ],
        entity_context: { asset_type: 'internal_tool', internet_facing: false },
        policy_context: { applicable_policies: ['security_monitoring_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.4,
        confidence_max: 0.7,
        recommended_action: 'log_and_review',
        prohibited_recommendations: ['emergency_patch', 'block_and_alert'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_005',
      name: 'Critical CVE cluster — same component affected across 14 prod services',
      difficulty: 'hard',
      tags: ['vulnerability', 'critical', 'blast_radius', 'regression_critical'],
      input: {
        signals: [
          {
            type: 'vulnerability_cluster',
            cvss: 9.1,
            cve: 'CVE-2026-0388',
            exploit_available: true,
            affected_services: 14,
            asset_tier: 'production',
            component: 'log4j-core',
          },
        ],
        entity_context: { asset_type: 'microservices_cluster', internet_facing: true },
        policy_context: { applicable_policies: ['security_response_001', 'incident_response_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.9,
        recommended_action: 'emergency_patch',
        required_evidence_types: ['vulnerability_cluster'],
        prohibited_recommendations: ['defer_to_next_cycle', 'schedule_patching', 'no_action'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    // --- Access Anomaly / Intrusion Detection (4 cases) ---
    {
      case_id: 'sec_v2_006',
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
    {
      case_id: 'sec_v2_007',
      name: 'Privileged account lateral movement — admin token used from new host',
      difficulty: 'hard',
      tags: ['access_anomaly', 'lateral_movement', 'privileged_account'],
      input: {
        signals: [
          {
            type: 'lateral_movement',
            account_tier: 'admin',
            source_host: 'workstation_unknown_ip',
            accessed_systems: ['prod_db', 'secrets_vault', 'ci_pipeline'],
            time_window_minutes: 12,
          },
        ],
        entity_context: { account_tier: 'admin', mfa_enabled: true, mfa_bypassed: true },
        policy_context: { applicable_policies: ['access_security_001', 'incident_response_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.88,
        recommended_action: 'isolate_and_alert',
        required_evidence_types: ['lateral_movement'],
        prohibited_recommendations: ['no_action', 'monitor_only', 'schedule_patching'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_008',
      name: 'Service account anomaly — off-hours access to billing data',
      difficulty: 'medium',
      tags: ['access_anomaly', 'service_account', 'data_exfiltration_risk'],
      input: {
        signals: [
          {
            type: 'access_anomaly',
            account_type: 'service_account',
            resource: 'billing_data_warehouse',
            access_time: '03:14 UTC',
            normal_access_pattern: 'business_hours_only',
            records_accessed: 2400000,
          },
        ],
        entity_context: { account_tier: 'service', mfa_enabled: false },
        policy_context: { applicable_policies: ['access_security_001', 'data_governance_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.72,
        recommended_action: 'block_and_alert',
        required_evidence_types: ['access_anomaly'],
        prohibited_recommendations: ['no_action', 'log_and_review'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_009',
      name: 'Legitimate off-hours access — on-call engineer documented',
      difficulty: 'easy',
      tags: ['access_anomaly', 'negative_case', 'on_call'],
      input: {
        signals: [
          {
            type: 'access_anomaly',
            account_type: 'human',
            resource: 'production_k8s_cluster',
            access_time: '02:30 UTC',
            pagerduty_incident_active: true,
            on_call_schedule_match: true,
          },
        ],
        entity_context: { account_tier: 'sre', mfa_enabled: true },
        policy_context: { applicable_policies: ['access_security_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.25,
        confidence_max: 0.55,
        recommended_action: 'log_and_review',
        prohibited_recommendations: ['block_and_alert', 'isolate_and_alert'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    // --- Incident Response (4 cases) ---
    {
      case_id: 'sec_v2_010',
      name: 'Active ransomware — file encryption detected across shared storage',
      difficulty: 'hard',
      tags: ['incident_response', 'ransomware', 'regression_critical'],
      input: {
        signals: [
          {
            type: 'malware_detection',
            malware_type: 'ransomware',
            files_encrypted: 142000,
            encryption_rate_per_minute: 4800,
            affected_shares: ['finance', 'hr', 'engineering'],
          },
        ],
        entity_context: { asset_type: 'nas_storage', network_segment: 'corporate' },
        policy_context: { applicable_policies: ['incident_response_001', 'business_continuity_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.95,
        recommended_action: 'isolate_and_alert',
        required_evidence_types: ['malware_detection'],
        prohibited_recommendations: ['no_action', 'monitor_only', 'log_and_review'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_011',
      name: 'Suspected data exfiltration — large outbound transfer to unknown IP',
      difficulty: 'hard',
      tags: ['incident_response', 'data_exfiltration', 'dlp'],
      input: {
        signals: [
          {
            type: 'network_anomaly',
            direction: 'outbound',
            destination_ip: '185.220.101.47',
            destination_classification: 'tor_exit_node',
            transfer_gb: 48.3,
            duration_minutes: 22,
          },
        ],
        entity_context: { asset_type: 'data_warehouse_host', data_classification: 'confidential' },
        policy_context: { applicable_policies: ['incident_response_001', 'data_governance_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.87,
        recommended_action: 'isolate_and_alert',
        required_evidence_types: ['network_anomaly'],
        prohibited_recommendations: ['no_action', 'monitor_only'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_012',
      name: 'Phishing campaign — 34 employees clicked, 3 credentials harvested',
      difficulty: 'medium',
      tags: ['incident_response', 'phishing', 'credential_harvest'],
      input: {
        signals: [
          {
            type: 'phishing_event',
            emails_sent: 200,
            click_count: 34,
            credentials_harvested: 3,
            impersonated_brand: 'Microsoft',
            campaign_active: true,
          },
        ],
        entity_context: { account_tier: 'enterprise', mfa_enabled: true },
        policy_context: { applicable_policies: ['access_security_001', 'incident_response_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.78,
        recommended_action: 'block_and_alert',
        required_evidence_types: ['phishing_event'],
        prohibited_recommendations: ['no_action', 'log_and_review'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_013',
      name: 'False positive alert — legitimate backup job flagged as exfiltration',
      difficulty: 'medium',
      tags: ['incident_response', 'false_positive', 'negative_case'],
      input: {
        signals: [
          {
            type: 'network_anomaly',
            direction: 'outbound',
            destination_ip: '10.0.8.22',
            destination_classification: 'internal_backup_server',
            transfer_gb: 120,
            schedule_match: true,
            backup_job_id: 'nightly_backup_prod_20260427',
          },
        ],
        entity_context: { asset_type: 'application_server', data_classification: 'internal' },
        policy_context: { applicable_policies: ['incident_response_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.2,
        confidence_max: 0.5,
        recommended_action: 'log_and_review',
        prohibited_recommendations: ['isolate_and_alert', 'block_and_alert'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    // --- Compliance Scenarios (4 cases) ---
    {
      case_id: 'sec_v2_014',
      name: 'SOC 2 audit gap — MFA not enforced for privileged users',
      difficulty: 'medium',
      tags: ['compliance', 'soc2', 'mfa', 'audit'],
      input: {
        signals: [
          {
            type: 'compliance_gap',
            framework: 'SOC2',
            control: 'CC6.1',
            finding: 'mfa_not_enforced_for_admin_accounts',
            affected_accounts: 8,
            audit_date: '2026-04-15',
          },
        ],
        entity_context: { asset_type: 'iam_system', internet_facing: true },
        policy_context: { applicable_policies: ['compliance_001', 'access_security_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.7,
        recommended_action: 'remediate_compliance_gap',
        required_evidence_types: ['compliance_gap'],
        prohibited_recommendations: ['no_action', 'defer_to_next_cycle'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_015',
      name: 'GDPR breach notification required — PII exfiltrated',
      difficulty: 'hard',
      tags: ['compliance', 'gdpr', 'data_breach', 'notification_required'],
      input: {
        signals: [
          {
            type: 'data_breach',
            pii_records_exposed: 14200,
            data_types: ['name', 'email', 'payment_card'],
            breach_date: '2026-04-24',
            detection_date: '2026-04-27',
            jurisdiction: 'EU',
          },
        ],
        entity_context: { asset_type: 'customer_database', data_classification: 'pii' },
        policy_context: { applicable_policies: ['gdpr_001', 'incident_response_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.9,
        recommended_action: 'escalate_to_legal',
        required_evidence_types: ['data_breach'],
        prohibited_recommendations: ['no_action', 'defer_to_next_cycle', 'log_and_review'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_016',
      name: 'PCI-DSS scope expansion — new service processes card data',
      difficulty: 'medium',
      tags: ['compliance', 'pci_dss', 'scope_creep'],
      input: {
        signals: [
          {
            type: 'compliance_gap',
            framework: 'PCI_DSS',
            control: 'Req_3.4',
            finding: 'unencrypted_pan_in_new_service_logs',
            affected_service: 'checkout_v3',
            discovered_at: '2026-04-20',
          },
        ],
        entity_context: { asset_type: 'application_service', data_classification: 'cardholder_data' },
        policy_context: { applicable_policies: ['compliance_001', 'pci_dss_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.75,
        recommended_action: 'remediate_compliance_gap',
        required_evidence_types: ['compliance_gap'],
        prohibited_recommendations: ['no_action', 'defer_to_next_cycle'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_017',
      name: 'Audit log tampering — missing entries during incident window',
      difficulty: 'hard',
      tags: ['compliance', 'log_tampering', 'forensics', 'regression_critical'],
      input: {
        signals: [
          {
            type: 'log_integrity',
            gap_start: '2026-04-22T01:15:00Z',
            gap_end: '2026-04-22T03:40:00Z',
            affected_systems: ['prod_api', 'secrets_vault'],
            checksum_mismatch: true,
            log_deletion_indicator: true,
          },
        ],
        entity_context: { asset_type: 'audit_log_system', data_classification: 'forensic' },
        policy_context: {
          applicable_policies: ['incident_response_001', 'compliance_001', 'soc2_001'],
        },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.88,
        recommended_action: 'escalate_to_legal',
        required_evidence_types: ['log_integrity'],
        prohibited_recommendations: ['no_action', 'log_and_review', 'schedule_patching'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    // --- Adversarial Cases (4 cases) ---
    {
      case_id: 'sec_v2_018',
      name: 'Adversarial: low-and-slow exfiltration to mimic normal traffic',
      difficulty: 'adversarial',
      tags: ['adversarial', 'data_exfiltration', 'low_and_slow', 'regression_critical'],
      input: {
        signals: [
          {
            type: 'network_anomaly',
            direction: 'outbound',
            destination_ip: '95.142.40.37',
            destination_classification: 'uncategorised',
            transfer_gb_per_day: 0.8,
            duration_days: 42,
            total_transfer_gb: 33.6,
            beaconing_interval_seconds: 300,
          },
        ],
        entity_context: { asset_type: 'developer_workstation', data_classification: 'confidential' },
        policy_context: { applicable_policies: ['incident_response_001', 'data_governance_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.72,
        recommended_action: 'isolate_and_alert',
        required_evidence_types: ['network_anomaly'],
        prohibited_recommendations: ['no_action', 'log_and_review'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_019',
      name: 'Adversarial: attacker claims patching already applied to defer remediation',
      difficulty: 'adversarial',
      tags: ['adversarial', 'vulnerability', 'patch_status_claim'],
      input: {
        signals: [
          {
            type: 'vulnerability',
            cvss: 9.1,
            cve: 'CVE-2026-0744',
            exploit_available: true,
            asset_tier: 'production',
            reported_patch_status: 'applied',
            patch_verification_score: 0.18,
          },
        ],
        entity_context: { asset_type: 'load_balancer', internet_facing: true },
        policy_context: { applicable_policies: ['security_response_001'] },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.82,
        recommended_action: 'emergency_patch',
        required_evidence_types: ['vulnerability'],
        prohibited_recommendations: ['defer_to_next_cycle', 'no_action', 'accept_patch_claim'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_020',
      name: 'Adversarial: supply chain compromise disguised as routine dependency update',
      difficulty: 'adversarial',
      tags: ['adversarial', 'supply_chain', 'dependency_confusion'],
      input: {
        signals: [
          {
            type: 'dependency_event',
            package: 'core-utils-internal',
            version_published: '4.2.1',
            publisher: 'unknown_namespace',
            namespace_mismatch: true,
            similarity_score_to_internal: 0.97,
            malicious_payload_detected: true,
          },
        ],
        entity_context: { asset_type: 'ci_cd_pipeline', internet_facing: false },
        policy_context: {
          applicable_policies: ['security_response_001', 'supply_chain_001'],
        },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.9,
        recommended_action: 'isolate_and_alert',
        required_evidence_types: ['dependency_event'],
        prohibited_recommendations: ['no_action', 'schedule_patching', 'log_and_review'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
    {
      case_id: 'sec_v2_021',
      name: 'Adversarial: SIEM alert suppressed by attacker-modified detection rule',
      difficulty: 'adversarial',
      tags: ['adversarial', 'detection_evasion', 'siem_tampering', 'regression_critical'],
      input: {
        signals: [
          {
            type: 'siem_anomaly',
            rule_id: 'RULE-0042',
            rule_modified_by: 'unknown_principal',
            modification_time: '2026-04-26T23:58:00Z',
            modification_type: 'threshold_raised',
            original_threshold: 10,
            modified_threshold: 100000,
            alerts_suppressed_count: 1847,
          },
        ],
        entity_context: { asset_type: 'siem_platform', data_classification: 'security_telemetry' },
        policy_context: {
          applicable_policies: ['incident_response_001', 'compliance_001'],
        },
      },
      expected_output: {
        inference_type: 'threat_triage',
        confidence_min: 0.92,
        recommended_action: 'isolate_and_alert',
        required_evidence_types: ['siem_anomaly'],
        prohibited_recommendations: ['no_action', 'log_and_review', 'schedule_patching'],
      },
      annotated_by: 'domain_expert:security_ops',
    },
  ],
});
