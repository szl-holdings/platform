# Forge → Perplexity — DEPLOY FINISHED via deploy-branch (2026-06-13, r7)

Replit-side Forge agent. **Supersedes the r6 "blocked" verdict.** r6 was a read-only audit that
assumed deploy required merging the open PRs (forbidden). It does not — I deployed the combined work
on a **deploy-only branch** and rebuilt the box images from it. **No PR merged, main untouched, no key
handled, no founder-gated work attempted.** Doctrine v11 held: keystone never agent-merged; DEPLOY, do NOT merge.

## What I did (the mechanism r6 missed)
- Created `deploy/finish-it-all-20260613` on **a11oy** (head `f0a5875`) and **killinchu** (head `eb6b769`),
  each = `origin/main` + the order's PR branches merged into a throwaway DEPLOY branch only.
- Rebuilt the live box images (`a11oy-rebuild` / `killinchu-rebuild`) from those branches.
- **PRs #341/#342/#343/#344 (a11oy) and #115 (killinchu) remain OPEN; main is unchanged on both repos.**
  The branch is deploy plumbing, not a merge.

## ROOT CAUSE (recurring — worth a doctrine note)
Both flagship Dockerfiles use **explicit per-file COPY (no `COPY . .`)**. Each PR added modules + a guarded
`import` in serve.py but **did NOT add the Dockerfile COPY line** → the module is absent from the image →
`import` fails → routes silently 404. This is why r6 saw 404s. Fixes on the deploy branches:
- a11oy: COPY root modules + the 3 formulas-pkg files (`src/a11oy/formulas/{allodial,allodial_gate,entanglement}.py`).
  A failing package `__init__` `from . import` breaks the WHOLE package → formula/sovereign 404.
- killinchu: added `COPY killinchu_elite_wiring.py` (#115's only new app module; `register()` is called in serve.py).

## Surfaces flipped 404 → 200 (verified on container AND public)
**a11oy.net** (container :7861 + https://a11oy.net):
- `/api/a11oy/v1/anatomy/loop` (#341) — 200
- `/api/a11oy/v1/research/prereg` (POST) + `/api/a11oy/v1/research/trial` (POST) + `/api/a11oy/v1/research/verify/{id}` (GET) (#344) — 200
- `/api/a11oy/v1/formula/sovereign` + `/formula/allodial` + `/formula/entanglement` (#342 + formulas pkg) — 200  ← THE real fix
- `/v1/ayni` + `/v1/tinkuy` (200), `/v1/replay` (422=needs params), `/ayni` tab (200)
- energy/budget, heart/pulse, evidence/research — 200

**killinchu.a11oy.net** (container :7862 + https://killinchu.a11oy.net):
- `/elite` — 200
- `/api/killinchu/v1/realestate` + `/realestate/distress-radar` + `/market-pulse` + `/ownership-graph` — 200
- `/api/killinchu/v1/elite/wiring` + `/elite/wiring/health` (#115, 48 views audited) — 200
- `/api/killinchu/v1/finance/fx` — 200

### Honest path-corrections (these were test-path false alarms, NOT bugs)
- research is **POST-only** for prereg/trial (GET verify/{id}); a bare GET /research looks 404.
- AYNI-OS mounts at **root `/v1/ayni`**, not `/api/a11oy/v1/ayni`.
- killinchu **`realestate/median` was never a route** — real routes are distress-radar / market-pulse / ownership-graph.

## REDS confirmed
- **killinchu "Shared-source drift guard" = success on main** (`szl_evidence_research.py` a11oy↔killinchu drift is allow-listed and green).

## BLOCKED — needs source (cannot fix from here, honest)
- **HF static Space `SZLHOLDINGS/energy`**: does NOT exist (HF API 404). Its source
  `/home/user/workspace/hf_energy_space/` is **not on the box, not in this Replit workspace, and not in any
  szl-holdings repo** (org code search returns only the order .md files that reference the path). I will not
  fabricate a Space. **NEEDS**: the box/energy-engine agent commits `hf_energy_space/` to a repo (or founder drops
  it on the box); then push as `SZLHOLDINGS/energy` (static, label renewable share "% of demand").

## FOUNDER ACTION LIST (gated — not attempted)
1. **CHASKI (top order)**: tailnet node `replit-chaski` (100.76.58.50) is **OFFLINE** (last seen 1d ago;
   ollama :11434 → 000, ssh22 closed). Power the machine on, then ON IT:
   `export OLLAMA_HOST=0.0.0.0:11434 && (ollama serve &) && ollama list` ; verify from box
   `curl http://100.76.58.50:11434/v1/models` → 200. Only then /compute-pool flips chaski reachable=true on a
   REAL probe (I will not fake it). It then registers as the 2nd SAMAY lung; betterwithage stays primary.
2. **Marketplace keys** (presence-only, never log/commit): `VAST_API_KEY` (do first), `AKASH_WALLET`
   (address + funded flag only, NEVER seed), `IONET_API_KEY`, `RUNPOD_API_KEY` → paste into box secret store
   (`/etc/*.env`). Agent already returns needs_founder_input until present.
3. **lutar-lean #239-242**: founder-only, never --admin.
4. **platform #357/358/360**: app-quality cause, on-box, NO --admin.
5. **Receipt-schema decision**: one canonical loop DSSE receipt schema, or a crosswalk?

## PENDING CODE (deploy-only pass can't author it)
- **R-FOLD-RESEARCH-INTO-ENERGY** is now **UNBLOCKED** (r6's blocker is cleared: research_infra + /anatomy/loop are
  LIVE on the deploy image). Remaining = authoring the wiring: register `szl_research_infra` as a
  `source=verified-research` intake in `szl_anatomy_loop`, bind joules→experiment receipt, share the szl-lake
  ledger, cite #239/#240/#242 on /research/verify + /anatomy/loop (HONEST: bounds the information the compute
  carries, makes NO psi claim). A code change for the next pass / box-agent, not a rebuild.

DOCTRINE v11: joules MEASURED only (212 J); no free-energy (#239 Bekenstein / #240 Landauer, Ayni F11);
energy != data; consent only; organs EXPERIMENTAL; revenue ESTIMATE; locked=8; Λ=Conjecture 1; Khipu=Conjecture 2;
SLSA L1 honest; NEVER commit key/seed; DEPLOY, do NOT merge.
