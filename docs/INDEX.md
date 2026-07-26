# SZL Holdings — Master Documentation Index

**Generated:** April 2026 | **Consolidation date:** 2026-04-20

This is the authoritative index of all documentation in the SZL Holdings platform. All 153 formerly root-level documents have been consolidated into this `docs/` structure. See `audit/docs/consolidation-report.md` for the full consolidation history.

Use [docs/README.md](README.md) for navigation by audience or task.

---

## Architecture

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [architecture/architecture.md](architecture/architecture.md) | **Canonical v4.0** — Full system architecture: thesis, hierarchy, primitives, topology | 2026-04 |
| [architecture/platform-primitives.md](architecture/platform-primitives.md) | Six core abstractions: Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, Event Fabric | 2026-04 |
| [architecture/api-spec.md](architecture/api-spec.md) | API surface: route inventory, authentication model, rate limiting, versioning | 2026-04 |
| [architecture/api-catalogue.md](architecture/api-catalogue.md) | Full API catalogue across all domain packs | 2026-04 |
| [architecture/data-model.md](architecture/data-model.md) | Entity-relationship overview of the core PostgreSQL schema (700+ tables) | 2026-04 |
| [architecture/system-overview.md](architecture/system-overview.md) | System architecture overview v3.0 — technical audience | 2026-04 |
| [architecture/system-overview-executive.md](architecture/system-overview-executive.md) | System overview for non-technical stakeholders and investors | 2026-04 |
| [architecture/full-system-inventory.md](architecture/full-system-inventory.md) | Complete inventory of all system components, services, and artifacts | 2026-04 |
| [architecture/control-plane.md](architecture/control-plane.md) | Control plane architecture: tenant management, provisioning, configuration | 2026-04 |
| [architecture/billing.md](architecture/billing.md) | Billing architecture: payment processing, Stripe integration, subscriptions | 2026-04 |
| [architecture/observability.md](architecture/observability.md) | Observability architecture: OpenTelemetry, Sentry, metrics, traces, logs | 2026-04 |
| [architecture/decision-fabric.md](architecture/decision-fabric.md) | Decision Fabric: the nine-step governed decision loop | 2026-04 |
| [architecture/decision-simulation.md](architecture/decision-simulation.md) | Decision Simulation: Monte Carlo engine, confidence intervals, sensitivity | 2026-04 |
| [architecture/outcome-graph.md](architecture/outcome-graph.md) | Outcome Graph: signal-to-outcome tracking and closed-loop learning | 2026-04 |
| [architecture/tenancy-model.md](architecture/tenancy-model.md) | Multi-tenancy model: org isolation, cross-tenant guards, RBAC scoping | 2026-04 |
| [architecture/entitlements-model.md](architecture/entitlements-model.md) | Entitlement model: feature flags, tier gating, org-level configuration | 2026-04 |
| [architecture/policy-model.md](architecture/policy-model.md) | Covenant Policy model: approval gates, policy evaluation, enforcement | 2026-04 |
| [architecture/proof-and-policy-model.md](architecture/proof-and-policy-model.md) | Proof Chain and policy enforcement: immutability, hash integrity | 2026-04 |
| [architecture/guardrails-model.md](architecture/guardrails-model.md) | AI guardrails: safety controls, output validation, content policy | 2026-04 |
| [architecture/ontology.md](architecture/ontology.md) | Platform ontology: domain entities, relationships, shared vocabulary | 2026-04 |
| [architecture/event-taxonomy.md](architecture/event-taxonomy.md) | Event types, schemas, routing taxonomy, and Event Fabric design | 2026-04 |
| [architecture/analytics-events.md](architecture/analytics-events.md) | Analytics event specifications: canonical names, schemas, properties | 2026-04 |
| [architecture/telemetry-model.md](architecture/telemetry-model.md) | Telemetry model: metric definitions, aggregation, retention | 2026-04 |
| [architecture/route-inventory.md](architecture/route-inventory.md) | Complete API route inventory: all 2,331 endpoints with auth requirements | 2026-04 |
| [architecture/dependency-map.md](architecture/dependency-map.md) | Service and package dependency map: internal and third-party | 2026-04 |
| [architecture/integrations.md](architecture/integrations.md) | Third-party integrations: AI providers, monitoring, auth, payments | 2026-04 |
| [architecture/agents.md](architecture/agents.md) | AI agents architecture: agent types, coordination, governance model | 2026-04 |
| [architecture/agent-gateway-strategy.md](architecture/agent-gateway-strategy.md) | Agent gateway: routing, authentication, orchestration strategy | 2026-04 |
| [architecture/mcp-gateway-strategy.md](architecture/mcp-gateway-strategy.md) | MCP gateway: Model Context Protocol integration strategy | 2026-04 |
| [architecture/ai-governance.md](architecture/ai-governance.md) | AI governance: advisory-only model, Covenant Policy, human-in-the-loop | 2026-04 |
| [architecture/ai-evaluation-strategy.md](architecture/ai-evaluation-strategy.md) | AI evaluation: quality metrics, eval frameworks, pass rates | 2026-04 |
| [architecture/ai-runtime-observability.md](architecture/ai-runtime-observability.md) | AI runtime observability: cost tracking, latency, error rates | 2026-04 |
| [architecture/design-system.md](architecture/design-system.md) | Design system: component guidelines, tokens, patterns | 2026-04 |
| [architecture/app-moats.md](architecture/app-moats.md) | Platform moats: structural competitive advantages by domain | 2026-04 |

