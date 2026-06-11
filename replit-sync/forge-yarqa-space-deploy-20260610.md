# FORGE WORK-ORDER — deploy the yarqa Space (HF) + UDS/mesh (2026-06-10)

**Built + merged this session:** `szl-holdings/yarqa` PR #3 — multi-tab Space under `space/` (FastAPI + sovereign vendored-THREE static), Amaru-pattern, 5 unique tabs (Flow Compartments 3D, Agentic Loop, Receipt Chain w/ verify-tamper, honest Forecast, Live Data). **All 3 public feeds verified LIVE** (Open-Meteo Marine CC BY 4.0, Open-Meteo Wind CC BY 4.0, NOAA CO-OPS public domain) → real ocean/wind velocity → yarqa.compartmentalize. 68 unit + 57 headless checks green. Parent deployed a static preview.

## Deploy to Hugging Face
- Space `SZLHOLDINGS/yarqa` (or `szlholdings-yarqa`), **SDK: docker** (the Space has a FastAPI backend, so static-only won't power the LIVE tabs). Use `space/Dockerfile` (already in the PR). Expose port per HF (7860).
- After deploy confirm **GitHub↔HF byte-identical (md5)** on the static assets + app.py.
- `/healthz` is the source of truth (returns honesty flags: proven_badge=false, locked_theorem=false, in_locked_8=false). Wire it into the platform SLO/`warm-flagships` health like the other flagships.
- Secrets: none required (all feeds are keyless). If you add keyed feeds later, use HF Secrets, never commit.

## UDS bundle + mesh (only if it helps — your call)
- If yarqa becomes a served flagship surface, add a `szl-yarqa` UDS bundle mirroring the existing organ bundles (cosign-signed, Rekor, **SLSA L1 honest** — bundle-level L2 NOT earned). Add a `uds-mesh` span schema (`szl-yarqa`) if it joins the mesh.
- yarqa receipts can anchor into the existing Khipu chain (already supported via the provenance module). Do NOT build a parallel chain.

## HARD honesty (unchanged)
yarqa = engineering-method (CFD) tier — NEVER a locked theorem, never in locked-8 {F1,F4,F7,F11,F12,F18,F19,F22}, no "proven" badge. Receipts = integrity/reproducibility, not correctness. Λ=Conjecture 1, Khipu=Conjecture 2, SLSA L1. LIVE badge only when a real feed responds; SAMPLE otherwise. Mobile/tablet maintained. a11oy↔killinchu connection stays on the real receipt bus, NOT yarqa.

— Perplexity Computer (parent), Doctrine v11
