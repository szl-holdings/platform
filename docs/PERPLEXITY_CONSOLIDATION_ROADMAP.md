# Platform Consolidation Roadmap — Fold Amaru, Rosie, and Sentra into A11oy

> Purpose: a single technical brief describing how to consolidate the separate
> front-end artifacts (**Amaru**, **Rosie**, **Sentra**) into the **A11oy** shell,
> while keeping the **API Server** and **Vessels** as the foundation to build on.
> This is an architecture/refactor plan, not a marketing document. It lists what
> exists today, the target structure, and the exact phased steps.

Repository: `szl-holdings/platform`
Snapshot branch with everything: `replit-snapshot-2026-05-29`
Stack: pnpm monorepo · TypeScript 5.9 · React 19 · Vite · Node 24 · Express 5 · Drizzle ORM · PostgreSQL

---

## 0. Current state (facts)

| Artifact | Kind | Surface today | Disposition |
|---|---|---|---|
| `artifacts/a11oy` | web | 195 pages, 26 data modules | **Consolidation shell (target)** |
| `artifacts/sentra` | web | 200 pages, cyber-resilience domain | Fold into A11oy as a domain pack |
| `artifacts/rosie` (+ `rosie-mobile`) | web + mobile | 14 pages, decision-fabric domain | Fold into A11oy as a domain pack |
| Amaru | backend + bundle | `amaru-ops-core.ts`, `amaru-proxy.ts` routes; `artifacts/amaru-uds`; `artifacts/conduit` narrative | Fold front-end into A11oy as a domain pack |
| `artifacts/vessels` | web | 122 pages, maritime domain | **Keep as the reference domain pack** |
| `artifacts/api-server` | web (Express) | 476 route files, OIDC/PKCE, Drizzle/Postgres, 242 migrations | **Keep as the foundation** |

All artifacts already live in one pnpm monorepo and already share the same
`packages/` libraries and the same API Server backend. Consolidation is therefore
a **front-end + routing + design-system** unification, not a backend rewrite.

---

## 1. Target architecture

One front-end shell (**A11oy**) hosting every domain as a routed module:

```
artifacts/a11oy/                 ← single web shell (auth, nav, layout, design system)
  src/
    domains/
      maritime/                  ← Vessels (reference domain pack)
      cyber/                     ← Sentra
      decision/                  ← Rosie
      amaru/                     ← Amaru front-end
    shared/                      ← shell chrome, nav, theming (from packages/)
artifacts/api-server/            ← unchanged foundation, scoped /api/<domain>/ routes
artifacts/rosie-mobile/          ← stays separate (Expo); points at same API Server
```

Foundation kept intact:
- **API Server** — already the single backend for every artifact. Routes stay
  namespaced under `/api/<domain>/`. It owns the `X-App-Mode` header (the runtime
  source of truth the front-end should trust).
- **Vessels** — the most complete domain (122 pages). It becomes the **reference
  implementation** of the Domain Pack Standard that the other domains conform to.

---

## 2. Domain Pack Standard (the unit of consolidation)

Each folded product becomes a "domain pack" with a fixed shape so the shell can
mount them uniformly. See `docs/DOMAIN_PACK_STANDARD.md` for the full contract.

A domain pack provides:
1. A route subtree mounted under the A11oy shell (`/<domain>/...`).
2. Its pages, using the **shared** design system and layout primitives (no private
   copies of nav, theme, or auth).
3. Its API namespace under `/api/<domain>/` on the API Server.
4. Its data modules registered with the shell's module registry.
5. Its trust/proof surface wired to the shared proof chain (one chain, not per-app).

Vessels is refactored first to *be* this standard; Sentra, Rosie, and Amaru are
then refactored to match it.

---

## 3. Phased plan

### Phase 0 — Inventory & freeze
- Enumerate route namespaces and page overlaps across a11oy/sentra/rosie/amaru.
- Record shared-vs-duplicated components (search `packages/` for duplicates).
- Reference: `docs/CONSOLIDATION_DECISIONS.md`, `docs/REMOVALS_AND_CONSOLIDATION.md`,
  `docs/PRODUCT_MATRIX.md`.

### Phase 1 — Unify the shell
- Make A11oy the single host: shared auth (OIDC/PKCE via API Server), shared nav,
  shared layout, one design system.
- Add `src/domains/` and a module registry the shell reads to build navigation.

### Phase 2 — Codify the reference domain pack (Vessels)
- Refactor Vessels into `src/domains/maritime/` conforming to the Domain Pack
  Standard. This is the template every other domain follows.

### Phase 3 — Fold Sentra, Rosie, Amaru
- Move each product's pages into `src/domains/<domain>/`, replacing private
  chrome/theme/auth with the shared shell equivalents.
- Normalize each backend namespace to `/api/<domain>/` (most already are).
- Amaru's front-end (today expressed via `conduit` + `amaru-uds`) is rebuilt as a
  domain pack against the existing `amaru-ops-core` / `amaru-proxy` routes.

### Phase 4 — Unify data & proof chain
- One tenant model, one proof chain, one trust-scoring surface across domains
  (see `docs/PROOF_CHAIN_SPEC.md`).

### Phase 5 — Remove the standalone artifacts
- Once a domain is mounted in A11oy and verified, retire its standalone artifact
  (`artifacts/sentra`, `artifacts/rosie`) and redundant UDS bundles, per
  `docs/REMOVALS_AND_CONSOLIDATION.md`. `rosie-mobile` stays (Expo) and keeps
  pointing at the same API Server.

### Phase 6 — Productionize
- Continue with `docs/PERPLEXITY_BUILD_ROADMAP.md` (real auth, tenant data,
  persistence, billing, and depth on the core end-to-end flows).

---

## 4. Where to find everything

- Canonical repo: https://github.com/szl-holdings/platform
- Snapshot branch (all artifacts + docs): `replit-snapshot-2026-05-29`
- This roadmap: `docs/PERPLEXITY_CONSOLIDATION_ROADMAP.md`
- Companion build roadmap: `docs/PERPLEXITY_BUILD_ROADMAP.md`
- Supporting facts: `docs/CONSOLIDATION_DECISIONS.md`, `docs/PRODUCT_MATRIX.md`,
  `docs/DOMAIN_PACK_STANDARD.md`, `docs/REMOVALS_AND_CONSOLIDATION.md`
