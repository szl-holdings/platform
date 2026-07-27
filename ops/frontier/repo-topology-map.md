# Repository Topology Map

Generated: 2026-04-16 (updated)

---

## Monorepo Structure

```
szl-holdings-platform/
├── artifacts/                    # 15 dirs (7 canonical web, 1 mobile, 1 internal, 5 archived, 1 shell)
│   ├── api-server/               # CANONICAL — Express API (395 ts/tsx)
│   ├── szl-holdings/             # CANONICAL — Flagship web (402 ts/tsx)
│   ├── aegis/                    # CANONICAL — Defense & security UI (166 ts/tsx)
│   ├── terra/                    # CANONICAL — Real estate intelligence (92 ts/tsx)
│   ├── vessels/                  # CANONICAL — Maritime intelligence (103 ts/tsx)
│   ├── carlota-jo/               # CANONICAL — Advisory consulting (70 ts/tsx)
│   ├── command/                  # CANONICAL — Unified ops command (223 ts/tsx)
│   ├── szl-holdings-mobile/      # CANONICAL MOBILE — Primary Expo app (167 ts/tsx)
│   ├── cortex-mobile/            # SHELL — Expo scaffold only (2 ts/tsx)
│   ├── [5 archived artifacts]/   # ARCHIVE — see ops/frontier/disposition-matrix.md
│   └── mockup-sandbox/           # INTERNAL — UI prototyping only (5 ts/tsx)
│
├── lib/                          # 34 shared libraries (2 minimal shells)
│   ├── HIGH ACTIVITY (100+ files)
│   │   ├── ai-engine/            # AI orchestration (258 ts)
│   │   ├── api-zod/              # Zod validation (308 ts)
│   │   ├── shared-ui/            # Design system (358 ts)
│   │   ├── services/             # Business services (211 ts)
│   │   └── db/                   # Database schemas (211 ts)
│   │
│   ├── MEDIUM ACTIVITY (10–99 files)
│   │   ├── observability/        # Telemetry (75 ts)
│   │   ├── mobile-shared/        # Mobile components (45 ts)
│   │   ├── graphql-client/       # GraphQL (13 ts)
│   │   ├── forge-runtime/        # Agent engine (14 ts)
│   │   ├── offline-engine/       # Offline sync (10 ts)
│   │   ├── monte-carlo/          # Financial sim (9 ts)
│   │   └── intelligence-feeds/   # Threat intel (8 ts)
│   │
│   ├── LOW ACTIVITY / LIGHT (1–9 files)
│   │   ├── prism-bus/            # Event bus (7 ts)
│   │   ├── mcp-client/           # Model Context Protocol (7 ts)
│   │   ├── covenant-policy/      # Policy engine (5 ts)
│   │   ├── pulse-evals/          # Evaluations (5 ts)
│   │   ├── receipt-graph/        # Receipt tracking (8 ts)
│   │   ├── api-client-react/     # React API client (8 ts)
│   │   ├── crdt-sync/            # CRDT (3 ts)
│   │   ├── analytics/            # Analytics wrapper (6 ts)
│   │   ├── object-storage-web/   # Object storage (3 ts)
│   │   ├── replit-auth-web/      # Replit auth (5 ts)
│   │   ├── i18n/                 # Internationalization (3 ts)
│   │   ├── audit/                # Audit wrapper (4 ts)
│   │   ├── auth/                 # Auth middleware (2 ts)
│   │   ├── config/               # Config (2 ts)
│   │   ├── data-connectors/      # Connectors (2 ts)
│   │   ├── worldline/            # Signal routing (2 ts)
│   │   ├── workflow-engine/      # Workflow (8 ts)
│   │   ├── outcome-graph/        # Outcome modeling (1 ts)
│   │   ├── proof-chain/          # Audit chain (1 ts)
│   │   └── atlas-artifacts/      # Artifacts (1 ts)
│   │
│   └── MINIMAL SHELLS (1 file each)
│       ├── api-spec/             # Minimal spec package
│       └── approvals/            # Minimal approvals package
│
├── ops/                          # Operations documentation
│   ├── frontier/                 # Topology & truth audit (this series)
│   ├── security/                 # Security posture docs
│   ├── portfolio/                # App disposition matrix
│   ├── replit-agent/             # Inventory & target architecture
│   └── [other ops subdirs]
│
├── .github/workflows/            # 43 CI/CD workflows (MEASURED)
│   ├── ci.yml                    # Lint + typecheck + test
│   ├── e2e.yml                   # Playwright E2E (PARTIAL STALE)
│   ├── security.yml              # Dependency audit + SBOM
│   ├── codeql.yml                # CodeQL analysis
│   ├── dependency-review.yml     # Dependabot PR gate
│   ├── lighthouse.yml            # Perf CI
│   ├── deploy-staging.yml        # Staging deploy
│   ├── deploy-production.yml     # Production deploy (confirm gate)
│   ├── deploy.yml                # Legacy deploy (review needed)
│   ├── container-publish.yml     # Docker publish
│   ├── release.yml               # Release creation
│   ├── npm-publish.yml           # npm publish (possibly stale)
│   └── prism-counsel-ci.yml      # ARCHIVED — retained as archival record; targets deprecated surface
│
├── .replit                       # Replit workspace config
├── .gitignore                    # Root gitignore
├── .env.example                  # Secret template (153 vars documented)
├── pnpm-workspace.yaml           # Workspace definition
└── README.md                     # Platform overview (some claims outdated)
```

---

## Service Connectivity Map

```
                    ┌─────────────────────────────────┐
                    │         API Server               │
                    │   :8080 → externalPort 80        │
                    │   Express 5 + Apollo GraphQL      │
                    │   172 route files                 │
                    └───────────────┬─────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
    │ PostgreSQL  │         │  Replit     │         │  External   │
    │ (Replit DB) │         │  Secrets    │         │  Services   │
    │ 561+ tables │         │  Panel      │         │  (AI, Stripe│
    └─────────────┘         └─────────────┘         │   Email...) │
                                                    └─────────────┘
           │
           ▼
    Web Apps (all consume API)
    ├── szl-holdings     (:21130 → :3001)
    ├── aegis            (:23933)
    ├── terra            (:25100)
    ├── vessels          (:18485)
    ├── carlota-jo       (:21200)
    └── command          (:25200)
    
    Mobile Apps (consume API via HTTPS)
    ├── cortex-mobile    (Expo, all 8 domains)
    └── szl-holdings-mobile (Expo, secondary)
```

---

## Dependency Flow

```
shared-ui ◄──────────────── All web artifact frontends
api-zod ◄──────────────────  api-server + web validation
db ◄────────────────────────  api-server (primary consumer)
services ◄──────────────────  api-server route handlers
ai-engine ◄─────────────────  api-server AI routes
prism-bus ◄─────────────────  api-server event routing
forge-runtime ◄─────────────  api-server agent execution
mobile-shared ◄─────────────  cortex-mobile + szl-holdings-mobile
observability ◄─────────────  api-server + lib/* monitoring
```

---

## Port Registry

| Port | External | Artifact | Notes |
|------|----------|----------|-------|
| 8080 | 80 | api-server | Main API entry |
| 9090 | 3000 | (reserved) | Secondary API or staging |
| 21130 | 3001 | szl-holdings | Flagship web |
| 21200 | — | carlota-jo | Advisory |
| 23933 | — | aegis | Defense/Intel (canonical) |
| 25100 | — | terra | Real estate |
| 25200 | — | command | Unified ops |
| _(various)_ | — | _(5 archived)_ | See disposition-matrix.md |
