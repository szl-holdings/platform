export const LOCAL_METRIC_NAMES = [
  'surfaces_customer_facing',
  'ouroboros_tests',
  'platform_tests',
  'mcp_e2e_tests',
  'monorepo_packages',
  'api_endpoints',
  'ci_workflows',
  'lean_theorems_locked',
  'lean_sorry_count',
  'lambda_overhead_ms_median',
] as const;

export const REMOTE_METRIC_NAMES = [
  'db_tables',
  'hf_models',
  'hf_datasets',
  'hf_spaces',
  'hf_collections',
  'receipt_chain_depth',
] as const;

export const CANONICAL_METRIC_NAMES = [...LOCAL_METRIC_NAMES, ...REMOTE_METRIC_NAMES] as const;
