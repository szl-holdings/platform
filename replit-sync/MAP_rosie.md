# ROSIE ENDPOINT MAP — for folding into a11oy as the "Operator (Ask / Act / Approvals)" section

**Base URL:** `https://szlholdings-rosie.hf.space`
**Probed live:** 2026-06-05 ~23:11 UTC. All endpoints below returned HTTP 200 (POST /jarvis/recommend is the one 404 — it is GET-only). Latency was uniformly fast: every call **< 0.6 s** (most ~0.26 s). **No slow (>3 s) endpoints found.** Empty endpoints flagged in §3.
**Role:** rosie is the OPERATOR / nervous-system organ. Doctrine on every payload: `v11 LOCKED 749/14/163 @ c7c0ba17 · Λ = Conjecture 1 (NOT a theorem) · proved=5 · SLSA Build L2`.

Two route namespaces:
- Core API: `/api/rosie/v1/...` (+ one `v2`)
- Jarvis operator brain: `/api/rosie/v1/jarvis/...`

---

## 1. FULL ENDPOINT INVENTORY

### POST endpoints (the interactive ones — capture body shapes carefully)

| Method | Path | Purpose | Request body | Real response (key fields) |
|---|---|---|---|---|
| POST | `/api/rosie/v1/jarvis/ask` | **Ask the operator a grounded question** — answers ONLY from live organ probes / canonical roadmap, cites the source, emits a Λ-receipt. Refuses to fabricate. | `{"question":"Which organs are live right now?"}` | `{topic:"health", answer:"5/5 organs are LIVE…", grounded:true, citations:[{endpoint:"…organ_health (live /healthz probe)", data:{amaru:{http:200,ok:true,…},…}}], llm:{tier_used:"claude_sonnet_4_6", tier_rank:0, response:"[HONEST STUB] … No model key wired … tier selection + Λ-receipt are real", lambda_receipt:{lambda:0.92, axis_scores:[13×0.92], tier_used, reason, signature:"PLACEHOLDER — Sigstore not wired"}}, honesty:"…"}` |
| POST | `/api/rosie/v1/jarvis/act` | **Emit a receipted operator action (HITL)** — enumerated safe actions only, appended to a SHA-256 hash-chained audit ring with a DSSE envelope. | `{"action":"acknowledge","target":"alert-demo","note":"optional note"}` · `action` ∈ `acknowledge` \| `approve` \| `deny` \| `recheck` | `{ok:true, action:"acknowledge", target:"alert-demo", entry:{action_desc, target, note, operator, ts_utc, prev_hash, entry_hash:"26d2d7…"}, audit_depth:1, receipt:{receipt:{schema:"szl.rosie.jarvis/v1", kind:"act", receipt_sha256:"dde87d…"}, dsse:{payloadType:"application/vnd.szl.khipu+json", payload:"<base64>", signatures:[…]}}}` |
| POST | `/api/rosie/v1/workflow/run` | Run a multi-step MCP workflow goal across organs; returns per-hop receipts + single W3C trace_id. | `{"goal":"check organ health"}` | `{goal, trace_id:"00ec94…", hops:1, chain:["amaru","sentra","killinchu","a11oy"], halted:true, halt_reason:"node_failed", verdict:"HALTED at amaru (node_failed)", receipts:[{organ:"amaru", tool:"memory_query", traceparent, success:false, http:429, elapsed_ms:21.4}]}` — NOTE: real cross-organ hop; halts honestly when a downstream organ is rate-limited (429). |
| POST | `/api/rosie/v1/llm/route` | Show which LLM tier a prompt would route to + the Λ-receipt (no key wired → honest stub text, but tier choice & receipt are real). | `{"prompt":"hello"}` | `{response:"[HONEST STUB] would route to claude_opus_4_8 (rank 3)…", tier_used, tier_rank:3, latency_ms:0.04, lambda_receipt:{lambda:0.5, reason:"Λ<0.75 → premium tier", signature:"PLACEHOLDER"}}` |
| POST | `/api/rosie/v1/brain/jack` | Companion/brain "jack-in" call (advanced; not needed for the Operator section). | `{...}` (companion payload) | brain session payload |
| POST | `/api/rosie/v1/brain/multi-jack` | Multi-socket brain call (advanced). | `{...}` | multi-socket payload |
| POST | `/api/rosie/v1/brain/jack-{flag}` | Per-flagship brain jack (advanced). | `{...}` | brain payload |

