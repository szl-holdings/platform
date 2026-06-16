# Forge → Perplexity/Founder update — 2026-06-16 (Warhacker demo prep)

Doctrine v11. No fabrication. Founder keys held. Rosa-authorized (this session only).

## Order C-Tier1 — szl-warhacker bundle recut + prove-install  ✅ VERIFIED DONE
- Recut: a11oy + killinchu un-staged as real local-path members (packages/a11oy, packages/killinchu); szl-receipts member ref fixed. (uds-bundle.yaml tip = commit f7edf7c, on main 0c1d7ad.)
- PROVEN demo artifact = `oci://ghcr.io/szl-holdings/szl-uds-bundle:uds-v0.3.0` — published, cosign-SIGNED (.sig) + attested (.att) on GHCR.
- prove-install = `prove-coboot.yml` CI ("Prove Co-Boot", run 27586435539, conclusion=success, 2026-06-16): cosign verify PASS → uds pull → deploy a11oy+killinchu on ONE throwaway k3d → BOTH Deployments Available + in-cluster HTTP 200. Bundle/packages unchanged since (git diff ff3dd2d..0c1d7ad on bundle+packages = empty) → the proof is current.
- Independent re-verify on box (real-probe): `cosign verify ghcr.io/szl-holdings/szl-uds-bundle:uds-v0.3.0 --certificate-identity-regexp 'https://github.com/szl-holdings/szl-uds-deployment/.*' --certificate-oidc-issuer 'https://token.actions.githubusercontent.com'` → PASS (Rekor offline + Fulcio cert; digest sha256:de24aac3…).
- HONEST nuance: uds-bundle.yaml carries version:0.4.0 (label ahead of the published tag); NO uds-v0.4.0 is published. The szl box (88% disk, ~150Mi free RAM, a k3d cluster already up) cannot co-boot the full stack → co-boot is proven on a CI runner, deliberately NOT re-run on the box. The demo deploys uds-v0.3.0. Founder signing key never printed/used (the CI keyless OIDC signature IS the gate).

## Order A — chaski durable 2nd energy lung  ✅ DONE (label-refinement deferred, honest)
- chaski Ollama: systemd Restart=always + enabled. Kill-recover PROVEN: `systemctl kill ollama` → auto-recovered to `active` + /api/tags 200 in ~4s. Rejoins the operator's nodes_computing automatically.
- Operator (doctrine v11, running, stub_mode=false): nodes_computing=[rtx-betterwithage, chaski]; chaski "computing" with REAL work (1766 jobs, 701,583 tokens). GPU MEASURED intact (joules_measured_total ≈ 886,720 J).
- Energy honesty: chaski is CPU-only (no NVML/RAPL) → joules_measured=0, label PENDING_EXPORTER ("never faked"). ALL MEASURED joules come from GPU rtx-betterwithage only.
- DEFERRED (honest): the order asked to relabel chaski joules MODELED. No low-risk path in the pre-demo window (/opt/szl/a11oy drift-resets to origin/main; operator code ships via git→autodeploy rebuild→re-arm = risk to the live energy core). PENDING_EXPORTER is already doctrine-honest. Safe follow-up: an isolated joules_modeled in szl_energy_operator.py _label_by_node (env CPU-watts basis), NEVER folded into joules_measured_total.

## HARDEN+SMOKE  ✅ DONE
- ops/smoke_warhacker.sh, ops/demo_watchdog.sh, ops/scan_cdn.sh merged to a11oy main (PR #462). killinchu smoke target fixed → https://killinchu.a11oy.net (PR #463). Smoke proven GREEN 20/20 on the live container (localhost:7861). 0-CDN surface scan CLEAN.
- /readyz: NOT added — existing /api/a11oy/readyz already returns an honest 200/503. No gate weakened. (Noted as drift.)

## Box redeploy a11oy.net → latest main  ✅ DONE
- Live git_sha == origin/main HEAD; autodeploy timer active.

Freeze: not yet active (activates 2026-06-18 01:00 ET); June 16–17 remain editable.
— Forge
