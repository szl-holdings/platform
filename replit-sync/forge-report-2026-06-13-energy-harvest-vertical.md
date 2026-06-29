<!-- Copyright 2026 SZL Holdings · SPDX-License-Identifier: Apache-2.0 -->

# Forge report — energy-harvest signal taken full-vertical (2026-06-13)

**Order:** take the wasted-energy harvest grid signal full-vertical — live
frontend+backend on a-11-oy.com, mirrored to HuggingFace, GitHub-aligned, and
UDS/Zarf/Pepr/mesh-deployable. Doctrine v11 absolute.

## Status: DONE (live where it should be; UDS package image-publish gated by design)

### What's LIVE now
- **Backend** — standalone FastAPI on the box at `/opt/szl/energy-harvest`,
  systemd `szl-energy-harvest` `:8082`, behind nginx
  `^~ /api/a11oy/v1/harvest/` + `^~ /energy/`.
  - `https://a-11-oy.com/api/a11oy/v1/harvest/posture` → **200 live**
  - `https://a-11-oy.com/api/a11oy/v1/harvest/metrics` → **200** (honest Prometheus:
    `feeds_live 3`, `grid_price_eur_mwh -1.11`, `renewable_share_pct`,
    `uk_gco2_per_kwh`, `sovereign 0`, `joules_sample 1`)
  - `https://a-11-oy.com/energy/` → **200** HTML tab
- **Console tab** — marker `energy-harvest-tab-patch` present (count 2) on BOTH
  `a-11-oy.com/console` and `szlholdings-a11oy.hf.space/console`.

### GitHub alignment
- `szl-holdings/platform` → `apps/energy-harvest/{engine.py,server.py,index.html}`
  (server.py re-synced byte-identical to the box after the /metrics fix).
- `szl-holdings/szl-uds-deployment` → **new `packages/energy-harvest/`**:
  `Dockerfile` (python:3.12-slim, non-root, read-only rootfs, uvicorn :8080),
  `app/` source, `manifests/{namespace,deployment}.yaml` (Istio **ambient** + PSA
  restricted, /healthz probes), `uds-package.yaml` (ambient mesh, tenant expose,
  egress allow-rules to the 3 no-key feeds: api.awattar.de, api.energy-charts.info,
  api.carbonintensity.org.uk + KubeAPI, ServiceMonitor on /metrics), `zarf.yaml`,
  `README.md`.

### Verification
- `/metrics` fix: the gauges now read `engine.posture_summary()` (price/renewable/
  carbon live under `signals.*`, NOT top-level `harvest_status()` keys) — the
  earlier draft read non-existent keys that the None-skip would have silently
  dropped. Confirmed live on box + public.
- UDS package internal consistency proven by running the repo's OWN
  `scripts/deploy-entry-checks.py validate()` against the package → exit 0
  (manifest-based workload wait on `Deployment/energy-harvest` is satisfiable).

### Gating / deviations (honest)
- Container image `ghcr.io/szl-holdings/energy-harvest` is **NOT published**, so
  the `zarf.yaml` `images:` bake list is intentionally commented out and the
  package is **NOT deployed to the live 2-vCPU k3d** (no headroom) — build-valid
  but image-publish gated (FA-001 style). To go live: build (`--provenance=false`)
  → push → cosign keyless-sign → digest-pin the linux/amd64 child in `zarf.yaml`
  AND `manifests/deployment.yaml` → add to a UDSBundle.
- Shared `uds/zarf.yaml` (live vessels-demo deploy entry) left untouched on
  purpose; deploy-entry-guard only validates that file and does not cover
  `packages/**`, so this push neither trips nor is checked by it.

### Doctrine v11 — held
Honest labels (live only on real 200) · joules SAMPLE (no on-box NVML) · signal
NEVER sets `sovereign:true` · NOT one of the locked-8 (Λ = Conjecture 1) · no key
committed · no PR merged / never `--admin` · live `serve.py` untouched · additive
only.

— Forge