---

## Security

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [security/security-checklist.md](security/security-checklist.md) | Security controls checklist: P0/P1/P2 items with status | 2026-04 |
| [security/access-control-matrix.md](security/access-control-matrix.md) | 11-role RBAC permission matrix mapped to implementation | 2026-04 |
| [security/trust-center-index.md](security/trust-center-index.md) | Buyer-facing trust hub: security posture, AI governance, compliance | 2026-04 |
| [security/security-disclosure.md](security/security-disclosure.md) | Vulnerability disclosure policy and responsible disclosure process | 2026-04 |
| [security/security-questionnaire.md](security/security-questionnaire.md) | Security questionnaire response pack for enterprise evaluators | 2026-04 |
| [security/secrets-setup.md](security/secrets-setup.md) | Developer guide to secrets management and environment setup | 2026-04 |
| [security/secrets-remediation.md](security/secrets-remediation.md) | Secrets remediation audit findings and resolution | 2026-04 |
| [security/privacy-overview.md](security/privacy-overview.md) | Data handling, PII classification, and privacy posture | 2026-04 |
| [security/data-retention.md](security/data-retention.md) | Data retention schedules and deletion policies | 2026-04 |
| [security/shared-responsibility.md](security/shared-responsibility.md) | Shared responsibility model between SZL Holdings and customers | 2026-04 |
| [security/soc2-audit.md](security/soc2-audit.md) | SOC 2 Type II audit engagement plan, timeline, and status | 2026-04 |

---

## Compliance

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [compliance/EU_AI_ACT_ART_12.md](compliance/EU_AI_ACT_ART_12.md) | Honest Articles 9-15 evidence map, corrected application timeline, and Article 12 export contract | 2026-07 |
| [compliance/ISO_42001_GAP.md](compliance/ISO_42001_GAP.md) | Clause 4-10 ISO/IEC 42001 gap analysis; certification not claimed | 2026-07 |

---

## Observability

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [observability/OTEL_GENAI_CONVENTIONS.md](observability/OTEL_GENAI_CONVENTIONS.md) | Development-status OpenTelemetry GenAI compatibility boundary, migration table, privacy defaults, and claim limits | 2026-07 |

---

## Conformance

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [conformance/VERTICAL_CONFORMANCE.md](conformance/VERTICAL_CONFORMANCE.md) | Seven-gate vertical verifier, deployment inputs, current 0/3 result, and offline DSSE CLI | 2026-07 |

---