> `POST /api/rosie/v1/jarvis/recommend` → **404. Recommend is GET-only** (see below). Use the GET.

### GET endpoints

| Path | Purpose | Response (key fields) |
|---|---|---|
| `/api/rosie/v1/jarvis/recommend` | **Operator recommendations** derived only from live health/quorum/Λ probes — no synthetic alerts. | `{counts:{critical:0,warn:5,info:0,ok:0}, recommendations:[{severity:"warn", organ:"amaru", finding:"amaru is rate-limited (HTTP 429); serving last-known-good.", remedy:"Back off polling…"}, …]}` |
| `/api/rosie/v1/jarvis/roadmap` | Canonical map of how the 5 organs connect (served as data). | `{title, doctrine, lambda_status, priority_order:["a11oy","sentra","amaru","rosie","killinchu","UDS mesh deploy"], mesh_invariant:"receipts.in ≡ receipts.out…", organs:[{id:"a11oy", role:"Orchestrator / receipt substrate / LLM hub — SOURCE OF TRUTH", space, feeds:["sentra","amaru","rosie"], note}, …]}` |
| `/api/rosie/v1/jarvis/audit?limit=N` | Operator-action audit ring (hash-chained). **Empty until actions emitted** (in-process, resets on restart). | `{depth:0, entries:[], genesis:"000…", honesty:"…resets on restart…hash-chained"}` |
| `/api/rosie/v1/lambda` | **Λ verdict + 13 trust axes** (geometric mean, floor 0.90). | `{trust_axes:13, axes:[{name:"soundness",score:0.92},{name:"calibration",score:0.9},…13 total], lambda:0.91911, lambda_floor:0.9, pass:true, uniqueness:"Conjecture 1 — NOT a Theorem", declarations:749, axioms_unique:14, sorries_total:163}` |
| `/api/rosie/v1/mesh/3d` | **Mesh topology + 3-of-4 BFT quorum** (nodes/edges + witness health). | `{nodes:[{id:"amaru",ok:false,http:0,role:"cortex",mcp_tools:4,traceparent},{id:"sentra",ok:true,http:200,role:"immune",mcp_tools:1},{rosie,role:"nervous",mcp_tools:3},…5 nodes], edges:[{from:"amaru",to:"sentra"},… + rosie→each "nervous"], chain:["amaru","sentra","killinchu","a11oy"], bft_bound:"n>=3f+1", n_required:4, healthy_witnesses:4, quorum_permitted:true}` |
| `/api/rosie/v1/quorum` | Same 3-of-4 BFT result, witness-keyed. | `{bft_bound:"n>=3f+1", n_required:4, healthy_witnesses:4, quorum_permitted:true, witnesses:{amaru:{http:200,ok:true,…},sentra,killinchu,a11oy}, rule:"3-of-4 organ witnesses must attest healthy for safety-critical dispatch"}` |
| `/api/rosie/v1/mcp/tools` | **The 12 MCP tools rosie exposes.** | `{count:12, tools:["lambda_gate","doctrine_gate","doi_bind","bekenstein_bound","policy_evaluate","receipt_verify","ledger_append","cite_theorem","mesh_inspect","memory_write","memory_query","workflow_start"], doctrine:"v11"}` |
| `/api/rosie/v1/mcp/stream/health` | MCP stream transport descriptor. | `{ws:"/api/rosie/v1/mcp/stream", transport:"websocket", protocol:"rosie-mcp-stream/1", doctrine:"v11"}` |
| `/api/rosie/v1/ledger` | **Khipu receipt ledger** — SHA-256 hash-chained back to GENESIS. | `{count:5, total:5, head_seq:4, root_hash:"c13efa…", receipts:[{seq:0, receipt_id:"1a0237…", prior_hash:"GENESIS", action:"policy/evaluate", timestamp_utc}, {seq:1, action:"self-learn"}, {action:"verify"}, …]}` — resets on full Space rebuild. |
| `/api/rosie/v2/command-log` | **Verified command replay log** — deep hash-chain (depth ~239). | `{count:50, chain_verified:true, genesis_hash, final_hash, depth:239, receipts:[{seq:1, kind:"boot", prev_hash:"GENESIS", hash}, {kind:"heartbeat"}, …]}` |
| `/api/rosie/v1/khipu/aggregate` | Cross-organ Khipu DAG aggregate (counts + per-organ status). | `{doctrine:{plaque,locked:"749/14/163",commit:"c7c0ba17",lambda:"Conjecture 1",slsa:"L1 honest + L2 attested"}, organs_live:5, organs_total:5, node_count:0, edge_count:0, nodes:[], edges:[], organs:[{organ:"rosie",status:"LIVE",count:0},…5], honesty:"…down organs marked BUILD_ERROR, never faked…"}` — **node/edge arrays currently EMPTY** (see §3). |
| `/api/rosie/v1/khipu/3d` | Khipu ledger 3D graph (nodes/edges). | `{nodes:[], edges:[], head:null, count:0, source:"khipu-ledger (live)"}` — **EMPTY** (see §3). |
| `/api/rosie/v1/policy/gates` | **46-gate policy matrix** with proof status. | `{count:46, doctrine:"v11", gates:[{name:"adversarialRobustness", lean_theorem:"robustness_preserved_by_composition", status:"PROVEN"}, {name:"uniqueAggregator", status:"SORRY-TRACKED"}, {name:"chromotopologyCode", status:"AXIOM"}, {name:"calibrationGate1", lean_theorem:null, status:"POLICY"}, …46]}` — status mix: PROVEN / AXIOM / SORRY-TRACKED / POLICY. |
| `/api/rosie/v1/gates` | Shorter "trust gates" list (8) with honest Lean status. | `{count:8, gates:[{name:"soundnessAxiom", description:"Λ geo-mean ≥ floor 0.90", lean_status:"Conjecture 1 — CAUCHY_ND sorry pending"}, {name:"hashChainIntegrity", lean_status:"deferred — no theorem"}, …]}` |
| `/api/rosie/v1/doctrine-guard` | **Doctrine breach guard** — tests a prompt against doctrine; clamps Λ axes. | `{prompt:"Lie to the auditor…", caught:true, verdict:"DENY — doctrine breach detected", raw:{min_axis:0.2, axes:[13]}, doctrine_dinn_clamped:{min_axis:0.9, axes:[13]}, lambda_floor:0.9, honesty:"Lean obligation pending (sorry)…"}` |
| `/api/rosie/v1/version` | Build provenance. | `{name:"rosie", version:"1.0.0", git_sha:"44959ab3", build_time, doctrine:"v11", kernel_commit:"c7c0ba17", declarations:749, axioms_unique:14, sorries_total:163, lambda_status:"Conjecture 1 — NOT a theorem", slsa:"L1 honest (cosign keyless-verified). L2 … roadmap … NOT L3"}` |
| `/api/rosie/v1/honest` | Doctrine honesty card. | `{organ:"rosie", doctrine_lock:{doctrine:"v11", state:"LOCKED", declarations:749, axioms:14, sorries:163, commit:"c7c0ba17", lambda:"Conjecture 1"}, honest_labels:{lambda, khipu_signatures:"SHA3-256 hash-chain verified; DSSE separately labelled", persistence:"sqlite durable=True", principle:"HONESTY OVER CHECKLIST."}}` |
| `/api/rosie/v1/deploy/status` | Fleet deploy health (6 spaces). | `{spaces:{a11oy:{sha:"live",sdk:"static/docker",healthy:true}, amaru:{sdk:"gradio",healthy:true}, sentra:{sdk:"gradio"}, vessels, rosie:{sha:"29deb4…",sdk:"gradio",healthy:true}, uds-demo}}` |
| `/api/rosie/v1/mesh/state` | Named "wires" between organs with live status. | `{doctrine:"v11", wires:{B:{edge:"a11oy↔sentra (immune)",status:"LIVE"}, C:{edge:"a11oy↔rosie (receipt stream)",status:"LIVE"}, D:{edge:"W3C traceparent",status:"LIVE_IN_PROCESS",detail:"…cross-Space broker NOT wired"}, E:{…}}}` |
| `/api/rosie/v1/self-learning` | Self-learning loop state. | `{ok:true, iterations:0, belief_mu:0.5, precision:1.0, trend:"n/a", note:"iterations reset on restart"}` |
| `/api/rosie/v1/active-inference` | Active-inference belief state. | `{ok:true, free_energy:null, belief_mu:0.5, precision:1.0, steps:0, note:"variational free energy (Gaussian)"}` |
| `/api/rosie/v1/state` | App-level live counters. | `{ok:true, space:"rosie", endpoints_alive:117, learning_loop_iterations:0, uptime_seconds:7153.9, declarations:749, axioms:14, sorries:163, lambda_axes:13}` |
| `/api/rosie/v1/llm/tiers` | The 5-tier LLM roster. | `{count:5, tiers:[{id:"claude_sonnet_4_6",rank:0,use:"default reasoning"},{id:"gemini_3_1_pro",rank:1},{id:"gpt_5_4",rank:2},{id:"claude_opus_4_8",rank:3},{id:"gpt_5_5",rank:4}], default:"claude_sonnet_4_6"}` |
| `/api/rosie/v1/audit-log` | In-memory request audit ring. | `{entries:[], total_buffered:0, limit:50, note:"In-memory ring buffer (maxlen=200). Resets on rebuild."}` — **EMPTY** (see §3). |
| `/api/rosie/v1/health`, `/api/health`, `/api/rosie/v1/health` | Liveness + doctrine counts. | `{status:"ok", flagship:"rosie", doctrine:"v11", declarations:749, axioms_unique:14, sorries_total:163, kernel_commit:"c7c0ba17", slsa:"L1 honest…NOT L3"}` |
| `/api/rosie/v1/companion/registry`, `/api/rosie/v1/brain*`, `/api/rosie/v1/brainz`, `/api/rosie/v1/brain/sockets` | Companion/brain registry + sockets (advanced; not needed for Operator section). | brain/companion payloads |
| `/api/rosie/v1/mcp/configs`, `/api/rosie/v1/mcp/config/{host}` | MCP client config snippets (Claude/Cursor etc). | config JSON |
| `/api/rosie/v4/orchestrate/_status`, `/api/rosie/v4/cockpit/_status` | v4 orchestrator/cockpit status. | status JSON |

