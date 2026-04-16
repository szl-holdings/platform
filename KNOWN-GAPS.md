# SZL Holdings — Known Gaps Register (Security & Operations)

**Last updated:** 2026-04-16 (rev 5)  
**Owner:** Engineering / DevOps  
**Audience:** Enterprise architects, Series A technical advisors, incoming VP Engineering

This document is the canonical reference for known security, quality, and compliance gaps in the SZL Holdings platform. It consolidates findings from the internal risk register, the April 2026 hardening sprint, and the secrets remediation audit.

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

**Architecture verdict:** All critical tenant isolation and auth P0 gaps are closed. Residual gaps (SSRF, virus scanning, PII encryption) are tracked and scoped with remediation owners.

---

### For Series A Technical Advisors / Investor Diligence
Risk exposure, compliance posture, diligence readiness.

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| KG002 | Timing-unsafe internal token comparison | P0 | ✅ Resolved |
| KG001, KG015 | Multi-tenant data isolation in RAG/AI layer | P0 | ✅ Resolved |
| KG003–KG008, KG016, KG017 | Unvalidated write routes / missing structured logging | P0 | ✅ Resolved |
| GAP-001 | Firebase & Google credentials require manual rotation | High | ⚠️ Open |
| KG011 | No CodeQL SAST in CI pipeline | P1 | ⚠️ Open — Sprint 3 |
| KG012 | No automated dependency vulnerability review in CI | P1 | ⚠️ Open — Sprint 3 |
| KG010 | No automated E2E / integration test suite | P1 | ⚠️ Open — Sprint 3–4 |
| GAP-002 | No CI/CD automated secret scanning | Med | ⚠️ Open |
| GAP-003 | Android keystore not managed by EAS | Med | ⚠️ Open |
| VD1 | No responsible disclosure policy / `security.txt` | P2 | ⚠️ Open — Sprint 4 |
| KG025 | WCAG accessibility not systematically audited | P2 | ⚠️ Open — Sprint 4 |

**Diligence verdict:** All P0 security gaps identified in the pre-sprint audit are resolved. Remaining open items (P1–P2, High/Med) are scoped, have remediation owners, and do not represent critical blockers for Series A close. The three highest remaining enterprise risks are the absence of automated SAST (KG011), dependency review (KG012), and E2E regression testing (KG010).

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
| GAP-004 | No `.env.example` files for all artifacts | Low | ⚠️ Open |
| KG019 | No Lighthouse CI performance regression guard | P2 | ⚠️ Open — Sprint 4 |
| KG023 | SLI/SLO definitions absent | P2 | ⚠️ Open — Sprint 4 |
| KG024 | Large vendor bundle sizes on all web apps (1–1.7 MB) | P2 | ⚠️ Open — Sprint 4 |

**VP Engineering verdict:** Core security hardening is complete. Highest-priority operational work for the new VP is: (1) wire OTEL exporter before first prod deploy (KG009), (2) establish CI security gates (KG011/KG012), (3) build E2E regression suite (KG010), (4) define SLI/SLOs (KG023).

---

## Full Gap Registry

### P0 — Critical / High (Resolved or Immediate Action)

| ID | Gap | Area | Resolution / Status |
|----|-----|------|---------------------|
| KG001 | `alloyRetrieval` singleton had no tenant partitioning | Security / Multi-tenancy | ✅ Resolved Apr-2026. `tenantId` field added to `RetrievalChunk`; all methods enforce tenant scope. |
| KG002 | Internal service tokens compared with `===` | Security / Auth | ✅ Resolved Apr-2026. Replaced with `crypto.timingSafeEqual`. |
| KG015 | `rag_knowledge_chunks` DB table had no `tenant_id` column | Security / Multi-tenancy | ✅ Resolved Apr-2026. Column + index added; strict SQL predicates enforced. |
| KG003–KG008 | Unvalidated write routes / leaked unstructured logs | Input / Observability | ✅ Resolved Apr-2026. Zod schemas + Pino logger applied across all routes. |
| KG014 | `graph-rag.ts` retrieval not propagating tenant ID | Security / Multi-tenancy | ✅ Resolved Apr-2026. `tenantId` threaded to all retrieval calls. |
| KG016–KG017 | Ad-hoc field checks and console logging in admin/lib | Input / Observability | ✅ Resolved Apr-2026. Zod and Pino applied. |
| REM-001 | Placeholder credential files in repo | Credentials | ✅ Resolved Apr-2026. Verified and template copies created. |
| REM-002 | `.gitignore` did not cover credential patterns | Credentials | ✅ Resolved Apr-2026. Hardened with comprehensive patterns. |
| REM-003 | No developer docs for secrets | Process | ✅ Resolved Apr-2026. `SECRETS_SETUP.md` created. |
| REM-004 | No security credential hygiene checklist | Process | ✅ Resolved Apr-2026. `SECURITY-CHECKLIST.md` created. |
| GAP-001 | Firebase & Google credentials require manual rotation | Credentials | ⚠️ Open — **High Severity**. Real values may exist in history. Manual rotation required. |