## Operations

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [operations/operations-runbook.md](operations/operations-runbook.md) | Primary operations runbook: monitoring, health checks, maintenance | 2026-04 |
| [operations/deployment-guide.md](operations/deployment-guide.md) | Staging and production deployment procedures | 2026-04 |
| [operations/environment-variables.md](operations/environment-variables.md) | Complete environment variable reference: all 80+ vars | 2026-04 |
| [operations/environment-validation.md](operations/environment-validation.md) | Environment validation checklist and automated checks | 2026-04 |
| [operations/known-gaps.md](operations/known-gaps.md) | **Canonical rev 7 — Final** — Known gaps: security, quality, compliance | 2026-04 |
| [operations/audit-findings-register.md](operations/audit-findings-register.md) | All 106 audit findings from Phases 0–13 with severity and status | 2026-04 |
| [operations/out-of-scope-register.md](operations/out-of-scope-register.md) | 20 formally deferred/out-of-scope items with rationale | 2026-04 |
| [operations/incident-response.md](operations/incident-response.md) | Incident response playbook: detection, triage, escalation, resolution | 2026-04 |
| [operations/incident-command.md](operations/incident-command.md) | Incident command structure: roles, war room, communication | 2026-04 |
| [operations/incident-severity.md](operations/incident-severity.md) | Incident severity classification: SEV1–SEV4 definitions | 2026-04 |
| [operations/rollback-playbook.md](operations/rollback-playbook.md) | Production rollback procedures, triggers, and decision criteria | 2026-04 |
| [operations/backup-restore.md](operations/backup-restore.md) | Database backup procedures and restore validation | 2026-04 |
| [operations/release-process.md](operations/release-process.md) | Release management process: branching, tagging, deployment | 2026-04 |
| [operations/release-checklist.md](operations/release-checklist.md) | Pre-release checklist for all production deployments | 2026-04 |
| [operations/release-intelligence.md](operations/release-intelligence.md) | Release intelligence: feature flags, staged rollout, kill switches | 2026-04 |
| [operations/test-strategy.md](operations/test-strategy.md) | Testing strategy: unit, integration, smoke, E2E coverage | 2026-04 |
| [operations/smoke-test-plan.md](operations/smoke-test-plan.md) | Smoke test plan and route coverage matrix | 2026-04 |
| [operations/flow-audit-matrix.md](operations/flow-audit-matrix.md) | Flow audit matrix: critical user flows and test coverage | 2026-04 |
| [operations/regression-risk-register.md](operations/regression-risk-register.md) | Regression risk register: high-risk areas and mitigation | 2026-04 |
| [operations/qa-signoff.md](operations/qa-signoff.md) | QA sign-off checklist for production releases | 2026-04 |
| [operations/qa-summary.md](operations/qa-summary.md) | QA summary report | 2026-04 |
| [operations/common-failures.md](operations/common-failures.md) | Common failure runbook: diagnosis, remediation, prevention | 2026-04 |
| [operations/severity-model.md](operations/severity-model.md) | Severity model: classification criteria for incidents and bugs | 2026-04 |
| [operations/statuspage.md](operations/statuspage.md) | Status page setup and customer communication plan | 2026-04 |
| [operations/github-setup.md](operations/github-setup.md) | GitHub repository setup: branch protection, secrets, Actions | 2026-04 |
| [operations/workspace-guide.md](operations/workspace-guide.md) | Replit workspace guide for developers | 2026-04 |
| [operations/replit-operations.md](operations/replit-operations.md) | Replit-specific operational procedures and limitations | 2026-04 |
| [operations/codex-handoff.md](operations/codex-handoff.md) | AI agent handoff guide and codebase context | 2026-04 |

---