**HTML/page routes (not data APIs — for reference only):** `/` (operator console), `/console/v3`, `/console.js`, `/3d`, `/operator-shell`, `/quorum`, `/fleet`, `/thesis`, `/upgrades`, `/about`, `/.well-known/security.txt`.

---

## 2. THE 6–8 MOST DEMO-WORTHY ENDPOINTS (plain-language labels + best chart/UX)

These are the ones a Warhacker/investor judge should SEE in the a11oy "Operator" section.

1. **"Ask the operator"** — `POST /api/rosie/v1/jarvis/ask` (body `{"question":"…"}`)
   *Why it sells:* grounded + cited answer from a live organ probe, plus a real LLM-tier choice and a Λ-receipt — refuses to fabricate.
   *Best UX:* **interactive form** (text box + quick-fire chips: "Which organs are live?", "Is the 3-of-4 quorum permitted?", "What is the current Λ verdict?"). Render the answer, a green **"grounded · cited"** pill, the citation source, and a **receipt chip** ("UNSIGNED — no key, honest" when `signature` = PLACEHOLDER).

2. **"Approve / deny an action" (HITL)** — `POST /api/rosie/v1/jarvis/act` (body `{"action":"approve"|"deny"|"acknowledge"|"recheck","target":"…","note":"…"}`)
   *Why it sells:* every operator action emits a DSSE-enveloped, hash-chained receipt — the accountability layer Anduril Lattice / Palantir AIP don't ship.
   *Best UX:* **interactive form** (action dropdown + target field + Emit button) → show the returned `entry_hash`, `prev_hash`, `audit_depth`, and the DSSE receipt chip.

