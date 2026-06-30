# SZL Mesh — OTel Span Schemas (Layer 5)

Folded from `szl-holdings/szl-otel-mesh` per Dev 3 consolidation (2026-06-30).
Source: https://github.com/szl-holdings/szl-otel-mesh/tree/main/schemas/spans

The six cross-organ span schemas define the `szl.mesh.*` envelope that every organ
(a11oy, sentra, amaru, killinchu, rosie) emits. Schema YAML files are archived in
`szl-otel-mesh` (now read-only). This doc records the canonical references.

| Schema | Organ | Span names |
|---|---|---|
| `a11oy.graph` | a11oy command | `.lambda` · `.automorphism` · `.position` |
| `sentra.gate` | a11oy — CHAPAQ (policy/gate) | `.evaluate` · `.attest` · `.fail_closed` |
| `amaru.sync` | a11oy — YACHAY (memory) | `.merge` · `.receipt` · `.drift_alert` |
| `killinchu.courier` | killinchu | `.dispatch` · `.deliver` · `.verify` |
| `rosie.decision` | a11oy — operator console | `.evaluate` · `.witness` · `.replay` |
| `sda.detection` | killinchu SDA | `.dtid` · `.characterize` · `.twa` · `.fuse` |

All six carry the unified cross-organ envelope: `szl.mesh.organ`, `szl.mesh.receipt_hash`,
`szl.mesh.dsse_payload_type`, `szl.mesh.image_digest`, `szl.mesh.lambda_value`,
`szl.mesh.governance_drift`, `szl.mesh.upstream_organ`.

**SDK:** The Python + TypeScript mesh SDKs (`mesh/sdk/mesh.py` and `mesh.ts`) remain
canonical in the `szl-otel-mesh` archive. The OTLP bridge (`src/mesh/otlp_bridge.py`)
is the thin integration layer; the authoritative Λ-signed-span exporter is `vsp-otel`
(Layer 4, https://github.com/szl-holdings/vsp-otel).

**Collector:** Deployed via `platform/observability/mesh-otel-collector.yaml` (this fold).

Doctrine v11 LOCKED 749/14/163 · SLSA L1 honest

Signed-off-by: Stephen Lutar <stephenlutar2@gmail.com>
Co-Authored-By: Perplexity Computer Agent <agent@perplexity.ai>