## Product

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [product/product-overview.md](product/product-overview.md) | Platform architecture and product hierarchy | 2026-04 |
| [product/feature-overview.md](product/feature-overview.md) | Complete feature map across all surfaces | 2026-04 |
| [product/product-surfaces.md](product/product-surfaces.md) | **Canonical v2.0** — All product surfaces and artifact disposition | 2026-04 |
| [product/product-surface-map.md](product/product-surface-map.md) | Product surface map v2.1 — detailed surface and route mapping | 2026-04 |
| [product/domain-pack-catalog.md](product/domain-pack-catalog.md) | Full catalog of domain packs and capabilities | 2026-04 |
| [product/platform-editions.md](product/platform-editions.md) | Platform editions: Starter, Professional, Enterprise | 2026-04 |
| [product/tenant-tiers.md](product/tenant-tiers.md) | Tenant tier model: features and access by tier | 2026-04 |
| [product/packaging.md](product/packaging.md) | Product packaging and bundle structure | 2026-04 |
| [product/roadmap.md](product/roadmap.md) | Product roadmap: milestones, priorities, timelines | 2026-04 |
| [product/navigation-strategy.md](product/navigation-strategy.md) | Navigation and information architecture strategy | 2026-04 |
| [product/seo-map.md](product/seo-map.md) | SEO strategy and page mapping | 2026-04 |
| [product/app-store-checklist.md](product/app-store-checklist.md) | App Store and Play Store submission checklist | 2026-04 |
| [product/design-partner-scorecard.md](product/design-partner-scorecard.md) | Design partner evaluation scorecard | 2026-04 |
| [product/user/getting-started.md](product/user/getting-started.md) | First login, navigation, and key workflows | 2026-04 |
| [product/user/end-user-guide.md](product/user/end-user-guide.md) | Daily use guide across all domain packs | 2026-04 |
| [product/user/admin-setup-guide.md](product/user/admin-setup-guide.md) | Organization setup, user provisioning, SSO | 2026-04 |
| [product/user/operator-guide.md](product/user/operator-guide.md) | Command surfaces, decision workflows, governance | 2026-04 |
| [product/user/faq.md](product/user/faq.md) | Frequently asked questions | 2026-04 |
| [product/user/troubleshooting-guide.md](product/user/troubleshooting-guide.md) | Common issues and resolutions | 2026-04 |
| [product/user/docs-home.md](product/user/docs-home.md) | Documentation navigation home for end users | 2026-04 |

---

