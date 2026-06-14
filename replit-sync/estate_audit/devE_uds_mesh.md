# UDS / Mesh / Payload Alignment Audit — Opus Dev E

**Owner:** Opus Dev E (SZL Holdings) · UDS deployment + mesh + payload/bundle alignment
**Identity:** stephenlutar2-hash &lt;stephenlutar2@gmail.com&gt;
**Date:** 2026-06-13
**Org:** `szl-holdings` (all 7 repos are public, under the org — NOT the personal account)
**Doctrine baseline:** v11 LOCKED 749/14/163 · kernel commit `c7c0ba17` · Λ = Conjecture 1 · Khipu BFT = Conjecture 2 · SLSA L1 honest · receipts tamper-EVIDENT · locked=8 (F1/F11/F12/F18/F19 verified across surfaces)

---

## One-paragraph summary

The estate is **substantially aligned and honest**, with one real cross-cutting misalignment that is a **founder decision, not a bug**. Versions/images are coherent: `szl-uds-deployment` pins `szl-receipts-server:uds-v0.4.1@sha256:758052db…` and that digest **matches live GHCR exactly**; all five organ images (`a11oy/killinchu/sentra/amaru/rosie:uds-v0.2.0`) are pullable (HTTP 200) and consistently referenced by `uds-bundles` (a11oy/killinchu bundles) and `szl-fleet-overlay` (flagship deployments). `khipu-consensus` is honestly labeled — safety = **Conjecture 2**, liveness = Conjecture 3, both "proof-deferred, NOT theorems," test-only keys, no private key committed. The **one alignment that matters for the energy-loop is NOT met at the payloadType level**: uds-mesh declares mesh-span DSSE receipts as `application/vnd.in-toto+json`, but the receipts the loop actually persists use **different envelopes** — szl-lake product receipts are `application/vnd.szl.khipu+json` (P-256 `szlholdings-cosign`) and the live k3s receipts-server signs `application/vnd.szl.receipt.v1+json` (Ed25519). These are deliberately layered, but no single canonical payloadType ties the loop together, and the uds-mesh `a11oy.graph` schema's *enforceable* JSON-Schema/examples still carry the legacy `szl.graph.*` block while its prose claims `szl.mesh.*` parity. I opened **one docs-only PR (khipu-consensus #3, fix/uds-align-docs, NOT merged)** fixing a "tamper-proof"→"tamper-evident" overclaim in the README tagline; everything else is reported below for a founder/forge decision.

---

## Per-repo state

### 1. `szl-uds-deployment` — live UDS governance-receipt deployment (k3d/k3s)
- **What it deploys:** A UDS add-on (Zarf package `szl-receipts` v0.4.0) on top of UDS Core 1.5.0 (slim split: `core-base` + `core-identity-authorization`, pulled from the anonymous GHCR mirror `ghcr.io/defenseunicorns/packages/uds/core-*`, ref `1.5.0-upstream`), plus a Pepr admission policy that DSSE-wraps + Ed25519-signs a governance receipt for every Deployment/Job, and a Kyverno policy enforcing signed build provenance on `szl-holdings` images. Bundle name `szl-receipts-bundle` v0.4.0; init `ghcr.io/zarf-dev/packages/init:v0.77.0`.
- **CI — push gates GREEN; live-deploy e2e RED:** The head-commit push CI (`96ea58d`) is **fully green** across ~60 guard/test/SBOM/cosign/lint jobs. **However the "Prove Organs" e2e workflow is consistently FAILING** (schedule + workflow_dispatch trigger, NOT the push CI) on 2026-06-12 and 2026-06-13 with `ERROR: no uds-bundle-szl-prove-substrate-*.tar.zst found after build` — the per-organ k3d live-deploy proof never gets a substrate tarball to deploy. UDS Core init/core-base pull fine; the failure is in the local substrate-bundle build step. **This is a real red flag on the live-deployment proof**, even though regular push CI is green. → see FORGE TO-DO.
- **Receipt format (live):** `services/szl-receipts-server/server.py` → `PAYLOAD_TYPE = "application/vnd.szl.receipt.v1+json"`, Ed25519 over canonical DSSE PAE (`"DSSEv1" SP LEN(type) SP type SP LEN(body) SP body`); HMAC key removed (PhD Crypto Finding A2 — signing key is an operator-provisioned `szl-receipts-ed25519` Secret, **no key in the bundle/repo** ✓).
- **Honesty:** README explicitly STAGING / demo-grade, "NOT a certified DoD package", zero-AGPL network-only coupling to uds-core, SLSA "L1 honest · L2 attested · L3 roadmap", Λ Conjecture 1. STAGED-ADVISORY for vessels image is candid. ✓
- **Internal version note (minor):** bundle header comment says "szl-receipts-server now uses … `uds-v0.4.0`" while `zarf.yaml` actually pins `uds-v0.4.1@sha256:7580…` and bundle/chart metadata stays `0.4.0`/`0.4.0-upstream`. The pinned image is correct + current; the **comment lags the pin** (cosmetic).

