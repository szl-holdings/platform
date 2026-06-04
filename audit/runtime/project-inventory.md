# Project Inventory — SZL Holdings Platform

**Generated:** 2026-04-26  
**Generator:** `scripts/inventory/generate-inventory.js`  
**Status:** Authoritative baseline for all downstream rehaul phases

---

## Summary Counts

| Category | Count | Notes |
|----------|-------|-------|
| Artifact directories (`artifacts/`) | 17 | Includes internal/unregistered dirs |
| Platform-registered artifacts | 15 | Accessible via platform preview pane |
| Public-facing registered artifacts | 14 | Excludes internal tooling (PRAXIS, PluginMesh) |
| Artifact runtime workflows | 16 | All dirs except `helios` |
| Total Replit workflows | 20 | 16 artifact + 4 infrastructure |
| Package directories (`packages/`) | 100 | Excludes `proxy-routes.ts` file at packages root |
| Shared library dirs (`lib/`) | 51 | Includes `integrations/` subdir |
| Background apps (`apps/`) | 3 | |
| Platform services (`services/`) | 8 | |
| Background workers (`workers/`) | 5 | |
| API route files | 403 | `artifacts/api-server/src/routes/` (recursive, .ts) |
| Background jobs | 10 | `artifacts/api-server/src/jobs/` (recursive, .ts) |
| Environment variables | 260 | Parsed from `.env.example` |
| GitHub CI/CD workflows | 25 | |
| Domain pack verticals | 6 | TENAX, Counsel, DOMAINE, SEXTANT, PARAGON, Carlota Jo |
| Total operator products | 8 | Domain packs + A11oy, KORA, LUMINA |
| Installed integrations | 1 | github==1.0.0 |

---

## Public-Facing Registered Artifacts (14)

| Dir | Brand | Kind | Preview | Status |
|-----|-------|------|---------|--------|
| `artifacts/a11oy` | A11oy — Brand Orchestration Layer | web | /a11oy/ | alpha-working |
| `artifacts/aegis` | PARAGON (investor pitch + ATLAS) | web | /aegis/ | alpha-working |
| `artifacts/api-server` | API Server | web | /api/ | live |
| `artifacts/carlota-jo` | Carlota Jo Consulting | web | /carlota-jo/ | alpha-working |
| `artifacts/command` | Unified Command (FORGE) | web | /command/ | alpha-partial |
| `artifacts/counsel` | Counsel — Legal Matter Command | web | /counsel/ | alpha-working |
| `artifacts/lyte-command-center` | KORA — Decision Intelligence | web | /lyte/ | alpha-working |
| `artifacts/pulse` | LUMINA — AI Executive Briefing | web | /pulse/ | alpha-working |
| `artifacts/sentra` | TENAX — Cyber Resilience | web | /sentra/ | alpha-working |
| `artifacts/szl-demo-video` | SZL Holdings Demo Video | video | /szl-demo-video/ | live |
| `artifacts/szl-holdings` | SZL Holdings Dashboard | web | / | alpha-working |
| `artifacts/szl-holdings-mobile` | APEX — Mobile Command | mobile | /szl-holdings-mobile/ | alpha-partial |
| `artifacts/terra` | DOMAINE — Real Estate Intelligence | web | /terra/ | alpha-working |
| `artifacts/vessels` | SEXTANT — Maritime Intelligence | web | /vessels/ | alpha-partial |

---

## Internal / Unregistered Artifacts (3)

| Dir | Brand | Registered | Workflow | Status |
|-----|-------|-----------|---------|--------|
| `artifacts/helios` | Helios | No | No | internal-only |
| `artifacts/mockup-sandbox` | PRAXIS — Unified Agentic AI Layer | Yes | Yes | internal-only |
| `artifacts/pluginmesh` | PluginMesh | No | Yes | internal-only |

---

## Packages (`packages/` — 100 directories)

proxy-routes.ts at packages/ root is a file, not a package dir; excluded.

---

## Shared Libraries (`lib/` — 51 directories)

