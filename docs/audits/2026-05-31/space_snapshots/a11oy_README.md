---
title: "a11oy — Governance Substrate"
emoji: "🔬"
colorFrom: indigo
colorTo: gray
sdk: docker
pinned: true
license: apache-2.0
short_description: "a11oy — policy + receipt substrate"
tags:
  - formal-verification
  - lean4
  - mathlib
  - dsse
  - governance
  - agentic-ai
  - doctrine-v7
  - a11oy
  - execution-fabric
ecosystem-stage: "operational"
---

# a11oy — Governance Substrate

`/v1/policy/evaluate` · `/v1/verify` · `/v1/ledger` — one substrate, hash-chained, deny by default.

Open the full mesh: [SZLHOLDINGS/uds-demo](https://huggingface.co/spaces/SZLHOLDINGS/uds-demo)

Source: [github.com/szl-holdings/a11oy](https://github.com/szl-holdings/a11oy) · DOI: [10.5281/zenodo.20434276](https://doi.org/10.5281/zenodo.20434276)

Apache-2.0 · Doctrine v7 · ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)

## Live endpoints

| Path | Description |
|:-----|:------------|
| `/` | Vessels-DNA landing (preserved, commit `49ac0467`) |
| `/console/` | Operator SPA (5 working routes — health, ledger, receipt, verify, policy) |
| `/api/a11oy/healthz` | Liveness probe |
| `/api/a11oy/readyz` | Readiness probe |
| `/api/a11oy/v1/ledger` | Proof ledger (GET) |
| `/api/a11oy/v1/verify` | Chain verification (POST) |
| `/api/a11oy/v1/policy/evaluate` | Policy gate (POST) |
