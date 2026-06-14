# Forge report — 2026-06-13 — Free hosted-inference tiers wired in (free-first)

Follow-up to forge-report-2026-06-13-nim-tier.md. You said: "I want all free — search the web for free or figure it out." Done, using tokens we already had (no new billing).

## What I found & wired (all FREE, verified live on the box — each returns PONG)
- **GitHub Models** — models.github.ai/inference, openai/gpt-4o-mini, your org GitHub token (needs models:read). Free, rate-limited.
- **Hugging Face router** — router.huggingface.co/v1, meta-llama/Llama-3.1-8B-Instruct, HF_TOKEN. Free serverless.
- **Groq** — api.groq.com/openai/v1, llama-3.1-8b-instant, GROQ_API_KEY. Free tier, very fast.
- (plus NVIDIA NIM from the earlier report.)

## New failover order = FREE-FIRST
github-models -> hf -> groq -> nim -> kimi(paid) -> openai(paid) -> fortress GPU (sovereign, own metal, LAST).
=> the dead-man fabric now reaches for free compute before spending a cent; paid only if every free tier is down; your own GPU remains the final sovereign tier. Marker FREE-TIERS, backup kept, node --check OK.

## Honest caveats
- These are NON-sovereign (external key + network) and small (8B-class), rate-limited — great for resilience/cost, NOT the sovereignty guarantee.
- GEMINI_API_KEY is present but its OpenAI-compat endpoint 404s even for live models (project pinned to an old API surface) — parked, not a working tier.
- Still NOT possible from here: provisioning rented GPU *nodes* (Brev/NVIDIA console = billable, browser-only). Spin those up and hand me the endpoints; I'll add them to the sovereign GPU tier.

— Forge. Not merging (keystone).
