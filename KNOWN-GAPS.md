# SZL Holdings API — Known Gaps Register

**Last updated:** 2026-04-16 (rev 4)  
**Owner:** Engineering  
**Audience:** Enterprise architects, Series A technical advisors, incoming VP Engineering

This document is the canonical reference for known security, quality, and compliance gaps in the SZL Holdings API platform. It consolidates findings from the internal risk register and reflects the current state after the April 2026 hardening sprint.

---

## Viewer Guide by Persona

### For Enterprise Architects

Architecture concerns — tenant isolation, auth hardening, encryption, network security.

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| KG001 | Cross-tenant vector/RAG retrieval isolation (alloyRetrieval singleton) | P0 | ✅ Resolved Apr-2026 |
| KG002 | Timing-unsafe internal token comparison | P0 | ✅ Resolved Apr-2026 |
| KG015 | No `tenant_id` column in `rag_knowledge_chunks` DB table | P0 | ✅ Resolved Apr-2026 |
| KG014 | `graph-rag.ts` retrieval not propagating tenant ID | P0 | ✅ Resolved Apr-2026 |
| T7 | `totalIndexed` in retrieval responses leaked cross-tenant corpus size | P0 | ✅ Resolved Apr-2026 |
| KG020b | Webhook delivery URL has no SSRF host validation | P1 | ⚠️ Open — Sprint 3 |
| KG020c | No virus/malware scanning on object storage uploads | P2 | ⚠️ Open — Sprint 4 |
| KG020d | No field-level encryption for PII columns | P2 | ⚠️ Open — Roadmap |

**Architecture verdict:** All critical tenant isolation and auth P0 gaps are closed. Three residual gaps (SSRF, virus scanning, PII encryption) are tracked and scoped with remediation owners.

---

### For Series A Technical Advisors / Investor Diligence

Risk exposure, compliance posture, diligence readiness.

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| KG002 | Timing-unsafe internal token comparison | P0 | ✅ Resolved |
| KG001, KG015 | Multi-tenant data isolation in RAG/AI layer | P0 | ✅ Resolved |
| KG003–KG008, KG016, KG017 | Unvalidated write routes / missing structured logging | P0 | ✅ Resolved |
| KG011 | No CodeQL SAST in CI pipeline | P1 | ⚠️ Open — Sprint 3 |
| KG012 | No automated dependency vulnerability review in CI | P1 | ⚠️ Open — Sprint 3 |
| KG010 | No automated E2E / integration test suite | P1 | ⚠️ Open — Sprint 3–4 |
| VD1 | No responsible disclosure policy / `security.txt` | P2 | ⚠️ Open — Sprint 4 |
| KG025 | WCAG accessibility not systematically audited | P2 | ⚠️ Open — Sprint 4 |

**Diligence verdict:** All P0 security gaps identified in the pre-sprint audit are resolved. Remaining open items (P1–P2) are scoped, have remediation owners, and do not represent critical blockers for Series A close. The three highest remaining enterprise risks are the absence of automated SAST (KG011), dependency review (KG012), and E2E regression testing (KG010).

---

### For Incoming VP Engineering

Operational gaps, process health, test coverage, observability, team ownership.

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| KG009 | OpenTelemetry exporter not configured for production | P1 | ⚠️ Open — pre-deploy |
| KG010 | No automated E2E / integration test suite | P1 | ⚠️ Open — Sprint 3–4 |
| KG011 | CodeQL SAST not configured in CI | P1 | ⚠️ Open — Sprint 3 |
| KG012 | Dependency review not in CI | P1 | ⚠️ Open — Sprint 3 |
| KG013 | No `CODEOWNERS` file | P1 | ⚠️ Open — Sprint 3 |
| KG018 | 80+ env vars with no formal schema documentation | P2 | ⚠️ Open — Sprint 4 |
| KG019 | No Lighthouse CI performance regression guard | P2 | ⚠️ Open — Sprint 4 |
| KG023 | SLI/SLO definitions absent | P2 | ⚠️ Open — Sprint 4 |
| KG024 | Large vendor bundle sizes on all web apps (1–1.7 MB) | P2 | ⚠️ Open — Sprint 4 |