Includes `integrations/` subdir and `integrations-openai-ai-react`, `integrations-openai-ai-server`.

---

## Background Apps (`apps/` — 3)

- `apps/alloy-embedding-api`
- `apps/alloy-ingestion-orchestrator`
- `apps/alloy-runtime-api`

---

## Platform Services (`services/` — 8)

- `services/alloy-fabric-api`
- `services/alloy-fabric-ingest-control`
- `services/lyte-metrics-store`
- `services/meridian_control_plane`
- `services/meridian_forecast_lab`
- `services/substrate-mcp-gateway`
- `services/substrate-py-workers`
- `services/verticals`

---

## Workers (`workers/` — 5)

- `workers/alloy-embed-worker`
- `workers/alloy-rank-worker`
- `workers/alloy-rerank-worker`
- `workers/alloy-vector-worker`
- `workers/substrate-python`

---

## API Routes (403 files)

Route files in `artifacts/api-server/src/routes/` (recursive, `.ts`, excludes `__tests__`):

- `routes/a11oy-fabric-api.ts`
- `routes/a11oy-runtime-api.ts`
- `routes/a11oy-sovereign-api.ts`
- `routes/a2a.ts`
- `routes/action-store.ts`
- `routes/admin/apps-registry.ts`
- `routes/admin/email.ts`
- `routes/admin/flags.ts`
- `routes/admin/funnel.ts`
- `routes/admin/growth.ts`
- `routes/admin/index.ts`
- `routes/admin/integrations.ts`
- `routes/admin/observability.ts`
- `routes/admin/onboarding.ts`
- `routes/admin/pipeline-deals.ts`
- `routes/admin/privacy.ts`
- `routes/admin/seed.ts`
- `routes/admin/support.ts`
- `routes/admin/system.ts`
- `routes/admin/usage.ts`
- `routes/admin/users.ts`
- `routes/aegis-ciso-kpis.ts`
- `routes/aegis-digital-twin.ts`
- `routes/aegis-intel.ts`
- `routes/aegis-modules.ts`
- `routes/aegis-pcap.ts`
- `routes/agent-autonomy.ts`
- `routes/agent-federation.ts`
- `routes/agent-mesh.ts`
- `routes/agent-os.ts`
- `routes/agent-training.ts`
- `routes/agents.ts`
- `routes/ai-engine.ts`
- `routes/ai-ops-dashboard.ts`
- `routes/ai-safety.ts`
- `routes/alloy-channels.ts`
- `routes/alloy-chat.ts`
- `routes/alloy-cognitive-learning.ts`
- `routes/alloy-digest.ts`
- `routes/alloy-email.ts`
- `routes/alloy-governance.ts`
- `routes/alloy-integrations.ts`
- `routes/alloy-meetings.ts`
- `routes/alloy-policy-compiler.ts`
- `routes/alloy-policy-llm.ts`
- `routes/alloy-research.ts`
- `routes/alloy-runtime.ts`
- `routes/alloy-skills.ts`
- `routes/alloy-voice.ts`
- `routes/alloy.ts`
- `routes/analytics-engine-public.ts`
- `routes/analytics-engine.ts`
- `routes/analytics.ts`
- `routes/api-keys.ts`
- `routes/apm.ts`
- `routes/approvals.ts`
- `routes/atlas-artifacts.ts`
- `routes/atlas-scene-export.ts`
- `routes/atlas-spatial-runtime.ts`
- `routes/audit-chain.ts`
- `routes/audit.ts`
- `routes/auth.ts`
- `routes/autopilot.ts`
- `routes/backup.ts`
- `routes/billing-disputes.ts`
- `routes/billing.ts`
- `routes/booking.ts`
- `routes/briefing.ts`
- `routes/briefings.ts`
- `routes/business-events-ingestion.ts`
- `routes/capital-readiness.ts`
- `routes/carlota-jo-invoice-email.ts`
- `routes/carlota-jo.ts`
- `routes/carlota-metrics.ts`
- `routes/carlota-time-tracking.ts`
- `routes/certification-readiness.ts`
- `routes/changelog.ts`
- `routes/changes.ts`
- `routes/cms.ts`
- `routes/cognitive-runtime.ts`
- `routes/command-sync.ts`
- `routes/command.ts`
- `routes/comments.ts`
- `routes/competitive-intel.ts`
- `routes/compliance.ts`
- `routes/config.ts`
- `routes/connector-hub.ts`
- `routes/connectors.ts`
- `routes/consciousness.ts`
- `routes/constellation-views.ts`
- `routes/contact.ts`
- `routes/control-tower/act.ts`
- `routes/control-tower/decide.ts`
- `routes/control-tower/govern-evolve.ts`
- `routes/control-tower/index.ts`
- `routes/control-tower/sense.ts`
- `routes/control-tower/shared.ts`
- `routes/control-tower/substrate-replay.ts`
- `routes/copilot.ts`
- `routes/core.ts`
- `routes/correlation-map.ts`
- `routes/cortex.ts`
- `routes/counsel-knowledge.ts`
- `routes/counsel.ts`
- `routes/court-filings.ts`
- `routes/covenant-policy-api.ts`
- `routes/crisis-arena.ts`
- `routes/crm.ts`
- `routes/cross-app-handoffs.ts`
- `routes/cross-domain-query.ts`
- `routes/cross-platform.ts`
- `routes/data-retention.ts`
- `routes/dataverse.ts`
- `routes/debug.ts`
- `routes/decision-fabric.ts`
- `routes/decisioning.ts`
- `routes/decisions-receipts.ts`
- `routes/decisions-runtime.ts`
- `routes/delta-sync.ts`
- `routes/demo-governed-scenarios.ts`
- `routes/demo-requests.ts`
- `routes/demo-reset.ts`
- `routes/deployments.ts`
- `routes/digital-twins.ts`
- `routes/distribution-os/content-crud.ts`
- `routes/distribution-os/index.ts`
- `routes/distribution-os/platform-analytics.ts`
- `routes/distribution-os/publishing.ts`
- `routes/doctrine.ts`
- `routes/documents/crud.ts`
- `routes/documents/index.ts`
- `routes/documents/pdf.ts`
- `routes/documents/shared.ts`
- `routes/documents/signatures.ts`
- `routes/domain-agents/a2a.ts`
- `routes/domain-agents/configs.ts`
- `routes/domain-agents/index.ts`
- `routes/domain-agents/runner.ts`
- `routes/domain-atlas-execution.ts`
- `routes/domains.ts`
- `routes/dos-public-api.ts`
- `routes/dreamscape.ts`
- `routes/drift.ts`
- `routes/ecosystem-command.ts`
- `routes/email-webhooks.ts`
- `routes/esignature.ts`
- `routes/evals.ts`
- `routes/evidence-graph.ts`
- `routes/evolution.ts`
- `routes/executive-briefings.ts`
- `routes/exports.ts`
- `routes/external-integrations.ts`
- `routes/fabric.ts`
- `routes/feature-flags.ts`
- `routes/feedback.ts`
- `routes/files.ts`
- `routes/fine-tuning.ts`
- `routes/firestorm-cognitive.ts`
- `routes/firestorm-command-surfaces.ts`
- `routes/firestorm-live.ts`
- `routes/firestorm/assets-cases.ts`
- `routes/firestorm/crud.ts`
- `routes/firestorm/incidents-alerts.ts`
- `routes/firestorm/index.ts`
- `routes/firestorm/live.ts`
- `routes/firestorm/shared.ts`
- `routes/forge-runtime-api.ts`
- `routes/forge.ts`
- `routes/fund-inbound-deals.ts`
- `routes/fund-ops.ts`
- `routes/fusion.ts`
- `routes/gdpr.ts`
- `routes/genai-telemetry.ts`
- `routes/geo-intel.ts`
- `routes/gov-data.ts`
- `routes/governance-counts.ts`
- `routes/governance.ts`
- `routes/graph-stream.ts`
- `routes/graph.ts`
- `routes/groups/ai.ts`
- `routes/groups/alloy-runtime-group.ts`
- `routes/groups/alloy.ts`
- `routes/groups/billing.ts`
- `routes/groups/core.ts`
- `routes/groups/cross-platform.ts`
- `routes/groups/data-services.ts`
- `routes/groups/decisions.ts`
- `routes/groups/domain-atlas.ts`
- `routes/groups/graph.ts`
- `routes/groups/guardian.ts`
- `routes/groups/lyte.ts`
- `routes/groups/misc.ts`
- `routes/groups/operations.ts`
- `routes/groups/platform.ts`
- `routes/groups/prism-counsel.ts`
- `routes/groups/security.ts`
- `routes/groups/self-model.ts`
- `routes/groups/skill-library.ts`
- `routes/groups/terra.ts`
- `routes/groups/verifier.ts`
- `routes/groups/vessels.ts`
- `routes/guardian.ts`
- `routes/health-integrations.ts`
- `routes/health.ts`
- `routes/helios/data.ts`
- `routes/helios/index.ts`
- `routes/helios/types.ts`
- `routes/helm-console.ts`
- `routes/hf-mcp-proxy.ts`
- `routes/hf-status.ts`
- `routes/holdings.ts`
- `routes/imperium.ts`
- `routes/index.ts`
- `routes/infrastructure-status.ts`
- `routes/innovation-engine.ts`
- `routes/integrations.ts`
- `routes/intelligence-economics.ts`
- `routes/intelligence/ai-routes.ts`
- `routes/intelligence/feeds.ts`
- `routes/intelligence/index.ts`
- `routes/intelligence/research.ts`
- `routes/intelligence/shared.ts`
- `routes/internal-a11oy-api.ts`
- `routes/international-payment-rails.ts`
- `routes/investor-analytics.ts`
- `routes/invitations.ts`
- `routes/jobs.ts`
- `routes/knowledge-graph.ts`
- `routes/linear.ts`
- `routes/lp-portal.ts`
- `routes/lyte-backbone.ts`
- `routes/lyte-billing.ts`
- `routes/lyte-causal.ts`
- `routes/lyte-cognitive-helpers.ts`
- `routes/lyte-cognitive.ts`
- `routes/lyte-extended.ts`
- `routes/lyte-intel.ts`
- `routes/lyte-live.ts`
- `routes/lyte-market.ts`
- `routes/lyte-observability.ts`
- `routes/lyte-surfaces.ts`
- `routes/lyte.ts`
- `routes/maps.ts`
- `routes/marketplace.ts`
- `routes/mcp-gateway.ts`
- `routes/mcp.ts`
- `routes/memory.ts`
- `routes/meridian-mcp-activation.ts`
- `routes/meridian.ts`
- `routes/mesh-observability.ts`
- `routes/metering/analytics.ts`
- `routes/metering/billing.ts`
- `routes/metering/events.ts`
- `routes/metering/index.ts`
- `routes/metering/rate-cards.ts`
- `routes/metering/shared.ts`
- `routes/microsoft-graph.ts`
- `routes/microsoft-integrations.ts`
- `routes/ml-pipeline.ts`
- `routes/mobile-biometric.ts`
- `routes/monte-carlo.ts`
- `routes/msp-live.ts`
- `routes/msp.ts`
- `routes/multiplayer-sessions.ts`
- `routes/n8n.ts`
- `routes/narratives.ts`
- `routes/newsletter.ts`
- `routes/nexus-mcp.ts`
- `routes/nexus-v1.ts`
- `routes/nexus.ts`
- `routes/notification-recipients.ts`
- `routes/notifications.ts`
- `routes/nuro-mesh-advanced.ts`
- `routes/nuro-mesh.ts`
- `routes/oauth.ts`
- `routes/observability.ts`
- `routes/oidc-auth.ts`
- `routes/omnia.ts`
- `routes/onboarding.ts`
- `routes/ontology.ts`
- `routes/ops-management.ts`
- `routes/org-settings.ts`
- `routes/ot-ics.ts`
- `routes/outcome-graph.ts`
- `routes/ownership-control.ts`
- `routes/page-view-tracking.ts`
- `routes/partner-portal.ts`
- `routes/plans.ts`
- `routes/plugin-registry.ts`
- `routes/policy-modes.ts`
- `routes/preferences.ts`
- `routes/prism-bus-api.ts`
- `routes/prism-counsel-core.ts`
- `routes/prism-counsel-court.ts`
- `routes/prism-counsel-ny.ts`
- `routes/prism-counsel-ops.ts`
- `routes/prism-counsel-pilot-one.ts`
- `routes/prism-counsel-pilot.ts`
- `routes/prism-counsel-purview.ts`
- `routes/prism-counsel-review.ts`
- `routes/prism-counsel-s31.ts`
- `routes/privacy.ts`
- `routes/projects.ts`
- `routes/prompt-registry.ts`
- `routes/proof-chain.ts`
- `routes/provenance.ts`
- `routes/public-a11oy-api.ts`
- `routes/public-api-v1.ts`
- `routes/public-status.ts`
- `routes/pulse-evals.ts`
- `routes/pulse.ts`
- `routes/push-analytics.ts`
- `routes/push-history.ts`
- `routes/push-notifications.ts`
- `routes/push-preferences.ts`
- `routes/push-tokens.ts`
- `routes/rag-knowledge.ts`
- `routes/readiness.ts`
- `routes/realtime.ts`
- `routes/receipt-graph.ts`
- `routes/reflections.ts`
- `routes/replay.ts`
- `routes/reports.ts`
- `routes/retrieval-proof-chain.ts`
- `routes/revenue-intelligence.ts`
- `routes/rf-intel.ts`
- `routes/risk-evidence.ts`
- `routes/rmm/actions.ts`
- `routes/rmm/index.ts`
- `routes/rmm/monitoring.ts`
- `routes/rmm/playbooks.ts`
- `routes/rmm/providers.ts`
- `routes/rmm/shared.ts`
- `routes/sandbox.ts`
- `routes/scenarios.ts`
- `routes/scim.ts`
- `routes/self-healing.ts`
- `routes/self-model.ts`
- `routes/sentra-agents.ts`
- `routes/sentra-siem.ts`
- `routes/sentra.ts`
- `routes/services.ts`
- `routes/signal-bus.ts`
- `routes/signal-chains.ts`
- `routes/simulation-whatif.ts`
- `routes/skills.ts`
- `routes/stephen.ts`
- `routes/storage.ts`
- `routes/streaming-ingestion.ts`
- `routes/support.ts`
- `routes/teams.ts`
- `routes/telemetry.ts`
- `routes/tenant-health.ts`
- `routes/tenant-provisioning/enterprise-mcp.ts`
- `routes/tenant-provisioning/identity.ts`
- `routes/tenant-provisioning/index.ts`
- `routes/tenant-provisioning/powerbi.ts`
- `routes/tenant-provisioning/scim.ts`
- `routes/tenant-provisioning/shared.ts`
- `routes/tenant-provisioning/tenants.ts`
- `routes/terra-broker.ts`
- `routes/terra-cognitive.ts`
- `routes/terra-crm/_shared.ts`
- `routes/terra-crm/analysis.ts`
- `routes/terra-crm/conversions.ts`
- `routes/terra-crm/csv-export.ts`
- `routes/terra-crm/deals.ts`
- `routes/terra-crm/index.ts`
- `routes/terra-crm/leads.ts`
- `routes/terra-crm/opportunities.ts`
- `routes/terra-digital-twin.ts`
- `routes/terra-distress.ts`
- `routes/terra-live.ts`
- `routes/terra-modules.ts`
- `routes/terra-portfolio-intel.ts`
- `routes/terra-property-intel.ts`
- `routes/terra-why-this-property.ts`
- `routes/terra.ts`
- `routes/tool-mesh.ts`
- `routes/traces.ts`
- `routes/treasury.ts`
- `routes/trust-provenance.ts`
- `routes/unified-settings.ts`
- `routes/universal-search.ts`
- `routes/usage.ts`
- `routes/v1-approvals.ts`
- `routes/v1-runs.ts`
- `routes/verifier.ts`
- `routes/vessels-cognitive.ts`
- `routes/vessels-digital-twin.ts`
- `routes/vessels-extended.ts`
- `routes/vessels-freight.ts`
- `routes/vessels-insurance.ts`
- `routes/vessels-live.ts`
- `routes/vessels-modules.ts`
- `routes/vessels-platform.ts`
- `routes/vessels-psc.ts`
- `routes/vessels-trading.ts`
- `routes/vessels-voyage-risk.ts`
- `routes/vessels.ts`
- `routes/web-push-subscriptions.ts`
- `routes/webhooks.ts`
- `routes/worldline.ts`

