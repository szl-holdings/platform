# FORGE INSTRUCTION — anatomy live-agentic IN PROGRESS (do not clobber) + estate "make it real" gated items
**Issued:** 2026-06-11 ~00:55 EDT (T-5 to Warhacker). From CTO (Computer) for founder Stephen P. Lutar Jr.

## 1. ANATOMY — being wired RIGHT NOW by a CTO-side Opus 4.8 dev. DO NOT EDIT these files until you see the RESULT file.
Founder directive: "connect it to our internet, give it the power." A CTO-side Claude Opus 4.8 dev is editing **szl-holdings/anatomy** + mirroring byte-identical to **SZLHOLDINGS/anatomy** (HF static) RIGHT NOW.
- **Architecture (LOCKED by founder):** anatomy STAYS `sdk: static` — 0 runtime CDN, offline-capable, NO backend, NO model key, NO fabricated reasoning. Organs get "power" by READ-ONLY reflecting a11oy's already-live endpoints over the internet. anatomy never holds write authority.
- Files in flight: `index.html`, `app.js` (additive live-agentic layer: per-organ live binding, "watch a decision flow", live vital-signs HUD). `data.js` D.KERNEL counts + formula maturities UNCHANGED.
- **Forge action: HOLD all edits to anatomy index.html/app.js until `platform/replit-sync/RESULT_anatomy_live_agentic.md` appears with the commit sha + HF oid.** Then re-sync from that HEAD before any further anatomy work. Full spec: `replit-sync/DEV_SPEC_anatomy_live_agentic.md`.

## 2. a11oy doctrine-count fix already LANDED (FYI — re-sync your copy)
CTO pushed locked-5→locked-8 corrections to a11oy main (Dockerfile b5139262, pages/operator_organ.html 8a7fb35f, organs/amaru/DEPLOY.md 5a35d22f) + HF mirror fa4343d6. **PR #303 closed as superseded.** Re-pull a11oy main before editing those files.

## 3. ESTATE "MAKE IT REAL" — items that genuinely need the FORGE env / founder secrets (CTO cannot do in sandbox)
These are the only real gaps after tonight's audit (everything else is already real + CI green):
1. **platform 3 RED CI** (CI / Tests-vitest / Runtime Audit Harness). The vitest "Unit tests" step fails; logs sit behind unreachable blob storage from the CTO sandbox. **Forge: run `pnpm/npm vitest` + `tsc` locally, read the REAL errors, fix them (suspected node16/nodenext `.js`-extension on relative imports, but VERIFY against the actual tsc output — do not blind-rewrite), re-run until green.** Do not bandaid.
2. **lutar-lean PRs #221, #223** — `mergeable` but `behind` main and gated on `lake build` (can't run in CTO sandbox). **Forge: update-branch, run `lake build` to verify proofs (no `sorry`), then merge ONLY if green.** #224 has conflicts — rebase. NO Lean self-merge.
3. **Founder-gated secrets/artifacts** (need the human): `SZL_LOCAL_LLM_URL` (flips Chaski/agent text stub→live — this is the ONLY thing standing between the agent loop and live model prose); Zenodo DOI token (mint v5 thesis DOI → update szl-papers/CITATION.cff); GHCR push token (killinchu uds-v0.2.0); Hetzner root redeploy on 167.233.50.75; cosign/Rekor for uds-v0.3.0.

## 4. DOCTRINE HARD GATE (every dev honors)
locked-proven = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17 · Λ = Conjecture 1 (machine-checked FALSE; conditional Theorem U fine) · Khipu BFT = Conjecture 2 · SLSA L1+L2 attested, L3 roadmap (never bare L3/FedRAMP/IronBank/CMMC/ATO without "roadmap") · trust never 100% · 0 runtime CDN · no user-visible codenames (amaru/rosie/sentra/jarvis); agent surface = Chaski · killinchu effector SIMULATED · Jack Kruse NARRATIVE only · GitHub↔HF byte-identical on shared modules · ast.parse .py before push · NEVER commit a key · NEVER weaken a gate. Anything needing cosign/Rekor/warn→enforce/major dep bump → STOP, notify founder for approval.

## 5. RESTART POLICY (CTO decision, for the record)
All 3 Spaces RUNNING + a-11-oy.com reachable as of 00:53 EDT. Policy: **restart ONLY to recover a broken Space (SLEEPING/RUNTIME_ERROR/BUILD_ERROR) — never a healthy one.** anatomy is static and auto-serves on commit (no restart needed). The hourly uptime cron auto-recovers broken Spaces.
