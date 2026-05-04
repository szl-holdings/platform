# Green-Light Diligence Review — SZL Holdings

**Version:** 1.0 · **Date:** April 2026  
**Owner:** Stephen Lutar (Founder)  
**Audience:** Founder, executive team, growth capital investors, design partner leads  
**Purpose:** Final pre-launch diligence pass from 6 distinct stakeholder perspectives

This document synthesizes the platform's readiness for design-partner / public beta launch. It reviews the platform through six distinct lenses — enterprise buyer, security reviewer, operator, technical reviewer, growth capital investor, and future VP Engineering — and surfaces the honest gaps that remain.

---

## Perspective 1 — Enterprise Buyer

*"Would I purchase or pilot this for my organization?"*

### What passes the bar

**Problem-solution fit:** The accountability gap is real. Most enterprise buyers in regulated industries have experienced the pain of AI recommendations with no governance trail, decision chains that cannot be reconstructed in an audit, and approval processes that live in email and Slack. SZL Holdings solves a real problem with a clear architectural answer.

**Platform completeness:** The governed decision loop is fully operational. Signal ingestion, AI recommendation, Monte Carlo simulation, Covenant Policy evaluation, human approval, workflow execution, Proof Chain sealing, and outcome recording all work end-to-end.

**Domain coverage:** Six domain packs are functional across security, maritime, real estate, legal, advisory, and cloud sovereignty. Each is independently usable and benefits from the shared governance infrastructure.

**Trust posture:** OIDC/PKCE authentication, org-scoped tenant isolation, advisory-only AI, mandatory approval gates, and immutable Proof Chain are all present and enforced.

**Documentation:** Public docs, admin guide, operator guide, end user guide, FAQ, and troubleshooting guide are complete and sufficient for self-serve onboarding.

### Honest gaps for the buyer conversation

**SOC 2:** Not certified. Targeted Q3–Q4 2026. This is a standard enterprise requirement that will delay or block deals with security-sensitive buyers who require SOC 2 at the time of purchase (not just in roadmap). Mitigation: Security Questionnaire Pack available; architecture is built to SOC 2 controls.

**Customer references:** Zero external customer references at launch. The design partner program is the entry motion, but some buyers want to speak to existing customers before signing. Mitigation: Founder-led reference conversations; transparent about design partner phase.

**Self-serve onboarding:** Not yet viable for unsupervised enterprise users. The platform is functional alpha — real workflows require CS-assisted setup. Mitigation: All design partner engagements include CS onboarding support.

**SAML 2.0:** Not available at launch (OIDC only). Some large enterprises require SAML. Mitigation: OIDC is the modern standard; SAML is on roadmap.

**Buyer verdict:** Ready for invitation-only design partner launch with enterprise buyers who have high accountability pain and can tolerate alpha status. Not ready for broad self-serve launch or buyers who require SOC 2 at the time of contract.

---

## Perspective 2 — Security Reviewer

*"Is this safe to put in front of my organization's data and users?"*

### What passes the bar

**Architecture:** All P0 security gaps resolved in the April 2026 hardening sprint. Cross-tenant isolation is architectural (not just query-level). Proof Chain is append-only with tamper detection. Advisory-only AI with mandatory approval gates. Global deny-by-default authentication middleware.

**Auth:** OIDC/PKCE with httpOnly session cookies. SCIM 2.0 provisioning. Azure AD SSO. 11-role RBAC with org-scoped tenant isolation. Biometric auth on mobile (CORTEX).

**Infrastructure:** Azure App Service, PostgreSQL Flexible, Key Vault, Redis, CDN. TLS 1.3 on all connections. HMAC-signed WebSocket tickets (5-minute TTL). Secrets managed via Azure Key Vault (production).

**CI/CD:** CodeQL static analysis and automated dependency review on every merge. GitHub Actions CI/CD with branch protection.

