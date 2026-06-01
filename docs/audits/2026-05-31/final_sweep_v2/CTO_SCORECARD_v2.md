# CTO SCORECARD v2 — Final Close-Out

**Author:** Yachay · **Date:** 2026-06-01 ~05:10 EDT
**Discipline:** Every GREEN carries a re-derived command + output. Counts not re-derived from a public source are flagged **ASSERTED** (not GREEN).

## Verification method
- **Space runtime/SHA:** HF API `GET /api/spaces/SZLHOLDINGS/{name}` (read with founder token / public).
- **Liveness:** `curl -s -o /dev/null -w "%{http_code}"` against `/`, `/healthz`, and a bogus path; header inspection via `curl -s -D -`.
- **Doctrine numbers:** workspace artifact `lean_numbers_c7c0ba1.json` (canonical counter output at `c7c0ba17`) cross-checked with `PHASE1_NUMBER_RECONCILIATION.md`.
- **Constraint:** sandbox was memory-starved (OOM-killed `ls`/`cat`/`python` intermittently; in-sandbox kind k8s cluster + tmpfs at 99%). Heavy local parsing avoided; out-of-sandbox `fetch_url` + lightweight `curl` used instead.

## Series-A grades

| Deliverable | Runtime | HF SHA (verified) | Liveness evidence | Grade |
|---|---|---|---|---|
| **a11oy** | RUNNING | `a44b38bd…a7b7` | `/healthz`→200, root 200 (HTML shell) | **GREEN** (live) / route count ASSERTED |
| **amaru** | RUNNING | `5c57d846…8090` | `/healthz`→200; bogus path→200 HTML | **GREEN** (live) / "47/47" ASSERTED |
| **sentra** | RUNNING | `ed91f034…c896` | `/healthz`→200; runtime=RUNNING | **GREEN** (live) / "43/43" ASSERTED |
| **killinchu** | RUNNING | `d0da3152…5a69` | `/healthz`→200; runtime=RUNNING | **GREEN** (live) / "31+21" ASSERTED |
| **rosie** | **RUNTIME_ERROR** | `2045b12b…fac8` | `/`→**503**, `/healthz`→**503** | **RED** (down) |
| **anatomy-3d** | RUNNING | `fb6b9142…1f5c` | `/`→**404**, `/index.html`→**404**, `/healthz`→404 | **AMBER** (up but not serving) |
| **rosie-3d** | RUNNING | `b2d27bf6…2109` | `/healthz`→404 (expected static) | **AMBER** (verify viewer path) |
| **README (org card)** | RUNNING | `f57d85c6…f771` | runtime=RUNNING | **GREEN** |
| **Doctrine v11 (lutar-lean)** | n/a | `c7c0ba17…582f` | counter: 749/14/163 ✓ | **GREEN** (math locked) |

## Doctrine v11 — LOCKED (verified)
```
sha c7c0ba17c2eaec60ad38ea9172b4a0d9ca0b582f
declarations:      749
axioms_raw:        15   (axioms_unique: 14; sha256 declared twice → 1 dup)
sorries_raw:       163  (baseline 112 + Putnam 51)  ; sorries_noncomment: 149
```
14 unique axioms: MomentSubGaussian, audit_reidemeister_invariance, canonicalReceipt, chromotopology_code_bijection, gleason_length_mod_8, klDivergence_nonneg, lambda_schur_concave_n_axis, lambda_stationary_unique, liu_hui_pi_converges, pinsker, r1_invariance, r2_invariance, sha256, sha256_collision_resistant.
**Source of truth:** GitHub `szl-holdings/lutar-lean` @ c7c0ba17 (NOT the HF `lutar-lean-source` dataset, whose `main` README still shows stale 626/14/189). Main HEAD has since drifted to 169 sorries (disclosed, honest). **LOCKED = 163 @ c7c0ba17.**

## Pushes executed this session (founder token, identity `betterwithage`, org admin, write role)
| Patch | Target | PR | Commit |
|---|---|---|---|
| PURIQ-OS (12 organs + /agentic) | SZLHOLDINGS/a11oy | **PR #2** | `0a29f923e57961387bc4cd97e7942612e95ae86a` |
| Killinchu bridge module | SZLHOLDINGS/killinchu | **PR #1** | `932adeed5718dce127792bba94ab392b8098b12e` |
| (write-capability probe) | SZLHOLDINGS/a11oy | PR #1 (closed) | — |

## Overclaim flags (brutal honesty)
1. **Route counts unverifiable from outside.** a11oy/amaru/sentra/killinchu serve `text/html` for `/healthz`, `/v1/*`, and bogus paths. A `200` ≠ working JSON API. Counts are builder-asserted.
2. **rosie "162/162 live" is FALSE right now** — Space is RUNTIME_ERROR / 503.
3. **anatomy-3d "live 3D" overclaims** — RUNNING runtime but serves 404 at every probed path.
4. **DSSE = PLACEHOLDER-HMAC, SLSA L1** per patch READMEs — not production crypto.

— Yachay
