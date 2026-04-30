# Architecture — SZL Holdings Platform (Canonical)

**Version:** 4.0 | **Date:** April 2026 | **Status:** Canonical — supersedes `ARCHITECTURE.md` and `docs/architecture.md`

> **Navigation:** [ontology.md](ontology.md) · [policy-model.md](policy-model.md) · [telemetry-model.md](telemetry-model.md) · [app-moats.md](app-moats.md) · [AGENTS.md](agents.md) · [CODEX_HANDOFF.md](../operations/codex-handoff.md)

---

## Thesis

SZL Holdings is a **governed decision infrastructure platform**. Every signal that arrives in any domain surfaces through a shared nine-step loop: Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning. Nothing is opaque. Nothing executes without attribution.

The monorepo is a pnpm workspace. One PostgreSQL database. One API server. One design system. One authentication model. Domain packs extend the shared core — they do not replace it.

---

## Platform Layer Model

```
┌──────────────────────────────────────────────────────────────────┐
│  PLATFORM — SZL Holdings                                         │
│  Governed decision infrastructure for consequential operations   │
├──────────────────────────────────────────────────────────────────┤
│  COMMAND SURFACES                                                │
│  Lyte (flagship, planned)   CORTEX (mobile)   Command (hub)      │
│  SZL Holdings (corporate)   Pulse (briefing)  Aegis (pitch deck) │
├──────────────────────────────────────────────────────────────────┤
│  EXECUTION FABRIC                                                │
│  Alloy — workflow orchestration · approval gates · audit trail   │
│  (@workspace/alloy, lib/workflow-engine)                         │
├──────────────────────────────────────────────────────────────────┤
│  DOMAIN PACKS                                                    │
│  Vessels   Terra   Carlota Jo   Sentra (planned)   Counsel (plan)│
└──────────────────────────────────────────────────────────────────┘
```

All surfaces share six governance primitives: Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation (Monte Carlo), Workflow Engine, and Event Fabric (Prism Bus). See [PLATFORM_PRIMITIVES.md](platform-primitives.md) for the full definition.

For the canonical product map (which names resolve to which artifacts), see [app-moats.md](app-moats.md).

---

## Canonical Nine-Step Loop

```
1. Signal          — domain-specific ingestion and normalization (Prism Bus)
2. Context         — cross-domain enrichment (Atlas Core, Memory Fabric)
3. Recommendation  — AI-generated advisory with evidence (Decision Engine)
4. Simulation      — Monte Carlo probabilistic risk model (lib/monte-carlo)
5. Policy          — Covenant Policy permission + approval gate (packages/policy-engine)
6. Execution       — Workflow Engine routes the action (lib/workflow-engine, Alloy)
7. Proof           — Proof Chain records immutable audit trail (lib/proof-chain)
8. Outcome         — Outcome Graph tracks result (lib/outcome-graph)
9. Learning        — Calibration job updates agent priors (packages/reflection-engine)
```

Every consequential action in every domain follows this loop. The domain determines signal source and action vocabulary. The governance infrastructure is shared.

---

## Monorepo Structure

