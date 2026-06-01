# FLAGSHIP GAP REPORT — "Am I missing anything for any of the flagships?"
**Founder directive (2026-06-01 ~02:12 EDT):** *"Am I missing anything for any of the flagships? Zoom out."*
**Auditor:** Yachay. Read-only. NO BANDAID. Brutal honesty.
**Scope:** a11oy · amaru · sentra · killinchu · rosie · anatomy-3d · rosie-3d · README org card.
**LOCKED numbers preserved:** 749/14/163 · 13-axis · replay `bacf5443…631fc5` · A2=`IsHomogeneous` · A4=`IsBounded` · SLSA L1 · Λ-uniqueness Conjecture 1 (`puriq/doctrine/PURIQ_DOCTRINE_v12.md:172,84,85`).

For each flagship: **What's LIVE** · **Promised-not-live** · **Structurally missing** · **Customer-facing gaps** · **Investor-facing gaps** · **Compliance gaps**.

---

## A. a11oy — `https://szlholdings-a11oy.hf.space`
- **LIVE:** GREEN, 40/40 routes, gates=46. HEAD `a93ca1bf` added `/v1/mcp`, `/v1/lambda`, `/v1/verify`, `/v1/ledger`, `/v1/governed-loop` (earlier SHA `6ba1a2f0`). De-facto **brand-orchestration front** (`240_`, `42_OPUS_A11OY_FULL_SHIP.md`).
- **PROMISED-NOT-LIVE:** Sigstore signing on the `/v1/ledger` chain — `/v1/verify` checks the **hash chain, not the signature** (DSSE PLACEHOLDER, `PURIQ_DOCTRINE_v12.md:101–102`). `knowledge.json` still cites stale Lean path `Lutar/Gate/BekensteinBound.lean` (should be `Lutar/DPI/TH6_DPI_Soundness.lean`, `110_:127`).
- **STRUCTURALLY MISSING:** No Wire D live (a11oy→policy wire, `110_:29`). No rate-limiting/CORS on the Space (`240_`). No SSO. The 12-role OIDC/PKCE access-control exists in monorepo but is **not exercised live** (`240_`).
- **CUSTOMER-FACING:** No onboarding/first-run; lands straight into SPA. "46 gates" shown but no buyer-runnable "trip a gate" demo.
- **INVESTOR-FACING:** Brand-orchestration claim has **no brand organ behind it** (see ANATOMY §4). a11oy is the strongest demo but the "verified" badge needs the 163-sorry honest scope visible, not "zero sorry."
- **COMPLIANCE:** No SOC2/FedRAMP path; EU AI Act (CELEX 32024R1689) / NIST AI RMF cited but never audited (`240_`). No threat model.

## B. amaru — `https://szlholdings-amaru.hf.space`
- **LIVE:** GREEN, 47/47 routes, brainz card shows **749/14/163**. SPA SHA `19b047b2`; Wire G fix `e5000a8a` (`420_AMARU_VERBATIM_REPLIT_REBUILD.md`).
- **PROMISED-NOT-LIVE:** Drift factor `R(a)=e^{-γ·KL}` is doctrine'd but not fed by live KL telemetry. Brainz numbers are a **static string**, not a recomputed `#print axioms` artifact.
- **STRUCTURALLY MISSING:** UNAY cross-session store (amaru is the cortex but has no memory primitive, ANATOMY §2). No live OTel tracing despite being the reasoning organ.
- **CUSTOMER-FACING:** 7-chakra brain UI is impressive but un-narrated for a non-technical buyer; no "what do I do here" path.
- **INVESTOR-FACING:** The 749/14/163 must be presented as *honest* counts (163 tracked sorries is a feature of rigor) — if a competitor diffs the repo, the live string must match HEAD.
- **COMPLIANCE:** Same empire gaps (no SOC2, no threat model, no privacy data-flow doc for the chakra kernels).

