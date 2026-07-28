# Grafana Dashboards — SZL Flagship Mesh

> Doctrine v11 LOCKED · 749/14/163 · locked_at `c7c0ba17`

JSON dashboards for the flagship mesh. They are designed for metrics from an
OTel collector via Prometheus remote-write / OTLP.

**Deployment status:** NOT LIVE-VERIFIED. The previously advertised collector
at `https://szlholdings-otel-collector.hf.space` returned HTTP 404 during the
2026-07-28 verification snapshot. Importable dashboard JSON is not proof that a
collector is running or that a receipt has appeared in Grafana.

## Dashboards

| File | Purpose |
|---|---|
| `flagship-mesh-overview.json` | Overall mesh health: availability, p99 /healthz, 5xx, doctrine drift |
| `wire-d-signing.json` | DSSE signing: p99 /khipu/sign, signed-receipt success, Wire-D verify |
| `khipu-chain-depth.json` | Khipu chain growth rate and verification status |
| `unay-recall-latency.json` | Unay recall p50/p99 latency, QPS, hit ratio |

## Import

1. Grafana → Dashboards → **New → Import**.
2. Upload the JSON file (or paste contents).
3. When prompted, bind the `DS_PROM` datasource variable to your Prometheus/OTLP source.
4. Use the `flagship` template variable (top-left) to scope by organ.

Or via API:
```bash
curl -s -X POST "$GRAFANA_URL/api/dashboards/db" \
  -H "Authorization: Bearer $GRAFANA_TOKEN" -H "Content-Type: application/json" \
  -d "{\"dashboard\": $(cat flagship-mesh-overview.json), \"overwrite\": true}"
```
