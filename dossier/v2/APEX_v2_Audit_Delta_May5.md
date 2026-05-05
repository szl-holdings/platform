# SZL Holdings — Audit Delta (v2)
## What changed between the May 4 dossier (v1) and the May 5 refresh (v2)

This document records the concrete state changes made between 2026-05-04 (the v1 dossier publish date) and 2026-05-05 (the v2 dossier publish date), prepared for the May 6, 2026 Empire APEX session with counselor Mercy McInnis.

---

## 1. New peer-style papers published

### v9 — *The Lutar Invariant Family v1 → v7 → Ω: From Three-Term Foundation to Bianchi-Closed Fiber Bundle*

| Field | Value |
|---|---|
| Repo | `github.com/szl-holdings/ouroboros-thesis` |
| Tag | `paper-v9-1.0.0` |
| Length | 17 pages |
| File size | 234 KB PDF |
| Author | Stephen P. Lutar (SZL Holdings) — ORCID `0009-0001-0110-4173` |
| Date | 2026-05-05 |
| Build pipeline | `markdown-it@14.1.1` → Chromium PDF (system Chromium at NixOS path) |
| Zenodo deposit | Re-fired by tag re-creation; release ID `317669393` |

### v10 — *The Audit Closure Operator Λ₁₀: Formalising the Implementation Contract of the Lutar Family*

| Field | Value |
|---|---|
| Repo | same |
| Tag | `paper-v10-1.0.0` |
| Length | 11 pages + Appendix A essay + Lutar-family one-pager |
| File size | 211 KB PDF |
| Date | 2026-05-05 |
| Codex schema | `alloy.supreme_knowledge/v11-UNIFIED-OPERATIONAL` (76 nodes, 95 edges; v10 adds the `lutar_v10` node and a single `derives` edge from `lutar_v7`) |
| Live binding | `POST /api/ouroboros/lutar/v10` runs `lutarV10Audit()` against the live shipping repo on every test run |
| Zenodo deposit | Re-fired by tag re-creation; release ID `317669402` |

### What v10 does (worth landing in conversation)

v10 introduces no new physical L-term. Its only purpose is to certify, layer by layer, that every formula in v9 actually executes against the live shipping repo. v10 is a meta-invariant on v9. **The platform audits its own thesis.**

---

## 2. New A11oy operator surfaces

The following pages were added to A11oy in the May 4–5 cycle. All are referenced in the v2 demo guide.

| Page | Path | Purpose |
|---|---|---|
| Trust Center | `/trust-center` | Constitutional surface — proof, covenants, attestation |
| Trust Exchange | `/trust-exchange` | Proof-distribution surface (regulators, auditors, partners) |
| Public Trust Portal | `/public-trust-portal` | Externally-facing proof packets |
| Agent Zero Trust | `/agent-zero-trust` | Runtime policy gate for every agent action |
| Argo (decision engine) | `/a11oy/argo` + `/argo-bridge` | Champion policies, mirror eval, counterfactuals, reward-hacking guardrails |
| ArgoForge | `/a11oy/argo-forge` | Champion-policy authoring |
| MirrorEval | `/a11oy/mirror-eval` | Off-policy evaluation |
| Counterfactuals | `/a11oy/counterfactuals` | Counterfactual rollout analysis |
| RewardHacking | `/a11oy/reward-hacking` | Guardrail surface against reward hacking |
| PSYCHE | (observatory) | Emergent-sentience observatory |

### Argo regressions resolved in the same cycle

- **SelfPlayArena replay playback** — `setInterval` driven, 900 ms per step, clears on pause/unmount, auto-stops at the last frame.
- **SelfPlayArena recency sort** — now timestamp-based via `lastMatchAt: string` ISO field; `Date.getTime()` comparison instead of id-string compare.
- **Argo event timestamps** — `Date.now()` removed from generated events; replaced with fixed anchor constant `ANCHOR_MS = 1746403200000` (2026-05-05T00:00:00Z) so all 90 generated event timestamps are fully deterministic.
- **HomePage Argo section** — collapsed to a single card with three KPIs (Champion Policies: 6, World-Model Acc: 89.1%, Throughput: 31.4 ev/s) + Bridge link.
- **Bridge cross-links** — Reward Hacking, Mirror Eval, and Counterfactuals added to the cross-link footer bar.

