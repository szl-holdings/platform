# R-GPU-LIST-LIVE — Forge: stand up GPU monetization END-TO-END (do it all). DEPLOY, do NOT merge.

Founder: "have Forge do it all." Goal: get the RTX 5000's wasted-window capacity LISTED and EARNING on a
GPU marketplace, energy-gated, with verified-compute receipts. Founder only does the account+payout (KYC).
Everything technical is yours. Founder's box (replit task host) is WINDOWS running Docker Desktop v4.76
(WSL2) with k3s/k3d (rancher/k3s + k3d-io) ALREADY UP. GPU node betterwithage = separate, Tailscale
100.125.77.31, Windows, only Ollama :11434 reachable from the app box. Resolve the GPU location first.

## STEP 0 — DETECT where the GPU actually is (do this first, paste raw output)
Run on whatever host can reach the GPU:
  docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi
- If it PRINTS the RTX 5000 here → the GPU is container-visible on this host; go STEP 1A (Vast or Akash).
- If it ERRORS (no --gpus / driver) → the GPU is the separate betterwithage Windows node. Then either
  (a) enable WSL2 GPU passthrough on betterwithage (NVIDIA Windows driver + WSL2 + nvidia-container-toolkit
  inside the WSL distro) and re-run the test there, OR (b) list via a path that tolerates the current setup.
Report which case is true with the raw nvidia-smi/container output to replit-sync.

## STEP 1A — Vast.ai host (preferred if a Linux/WSL2 container sees the GPU)
1. Founder action (ONLY this): create Vast.ai HOST account at https://vast.ai/host (email-only start) +
   connect a payout method (Wise/PayPal/Stripe for USD, or crypto). Forge cannot do KYC/payout — request it
   in the report with the exact link. NEVER commit any Vast API key; founder pastes it to YOUR secret store.
2. Forge: install the Vast host agent (one-line Linux installer) on the GPU host, register the RTX 5000,
   set a sane $/GPU-hr (anchor $0.20-0.45 consumer tier; check live market rate first), enable the listing.
3. Confirm the machine appears as "verified/online" in the host dashboard; paste the listing + machine id.

## STEP 1B — Akash GPU provider (preferred if Vast can't see the GPU but k3s is up — it IS, on this box)
The box already runs k3s/k3d. Akash is Kubernetes-native — ride the existing cluster instead of reformatting.
1. Founder action (ONLY this): fund an Akash provider wallet with ~5+ AKT for bid escrow/gas (small),
   choose payout in ACT/USDC. Request it in the report. NEVER commit the wallet seed; founder holds it.
2. Forge: install the Akash provider services onto the k3s cluster (provider-services + GPU node feature
   discovery + nvidia device plugin), publish the provider with the RTX 5000 advertised, set pricing, bid on
   GPU leases. Confirm the provider is on-chain and biddable; paste provider address + first bid.

## STEP 2 — ENERGY-GATE the listing (doctrine margin)
Wire the marketplace agent (apps/agentic-gpu/compute_marketplace_agent.py from R-MONEY-NOW) to the live
posture (aWATTar/-4.92 EUR/MWh from harvest/metrics): prefer accepting leases + running jobs in cheap/
negative-price windows so power cost trends to zero. Honest: never refuse a paid lease purely on price if it
is already profitable; just bias scheduling. Expose /api/a11oy/v1/revenue/marketplace with HONEST ESTIMATE
(~$86-241/mo per card) and only count a SETTLED rental as revenue, never the estimate.

## STEP 3 — VERIFIED-COMPUTE receipts (the +25% moat + the containment loop)
For every job/lease that runs: emit a DSSE receipt {ts, gpu_seconds, tokens|flops, posture, grid_price,
settlement, artifact_ref} citing the Bekenstein cap (#239) + Landauer floor (#240); persist to the provenance
chain; validate vs canonical-formulas-v1 / lean-proofs-v1; Ayni-balance (F11). That is the loop closed on REAL
paid work. NOT mining — this is useful, attestable compute someone pays for.

## STEP 4 — REPORT
Paste to replit-sync: STEP 0 result, which platform (Vast/Akash), the live listing/provider id, the founder
account/payout/AKT actions still needed (with exact links), and the first real $/lease when it settles.

## DOCTRINE v11 (NON-NEGOTIABLE): no free-energy; NO mining/proof-of-work waste — useful paid compute only;
energy != data; consent-only; crypto = payment rail only, never speculate the box; joules SAMPLE until on-GPU
NVML (still wire the founder's gpu_thermal_exporter :9839 -> GPU_THERMAL_URL when betterwithage is reachable);
sovereign only on own metal; locked=8; Lambda=Conjecture 1; Khipu BFT=Conjecture 2; NEVER commit a key/seed;
do NOT merge anything. Half-state is the only unacceptable outcome. Do it all; report what only the founder can do.
