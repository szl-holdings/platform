# UDS / Zarf / Fleet — Latest Upstream Specs (researched 2026-06-04)

## THE BIG ONE: UDS Core 1.0 (released 2026-03-25)
- UDS Core reached **v1.0** on 2026-03-25. Source: https://defenseunicorns.com/resources/announcing-uds-core-1-0/
- This is the "new UDS upgrade" — SZL must align to UDS Core 1.0, not the older 0.x line.
- Backbone across DoD service branches; airgap-native; built on Pepr (operator) + Zarf (packager).

## What changed / what to adopt ("take it all, make it our own")
- **Falco** is now the DEFAULT runtime detection tool in UDS Core (replaces/augments prior). Real-time threat detection in airgapped/egress-limited envs. → sentra (cyber-resilience) should align its threat-detection story to Falco-on-UDS-Core. Source: https://defenseunicorns.com/resources/
- **Pepr 1.0** — production-grade K8s operator + admission controller, deterministic automation. SZL already uses Pepr for `szl-receipt-on-deploy.ts`. Confirm it works against Pepr 1.0.
- **Istio Ambient** mesh (sidecar-less) — UDS Core uses Istio Ambient. SZL mesh interconnect (roadmap) should target Ambient, not legacy sidecar.
- Core apps: Authservice, Grafana, Istio, Keycloak, Loki, Metrics Server, **Neuvector**, Pepr, Prometheus, Vector, Velero.

## Local cluster targets (exactly what the June 9 deploy proof needs)
- `uds deploy k3d-core-demo:0.40.1` — full UDS Core on local k3d.
- `uds deploy k3d-core-slim-dev:0.40.1` (or :0.35.0) — Istio + Keycloak + Pepr only (lighter, faster for CI).
- Prereqs: K3D v5.7.1+, UDS CLI v0.20.0+ (SZL uses v0.32.0, fine). NodeJS 20+ for Pepr dev.
- `uds run test-uds-core` — full local test (creates k3d, installs Core, runs CI tests).

## UDS Package CR (the integration contract)
- Apps declare needs via the **UDS Package** custom resource; UDS Operator wires identity/networking/monitoring automatically.
- SZL's 5 organs each ship a UDS Package CR (the deploy-anywhere squad just fixed service-name/port/selector mismatches in these).

## Zarf
- Zarf = airgap-native K8s package manager, Apache-2.0, now an OpenSSF project (originally by Defense Unicorns).
- SZL pins Zarf v0.77.0 (via uds-cli v0.32.0). Confirm compatibility with UDS Core 1.0 deploy targets.

## UDS Software Factory (optional, for the dev story)
- GitLab + Runner + Renovate + Mattermost + SonarQube + Postgres + Valkey; lab: **Sigstore** (keyless signing) + **Archivista** (in-toto attestation datastore).
- Archivista is interesting for SZL's receipt-ledger story (in-toto attestation store) — note as adopt-candidate.

## ACTION for SZL UDS layer
1. Align deploy targets to UDS Core 1.0 (`k3d-core-slim-dev` for CI proof; `k3d-core-demo` for full).
2. Confirm Pepr receipt operator works on Pepr 1.0.
3. Target Istio Ambient for mesh interconnect (roadmap item).
4. sentra threat-detection narrative aligned to Falco default.
5. Keep honest: SZL deploys ON UDS Core; SZL is not UDS Core. No FedRAMP/Iron Bank/CMMC claims.

## UPDATE 2026-06-04 (fleet smoke-test fix research)
- Latest UDS Core demo bundle: **k3d-core-demo:0.42.0** (was 0.40.1); slim: **k3d-core-slim-dev:0.42.0**.
- Canonical local k3d env: **uds-k3d** → `uds zarf package deploy oci://defenseunicorns/uds-k3d:0.14.0` (sets up k3d to emulate cloud env). Set extra k3d args via `ZARF_VAR_K3D_EXTRA_ARGS`.
- Reference CI test pattern: `uds run test-uds-core` (creates k3d, installs Core, runs the same tests as DU CI). Per-layer: `uds run test-single-layer --set LAYER=...`.
- HONESTY: Iron Bank images are an OPT-IN flavor (`--set FLAVOR=registry1`). SZL uses UPSTREAM images → do NOT claim Iron Bank. Keep that line clean.
- FLEET GAP (CTO measured): szl-fleet-overlay PR #2 reds = (1) DCO sign-off miss, (2) `k3d Smoke — full cluster` fails. Helm/Zarf/YAML/doctrine/manifest all green. Fix these two to make the fleet green + provably deployable on a real cluster.