**AI governance:** All AI operates in advisory-only mode. Covenant Policy enforced before execution. Proof Chain records every AI output with model attribution and source citations.

### Remaining security gaps

**LB-001 — Firebase / Google credential rotation:** Placeholder credential files exist; original real values may have existed in git history. Manual rotation required before any public launch. (Hard blocker — not resolved as of April 2026.)

**KG020b — Webhook SSRF validation:** No host validation on webhook delivery URLs. An operator-configured webhook could target internal services. Risk: moderate (requires operator-level access to exploit). Mitigation: input validation sprint targeted.

**KG020c — No virus scanning on object storage uploads:** Files uploaded to object storage are not scanned. Risk: malware could be stored and distributed via the platform. Mitigation: Sprint 4 target.

**KG020d — No field-level PII encryption:** PII fields in the database are not encrypted at the field level (only at rest via Azure encryption). Risk: anyone with DB access sees PII in plaintext. Mitigation: Roadmap target.

**No penetration test:** External penetration testing has not been completed. Required for most enterprise security reviews. Mitigation: Scope and schedule a pentest before GA.

**Security reviewer verdict:** Architecture is sound and all critical gaps are closed. Firebase credential rotation (LB-001) is the only hard security blocker. Residual P1–P2 gaps are tracked, scoped, and acceptable for design-partner launch with informed consent from each partner.

---

## Perspective 3 — Operator

*"Would I use this every day? Does it help me do my job better?"*

### What passes the bar

**The governed decision loop works.** The flagship loop — signal through outcome — is fully instrumented and navigable. The UX follows a clear information hierarchy: signal → context → recommendation → simulation → approve.

**Simulation is genuinely useful.** The Monte Carlo simulation gives operators something they do not get anywhere else: a risk-range view with sensitivity drivers before they commit to an action. This is not a UX flourish — it is a meaningful decision aid.

**Proof Chain is trustworthy.** Operators can see their full decision history with complete attribution. This gives them confidence that their decisions are defensible.

**Mobile (CORTEX) is functional.** On-the-go approval is possible. Biometric auth, workspace switcher, and push notifications are all operational.

**Domain-specific workflows are intuitive.** Fleet map, distress pipeline, SOC threat feed — these are surfaces operators in those domains will recognize and adopt quickly.

### Operator pain points

**Data is seeded, not live (alpha status).** In design-partner engagements, the operator's first experience is with demo data, not their own operational data. The gap between "demo impressive" and "works with my data" is where adoption risk lives. Mitigation: CS-assisted onboarding with integration setup in Week 1.

**Learning curve on governance concepts.** "Covenant Policy" and "Proof Chain" are new concepts. Operators may resist approval requirements as friction. Mitigation: OPERATOR_GUIDE.md explains the operator's role clearly; CS onboarding must reinforce the accountability benefit.

**Queue management needs polish.** The exception queue and signal feed are functional but not yet optimized for high-volume operations. Heavy signal environments may require filtering and triage tools that are not yet built. Mitigation: Roadmap item; flag in design-partner onboarding.

**Operator verdict:** Ready for operator adoption in design-partner engagements with CS support. Not yet ready for unsupervised self-serve use at scale.

---

## Perspective 4 — Technical Reviewer

*"Is the codebase production-ready? Can I build on and maintain this?"*

### What passes the bar

**Architecture coherence:** Full-stack TypeScript monorepo (pnpm workspace with 40 packages). React 19 + Vite frontends. Express 5 API server. PostgreSQL 16 + Drizzle ORM. Expo mobile. Azure IaC via Bicep. The stack is modern, coherent, and defensible.

**Scale:** 2,816 API endpoints across 357 route files. 798 database tables across 170 schema files. This is a substantial platform with the architectural footprint to support the full product vision.

**Type safety:** TypeScript throughout. Schema-validated AI decision types. Drizzle ORM for type-safe DB queries.

