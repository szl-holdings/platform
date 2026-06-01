<!-- SPDX-License-Identifier: Apache-2.0 -->
# Importing the SZL O11Y Grafana Dashboards

Eight import-ready dashboards (Grafana 10+ / 11 LTS, `schemaVersion 39`). Each
points at three template-variable datasources: **Prometheus** (`DS_PROMETHEUS`),
**Tempo** (`DS_TEMPO`), and **Loki** (`DS_LOKI`). On import, Grafana prompts you
to bind each variable to a configured datasource of the matching type.

| File | UID | What it shows |
|---|---|---|
| `flagship-mesh-overview.json` | `szl-mesh-overview` | 5 flagships health, request rate, error rate, p99 latency, uptime |
| `wire-d-signing.json` | `szl-wire-d-signing` | DSSE signs/sec, verify success rate, signature failures, key fingerprint changes |
| `khipu-chain-depth.json` | `szl-khipu-chain-depth` | chain growth rate per flagship, integrity, RS(10,6) recovery events |
| `unay-recall-latency.json` | `szl-unay-recall-latency` | recall p50/p99, vss_active vs cosine-fallback, score distribution |
| `slo-burndown.json` | `szl-slo-burndown` | error-budget burn for each flagship's 99.5% SLO |
| `gate-pass-rate.json` | `szl-gate-pass-rate` | Yuyay-13 gate pass/fail per axis, per organ |
| `mcp-tool-usage.json` | `szl-mcp-tool-usage` | Hatun-MCP tool calls, top tools, per-tool latency |
| `ouroboros-flow.json` | `szl-ouroboros-flow` | full mesh flow: intent→sign→gate→chain→memory→replay + bottleneck |

## 1. Configure the datasources

Add these three datasources in **Connections → Data sources** (or provision via
file — see below):

```yaml
# grafana/provisioning/datasources/szl.yml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    uid: szl-prometheus
    access: proxy
    url: http://prometheus:9090
  - name: Tempo
    type: tempo
    uid: szl-tempo
    access: proxy
    url: http://tempo:3200
  - name: Loki
    type: loki
    uid: szl-loki
    access: proxy
    url: http://loki:3100
```

Prometheus scrapes the flagships + the OTel collector `/metrics`. Tempo receives
traces forwarded from the OTel collector. Loki receives the structured JSON logs
from `szl-logging` (see [`../../docs/observability/logging.md`](../../docs/observability/logging.md)).

## 2. Import the dashboards (UI)

For each file: **Dashboards → New → Import → Upload JSON file →** select the
`.json` → bind `DS_PROMETHEUS`/`DS_TEMPO`/`DS_LOKI` to the datasources above →
**Import**.

## 3. Import the dashboards (provisioning / dashboard-as-code)

Drop all eight JSON files into a provisioned folder and let Grafana load them on
boot (Grafana's dashboard-as-code pattern):

```yaml
# grafana/provisioning/dashboards/szl.yml
apiVersion: 1
providers:
  - name: szl-o11y
    type: file
    folder: SZL O11Y
    options:
      path: /var/lib/grafana/dashboards/szl
      foldersFromFilesStructure: false
```

Copy the eight JSON files to `/var/lib/grafana/dashboards/szl/`. With
provisioning, the `DS_*` template variables resolve against the datasource
`uid`s you set in step 1 (set the env so Grafana substitutes them, or replace
`${DS_PROMETHEUS}` etc. with the concrete uids `szl-prometheus`/`szl-tempo`/`szl-loki`).

## 4. Validate

```bash
# JSON validity + required fields
for f in *.json; do python3 -c "import json,sys; d=json.load(open('$f')); \
  assert d['schemaVersion']>=36 and d['uid'] and d['panels']; print('$f OK')"; done
```

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