## Sales

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [sales/demo-guide.md](sales/demo-guide.md) | Comprehensive demo guide: audience cuts, narrative, flow | 2026-04 |
| [sales/demo-runbook.md](sales/demo-runbook.md) | Demo day operational runbook: setup, seed data, verification | 2026-04 |
| [sales/demo-strategy.md](sales/demo-strategy.md) | Demo strategy: Decision Theater framing, audience targeting | 2026-04 |
| [sales/demo-environment-checklist.md](sales/demo-environment-checklist.md) | Pre-demo environment validation checklist | 2026-04 |
| [sales/executive-demo.md](sales/executive-demo.md) | Executive/investor demo script | 2026-04 |
| [sales/operator-demo.md](sales/operator-demo.md) | Operator/enterprise user demo script | 2026-04 |
| [sales/technical-demo.md](sales/technical-demo.md) | Technical/engineering audience demo script | 2026-04 |
| [sales/go-to-market.md](sales/go-to-market.md) | GTM motion: ICP, channels, pipeline stages | 2026-04 |
| [sales/message-house.md](sales/message-house.md) | Launch message house: primary message, three pillars, proof points | 2026-04 |
| [sales/category-positioning.md](sales/category-positioning.md) | Category positioning: Governed Decision Infrastructure | 2026-04 |
| [sales/market-positioning.md](sales/market-positioning.md) | Market positioning: competitive differentiation and white space | 2026-04 |
| [sales/sales-narrative.md](sales/sales-narrative.md) | Sales narrative: the accountability gap and solution story | 2026-04 |
| [sales/sales-handoff-guide.md](sales/sales-handoff-guide.md) | Sales handoff guide: motion, qualification, deal stages | 2026-04 |
| [sales/sales-execution-status.md](sales/sales-execution-status.md) | Current sales execution status and pipeline | 2026-04 |
| [sales/objection-handling.md](sales/objection-handling.md) | Full objection handling responses | 2026-04 |
| [sales/buyer-personas.md](sales/buyer-personas.md) | Buyer personas: CISO, Head of Ops, CTO, CEO | 2026-04 |
| [sales/target-accounts.md](sales/target-accounts.md) | Target account list and qualification criteria | 2026-04 |
| [sales/outreach-sequences.md](sales/outreach-sequences.md) | Outreach sequences for each persona | 2026-04 |
| [sales/first-meeting-kit.md](sales/first-meeting-kit.md) | First meeting kit: agenda, discovery questions, materials | 2026-04 |
| [sales/first-10-minutes.md](sales/first-10-minutes.md) | First 10 minutes of a sales call: framing, hook, qualification | 2026-04 |
| [sales/press-kit.md](sales/press-kit.md) | Press kit: company overview, founder bio, key facts | 2026-04 |
| [sales/brand-guidelines.md](sales/brand-guidelines.md) | Brand guidelines: voice, tone, visual identity | 2026-04 |
| [sales/company-fact-sheet.md](sales/company-fact-sheet.md) | Company fact sheet for media and partners | 2026-04 |
| [sales/website-copy.md](sales/website-copy.md) | Website copy refresh for public launch | 2026-04 |
| [sales/design-partner-program.md](sales/design-partner-program.md) | Design partner program: terms, process, co-design model | 2026-04 |
| [sales/design-partner-agreement.md](sales/design-partner-agreement.md) | Design partner agreement template | 2026-04 |
| [sales/pilot-playbook.md](sales/pilot-playbook.md) | Pilot playbook: setup, milestones, success criteria | 2026-04 |
| [sales/proof-of-value.md](sales/proof-of-value.md) | Proof of value playbook: framing, metrics, reporting | 2026-04 |
| [sales/customer-setup-checklist.md](sales/customer-setup-checklist.md) | Customer setup and onboarding checklist | 2026-04 |
| [sales/customer-success-playbook.md](sales/customer-success-playbook.md) | Customer success: onboarding, adoption, expansion, renewal | 2026-04 |
| [sales/customer-escalation.md](sales/customer-escalation.md) | Customer escalation matrix: severity, contacts, SLA | 2026-04 |
| [sales/customer-health-model.md](sales/customer-health-model.md) | Customer health model: signals, scoring, intervention | 2026-04 |
| [sales/activation-playbook.md](sales/activation-playbook.md) | User activation playbook: first value milestones | 2026-04 |
| [sales/onboarding-strategy.md](sales/onboarding-strategy.md) | Onboarding strategy and wizard design | 2026-04 |
| [sales/land-and-expand.md](sales/land-and-expand.md) | Land and expand: entry points and expansion paths | 2026-04 |
| [sales/enterprise-deal-design.md](sales/enterprise-deal-design.md) | Enterprise deal design: structure, pricing, negotiation | 2026-04 |
| [sales/expansion-motion.md](sales/expansion-motion.md) | Expansion motion: upsell, cross-sell, domain pack adoption | 2026-04 |
| [sales/roi-model.md](sales/roi-model.md) | ROI model: break-even analysis and value quantification | 2026-04 |
| [sales/north-star-metrics.md](sales/north-star-metrics.md) | North star metrics and product-market fit signals | 2026-04 |
| [sales/executive-scorecard.md](sales/executive-scorecard.md) | Executive scorecard: KPIs and board-ready reporting | 2026-04 |
| [sales/analytics-plan.md](sales/analytics-plan.md) | Analytics plan: event tracking strategy and objectives | 2026-04 |
| [sales/support-handoff.md](sales/support-handoff.md) | Support handoff: escalation from CS to engineering | 2026-04 |
| [sales/support-operations.md](sales/support-operations.md) | Support operations: processes, tooling, SLA | 2026-04 |
| [sales/case-study-template.md](sales/case-study-template.md) | Case study template for design partner stories | 2026-04 |

---