**CI/CD:** GitHub Actions with CodeQL, dependency review, and build validation. Branch protection on main.

**Security foundation:** Global auth middleware, org-scoped tenant isolation, Proof Chain integrity verification.

**Observability:** Structured logging with trace IDs. API health endpoint. OpenTelemetry instrumentation started.

### Technical gaps

**LB-003 — No production error tracking:** Unhandled exceptions in production are silent without Sentry or Application Insights. Operational blind spot.

**LB-006 — OpenTelemetry exporter not wired to production backend:** Instrumentation exists but telemetry is not flowing to a production OTLP backend.

**KG020b — Webhook SSRF:** No host validation on operator-configured webhook URLs.

**No external pentest:** Architecture is reviewed; no external adversarial testing has been completed.

**No load testing:** API behavior under concurrent production load is untested.

**Prisma → Drizzle migration completeness:** All tables are on Drizzle ORM, but schema sprawl (798 tables across 170 schema files) increases the maintenance burden for future engineers. A schema rationalization pass should be scoped.

**Technical reviewer verdict:** Production-grade architecture for a functional-alpha product. The technical foundation is credible and extensible. The open items (error tracking, OTEL exporter, SSRF, pentest) are well-scoped and resolvable before GA.

---

## Perspective 5 — growth capital Investor

*"Is this a fundable company at the level implied by the architecture?"*

### What passes the bar

**Category creation:** Governed decision infrastructure is a defensible, novel category. The framing is precise — not "AI for enterprise," but the specific structural layer that AI adoption creates a demand for. The timing argument (EU AI Act, AI governance regulatory pressure, AI black-box failures) is coherent.

**Platform thesis:** The six primitives + domain-pack extensibility model is intellectually sound. Each new domain pack is additive, not dilutive. The Outcome Graph creates a data flywheel that compounds with usage — a structural moat argument.

**Technical depth:** 2,816 endpoints, 798 tables, 40 packages, full CI/CD, multi-provider AI with governance. This is not a demo — it is a working platform with architectural credibility.

**Team signal:** Founder-built to this scale is a signal of execution capability. The codebase quality, documentation depth, and governance architecture reflect serious product thinking.

**Go-to-market coherence:** Design partner motion is appropriate for this stage. The buyer personas, sales narrative, objection handling, and ROI model are complete and coherent.

### Investor concerns to address

**No external customers or design partners yet confirmed:** The platform is ready for design partners, but has none signed. The design partner program is defined; execution against it has not yet been demonstrated.

**No revenue:** Pre-revenue. This is expected at this stage, but the path to first revenue via design partner → paying customer needs a timeline.

**Founder as sole technical contributor (to date):** Single point of technical dependency. Hiring plan and technical team building are investor concerns at growth capital.

**SOC 2 timeline:** Investors will ask. The Q3–Q4 2026 target is credible; it should be in the growth capital narrative.

**AI governance regulatory risk:** The EU AI Act compliance posture is a strength, not a weakness — but investors may probe the cost and complexity of staying compliant as regulations evolve.

**Investor verdict:** growth capital investable thesis with strong platform architecture, coherent category, and defensible differentiation. Pre-revenue with no external design partners limits the round at this exact moment. The next 60–90 days of design partner signing and first revenue are the key milestones to close the growth capital narrative.

---

## Perspective 6 — Future VP Engineering

*"Is this a codebase I can hire into, scale, and maintain?"*

### What passes the bar

**Modern stack:** The technology choices are all in the mainstream of modern enterprise engineering. React, TypeScript, Node.js, PostgreSQL, Expo, Azure. No exotic dependencies that will require specialized skills.

**Documentation:** replit.md, ARCHITECTURE.md, SYSTEM-OVERVIEW.md, DATA-MODEL.md, PLATFORM_PRIMITIVES.md, and domain-specific docs provide a solid foundation for onboarding engineers.