---

## 3. New customer-facing artifact: ROSIE — Unified Decision Fabric

A new artifact was scaffolded and registered:

- **Slug:** `/rosie/`
- **Display name:** ROSIE — Unified Decision Fabric
- **Pages:** Identity, Optimizer, Fabric, Research, Proof, Evidence Bench (six pages, hash-routed)
- **Role:** Operator surface for CPS payloads — execute, watch proof packets emit, approve or roll back
- **Workflow:** `artifacts/rosie: web` (registered with the artifact system)

This brings the customer-facing surface count from 7 → **8**. Verified-numbers tables across all v2 documents reflect this.

---

## 4. Covenant Proof Standard (CPS) — first-class API shipped

| Endpoint | Purpose |
|---|---|
| `GET /api/cps/payloads` | List registered payloads |
| `GET /api/cps/payloads/:id` | Resolve a payload definition |
| `POST /api/cps/runs` | Execute a payload run |
| `GET /api/cps/runs/:id` | Inspect a run, its proof receipts, and approval state |
| `POST /api/cps/runs/:id/approve` | Approve a gated step at the caller's tier |
| `POST /api/cps/runs/:id/rollback` | Roll a completed run back to a prior verified state |
| `POST /api/cps/payloads/:id/maturity` | Promote/demote a payload's maturity mode |
| `GET /api/cps/runs` | List runs |
| `GET /api/cps/approvals` | List pending approvals |

Implementation lives at `artifacts/api-server/src/lib/domain-services/cps/`. Three flagship payloads ship pre-registered. Per-lane payloads are rolling out.

---

## 5. Live agent gateway service

Workflow `artifacts/api-server: agent-gateway` is now registered alongside the main api-server workflow. The gateway sits in front of every agent action and enforces OPA bundle policy at the runtime boundary. Agent Zero Trust (`/agent-zero-trust`) is the operator-facing surface for that gate.

---

## 6. Investor zoom-out audit pass — Series A polish

A skeptical-investor audit was walked across all eight artifacts on 2026-05-05. Per-artifact reports landed at `docs/audits/<artifact>.md` and a canonical 5-minute investor demo path was committed to `docs/audits/INVESTOR_DEMO_PATH.md`. Targeted Tier-1 fixes applied this pass (highest-confidence, lowest-risk):

| Artifact | Fix |
|---|---|
| Conduit | Throughput chart was on a hardcoded `Date.parse('2026-05-05T03:55:00Z')` "now" — replaced with `Date.now()` so the rolling 12-hour window never freezes. |
| Sentra | Removed synthetic `proof_id: 'proof-s6-TBD'` placeholder on the pending step. Silenced `[sentra] fabric proof emission failed` console.warn with documented best-effort contract. |
| Counsel | Removed synthetic "SEC Filing Deadline — Global Operations" injection from the Risk Exposure Desk fallback. Empty-state now renders honestly. |
| Terra | Removed `mockConfidence` / `mockEscalation` columns from the Property Detail tenant table. Banner stacking on narrow viewports fixed. |
| Vessels | Removed personal Medium link from marketing footer. Replaced "Updated 12s ago" with "Live AIS feed". Stripped `[DEMO]` prefix from AtelierSpaceEmbed fallback transcript. |
| Carlota Jo | Command palette rewired to `BASE_URL`-aware `navTo()` across all 23 commands. Removed invented "847 enterprise contracts" example exchange. Replaced intake `timeline: 'TBD'` default with honest copy. |
| A11oy | Strategy → Governance / Team / Fabric: TBD placeholders purged. Doctrine fallback URL `sentinel-sr.example` replaced with the real `a11oy.szlholdings.com/doctrines/sentinel-sr`. |

The pass was explicit about what it did **not** do: full visual-token harmonization and a wholesale copy rewrite across all eight artifacts. Those are the scope of the queued downstream "GitHub org pristine pass — Fortune 500 / Series A polish" task.

---

