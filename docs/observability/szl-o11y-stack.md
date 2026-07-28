<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 SZL Holdings. Licensed under the Apache License, Version 2.0. -->

# SZL O11Y Stack — Canonical Reference

**Version:** 1.0 · **Date:** June 1, 2026

> Doctrine v11 — LOCKED, verbatim: **749 declarations / 14 unique axioms / 163 sorries**. `locked_at: c7c0ba17`

This is the canonical architecture reference for the SZL-native observability
stack. It ties together the OTel collector, structured logging, dashboards,
alerting, and the GraphQL gateway, and explains the intended differentiator:
**the Khipu chain as a tamper-evident audit log.**

It does not replace the deeper specs already in this directory
([canonical-telemetry-model.md](./canonical-telemetry-model.md),
[golden-signals.md](./golden-signals.md),
[alert-policy.md](./alert-policy.md), and the OTel
[collector setup](./otel-collector-setup.md)). It is the map that points to them.

---

## Verification status

**Evidence tier: MEASURED snapshot of availability, not production proof.**

Live probes on 2026-07-28 returned HTTP 404 for `/healthz`, `/version`,
`/evidence`, and the advertised runtime routes on both
`szlholdings-otel-collector.hf.space` and
`szlholdings-graphql-gateway.hf.space`. The named GitHub mirrors
`szl-holdings/otel-collector` and `szl-holdings/graphql-gateway` were also not
retrievable.

Code, configuration, tests, and dashboard JSON in this repository prove an
implemented architecture surface; they do not prove a running production
collector, live GraphQL gateway, third-party ingestion, or receipt rendering in
Grafana, Datadog, Langfuse, or Arize. Until those external checks pass, runtime
claims below remain **PLANNED** or **IMPLEMENTED / NOT LIVE-VERIFIED**.

Do not use this page as deployment evidence.

---

## Components

| # | Component | What it is | Where it lives | Status |
|---|-----------|-----------|----------------|--------|
| 1 | **OTel Collector** | OTLP receiver (traces/metrics/logs) with ring buffer, SQLite audit, Prometheus exposition, Khipu receipts | Configuration: `ops/observability/otel-collector-config*.yaml`; advertised Space and mirror are not retrievable | **PLANNED / NOT LIVE-VERIFIED** |
| 2 | **szl-logging** | Pydantic-validated structured JSON logger; auto-injects OTel `trace_id`/`span_id`; per-organ tagging | `packages/szl-logging/` | Packaged, tests 12/12 |
| 3 | **Grafana dashboards** | 8 dashboard-as-code JSONs (schemaVersion 39), template vars for Prometheus/Tempo/Loki | `observability/grafana/*.json` + `IMPORT.md` | Validated in Grafana 10.4.5 (8/8) |
| 4 | **Prometheus alerts** | 12 alert rules across signing, chain integrity, SLO burn, latency, persistence, MCP, replay | `observability/prometheus/alerts.yml` | `promtool check rules` SUCCESS |
| 5 | **Alert runbooks** | 12 runbooks, one per alert, with diagnosis + remediation steps | `docs/runbooks/alerts/*.md` | Complete |
| 6 | **GraphQL gateway** | Strawberry federated schema over the 5 flagships; designed to sign a Khipu receipt per operation | `packages/szl-graphql/` and `services/graphql-gateway/`; advertised Space and mirror are not retrievable | **IMPLEMENTED / NOT LIVE-VERIFIED** |
| 7 | **Khipu chain** | Hash-linked, signed receipt chain — the intended canonical audit log threaded through the runtime components | Implemented in repository code; collector/gateway production emission is not verified | **IMPLEMENTED / RUNTIME UNVERIFIED** |
| 8 | **Wire D signing** | `szl.signed` span/event fingerprinting designed to feed the chain and signing dashboards | Implemented contract; production collector enforcement is not verified | **IMPLEMENTED / RUNTIME UNVERIFIED** |

---

## Intended data flow

