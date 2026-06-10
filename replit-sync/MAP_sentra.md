# SENTRA — Endpoint Map (for a11oy "Policy & Compliance" section)

**Base URL:** `https://szlholdings-sentra.hf.space`
**API prefix:** `/api/sentra/v1` (canonical). A few `/v1/*` sidecar aliases also exist.
**Probed:** 2026-06-05 ~23:11 UTC, live. All endpoints responded HTTP 200 in **~0.26 s** (no slow paths observed).
**Doctrine (must stay honest in a11oy too):** Λ = **Conjecture 1** (never a theorem) · proved formulas = **5** {F1,F11,F12,F18,F19} · SLSA **L2 build-attested** on container images (verifiable via `cosign verify-attestation`) · kernel 749 decls / 14 axioms / 163 sorries @ c7c0ba17, doctrine v11.

> Note for the parent: the `/console` HTML lives in the repo at `console/index.html` (served by `serve.py` from `/app/console`), **not** inside the Python file. Nothing was edited or deployed — this is map-only.

---

## 1. FULL ENDPOINT INVENTORY (live, JSON APIs)

Legend: ⭐ = flagged demo-worthy (see §2). "empty-by-design" = honestly returns zeros/nulls until the in-memory audit ring has session decisions (resets on Space restart).

### Immune gates & verdicts
| Method | Path | Purpose | Sample response (key fields) |
|---|---|---|---|
| GET | `/api/sentra/healthz` | Liveness + gate count + SLSA status | `{status:"ok", version:"0.2.0", gates:8, slsa:"L2 verified — in-toto SLSA Provenance v1, cosign keyless… Rekor index 1723794608. L3 not claimed"}` |
| GET ⭐ | `/api/sentra/v1/gates` | List all 8 deny-by-default immune gates w/ metadata | `{total:8, gates:[{id:"gate-01", name:"signature-scan", label:"Threat Signature Scan", category:"detection", expectedDecision:"deny", dualUse:false}, …8]}` — categories: detection×2, resource, governance, threat-intel, observability, contract, audit |
| GET | `/api/sentra/v1/gates/{gate_id}` | Detail for one gate (+ signature list) | `{id:"gate-01", name:"signature-scan", category:"detection", expectedDecision:"deny", signatures:["DROP TABLE","rm -rf","<script","eval(","subprocess","../../etc"]}` |
| POST | `/api/sentra/v1/gates/{gate_id}/test` | Test one gate with a payload `{action, axes}` | (per-gate pass/deny + detail) |
| POST ⭐ | `/api/sentra/v1/verdict` | Full 8-gate immune verdict (Wire B core). Body `{agent, action, severity, confidence, witnesses}` | `{decision:"deny", reason:"immune organ rejected: threat signature…", signals:["threat-signature:DROP TABLE"], lambda_value:0.0, receipt_hash:"70eb70fa9c0c0064", gates_fired:[…], doctrine:"v11"}` |
| POST | `/v1/verdict` | Alias of above (sidecar canonical path) | same shape |
| POST | `/api/sentra/v1/inspect` | Like /verdict but returns ALL signals, no short-circuit | (all signals fired) |
| POST | `/v1/inspect` | Alias of /inspect | same shape |
| POST | `/api/sentra/v1/verdict/attested` | Verdict + DSSE Ed25519 + SLSA Provenance v1 envelope. Body `{verdict}` | DSSE envelope; honest "UNSIGNED" when no key present |
| GET ⭐ | `/api/sentra/v1/verdict/feed?limit=N` | Live verdict feed from in-memory audit ring | `{verdicts:[{id:"seed-001", timestamp, decision:"deny", agent:"a11oy-mesh-router", signals:["threat-signature:DROP TABLE"], lambda_value:0.0, receipt_hash:""}, …], total_buffered:10}` (10 seed rows present) |
| GET | `/api/sentra/v1/verdict/stream` | Server-Sent Events stream of real verdicts (heartbeats when idle) | SSE (not JSON) — **not for a charted panel**, skip for a11oy |
| GET ⭐ | `/api/sentra/v1/audit-log?limit=N` | Recent verdict history (max 200) | `{entries:[{id, agent, action_preview:"DROP TABLE users", decision:"deny", signals:[…], lambda_value:0.0, timestamp}, …], total_buffered:10}` |
| GET | `/api/sentra/v1/attest/{receipt_hash}` | Full attestation chain for a real receipt (404 if unknown) | rebuilt canonical verdict + Provenance v1 predicate |
| GET | `/api/sentra/v1/rekor/verify` | Verify a real Sigstore Rekor inclusion proof (RFC6962) | honest about egress (verified=null if network blocked) |
| GET | `/api/sentra/v1/rekor/proof` | Recompute Merkle root for a Rekor logIndex | honest egress |
| GET ⭐ | `/api/sentra/v1/immune/3d` | 3D verdict-chain graph — REAL receipts only | `{nodes:[{id, signals, request_id, timestamp, color:"deny"|…}], edges:[{from,to,rel:"verdict_chain"}], count:12, live:true}` (12 nodes from seed ring) |