## Investor

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [investor/platform-thesis.md](investor/platform-thesis.md) | Platform thesis and investment narrative — start here | 2026-04 |
| [investor/investor-narrative.md](investor/investor-narrative.md) | Series A investor narrative: category, moat, flywheel | 2026-04 |
| [investor/investor-overview.md](investor/investor-overview.md) | Investor overview: executive summary of the opportunity | 2026-04 |
| [investor/series-a-readiness.md](investor/series-a-readiness.md) | Series A readiness: what's ready, what's open | 2026-04 |
| [investor/technical-diligence-packet.md](investor/technical-diligence-packet.md) | Technical diligence packet: architecture, stack, security, scale | 2026-04 |
| [investor/audit-investor-readiness.md](investor/audit-investor-readiness.md) | Investor readiness audit: commercial document coherence review | 2026-04 |
| [investor/moat-map.md](investor/moat-map.md) | Platform moat map: structural advantages and defensibility | 2026-04 |
| [investor/revenue-model.md](investor/revenue-model.md) | Revenue model: platform fee, per-seat, domain pack pricing | 2026-04 |
| [investor/pricing-packaging.md](investor/pricing-packaging.md) | Pricing and packaging details by tier | 2026-04 |
| [investor/plan-matrix.md](investor/plan-matrix.md) | Plan matrix: tier features and pricing comparison | 2026-04 |
| [investor/problem-opportunity.md](investor/problem-opportunity.md) | Problem and market opportunity framing | 2026-04 |
| [investor/why-now.md](investor/why-now.md) | Why now: market timing and tailwinds | 2026-04 |
| [investor/why-team.md](investor/why-team.md) | Why this team: founder background and credibility | 2026-04 |
| [investor/platform-portfolio.md](investor/platform-portfolio.md) | Platform portfolio: all domain packs and status | 2026-04 |
| [investor/product-readiness.md](investor/product-readiness.md) | Product readiness assessment for investors | 2026-04 |
| [investor/readiness-gaps.md](investor/readiness-gaps.md) | Honest gap register from investor perspective | 2026-04 |
| [investor/data-room-index.md](investor/data-room-index.md) | Data room index: all materials available for diligence | 2026-04 |
| [investor/funding-use-outline.md](investor/funding-use-outline.md) | Use of proceeds: how Series A capital will be deployed | 2026-04 |
| [investor/go-to-market.md](investor/go-to-market.md) | GTM strategy from investor perspective | 2026-04 |
| [investor/atlas-spatial-runtime-moat.md](investor/atlas-spatial-runtime-moat.md) | ATLAS spatial runtime moat analysis | 2026-04 |

---

## Launch

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [audit/launch/executive-launch-summary.md](audit/launch/executive-launch-summary.md) | **Canonical** — Executive launch readiness: all 13 outputs from 13-phase audit | 2026-04 |
| [audit/launch/launch-executive-summary.md](audit/launch/launch-executive-summary.md) | Founder executive launch summary: GTM and green-light status | 2026-04 |
| [audit/launch/launch-blockers.md](audit/launch/launch-blockers.md) | **Authoritative** — Hard and conditional blockers before public launch | 2026-04 |
| [audit/launch/go-no-go-checklist.md](audit/launch/go-no-go-checklist.md) | Go/no-go launch decision gate with founder sign-off table | 2026-04 |
| [audit/launch/green-light-review.md](audit/launch/green-light-review.md) | Full 6-perspective green-light diligence review | 2026-04 |
| [audit/launch/public-launch-readiness.md](audit/launch/public-launch-readiness.md) | Public launch readiness bar definitions and criteria | 2026-04 |
| [audit/launch/operational-readiness-scorecard.md](audit/launch/operational-readiness-scorecard.md) | Operational readiness scorecard: red/yellow/green by category | 2026-04 |
| [audit/launch/launch-day-runbook.md](audit/launch/launch-day-runbook.md) | Launch day runbook: T-48h checklist, sequence, rollback | 2026-04 |
| [audit/launch/launch-analytics-plan.md](audit/launch/launch-analytics-plan.md) | Launch analytics plan: Day 0 / Day 1 / Week 1 / Day 30 metrics | 2026-04 |

