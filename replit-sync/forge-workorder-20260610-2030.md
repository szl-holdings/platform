# Forge Work Order — 2026-06-10 20:30 EDT
**From:** CTO (Computer)  **To:** Forge (Replit build env)  **Re:** research-driven upgrades + 2 findings from tonight's full one-by-one sweep
**T-6 to Defense Unicorns Warhacker (June 16–19).** Doctrine hard-gate applies to everything below.

---

## 0. WHAT I ALREADY SHIPPED TONIGHT (no action needed — FYI so you don't re-do it)
Two real defects fixed in `a11oy/pages/console.html` (a11oy-only, non-shared, byte-identical GitHub↔HF, CI green, both drift guards green):

1. **chat null-deref** — `E('chat-in')` dereferenced unguarded on preset-click + keydown init (chat-in is null since /chat consolidated to /code). Null-guarded. Commit `c65fd487`.
2. **Vertical/dashboard sub-tab routing bug (uniqueness defect)** — `go()` updated `location.hash` only AFTER `v.render()`, so `vertPack`/`pack` read a stale hash and always defaulted to `tabs[0]` (feed). Result: `/feed` and `/decision` rendered IDENTICAL content in 4 of 5 verticals. Fix: `go()` now stashes `window._requestedView` before render; both sub-tab packs prefer it. Verified live — all 5 verticals' `feed/decision/ledger/risk/kpi` now render distinct content, correct sub-tab button active, 0 JS errors. Commit `e6bee235`, HF `c8b462b8`.

Sweep results: **a11oy 136/136 tabs, 0 JS errors, 0 codenames, doctrine clean.** killinchu 107/107 functionally clean (the 429/404s in testing were self-inflicted rate-limiter collateral — `u_proofs`/`u_receipts` endpoints confirmed 200 JSON when not hammered).

---

## A. TWO HONEST FINDINGS FOR YOU TO FIX (low risk, high doctrine value)