```
flagships (a11oy, amaru, sentra, rosie, killinchu)
   │  emit OTLP traces/metrics/logs + szl-logging JSON
   ▼
OTel Collector ──► ring buffer + SQLite audit ──► /metrics (Prometheus scrape)
   │  every 100 spans → Khipu receipt (Wire D szl.signed)
   ▼
Khipu chain (hash-linked, signed)  ◄── GraphQL gateway also appends per-operation receipts
   │
   ├──► Prometheus ──► alerts.yml (12 rules) ──► runbooks
   └──► Grafana (8 dashboards: mesh overview, signing, chain depth, recall latency,
                 SLO burndown, gate pass rate, MCP usage, ouroboros flow)
```

This diagram is architectural. It is not a live topology assertion.

---

## The Khipu differentiator

Conventional observability answers *"what happened?"* The SZL stack also answers
*"can you prove it, and prove it wasn't altered?"*

- **Receipt per operation.** The implemented design signs a Khipu receipt every
  100 spans at the collector and one per GraphQL query or mutation. A live
  deployment has not yet been verified.
- **Tamper-evident by construction.** Any edit to a historical span breaks the
  hash linkage downstream — `/khipu/verify` returns `chain_integrity: false` and
  the `ChainIntegrityBroken` alert fires.
- **Audit log = telemetry.** There is no separate, trust-me audit pipeline. The
  same signed chain that proves request provenance *is* the observability record,
  so audit and o11y can never drift out of sync.
- **Doctrine-anchored.** Receipts carry the locked Doctrine v11 hash
  (`c7c0ba17`), binding every observation to a known-good policy state.

This is the "copy the best, then exceed it" thesis in code: we adopted
OTLP, Prometheus exposition, dashboard-as-code, and federation-style GraphQL —
all industry-standard — and implemented a cryptographic audit spine. External
deployment and interoperability proof remain open.

---

## How SZL o11y compares

| Capability | Honeycomb | Datadog | New Relic | **SZL codebase** |
|---|---|---|---|---|
| OTLP ingest (traces/metrics/logs) | Yes | Yes | Yes | **Configured; live ingest unverified** |
| Dashboard-as-code | Limited | Terraform/JSON | Limited | **Yes (8 JSONs, Grafana 10)** |
| Alerting + runbooks | Yes | Yes | Yes | **Yes (12 rules + 12 runbooks)** |
| Structured log → trace correlation | Yes | Yes | Yes | **Yes (auto trace_id injection)** |
| Federated GraphQL query surface | No | No | No | **Implemented; live gateway unverified** |
| Cryptographic, tamper-evident audit chain | No | No | No | **Implemented; production path unverified** |
| Receipt-per-operation provenance | No | No | No | **Implemented; production path unverified** |
| Self-hostable, Apache-2.0 components | Partial | No | No | **Yes** |

References adopted then exceeded: [Honeycomb tracing](https://docs.honeycomb.io/),
[Datadog observability](https://docs.datadoghq.com/), Grafana
[dashboards-as-code](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/),
and [Cloudflare distributed tracing](https://developers.cloudflare.com/workers/observability/).

---

## Install / adopt

1. **Logging** — `pip install szl-logging`; replace `logging.getLogger(...)` with
   `from szl_logging import get_logger; log = get_logger(__name__, organ="sentra")`.
   See [logging.md](./logging.md).
2. **Collector** — deploy a collector from the checked-in configuration, then
   point flagship OTLP exporters at its endpoints (`/v1/traces`,
   `/v1/metrics`, `/v1/logs`). See
   [otel-collector-setup.md](./otel-collector-setup.md).
3. **Metrics** — scrape the collector `/metrics` endpoint from Prometheus.
4. **Alerts** — load `observability/prometheus/alerts.yml` into Prometheus
   (`promtool check rules` first). Each alert links its runbook in
   `docs/runbooks/alerts/`.
5. **Dashboards** — import the 8 JSONs from `observability/grafana/` per
   `observability/grafana/IMPORT.md` (map `DS_PROMETHEUS` / `DS_TEMPO` /
   `DS_LOKI` on import).
6. **GraphQL** — install the local `packages/szl-graphql/` project and mount the
   router. There is no currently verified reference Space.
7. **Verify the chain** — after deployment, `GET /khipu/verify` on the collector
   and gateway must return `chain_integrity: true` before either service is
   labelled live.

All new o11y components are dashboard/config/code that is **additive** to the
existing platform and licensed **Apache-2.0**.

---

Signed: **Yachay** \<yachay@szlholdings.dev\>
Co-Authored-By: Perplexity Computer Agent
