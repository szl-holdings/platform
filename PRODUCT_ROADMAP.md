# Product Roadmap — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026  
**Audience:** Internal team, investors, design partners  
**Horizon:** 30-day (tactical) and 90-day (strategic)

> This roadmap covers pre-commercial priorities only — the work required to take the platform from Functional Alpha to first commercial deployment and initial design partner engagement. New domain pack feature development is not in scope for either horizon.

---

## Status Baseline (April 2026)

All platforms are at **Functional Alpha** — full feature sets with seeded/demo data, not yet commercially deployed.

| Platform | Status | Notes |
|----------|--------|-------|
| Lyte (Command) | Functional Alpha | Full PRISM framework, signal-to-action loop |
| Alloy | Functional Alpha | Workflow engine, approval gates, audit trail |
| CORTEX (Mobile) | Alpha Prep | All workspaces functional, pre-release hardening |
| Aegis | Functional Alpha | SOC command, 8 security modules |
| Vessels | Functional Alpha | Fleet, S&P, demurrage, freight, voyage P&L |
| Terra | Functional Alpha | Distress pipeline, ownership graph, deal workflow |
| Carlota Jo | Live | Client portal, advisory ops — paying-client capable |
| PRISM Counsel | Integrated | Legal modules integrated into Aegis |
| IMPERIUM | In Development | Cloud sovereignty — not yet functional |
| Command Portal | Functional Alpha | 8-domain SSE dashboard, executive briefing |

---

## 30-Day Priorities (April–May 2026)

The 30-day horizon is focused on **pre-commercial hardening** — closing the highest-priority gaps before design partner onboarding begins.

### Priority 1: Security and Compliance Gates (Sprints 3–4)

These are the three gaps that represent the most significant risk to enterprise trust:

**P1-A: Wire OpenTelemetry exporter (KG009)**
- Connect OTEL exporter to production APM backend (Grafana Cloud or Azure Monitor)
- This is a hard pre-deploy requirement — no commercial deployment without it
- Pino logging is active; this is the exporter wiring only
- Estimated: 3–5 days engineering

**P1-B: Add CodeQL SAST to CI pipeline (KG011)**
- Configure CodeQL analysis on every push to `main`
- Block merges on critical/high severity findings
- Also adds dependency review gate to CI (KG012)
- Estimated: 2–3 days DevOps

**P1-C: SSRF validation on webhook delivery URLs (KG020b)**
- Add host allowlist validation before webhook delivery
- Prevents SSRF attacks via user-supplied webhook URLs
- Estimated: 1–2 days engineering

### Priority 2: Design Partner Readiness

**P2-A: Demo environment stability**
- Ensure all seed scripts produce consistent, non-overlapping demo data
- Remove stale `STAGING` routes from the route inventory or convert to proper demo flows
- Validate all demo user accounts work across Lyte, Aegis, Vessels, Terra

**P2-B: CODEOWNERS file (KG013)**
- Define code ownership for all major packages and artifacts
- Required for enterprise security reviews
- Estimated: 1 day

**P2-C: Environment matrix documentation (KG018)**
- Document all 80+ environment variables with schema, defaults, and required/optional status
- Add `.env.example` files to all artifacts
- Estimated: 2–3 days

### Priority 3: Trust Center and Diligence Packet Publication

**P3-A: Publish diligence documents**
- Ensure TECHNICAL_DILIGENCE_PACKET.md, INVESTOR_NARRATIVE.md, MOAT_MAP.md, and PRODUCT_ROADMAP.md are complete and accessible in the investor hub
- Update README.md to reference new docs

**P3-B: Trust center review**
- Update TRUST_CENTER_INDEX.md with all new diligence documents
- Verify all trust center links are valid and docs are current
- Set next review date

### Priority 4: CORTEX Alpha Release Readiness

**P4-A: App store submission checklist**
- Complete remaining items from `APP_STORE_SUBMISSION_CHECKLIST.md`
- Privacy policy integration, app store metadata, screenshot packages

**P4-B: Biometric auth QA**
- End-to-end testing of Face ID / Touch ID flows across supported devices
- Offline sync behavior validation

---

## 90-Day Priorities (April–July 2026)

The 90-day horizon is focused on **first commercial deployment** and **design partner activation**. This is the critical path from Functional Alpha to revenue-generating operations.

### Milestone 1: First Commercial Deployment (30–60 days)

The platform must be production-ready before the first design partner goes live.

**M1-A: Production infrastructure provisioning**
- Deploy Azure Bicep IaC to production environment
- Configure Key Vault, App Service, PostgreSQL Flexible Server, Redis, CDN, Front Door
- Validate RTO/RPO procedures against production environment
- Wire OTEL exporter to production APM (prerequisite: P1-A)

**M1-B: Production secrets rotation**
- Rotate all credentials to production-grade values in Azure Key Vault
- Remove all placeholder credentials
- Complete Firebase / Google credentials rotation (GAP-001)
- Implement automated CI/CD secret scanning (GAP-002)

**M1-C: SLI/SLO definition (KG023)**
- Define service level indicators and objectives for all critical paths
- Wire alerting to OTEL and on-call rotation
- Minimum SLOs: API availability 99.5%, p95 latency < 500ms, error rate < 1%

**M1-D: Performance baseline (KG024)**
- Reduce vendor bundle sizes from 1–1.7 MB to < 800 KB via code splitting
- Add Lighthouse CI regression guard (KG019)
- Target Core Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms

