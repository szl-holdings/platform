<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 SZL Holdings. Licensed under the Apache License, Version 2.0. -->

# SZL O11Y Stack — Canonical Reference

**Version:** 1.0 · **Date:** June 1, 2026

> Doctrine v11 — LOCKED, verbatim: **749 declarations / 14 unique axioms / 163 sorries**. `locked_at: c7c0ba17`

This is the canonical, top-of-funnel reference for the SZL-native observability
stack. It ties together the OTel collector, structured logging, dashboards,
alerting, and the GraphQL gateway, and explains the one thing that makes SZL
o11y different from everything else on the market: **the Khipu chain as a
tamper-evident, canonical audit log.**

It does not replace the deeper specs already in this directory
([canonical-telemetry-model.md](./canonical-telemetry-model.md),
[golden-signals.md](./golden-signals.md),
[alert-policy.md](./alert-policy.md), and the OTel
[collector setup](./otel-collector-setup.md)). It is the map that points to them.

---

## Components

| # | Component | What it is | Where it lives | Status |
|---|-----------|-----------|----------------|--------|
| 1 | **OTel Collector** | OTLP receiver (traces/metrics/logs) with ring buffer, SQLite audit, Prometheus exposition, Khipu receipts | Space: `szlholdings-otel-collector.hf.space` · Mirror: `github.com/szl-holdings/otel-collector` | Live v1.0.0 |
| 2 | **szl-logging** | Pydantic-validated structured JSON logger; auto-injects OTel `trace_id`/`span_id`; per-organ tagging | `packages/szl-logging/` | Packaged, tests 12/12 |
| 3 | **Grafana dashboards** | 8 dashboard-as-code JSONs (schemaVersion 39), template vars for Prometheus/Tempo/Loki | `observability/grafana/*.json` + `IMPORT.md` | Validated in Grafana 10.4.5 (8/8) |
| 4 | **Prometheus alerts** | 12 alert rules across signing, chain integrity, SLO burn, latency, persistence, MCP, replay | `observability/prometheus/alerts.yml` | `promtool check rules` SUCCESS |
| 5 | **Alert runbooks** | 12 runbooks, one per alert, with diagnosis + remediation steps | `docs/runbooks/alerts/*.md` | Complete |
| 6 | **GraphQL gateway** | Strawberry federated schema over the 5 flagships; signs a Khipu receipt per operation | `packages/szl-graphql/` · Space: `szlholdings-graphql-gateway.hf.space` · Mirror: `github.com/szl-holdings/graphql-gateway` | Live v1.0.0 |
| 7 | **Khipu chain** | Hash-linked, signed receipt chain — the canonical audit log threaded through every component above | Emitted by collector + gateway; verifiable via `/khipu/verify` | Live |
| 8 | **Wire D signing** | `szl.signed` span/event fingerprinting that feeds the chain and the signing dashboards | Enforced at collector ingest | Live |

---

## Data flow

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

---

## The Khipu differentiator

Conventional observability answers *"what happened?"* The SZL stack also answers
*"can you prove it, and prove it wasn't altered?"*

- **Receipt per operation.** The collector signs a Khipu receipt every 100 spans;
  the GraphQL gateway signs one on every query and mutation. Each receipt is
  hash-linked to the previous one, forming an append-only chain.
- **Tamper-evident by construction.** Any edit to a historical span breaks the
  hash linkage downstream — `/khipu/verify` returns `chain_integrity: false` and
  the `ChainIntegrityBroken` alert fires.
- **Audit log = telemetry.** There is no separate, trust-me audit pipeline. The
  same signed chain that proves request provenance *is* the observability record,
  so audit and o11y can never drift out of sync.
- **Doctrine-anchored.** Receipts carry the locked Doctrine v11 hash
  (`c7c0ba17`), binding every observation to a known-good policy state.

This is the "copy the best, then exceed it" thesis made concrete: we adopted
OTLP, Prometheus exposition, dashboard-as-code, and federation-style GraphQL —
all industry-standard — and added a cryptographic audit spine none of them ship.

---

## How SZL o11y compares

| Capability | Honeycomb | Datadog | New Relic | **SZL O11Y** |
|---|---|---|---|---|
| OTLP ingest (traces/metrics/logs) | Yes | Yes | Yes | **Yes** |
| Dashboard-as-code | Limited | Terraform/JSON | Limited | **Yes (8 JSONs, Grafana 10)** |
| Alerting + runbooks | Yes | Yes | Yes | **Yes (12 rules + 12 runbooks)** |
| Structured log → trace correlation | Yes | Yes | Yes | **Yes (auto trace_id injection)** |
| Federated GraphQL query surface | No | No | No | **Yes (Strawberry + Federation v2)** |
| Cryptographic, tamper-evident audit chain | No | No | No | **Yes (Khipu chain)** |
| Receipt-per-operation provenance | No | No | No | **Yes** |
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
2. **Collector** — point flagship OTLP exporters at the collector OTLP endpoints
   (`/v1/traces`, `/v1/metrics`, `/v1/logs`). See
   [otel-collector-setup.md](./otel-collector-setup.md).
3. **Metrics** — scrape the collector `/metrics` endpoint from Prometheus.
4. **Alerts** — load `observability/prometheus/alerts.yml` into Prometheus
   (`promtool check rules` first). Each alert links its runbook in
   `docs/runbooks/alerts/`.
5. **Dashboards** — import the 8 JSONs from `observability/grafana/` per
   `observability/grafana/IMPORT.md` (map `DS_PROMETHEUS` / `DS_TEMPO` /
   `DS_LOKI` on import).
6. **GraphQL** — `pip install "szl-graphql[server]"` and mount the router, or hit
   the reference Space at `szlholdings-graphql-gateway.hf.space`.
7. **Verify the chain** — `GET /khipu/verify` on the collector and gateway should
   return `chain_integrity: true`.

All new o11y components are dashboard/config/code that is **additive** to the
existing platform and licensed **Apache-2.0**.

---

Signed: **Yachay** \<yachay@szlholdings.dev\>
Co-Authored-By: Perplexity Computer Agent