---

## Trust

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [trust/trust-center.md](trust/trust-center.md) | Primary trust center: security posture, AI governance, compliance | 2026-04 |
| [trust/security-posture.md](trust/security-posture.md) | Technical security posture summary | 2026-04 |
| [trust/privacy-boundaries.md](trust/privacy-boundaries.md) | Privacy boundary model: what is collected, stored, and processed | 2026-04 |
| [trust/deployment-model.md](trust/deployment-model.md) | Deployment model trust surface | 2026-04 |
| [trust/trust-surface-policy.md](trust/trust-surface-policy.md) | Trust surface policy definitions | 2026-04 |
| [trust/atlas-spatial-runtime-controls.md](trust/atlas-spatial-runtime-controls.md) | ATLAS spatial runtime trust controls | 2026-04 |

---

## Doctrine

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [doctrine/szl-doctrine.md](doctrine/szl-doctrine.md) | SZL Holdings point of view: four pillars, voice rules, anti-patterns | 2026-04 |
| [doctrine/inspiration-research.md](doctrine/inspiration-research.md) | Research and inspiration behind the platform thesis | 2026-04 |

---

## GitHub Governance

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [github/README.md](github/README.md) | GitHub governance index | 2026-04 |
| [github/enterprise-rulesets.md](github/enterprise-rulesets.md) | Enterprise ruleset configuration | 2026-04 |
| [github/enterprise-maturity-path.md](github/enterprise-maturity-path.md) | Enterprise GitHub maturity path | 2026-04 |
| [github/org-setup-package.md](github/org-setup-package.md) | Organization setup package | 2026-04 |
| [github/repo-cleanup-matrix.md](github/repo-cleanup-matrix.md) | Repository cleanup matrix | 2026-04 |
| [github/pinned-repos-strategy.md](github/pinned-repos-strategy.md) | Pinned repositories strategy | 2026-04 |
| [github/readme-standard.md](github/readme-standard.md) | README standard for all repos | 2026-04 |
| [github/reference-library.md](github/reference-library.md) | GitHub reference library | 2026-04 |
| [github/curation-rubric.md](github/curation-rubric.md) | Repo curation rubric and scoring | 2026-04 |
| [github/security-governance-baseline.md](github/security-governance-baseline.md) | Security governance baseline for GitHub | 2026-04 |
| [github/actions-ci-audit.md](github/actions-ci-audit.md) | GitHub Actions CI audit | 2026-04 |
| [github/environment-protection-setup.md](github/environment-protection-setup.md) | Environment protection setup guide | 2026-04 |

---

## Audit Reports

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [audit/2026-04/README.md](audit/2026-04/README.md) | April 2026 operational audit — executive summary and findings | 2026-04 |
| [APP_STATUS.md](APP_STATUS.md) | Authoritative artifact readiness register (GA / Beta / Partial / Archived) | 2026-04 |
| [platform-facts.md](platform-facts.md) | Platform statistics — auto-generated from metrics registry | 2026-04 |
| [reconciliation-report.md](reconciliation-report.md) | Documentation reconciliation report | 2026-04 |
| [CANONICAL_INDEX.md](CANONICAL_INDEX.md) | Index of which legacy doc each current doc supersedes | 2026-04 |

---