## C. sentra — `https://szlholdings-sentra.hf.space`
- **LIVE:** GREEN, 43/43 routes, 8 gates. SPA SHA `4498cc6b` (`421_SENTRA_VERBATIM_REPLIT_REBUILD.md`). Immune/inspect organ (Wire B receiver).
- **PROMISED-NOT-LIVE:** `sentra hf-sync` CI workflow **broken** (one of 5 critical broken workflows, `240_`). `sentra container-build` broken (`240_`).
- **STRUCTURALLY MISSING:** No live SLA/latency metric surface for the immune path; no Prometheus. Wire C (sentra↔rosie events) still in flight.
- **CUSTOMER-FACING:** "8 gates" vs a11oy "46 gates" — inconsistent gate-count vocabulary across flagships confuses buyers (which is canonical?).
- **INVESTOR-FACING:** Immune/oversight is the **Cannonico (drone AI-oversight) + Scott Thompson (ATO body-of-evidence) Warhacker wedge** — but sentra's broken CI undercuts the "build-package-deploy" DU story.
- **COMPLIANCE:** Inspect/verdict path is the natural home for the "non-refutable Body of Evidence" (Warhacker P6) but emits PLACEHOLDER signatures only.

## D. killinchu — NOT DEPLOYED (503 / RED)
- **LIVE:** **Nothing.** Architecture spec only: `killinchu/architecture/KILLINCHU_FULL_STACK_ARCHITECTURE.md`. GitHub repo created (org now 23 repos). The **12th organ (geofence `G(a)`) has no live artifact.**
- **PROMISED-NOT-LIVE:** Everything. This is the embodied/drone-oversight flagship and the direct answer to Warhacker P1 (Cannonico, AI oversight for autonomous drones) — and it is **not shipped**.
- **STRUCTURALLY MISSING:** No HF Space, no health route, no geofence demo. Open doctrine question unresolved: hard `{0,1}` vs soft `exp(-β·dist_to_boundary)` geofence and whether the soft form satisfies INV-4 finiteness (PONDER.md).
- **CUSTOMER/INVESTOR-FACING:** This is the **single biggest flagship gap vs the Warhacker (June 16, San Diego) opportunity** — the drone-oversight lane is exactly Cannonico's, and SZL has only a spec. Vessels is being **pivoted to killinchu** (`240_`), so killinchu inherits vessels' urgency.
- **COMPLIANCE:** A drone-oversight product with no deployment cannot claim any ATO/IL2-6 path.

## E. rosie — `https://szlholdings-rosie.hf.space`
- **LIVE:** GREEN, **11 tabs, 162/162 endpoints**. SHA `304b9e08`; 3D update `584b3bc5`. Widget v2.0 "Wasichaq-III" (34137 bytes) (`93_OPUS_ROSIE_FULL_SHIP.md`, `411_…`).
- **PROMISED-NOT-LIVE:** The **"Unay" tab is live but has no cross-session memory store behind it** (ANATOMY §2) — the most concrete customer-facing over-claim in the empire.
- **STRUCTURALLY MISSING:** No backing store for Unay; Wire C receiver in flight; no OTel.
- **CUSTOMER-FACING:** 11 tabs is a lot of surface with uneven depth; the empty Unay tab will be the first thing a curious customer clicks.
- **INVESTOR-FACING:** "162/162 endpoints" is a strong number but endpoint-count ≠ feature-depth; pair it with the live-organ proof, not raw counts.
- **COMPLIANCE:** Same empire gaps.

## F. anatomy-3d — `https://szlholdings-anatomy-3d.static.hf.space`
- **LIVE:** GREEN, SHA `8c30023f`. **4 wires live, 3 dashed (D, G, H)** (`411_3D_ANATOMY_V2_PLUS_ROSIE_3D.md`).
- **PROMISED-NOT-LIVE:** Wires D/G/H rendered dashed = "promised, not wired." This is the **most investor-legible artifact** and it visibly shows 3 incomplete wires — honest, but it means the interconnect story is literally drawn as incomplete.
- **STRUCTURALLY MISSING:** No UNAY organ node (or it's shown without backing); no CHASKI/WALLPA/WASI-RIKUQ nodes (the missing organs aren't even on the map).
- **CUSTOMER/INVESTOR-FACING:** Best single visual; should become the entry to `/dashboard/everything` (ANATOMY §7). Today it's a static diagram, not a live status board.
- **COMPLIANCE:** N/A (static viz) — but it should not imply organs are live that are 503 (killinchu).

