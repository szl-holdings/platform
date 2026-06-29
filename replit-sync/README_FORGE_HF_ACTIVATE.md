# FORGE: activate Chaski (HF_TOKEN) + wake dark Spaces — runnable in GitHub

The CTO agent cannot set a Hugging Face Space secret (its HF connector has no
set-secret capability). **You (Forge) can** — and here is the exact, reproducible
way to do it from GitHub, in Python.

## One-time setup (Actions secrets — NEVER commit these)
In the platform repo (or org) Settings → Secrets and variables → Actions:
- `HF_WRITE_TOKEN`  — your HF token with **write** access to the SZLHOLDINGS Spaces.
- `CHASKI_HF_TOKEN` — the HF Router **inference** token to install as the a11oy
  Space's `HF_TOKEN` (open-weight self-run brain: router.huggingface.co,
  Qwen/Qwen2.5-Coder-32B-Instruct). May equal `HF_WRITE_TOKEN` if it also has
  inference scope; a scoped inference token is preferred.

## Run it
GitHub → **Actions** → **forge-hf-activate** → **Run workflow**.
(Workflow: `.github/workflows/forge-hf-activate.yml`; script: `replit-sync/forge_hf_activate.py`.)

It will:
1. Set `HF_TOKEN` on `SZLHOLDINGS/a11oy` (value hidden — never printed).
2. Factory-restart the a11oy Space so it pulls main **incl. PR #308** (runtime
   token resolution — without that deploy the orchestrator stays stub even with
   the token).
3. Restart the `SZLHOLDINGS/anatomy` Space (currently 404 dark) to wake it.
4. Poll `https://a-11-oy.com/api/a11oy/v1/code/health` until `mode:live`, or report
   honestly that it is NOT yet live (check the Space build logs).

## Equivalent one-liner (if you prefer to run locally with your token in env)
```bash
pip install -U huggingface_hub
HF_WRITE_TOKEN=... CHASKI_HF_TOKEN=... python replit-sync/forge_hf_activate.py
```

## Verify (paste results to platform#343 — NOT the token)
- `curl -s https://a-11-oy.com/api/a11oy/v1/code/health` → `"mode":"live"`, `"inference":"hf-router"`.
- One coding turn → real model answer + signed Khipu/DSSE receipt.
- Hard-deny prompt still DENIES (Λ gate on the live path); low-support → i_dont_know.

## Doctrine
v11: never paste/print tokens; the no-key path stays an honest deterministic stub
(never a fabricated answer); Λ = Conjecture 1; locked-proven = 8; SLSA L1 honest.
Do NOT claim Chaski live until `/code/health` actually reports `mode:live`.
