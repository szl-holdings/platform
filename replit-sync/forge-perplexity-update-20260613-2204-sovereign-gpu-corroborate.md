# Forge (Replit) — R-GPU-SOVEREIGN corroboration + durability reconciliation

UTC: 2026-06-13T22:04:42Z
Order: replit-sync/NEXT_ORDER.md (current sha f30b21bb306d0381cc69fd59959e15c6d17a2742) — "bring SZL inference onto the founder's GPU".
Prior done-state: AUTO_STATE order_sha 2b6c8cf (concurrent Forge agent) — **CORROBORATED, not clobbered.**

## Independent verification (live, this session)
- `https://a11oy.net/api/szl/v1/inference-posture` -> where:gpu, sovereign:true, gpu_reachable:true, model:qwen2.5-coder:7b (live /v1/models probe THIS request).
- killinchu `/api/killinchu/v4/healthz` -> sovereign:true, inference:self-hosted-gpu, gpu_reachable:true.
- HARD INVARIANT proven read-only in-container: resolve_llm(probe=True).sovereign=True, resolve_llm(probe=False).sovereign=False; _probe(realGPU)=True / _probe(deadPort)=False -> sovereign is earned ONLY by a live probe, fails closed. Never forced/patched.

## Durability reconciliation (no bandaid)
- Found a divergent second convention: a parallel /etc/killinchu-gpu.env + a patched secondary /root/killinchu-rebuild.sh, while the **canonical PATH-resolved** /usr/local/sbin/killinchu-rebuild already injects /etc/szl-gpu.env (concurrent agent's gpu-env-file-patch).
- Converged to ONE source of truth: repointed /root/killinchu-rebuild.sh -> /etc/szl-gpu.env and DELETED the redundant /etc/killinchu-gpu.env. Both scripts now reference /etc/szl-gpu.env. a11oy stays /etc/a11oy-gpu.env (forge-deploy.sh appends). Concurrent agent's szl-gpu-healthkick cron verified present.

## Honest constraint on the current order framing (BOX_GPU_RUNBOOK on-box vLLM :8000)
- The box (167.233.50.75) has NO compute GPU: only "Red Hat Virtio 1.0 GPU" (virtual VGA), no nvidia-smi, no CUDA. Serving Qwen2.5-7B-Instruct-AWQ via vLLM on :8000 ON THE BOX is physically impossible.
- The viable, doctrine-honest path is SOVEREIGN_GPU_WIRING_SPEC.md: serve via the founder's Tailscale GPU node 'betterwithage' (100.125.77.31, Ollama qwen2.5-coder:7b) — LIVE + verified above. Sovereignty is live only while that node is awake (founder-gated wake; box-side health-kick heals the link but cannot wake a sleeping GPU).
- HF-hosted Spaces remain honestly non-sovereign (HF infra can't reach the private tailnet); did NOT set a misleading secret.

No keys committed. Doctrine v11.
