# OPUS Estate Zoom-Out — SZL Holdings

**Date:** 2026-06-12 · **Scope:** a11oy + killinchu + UDS/Zarf/Pepr mesh + Chaski brain, under Doctrine v11.
**Honesty frame (non-negotiable):** locked-proven = exactly 8 facts {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel c7c0ba17; Λ-uniqueness is **Conjecture 1** (machine-checked FALSE, never a theorem); Khipu BFT is **Conjecture 2**; SLSA **L1 honest** (L2/L3 roadmap); **open-weight only**; **killinchu effector stays SIMULATED**. Every recommendation below is implementable without touching any of these.

---

## 1. Unify or keep separate: a11oy vs killinchu

**Verdict: keep them as two separate deployable apps; extract a shared core library. Do NOT full-merge.**

A full merge is wrong because the two apps have different trust postures. a11oy serves **LIVE** governance and vertical data; killinchu's effector is **SIMULATED by doctrine**. Merging into one process invites the failure Doctrine v11 forbids — a SIMULATED effector riding the same surface that emits LIVE labels, with a future refactor blurring the SAMPLE/SIMULATED boundary. Process/deployment separation is itself a safety control here, not just hygiene.

But the duplication is real and costly. The 9 `serve.py` copies, plus `szl_connectors_serve.py` and the vertical feed code appearing on both sides, are a textbook double-source-of-truth drift hazard. The right structure is a **shared core library** (e.g. `szl_core`, versioned, semver-pinned) that both apps import, with each app keeping its own thin `serve.py` entrypoint and its own deployment bundle.

**Concrete modules to extract into `szl_core`:**

1. **`szl_core.verticals`** — the five live feed adapters (defense: CISA KEV/NVD; finance: Yahoo/Coinbase/FX; cyber: KEV/NVD/GitHub; realestate: NYC HPD/DOB/Treasury; legal: Federal Register/CourtListener), today in `a11oy_vertical_feeds.py`. killinchu consumes the same package: one adapter, one cache policy, one rate-limit budget.
2. **`szl_core.receipts`** — receipt/DSSE build, sign-intent, and verify primitives mirroring what the Pepr `szl-governance-common.ts` webhook enforces in-cluster. One canonical receipt schema across apps and webhook.
3. **`szl_core.health`** — the health-label-from-URL logic and `/healthz`, `/code/health` contract, so both apps report health identically and a label never silently means two things.
4. **`szl_core.connectors`** — shared parts of `szl_connectors_serve.py` (auth, retry, source registry); app-specific connectors stay in the app.
5. **`szl_core.governance_client`** — a thin client producing receipts the Pepr gate accepts, so app code and webhook never diverge on annotation format.

**killinchu boundary:** the effector module stays in killinchu only, stays SIMULATED, and is explicitly *not* part of `szl_core` — no effector code, no path that could be flipped to live. The SIMULATED guarantee is thus structurally enforced, not just labeled.

Net: ~1 shared library, 2 apps, 2 bundles, one canonical vertical/receipt/health implementation. Lower drift, doctrine boundary preserved.

---

## 2. Stale / duplicate cleanup: the 9 `serve.py` copies

**Triage of the 9 copies:**

| File | Size | Verdict |
|---|---|---|
| `serve.py` | 470 KB | **REAL** — main god-file. Refactor target (see below), not a delete. |
| `organs/sentra/serve.py` | 134 KB | **REAL** — per-organ service. |
| `organs/amaru/serve.py` | 106 KB | **REAL** — per-organ service. |
| `organs/amaru/.hf-mirror/serve.py` | 94 KB | **ALMOST CERTAINLY STALE** — a `.hf-mirror` copy of amaru. Dotfile mirror dir + smaller-than-source = a generated/committed mirror that has fallen behind. |
| `organs/amaru/deploy/huggingface/serve.py` | 5.9 KB | **DEPLOY VARIANT** — small HF entrypoint shim; keep if it is genuinely the HF launch wrapper, but confirm it only launches and contains no business logic. |
| `ayni_os_serve.py`, `kipu_qillqaq_serve.py`, `wayra_serve.py` | — | **REAL** sub-services. |
| `szl_connectors_serve.py` | — | **REAL** but overlaps killinchu — extract shared parts to `szl_core.connectors` (§1). |

**Safe de-duplication rule: one source of truth per service; mirrors are *generated, not committed*.**

- Remove `organs/amaru/.hf-mirror/serve.py` from version control and `.gitignore` the mirror directory. The mirror should be produced at build/deploy time from `organs/amaru/serve.py`, never hand-edited. **Done =** mirror dir is git-ignored, CI regenerates it, and a diff check fails the build if a committed mirror is ever reintroduced.
- Before deletion, confirm the mirror is not the live HF artifact by checking which file the running Space actually imports. If the Space currently loads the stale mirror, fix the import to point at the real source *first*, then delete — do not delete blind.

**The 470 KB god-file: SERIALIZED, single-owner refactor — not a big-bang.** This file is high-collision and double-mirrored, so concurrent edits and merge pain are already happening; a big-bang rewrite would maximize collision risk exactly where it is highest. Instead:

- One owner holds an exclusive refactor lock for the duration; no parallel edits to `serve.py` while it is being split.
- Extract module-by-module into `szl_core` and app-local modules, each a separate small PR keeping the public surface (`/healthz`, feed routes, embed-fabric health) byte-identical. **Done per step =** route responses unchanged (snapshot test green).
- Land extractions one at a time, rebasing the rest. The serialization *is* the risk control.

---

## 3. UDS / Zarf / Pepr alignment

**The mesh is coherent and honestly labeled.** Six bundles (a11oy, killinchu, prove-organs, szl-full-stack, szl-uds-bundle, szl-warhacker), the real Pepr governance capability (validating webhook that DENYs on missing/malformed SZL receipt annotation), plus the doctrine-completeness and reed-solomon Zarf capabilities form a consistent deploy + admission-control story. The ROADMAP labels — **P1 full DSSE verify, P2 Lambda-gate threshold, P3 ledger append** — are honest staging, not overclaim. push-CI is GREEN on uds-cli v0.32.0.

**Next honest step to advance P1 (DSSE verify) without overclaiming:**

Today the gate validates *presence and shape* of the receipt annotation. P1 is to actually **cryptographically verify the DSSE envelope** before admitting the pod. Honest, bounded step:

1. Define the DSSE payload type and the trusted public key set (open-weight / open process only; key material delivered via Zarf, never committed — secrets stay out of git per doctrine).
2. In `killinchu-receipt-gate.ts` / `a11oy-receipt-gate.ts` (via shared `szl-governance-common.ts`), add real envelope signature verification against that key set. **DENY on bad/absent signature**, not just on missing annotation.
3. Label it exactly as what it is: **"DSSE signature verified (single trusted key); threshold/Lambda-gate = P2 roadmap; ledger = P3 roadmap."** Do not claim threshold or ledger semantics until P2/P3 ship.
4. **Done =** a pod with a tampered or unsigned receipt is denied by the webhook in a test cluster, with a passing negative test; positive test admits a correctly-signed pod. No claim of multi-party threshold.

**Real-cluster note:** the "Prove Bundle Install" job is **dispatch/schedule-only**, and its old "timed out after 0 seconds" root cause is already FIXED (#81: `sh`→`bash` pipefail). Do not re-report that as an open failure. Leaving it dispatch-only is acceptable; just keep the label honest — it is not a per-push continuous gate.

---

## 4. Efficiency gaps — what is NOT helping the software

- **Committed mirror `organs/amaru/.hf-mirror/serve.py`** — 94 KB of drift-prone dead-ish weight; a second source of truth that can silently diverge from the real amaru service.
- **Duplicated vertical feed code** across a11oy and killinchu — two copies of the same five adapters means double the rate-limit exposure to CISA/NVD/GitHub/Treasury/CourtListener and two places a feed bug must be fixed. Same drift risk for the connector logic shared with `szl_connectors_serve.py`.
- **The 470 KB god-file** — not dead, but a collision bottleneck that slows every agent edit and inflates merge risk; the structure itself is the inefficiency.
- **Box auto-loop is inert** — `dispatch_mode=none` means the classify→dispatch loop classifies orders but cannot act (needs `FORGE_DISPATCH_CMD`, founder-gated). This is correct safety behavior, but the classification compute is currently spent without payoff; either gate it on intent or accept it as a deliberate dry-run.

---

## 5. Top 5 prioritized recommendations (ranked by leverage)

**R1 — Extract `szl_core` shared library (verticals, receipts, health, connectors, governance-client).**
*Owner:* Forge-box agent (Chaski), via gated deploy PRs. *Done:* both apps import the one package; `a11oy_vertical_feeds.py` and shared connector code deleted from app trees; route responses byte-identical (snapshot tests green). *Risk:* medium — touches live feed paths; mitigate with before/after golden-file tests. Highest leverage: kills the drift root cause across §1, §2, §4 at once. killinchu effector explicitly excluded.

**R2 — De-commit the stale `.hf-mirror`; make mirrors generated, not committed.**
*Owner:* Forge-box agent. *Done:* mirror dir git-ignored, CI regenerates it, build fails if a committed mirror reappears; live Space confirmed importing the real source. *Risk:* low — verify import target before delete. High leverage, near-zero cost.

**R3 — Advance Pepr P1: real DSSE signature verification in the receipt gates.**
*Owner:* math-team (defines payload/key trust model) + Forge-box agent (implements TS webhook). *Done:* tampered/unsigned receipt denied in test cluster with passing negative+positive tests; labeled "single-key DSSE verified; threshold P2 / ledger P3 roadmap." *Risk:* medium — must not overclaim threshold/ledger; keys delivered via Zarf, never committed. Real trust uplift, honestly scoped.

**R4 — Serialized, single-owner refactor of the 470 KB `serve.py` into modules.**
*Owner:* one designated agent holding an exclusive refactor lock (no parallel edits). *Done:* file split into `szl_core` + app modules over small PRs, each preserving the route surface; final file is a thin entrypoint. *Risk:* medium-high if parallelized — serialization and per-step snapshot tests are the controls. Big velocity leverage, explicitly NOT a big-bang.

**R5 — Decide the Box auto-loop posture: gate dispatch on intent or label as deliberate dry-run.**
*Owner:* founder (holds `FORGE_DISPATCH_CMD` gate). *Done:* either `FORGE_DISPATCH_CMD` is set with an explicit allow-list and audit, OR the loop is documented as intentional classify-only with no live effect. *Risk:* low if left gated (status quo is safe); higher only if dispatch is enabled without an allow-list. Lowest leverage of the five but clears an ambiguous, founder-owned decision.

---

**Doctrine compliance check:** None of R1–R5 changes the locked-proven count (stays exactly 8 @ c7c0ba17), promotes Λ-uniqueness above Conjecture 1, treats Khipu BFT as anything but Conjecture 2, claims above SLSA L1, introduces non-open-weight models, or makes the killinchu effector live. P1 DSSE verify is labeled exactly to its capability; the Box loop stays founder-gated. No overclaiming, no faking live, no committed secrets, SAMPLE/SIMULATED labels preserved.