## Key Platform Documents (Pre-existing in docs/)

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [PLATFORM_CANONICAL.md](PLATFORM_CANONICAL.md) | Canonical platform reference | 2026-04 |
| [PLATFORM_OVERVIEW.md](PLATFORM_OVERVIEW.md) | Platform overview for internal reference | 2026-04 |
| [platform-core.md](platform-core.md) | Core platform design and constraints | 2026-04 |
| [APP_STATUS.md](APP_STATUS.md) | Artifact readiness register | 2026-04 |
| [gap-closure-roadmap.md](gap-closure-roadmap.md) | Gap closure roadmap and prioritization | 2026-04 |
| [OPEN_RISKS_AND_NEXT_10.md](OPEN_RISKS_AND_NEXT_10.md) | Open risks and next 10 priorities | 2026-04 |
| [PRODUCTION_READINESS_CHECKLIST.md](PRODUCTION_READINESS_CHECKLIST.md) | Production readiness checklist | 2026-04 |
| [production-readiness.md](production-readiness.md) | Production readiness narrative | 2026-04 |
| [SECURITY_BASELINE.md](SECURITY_BASELINE.md) | Security baseline controls | 2026-04 |
| [WHAT_THIS_PROVES.md](WHAT_THIS_PROVES.md) | What this platform proves — validation narrative | 2026-04 |
| [readme-standards.md](readme-standards.md) | README asset and badge standards | 2026-04 |
| [GLOSSARY.md](GLOSSARY.md) | Canonical governance vocabulary: holographic state, product vertical, runtime organ, policy gate module | 2026-07 |
| [OVERCLAIM_LEDGER.md](OVERCLAIM_LEDGER.md) | Corrected or blocked public claims and their evidence boundary | 2026-07 |
| [THIRD_PARTY_REGISTER.md](THIRD_PARTY_REGISTER.md) | Third-party service register | 2026-04 |
| [DATA_CLASSIFICATION.md](DATA_CLASSIFICATION.md) | Data classification taxonomy | 2026-04 |

---

## Substrate

Technical deep-dives into platform internals.

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [substrate/architecture.md](substrate/architecture.md) | Substrate architecture overview | 2026-04 |
| [substrate/command-center.md](substrate/command-center.md) | Command center substrate design | 2026-04 |
| [substrate/evidence-chain.md](substrate/evidence-chain.md) | Evidence chain implementation | 2026-04 |
| [substrate/mcp-transport.md](substrate/mcp-transport.md) | MCP transport layer | 2026-04 |
| [substrate/policy-model.md](substrate/policy-model.md) | Substrate policy model | 2026-04 |
| [substrate/python-worker.md](substrate/python-worker.md) | Python worker substrate | 2026-04 |
| [substrate/replay-counterfactual.md](substrate/replay-counterfactual.md) | Replay and counterfactual simulation | 2026-04 |
| [substrate/sdk.md](substrate/sdk.md) | Substrate SDK | 2026-04 |
| [substrate/vertical-packs.md](substrate/vertical-packs.md) | Vertical pack substrate design | 2026-04 |

---

## Strategy

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [strategy/FRONTIER_DOCTRINE.md](strategy/FRONTIER_DOCTRINE.md) | Frontier doctrine: go-to-market and platform philosophy | 2026-04 |
| [strategy/lyte-differentiation-brief.md](strategy/lyte-differentiation-brief.md) | Lyte differentiation brief | 2026-04 |

---

## Wiki

| Document | Description | Last Reviewed |
|----------|-------------|---------------|
| [wiki/wiki-information-architecture.md](wiki/wiki-information-architecture.md) | Wiki information architecture | 2026-04 |
| [wiki/wiki-page-map.md](wiki/wiki-page-map.md) | Wiki page map | 2026-04 |
| [wiki/wiki-publish-checklist.md](wiki/wiki-publish-checklist.md) | Wiki publish checklist | 2026-04 |
| [wiki/wiki-style-guide.md](wiki/wiki-style-guide.md) | Wiki style guide | 2026-04 |
| [wiki/wiki-sync-plan.md](wiki/wiki-sync-plan.md) | Wiki sync plan | 2026-04 |

---

*Generated by the April 2026 documentation consolidation. See `audit/docs/consolidation-report.md` for full consolidation history. This index covers all 153 files moved from root plus pre-existing docs/ sections (trust, doctrine, github, audit, substrate, strategy, wiki). Pre-existing root-level docs/ files are listed under "Key Platform Documents". For a complete file listing of any individual section, see that section's INDEX.md.*