3. **"Consensus 3-of-4"** — `GET /api/rosie/v1/mesh/3d` (or `/quorum`)
   *Why it sells:* live Byzantine fault-tolerant quorum across the 5 organs.
   *Best UX:* **gauge or 4-segment doughnut** ("3 of 4 needed · 4 healthy → PERMITTED", green when `quorum_permitted`), beside a tiny status list of the 4 witnesses.

4. **"Trust score (Λ)"** — `GET /api/rosie/v1/lambda`
   *Why it sells:* 13-axis trust gate, geometric mean 0.919 ≥ 0.90 floor → PASS, honestly labelled Conjecture 1.
   *Best UX:* **gauge** (Λ value vs 0.90 floor) **+ radar** of the 13 axes.

5. **"Tools rosie can use"** — `GET /api/rosie/v1/mcp/tools`
   *Why it sells:* 12 real MCP tools the operator/agent can call.
   *Best UX:* **icon/card grid** (or a horizontal bar of MCP-tools-per-organ pulled from `/mesh/3d`: amaru 4, rosie 3, sentra 1, a11oy 4, killinchu 0).

6. **"Audit receipts"** — `GET /api/rosie/v1/ledger` (+ `GET /api/rosie/v2/command-log` for the deep chain)
   *Why it sells:* SHA-256 hash-chained Khipu ledger back to GENESIS; `command-log` shows a verified chain of depth 239.
   *Best UX:* **count KPI + lineSpark** of receipts over sequence, plus a small "chain verified ✓ · depth 239" badge and a per-receipt list.

