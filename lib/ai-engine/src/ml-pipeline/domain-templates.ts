export type ModelAlgorithm =
  | 'gradient_boosted_classifier'
  | 'gradient_boosted_regression'
  | 'random_forest_classifier'
  | 'random_forest_regression'
  | 'logistic_regression'
  | 'linear_regression'
  | 'isolation_forest'
  | 'time_series'
  | 'prophet'
  | 'arima'
  | 'xgboost_classifier'
  | 'xgboost_regression';

export type PredictionTask =
  | 'classification'
  | 'regression'
  | 'forecasting'
  | 'anomaly_detection'
  | 'ranking'
  | 'scoring';

export interface DomainModelTemplate {
  modelType: string;
  description: string;
  task: PredictionTask;
  algorithmFamily: ModelAlgorithm;
  targetColumn: string;
  primaryMetric: string;
  defaultHyperparameters: Record<string, unknown>;
  featureGroups: string[];
  notes: string;
}

// ---------------------------------------------------------------------------
// Pre-configured model templates per domain
// ---------------------------------------------------------------------------

export const DOMAIN_MODEL_TEMPLATES: Record<string, DomainModelTemplate[]> = {
  // ── Vessels ───────────────────────────────────────────────────────────────
  vessels: [
    {
      modelType: 'fuel_consumption_forecast',
      description: 'Time-series forecasting of daily fuel consumption per vessel',
      task: 'forecasting',
      algorithmFamily: 'time_series',
      targetColumn: 'fuel_tonnes_per_day',
      primaryMetric: 'mape',
      defaultHyperparameters: {
        horizon_days: 14,
        seasonality_mode: 'additive',
        changepoint_prior_scale: 0.05,
        fourier_order: 5,
      },
      featureGroups: [
        'vessels.fuel_consumption_7d_avg',
        'vessels.speed_variance',
        'vessels.cargo_utilisation',
      ],
      notes: 'Prophet-style with weekly seasonality and holiday effects for drydock windows',
    },
    {
      modelType: 'eta_prediction',
      description: 'Estimated time of arrival regression for port calls',
      task: 'regression',
      algorithmFamily: 'gradient_boosted_regression',
      targetColumn: 'eta_deviation_hours',
      primaryMetric: 'rmse',
      defaultHyperparameters: {
        n_estimators: 300,
        max_depth: 6,
        learning_rate: 0.05,
        subsample: 0.8,
        colsample_bytree: 0.8,
      },
      featureGroups: [
        'vessels.route_deviation_score',
        'vessels.speed_variance',
        'vessels.port_call_frequency',
      ],
      notes: 'Regression on ETA deviation; features include weather proxy and AIS gap counts',
    },
    {
      modelType: 'maintenance_failure_classifier',
      description: 'Binary classifier predicting maintenance failure within 30 days',
      task: 'classification',
      algorithmFamily: 'gradient_boosted_classifier',
      targetColumn: 'failure_within_30d',
      primaryMetric: 'auc',
      defaultHyperparameters: {
        n_estimators: 400,
        max_depth: 5,
        learning_rate: 0.05,
        scale_pos_weight: 5,
      },
      featureGroups: [
        'vessels.days_since_last_maintenance',
        'vessels.fuel_consumption_7d_avg',
        'vessels.speed_variance',
      ],
      notes: 'Class-imbalanced — scale_pos_weight set for ~1:5 positive:negative ratio',
    },
  ],

  // ── Terra ─────────────────────────────────────────────────────────────────
  terra: [
    {
      modelType: 'property_valuation',
      description: 'Automated Valuation Model (AVM) for property price estimation',
      task: 'regression',
      algorithmFamily: 'gradient_boosted_regression',
      targetColumn: 'sale_price_usd',
      primaryMetric: 'mape',
      defaultHyperparameters: {
        n_estimators: 500,
        max_depth: 6,
        learning_rate: 0.03,
        min_child_weight: 5,
        reg_alpha: 0.1,
      },
      featureGroups: [
        'terra.price_per_sqft',
        'terra.neighborhood_cap_rate',
        'terra.walk_score',
        'terra.zoning_class',
      ],
      notes: 'Log-transform target price; separate models per asset class recommended',
    },
    {
      modelType: 'rent_prediction',
      description: 'Rental rate prediction for residential and commercial units',
      task: 'regression',
      algorithmFamily: 'gradient_boosted_regression',
      targetColumn: 'monthly_rent_usd',
      primaryMetric: 'rmse',
      defaultHyperparameters: { n_estimators: 400, max_depth: 5, learning_rate: 0.04 },
      featureGroups: ['terra.price_per_sqft', 'terra.vacancy_rate_submarket', 'terra.walk_score'],
      notes: 'Sub-market vacancy rate is the strongest predictor',
    },
    {
      modelType: 'distress_classifier',
      description: 'Predicts likelihood of distressed sale within 90 days',
      task: 'classification',
      algorithmFamily: 'xgboost_classifier',
      targetColumn: 'distressed_within_90d',
      primaryMetric: 'f1',
      defaultHyperparameters: {
        n_estimators: 300,
        max_depth: 4,
        learning_rate: 0.05,
        scale_pos_weight: 8,
      },
      featureGroups: [
        'terra.days_on_market',
        'terra.price_reduction_count',
        'terra.vacancy_rate_submarket',
      ],
      notes: 'High precision preferred over recall — alert fatigue in the workflow',
    },
    {
      modelType: 'distress_propagation',
      description:
        'Forecasts probability that distress in a given asset cascades to linked assets (same ownership LLC chain or cross-collateral lender) within 90 days',
      task: 'forecasting',
      algorithmFamily: 'xgboost_classifier',
      targetColumn: 'cascade_prob_90d',
      primaryMetric: 'auc',
      defaultHyperparameters: {
        n_estimators: 400,
        max_depth: 5,
        learning_rate: 0.04,
        scale_pos_weight: 12,
        subsample: 0.85,
        colsample_bytree: 0.8,
      },
      featureGroups: [
        'terra.days_on_market',
        'terra.price_reduction_count',
        'terra.owner_entity_distress_count',
        'terra.cross_collateral_loan_count',
        'terra.lender_concentration_score',
        'terra.dscr',
        'terra.loan_maturity_months',
      ],
      notes:
        'Graph-based entity linking required before inference — owner LLC network is the primary propagation channel. Monte Carlo intervals produced per asset.',
    },
    {
      modelType: 'climate_adjusted_cap_rate',
      description:
        '5-year forward cap-rate forecast adjusted for FEMA flood risk premium and NOAA climate drift signal; output is a basis-point adjustment on base cap rate',
      task: 'forecasting',
      algorithmFamily: 'gradient_boosted_regression',
      targetColumn: 'climate_adjusted_cap_rate_5yr_bps',
      primaryMetric: 'rmse',
      defaultHyperparameters: {
        n_estimators: 350,
        max_depth: 4,
        learning_rate: 0.05,
        min_child_weight: 3,
        reg_lambda: 1.2,
      },
      featureGroups: [
        'terra.base_cap_rate',
        'terra.fema_nri_score',
        'terra.fema_flood_zone',
        'terra.noaa_temp_drift_5yr_c',
        'terra.noaa_precip_drift_5yr_mm',
        'terra.insurance_loss_ratio_submarket',
        'terra.coastal_distance_km',
        'terra.elevation_m',
      ],
      notes:
        'Climate drift signal is NOAA 30-yr normal minus 5-yr recent average. Positive temp drift amplifies cap-rate premium for heat/flood risk markets (Phoenix, Miami).',
    },
    {
      modelType: 'owner_intent',
      description:
        '12-month probability of voluntary sale or refinance inferred from public-record signals: NOD filings, deed velocity, corporate entity events, and dark-pool vacancy signals',
      task: 'classification',
      algorithmFamily: 'xgboost_classifier',
      targetColumn: 'intent_sale_or_refi_12m',
      primaryMetric: 'auc',
      defaultHyperparameters: {
        n_estimators: 300,
        max_depth: 4,
        learning_rate: 0.05,
        scale_pos_weight: 7,
        subsample: 0.8,
      },
      featureGroups: [
        'terra.nod_filing_count_12m',
        'terra.deed_transfer_count_36m',
        'terra.owner_entity_age_months',
        'terra.corporate_event_flags',
        'terra.vacancy_rate_submarket',
        'terra.loan_maturity_months',
        'terra.days_since_last_sale',
        'terra.price_per_sqft_vs_submarket_median',
      ],
      notes:
        'Recalibrate quarterly using resolved outcomes (actual sales within 12m). SHAP attribution shown in owner-intent UI panel.',
    },
  ],

  // ── PRISM ─────────────────────────────────────────────────────────────────
  prism: [
    {
      modelType: 'case_outcome_classifier',
      description: 'Multi-class classifier for case outcome (win / settle / lose)',
      task: 'classification',
      algorithmFamily: 'gradient_boosted_classifier',
      targetColumn: 'case_outcome',
      primaryMetric: 'f1',
      defaultHyperparameters: {
        n_estimators: 350,
        max_depth: 5,
        learning_rate: 0.05,
        num_class: 3,
      },
      featureGroups: [
        'prism.case_age_days',
        'prism.opposing_counsel_win_rate',
        'prism.motion_grant_rate_judge',
        'prism.filing_jurisdiction',
      ],
      notes: 'SHAP explanations required — output is used in client-facing risk reports',
    },
    {
      modelType: 'settlement_probability',
      description: 'Regression for probability of reaching settlement at current demand level',
      task: 'regression',
      algorithmFamily: 'logistic_regression',
      targetColumn: 'settlement_probability',
      primaryMetric: 'auc',
      defaultHyperparameters: { C: 1.0, penalty: 'l2', solver: 'lbfgs', max_iter: 1000 },
      featureGroups: [
        'prism.settlement_demand_to_claimed_ratio',
        'prism.case_age_days',
        'prism.discovery_volume_pages',
      ],
      notes: 'Logistic regression for interpretability in legal context',
    },
  ],

  // ── Aegis ─────────────────────────────────────────────────────────────────
  aegis: [
    {
      modelType: 'threat_anomaly_detector',
      description: 'Isolation Forest for endpoint/network anomaly detection',
      task: 'anomaly_detection',
      algorithmFamily: 'isolation_forest',
      targetColumn: 'is_anomaly',
      primaryMetric: 'auc',
      defaultHyperparameters: {
        n_estimators: 200,
        contamination: 0.01,
        max_features: 0.8,
        bootstrap: true,
      },
      featureGroups: [
        'aegis.failed_auth_rate_1h',
        'aegis.lateral_movement_score',
        'aegis.data_exfil_bytes_delta',
        'aegis.privilege_escalation_events',
      ],
      notes: 'Contamination tuned to ~1% expected anomaly rate in production',
    },
    {
      modelType: 'threat_severity_scorer',
      description: 'Regression model scoring threat severity (0–100)',
      task: 'scoring',
      algorithmFamily: 'gradient_boosted_regression',
      targetColumn: 'threat_severity_score',
      primaryMetric: 'rmse',
      defaultHyperparameters: { n_estimators: 300, max_depth: 5, learning_rate: 0.05 },
      featureGroups: [
        'aegis.ioc_match_count',
        'aegis.user_baseline_deviation',
        'aegis.privilege_escalation_events',
        'aegis.lateral_movement_score',
      ],
      notes: 'Output calibrated to 0–100 severity scale used in SOC dashboard',
    },
  ],

  // ── SZL Holdings ──────────────────────────────────────────────────────────
  szl: [
    {
      modelType: 'deal_quality_scorer',
      description: 'Scores investment deal quality (0–100) for pipeline prioritisation',
      task: 'scoring',
      algorithmFamily: 'gradient_boosted_regression',
      targetColumn: 'deal_quality_score',
      primaryMetric: 'rmse',
      defaultHyperparameters: {
        n_estimators: 400,
        max_depth: 5,
        learning_rate: 0.04,
        subsample: 0.8,
      },
      featureGroups: ['szl.revenue_growth_yoy', 'szl.gross_margin', 'szl.burn_multiple', 'szl.ndr'],
      notes: 'Score calibrated against historical IC approval decisions',
    },
    {
      modelType: 'lp_reup_classifier',
      description: 'Predicts LP re-up probability at next fund close',
      task: 'classification',
      algorithmFamily: 'random_forest_classifier',
      targetColumn: 'lp_reup',
      primaryMetric: 'auc',
      defaultHyperparameters: { n_estimators: 300, max_depth: 6, min_samples_leaf: 5 },
      featureGroups: ['szl.sector_momentum_score', 'szl.revenue_growth_yoy', 'szl.months_runway'],
      notes: 'Small LP universe — random forest avoids overfitting vs gradient boosting',
    },
    {
      modelType: 'portfolio_health_scorer',
      description: 'Composite health score for portfolio companies',
      task: 'scoring',
      algorithmFamily: 'xgboost_regression',
      targetColumn: 'portfolio_health_score',
      primaryMetric: 'r2',
      defaultHyperparameters: { n_estimators: 250, max_depth: 4, learning_rate: 0.06 },
      featureGroups: [
        'szl.revenue_growth_yoy',
        'szl.burn_multiple',
        'szl.ndr',
        'szl.months_runway',
        'szl.gross_margin',
      ],
      notes: 'Monthly batch refresh; used for quarterly board reporting',
    },
  ],

  // ── Lyte ──────────────────────────────────────────────────────────────────
  lyte: [
    {
      modelType: 'incident_volume_forecast',
      description: 'Forecasts incident count for the next 7 days',
      task: 'forecasting',
      algorithmFamily: 'time_series',
      targetColumn: 'incident_count',
      primaryMetric: 'mape',
      defaultHyperparameters: {
        horizon_days: 7,
        seasonality: 'weekly',
        changepoint_prior_scale: 0.1,
      },
      featureGroups: [
        'lyte.incident_rate_7d',
        'lyte.deployment_frequency_7d',
        'lyte.error_rate_pct',
      ],
      notes: 'Captures deploy-surge seasonality with weekly and deployment-day effects',
    },
    {
      modelType: 'sla_breach_classifier',
      description: 'Predicts SLA breach risk in the next 1 hour',
      task: 'classification',
      algorithmFamily: 'gradient_boosted_classifier',
      targetColumn: 'sla_breach_1h',
      primaryMetric: 'f1',
      defaultHyperparameters: {
        n_estimators: 300,
        max_depth: 4,
        learning_rate: 0.05,
        scale_pos_weight: 6,
      },
      featureGroups: [
        'lyte.p99_latency_ms',
        'lyte.error_rate_pct',
        'lyte.cpu_utilisation_avg',
        'lyte.slo_compliance_pct',
      ],
      notes: 'Alert threshold tuned to 0.6 probability for early-warning use case',
    },
    {
      modelType: 'capacity_demand_forecast',
      description: 'Forecasts compute capacity requirement for next 24 h',
      task: 'forecasting',
      algorithmFamily: 'gradient_boosted_regression',
      targetColumn: 'capacity_units_required',
      primaryMetric: 'mape',
      defaultHyperparameters: { n_estimators: 350, max_depth: 5, learning_rate: 0.04 },
      featureGroups: [
        'lyte.cpu_utilisation_avg',
        'lyte.p99_latency_ms',
        'lyte.deployment_frequency_7d',
      ],
      notes: 'Used by auto-scaling to pre-provision infrastructure',
    },
  ],
};

export function getDomainTemplates(domain: string): DomainModelTemplate[] {
  return DOMAIN_MODEL_TEMPLATES[domain] ?? [];
}

export function getAllDomainTemplates(): Record<string, DomainModelTemplate[]> {
  return DOMAIN_MODEL_TEMPLATES;
}

export function getTemplate(domain: string, modelType: string): DomainModelTemplate | null {
  return DOMAIN_MODEL_TEMPLATES[domain]?.find((t) => t.modelType === modelType) ?? null;
}