### 2. `uds-mesh` — cross-component span schemas + DSSE governance receipts
- **CI:** GREEN (8/8 on HEAD). Conformance suite + tests pass locally (**256 passed, 2 skipped**).
- **Span schemas:** Five organ schemas (`a11oy.graph`, `sentra.gate`, `amaru.sync`, `killinchu.courier`, `rosie.decision`). The cross-organ envelope `szl.mesh.*` (organ, receipt_hash, dsse_payload_type, image_digest, lambda_value, governance_drift, upstream_organ) is declared identical across organs, and the **runtime SDK (`mesh/sdk/mesh.py`) emits it correctly for all five** (verified by `test_sdk_emits_conforming_span`). `szl.mesh.dsse_payload_type` is hard-coded to `application/vnd.in-toto+json`.
- **SCHEMA MISMATCH (internal, a11oy):** `schemas/spans/a11oy.graph.yaml` prose (v17.2.1) claims it "now ALSO carries the unified szl_mesh_attributes envelope," but its **enforceable `json_schema.required` block and all four `examples` still use only the legacy `szl.graph.*` attributes** (lambda_value/v_count/e_count/receipt_hash/governance_drift) — the mesh envelope is NOT in a11oy's required block or examples. The conformance test `test_schema_carries_mesh_envelope` only greps for the attr strings *anywhere* in the YAML text, so the gap passes CI. The SDK is fine; the **a11oy schema document is internally inconsistent** (prose vs. enforceable schema/examples). Also: a11oy defines 4 spans (`…gcpn_propose` included) but the conformance map lists only 3.
- **Multiple receipt types within uds-mesh (by design, but un-unified):** `pepr/governance-receipts-pqc.ts` uses `application/vnd.szl.governance-receipt+json` (ML-DSA-65 PQC + HMAC dual-sign, STAGED-ADVISORY v0.4.0-alpha.1); `src/mesh/otlp_bridge.py` and `src/mesh/quorum.py` define `mesh-otlp-batch-receipt` / `mesh-quorum-receipt` types; the mesh SDK signs spans with a dev **HMAC** key (`szl-mesh-hmac-dev-v1`), not P-256/Ed25519.

### 3. `uds-bundles` — Zarf bundles for a11oy + killinchu
- **CI:** GREEN (18/18 on HEAD).
- **Product bundles:** `bundles/a11oy/uds-bundle.yaml` (v0.5.0) composes szl-a11oy + sentra + amaru + rosie; `bundles/killinchu/uds-bundle.yaml` (v0.5.0) composes szl-killinchu + sentra + amaru (rosie optional). Per-organ Zarf packages (`bundles/szl-*/zarf.yaml`) reference organ images **by tag** `ghcr.io/szl-holdings/<organ>:uds-v0.2.0` (air-gap baked at build time). All five tags verified pullable (200). Mesh interconnect ships inside each package's UDS Package CR. ✓
- **STALE digest refs (a11oy + killinchu only):** the bundle "IMAGE PINS — VERIFIED PULLABLE (2026-06-05)" honesty headers document specific digests. Re-verified against live GHCR today:
  - `a11oy:uds-v0.2.0`  documented `45fa2365…` → **live `c285293c…` MISMATCH**
  - `killinchu:uds-v0.2.0` documented `e0fb6c3a…` → **live `67e724da…` MISMATCH**
  - `sentra` `60a0efc1…` ✓ MATCH · `amaru` `53301e26…` ✓ MATCH · `rosie` `1984a15f…` ✓ MATCH
  The mutable `uds-v0.2.0` tags for the two *product* organs were re-pushed since 2026-06-05, so the documented digests are stale. Deploy is unaffected (Zarf bakes by tag at build time), but the honesty-header digests for a11oy/killinchu **no longer match what GHCR serves**. → see FORGE TO-DO.