### Threats & anomaly
| Method | Path | Purpose | Sample response (key fields) |
|---|---|---|---|
| GET | `/api/sentra/v1/threats` | Short threat-sig corpus (6 sigs) + STIX/TAXII meta | `{total:6, stix_version:"2.1", taxii_enabled:true, corpus:[{signature:"DROP TABLE", category:"sql-injection", severity:"high"}, …]}` |
| GET ⭐ | `/api/sentra/v1/threats/full` | Full 30-sig STIX corpus + MITRE ATT&CK tags + CVSS | `{total:30, stix_version:"2.1", mitre_attack_version:"v14", corpus:[{signature, category, severity, mitre_technique:"T1190", mitre_tactic:"Initial Access", cvss_base:9.8}, …]}` — severity mix: high 21 / medium 6 / critical 3 |
| POST | `/api/sentra/v1/elite/threat-ingest` | Ingest STIX indicators `{indicators:[{type,value,severity}], source}` | adds to in-memory queue |
| GET | `/api/sentra/v1/elite/threat-ingest` | View ingest queue | `{queue:[], pending:0, total_ingested:0}` — **empty-by-design** |
| POST ⭐ | `/api/sentra/v1/anomaly` | Multi-signal anomaly score over recent verdicts. Body `{stream:[]}` | `{anomaly_score:0.0, severity:"insufficient_data", contributing_signals:[], verdict_count:0, honest_note:"Requires ≥3 verdicts in window. No score fabricated."}` — **empty-by-design** until 3+ session verdicts |
| GET | `/api/sentra/v1/anomaly/explain` | Algorithm + signal weights + severity bands | `{algorithm:"multi-signal weighted", signals:[{name:"denial_rate_spike", weight:0.4},{name:"signature_concentration", weight:0.25},{name:"entropy_drift", weight:0.2},{name:"lambda_collapse", weight:0.15}], severity_bands:{normal,low,medium,high,critical}}` |

