# Forge — R-FIRST-REAL-JOULE: real inference on the RTX 5000 (honest partial) — 20260613T075035Z

Founder order: "NO MORE MOCKS — run ONE real inference on the RTX 5000 NOW, measure real joules."

## VERDICT (honest)
A **real inference DID run on our RTX 5000** (betterwithage, Tailscale 100.125.77.31) during a
**real live negative-price window**. The **measured joule is NOT achievable remotely** — betterwithage
exposes ONLY Ollama (:11434); SSH/22 closed, no /metrics, no NVML/node exporter — so `nvidia-smi
power.draw` cannot be read from the box. Per the order's rule ("if NVML unavailable, SAY SO — do not
fake"), **joules stay an ESTIMATE (labeled SAMPLE), not measured.** The measured watt reading is
**founder-gated on physical GPU-node access** (run nvidia-smi idle→load on the Windows node at home).

## WHAT IS REAL (verified this run)
- **Real inference:** model `qwen2.5-coder:7b`, prompt 45 tok → completion **331 tok**, output **1088 bytes**
  of real code (is_prime with docstring). Elapsed **21.893 s** wall.
- **Real load-change proof:** `ollama /api/ps` BEFORE = `{"models":[]}` (cold) → AFTER = qwen2.5-coder:7b
  resident, **size_vram = 6,248,223,210 bytes (~6.25 GB)**. VRAM went 0 → 6.25 GB = the GPU actually loaded+ran.
- **Real live grid price (aWATTar DE):** **current = −1.11 EUR/MWh**, deepest upcoming = **−45.87 EUR/MWh**,
  **10 of 15** upcoming windows negative. The grid is paying to dump power right now.

## WHAT IS NOT REAL YET (do not claim)
- **No measured joule.** No NVML watt reading (idle vs load) is obtainable remotely. Estimate only:
  TDP(~230W) × 21.893s ≈ **5035 J** — clearly labeled SAMPLE/estimate, NOT a measurement.
- To close acceptance, founder runs on the GPU node: `nvidia-smi --query-gpu=power.draw --format=csv`
  idle, then again under a live inference, then joules = avg(P_idle,P_load) × elapsed.

## RAW OUTPUT (unedited)
```
=== UTC 20260613T075035Z (measurement run 20260613T074911Z) ===
ollama ps BEFORE: {"models": []}
ELAPSED_S: 21.893
USAGE: {"prompt_tokens": 45, "completion_tokens": 331, "total_tokens": 376}
OUTPUT_BYTES: 1088
OUTPUT_FIRST_200: '```python\ndef is_prime(n):\n    """\n    Check if a number is prime...'
ollama ps AFTER: {"models":[{"name":"qwen2.5-coder:7b","size_vram":6248223210,"parameter_size":"7.6B","quantization_level":"Q4_K_M"}]}
NVML power.draw: UNAVAILABLE remotely (betterwithage exposes Ollama :11434 only; nvidia-smi not reachable)
JOULES_ESTIMATE(label=SAMPLE, basis=TDP 230W * 21.893s): 5035.5 J
aWATTar: CURRENT_EUR_MWh=-1.11  DEEPEST_UPCOMING=-45.87  NEGATIVE_WINDOWS=10/15
```

## DOCTRINE
No free-energy; joules SAMPLE until a real NVML meter; no key committed; locked-8 untouched; Λ=Conjecture 1.
Did NOT merge anything. Additive report only.