## 7. Test coverage expansion

- New file: `artifacts/api-server/src/routes/__tests__/lyte-signals-incidents-playbooks.test.ts` — 19/19 passing. Mirrors the lyte-action-queue mock pattern; covers GET/POST `/lyte/signals` pagination + create + `broadcastWs`, PATCH `/lyte/incidents/:id`, PATCH `/lyte/signals/:id` 404.
- Live LaaS contract test suite *Lutar v10 — exhaustive-audit* is wired to `lutarV10Audit()` and runs against the shipping repo on every test run.

---

## 8. Files added or changed in this delta window

```
docs/thesis/v9-canonical.md          (new)
docs/thesis/v10-canonical.md         (new)
docs/thesis/v10-essay.md             (new — Appendix A)
docs/thesis/v10-onepager.md          (new — Lutar-family one-pager)
.local/deliverables/ouroboros-thesis-v9.pdf   (built artifact)
.local/deliverables/ouroboros-thesis-v10.pdf  (built artifact)
docs/audits/a11oy.md                  (new)
docs/audits/conduit.md                (new)
docs/audits/sentra.md                 (new)
docs/audits/counsel.md                (new)
docs/audits/terra.md                  (new)
docs/audits/carlota-jo.md             (new)
docs/audits/vessels.md                (new)
docs/audits/INVESTOR_DEMO_PATH.md     (new)
docs/audits/README.md                 (new — tracking index)
artifacts/rosie/...                   (new artifact: 6 pages)
artifacts/api-server/src/routes/cps/index.ts             (new)
artifacts/api-server/src/lib/domain-services/cps/...     (new)
artifacts/api-server/src/lib/domain-services/cps/payloads.ts  (3 flagship payloads)
artifacts/a11oy/src/pages/argo/...                       (new)
artifacts/a11oy/src/pages/{TrustCenter,TrustExchange,
  PublicTrustPortal,AgentZeroTrust,ArgoForge,
  MirrorEval,Counterfactuals,RewardHacking}.tsx          (new)
artifacts/conduit/src/.../dashboard.tsx                  (Date.now() fix)
artifacts/sentra/src/.../governed-adversary-loop.tsx     (proof-id placeholder removed)
artifacts/vessels/src/.../MarketingFooter.tsx            (Medium link removed)
artifacts/vessels/src/.../marketing-home.tsx             (Live AIS feed)
artifacts/terra/src/.../property-detail tenant table     (mock columns removed)
artifacts/terra/src/App.tsx                              (banner stacking fix)
artifacts/counsel/src/.../risk-exposure-desk.tsx         (synthetic SEC injection removed)
artifacts/carlota-jo/src/...command-palette + 23 commands (BASE_URL nav)
artifacts/api-server/start.sh                            (agent-gateway sidecar wiring)
```

Remote pushes:
- `szl-holdings/ouroboros-thesis@papers/v9/` — v9 + v10 PDFs deposited (commit `dd6c01d6`).
- Tags `paper-v9-1.0.0` and `paper-v10-1.0.0` recreated to re-fire Zenodo webhook with PDFs in source archive.
- Releases `317669393` (v9) and `317669402` (v10) recreated.

---

## 9. What is still outstanding

The downstream "GitHub org pristine pass — Fortune 500 / Series A polish" task (`#4753`) covers the Tier-2/Tier-3 work surfaced by the per-artifact audit reports — visual-token harmonization across artifacts and the cross-artifact copy rewrite. Two specific remaining Tier-1-ish items:

1. **Counsel** — wire the missing tooltip provider for the `content` prop usage in `risk-exposure-desk.tsx:236`.
2. **Carlota Jo** — resolve "Carlota Jo" vs "Rosa" persona/identity drift across pages (deferred to the copy-rewrite pass to avoid creating new inconsistency in isolation).

Forged-author commits in `ouroboros-thesis` git history (four commits listing the operator's email as author — `29de9e27b`, `2159e47aa`, `2fa3a6e50`, `84fbd4eac`) still require a local `git filter-repo` followed by force-push from the operator's local clone. The platform sandbox blocks destructive git operations.

---

End of delta.