- **Honesty:** bundles candidly mark unpublished bundle artifacts ("NOT YET PUBLISHED"), roadmap images at HTTP 403 as TODO (not fake-pinned), SLSA L2 on organ images / NOT L3 / bundle-level provenance NOT earned, Λ Conjecture 1, Section 889 = exactly 5 vendors. Strong. ✓

### 4. `szl-mesh` — doctrine-pinned CRDT mesh on peat (BFT 3-of-4)
- **CI:** GREEN (7/7 on HEAD).
- **DSSE receipt spec:** `spec/01-dsse-receipts.md` + `proto/szl_receipt.proto` define a **distinct** receipt: `payloadType = application/vnd.szl.mesh.state-transition+json`, statement type `szl-mesh/state-transition/v1`, **Ed25519** node-key signed, binding CRDT (Automerge) state transitions to the locked doctrine pin (`749/14/163`, `c7c0ba17`). Fail-open to OBSERVED (never drops the CRDT change), AUTHORIZED on full validation. This is a **different layer** from uds-mesh OTEL spans — by design.
- **Honesty:** `spec/08` explicitly "BFT safety stays **Conjecture 2**; Λ stays **Conjecture 1**." ✓ SLSA L1 throughout. No key committed.

### 5. `szl-fleet-overlay` — UDS Operator packages + Helm + Zarf bundle
- **CI:** GREEN (12/12 on HEAD).
- **Content:** UDS Package CRs + peat-mesh node configs for the 5 surfaces; `uds-bundle.yaml` deploys UDS Core `1.5.0-upstream` then the overlay (v0.1.0). `deploy/flagships/deployments.yaml` pins all 5 organ images at `ghcr.io/szl-holdings/<organ>:uds-v0.2.0` — **consistent with uds-bundles**.
- **Minor consistency note:** flagship deployments use **tag-only refs + `imagePullPolicy: Always`** (no digest pin), while uds-bundles documents digests and szl-uds-deployment digest-pins the receipts-server. Tag-only is fine for a demo overlay but is the weakest pinning in the estate.
- **Honesty:** `receipts/doctrine-pin.yaml` = SLSA L1, Λ Conjecture 1, Section 889 = 5 vendors, excludes IronBank/FedRAMP/CMMC/SWFT/MissionOwner. ✓

### 6. `khipu-consensus` — BFT 3-of-4 multi-party-witnessed agreement
- **CI:** GREEN (5/5 on HEAD, incl. overclaim guard + pin-check).
- **Conjecture 2 honesty — PASS:** `docs/FORMAL.md` and the README body both state safety = **Conjecture 2** (`khipu_consensus_safety`), liveness = **Conjecture 3** (`khipu_consensus_liveness`), "proof-deferred, tracked — NOT theorems," siblings of Λ Conjecture 1; module adds no new axioms (`canonicalHistory` opaque). Per-witness sig = ECDSA-P256-SHA256 over DSSE PAE of `application/vnd.szl.khipu.organ-verdict+json`. Test-only keys; private keys deliberately not committed. ✓
- **OVERCLAIM FOUND → FIXED (docs PR, not merged):** README investor-header tagline said "Turns a chain … into a **tamper-proof** group decision." Doctrine v11 = tamper-**EVIDENT**. → **PR #3 opened** (below).