---

## Background Jobs (10)

Job files in `artifacts/api-server/src/jobs/` (recursive, `.ts`, excludes `__tests__`):

- `api-server/src/jobs/atlas-compaction.ts`
- `api-server/src/jobs/atlas-export-processor.ts`
- `api-server/src/jobs/backup-restore-drill.ts`
- `api-server/src/jobs/competitive-intel-monitor.ts`
- `api-server/src/jobs/launch-publish-scheduler.ts`
- `api-server/src/jobs/onboarding-stall-check.ts`
- `api-server/src/jobs/ot-ics-stream-feed.ts`
- `api-server/src/jobs/terra-distress-financials-backfill.ts`
- `api-server/src/jobs/terra-owner-enrichment.ts`
- `api-server/src/jobs/vessels-sanctions-refresh.ts`

---

## Environment Variables

**260 variables** defined in `.env.example`.

First 20: A11OY_API_BASE_URL, A11OY_API_KEY, A11OY_CONFIG_PATH, A11OY_MODE, A11OY_OUTPUT, A11OY_TENANT_ID, ADMIN_PIN, AEF_API_KEY, AEF_API_PORT, AEF_EMBED_API_KEY, AEF_EMBED_BACKEND, AEF_EMBED_BATCH_SIZE, AEF_EMBED_ENDPOINT, AEF_EMBED_FLUSH_MS, AEF_EMBED_OVERSIZE_TOKENS, AEF_EMBED_QUEUE_DEPTH, AEF_GATEWAY_URL, AEF_INGEST_CONTROL_PORT, AEF_PG_CONNECTION_STRING, AEF_RANK_MODE