### Govern / policy / compliance / SLO / mesh
| Method | Path | Purpose | Sample response (key fields) |
|---|---|---|---|
| GET ⭐ | `/api/sentra/v1/elite/gate-slo` | Gate-coverage SLO from audit ring | `{slo_pct:0.0, gates_covered:0, gates_total:8, total_decisions:10, breaches:5, per_gate:[{gate_id:"gate-01", hits:0, covered:false}, …8]}` — **slo_pct/per-gate hits empty-by-design** (resets on restart); breaches=5 is real from seed ring |
| POST | `/api/sentra/v1/policy/test` | Policy-as-Code harness. **Body MUST be dict** `{rules:[…], fixtures:[…]}` (bare array → 422) | `{pass_count, fail_count, total_fixtures, coverage, failures:[…], rules_compiled:2, verdict:"FAIL", honest_note:"JSON-predicate engine only (not full Rego)"}` |
| POST ⭐ | `/api/sentra/v1/elite/compliance` | Compliance evidence mapped to a framework. Body `{framework:"NIST"\|"STIG"\|"ISO27001"}` | `{controls:[{id:"AU-2", name:"Audit Events", category:"audit", status:"COVERED", evidence_hash, evidence_source:"sentra_audit_log"}, …], covered:8, total:8, coverage_pct:100.0, receipt:{id,hash}, note:"No third-party audit"}` |
| GET ⭐ | `/api/sentra/v1/elite/mesh-crosscut` | Cross-organ immune topology (5 organs + 4 wires) | `{organs:[{name:"sentra", healthy:true, lambda:null, decision_count:0, active:true},{name:"a11oy"…},…5], cross_cuts:[{from:"sentra", to:"a11oy", wire:"B", description:"Immune gate verdict → orchestrator"}, …4], immune_score:0.1, total_decisions:10}` — organ lambda/decision_count **empty-by-design** |
| POST | `/api/sentra/v1/elite/deny-theater` | "Why was this blocked" animated explainer. Body `{verdict}` | `{theater_id, animation_frames:[{frame,label,state}×4], denial_reason:"Gate 'signature-scan' tripped…", display_text:"DENIED · …", receipt_hash, decision:"DENY"}` |
| GET ⭐ | `/api/sentra/v1/puriq/formulas` | F1–F23 formula registry with honest proof status | `{count:23, proved_count:5, proved_ids:["F1","F11","F12","F18","F19"], formulas:[{id:"F23", name:"Λ Lambda Uniqueness", proof_status:"CONJECTURE", lean_status:"OPEN"}, …], lambda_status:"F23 = Λ = Conjecture 1 — NOT a theorem", slsa:"Build L2"}` — status mix: PROVED 5 / UNATTEMPTED 17 / CONJECTURE 1 |
| GET | `/api/sentra/v1/section889/vendors` | NDAA §889 banned vendor list (exactly 5) | `{authority:"NDAA FY2019 Section 889", banned_vendors:["Huawei","ZTE","Hytera","Hikvision","Dahua"], count:5}` |
| POST | `/api/sentra/v1/section889/screen` | Screen a vendor name. Body `{vendor:"…"}` | `{results:[{vendor:"Huawei", decision:"deny", flagged:true, matched_on:"huawei", reason:"Section 889 covered entity", receipt_hash}], screened:1}` |

### Forecast
| Method | Path | Purpose | Sample response (key fields) |
|---|---|---|---|
| GET | `/api/sentra/v1/forecast` | Describe the witnessed-forecast endpoint (metadata) | `{methods:["GET","POST"], feature:"witnessed forecasting with Mādhava error envelope", lean_status:"partial", lean_sorry_lines:[126,145], example_get:"…?input_value=0.5&k=8"}` |
| GET ⭐ | `/api/sentra/v1/forecast/run?input_value=&k=` | Run a forecast (GET convenience) | `{prediction:0.4636, confidence_envelope:{lower:0.46364679, upper:0.46364769, bound:4.49e-07, k_terms:8}, lean_status:"partial", honesty_note:"…Lean proof NOT complete — not a 'zero sorry' claim", synthetic:false}` |
| POST | `/api/sentra/v1/forecast` | Same, Wire-B style. Body `{input_value, k, synthetic:false}` | same shape |

### LLM routing
| Method | Path | Purpose | Sample response (key fields) |
|---|---|---|---|
| GET | `/api/sentra/v1/llm/hub` | 5-tier model roster (alias → /llm/tiers) | `{count:5, tiers:[{id:"claude_sonnet_4_6", rank:0, use:"default reasoning", why:"200K context, fast"}, … rank 1–4], active_model:"claude_sonnet_4_6", routing_policy:"cost-tiered"}` |
| GET | `/api/sentra/v1/llm/tiers` | Same roster (canonical) | same shape |
| POST | `/api/sentra/v1/llm/route` | Route a prompt to a tier | tier selection + (stub/real) completion |
| POST | `/api/sentra/v1/llm/route/elite` | Alias → /llm/route | same shape |
| POST | `/api/sentra/v1/brain/screen` | Immune-axis screening + theorem citation + LLM route | screened axes + route |