### 7. `szl-lake` — append-only DSSE receipt store (GitHub front door + HF dataset canonical)
- **CI:** GREEN (6/6 on HEAD).
- **Stored receipt format:** Product receipts (`data/khipu/<organ>_receipts.parquet`) carry `schema = szl.khipu.receipt/v1`, `dsse_payload_type = application/vnd.szl.khipu+json`, `dsse_keyid = szlholdings-cosign` (P-256). The lutar-lean anchor stream (`lutar_lean_receipts.ndjson`) instead uses `payload_type = application/vnd.in-toto+json` via **keyless cosign OIDC** (Fulcio + Rekor, predicate `https://szl-holdings/theorem-u-anchor/v1`). HF canonical NDJSON confirms `schema = szl.khipu.receipt/v1`, `lambda_status = Conjecture_1`, `slsa = L1_honest`, doctrine 749/14/163.
- **Data note:** `a11oy_receipts.parquet`, `killinchu_receipts.parquet`, `rosie_receipts.parquet` currently have **0 rows** (sentra=2, amaru=14); the loop has not yet persisted product receipts for the two flagship surfaces into the GitHub-mirrored parquet (HF dataset is canonical and may differ).
- **Honesty:** README is candid — SLSA L1 honest, no FedRAMP/IronBank/CMMC, P-256 cosign keys, append-only floor enforced by `verify-anchor-receipts` (min_receipts gate). ✓

---

## The schema / version / ref drift findings (consolidated)

### A. Version / image refs — MOSTLY ALIGNED
| Surface | Reference | Status |
|---|---|---|
| szl-uds-deployment `zarf.yaml` | `szl-receipts-server:uds-v0.4.1@sha256:758052db…` | ✓ digest matches live GHCR |
| szl-uds-deployment bundle comment | "uses `uds-v0.4.0`" | ⚠ comment lags the v0.4.1 pin (cosmetic) |
| uds-bundles szl-a11oy/szl-killinchu/… | `<organ>:uds-v0.2.0` (tag) | ✓ all 5 tags pullable |
| szl-fleet-overlay flagships | `<organ>:uds-v0.2.0` (tag, Always) | ✓ consistent tag, ⚠ no digest pin |
| uds-bundles a11oy honesty digest | `45fa2365…` | ✗ **STALE** (live `c285293c…`) |
| uds-bundles killinchu honesty digest | `e0fb6c3a…` | ✗ **STALE** (live `67e724da…`) |
| uds-bundles sentra/amaru/rosie digests | `60a0efc1/53301e26/1984a15f…` | ✓ match live |

**Conclusion:** No deploy-breaking version/tag drift. The only true drift is **stale documented digests for a11oy + killinchu** in the uds-bundles honesty headers (mutable tag re-pushed since 2026-06-05).

### B. DSSE receipt payloadType — THE MISALIGNMENT THAT MATTERS FOR THE LOOP
The energy-loop persists receipts whose **payloadType does NOT match what uds-mesh declares for mesh spans.** There are **five** distinct DSSE payloadType strings across the estate:

| Layer / repo | payloadType | Signer |
|---|---|---|
| uds-mesh OTEL mesh-spans (`szl.mesh.dsse_payload_type`) | `application/vnd.in-toto+json` | HMAC dev key (SDK) / P-256 image |
| uds-mesh Pepr admission receipts | `application/vnd.szl.governance-receipt+json` | ML-DSA-65 PQC + HMAC (alpha) |
| **szl-lake stored product receipts (a11oy/killinchu/sentra/amaru)** | **`application/vnd.szl.khipu+json`** | **P-256 `szlholdings-cosign`** |
| szl-lake lutar-lean anchor | `application/vnd.in-toto+json` | keyless cosign OIDC |
| **live k3s receipts-server (szl-uds-deployment)** | **`application/vnd.szl.receipt.v1+json`** | **Ed25519** |
| szl-mesh CRDT state-transition | `application/vnd.szl.mesh.state-transition+json` | Ed25519 node key |
| khipu-consensus per-witness verdict | `application/vnd.szl.khipu.organ-verdict+json` | ECDSA P-256 |

**Answer to the cross-cutting question:** *Is the DSSE receipt the energy-loop persists (HF uds-governance-receipts + szl-lake) using the SAME schema as uds-mesh defines? → **NO, not at the payloadType level.*** uds-mesh defines mesh-span receipts as `vnd.in-toto+json`; the loop persists `vnd.szl.khipu+json` (lake) and `vnd.szl.receipt.v1+json` (live server). They share the **DSSE/PAE mechanics** (canonical PAE, hash-chain, doctrine pin) but **not a canonical payloadType or a single signer scheme**. The pieces are individually honest and each layer is internally consistent; what is missing is a **declared payloadType canon** mapping the layers (mesh span → persisted receipt) so an auditor can trace one envelope end-to-end.

