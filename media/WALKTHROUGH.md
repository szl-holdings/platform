# Developer Walkthrough — SZL Holdings Monorepo

> A 90-second guided tour of the monorepo: from a fresh clone to a live artifact in the preview pane.

**Watch the full platform demo:** [szlholdings.com/szl-demo-video/](https://szlholdings.com/szl-demo-video/)

---

## The Script

### 1. Monorepo at a glance (~15 s)

```
szl-holdings-platform/
├── artifacts/          14 deployable web, mobile, and video apps
├── lib/                Shared libraries (db, auth, AI, UI, event bus)
├── packages/           Domain packages (design system, agent core, policy guard)
├── services/           Platform services (FORGE fabric, Substrate MCP gateway)
├── docs/               Architecture, investor, trust, and ops documentation
└── scripts/            Seed, QA, screenshot, and deployment utilities
```

Every artifact shares **one API server, one auth model, one design system, one audit trail.**

### 2. Start the API server (~20 s)

```bash
pnpm install          # Installs all workspace packages
pnpm --filter @workspace/api-server dev
# → Server ready at http://localhost:8080/
# → GET /api/health returns {"status":"ok"}
```

### 3. Start an artifact (~20 s)

```bash
pnpm --filter @workspace/carlota-jo dev
# → Vite ready at http://localhost:8098/carlota-jo/
```

Open the Replit preview pane, select **Carlota Jo** from the artifact dropdown. The full client portal loads with live demo data.

### 4. Run the readme check (~15 s)

```bash
pnpm readme:check
# → Validates all screenshot references, exits 0
```

### 5. Run the security test suite (~20 s)

```bash
pnpm --filter @workspace/api-server test
# → Auth, RBAC, rate-limit, injection, and governance tests
```

---

## Recording Guidelines

- Viewport: 1440 × 900 at 2× pixel ratio
- Duration: 60–90 seconds maximum
- Format: MP4 (H.264) or WebM — commit files < 15 MB; host externally and update the link above for larger files

## Full Platform Demo

The in-depth platform demo (all domain packs, governed decision loop, Proof Chain) is at:

**[szlholdings.com/szl-demo-video/](https://szlholdings.com/szl-demo-video/)** — source: [`artifacts/szl-demo-video/`](../artifacts/szl-demo-video/)