### Doctrine / mesh / brain (status surfaces — mostly text, low demo value)
| Method | Path | Purpose | Sample response (key fields) |
|---|---|---|---|
| GET | `/api/sentra/v1/lambda` | 13-axis trust vector + aggregate | `{trust_axes:13, axes:[{name:"soundness", score:0.92}, …13], lambda:0.91911, lambda_floor:0.9, pass:true, aggregate:"geometric mean (13-axis)", uniqueness:"Conjecture, not a Theorem"}` — **chartable (radar/gauge)** |
| GET | `/api/sentra/v1/doctrine-guard?prompt=` | Adversarial-prompt monitor (Doctrine-DINN clamp demo) | `{verdict:"DENY", caught:true, raw:{min_axis,…}, doctrine_dinn_clamped:{min_axis:0.95, above_floor:true}, lambda_floor:0.9}` |
| GET | `/api/sentra/v1/honest` | Doctrine honesty/lock statement | `{doctrine_lock:{doctrine:"v11", state:"LOCKED", declarations:749, axioms:14, sorries:163, commit:"c7c0ba17", lambda:"Conjecture 1"}}` — **good for an honest footer, not a chart** |
| GET | `/api/sentra/v1/brainz` | Wire/brain status board | `{ok:true, wires:{B:"LIVE", C:"LIVE", D:"LIVE_IN_PROCESS", E:"LIVE", F:"LIVE"}, live_immune_gates:8, lambda_gate_floor:0.9, declarations:749, axioms:14, sorries:163}` |
| GET | `/api/sentra/v1/brain` | Immune-brain doctrine slice | doctrine references |
| GET | `/api/sentra/v1/mesh/state` | In-process traceparent ring + cortex SSE + Khipu | `{… traceparent ring, cortex_events:[], khipu_root:null, honesty:"In-memory ring buffers… cross-Space tracing NOT wired; receipt signatures PLACEHOLDER"}` |
| GET | `/api/sentra/v1/brain/sockets` | Wire-G socket registry (6 Space sockets) | `{sockets:[{target_space:"a11oy", target_organ:"…", target_url, status:"open", wire:"G"}, … 6], recent_jacks:[]}` |
| POST | `/api/sentra/v1/brain/jack` · `/brain/multi-jack` | Wire-G brain-jack in / fan-out | jack results |
| GET | `/api/sentra/v1/cortex-subscribe` | Wire-E SSE subscribe to a11oy brand events | in-memory bus |
| GET | `/api/sentra/v1/immune/killinchu` | Immune view of the Killinchu drone flagship | air-domain antibodies |
| GET/POST | `/api/sentra/v1/rosie-companion*`, `/immune/with-rosie`, `/sentra/rosie/filter` | Rosie companion integration (folding into a11oy too — likely drop) | companion consults |

**HTML/UI routes (ignore for data wiring):** `/`, `/landing`, `/upgrades`, `/console`, `/console/{path}`, `/brain`, `/doctrine-guard`, `/verdicts`, `/sentra/verdicts`, `/style.css`, catch-all `/{path}`.

---

## 2. ⭐ TOP DEMO-WORTHY ENDPOINTS (for an investor / operator) — plain-language labels + chart type

These tell the story with zero jargon. Suggested section title inside a11oy: **"Policy & Compliance"**.

