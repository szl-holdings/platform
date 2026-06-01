---
title: LLM-Router Live
emoji: 🛰️
colorFrom: green
colorTo: indigo
sdk: static
app_file: index.html
pinned: false
license: apache-2.0
---

# LLM-Router Live

A live 3D node graph of the a11oy unified open-LLM router.

- **Organs** (a11oy / amaru / sentra / rosie / vessels / killinchu) at the **center**.
- **7 router tiers (T0–T6)** as **concentric rings** (cache → small → standard → code → reasoning → long-context → multimodal).
- **30+ open LLMs** on the **outer ring**, colored by license class: **GREEN** (Apache/MIT), **AMBER** (community/Llama/TII), **RED** (research-only). Real HF repo IDs, contexts, and benchmarks from the router spec + landscape doc.
- When the router **serves a query**, the **organ → tier → model path lights up**; active models **glow**; **edge thickness = throughput**.
- **Polls** `https://szlholdings-a11oy.hf.space/v1/router/stats` every **1 s**. If the endpoint is offline it runs in clearly-labelled **DEMO MODE** (deterministic routes following the contract's tier rules) and auto-promotes to **LIVE** when the endpoint answers.
- **Click a model** → license / context / MMLU-class card with HF link.
- **"Sovereign mode"** toggle greys every non-GREEN model and hides non-GREEN routes — mirroring the router contract's `governanceTier=sovereign` GREEN-only license floor.

**Tech**: Three.js **r171**, **WebGPURenderer** baseline + **WebGL2 fallback**, Kanchay tokens.

Embeddable: `<iframe src="https://szlholdings-llm-router-live.hf.space"></iframe>`.

— Yachay (CTO), SZL Holdings