```
/
├── artifacts/              # Deployable applications (active + archived)
│   ├── api-server/         # Express 5 — single backend for all surfaces
│   ├── szl-holdings/       # Corporate dashboard + Lyte surfaces (root /)
│   ├── command/            # Unified Command hub (/command)
│   ├── vessels/            # Maritime intelligence (/vessels)
│   ├── terra/              # Real estate intelligence (/terra)
│   ├── carlota-jo/         # Advisory + client portal (/carlota-jo)
│   ├── pulse/              # AI executive briefing (/pulse)
│   ├── szl-holdings-mobile/# CORTEX — Expo mobile command
│   ├── mockup-sandbox/     # NEXUS design sandbox (/nexus)
│   ├── aegis/              # Pitch deck artifact (/aegis) [registered]
│   └── szl-demo-video/     # Demo video artifact (/szl-demo-video)
│
├── packages/               # Agentic infrastructure packages
│   ├── ontology/           # ← NEW: canonical entity/signal type definitions
│   ├── alloy/              # Cognitive runtime + execution control plane
│   ├── atlas-core/         # Enterprise state model — 20 entity types
│   ├── atlas-types/        # Re-export convenience layer
│   ├── atlas-events/       # Cross-domain event taxonomy
│   ├── policy-engine/      # Hierarchical policy evaluation + guardrails
│   ├── decision-engine/    # Signal ranking, scoring, recommendation output
│   ├── action-engine/      # Executable workflows with approval + rollback
│   ├── memory-fabric/      # 10-scope tiered cognitive memory
│   ├── trace-graph/        # Run/agent/tool trace capture and replay
│   ├── evals-core/         # Evaluation framework — benchmarks agent behavior
│   ├── eval-os/            # Unified evaluation OS (gold datasets, regressions)
│   ├── reflection-engine/  # Post-run self-improvement and lesson distillation
│   ├── observability-core/ # OpenTelemetry setup + correlation middleware
│   ├── telemetry-standards/# Semantic conventions for genai/business/http
│   ├── brand-registry/     # Canonical brand vocabulary + lint guard
│   ├── cognitive-runtime/  # Cognitive OS layer (self-model, world model)
│   ├── tool-mesh/          # Governed tool registry and invocation
│   ├── guardian/           # Approval gate enforcement
│   ├── verifier/           # Output verification and confidence scoring
│   ├── planner/            # Task decomposition and objective tracking
│   ├── skill-library/      # Reusable skill definitions for agents
│   ├── constellation/      # World-model graph (entity/concept/causal nodes)
│   └── ...                 # (see packages/ for full list)
│
├── lib/                    # Shared TypeScript libraries (40 packages)
│   ├── db/                 # Drizzle schema (798 tables, 170 schema files)
│   ├── shared-ui/          # Cross-app React component library + OS layer
│   ├── auth/               # OIDC/PKCE authentication, session management
│   ├── workflow-engine/    # Alloy execution fabric (wraps forge-runtime)
│   ├── proof-chain/        # Cryptographic immutable audit trail
│   ├── outcome-graph/      # Decision lifecycle + calibration
│   ├── monte-carlo/        # Probabilistic risk simulation
│   ├── covenant-policy/    # Policy enforcement engine
│   ├── prism-bus/          # Cross-domain event bus
│   ├── ai-engine/          # Multi-provider AI inference (Nuro Mesh)
│   ├── decision-fabric/    # Cross-primitive correlation + observability
│   ├── replay-core/        # Incident capture and scenario replay
│   └── ...                 # (see lib/ for full list)
│
├── docs/                   # Documentation suite
│   └── CANONICAL_INDEX.md  # ← index of which legacy doc each new doc supersedes
├── scripts/                # Seed, QA, automation scripts
└── infra/                  # Azure Bicep IaC templates
```

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript 5.x, Vite 7, Tailwind CSS v4, Framer Motion, Recharts |
| Mobile | Expo, React Native, NativeWind |
| Backend | Node.js 22 LTS, Express 5, TypeScript, esbuild |
| Database | PostgreSQL 16, Drizzle ORM 0.45.x |
| Real-time | WebSocket (HMAC-signed tickets), SSE |
| AI / LLM | OpenAI, Anthropic, Gemini (via Replit AI proxy) |
| Auth | OIDC/PKCE, 11-role org-scoped RBAC, SCIM 2.0 |
| Payments | Stripe |
| Maps | Mapbox GL JS |
| Package mgr | pnpm 10.x workspaces |
| IaC | Azure Bicep |

---

## Package Concept Ownership

| Concept | Owner package |
|---------|--------------|
| Entity / signal ontology | `packages/ontology` (canonical), `packages/atlas-core` (state model) |
| Signal mesh + event routing | `lib/prism-bus`, `packages/atlas-events` |
| Evidence / freshness / confidence metadata | `packages/ontology`, `packages/atlas-core` |
| Policy evaluation + guardrails | `packages/policy-engine`, `lib/covenant-policy` |
| Run orchestration + checkpointing | `packages/alloy`, `lib/workflow-engine` |
| Telemetry conventions | `packages/telemetry-standards`, `packages/observability-core` |
| Memory (tiered cognitive) | `packages/memory-fabric` |
| Evaluation + regression | `packages/evals-core`, `packages/eval-os` |
| Action execution + history | `packages/action-engine` |
| Brand vocabulary + lint | `packages/brand-registry` |
| Freshness registry | `packages/telemetry-standards` (FreshnessLevel enum) |
| Signal connectors (domain) | `lib/intelligence-feeds`, domain pack routes in `api-server` |

---

## Design Principles

**Evidence first.** Every recommendation carries source, confidence, freshness, and policy state. Nothing is surfaced without a receipt.

**Advisory before autonomous.** AI outputs are recommendations. Execution requires human confirmation. This is enforced at the policy layer, not the UI layer.

**Traceability as a feature.** The audit trail is an operational tool. Every significant event is attributed, timestamped, and queryable.

**Shared governance, domain-specific intelligence.** Architecture is shared. Domain expertise lives in each pack's signal connectors and agent vocabulary.

**Clean-room discipline.** Every package has strict TypeScript types. Evidence, freshness, confidence, and policy metadata are never stripped. No silent fallbacks.

---

*For the legacy doc index see [CANONICAL_INDEX.md](../CANONICAL_INDEX.md). For drift history see [AUDIT_FINDINGS_REGISTER.md](../operations/audit-findings-register.md).*