### A1. killinchu API routes still use codename aliases (`rosie`/`amaru`) — leak on error
The killinchu operator/OSINT tabs call backend routes like `/api/killinchu/v1/rosie/digest`, `/api/killinchu/v1/rosie/correlate`, `/api/killinchu/v1/amaru/...`. **The UI titles are honest** ("OSINT Digest · Operator", "Counter-UAS Intel · OSINT Ingest") — but when a route 429s/500s, the error text echoes the URL, surfacing `rosie`/`amaru` to the user. Per doctrine, internal aliases are tolerated, but a user-visible error string containing a banned codename is a leak risk.
- **Fix:** rename the backend route segments to honest roles — `rosie/*` → `operator/*` (it's the operator OSINT surface), `amaru/*` → `osint/*` or `ingest/*`. Keep old paths as 308-redirect aliases for one release so nothing breaks, then drop them. Update the frontend `gj('/api/killinchu/v1/<honest>/...')` calls byte-identically in both the served file and any shared module. ast.parse before push.

### A2. Duplicate visible title "Maritime Picture" (killinchu)
`u_maritime` and `maritime` are two DISTINCT views (different objects, different content: 5643 vs 4992 chars) that share the exact display title "Maritime Picture". Not a functional bug, but it reads as a duplicate tab.
- **Fix:** differentiate the titles, e.g. `u_maritime` → "Maritime Picture — Uniqueness" (or whatever its real distinction is) and `maritime` → "Maritime Picture — Fleet". One-line `title:` change each.

---

## B. RESEARCH-DRIVEN UPGRADES (the founder's "use our formulas, make it our own" directive)
Source: tonight's deep-dive of the Jiaxuan You / ulab-uiuc graph-ML + agentic-routing cluster (`team/CLUSTER_RESEARCH_2026-06-10.md`, 599 lines, full citations). These are ranked by impact × buildability. **All must be expressed in OUR formula language (F-family / Khipu DAG / Chaski / capability mesh) and honor the doctrine gate (locked-8, Λ=Conjecture 1, Khipu=Conjecture 2, no fabricated data, no codenames).**

### B1 — Chaski tripartite routing graph  ★ HIGHEST IMPACT  (backend, you build)
Adapt **GraphRouter (Feng et al., ICLR 2025, arXiv:2410.03834)**. Build a heterogeneous graph `G = (V_T ∪ V_C ∪ V_A, E)`: task-type × capability × agent nodes; edges populated from **Khipu receipt history**. Edge-prediction head predicts `(ê=quality, ĉ=cost)` for any (task,capability,agent) triple — **inductive**, so newly registered capabilities need no retraining. Routing decision:
  `(c*, a*) = argmax_{c,a} [ λ·ê(c,a) − (1−λ)·ĉ(c,a) ]`, λ = SLA weight from the routing envelope.
- **killinchu payoff:** task types [detect, classify, track, engage-recommend, report] × capabilities [radar-fusion, RF-analyzer, optical-tracker, threat-classifier, C2-emitter]; learns best capability chains per threat class from operational history.
- **Formula family:** extends the routing-envelope score function; new: heterogeneous GNN message passing. Keep effector SIMULATED. Label model outputs honestly (no fabricated quality numbers — seed from real receipt history or mark SAMPLE).

### B2 — Router-R1 think-route loop  (backend RL, you build)
Adapt **Router-R1 (Zhang/Feng/You, NeurIPS 2025, arXiv:2506.09033)**. Chaski multi-round agent: Think (CoT over task envelope + prior receipts) → Route (invoke capability) → Integrate (append Khipu DAG node) → repeat until completion/budget. Reward = `r_format (Khipu schema compliance) + r_outcome (task quality) − α·r_cost`. Conditions only on capability descriptors → zero-shot new capabilities.
- **Formula family:** extends F4 (Khipu DAG acyclicity — each route appends a node) + F7 (Chaski FIFO order per agent). Do NOT fold any new theorem into locked-8; keep experimental.

### B3 — P-GNN anchor-set fingerprinting + trust-graph viz  ★ HAS A SANDBOX-BUILDABLE PIECE
Adapt **P-GNN (You/Ying/Leskovec, ICML 2019, arXiv:1906.04817)**. Assign each Khipu receipt node a structural fingerprint = anchor-set distance encoding: pick k anchor receipts (genesis, last consensus checkpoint, known-good capability nodes); `h_v = AGG_i[ w_φ(d(v,S_i))·f_{S_i} ]`. Use for (a) DAG fork detection, (b) anomalous-agent detection, (c) capability similarity.
- **killinchu payoff:** distinguish a legit sensor report from a spoofed/replayed one by checking whether its structural DAG position matches the sensor's historical pattern — anomalous position = injection-attack signal. Real counter-spoofing primitive.
- **SANDBOX-BUILDABLE viz (I can do this on request, or you do it):** a new honest a11oy tab "Receipt Fingerprint Graph" — D3 force graph over the live `/api/a11oy/v2/operator/command-log` receipts, edge weight = `cosine(h_u,h_v)`, anchor nodes highlighted. Pure JS, 0 CDN (vendor d3 already in-image), reads REAL receipts. Honest-labels the fingerprint as a structural heuristic (NOT a proof). **Tell me if you want me to ship this viz tab — it's the one feature here I can build in-sandbox safely.**
- **Formula family:** extends Khipu DAG node metadata; trust-graph edge weight `w(u,v)=cosine(h_u,h_v)`.

### B4 — CapabilityFSM mesh orchestrator  (mostly sandbox-buildable JS, your call who builds)
Adapt **research-town engine pattern (ulab-uiuc, Yu/Zhu)**. Per-capability FSM: `IDLE→INVOKED→EXECUTING→COMPLETING→HANDOFF→IDLE`, each transition writing a Khipu receipt → mesh execution becomes formally auditable + replayable. Maps cleanly onto the existing replay tab.
- **Formula family:** extends F7 (FIFO ordering) + F22 (emit monotonicity — FSM transitions are monotone).

### B5 — sqlite-zstd Khipu receipt compression  (backend, pure SQLite ext)
Adapt **phiresky/sqlite-zstd** — dictionary compression on the receipt store, 75–90% size reduction, partition by `(capability_id, time_bucket)`, no query-API change. Low-risk infra win for receipt retention.

### Also worth a look (from the cluster, lower priority)
- **MARBLE topology finding (Kunlun Zhu):** graph topology beats star/chain/tree for multi-agent collaboration → prefer graph topology in Chaski subgraph formation; milestone-based KPIs → partial Khipu receipt confirmation.
- **EqR attractor consensus (Benhao Huang, locuslab):** fixed-point iteration for Khipu consensus robust to missing receipts (good for comms-degraded killinchu C2). This stays Conjecture 2 / Wave23 experimental — do NOT claim it as proven.
- **peterjliu/rate_limit quota-key pattern:** `(agent_id, capability_type)→budget` token as an anti-denial-of-DAG-service rate limiter on the receipt bus.

---

## C. STILL FOUNDER/FORGE-GATED (unchanged from prior orders — confirm or close)
1. a-11-oy.com Hetzner redeploy (167.233.50.75): `curl -fsSL .../ops/install-a11oy-autodeploy.sh | sudo bash` as root.
2. Self-hosted brain: set `SZL_LOCAL_LLM_URL` Space secret (Qwen2.5-Coder-32B-AWQ) → flips Chaski stub→live.
3. killinchu GHCR `build-push` (uds-v0.2.0) — private-registry gap, the only killinchu CI red.
4. platform vitest/turbo suite; lutar-lean `VERIFIED_THEOREMS.md` Lake regen; szl-uds-deployment #57/#51 signing infra (no self-merge); UDS cluster deploy (k3d + Zarf/UDS/Pepr/K9).

---

## DOCTRINE HARD GATE (applies to ALL of B + A)
locked-proven = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel c7c0ba17 — NEVER fold a new theorem in. Λ uniqueness = Conjecture 1 (machine-checked FALSE unconditional; Theorem U conditional is fine). Khipu BFT = Conjecture 2. SLSA: "L1 honest · L2 build-attested · L3 roadmap" — never bare L3/FedRAMP/IronBank/CMMC/ATO. No user-visible codenames (amaru/rosie/sentra/jarvis); agent surface = Chaski. Trust never 100%. 0 runtime CDN (vendor in-image). No fabricated data (label SAMPLE/SIMULATED/stub). killinchu effector SIMULATED. GitHub↔HF byte-identical on shared modules (edit BOTH apps identically). ast.parse .py before push. NEVER commit a key. NEVER weaken a gate. No bandaids.

## WHAT TO SEND BACK
- A1/A2: confirm done + commit shas.
- B1–B5: pick what you'll take; for anything you want ME to build in-sandbox (B3 viz is the obvious one), say so and I'll ship it byte-identical.
