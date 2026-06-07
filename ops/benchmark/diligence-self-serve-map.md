# Diligence Self-Serve Map

**Last updated:** April 2026
**Purpose:** Map the investor diligence experience as a self-serve journey

---

## What Investors Look For (2025-2026 Series A)

Based on current benchmarks:

> "In a Seed round, investors bet on the founder. In a Series A, they bet on the engine."

### Technical Diligence Checklist

| Category | What They Inspect | SZL Evidence |
|----------|------------------|-------------|
| Architecture | Monolith vs. modular, scalability patterns | 34 shared libs, domain packs on shared primitives |
| Code quality | Test coverage, CI/CD, linting, TypeScript strict | GitHub Actions CI, ESLint, TypeScript strict, Vitest |
| Data model | Schema design, migrations, multi-tenancy | 561 tables, org_id scoping, Drizzle ORM |
| Security | Auth, encryption, RBAC, secrets management | Clerk auth, AES-256-GCM, 11-role hierarchy, env vars |
| Infrastructure | Deployment, monitoring, incident response | Replit deployment, OTel instrumentation, health endpoints |
| AI governance | Model attribution, confidence tracking, human override | Proof Chain, Outcome Graph, Covenant Policy |
| Team velocity | Commit history, release cadence, documentation | GitHub releases, CHANGELOG, comprehensive docs |

### Commercial Diligence

| Category | What They Evaluate | SZL Evidence |
|----------|-------------------|-------------|
| Market size | TAM/SAM/SOM | $16.3B decision intelligence market (24.7% CAGR) |
| Category positioning | Differentiation from competitors | "Governed Decision Infrastructure" — no direct competitor |
| Product-market fit | Customer conversations, pilot results | Domain coverage across defense, maritime, real estate |
| Go-to-market | Sales motion, trust center, developer experience | Trust-first GTM, Decision Theater demo, API docs |
| Team | Founder domain expertise, technical depth | Multi-domain founder with operational experience |

---

## Self-Serve Diligence Journey

### Step 1: Architecture Overview (Public)
- `SYSTEM-OVERVIEW.md` — high-level architecture
- `PLATFORM_PRIMITIVES.md` — six core primitives
- `CATEGORY_POSITIONING.md` — market positioning
- `docs/architecture/` — detailed architecture docs

### Step 2: Live Platform (Public)
- Decision Theater — interactive nine-step loop demonstration
- Trust Center — security posture and compliance evidence
- API Documentation — Swagger UI at `/api/docs`

### Step 3: Repository Inspection (GitHub)
- Monorepo structure (artifacts/ + lib/ + ops/ + docs/)
- CI/CD workflows (.github/workflows/)
- Test coverage and quality gates
- Commit history and release cadence
- Documentation completeness

### Step 4: Diligence Packet (NDA-Gated)
- Financial projections
- Customer pipeline and conversations
- Detailed market analysis
- Technical deep-dive documentation
- Security audit results
- Team profiles and hiring plan

---

## Documentation Readiness Matrix

| Document | Status | Location | Access |
|----------|--------|----------|--------|
| System Overview | ✅ Complete | `SYSTEM-OVERVIEW.md` | Public |
| Platform Primitives | ✅ Complete | `PLATFORM_PRIMITIVES.md` | Public |
| Category Positioning | ✅ Complete | `CATEGORY_POSITIONING.md` | Public |
| Brand Guidelines | ✅ Complete | `BRAND_GUIDELINES.md` | Public |
| API Standards | ✅ Complete | `ops/backend/api-standards.md` | Public |
| Threat Model | ✅ Complete | `ops/security/threat-model-summary.md` | Public |
| Access Control Matrix | ✅ Complete | `ACCESS-CONTROL-MATRIX.md` | Public |
| SLO Catalog | ✅ Complete | `ops/observability/slo-catalog.md` | Public |
| OTel Plan | ✅ Complete | `ops/observability/otel-plan.md` | Public |
| Release Governance | ✅ Complete | `ops/github/release-governance.md` | Public |
| App Disposition Matrix | ✅ Complete | `ops/portfolio/app-disposition-matrix.md` | Internal |
| Demo Guide | ✅ Complete | `DEMO_GUIDE.md` | Internal |
| Known Gaps | ✅ Complete | `KNOWN-GAPS.md` | Internal |

---

## Investor Experience Quality Bar

Based on how top Series A companies present their repos:

| Quality Signal | Benchmark | SZL Status |
|---------------|-----------|------------|
| README quality | Professional, concise, shows architecture | ✅ |
| CHANGELOG maintained | Every release documented | ✅ |
| Contributing guidelines | Shows team process maturity | ✅ |
| Security policy (SECURITY.md) | Responsible disclosure, contact info | ✅ |
| License clear | Business source or open core | ✅ |
| GitHub Issues/PRs | Show active development | Verify |
| GitHub Actions green | CI passing on main | Verify |
| No secrets in code | Clean git history | ✅ |
| Documentation depth | Beyond just README | ✅ (34 ops docs) |