| # | Endpoint | Plain-language label (NO jargon) | Best chart | What the viewer sees |
|---|---|---|---|---|
| 1 | `GET /api/sentra/v1/gates` | **"8 Safety Gates"** | **doughnut** (+ barH by category) | 8 deny-by-default checks; allow vs deny posture at a glance. Real, always-on. |
| 2 | `GET /api/sentra/v1/verdict/feed` (or `/audit-log`) | **"Live Decision Feed"** | **lineSpark** (trust score over time) + running **Allow / Deny** doughnut tally | Stream of recent allow/deny decisions with timestamps. Strongest "we're alive" visual. |
| 3 | `GET /api/sentra/v1/elite/gate-slo` | **"Gate Coverage"** | **gauge** (coverage %) + barH (hits per gate) | How much of the safety system is exercised; honest 0% until session traffic. |
| 4 | `POST /api/sentra/v1/elite/compliance` | **"Compliance Evidence"** | **doughnut** (covered vs gaps) or barH per control | 8/8 controls COVERED, 100%, each with an evidence hash → audit-ready story. |
| 5 | `POST /api/sentra/v1/anomaly` (+ `/anomaly/explain`) | **"Threat Risk Score"** | **gauge** (risk 0–1) + barH (signal weights from /explain) | One risk dial; the 4 weighted signals (denial spike, pattern concentration, drift, trust collapse). |
| 6 | `GET /api/sentra/v1/forecast/run` | **"Forecast"** | **lineSpark** (prediction + confidence band) or **gauge** | A predicted value with an honest tight confidence band. |
| 7 | `GET /api/sentra/v1/threats/full` | **"Threat Library"** | **barV** by severity (high/med/critical) or barH top categories | 30 known attack patterns w/ severity — shows the corpus behind Gate 1. |
| 8 | `GET /api/sentra/v1/elite/mesh-crosscut` (or `/immune/3d`) | **"System Map"** | **mesh3d** (sentra at center, organs around) | sentra connected to a11oy/amaru/rosie/killinchu — the consolidation story in one graph. |

Bonus (if room): `GET /api/sentra/v1/puriq/formulas` → **"Proof Status"** doughnut (5 proved / 1 conjecture / 17 open) — but keep the honesty: F23/Λ is **Conjecture 1, not a theorem**.

**Plain-language word swaps to enforce in a11oy:** Λ / lambda → **"Trust score"**; Mādhava / madhava_bound → **"Forecast"** (+ optional small "estimate error" caption); "8-gate immune system" → **"safety gates"**; "verdict" → **"decision"**; "STIX/MITRE corpus" → **"threat library"**; "SLO" → **"coverage"**; "deny-theater" → **"why it was blocked"**.

---

## 3. SLOW / EMPTY ENDPOINTS — honest notes

- **No slow endpoints.** Every probed endpoint returned in **~0.26 s** (HTTP 200) on 2026-06-05 ~23:11 UTC. No >3 s paths. (`/verdict/stream` is SSE/long-lived by nature — not a request/response panel; exclude it.)
- **Empty-by-design (honest, not broken — in-memory audit ring resets on Space restart, only seeded with 10 demo verdicts):**
  - `/elite/gate-slo` → `slo_pct:0.0`, all `per_gate.hits:0`, `covered:false` (but `breaches:5`, `total_decisions:10` are real from seed ring).
  - `/elite/mesh-crosscut` → every organ `lambda:null`, `decision_count:0` (topology + wires are real; per-organ metrics empty).
  - `/anomaly` (POST) → `anomaly_score:0.0`, `severity:"insufficient_data"` until ≥3 verdicts exist in the window. **Will not produce a meaningful gauge until session traffic is generated** — if a11oy wants a live number, fire a few `/verdict` calls first, or label it "awaiting traffic."
  - `/elite/threat-ingest` (GET) → empty queue (`pending:0`) until something is ingested.
- **`/policy/test` input gotcha:** body MUST be a JSON object `{"rules":[…],"fixtures":[…]}`. A bare array returns **HTTP 422** validation error. (It returned 200-shaped JSON in the second call but the HTTP status was still 422 with a `verdict:"FAIL"` body — wire it with the dict form and treat 422 as "fixtures failed assertions," not a server fault.)
- **`/verdict/feed`, `/audit-log`, `/immune/3d`** all return **10–12 real seed rows** out of the box → these three are the safest to demo immediately (no need to generate traffic).
- **Honesty surfaces to preserve verbatim in a11oy:** `/honest` and `/mesh/state` explicitly state receipt signatures are PLACEHOLDER and cross-Space tracing is NOT wired; `healthz` claims SLSA **L2** (in-toto Provenance v1, cosign keyless, Rekor index 1723794608) and explicitly **"L3 not claimed."** Keep these claims exactly as-is.

---

*Map only — no files edited, nothing deployed. Probed against live `https://szlholdings-sentra.hf.space` on 2026-06-05.*