### Milestone 2: Design Partner Onboarding (45–75 days)

First 3–6 design partners, one per domain: maritime (Vessels), security (Aegis), real estate (Terra).

**M2-A: Partner provisioning workflow**
- Azure AD tenant setup for each design partner org
- SCIM provisioning configuration per partner
- Role assignment and initial user onboarding
- Dedicated partner Slack channel + support rotation

**M2-B: Domain-specific onboarding content**
- Domain-specific demo scripts for Vessels, Aegis, and Terra
- Operator quick-start guides per domain
- Trust center briefing deck for partner security teams

**M2-C: Partner success instrumentation**
- Log key activation events: first signal reviewed, first simulation run, first approval, first workflow completed
- Build partner health dashboard in Command Portal KPI view
- Weekly partner check-in cadence

### Milestone 3: E2E Test Coverage (60–90 days)

The absence of automated E2E testing (KG010) is the highest-priority quality gap for long-term platform health.

**M3-A: Critical path E2E suite**
- Test the governed decision loop end-to-end: signal → recommendation → simulation → policy → execution → proof recording
- Cover: auth flow, Lyte action queue, Alloy approval gate, CORTEX mobile approval
- Framework: Playwright (web) + Detox (mobile)

**M3-B: API integration tests**
- POST/mutation path coverage for all domain packs (Vessels, Aegis, Terra, PRISM Counsel)
- Test multi-tenant isolation: confirm org-scoped queries return no cross-org data
- Add to CI gate: block merges on E2E failures

**M3-C: Regression baseline**
- Establish passing test baseline on `main`
- Add weekly regression run to CI schedule
- Alert on baseline regressions

### Milestone 4: SOC 2 Type II Readiness Planning (75–90 days)

SOC 2 audit is a Phase 3 goal (post-funding). The 90-day horizon should establish the foundation:

**M4-A: Controls inventory**
- Map existing controls to SOC 2 Trust Services Criteria
- Identify gaps between current implementation and SOC 2 requirements
- Prioritize control implementation based on audit firm feedback

**M4-B: Audit firm selection**
- Engage 2–3 SOC 2 audit firms for scoping conversations
- Get readiness assessment from preferred firm
- Establish target audit date (Q4 2026 or Q1 2027)

**M4-C: Evidence collection automation**
- Configure audit evidence collection for access logs, security scan results, change management records
- Wire to audit trail for automated evidence generation

### Milestone 5: IMPERIUM MVP (90 days)

IMPERIUM (cloud sovereignty) is in development. A functional MVP by the 90-day mark enables:
- A seventh domain pack on the platform's extensibility story
- Cloud governance signal source for Aegis and Lyte correlation
- Expansion path for enterprise customers who use cloud infrastructure as an operational surface

**M5-A: Core cloud inventory and policy modules**
- Multi-cloud estate visibility (AWS, Azure, GCP)
- Policy enforcement dashboard
- Cost anomaly detection and governance alerts

**M5-B: Integration with Command Portal**
- IMPERIUM signals in the 8-domain SSE dashboard
- Cross-domain correlations: cloud posture → security posture (Aegis)

---

## What Is Out of Scope

The following items are explicitly not in the 30- or 90-day roadmap:

- New domain pack feature development (in-sprint feature requests for Aegis, Vessels, Terra, etc.)
- GitHub Actions CI/CD pipeline rebuild
- Mobile app store launch (post-CORTEX alpha hardening)
- Public marketing website refresh
- Any roadmap items beyond 90 days

---

## Dependencies and Risks

| Dependency | Risk | Mitigation |
|------------|------|-----------|
| Azure Key Vault provisioning | Blocks M1-B secrets rotation | Begin Azure subscription setup week 1 |
| Design partner commitment | M2 timeline depends on partner engagement | Start partner conversations in parallel with M1 |
| SOC 2 audit firm availability | Firms book 3–4 months out | Begin scoping conversations at 60-day mark |
| CORTEX App Store review | Apple/Google review timelines unpredictable | Submit 4 weeks before target release date |
| E2E test framework selection | Playwright/Detox selection affects M3 timeline | Decision in first week of M3 planning |

---

## Success Metrics

**30-day:**
- All P0 security gaps closed (confirmed ✅ as of April 2026)
- KG009, KG011, KG012 resolved and CI-gated
- Demo environment stable for 5+ consecutive demo sessions without data reset

**60-day:**
- First design partner organization provisioned and onboarded
- Production environment live with OTEL connected
- SLI/SLO definitions complete with alerting active

**90-day:**
- 3+ active design partner organizations using the platform weekly
- E2E test suite covering critical path with CI gate
- IMPERIUM MVP functional
- SOC 2 readiness assessment complete

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [KNOWN-GAPS.md](KNOWN-GAPS.md) | Full gap registry referenced by this roadmap |
| [TECHNICAL_DILIGENCE_PACKET.md](TECHNICAL_DILIGENCE_PACKET.md) | Technical foundation this roadmap builds on |
| [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) | Deployment procedures for M1 production deployment |
| [ops/frontier/launch-readiness-scorecard.md](ops/frontier/launch-readiness-scorecard.md) | Launch readiness tracking |
| [docs/investor/go-to-market.md](docs/investor/go-to-market.md) | GTM strategy that the design partner program executes |

---

*Last updated: April 2026 · Next review: May 2026*