---

### P1 — High (open — targeted for Sprint 3)

| ID | Gap | Area | Impact | Mitigation Plan | Owner |
|----|-----|------|--------|-----------------|-------|
| KG009 | OTEL exporter not configured for prod | Observability | No prod tracing | Configure OTLP endpoint before deploy | Platform |
| KG010 | No automated E2E test suite | Quality | Regression risk | Build Playwright suite for critical flows | Engineering |
| KG011 | CodeQL SAST not in CI | Security / CI | SAST coverage gap | Add `.github/workflows/codeql.yml` | DevOps |
| KG012 | Dependency review not in CI | Supply Chain | Vulnerable deps risk | Add `dependency-review-action` to PRs | DevOps |
| KG013 | No `CODEOWNERS` file | Process | No review ownership | Create `CODEOWNERS` mapping | Eng Lead |
| KG020b | Webhook URLs not SSRF validated | Security / SSRF | SSRF risk | Add URL validation / host allowlist | Security Lead |

---

### P2 — Medium / Low (open — Sprint 4 / roadmap)

| ID | Gap | Area | Impact | Notes |
|----|-----|------|--------|-------|
| GAP-002 | No CI/CD automated secret scanning | Security | Leaked keys risk | Add `gitleaks` to CI |
| GAP-003 | Android keystore not in EAS | Mobile Ops | SPOF risk | Upload to EAS and backup in Vault |
| KG018 | 80+ env vars — no formal schema | Ops | Onboarding friction | Generate docs from `startup-config.ts` |
| KG020c | No virus scanning on uploads | Security | Malware risk | Integrate scanning on object storage |
| KG020d | No field-level encryption for PII | Privacy | Compliance risk | Evaluate encryption for PII columns |
| KG021 | No rate-limit on inquiries | DDoS | Abuse risk | Add `express-rate-limit` |
| KG023 | SLI/SLO definitions absent | Reliability | No targets | Define SLIs for latency/uptime |
| KG024 | Large vendor bundle sizes | Performance | Slow load | Code-split heavy components |
| VD1 | No `security.txt` | Compliance | No disclosure channel | Publish `/.well-known/security.txt` |
| GAP-004 | No `.env.example` in all artifacts | Ops | Dev friction | Add `.env.example` to each artifact |

---

## Disposition Summary

| Severity | Total | Resolved | Open |
|----------|-------|----------|------|
| P0 — Critical / High | 11 | 10 | 1 |
| P1 — High | 6 | 0 | 6 |
| P2 — Medium / Low | 13 | 0 | 13 |
| **Total** | **30** | **10** | **20** |

---

## Related Documents

- `SECURITY-CHECKLIST.md` — full control inventory and credential hygiene
- `SECRETS_SETUP.md` — instructions for handling secrets and credentials
- `lib/db/migrations/0001_add_tenant_id_to_rag_knowledge_chunks.sql` — DB migration for tenant isolation
- `artifacts/api-server/src/lib/validation.ts` — `validateBody` / `validateQuery` / `validateParams` helpers
- `lib/ai-engine/src/retrieval/alloy-retrieval.ts` — tenant-scoped retrieval implementation

---

## Incident Log

- **2026-04-16:** Phase 0 audit confirmed all committed mobile credential files are placeholders. No active leak detected.