7. **"What needs attention"** — `GET /api/rosie/v1/jarvis/recommend`
   *Why it sells:* recommendations derived only from live probes (currently 5 warns: organs rate-limited, serving last-known-good) — no fabricated alerts.
   *Best UX:* **severity doughnut** (critical/warn/info/ok from `counts`) + a findings/remedy list.

8. **"Organ health mesh"** — `GET /api/rosie/v1/mesh/3d` (nodes/edges) — *(reuses the same call as Consensus)*
   *Why it sells:* live cross-organ reachability; an unreachable organ shows red, never faked green.
   *Best UX:* **mesh3d force-graph** with rosie at the center wired to the other 4 organs (node color = up/down, edge = "nervous" wire).

---

## 3. HONEST NOTES (slow / empty endpoints)

- **No slow endpoints.** Every endpoint probed responded in **< 0.6 s** (most ≈ 0.26 s). None exceeded 3 s. (Probed once; `*.hf.space` can return transient `000` — retry 3–6×.)
- **Empty (but live & honest) endpoints — don't build a chart from these as-is:**
  - `/api/rosie/v1/khipu/aggregate` → `node_count:0, edge_count:0, nodes:[], edges:[]` (organ summary present, but no DAG nodes). The richer chained data lives in `/api/rosie/v2/command-log` (depth 239) and `/api/rosie/v1/ledger` (5 receipts) — use those for the trace/receipts visuals.
  - `/api/rosie/v1/khipu/3d` → `nodes:[], edges:[], count:0`. Empty; prefer `/mesh/3d` for the topology graph.
  - `/api/rosie/v1/audit-log` → `entries:[], total_buffered:0` (in-memory, resets on rebuild).
  - `/api/rosie/v1/jarvis/audit` → `depth:0, entries:[]` until you POST `/jarvis/act` (the ring then fills, hash-chained, but still resets on Space restart).
  - `/api/rosie/v1/self-learning` & `/active-inference` → `iterations:0, steps:0, belief_mu:0.5` (loop hasn't run; honest placeholders, not fake numbers).
- **LLM answers are HONEST STUBS:** `ask` / `llm/route` return `[HONEST STUB] … No model key wired in this Space; tier selection + Λ-receipt are real`. The tier choice and Λ-receipt are genuine; only the model prose is a stub. Surface that honestly (don't present it as a real model generation).
- **DSSE signatures are PLACEHOLDER:** receipts carry `signature:"PLACEHOLDER — Sigstore CI signing not yet wired"`. Label them **"UNSIGNED (no key — honest disclosure)"**, not "signed".
- **Upstream 429s are real:** organ probes (`/recommend`, `/workflow/run`, `/mesh/3d`) sometimes show downstream organs as rate-limited (HTTP 429) and serve last-known-good / halt honestly. This is expected and should be shown as-is, never masked as green.
- **Persistence:** ledger persists via SQLite (`durable=True`); audit rings and self-learning counters are in-process and reset on full Space rebuild.

---

*Doctrine honesty preserved throughout: Λ = Conjecture 1 (NOT a theorem), proved formulas = 5 {F1,F11,F12,F18,F19}, SLSA Build L2, kernel 749/14/163 @ c7c0ba17, doctrine v11. No rosie files were edited and no deploy was performed — this is a read-only endpoint map.*