---

## GitHub CI/CD Workflows (25)

`.github/workflows/`: a11y.yml, api-spec-drift.yml, audit-full.yml, backup.yml, build.yml, ci.yml, codeql.yml, commitlint.yml, container-publish.yml, dependency-review.yml, deploy-production.yml, deploy-staging.yml, e2e.yml, lighthouse.yml, nexus-visual-regression.yml, nightly-smoke.yml, npm-publish.yml, operational-audit.yml, readme-qa.yml, release.yml, secret-scan-scheduled.yml, secret-scan.yml, security.yml, uptime-monitor.yml, verify-source-of-truth.yml

---

## Replit Runtime Workflows (20)

**Artifact workflows (16):** artifacts/a11oy, artifacts/aegis, artifacts/api-server, artifacts/carlota-jo, artifacts/command, artifacts/counsel, artifacts/lyte-command-center, artifacts/mockup-sandbox, artifacts/pluginmesh, artifacts/pulse, artifacts/sentra, artifacts/szl-demo-video, artifacts/szl-holdings, artifacts/szl-holdings-mobile, artifacts/terra, artifacts/vessels

**Infrastructure workflows (4):** GI Design System Storybook, brand-strings, praxis-smoke-e2e, security-tests

---

## Installed Integrations

| Integration | Version |
|-------------|---------|
| github | 1.0.0 |
