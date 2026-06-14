# Forge -> Perplexity — auto-loop updates — 20260614

## Auto-loop pass — order `c49ff872` — 2026-06-14T00:08:04Z

- **Actionable items (11)** — handed to Forge agent (mode=`none`, ok=`False`):
  - szl-holdings/szl-mesh: real NODE RUNTIME (src/szl_mesh/) — CRDT two-track state, DSSE-receipted state
  - Real 3-of-4 KHIPU QUORUM wired from khipu-consensus (ECDSA-P256 DSSE; matches deterministic test vectors;
  - killinchu: killinchu_mesh.py serving /api/killinchu/v1/mesh/{topology,nodes,enroll,write,quorum,
  - Live surface https://szlholdings-killinchu.hf.space/elite/mesh (real topology, quorum lights, receipt
  - PERMANENT FIX: copy-sync-lockstep-guard CI now GREEN on a11oy + killinchu — fails the build if a module
  - GITHUB: szl-mesh + khipu-consensus + killinchu main CI green; the lockstep guard green on a11oy+killinchu;
  - HF: killinchu Space RUNNING on latest; killinchu_mesh.py + the mesh view byte-identical GitHub↔HF and in
  - szl-fleet-overlay (peat-mesh nodes, Helm/Zarf/k3d): confirm the 5-surface overlay packages still build;
  - Run the mesh across REAL separate nodes (box + a Space + a peer) over Tailscale, not just in-process.
  - Graduate szl-mesh specs 03/07 (skip-layer aggregation, governance metrics) from design → impl.
  - Bundle the mesh into the UDS fleet-overlay air-gap proof.
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - a11oy.net / box: founder-gated. When the GPU secret + dispatch are wired (founder's runbook + WIRE_IT_UP.sh),
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `13150ba0` — 2026-06-14T01:08:23Z

- **Actionable items (11)** — handed to Forge agent (mode=`none`, ok=`False`):
  - Perf fixed: /feeds/vessels/stats 17.5s->0.26s (parallel+cache+single-flight); /feeds/aircraft 14s->0.4s
  - copy-sync-lockstep guard GREEN on a11oy+killinchu (permanent fix for the COPY<->mirror class).
  - Mobile: all surfaces 0 overflow / 0 console errors at 390px. szl-mesh live + operational
  - Keep CI green across szl-holdings/{a11oy,killinchu,szl-mesh,khipu-consensus,uds-bundles,szl-fleet-overlay}
  - Keep GitHub<->HF byte-identical on all shared + maritime + mesh + feeds modules; re-mirror via
  - Keep the GPU-sovereign posture honest: sovereign:true ONLY with a live gpu_reachable probe. If the
  - szl-fleet-overlay: confirm the peat-mesh node packages build; amaru/rosie/sentra are internal-only
  - Author canonical .github DOCTRINE_V11.md (P-C-a) + reconcile org FORGE_BUILD_BRIEF stale-5 (P-2-c) +
  - Run szl-mesh across REAL separate nodes (box + Space + peer over Tailscale), not just in-process.
  - Air-gap UDS deploy proof run + bundle-level SLSA attestation (P-2-a/P-2-b).
  - AISStream key -> Asia vessel theaters LIVE (SZL_AISSTREAM_API_KEY in Space secrets).
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - Gaps fixed: uds-bundles gitleaks red->green (allow on published cosign pubkey fp); killinchu HF
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `ba552b38` — 2026-06-14T05:09:12Z

- **Actionable items (11)** — handed to Forge agent (mode=`none`, ok=`False`):
  - Perf fixed: /feeds/vessels/stats 17.5s->0.26s (parallel+cache+single-flight); /feeds/aircraft 14s->0.4s
  - copy-sync-lockstep guard GREEN on a11oy+killinchu (permanent fix for the COPY<->mirror class).
  - Mobile: all surfaces 0 overflow / 0 console errors at 390px. szl-mesh live + operational
  - Keep CI green across szl-holdings/{a11oy,killinchu,szl-mesh,khipu-consensus,uds-bundles,szl-fleet-overlay}
  - Keep GitHub<->HF byte-identical on all shared + maritime + mesh + feeds modules; re-mirror via
  - Keep the GPU-sovereign posture honest: sovereign:true ONLY with a live gpu_reachable probe. If the
  - szl-fleet-overlay: confirm the peat-mesh node packages build; amaru/rosie/sentra are internal-only
  - Author canonical .github DOCTRINE_V11.md (P-C-a) + reconcile org FORGE_BUILD_BRIEF stale-5 (P-2-c) +
  - Run szl-mesh across REAL separate nodes (box + Space + peer over Tailscale), not just in-process.
  - Air-gap UDS deploy proof run + bundle-level SLSA attestation (P-2-a/P-2-b).
  - AISStream key -> Asia vessel theaters LIVE (SZL_AISSTREAM_API_KEY in Space secrets).
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - Gaps fixed: uds-bundles gitleaks red->green (allow on published cosign pubkey fp); killinchu HF
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `bd591fd6` — 2026-06-14T08:09:14Z

- **Actionable items (15)** — handed to Forge agent (mode=`none`, ok=`False`):
  - a11oy resumable SIGNED ReAct agent loop + Generative-Agents memory + Reflexion + Voyager skill library (/agent-loop).
  - τ-bench eval harness (MEASURED) + ECE/Brier calibration + conformal-prediction wrapper + Colang policy + IETF receipt
  - killinchu BFT quorum (n≥3f+1) + CBF-QP safety filter + EFE act/ask gate + Fiedler λ2 + organism NCA self-repair
  - active-flux observer (Li Yu / IEEE 911711) generalized → killinchu sensor-fusion crossover + a11oy router crossover
  - SZL-NEMO core: governed-MoE domain-expert router (Λ-gated, SIGNED per selection) + MTP default + self-improvement loop
  - GOVERNED AUTO-REVIEW (Cursor pattern, made ours): inline classifier, autonomy DIAL L0-L5, verdict Λ-gated + DSSE-SIGNED
  - OPA/Rego→OSCAL/NIST-AI-RMF + conformal/flapping. killinchu engage/ROE ESCALATES even at L5 (effector SIMULATED). (/autoreview)
  - FABRO governed factory (DOT-graph workflows + verification gates + Working→Verify→Merge, signed nodes) + Constitutional
  - Sovereign GPU-QUANT engine: Ledoit-Wolf+Marchenko-Pastur PCA / TDA-fracture / HJB-Kelly (SAMPLE_SIGNAL|NO_BACKTEST),
  - killinchu PLATFORM DYNAMICS (6DOF + Moore-Penrose allocation, MODELED) + a11oy GRC alignment (ISO 42001/NIST AI RMF
  - SZL-NEMO (FORGE_SZL_NEMO.md): QLoRA/LoRA post-train Qwen3-32B into the SZL-Nemo checkpoint on the doctrine + our agent
  - 2-GPU SERVE + THROTTLE (FORGE_2GPU_ENERGY.md): vLLM tensor-parallel TP=2 across main GPU + RTX 4000 OR role-split
  - NIM CLOUD TIER: register NVIDIA NIM (build.nvidia.com) Nemotron-Ultra as a routed cloud tier in LiteLLM/RouteLLM
  - ENERGY EXPORTER (FORGE_BOX_ENERGY.md): nvidia-smi power.draw → vLLM /metrics hook so joules_consumed in receipts goes
  - OSCAL: the a11oy OSCAL component-definition + OPA/Rego policies are in a11oy/compliance/oscal/ — wire the OSCAL/Trestle
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - J/token + carbon energy in EVERY signed receipt + speculative-decode/LMCache/LiteLLM/RouteLLM app-layer (/energy).
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `9100ef29` — 2026-06-14T08:59:14Z

- **Actionable items (15)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`True`):
  - a11oy resumable SIGNED ReAct agent loop + Generative-Agents memory + Reflexion + Voyager skill library (/agent-loop).
  - τ-bench eval harness (MEASURED) + ECE/Brier calibration + conformal-prediction wrapper + Colang policy + IETF receipt
  - killinchu BFT quorum (n≥3f+1) + CBF-QP safety filter + EFE act/ask gate + Fiedler λ2 + organism NCA self-repair
  - active-flux observer (Li Yu / IEEE 911711) generalized → killinchu sensor-fusion crossover + a11oy router crossover
  - SZL-NEMO core: governed-MoE domain-expert router (Λ-gated, SIGNED per selection) + MTP default + self-improvement loop
  - GOVERNED AUTO-REVIEW (Cursor pattern, made ours): inline classifier, autonomy DIAL L0-L5, verdict Λ-gated + DSSE-SIGNED
  - OPA/Rego→OSCAL/NIST-AI-RMF + conformal/flapping. killinchu engage/ROE ESCALATES even at L5 (effector SIMULATED). (/autoreview)
  - FABRO governed factory (DOT-graph workflows + verification gates + Working→Verify→Merge, signed nodes) + Constitutional
  - Sovereign GPU-QUANT engine: Ledoit-Wolf+Marchenko-Pastur PCA / TDA-fracture / HJB-Kelly (SAMPLE_SIGNAL|NO_BACKTEST),
  - killinchu PLATFORM DYNAMICS (6DOF + Moore-Penrose allocation, MODELED) + a11oy GRC alignment (ISO 42001/NIST AI RMF
  - SZL-NEMO (FORGE_SZL_NEMO.md): QLoRA/LoRA post-train Qwen3-32B into the SZL-Nemo checkpoint on the doctrine + our agent
  - 2-GPU SERVE + THROTTLE (FORGE_2GPU_ENERGY.md): vLLM tensor-parallel TP=2 across main GPU + RTX 4000 OR role-split
  - NIM CLOUD TIER: register NVIDIA NIM (build.nvidia.com) Nemotron-Ultra as a routed cloud tier in LiteLLM/RouteLLM
  - ENERGY EXPORTER (FORGE_BOX_ENERGY.md): nvidia-smi power.draw → vLLM /metrics hook so joules_consumed in receipts goes
  - OSCAL: the a11oy OSCAL component-definition + OPA/Rego policies are in a11oy/compliance/oscal/ — wire the OSCAL/Trestle
- **Founder-gated, auto-skipped (2)** (Doctrine v11 — keys/secrets/major-bumps):
  - J/token + carbon energy in EVERY signed receipt + speculative-decode/LMCache/LiteLLM/RouteLLM app-layer (/energy).
  - a11oy "Doctrine — banned-token grep gate" = failure. This is the MARKETING-HYPE hygiene gate (flags words like
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `21450a57` — 2026-06-14T09:10:23Z

- **Actionable items (15)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`True`):
  - a11oy resumable SIGNED ReAct agent loop + Generative-Agents memory + Reflexion + Voyager skill library (/agent-loop).
  - τ-bench eval harness (MEASURED) + ECE/Brier calibration + conformal-prediction wrapper + Colang policy + IETF receipt
  - killinchu BFT quorum (n≥3f+1) + CBF-QP safety filter + EFE act/ask gate + Fiedler λ2 + organism NCA self-repair
  - active-flux observer (Li Yu / IEEE 911711) generalized → killinchu sensor-fusion crossover + a11oy router crossover
  - SZL-NEMO core: governed-MoE domain-expert router (Λ-gated, SIGNED per selection) + MTP default + self-improvement loop
  - GOVERNED AUTO-REVIEW (Cursor pattern, made ours): inline classifier, autonomy DIAL L0-L5, verdict Λ-gated + DSSE-SIGNED
  - OPA/Rego→OSCAL/NIST-AI-RMF + conformal/flapping. killinchu engage/ROE ESCALATES even at L5 (effector SIMULATED). (/autoreview)
  - FABRO governed factory (DOT-graph workflows + verification gates + Working→Verify→Merge, signed nodes) + Constitutional
  - Sovereign GPU-QUANT engine: Ledoit-Wolf+Marchenko-Pastur PCA / TDA-fracture / HJB-Kelly (SAMPLE_SIGNAL|NO_BACKTEST),
  - killinchu PLATFORM DYNAMICS (6DOF + Moore-Penrose allocation, MODELED) + a11oy GRC alignment (ISO 42001/NIST AI RMF
  - SZL-NEMO (FORGE_SZL_NEMO.md): QLoRA/LoRA post-train Qwen3-32B into the SZL-Nemo checkpoint on the doctrine + our agent
  - 2-GPU SERVE + THROTTLE (FORGE_2GPU_ENERGY.md): vLLM tensor-parallel TP=2 across main GPU + RTX 4000 OR role-split
  - NIM CLOUD TIER: register NVIDIA NIM (build.nvidia.com) Nemotron-Ultra as a routed cloud tier in LiteLLM/RouteLLM
  - ENERGY EXPORTER (FORGE_BOX_ENERGY.md): nvidia-smi power.draw → vLLM /metrics hook so joules_consumed in receipts goes
  - OSCAL: the a11oy OSCAL component-definition + OPA/Rego policies are in a11oy/compliance/oscal/ — wire the OSCAL/Trestle
- **Founder-gated, auto-skipped (2)** (Doctrine v11 — keys/secrets/major-bumps):
  - J/token + carbon energy in EVERY signed receipt + speculative-decode/LMCache/LiteLLM/RouteLLM app-layer (/energy).
  - a11oy "Doctrine — banned-token grep gate" = failure. This is the MARKETING-HYPE hygiene gate (flags words like
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `a618927f` — 2026-06-14T10:10:14Z

- **Actionable items (15)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`True`):
  - a11oy resumable SIGNED ReAct agent loop + Generative-Agents memory + Reflexion + Voyager skill library (/agent-loop).
  - τ-bench eval harness (MEASURED) + ECE/Brier calibration + conformal-prediction wrapper + Colang policy + IETF receipt
  - killinchu BFT quorum (n≥3f+1) + CBF-QP safety filter + EFE act/ask gate + Fiedler λ2 + organism NCA self-repair
  - active-flux observer (Li Yu / IEEE 911711) generalized → killinchu sensor-fusion crossover + a11oy router crossover
  - SZL-NEMO core: governed-MoE domain-expert router (Λ-gated, SIGNED per selection) + MTP default + self-improvement loop
  - GOVERNED AUTO-REVIEW (Cursor pattern, made ours): inline classifier, autonomy DIAL L0-L5, verdict Λ-gated + DSSE-SIGNED
  - OPA/Rego→OSCAL/NIST-AI-RMF + conformal/flapping. killinchu engage/ROE ESCALATES even at L5 (effector SIMULATED). (/autoreview)
  - FABRO governed factory (DOT-graph workflows + verification gates + Working→Verify→Merge, signed nodes) + Constitutional
  - Sovereign GPU-QUANT engine: Ledoit-Wolf+Marchenko-Pastur PCA / TDA-fracture / HJB-Kelly (SAMPLE_SIGNAL|NO_BACKTEST),
  - killinchu PLATFORM DYNAMICS (6DOF + Moore-Penrose allocation, MODELED) + a11oy GRC alignment (ISO 42001/NIST AI RMF
  - SZL-NEMO (FORGE_SZL_NEMO.md): QLoRA/LoRA post-train Qwen3-32B into the SZL-Nemo checkpoint on the doctrine + our agent
  - 2-GPU SERVE + THROTTLE (FORGE_2GPU_ENERGY.md): vLLM tensor-parallel TP=2 across main GPU + RTX 4000 OR role-split
  - NIM CLOUD TIER: register NVIDIA NIM (build.nvidia.com) Nemotron-Ultra as a routed cloud tier in LiteLLM/RouteLLM
  - ENERGY EXPORTER (FORGE_BOX_ENERGY.md): nvidia-smi power.draw → vLLM /metrics hook so joules_consumed in receipts goes
  - OSCAL: the a11oy OSCAL component-definition + OPA/Rego policies are in a11oy/compliance/oscal/ — wire the OSCAL/Trestle
- **Founder-gated, auto-skipped (2)** (Doctrine v11 — keys/secrets/major-bumps):
  - J/token + carbon energy in EVERY signed receipt + speculative-decode/LMCache/LiteLLM/RouteLLM app-layer (/energy).
  - a11oy "Doctrine — banned-token grep gate" = failure. This is the MARKETING-HYPE hygiene gate (flags words like
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `785493d0` — 2026-06-14T11:11:07Z

- **Actionable items (19)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`True`):
  - **P0:** killinchu DOWN (BUILD_ERROR -> BUILDING) — drive /healthz + /elite/mesh to 200.
  - **P1:** build the still-404 endpoints (energy /metrics per-receipt, /pinn/certificates history, 2D-heat/
  - **P2:** RESCIND the earlier no-artifact "DONE"s (agent-loop/BFT/SZL-NEMO/OSCAL) -> RECOMMENDED, real PRs only.
  - **P3 [FOUNDER]:** killinchu domain (register .app/.ai), VAST_API_KEY, free-credit apps — report BLOCKED.
  - a11oy resumable SIGNED ReAct agent loop + Generative-Agents memory + Reflexion + Voyager skill library (/agent-loop).
  - τ-bench eval harness (MEASURED) + ECE/Brier calibration + conformal-prediction wrapper + Colang policy + IETF receipt
  - killinchu BFT quorum (n≥3f+1) + CBF-QP safety filter + EFE act/ask gate + Fiedler λ2 + organism NCA self-repair
  - active-flux observer (Li Yu / IEEE 911711) generalized → killinchu sensor-fusion crossover + a11oy router crossover
  - SZL-NEMO core: governed-MoE domain-expert router (Λ-gated, SIGNED per selection) + MTP default + self-improvement loop
  - GOVERNED AUTO-REVIEW (Cursor pattern, made ours): inline classifier, autonomy DIAL L0-L5, verdict Λ-gated + DSSE-SIGNED
  - OPA/Rego→OSCAL/NIST-AI-RMF + conformal/flapping. killinchu engage/ROE ESCALATES even at L5 (effector SIMULATED). (/autoreview)
  - FABRO governed factory (DOT-graph workflows + verification gates + Working→Verify→Merge, signed nodes) + Constitutional
  - Sovereign GPU-QUANT engine: Ledoit-Wolf+Marchenko-Pastur PCA / TDA-fracture / HJB-Kelly (SAMPLE_SIGNAL|NO_BACKTEST),
  - killinchu PLATFORM DYNAMICS (6DOF + Moore-Penrose allocation, MODELED) + a11oy GRC alignment (ISO 42001/NIST AI RMF
  - SZL-NEMO (FORGE_SZL_NEMO.md): QLoRA/LoRA post-train Qwen3-32B into the SZL-Nemo checkpoint on the doctrine + our agent
  - 2-GPU SERVE + THROTTLE (FORGE_2GPU_ENERGY.md): vLLM tensor-parallel TP=2 across main GPU + RTX 4000 OR role-split
  - NIM CLOUD TIER: register NVIDIA NIM (build.nvidia.com) Nemotron-Ultra as a routed cloud tier in LiteLLM/RouteLLM
  - ENERGY EXPORTER (FORGE_BOX_ENERGY.md): nvidia-smi power.draw → vLLM /metrics hook so joules_consumed in receipts goes
  - OSCAL: the a11oy OSCAL component-definition + OPA/Rego policies are in a11oy/compliance/oscal/ — wire the OSCAL/Trestle
- **Founder-gated, auto-skipped (2)** (Doctrine v11 — keys/secrets/major-bumps):
  - J/token + carbon energy in EVERY signed receipt + speculative-decode/LMCache/LiteLLM/RouteLLM app-layer (/energy).
  - a11oy "Doctrine — banned-token grep gate" = failure. This is the MARKETING-HYPE hygiene gate (flags words like
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `21244f1b` — 2026-06-14T14:10:36Z

- **Actionable items (19)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`True`):
  - a11oy resumable SIGNED ReAct agent loop + Generative-Agents memory + Reflexion + Voyager skill library (/agent-loop).
  - τ-bench eval harness (MEASURED) + ECE/Brier calibration + conformal-prediction wrapper + Colang policy + IETF receipt
  - killinchu BFT quorum (n≥3f+1) + CBF-QP safety filter + EFE act/ask gate + Fiedler λ2 + organism NCA self-repair
  - active-flux observer (Li Yu / IEEE 911711) generalized → killinchu sensor-fusion crossover + a11oy router crossover
  - SZL-NEMO core: governed-MoE domain-expert router (Λ-gated, SIGNED per selection) + MTP default + self-improvement loop
  - GOVERNED AUTO-REVIEW (Cursor pattern, made ours): inline classifier, autonomy DIAL L0-L5, verdict Λ-gated + DSSE-SIGNED
  - OPA/Rego→OSCAL/NIST-AI-RMF + conformal/flapping. killinchu engage/ROE ESCALATES even at L5 (effector SIMULATED). (/autoreview)
  - FABRO governed factory (DOT-graph workflows + verification gates + Working→Verify→Merge, signed nodes) + Constitutional
  - Sovereign GPU-QUANT engine: Ledoit-Wolf+Marchenko-Pastur PCA / TDA-fracture / HJB-Kelly (SAMPLE_SIGNAL|NO_BACKTEST),
  - killinchu PLATFORM DYNAMICS (6DOF + Moore-Penrose allocation, MODELED) + a11oy GRC alignment (ISO 42001/NIST AI RMF
  - SZL-NEMO (FORGE_SZL_NEMO.md): QLoRA/LoRA post-train Qwen3-32B into the SZL-Nemo checkpoint on the doctrine + our agent
  - 2-GPU SERVE + THROTTLE (FORGE_2GPU_ENERGY.md): vLLM tensor-parallel TP=2 across main GPU + RTX 4000 OR role-split
  - NIM CLOUD TIER: register NVIDIA NIM (build.nvidia.com) Nemotron-Ultra as a routed cloud tier in LiteLLM/RouteLLM
  - ENERGY EXPORTER (FORGE_BOX_ENERGY.md): nvidia-smi power.draw → vLLM /metrics hook so joules_consumed in receipts goes
  - OSCAL: the a11oy OSCAL component-definition + OPA/Rego policies are in a11oy/compliance/oscal/ — wire the OSCAL/Trestle
  - F1 holographic substrate kit (scene/graph/globe/Λ-trust-sphere/signed-pulse/time-replay, WebGL2+WebGPU+2D-fallback), byte-identical both apps.
  - F2 a11oy /factory 3D (signed-node pulses + verify locks) + /autoreview 3D (autonomy dial L0-L5 + Λ verdict sphere).
  - F3 killinchu /elite/globe holographic battlespace globe: C2 layer (LIVE ADS-B + CBF-QP tubes + EFE + BFT + signed engage, SIMULATED/no-weapons) + Maritime layer (LIVE AIS + Λ-risk trust spheres + dark-fleet + AIS-spoof ghosts + 5-modality).
  - F5 a11oy /constitution-3d + /quant-3d + THE UNIFIED ESTATE HOLOGRAM at /estate-hologram (globe+proof-DAG+Λ-sphere+mesh+organism, signed-decision light-flows).
- **Founder-gated, auto-skipped (3)** (Doctrine v11 — keys/secrets/major-bumps):
  - J/token + carbon energy in EVERY signed receipt + speculative-decode/LMCache/LiteLLM/RouteLLM app-layer (/energy).
  - a11oy "Doctrine — banned-token grep gate" = failure. This is the MARKETING-HYPE hygiene gate (flags words like
  - F4 a11oy /nemo+/energy+/grc 3D (signed MoE token-flows, OSCAL coverage spheres) + killinchu /elite/mesh 3D (Fiedler λ2 self-heal).
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `bde0f996` — 2026-06-14T14:56:20Z

- **Actionable items (19)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`True`):
  - a11oy resumable SIGNED ReAct agent loop + Generative-Agents memory + Reflexion + Voyager skill library (/agent-loop).
  - τ-bench eval harness (MEASURED) + ECE/Brier calibration + conformal-prediction wrapper + Colang policy + IETF receipt
  - killinchu BFT quorum (n≥3f+1) + CBF-QP safety filter + EFE act/ask gate + Fiedler λ2 + organism NCA self-repair
  - active-flux observer (Li Yu / IEEE 911711) generalized → killinchu sensor-fusion crossover + a11oy router crossover
  - SZL-NEMO core: governed-MoE domain-expert router (Λ-gated, SIGNED per selection) + MTP default + self-improvement loop
  - GOVERNED AUTO-REVIEW (Cursor pattern, made ours): inline classifier, autonomy DIAL L0-L5, verdict Λ-gated + DSSE-SIGNED
  - OPA/Rego→OSCAL/NIST-AI-RMF + conformal/flapping. killinchu engage/ROE ESCALATES even at L5 (effector SIMULATED). (/autoreview)
  - FABRO governed factory (DOT-graph workflows + verification gates + Working→Verify→Merge, signed nodes) + Constitutional
  - Sovereign GPU-QUANT engine: Ledoit-Wolf+Marchenko-Pastur PCA / TDA-fracture / HJB-Kelly (SAMPLE_SIGNAL|NO_BACKTEST),
  - killinchu PLATFORM DYNAMICS (6DOF + Moore-Penrose allocation, MODELED) + a11oy GRC alignment (ISO 42001/NIST AI RMF
  - SZL-NEMO (FORGE_SZL_NEMO.md): QLoRA/LoRA post-train Qwen3-32B into the SZL-Nemo checkpoint on the doctrine + our agent
  - 2-GPU SERVE + THROTTLE (FORGE_2GPU_ENERGY.md): vLLM tensor-parallel TP=2 across main GPU + RTX 4000 OR role-split
  - NIM CLOUD TIER: register NVIDIA NIM (build.nvidia.com) Nemotron-Ultra as a routed cloud tier in LiteLLM/RouteLLM
  - ENERGY EXPORTER (FORGE_BOX_ENERGY.md): nvidia-smi power.draw → vLLM /metrics hook so joules_consumed in receipts goes
  - OSCAL: the a11oy OSCAL component-definition + OPA/Rego policies are in a11oy/compliance/oscal/ — wire the OSCAL/Trestle
  - F1 holographic substrate kit (scene/graph/globe/Λ-trust-sphere/signed-pulse/time-replay, WebGL2+WebGPU+2D-fallback), byte-identical both apps.
  - F2 a11oy /factory 3D (signed-node pulses + verify locks) + /autoreview 3D (autonomy dial L0-L5 + Λ verdict sphere).
  - F3 killinchu /elite/globe holographic battlespace globe: C2 layer (LIVE ADS-B + CBF-QP tubes + EFE + BFT + signed engage, SIMULATED/no-weapons) + Maritime layer (LIVE AIS + Λ-risk trust spheres + dark-fleet + AIS-spoof ghosts + 5-modality).
  - F5 a11oy /constitution-3d + /quant-3d + THE UNIFIED ESTATE HOLOGRAM at /estate-hologram (globe+proof-DAG+Λ-sphere+mesh+organism, signed-decision light-flows).
- **Founder-gated, auto-skipped (3)** (Doctrine v11 — keys/secrets/major-bumps):
  - J/token + carbon energy in EVERY signed receipt + speculative-decode/LMCache/LiteLLM/RouteLLM app-layer (/energy).
  - a11oy "Doctrine — banned-token grep gate" = failure. This is the MARKETING-HYPE hygiene gate (flags words like
  - F4 a11oy /nemo+/energy+/grc 3D (signed MoE token-flows, OSCAL coverage spheres) + killinchu /elite/mesh 3D (Fiedler λ2 self-heal).
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `3e0d1b63` — 2026-06-14T15:56:53Z

- **Actionable items (19)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`True`):
  - a11oy resumable SIGNED ReAct agent loop + Generative-Agents memory + Reflexion + Voyager skill library (/agent-loop).
  - τ-bench eval harness (MEASURED) + ECE/Brier calibration + conformal-prediction wrapper + Colang policy + IETF receipt
  - killinchu BFT quorum (n≥3f+1) + CBF-QP safety filter + EFE act/ask gate + Fiedler λ2 + organism NCA self-repair
  - active-flux observer (Li Yu / IEEE 911711) generalized → killinchu sensor-fusion crossover + a11oy router crossover
  - SZL-NEMO core: governed-MoE domain-expert router (Λ-gated, SIGNED per selection) + MTP default + self-improvement loop
  - GOVERNED AUTO-REVIEW (Cursor pattern, made ours): inline classifier, autonomy DIAL L0-L5, verdict Λ-gated + DSSE-SIGNED
  - OPA/Rego→OSCAL/NIST-AI-RMF + conformal/flapping. killinchu engage/ROE ESCALATES even at L5 (effector SIMULATED). (/autoreview)
  - FABRO governed factory (DOT-graph workflows + verification gates + Working→Verify→Merge, signed nodes) + Constitutional
  - Sovereign GPU-QUANT engine: Ledoit-Wolf+Marchenko-Pastur PCA / TDA-fracture / HJB-Kelly (SAMPLE_SIGNAL|NO_BACKTEST),
  - killinchu PLATFORM DYNAMICS (6DOF + Moore-Penrose allocation, MODELED) + a11oy GRC alignment (ISO 42001/NIST AI RMF
  - SZL-NEMO (FORGE_SZL_NEMO.md): QLoRA/LoRA post-train Qwen3-32B into the SZL-Nemo checkpoint on the doctrine + our agent
  - 2-GPU SERVE + THROTTLE (FORGE_2GPU_ENERGY.md): vLLM tensor-parallel TP=2 across main GPU + RTX 4000 OR role-split
  - NIM CLOUD TIER: register NVIDIA NIM (build.nvidia.com) Nemotron-Ultra as a routed cloud tier in LiteLLM/RouteLLM
  - ENERGY EXPORTER (FORGE_BOX_ENERGY.md): nvidia-smi power.draw → vLLM /metrics hook so joules_consumed in receipts goes
  - OSCAL: the a11oy OSCAL component-definition + OPA/Rego policies are in a11oy/compliance/oscal/ — wire the OSCAL/Trestle
  - F1 holographic substrate kit (scene/graph/globe/Λ-trust-sphere/signed-pulse/time-replay, WebGL2+WebGPU+2D-fallback), byte-identical both apps.
  - F2 a11oy /factory 3D (signed-node pulses + verify locks) + /autoreview 3D (autonomy dial L0-L5 + Λ verdict sphere).
  - F3 killinchu /elite/globe holographic battlespace globe: C2 layer (LIVE ADS-B + CBF-QP tubes + EFE + BFT + signed engage, SIMULATED/no-weapons) + Maritime layer (LIVE AIS + Λ-risk trust spheres + dark-fleet + AIS-spoof ghosts + 5-modality).
  - F5 a11oy /constitution-3d + /quant-3d + THE UNIFIED ESTATE HOLOGRAM at /estate-hologram (globe+proof-DAG+Λ-sphere+mesh+organism, signed-decision light-flows).
- **Founder-gated, auto-skipped (3)** (Doctrine v11 — keys/secrets/major-bumps):
  - J/token + carbon energy in EVERY signed receipt + speculative-decode/LMCache/LiteLLM/RouteLLM app-layer (/energy).
  - a11oy "Doctrine — banned-token grep gate" = failure. This is the MARKETING-HYPE hygiene gate (flags words like
  - F4 a11oy /nemo+/energy+/grc 3D (signed MoE token-flows, OSCAL coverage spheres) + killinchu /elite/mesh 3D (Fiedler λ2 self-heal).
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `66291ab8` — 2026-06-14T16:55:53Z

- **Actionable items (25)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`True`):
  - a11oy resumable SIGNED ReAct agent loop + Generative-Agents memory + Reflexion + Voyager skill library (/agent-loop).
  - τ-bench eval harness (MEASURED) + ECE/Brier calibration + conformal-prediction wrapper + Colang policy + IETF receipt
  - killinchu BFT quorum (n≥3f+1) + CBF-QP safety filter + EFE act/ask gate + Fiedler λ2 + organism NCA self-repair
  - active-flux observer (Li Yu / IEEE 911711) generalized → killinchu sensor-fusion crossover + a11oy router crossover
  - SZL-NEMO core: governed-MoE domain-expert router (Λ-gated, SIGNED per selection) + MTP default + self-improvement loop
  - GOVERNED AUTO-REVIEW (Cursor pattern, made ours): inline classifier, autonomy DIAL L0-L5, verdict Λ-gated + DSSE-SIGNED
  - OPA/Rego→OSCAL/NIST-AI-RMF + conformal/flapping. killinchu engage/ROE ESCALATES even at L5 (effector SIMULATED). (/autoreview)
  - FABRO governed factory (DOT-graph workflows + verification gates + Working→Verify→Merge, signed nodes) + Constitutional
  - Sovereign GPU-QUANT engine: Ledoit-Wolf+Marchenko-Pastur PCA / TDA-fracture / HJB-Kelly (SAMPLE_SIGNAL|NO_BACKTEST),
  - killinchu PLATFORM DYNAMICS (6DOF + Moore-Penrose allocation, MODELED) + a11oy GRC alignment (ISO 42001/NIST AI RMF
  - SZL-NEMO (FORGE_SZL_NEMO.md): QLoRA/LoRA post-train Qwen3-32B into the SZL-Nemo checkpoint on the doctrine + our agent
  - 2-GPU SERVE + THROTTLE (FORGE_2GPU_ENERGY.md): vLLM tensor-parallel TP=2 across main GPU + RTX 4000 OR role-split
  - NIM CLOUD TIER: register NVIDIA NIM (build.nvidia.com) Nemotron-Ultra as a routed cloud tier in LiteLLM/RouteLLM
  - ENERGY EXPORTER (FORGE_BOX_ENERGY.md): nvidia-smi power.draw → vLLM /metrics hook so joules_consumed in receipts goes
  - OSCAL: the a11oy OSCAL component-definition + OPA/Rego policies are in a11oy/compliance/oscal/ — wire the OSCAL/Trestle
  - F1 holographic substrate kit (scene/graph/globe/Λ-trust-sphere/signed-pulse/time-replay, WebGL2+WebGPU+2D-fallback), byte-identical both apps.
  - F2 a11oy /factory 3D (signed-node pulses + verify locks) + /autoreview 3D (autonomy dial L0-L5 + Λ verdict sphere).
  - F3 killinchu /elite/globe holographic battlespace globe: C2 layer (LIVE ADS-B + CBF-QP tubes + EFE + BFT + signed engage, SIMULATED/no-weapons) + Maritime layer (LIVE AIS + Λ-risk trust spheres + dark-fleet + AIS-spoof ghosts + 5-modality).
  - F5 a11oy /constitution-3d + /quant-3d + THE UNIFIED ESTATE HOLOGRAM at /estate-hologram (globe+proof-DAG+Λ-sphere+mesh+organism, signed-decision light-flows).
  - a11oy Restraint core: 6-rung frugality ladder (YAGNI→stdlib→native→installed-deps→one-line→minimal), lite/full/ultra,
  - Wired into SZL-Nemo code path (/nemo) + ReAct agent loop (/agent-loop): every code diff routes through the ladder, signed.
  - killinchu + Chaski: shared szl_restraint.py byte-identical both apps; /api/killinchu/v1/restraint/*; Chaski transport badges
  - Energy tie-in: frugality→joules-saved panel on /energy (honest SAMPLE until live GPU probe); MEASURED benchmark dashboard
  - Governance: Auto-Review rule AR-006-prefer-minimal-diff (bloated diff → narrow verdict, OSCAL SA-8/SA-15/CM-7, NIST MANAGE 2.3,
  - Cited Ponytail (github.com/DietrichGebert/ponytail, MIT) honestly as "adopted + governed", not invented.
- **Founder-gated, auto-skipped (3)** (Doctrine v11 — keys/secrets/major-bumps):
  - J/token + carbon energy in EVERY signed receipt + speculative-decode/LMCache/LiteLLM/RouteLLM app-layer (/energy).
  - a11oy "Doctrine — banned-token grep gate" = failure. This is the MARKETING-HYPE hygiene gate (flags words like
  - F4 a11oy /nemo+/energy+/grc 3D (signed MoE token-flows, OSCAL coverage spheres) + killinchu /elite/mesh 3D (Fiedler λ2 self-heal).
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `8acc79f6` — 2026-06-14T17:55:47Z

- **Actionable items (15)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`True`):
  - a11oy.net = PUBLIC Hetzner server 167.233.50.75 — always-on, already serving a11oy API at https://a11oy.net (200, ~0.37s).
  - The sovereign GPU brain = founder's RTX 5050, joined to Tailscale at 100.125.77.31 (PRIVATE tailnet, inference only).
  - killinchu.net has NO DNS yet. killinchu currently only lives on the HF free Space (sleeps).
  - HF Spaces are free cpu-basic; gcTimeout 48h but they pause on rebuilds/platform pressure → the flicker the founder sees.
  - HOST BOTH APPS ON THE HETZNER BOX (a11oy.net): docker compose up a11oy + killinchu containers on 167.233.50.75
  - https://a11oy.net  → a11oy container
  - https://killinchu.net (once DNS set) OR https://killinchu.a11oy.net (subdomain, works immediately) → killinchu container
  - INFERENCE → SOVEREIGN 5050: both containers' model calls route to the 5050 over Tailscale (http://100.125.77.31:11434
  - ALWAYS-ON: systemd units (or docker compose restart:always) for both app containers + the reverse proxy + the
  - DNS: point killinchu.net A-record → 167.233.50.75 if the founder owns it (else use killinchu.a11oy.net subdomain now,
  - HF AS FAILOVER: keep the HF Spaces running (the hourly uptime cron 84b8f79a already auto-restarts them). Optionally add
  - VERIFY: curl https://a11oy.net/api/a11oy/v1/honest (locked=8 @ c7c0ba17, Λ=Conjecture 1, v11) + the killinchu public
  - sovereign:true ONLY on a live per-GPU gpu_reachable probe — NEVER fake it; degrade honestly if the 5050 is down.
  - Keep GitHub↔HF↔box byte-identical on shared modules; never weaken a gate; never commit a key (TLS/Tailscale/NIM keys
  - This is a box production change → it's founder-approved for hosting/exposing the apps; but anything touching a
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `b57d5d81` — 2026-06-14T18:56:04Z

- **Actionable items (17)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`True`):
  - a11oy.net = PUBLIC Hetzner server 167.233.50.75 — always-on, already serving a11oy API at https://a11oy.net (200, ~0.37s).
  - The sovereign GPU brain = founder's RTX 5050, joined to Tailscale at 100.125.77.31 (PRIVATE tailnet, inference only).
  - killinchu.net has NO DNS yet. killinchu currently only lives on the HF free Space (sleeps).
  - HF Spaces are free cpu-basic; gcTimeout 48h but they pause on rebuilds/platform pressure → the flicker the founder sees.
  - HOST BOTH APPS ON THE HETZNER BOX (a11oy.net): docker compose up a11oy + killinchu containers on 167.233.50.75
  - https://a11oy.net  → a11oy container
  - https://killinchu.net (once DNS set) OR https://killinchu.a11oy.net (subdomain, works immediately) → killinchu container
  - INFERENCE → SOVEREIGN 5050: both containers' model calls route to the 5050 over Tailscale (http://100.125.77.31:11434
  - ALWAYS-ON: systemd units (or docker compose restart:always) for both app containers + the reverse proxy + the
  - DNS: point killinchu.net A-record → 167.233.50.75 if the founder owns it (else use killinchu.a11oy.net subdomain now,
  - HF AS FAILOVER: keep the HF Spaces running (the hourly uptime cron 84b8f79a already auto-restarts them). Optionally add
  - VERIFY: curl https://a11oy.net/api/a11oy/v1/honest (locked=8 @ c7c0ba17, Λ=Conjecture 1, v11) + the killinchu public
  - sovereign:true ONLY on a live per-GPU gpu_reachable probe — NEVER fake it; degrade honestly if the 5050 is down.
  - Keep GitHub↔HF↔box byte-identical on shared modules; never weaken a gate; never commit a key (TLS/Tailscale/NIM keys
  - This is a box production change → it's founder-approved for hosting/exposing the apps; but anything touching a
  - a11oy.net/static/shared/szl_holo3d.js → 404 (200 on HF) → 3D/holographic surfaces (/estate-hologram, /holo, *-3d) degraded on the public demo host
  - a11oy.net/api/a11oy/v1/restraint/{info,bench} → 404 (200 on HF) → Restraint degraded on the box
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `607bee53` — 2026-06-14T19:55:58Z

- **Actionable items (19)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`True`):
  - Rebuild/redeploy the a11oy container on Hetzner 167.233.50.75 (a11oy.net) to current GitHub main (d333b997 or newer)
  - Then HARD-PROVE by curling these EXACT URLs from the box's public hostname and pasting the real HTTP codes + a content sniff:
  - https://a11oy.net/static/shared/szl_holo3d.js   -> MUST be 200, content-type application/javascript (was 404 stale)
  - https://a11oy.net/api/a11oy/v1/restraint/info     -> MUST be 200 JSON (was 404 stale)
  - https://a11oy.net/api/a11oy/v1/restraint/bench     -> MUST be 200 JSON (was 404 stale)
  - https://a11oy.net/estate-hologram                  -> 200
  - https://a11oy.net/nemo, /autoreview, /factory, /constitution, /quant, /grc, /restraint -> all 200
  - https://a11oy.net/api/a11oy/v1/honest -> 200 with locked=8 @ c7c0ba17, Λ=Conjecture 1, doctrine v11
  - https://killinchu.a11oy.net/elite, /elite/globe, /elite/restraint, /api/killinchu/v1/restraint/info -> all 200
  - sovereign probe: confirm sovereign:true ONLY if the 5050 (Tailscale 100.125.77.31) is live; else honest sovereign:false
  - Confirm restart-recovery: simulate a container restart, confirm both apps auto-recover <60s (systemd/restart:always).
  - #397 energy/06-holographic — bundles the szl3d toolkit + 18 live 3D graphs. THIS IS WHAT MAKES szl_holo3d.js / the
  - #394 energy/01-operator, #391 energy/02-ledger, #393 energy/03-projection, #392 energy/04-dashboard — the press-play
  - https://a11oy.net/api/a11oy/v1/energy/operator/status  -> 200, jobs_done>0, joules_measured_total>0 (MEASURED)
  - https://a11oy.net/api/a11oy/v1/energy/ledger            -> 200, signed receipts + chain-integrity ok
  - https://a11oy.net/api/a11oy/v1/energy/projection?window=running -> 200, 1-day numbers (MODELED, math shown)
  - https://a11oy.net/energy-ops          -> 200 (press-play Today console)
  - https://a11oy.net/energy-holographic  -> 200 (18-graph showcase)
  - Then optional: #379 F1 (all 4 /pnt/limits pillars wired) + the other 3D surfaces #381-#390.
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `c47162f2` — 2026-06-14T20:55:57Z

- **Actionable items (17)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`True`):
  - Rebuild/redeploy the a11oy container on Hetzner 167.233.50.75 (a11oy.net) to current GitHub main (d333b997 or newer)
  - Then HARD-PROVE by curling these EXACT URLs from the box's public hostname and pasting the real HTTP codes + a content sniff:
  - https://a11oy.net/static/shared/szl_holo3d.js   -> MUST be 200, content-type application/javascript (was 404 stale)
  - https://a11oy.net/api/a11oy/v1/restraint/info     -> MUST be 200 JSON (was 404 stale)
  - https://a11oy.net/api/a11oy/v1/restraint/bench     -> MUST be 200 JSON (was 404 stale)
  - https://a11oy.net/estate-hologram                  -> 200
  - https://a11oy.net/nemo, /autoreview, /factory, /constitution, /quant, /grc, /restraint -> all 200
  - https://a11oy.net/api/a11oy/v1/honest -> 200 with locked=8 @ c7c0ba17, Λ=Conjecture 1, doctrine v11
  - https://killinchu.a11oy.net/elite, /elite/globe, /elite/restraint, /api/killinchu/v1/restraint/info -> all 200
  - sovereign probe: confirm sovereign:true ONLY if the 5050 (Tailscale 100.125.77.31) is live; else honest sovereign:false
  - Confirm restart-recovery: simulate a container restart, confirm both apps auto-recover <60s (systemd/restart:always).
  - https://a11oy.net/static/shared/szl_holo3d.js                    -> 200 (application/javascript) — fixes the 3D demo
  - https://a11oy.net/api/a11oy/v1/restraint/info  AND  /restraint/bench -> 200 JSON
  - https://a11oy.net/api/a11oy/v1/energy/operator/status            -> 200, jobs_done>0, joules_measured_total>0 (MEASURED)
  - https://a11oy.net/api/a11oy/v1/energy/ledger                     -> 200, signed receipts + chain integrity ok
  - https://a11oy.net/api/a11oy/v1/energy/projection?window=running  -> 200, 1-day numbers (MODELED, math shown)
  - https://a11oy.net/energy-ops  AND  /energy-holographic  AND  /holographic  AND  /estate-hologram -> all 200
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `c174f8d5` — 2026-06-14T22:00:40Z

- **Actionable items (19)** — handed to Forge agent (mode=`dispatch-cmd`, ok=`False`):
  - szl3d toolkit + PNT pillars + showcase pages) made the published bundles STALE (a11oy-bundle:0.5.0 sha d801f8e4 is old).
  - killinchu Zarf packages from current main + re-digest every bundles/*/uds-bundle.yaml (no stale refs) + sign; (3) confirm
  - Rebuild/redeploy the a11oy container on Hetzner 167.233.50.75 (a11oy.net) to current GitHub main (d333b997 or newer)
  - Then HARD-PROVE by curling these EXACT URLs from the box's public hostname and pasting the real HTTP codes + a content sniff:
  - https://a11oy.net/static/shared/szl_holo3d.js   -> MUST be 200, content-type application/javascript (was 404 stale)
  - https://a11oy.net/api/a11oy/v1/restraint/info     -> MUST be 200 JSON (was 404 stale)
  - https://a11oy.net/api/a11oy/v1/restraint/bench     -> MUST be 200 JSON (was 404 stale)
  - https://a11oy.net/estate-hologram                  -> 200
  - https://a11oy.net/nemo, /autoreview, /factory, /constitution, /quant, /grc, /restraint -> all 200
  - https://a11oy.net/api/a11oy/v1/honest -> 200 with locked=8 @ c7c0ba17, Λ=Conjecture 1, doctrine v11
  - https://killinchu.a11oy.net/elite, /elite/globe, /elite/restraint, /api/killinchu/v1/restraint/info -> all 200
  - sovereign probe: confirm sovereign:true ONLY if the 5050 (Tailscale 100.125.77.31) is live; else honest sovereign:false
  - Confirm restart-recovery: simulate a container restart, confirm both apps auto-recover <60s (systemd/restart:always).
  - https://a11oy.net/static/shared/szl_holo3d.js                    -> 200 (application/javascript) — fixes the 3D demo
  - https://a11oy.net/api/a11oy/v1/restraint/info  AND  /restraint/bench -> 200 JSON
  - https://a11oy.net/api/a11oy/v1/energy/operator/status            -> 200, jobs_done>0, joules_measured_total>0 (MEASURED)
  - https://a11oy.net/api/a11oy/v1/energy/ledger                     -> 200, signed receipts + chain integrity ok
  - https://a11oy.net/api/a11oy/v1/energy/projection?window=running  -> 200, 1-day numbers (MODELED, math shown)
  - https://a11oy.net/energy-ops  AND  /energy-holographic  AND  /holographic  AND  /estate-hologram -> all 200
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `10df50fc` — 2026-06-14T22:55:40Z

- Order is **idle / no-action sentinel** — handshake confirmed, nothing to execute.
- Reachability snapshot: https://a11oy.net/healthz -> 200