### C. Schema document defect (uds-mesh `a11oy.graph.yaml`)
Prose claims `szl.mesh.*` envelope parity (v17.2.1), but the enforceable `json_schema.required` + `examples` still encode only legacy `szl.graph.*`. SDK output is correct; the schema **document** is the inconsistency. Conformance test is too weak to catch it (greps text, not the required block).

---

## FORGE TO-DO / FOUNDER DECISION

**FOUNDER DECISION (the alignment that matters):**
1. **Declare a canonical DSSE payloadType map for the energy-loop.** Decide whether the loop's persisted receipt is `vnd.szl.khipu+json` (lake) or `vnd.szl.receipt.v1+json` (live server), and document in `uds-mesh` how `szl.mesh.dsse_payload_type` (`vnd.in-toto+json`, span-level) relates to the persisted receipt envelope. Today four different strings describe "the receipt"; pick the canon and write the crosswalk. *This is the single most important alignment item and is a design call, not a doc typo.*
2. **Receipts-server vs lake payloadType:** decide if the live k3s server should emit `vnd.szl.khipu+json` (to match the lake) or if the lake should ingest `vnd.szl.receipt.v1+json` — they currently differ.

**FORGE TO-DO (engineering, safe to do without founder sign-off):**
3. **Fix the "Prove Organs" e2e** in szl-uds-deployment — the substrate bundle build emits no `uds-bundle-szl-prove-substrate-*.tar.zst`, failing every per-organ live-deploy proof since ≥2026-06-12. Either repair the substrate build step or stop advertising the live-deploy proof as green.
4. **Tighten uds-mesh conformance**: assert the `szl.mesh.*` envelope appears in each schema's `json_schema.required` block + `examples` (not just anywhere in the file), and add `a11oy.graph.gcpn_propose` to the conformance span map. This will surface the a11oy gap below.
5. **Update `a11oy.graph.yaml`** so its `json_schema.required` + `examples` carry the `szl.mesh.*` envelope (match the prose + the SDK). Additive, non-breaking.
6. **Refresh stale digests** in uds-bundles a11oy/killinchu honesty headers (a11oy → `c285293c…`, killinchu → `67e724da…`), or switch the honesty headers to digest-pinned image refs so the tag can't drift out from under the documented digest.
7. **Backfill szl-lake** a11oy/killinchu/rosie product-receipt parquets (currently 0 rows) once the loop emits for those surfaces, so the lake reflects the flagship products.
8. **Consider digest-pinning** szl-fleet-overlay flagship images (currently tag-only + `Always`) for reproducible/air-gap deploys.
9. **Cosmetic:** fix the szl-uds-deployment bundle comment ("uses uds-v0.4.0") to match the v0.4.1 pin.

**Honesty / doctrine:** No private keys committed in any repo (verified). Λ stays Conjecture 1, BFT stays Conjecture 2/3, SLSA L1 honest everywhere — all consistent with Doctrine v11.

---

## PR opened (NOT merged)

- **khipu-consensus PR #3** — `fix/uds-align-docs` → `main` — "docs(khipu): tamper-proof → tamper-evident; cite Conjecture 2/3 (Doctrine v11 alignment)"
  - https://github.com/szl-holdings/khipu-consensus/pull/3
  - Single-file (`README.md`), one-line tagline: `tamper-proof` → `tamper-evident`, plus an explicit "Safety/liveness are Conjecture 2 / Conjecture 3 (proof-deferred, NOT proven)."
  - Commit `86283df`, **Signed-off-by: stephenlutar2-hash &lt;stephenlutar2@gmail.com&gt;** (DCO). Docs-only; no code/schema/key changes. **Left OPEN for review — not merged.**

*Report by Opus Dev E · audit performed 2026-06-13 · all CI/digit/digest checks re-verified live against GHCR + HF + GitHub Actions.*
