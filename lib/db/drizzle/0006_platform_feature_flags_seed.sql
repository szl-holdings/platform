-- Platform Feature Flags Seed
-- Seeds the 10 required platform feature flags with role/org targeting support.
-- Uses ON CONFLICT DO NOTHING so re-running is safe.

INSERT INTO feature_flags (key, name, description, is_enabled, rollout_percentage, created_at, updated_at)
VALUES
  (
    'lyte_readiness_enabled',
    'Lyte — Readiness Module',
    'Enables the Lyte Readiness scoring engine, dimension tracking, and blocker analysis. Disable to hide readiness from the command center.',
    true,
    100,
    NOW(),
    NOW()
  ),
  (
    'lyte_value_at_risk_enabled',
    'Lyte — Value at Risk Module',
    'Enables the Value at Risk financial exposure model within Lyte signals. Requires readiness data to be present.',
    true,
    100,
    NOW(),
    NOW()
  ),
  (
    'lyte_role_views_enabled',
    'Lyte — Role-Based Views',
    'Enables role-specific dashboard views in Lyte (CTO, CFO, Operations). When off, shows unified view for all roles.',
    false,
    0,
    NOW(),
    NOW()
  ),
  (
    'vessels_command_mode_enabled',
    'Vessels — Command Mode',
    'Enables the vessels command mode with active dispatch and route override capabilities. Requires elevated permissions.',
    true,
    100,
    NOW(),
    NOW()
  ),
  (
    'vessels_corridor_intelligence_enabled',
    'Vessels — Corridor Intelligence',
    'Enables the AI corridor intelligence layer with route pressure scoring and geopolitical risk overlays.',
    true,
    100,
    NOW(),
    NOW()
  ),
  (
    'alloy_admin_enabled',
    'Alloy — Admin Mode',
    'Enables the Alloy admin interface for KB management, document ingestion, and advisory configuration. Admin role required.',
    true,
    100,
    NOW(),
    NOW()
  ),
  (
    'alloy_artifact_approvals_enabled',
    'Alloy — Artifact Approvals',
    'Enables the artifact approval workflow. Generated artifacts require approval before delivery when this flag is on.',
    false,
    0,
    NOW(),
    NOW()
  ),
  (
    'internal_audit_console_enabled',
    'Internal — Audit Console',
    'Enables the privileged audit console in the admin panel, showing raw audit events and activity logs. Admin/ops only.',
    true,
    100,
    NOW(),
    NOW()
  ),
  (
    'pilot_customer_portal_enabled',
    'Pilot — Customer Portal',
    'Enables the pilot customer self-service portal. Targeted at specific org IDs during onboarding pilot phase.',
    false,
    0,
    NOW(),
    NOW()
  ),
  (
    'advanced_export_enabled',
    'Platform — Advanced Export',
    'Enables advanced export options including CSV bulk export, scheduled reports, and API data extracts across all modules.',
    false,
    20,
    NOW(),
    NOW()
  )
ON CONFLICT (key) DO NOTHING;
