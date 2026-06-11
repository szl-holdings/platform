# FORGE WORK-ORDER — yarqa: make it real + wire it honestly (2026-06-10)

**From:** Perplexity Computer (parent) → Forge. Path: `platform/replit-sync/`.
**Repo:** `szl-holdings/yarqa` (private, Apache-2.0, clean-room). Complete: `yarqa/core.py`, 7 passing tests, synthetic example, `PROVENANCE.md`.

## What yarqa IS
Original clean-room implementation of **plug-flow compartmentalization**: reduces a CFD velocity field to a network of plug-flow compartments by region-growing velocity-aligned cells across a flow front. NumPy-only, no OpenFOAM dependency. Written from a published algorithm description — **no third-party (incl. AGPL) source copied** (see `PROVENANCE.md`).

## HARD honesty guardrails (do not violate — these protect the Series-A thesis)
1. **yarqa is NOT a locked theorem.** It is an **"engineering method (CFD)"** tier. **Never** fold it into the locked-proven count (stays **8** {F1,F4,F7,F11,F12,F18,F19,F22} @ `c7c0ba17`). Never show it with a "kernel-verified / proven" badge. Surface it as: *"engineering method (CFD) — not a locked theorem."*
2. **Do NOT route the locked-8 governance formulas "through" yarqa.** They are governance/trust theorems; yarqa models fluid flow. There is no real relationship — asserting one is a fabricated capability. Keep them fully separate.
3. **Do NOT re-implement the a11oy↔killinchu connection on yarqa.** That connection is the real signed-receipt / mesh bus (shared `szl-receipts`, Ed25519). yarqa is CFD, not a message bus. If "cleaner a11oy↔killinchu" is wanted, harden the EXISTING mesh/receipt bus in a SEPARATE work item — not via yarqa.

## TASKS
### 1. Make yarqa real (packaging + CI)
- Add the standard SZL CI: SHA-pinned actions, DCO, Conventional-Commit title lint, pytest job (the 7 tests), gitleaks, SBOM. Mirror an existing small-repo workflow set. Run `make doctrine`-style honesty check if applicable (yarqa makes no compliance/Λ claims, so it should pass trivially).
- Confirm Apache-2.0 LICENSE is detected; keep `pyproject.toml` license metadata.
- Decide public vs private with the founder (currently private). It's clean-room Apache-2.0, so public is fine if desired.

### 2. Wire into killinchu (REAL fit — flow physics)
- Add an **honest flow-field capability**: feed killinchu's maritime/wind/wake velocity fields (current sources already in `LIVE_SOURCES_VERIFIED.md` where applicable, else clearly SAMPLE/SIMULATED-labeled) into `yarqa.compartmentalize`, expose compartments via an endpoint/tab.
- Label the tab honestly: *"Flow compartments — engineering method (CFD), not a locked theorem. Effector/sim status labeled."* No fabricated data; PAUSED/503 shows real state.
- Mobile/tablet per the standing standard (bottom-sheet/drawer + FAB, 390/820 verified).

### 3. Wire into anatomy (BEST fit — viz over the existing flow model)
- Add a **flow-compartment visualization layer** over the existing circulatory/YAWAR flow bus: run yarqa on the flow field, render the compartments as a toggleable layer in the v4 dissection dock.
- Additive only (don't disturb v3/v4/deepen features, data.js source of truth). Sovereign zero-CDN. Label the layer *"yarqa flow compartments — engineering method (CFD)."*
- Verify headless desktop/390/820, 0 console errors.

### 4. a11oy — SKIP unless founder names a use
No natural fit (governed-AI decisioning ≠ CFD). Do not wire yarqa into a11oy absent a specific scenario.

## Rules
DCO + Conventional Commits + SHA-pinned actions. One branch per task. CI green for a REAL reason. Honest labels everywhere. Cite the method conceptually (reactor-engineering literature), never the AGPL codebase.

— Perplexity Computer (parent), Doctrine v11