**VP Engineering verdict:** Core security hardening is complete. Highest-priority operational work for the new VP is: (1) wire OTEL exporter before first prod deploy (KG009), (2) establish CI security gates (KG011/KG012), (3) build E2E regression suite (KG010), (4) define SLI/SLOs (KG023).

---

## Full Gap Registry

### P0 — Critical (resolved in April 2026 sprint)

| ID | Gap | Area | Resolution |
|----|-----|------|------------|
| KG001 | `alloyRetrieval` singleton had no tenant partitioning — potential cross-tenant vector retrieval | Security / Multi-tenancy | `tenantId` field added to `RetrievalChunk`; all retrieval/ingest methods enforce tenant scope; fail-closed (empty result when tenant absent); all callsites in `ai-engine.ts` and `graph-rag.ts` pass caller `orgId` as `tenantId` |
| KG002 | Internal service tokens compared with `===` (timing-unsafe) | Security / Auth | Replaced with `crypto.timingSafeEqual` in `auth.ts` and `app.ts` |
| KG003 | `console.log/error/warn/info` in production route handlers leaked unstructured data to stdout | Observability | Replaced with structured Pino logger across all route files |
| KG004 | Dreamscape POST routes accepted arbitrary `req.body` with no validation | Security / Input | Zod schemas + `validateBody` middleware added to all resource POST/PATCH routes |
| KG005 | Certification Readiness POST routes accepted arbitrary `req.body` with no validation | Security / Input | Zod schemas + `validateBody` added to programs, requirements, status, and tasks routes |
| KG006 | `routes/governance.ts` write routes used ad-hoc field checks instead of Zod | Input Validation | `validateBody` + Zod schemas added to all 5 write routes |
| KG007 | `routes/cms.ts` key POST/PATCH routes inserted `req.body` without Zod validation | Input Validation | `validateBody` schemas added to pages, articles, posts, and contact-submissions |
| KG008 | `routes/alloy.ts` flag and approval routes lacked `validateBody` | Input Validation | Zod schemas + `validateBody` applied to flag upsert, flag patch, and approval-decide routes |
| KG014 | `graph-rag.ts` retrieval callsites did not propagate tenant ID to `retrieveHybrid` | Security / Multi-tenancy | `tenantId` added to `GraphRAGQuery` interface; threaded to both `retrieveHybrid` calls (entity traversal + fallback path) |
| KG015 | `rag_knowledge_chunks` DB table had no `tenant_id` column — vector and keyword searches returned cross-tenant results | Security / Multi-tenancy | `tenant_id TEXT` column + index added via schema push; strict `WHERE tenant_id = $N` SQL predicate (no `IS NULL` fallback); `retrieveFromDb` fail-closed; `upsertChunk` stores `tenant_id`; `AlloyRetrievalEngine` retrieval methods now have required `tenantId: string` TypeScript signatures |
| KG016 | `console.warn/error` used in `lib/email.ts`, `lib/geocoding.ts`, `lib/ny-forecast-engine.ts`, and `lib/ai-engine/src/rag-vector-store.ts` | Observability | All replaced with structured Pino logger calls |
| KG017 | `routes/tenant-provisioning.ts` write routes used ad-hoc field checks instead of Zod `validateBody` | Input Validation | Zod schemas added; `validateBody` wired into all 6 admin write routes |

---

### P1 — High (open — targeted for Sprint 3)