## G. rosie-3d — `https://szlholdings-rosie-3d.static.hf.space`
- **LIVE:** GREEN, SHA `cc11413d`.
- **PROMISED-NOT-LIVE:** It's a 3D companion viz; depth of interactivity vs anatomy-3d unclear from ship notes.
- **STRUCTURALLY MISSING:** Same as anatomy-3d (no missing-organ nodes).
- **CUSTOMER/INVESTOR-FACING:** Nice-to-have; lowest priority of the live Spaces.
- **COMPLIANCE:** N/A.

## H. README org card (`SZLHOLDINGS` org, user `betterwithage`)
- **LIVE:** Org with 23 repos; Series-A polish work (`520_GITHUB_SERIES_A_POLISH.md`).
- **PROMISED-NOT-LIVE:** Unified docs site (UDS docs in flight, `530_ENV_PLAN_AND_UDS_DOCS.md`). **5 of 6 UDS bundles UNSIGNED** (only vessels cosign-verified, Rekor `1675423172`, `240_`).
- **STRUCTURALLY MISSING:** **13 broken CI workflows across 8 repos** (5 critical: a11oy/sentra container-build, sentra hf-sync, vessels/agi-forecast tests) (`240_`). No org-level SECURITY.md threat model, no pricing/commercial entity, no SSO.
- **CUSTOMER-FACING:** No single "start here" — a visitor sees 23 repos with no narrative front door (reception gap, CHASKI).
- **INVESTOR-FACING:** All deploys are `HfApi.create_commit` **DIRECT** (never via GitHub Actions, `240_`) — so green HF Spaces coexist with red CI badges; an investor doing diligence sees broken CI. Must either fix CI or document the direct-deploy model openly.
- **COMPLIANCE:** No legal-entity hygiene doc; ORCID `0009-0001-0110-4173` present but no corporate compliance cert path. **NOTE:** task referenced a `corporate_hygiene_checklist.md` — **it does NOT exist in the workspace** (reporting honestly; do not assume it does).

---

## OVER-CLAIMS LEDGER (flagship-surfaced, EXTENDS 110_:122–128)
| # | Where | Claim | Reality | Sev |
|---|---|---|---|---|
| OC-1 | Any UI still reading "zero sorry"/"6 sorries" | sorry-free / 6 sorries | **163 tracked sorries** LOCKED (`PURIQ_DOCTRINE_v12.md:172`) | HIGH |
| OC-2 | rosie "Unay" tab | implies cross-session memory | **no backing store** | HIGH (customer-facing) |
| OC-3 | a11oy `knowledge.json` | `Lutar/Gate/BekensteinBound.lean` | stale; real path `Lutar/DPI/TH6_DPI_Soundness.lean` | LOW |
| OC-4 | "Λ uniqueness" if stated as theorem | proven-unique spine | **Conjecture 1** (LOCKED); `Uniqueness.lean:120` sorry | MEDIUM |
| OC-5 | Any "signed receipt" / "Sigstore" claim | cryptographically signed | **DSSE/Sigstore PLACEHOLDER, 0 real**; Cardano local hash-chain only | HIGH |
| OC-6 | killinchu in any deck as "flagship" | shipped | **503/RED, spec only** | HIGH (vs Warhacker) |
| OC-7 | anatomy-3d as "fully wired" | all wires live | **3 of 7 dashed (D/G/H)** | MEDIUM (self-disclosed) |

---

## FLAGSHIP COMPLETENESS — one-line verdicts
- **a11oy:** Live & strong; needs real signatures + a real brand organ behind the "orchestration" claim.
- **amaru:** Live & strong; needs UNAY + live drift telemetry, not a static numbers card.
- **sentra:** Live but **CI is broken** — fix before it's the Warhacker oversight demo.
- **killinchu:** **NOT a flagship yet — it's a spec.** Biggest gap vs June 16.
- **rosie:** Live & broad; **empty Unay tab is the #1 customer-facing over-claim.**
- **anatomy-3d:** Best viz; turn it into the live `/dashboard/everything` front; add missing-organ nodes.
- **rosie-3d:** Fine; lowest priority.
- **org card:** Green Spaces vs **13 red CI workflows + 5/6 unsigned UDS bundles** — diligence risk.

---
*— Yachay, Flagship Gap Report, 2026-06-01. Read-only; no repos modified.*
