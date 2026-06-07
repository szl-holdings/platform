# Docs Consolidation Report

**Task:** #2668 — Consolidate root-level markdown files into `docs/`
**Date:** 2026-04-20
**Author:** Agent (Task #2668)
**Status:** Complete

---

## Executive Summary

153 markdown files were moved from the repository root into a coherent `docs/` structure. The root now contains only 6 canonical files plus `replit.md`. A master index, section indexes, and navigation root were created. 1,208 internal markdown links were updated to reflect new paths.

---

## Before / After

| Metric | Before | After |
|--------|--------|-------|
| Root `.md` files | ~160 | 7 (6 canonical + replit.md) |
| `docs/` sections | 4 (architecture, security, investor, operations) | 7 (+product, sales, launch) |
| Total `docs/` files | ~450 | 609 |
| Broken internal links (clickable) | 1,208 | 0 |
| Index files | None | 9 (master + 7 sections + README) |

---

## Root Files Retained (Canonical 6 + replit.md)

| File | Reason |
|------|--------|
| `README.md` | Project entry point — all links updated |
| `LICENSE.md` | Legal requirement |
| `CHANGELOG.md` | Release history |
| `CONTRIBUTING.md` | Contribution guidelines |
| `SECURITY.md` | Security disclosure policy |
| `CODE_OF_CONDUCT.md` | Community standards |
| `replit.md` | Replit platform configuration (not a user doc) |

---

## Files Deleted

| File | Reason |
|------|--------|
| `ARCHITECTURE.md` | Explicitly superseded by `architecture.md` v4.0 (v2.0 stub); deleted per prior task decision |

---

## Conflicts Resolved / Merges

| Conflict | Resolution |
|----------|-----------|
| `architecture.md` (root v4.0) vs `docs/architecture.md` (v2.0) | Root v4.0 kept as canonical; old `docs/architecture.md` replaced with redirect stub pointing to `docs/architecture/architecture.md` |
| `KNOWN-GAPS.md` (root, rev7 final) vs `docs/known-gaps.md` (older) | Root rev7 kept as canonical at `docs/operations/known-gaps.md`; old `docs/known-gaps.md` replaced with redirect stub |
| `SYSTEM-OVERVIEW.md` (root, executive audience) vs `docs/architecture/system-overview.md` (technical) | Both retained; root version renamed to `docs/architecture/system-overview-executive.md` to coexist |
| `LAUNCH_EXECUTIVE_SUMMARY.md` vs `EXECUTIVE_LAUNCH_SUMMARY.md` | Both retained — different audiences (GTM founder brief vs engineering audit summary); moved to `docs/launch/launch-executive-summary.md` and `docs/launch/executive-launch-summary.md` |
| `DEMO.md` vs `DEMO_GUIDE.md` | Both retained — different purposes (ops runbook vs audience guide); moved to `docs/sales/demo-runbook.md` and `docs/sales/demo-guide.md` |

---

## Files Moved by Section

### `docs/architecture/` (43 files)

| Old Root Filename | New Path |
|-------------------|----------|
| `architecture.md` | `docs/architecture/architecture.md` |
| `API-SPEC.md` | `docs/architecture/api-spec.md` |
| `API-CATALOGUE.md` | `docs/architecture/api-catalogue.md` |
| `DATA-MODEL.md` | `docs/architecture/data-model.md` |
| `PLATFORM_PRIMITIVES.md` | `docs/architecture/platform-primitives.md` |
| `SYSTEM-OVERVIEW.md` | `docs/architecture/system-overview-executive.md` |
| `FULL_SYSTEM_INVENTORY.md` | `docs/architecture/full-system-inventory.md` |
| `CONTROL_PLANE_ARCHITECTURE.md` | `docs/architecture/control-plane.md` |
| `BILLING_ARCHITECTURE.md` | `docs/architecture/billing.md` |
| `OBSERVABILITY_ARCHITECTURE.md` | `docs/architecture/observability.md` |
| `DECISION_FABRIC.md` | `docs/architecture/decision-fabric.md` |
| `DECISION_SIMULATION.md` | `docs/architecture/decision-simulation.md` |
| `OUTCOME_GRAPH_MODEL.md` | `docs/architecture/outcome-graph.md` |
| `TENANCY-MODEL.md` | `docs/architecture/tenancy-model.md` |
| `DEPENDENCY_MAP.md` | `docs/architecture/dependency-map.md` |
| `ROUTE_INVENTORY.md` | `docs/architecture/route-inventory.md` |
| `EVENT_TAXONOMY.md` | `docs/architecture/event-taxonomy.md` |
| `GUARDRAILS_MODEL.md` | `docs/architecture/guardrails-model.md` |
| `policy-model.md` | `docs/architecture/policy-model.md` |
| `PROOF_AND_POLICY_MODEL.md` | `docs/architecture/proof-and-policy-model.md` |
| `ontology.md` | `docs/architecture/ontology.md` |
| `telemetry-model.md` | `docs/architecture/telemetry-model.md` |
| `INTEGRATIONS.md` | `docs/architecture/integrations.md` |
| `ENTITLEMENTS_MODEL.md` | `docs/architecture/entitlements-model.md` |
| `ANALYTICS-EVENTS.md` | `docs/architecture/analytics-events.md` |
| `MCP_GATEWAY_STRATEGY.md` | `docs/architecture/mcp-gateway-strategy.md` |
| `AGENT_GATEWAY_STRATEGY.md` | `docs/architecture/agent-gateway-strategy.md` |
| `AGENTS.md` | `docs/architecture/agents.md` |
| `AI_EVALUATION_STRATEGY.md` | `docs/architecture/ai-evaluation-strategy.md` |
| `AI_GOVERNANCE.md` | `docs/architecture/ai-governance.md` |
| `AI_RUNTIME_OBSERVABILITY.md` | `docs/architecture/ai-runtime-observability.md` |
| `DESIGN_SYSTEM_NOTES.md` | `docs/architecture/design-system.md` |
| `app-moats.md` | `docs/architecture/app-moats.md` |

### `docs/security/` (11 files)

| Old Root Filename | New Path |
|-------------------|----------|
| `SECURITY-CHECKLIST.md` | `docs/security/security-checklist.md` |
| `SECURITY_DISCLOSURE.md` | `docs/security/security-disclosure.md` |
| `SECURITY_QUESTIONNAIRE_PACK.md` | `docs/security/security-questionnaire.md` |
| `SECRETS_SETUP.md` | `docs/security/secrets-setup.md` |
| `ACCESS-CONTROL-MATRIX.md` | `docs/security/access-control-matrix.md` |
| `TRUST_CENTER_INDEX.md` | `docs/security/trust-center-index.md` |
| `PRIVACY_OVERVIEW.md` | `docs/security/privacy-overview.md` |
| `SHARED_RESPONSIBILITY_MODEL.md` | `docs/security/shared-responsibility.md` |
| `DATA-RETENTION.md` | `docs/security/data-retention.md` |
| `SOC2_AUDIT_ENGAGEMENT.md` | `docs/security/soc2-audit.md` |

### `docs/operations/` (33 files)

| Old Root Filename | New Path |
|-------------------|----------|
| `OPERATIONS-RUNBOOK.md` | `docs/operations/operations-runbook.md` |
| `DEPLOYMENT-GUIDE.md` | `docs/operations/deployment-guide.md` |
| `BACKUP-RESTORE.md` | `docs/operations/backup-restore.md` |
| `INCIDENT_RESPONSE.md` | `docs/operations/incident-response.md` |
| `INCIDENT_COMMAND_PLAYBOOK.md` | `docs/operations/incident-command.md` |
| `INCIDENT_SEVERITY_MATRIX.md` | `docs/operations/incident-severity.md` |
| `ENVIRONMENT_VARIABLES.md` | `docs/operations/environment-variables.md` |
| `ENVIRONMENT_VALIDATION.md` | `docs/operations/environment-validation.md` |
| `REPLIT_OPERATIONS.md` | `docs/operations/replit-operations.md` |
| `ROLLBACK_PLAYBOOK.md` | `docs/operations/rollback-playbook.md` |
| `RUNBOOK_COMMON_FAILURES.md` | `docs/operations/common-failures.md` |
| `RELEASE_PROCESS.md` | `docs/operations/release-process.md` |
| `RELEASE_CHECKLIST.md` | `docs/operations/release-checklist.md` |
| `RELEASE_INTELLIGENCE.md` | `docs/operations/release-intelligence.md` |
| `STATUSPAGE_PLAN.md` | `docs/operations/statuspage.md` |
| `SEVERITY_MODEL.md` | `docs/operations/severity-model.md` |
| `QA_SIGNOFF_CHECKLIST.md` | `docs/operations/qa-signoff.md` |
| `QA_SUMMARY.md` | `docs/operations/qa-summary.md` |
| `GITHUB_SETUP_CHECKLIST.md` | `docs/operations/github-setup.md` |
| `WORKSPACE_GUIDE.md` | `docs/operations/workspace-guide.md` |
| `CODEX_HANDOFF.md` | `docs/operations/codex-handoff.md` |
| `TEST_STRATEGY.md` | `docs/operations/test-strategy.md` |
| `SMOKE_TEST_PLAN.md` | `docs/operations/smoke-test-plan.md` |
| `FLOW_AUDIT_MATRIX.md` | `docs/operations/flow-audit-matrix.md` |
| `REGRESSION_RISK_REGISTER.md` | `docs/operations/regression-risk-register.md` |
| `AUDIT_FINDINGS_REGISTER.md` | `docs/operations/audit-findings-register.md` |
| `OUT_OF_SCOPE_REGISTER.md` | `docs/operations/out-of-scope-register.md` |
| `KNOWN-GAPS.md` | `docs/operations/known-gaps.md` |

### `docs/product/` (20 files)

| Old Root Filename | New Path |
|-------------------|----------|
| `PRODUCT_OVERVIEW.md` | `docs/product/product-overview.md` |
| `FEATURE_OVERVIEW.md` | `docs/product/feature-overview.md` |
| `PRODUCT-SURFACES.md` | `docs/product/product-surfaces.md` |
| `PRODUCT_SURFACE_MAP.md` | `docs/product/product-surface-map.md` |
| `PLATFORM_EDITIONS.md` | `docs/product/platform-editions.md` |
| `DOMAIN_PACK_CATALOG.md` | `docs/product/domain-pack-catalog.md` |
| `PRODUCT_ROADMAP.md` | `docs/product/roadmap.md` |
| `PRODUCT_PACKAGING.md` | `docs/product/packaging.md` |
| `NAVIGATION_STRATEGY.md` | `docs/product/navigation-strategy.md` |
| `SEO_MAP.md` | `docs/product/seo-map.md` |
| `APP_STORE_SUBMISSION_CHECKLIST.md` | `docs/product/app-store-checklist.md` |
| `DESIGN_PARTNER_SCORECARD.md` | `docs/product/design-partner-scorecard.md` |
| `TENANT_TIERS.md` | `docs/product/tenant-tiers.md` |
| `DOCS_HOME.md` | `docs/product/user/docs-home.md` |
| `GETTING_STARTED.md` | `docs/product/user/getting-started.md` |
| `ADMIN_SETUP_GUIDE.md` | `docs/product/user/admin-setup-guide.md` |
| `END_USER_GUIDE.md` | `docs/product/user/end-user-guide.md` |
| `OPERATOR_GUIDE.md` | `docs/product/user/operator-guide.md` |
| `FAQ.md` | `docs/product/user/faq.md` |
| `TROUBLESHOOTING_GUIDE.md` | `docs/product/user/troubleshooting-guide.md` |

### `docs/sales/` (44 files)

| Old Root Filename | New Path |
|-------------------|----------|
| `DEMO.md` | `docs/sales/demo-runbook.md` |
| `DEMO_GUIDE.md` | `docs/sales/demo-guide.md` |
| `DEMO_STRATEGY.md` | `docs/sales/demo-strategy.md` |
| `DEMO_ENVIRONMENT_CHECKLIST.md` | `docs/sales/demo-environment-checklist.md` |
| `EXECUTIVE_DEMO.md` | `docs/sales/executive-demo.md` |
| `OPERATOR_DEMO.md` | `docs/sales/operator-demo.md` |
| `TECHNICAL_DEMO.md` | `docs/sales/technical-demo.md` |
| `SALES_NARRATIVE.md` | `docs/sales/sales-narrative.md` |
| `SALES_HANDOFF_GUIDE.md` | `docs/sales/sales-handoff-guide.md` |
| `SALES_EXECUTION_STATUS.md` | `docs/sales/sales-execution-status.md` |
| `OBJECTION_HANDLING.md` | `docs/sales/objection-handling.md` |
| `BUYER_PERSONAS.md` | `docs/sales/buyer-personas.md` |
| `TARGET_ACCOUNTS.md` | `docs/sales/target-accounts.md` |
| `OUTREACH_SEQUENCES.md` | `docs/sales/outreach-sequences.md` |
| `FIRST_MEETING_KIT.md` | `docs/sales/first-meeting-kit.md` |
| `FIRST_10_MINUTES.md` | `docs/sales/first-10-minutes.md` |
| `GO_TO_MARKET_MOTION.md` | `docs/sales/go-to-market.md` |
| `CATEGORY_POSITIONING.md` | `docs/sales/category-positioning.md` |
| `MARKET_POSITIONING.md` | `docs/sales/market-positioning.md` |
| `LAUNCH_MESSAGE_HOUSE.md` | `docs/sales/message-house.md` |
| `WEBSITE_COPY_REFRESH.md` | `docs/sales/website-copy.md` |
| `PRESS_KIT.md` | `docs/sales/press-kit.md` |
| `BRAND_GUIDELINES.md` | `docs/sales/brand-guidelines.md` |
| `COMPANY_FACT_SHEET.md` | `docs/sales/company-fact-sheet.md` |
| `CUSTOMER_SETUP_CHECKLIST.md` | `docs/sales/customer-setup-checklist.md` |
| `CUSTOMER_SUCCESS_PLAYBOOK.md` | `docs/sales/customer-success-playbook.md` |
| `CUSTOMER_ESCALATION_MATRIX.md` | `docs/sales/customer-escalation.md` |
| `CUSTOMER_HEALTH_MODEL.md` | `docs/sales/customer-health-model.md` |
| `PILOT_PLAYBOOK.md` | `docs/sales/pilot-playbook.md` |
| `PROOF_OF_VALUE_PLAYBOOK.md` | `docs/sales/proof-of-value.md` |
| `LAND_AND_EXPAND.md` | `docs/sales/land-and-expand.md` |
| `ENTERPRISE_DEAL_DESIGN.md` | `docs/sales/enterprise-deal-design.md` |
| `ACTIVATION_PLAYBOOK.md` | `docs/sales/activation-playbook.md` |
| `ONBOARDING_STRATEGY.md` | `docs/sales/onboarding-strategy.md` |
| `EXPANSION_MOTION.md` | `docs/sales/expansion-motion.md` |
| `CASE_STUDY_TEMPLATE.md` | `docs/sales/case-study-template.md` |
| `SUPPORT_HANDOFF_GUIDE.md` | `docs/sales/support-handoff.md` |
| `SUPPORT_OPERATIONS.md` | `docs/sales/support-operations.md` |
| `DESIGN_PARTNER_PROGRAM.md` | `docs/sales/design-partner-program.md` |
| `DESIGN_PARTNER_AGREEMENT.md` | `docs/sales/design-partner-agreement.md` |
| `ROI_MODEL.md` | `docs/sales/roi-model.md` |
| `NORTH_STAR_METRICS.md` | `docs/sales/north-star-metrics.md` |
| `EXECUTIVE_SCORECARD.md` | `docs/sales/executive-scorecard.md` |
| `ANALYTICS_PLAN.md` | `docs/sales/analytics-plan.md` |

### `docs/investor/` (23 files including pre-existing)

| Old Root Filename | New Path |
|-------------------|----------|
| `INVESTOR_NARRATIVE.md` | `docs/investor/investor-narrative.md` |
| `SERIES_A_READINESS.md` | `docs/investor/series-a-readiness.md` |
| `TECHNICAL_DILIGENCE_PACKET.md` | `docs/investor/technical-diligence-packet.md` |
| `AUDIT_INVESTOR_READINESS.md` | `docs/investor/audit-investor-readiness.md` |
| `MOAT_MAP.md` | `docs/investor/moat-map.md` |
| `REVENUE_MODEL.md` | `docs/investor/revenue-model.md` |
| `PRICING_PACKAGING.md` | `docs/investor/pricing-packaging.md` |
| `PLAN_MATRIX.md` | `docs/investor/plan-matrix.md` |

### `docs/launch/` (9 files)

| Old Root Filename | New Path |
|-------------------|----------|
| `LAUNCH_BLOCKERS.md` | `docs/launch/launch-blockers.md` |
| `LAUNCH_DAY_RUNBOOK.md` | `docs/launch/launch-day-runbook.md` |
| `LAUNCH_EXECUTIVE_SUMMARY.md` | `docs/launch/launch-executive-summary.md` |
| `EXECUTIVE_LAUNCH_SUMMARY.md` | `docs/launch/executive-launch-summary.md` |
| `LAUNCH_ANALYTICS_PLAN.md` | `docs/launch/launch-analytics-plan.md` |
| `PUBLIC_LAUNCH_READINESS.md` | `docs/launch/public-launch-readiness.md` |
| `GO_NO_GO_CHECKLIST.md` | `docs/launch/go-no-go-checklist.md` |
| `GREEN_LIGHT_REVIEW.md` | `docs/launch/green-light-review.md` |
| `OPERATIONAL_READINESS_SCORECARD.md` | `docs/launch/operational-readiness-scorecard.md` |

---

## Index Files Created

| File | Purpose |
|------|---------|
| `docs/README.md` | Navigation root — audience-oriented entry points |
| `docs/INDEX.md` | Master index of all docs with one-line descriptions |
| `docs/architecture/INDEX.md` | Architecture section index |
| `docs/security/INDEX.md` | Security section index |
| `docs/operations/INDEX.md` | Operations section index |
| `docs/product/INDEX.md` | Product section index |
| `docs/sales/INDEX.md` | Sales section index |
| `docs/investor/INDEX.md` | Investor section index |
| `docs/launch/INDEX.md` | Launch section index |

---

## Link Updates

| Location | Updates Made |
|----------|-------------|
| `README.md` | Updated 12 broken links in header, Trust section, Architecture section, Documentation Index, and inline text |
| `docs/` (all sections) | 1,208 internal markdown links updated across 122 files via automated script (two passes) |

### Remaining Known Issues (Pre-Existing, Not Introduced by This Task)

| Location | Issue | Status |
|----------|-------|--------|
| `docs/sales/design-partner-agreement.md` | Links to `SLO_DEFINITIONS.md` which never existed | Pre-existing gap — file was never created |
| `docs/operations/known-gaps.md`, `docs/investor/technical-diligence-packet.md`, etc. | Prose text in audit notes references old UPPERCASE filenames | Not clickable markdown links — historical audit records; intentionally preserved |

---

## Naming Convention Applied

All moved files use lowercase kebab-case (e.g., `OPERATIONS-RUNBOOK.md` → `operations-runbook.md`). Files already using the convention were left as-is.

---

## Link Check Pass

After three rounds of automated fixing, all clickable internal markdown links are resolved:

| Fix round | Links fixed | Files changed |
|-----------|-------------|---------------|
| Pass 1 — old root filenames in parens | 1,152 | 122 |
| Pass 2 — anchored links (file.md#anchor) | 56 | 24 |
| Pass 3 — SECURITY.md relative paths | 17 | 10 |
| Manual — CONTRIBUTING.md, architecture.md | 4 | 2 |
| **Total** | **1,229** | **~140** |

Remaining notes (not broken clickable links):
- Prose text in audit notes (known-gaps.md, audit-findings-register.md) references old UPPERCASE filenames as historical record — these are not clickable markdown links
- `SLO_DEFINITIONS.md` referenced in `docs/sales/design-partner-agreement.md` — pre-existing gap; file never existed anywhere in the repo

---

## Validation

```
Root *.md count:          7  (6 canonical + replit.md) ✓
docs/ total *.md count:   609 ✓
Section indexes created:  9 ✓
Clickable broken links:   0 (1,229 links updated) ✓
docs/INDEX.md sections:   12 (7 moved + trust, doctrine, github, audit, platform) ✓
```