| ID | Gap | Area | Impact | Mitigation Plan | Owner |
|----|-----|------|--------|-----------------|-------|
| KG009 | OpenTelemetry exporter not configured for production (`exporters=[none]`) | Observability | Traces not exported; no distributed tracing in prod | Set `OTEL_EXPORTER_OTLP_ENDPOINT` and configure exporter before first production deploy | Platform |
| KG010 | No automated E2E / integration test suite | Quality | Regression risk on every release | Build Playwright suite targeting critical user flows (auth, AI queries, document signing) | Engineering |
| KG011 | CodeQL scanning not configured in GitHub CI | Security / CI | SAST coverage gap | Add `.github/workflows/codeql.yml` with JavaScript/TypeScript target | DevOps |
| KG012 | Dependency review not configured in GitHub CI | Supply Chain | Vulnerable transitive deps can merge undetected | Add `dependency-review-action` to PR workflow | DevOps |
| KG013 | No `CODEOWNERS` file | Process | No mandatory review ownership | Create `CODEOWNERS` mapping API routes to owning teams | Engineering Lead |
| KG020b | Webhook delivery URLs not validated against SSRF allowlist | Security / SSRF | User-supplied webhook URLs could be used to hit internal endpoints | Add URL validation / host allowlist before webhook delivery | Security Lead |

---

### P2 — Medium (open — Sprint 4 / roadmap)

| ID | Gap | Area | Impact | Notes |
|----|-----|------|--------|-------|
| KG018 | 80+ environment variables — no formal env var schema documentation | Ops | Deployment failures during onboarding | Generate env var documentation from `startup-config.ts` |
| KG019 | No Lighthouse CI integration | Performance | Performance regression risk | Add Lighthouse CI check on PRs |
| KG020 | Object storage ACL not enforced on all upload paths (only PDF batch path verified) | Security / Data | Private files could be publicly accessible | Audit all `uploadObject` callsites for explicit ACL |
| KG020c | No virus/malware scanning on uploaded files | Security | Malicious file uploads stored unscanned | Integrate ClamAV or cloud virus scanning on object storage |
| KG020d | No field-level encryption for PII columns | Privacy / Compliance | PII exposed if DB access compromised | Evaluate field-level encryption for contact email, user profile columns |
| KG021 | No rate-limit on `routes/holdings.ts` inquiry POST (public endpoint, triggers email) | DDoS / Abuse | Email flooding possible | Add `express-rate-limit` (e.g., 10/hr per IP) to `/holdings/inquiries` |
| KG022 | Privacy, security, and trust pages not reviewed for completeness | Legal / Compliance | Content accuracy unverified | Schedule legal review |
| KG023 | SLI/SLO definitions absent | Reliability | No reliability targets or error budgets | Define SLIs for API latency (p50/p99), error rate, uptime |
| KG024 | Large vendor bundle sizes (1–1.7 MB) on all web apps | Performance | Slow initial loads; mobile experience | Code-split at route level; lazy-load heavy components |
| KG025 | WCAG accessibility not systematically audited | Compliance | A11y compliance gaps unknown | Run axe-core in CI |
| VD1 | No `security.txt` / responsible disclosure policy | Compliance | No formal external vulnerability intake channel | Publish `/.well-known/security.txt` and internal triage SLA |

---

## Disposition Summary

| Severity | Total | Resolved | Open |
|----------|-------|----------|------|
| P0 — Critical | 13 | 13 | 0 |
| P1 — High | 6 | 0 | 6 |
| P2 — Medium | 11 | 0 | 11 |
| **Total** | **30** | **13** | **17** |

---

## Related Documents

- `SECURITY-CHECKLIST.md` — full control inventory with pass/fail status and evidence
- `lib/db/migrations/0001_add_tenant_id_to_rag_knowledge_chunks.sql` — DB migration for tenant isolation
- `artifacts/api-server/src/lib/validation.ts` — `validateBody` / `validateQuery` / `validateParams` helpers
- `lib/ai-engine/src/retrieval/alloy-retrieval.ts` — tenant-scoped retrieval implementation
