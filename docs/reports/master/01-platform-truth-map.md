# SZL Holdings — Platform Truth Map

## Company Architecture

| Entity | Role | Status | Readiness |
|--------|------|--------|-----------|
| SZL Holdings | Parent company / trust / investor shell | Active | Functional Alpha |
| Alloy | Execution fabric / orchestration / audit / HITL | Active | Functional Alpha |
| Lyte | Business observability command plane (flagship) | Active | Functional Alpha |
| Aegis (Firestorm) | Resilience / defense / intelligence / SOC | Active | Functional Alpha |
| Terra | Real estate operating intelligence | Active | Functional Alpha |
| Vessels | Maritime operating intelligence | Active | Functional Alpha |
| Carlota Jo | Premium advisory / service brand | Active | Functional Alpha |
| Stephen Site | Founder credibility surface | Active | Functional Alpha |

## Surface Count

| Category | Count | Details |
|----------|-------|---------|
| Web apps | 8 | szl-holdings, lyte, firestorm, terra, vessels, carlota-jo, stephen-site, mockup-sandbox |
| Mobile apps | 7 | aegis, carlota-jo, lyte, stephen, szl-holdings, terra, vessels |
| API server | 1 | api-server with 1166 endpoints |
| Shared packages | 18 | ai-engine, auth, db, shared-ui, workflow-engine, audit, etc. |
| DB schema tables | 50+ | Full relational model across all domains |
| GitHub workflows | 3 | ci.yml, build.yml, deploy.yml |
| Docs | 55+ | Architecture, buyer, trust, investor, internal |

## Experimental / Needs Decision

| Surface | Current Status | Recommendation |
|---------|---------------|----------------|
| Firestorm | Active as Aegis web app | **Keep and harden** — it IS the Aegis web surface |
| Mockup Sandbox | Internal design tool | **Internal-only** — keep for development |

## Product Truth Assessment

| Claim | Reality | Gap |
|-------|---------|-----|
| AI-powered decisions | HuggingFace inference with 9 validated schemas | Real but limited to propose_only mode |
| Evidence-backed retrieval | Hybrid search + BGE embeddings + reranking | Real, needs more indexed data |
| Policy-gated execution | 9 tools, propose_only default, audit on every call | Real |
| Immutable audit trail | Audit log persistence for all AI decisions | Real |
| Multi-tenant SSO/SCIM | Auth middleware + SCIM endpoints exist | Partially implemented, needs activation |
| Human-in-the-loop | Approval center + HITL gates | Real in schema, limited in UI |
| 1166 API endpoints | All exist, most with auth | Many return seeded/demo data |
