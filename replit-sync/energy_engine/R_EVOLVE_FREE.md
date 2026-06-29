# R-EVOLVE-FREE — evolve + upgrade SZL for free, LEGITIMATELY (open-weight + free credits + faster inference). DEPLOY, do NOT merge.

Founder wants to "evolve and upgrade for free, take the best of the world (incl. China/Russia), make it ours."
DOCTRINE LINE (hard): we take ONLY what is OPENLY LICENSED — no dark-web, no stolen code/data, no covert
exfiltration. Tainted inputs destroy the SLSA/DSSE provenance moat (the one thing buyers pay a premium for)
and violate consent-doctrine (same family as taking energy without consent). The legitimate path is huge and
IS "make it ours": mirror open weights to our HF org and run them sovereign on our metal. Do that.

## 1. MIRROR THE BEST OPEN WEIGHTS to SZL HF org (open-license only — verify license on each model card first)
Frontier-class, permissively licensed (research 2026): DeepSeek V4 (MIT/open-weight), Qwen 3.x coder + general
(Apache-2.0), GLM-5 (MIT), Mistral Small (Apache-2.0), Llama 4 (Llama community license — check terms),
Kimi K2.x (modified MIT — check). For EACH: confirm the license permits mirroring + commercial/sovereign use,
record the license + source commit, then mirror the GGUF/safetensors to SZLHOLDINGS HF org as an open mirror
with an honest model card citing upstream + license. NEVER relabel authorship; we mirror + run, we do not claim
to have trained them. Pull the ones that fit the RTX 5000 (32GB) — Qwen2.5/3 coder, a DeepSeek-distill, GLM —
into Ollama on betterwithage so the sovereign GPU serves them. This is taking the world's best openly + making
it sovereign. Add served_by + license fields to the turn receipt.

## 2. ENROLL FREE COMPUTE CREDITS (non-dilutive, stackable ~$500K+) — FOUNDER applies, Forge preps
These need founder identity/biz-email (no Gmail) — Forge cannot apply, but prep the application pack:
- NVIDIA Inception — FREE, no equity, no funding req, most accessible; unlocks AWS Activate up to $100K.
  Needs: incorporated co, 1+ dev, AI product, working website (a-11-oy.com / szlholdings site), business email.
- Microsoft Founders Hub — up to $150K Azure, live product + traction (apply FIRST per sequencing).
- Google Cloud for Startups — up to $350K (higher with VC backing) incl. TPU v5e.
- Hugging Face ZeroGPU / community GPU grant — free GPU for Spaces (a11oy/anatomy/yarqa qualify).
- Together AI startup accelerator ($15-50K inference credits).
FORGE: assemble replit-sync/credits_application_pack.md — the exact eligibility checklist + links + the SZL
facts each form needs (org, product URLs, founder business email, AI-product description). Founder submits.

## 3. FASTER INFERENCE FOR FREE (upgrade the stack already on the RTX)
Current: Ollama. Free speedups (research 2026): vLLM = best default (broad model support, high throughput,
OpenAI-compatible); SGLang = best for shared-prefix RAG/multi-turn/chat latency; TensorRT-LLM = max throughput
for a fixed production model (needs compile pipeline). FORGE: stand up vLLM (self-hosted, OpenAI-compatible) as
an additional sovereign backend on betterwithage alongside Ollama, behind the existing LiteLLM/router so the
fabric can route to whichever is fastest per workload. Report tok/s before/after on a real qwen2.5-coder batch.
All free, all open-source.

## 4. WIRE INTO THE FABRIC + ANATOMY LOOP
New sovereign models + vLLM backend register in /compute-pool as capabilities on rtx-betterwithage; the anatomy
SAMAY intake can soak heavier batches (bigger models) during negative-price windows -> more work_credits per
cycle, still Bekenstein/Landauer-bounded, still Ayni-balanced. The verified-compute marketplace lists the
upgraded capability (more/better models = higher $/GPU-hr) — honest ESTIMATE only, settle-to-count.

## DOCTRINE v11: ONLY openly-licensed inputs (no dark-web/stolen/covert — tainted provenance kills the moat);
open-weight only; honest model cards (mirror, never claim to have trained); no free-energy; joules SAMPLE until
NVML; sovereign only on own metal; locked=8; Lambda=Conjecture 1; NEVER commit a key/seed; do NOT merge.
FOUNDER STEPS: apply to the credit programs (Forge gives the pack). Everything else (mirror, vLLM, wire) is Forge.
This is how we evolve for free without burning the moat — take the world's best openly, run it sovereign.