**Monorepo structure:** pnpm workspace with clear package boundaries and shared libraries. Engineers can work on specific domain packs without touching the entire codebase.

**CI/CD:** Automated builds, type checking, linting, and security scanning on every merge. Branch protection. This is production engineering hygiene.

### VP Engineering concerns

**Bus factor:** The codebase was built primarily by one person. There are no onboarded engineers. The first hire needs to be a senior engineer who can absorb the full architecture.

**Schema sprawl:** 798 tables across 170 schema files is a maintenance challenge. A future VP will want a rationalization pass and a schema governance policy.

**Test coverage:** Unit and integration test coverage is not complete. The QA strategy relies heavily on smoke tests and manual validation. A VP Engineering will want to invest in test automation before scaling the team.

**Route inventory:** 2,816 endpoints is impressive but also creates surface area risk. The future VP will need the ACCESS-CONTROL-MATRIX.md and the route security matrix to ensure no routes are missed in security reviews.

**Documentation maintenance burden:** The documentation corpus is extensive and valuable but will require active maintenance as the product evolves. A documentation-as-code strategy should be established.

**VP Engineering verdict:** A strong foundation to hire into and scale. The VP will want to prioritize: (1) test coverage investment, (2) schema rationalization, (3) route security matrix automation, and (4) onboarding the first senior engineer as their immediate hire.

---

## Green-Light Summary

| Dimension | Status | Notes |
|---|---|---|
| Product completeness | ✅ Design-partner ready | Functional alpha; CS-assisted onboarding required |
| Security posture | ⚠️ Conditional | LB-001 (Firebase credential rotation) is the only hard blocker |
| Operator usability | ✅ Design-partner ready | Seeded data → needs CS-assisted live data setup |
| Technical credibility | ✅ Strong | Error tracking and OTEL exporter are open items |
| Investor narrative | ✅ growth capital ready thesis | Pre-revenue; design partner signing is the next milestone |
| Engineering scalability | ✅ Strong foundation | Test coverage and schema governance are VP Engineering priorities |

**Overall green-light verdict:**

> **CONDITIONAL GO** for design-partner launch.  
> LB-001 (Firebase credential rotation) must be resolved or formally accepted in writing by the Founder before any public or partner-facing launch.  
> All other blockers are tracked in LAUNCH_BLOCKERS.md and KNOWN-GAPS.md.  
> The platform is launch-ready for an invitation-only, CS-assisted design-partner program.

---

## Manual Human Actions Required Before Launch

These items cannot be automated or resolved in code. They require human action:

| # | Action | Owner | Priority |
|---|---|---|---|
| MA-001 | Rotate Firebase API key and Google Cloud service account credentials | Stephen Lutar | CRITICAL — hard blocker |
| MA-002 | Confirm git history contains no live Firebase/Google key material | Stephen Lutar | CRITICAL |
| MA-003 | Generate fresh `SESSION_SECRET`, `SECRET_ENCRYPTION_KEY`, and `ADMIN_PIN` for production | Stephen Lutar | High |
| MA-004 | Set `CORS_ORIGINS` to production domain only | Stephen Lutar / DevOps | High |
| MA-005 | Configure external uptime monitoring (UptimeRobot / Azure Monitor) on `/api/health` | DevOps | High |
| MA-006 | Configure Sentry (or Azure Application Insights) in production | Engineering | High |
| MA-007 | Verify production database is separate from dev database (`DATABASE_URL` isolation) | Engineering | High |
| MA-008 | Wire OpenTelemetry exporter to production OTLP backend | Engineering | Medium |
| MA-009 | Schedule external penetration test | Stephen Lutar | Medium |
| MA-010 | Begin SOC 2 Type II audit engagement (target Q3 2026) | Stephen Lutar | Medium |
| MA-011 | Sign first design partner agreement | Stephen Lutar | Next milestone |
| MA-012 | Generate first revenue (design partner → paying customer) | Stephen Lutar | Next milestone |
