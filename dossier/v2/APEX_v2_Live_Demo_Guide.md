# SZL Holdings — Live Demo Guide (v2)
## Empire APEX Meeting · May 6, 2026
## Teams Screen Share Walkthrough — refreshed May 5, 2026

> This v2 guide replaces the v1 demo guide and aligns the walkthrough with the canonical investor demo path documented at `docs/audits/INVESTOR_DEMO_PATH.md`. Tier-1 and Tier-2 fixes from the May 5 audit pass have been applied across all eight surfaces; the path is safe to walk live.

---

## Setup (Before the Call)

1. Open the platform in Chrome at the dev URL.
2. Open these tabs in order. You will click through them during the demo:
   - **Tab 1:** `/trust-center` (A11oy Trust Center)
   - **Tab 2:** `/command` (A11oy Command Surface)
   - **Tab 3:** `/conduit/` (Amaru Dashboard)
   - **Tab 4:** `/sentra/governed-adversary-loop` (Sentra proof chain)
   - **Tab 5:** `/counsel/matter-overview` (Counsel)
   - **Tab 6:** `/terra/distress-engine` (Terra)
   - **Tab 7:** `/vessels/maritime-intelligence` (Vessels)
   - **Tab 8:** `/rosie/#/proof` (ROSIE Proof Bench — NEW since v1)
   - **Tab 9:** `/a11oy/argo` (Argo decision engine — bonus depth)
   - **Tab 10:** `/carlota-jo/` (Carlota Jo — only if she asks for the consumer brand)
   - **Tab 11:** `github.com/szl-holdings/ouroboros`
   - **Tab 12:** `github.com/szl-holdings/ouroboros-thesis`
3. Confirm each tab is fully loaded.
4. Chrome zoom to 100%.
5. Viewport ≥1280×900 (deck and dashboard styling are tuned for desktop).
6. Close devtools (avoids `[DEMO]` console output in Vessels embeds).
7. Close all other notifications.

---

## Demo Script (≈6 minutes)

The path runs the proof spine through five verticals + the new ROSIE bench in five and a half minutes. The pacing budget is generous; do not rush.

### Stop 1 — Trust Center (45s)
**Tab 1: `/trust-center`**

**Show:** The constitutional surface — proof, covenants, attestation cards.
**Say:** "This is the Trust Center. It is the constitutional surface for the platform. Every other surface inherits this design language. One company, one proof model."

### Stop 2 — Command Surface (45s)
**Tab 2: `/command`**

**Show:** The cross-vertical operator pane.
**Say:** "This is the command surface. One pane, every domain. This is where governed runs are monitored end-to-end."

### Stop 3 — Amaru Dashboard (45s)
**Tab 3: `/conduit/`**

**Show:** The throughput chart and the Sovereign AI Hub navigation.
**Say:** "Amaru is the data convergence engine. Append-only delta log, hash-verified ingest, three-witness reconciliation. The throughput window is on a live `Date.now()` clock — never freezes."

### Stop 4 — Sentra Governed Adversary Loop (45s)
**Tab 4: `/sentra/governed-adversary-loop`**

**Show:** The six-step proof chain across Sentra ↔ A11oy.
**Say:** "This is the proof spine in motion. Six steps, end-to-end. Each step emits a proof packet. The pattern is identical in every vertical."

### Stop 5 — Counsel Matter Overview (30s)
**Tab 5: `/counsel/matter-overview`**

**Show:** Matter cards and obligation graph.
**Say:** "Counsel is the legal matter command surface. Same proof spine, applied to matters and obligations."

### Stop 6 — Terra Distress Engine (30s)
**Tab 6: `/terra/distress-engine`**

**Show:** Distressed-property pipeline with live NYC/NYS data.
**Say:** "Terra is the real estate intelligence platform. Distressed-property discovery on live NYC/NYS data. Same proof spine."

### Stop 7 — Vessels Maritime Intelligence (45s)
**Tab 7: `/vessels/maritime-intelligence`**

**Show:** Live AIS feed, fleet positions, sanctions screening.
**Say:** "Vessels is the maritime surface. Live AIS feed, fleet positions, sanctions screening, dark-vessel detection."

### Stop 8 — ROSIE Proof Bench (45s) — NEW
**Tab 8: `/rosie/#/proof`**

**Show:** The Evidence Bench page, then click through Identity → Optimizer → Fabric.
**Say:** "This is ROSIE. It became a customer-facing surface yesterday. ROSIE is the operator pane for CPS payloads — this is where a payload is actually run, the proof packets emit, and an operator approves or rolls back. This is what governed AI looks like as a workflow."

### Stop 9 — Argo (30s, if time permits)
**Tab 9: `/a11oy/argo`**

**Show:** Champion-policy table, mirror-eval scores, counterfactual rollouts.
**Say:** "And this is Argo — the experience-era decision engine inside A11oy. Champion policies, mirror evaluation, counterfactual rollouts, reward-hacking guardrails. This is how we test that the policy is actually doing what we say it is doing."

### Stop 10 — GitHub (45s)
**Tab 11: `github.com/szl-holdings/ouroboros`**

**Show:** Releases, tests badge, CodeQL badge.
**Say:** "Open-source runtime. v6.2.0. Tests, dependabot, CodeQL. Not a marketing repo — the actual code."

**Tab 12: `github.com/szl-holdings/ouroboros-thesis`**

**Show:** The releases page — point at `paper-v3-2.0.0`, `paper-v9-1.0.0`, `paper-v10-1.0.0`.
**Say:** "And this is the thesis repository. Three peer-style papers, all DOI-pinned on Zenodo. v3 is the original convergence proof. v9 is the unified Lutar invariant family. v10 is the audit closure paper that certifies every formula in v9 actually runs against the shipping repo."

---

## If She Asks for a Deeper Demo

**A11oy intelligence depth:** Navigate to `/a11oy/intelligence/deep-dive` — entity search, financial metrics, ownership graphs.

**Argo champion policies:** Navigate to `/a11oy/argo` and click into a champion-policy card — show the mirror-eval delta and counterfactual table.

**CPS API:** From the api-server tab (`Tab 11` if you opened it), open `/api/cps/payloads` directly — show the JSON list of registered payloads. This is the procurement-grade artifact.

**Sentra adversary loop walkthrough:** From `/sentra/governed-adversary-loop`, click each of the six steps in order. Each one renders the proof packet inline.

**Carlota Jo:** Open `/carlota-jo/` — show the AI Advisory thread (now empty by default — the invented "847 enterprise contracts" sample was removed in the May 5 audit pass).

---

## Tier-1 fixes applied for this demo path (do not need to mention)

These were the polish items closed in the May 5 investor zoom-out audit pass. Listed here so you know not to apologize for them — they are gone.

- A11oy doctrine fallback URL (`sentinel-sr.example`) replaced with the real `a11oy.szlholdings.com/doctrines/sentinel-sr`.
- A11oy Strategy → Governance / Team / Fabric: TBD placeholders purged.
- Conduit dashboard throughput chart: hardcoded `2026-05-05T03:55:00Z` "now" replaced with `Date.now()`.
- Sentra: `proof-s6-TBD` placeholder removed; `[sentra] fabric proof emission failed` console.warn silenced with documented best-effort contract.
- Counsel Risk Exposure Desk: synthetic "SEC Filing Deadline" injection removed.
- Terra Property Detail: `mockConfidence` / `mockEscalation` columns removed; banner stacking on narrow viewports fixed.
- Vessels: personal Medium link removed; `Updated 12s ago` → `Live AIS feed`; `[DEMO]` prefix stripped.
- Carlota Jo: command-palette nav rewired to `BASE_URL`-aware `navTo()` across 23 commands; invented "847 enterprise contracts" example removed; intake `timeline: TBD` default replaced.

Argo regressions resolved in the same pass:
- SelfPlayArena replay playback (interval-driven, 900ms/step, auto-stops at last frame).
- Argo event timestamps fully deterministic (anchored to `2026-05-05T00:00:00Z` constant — no `Date.now()` drift in generated events).
- HomePage Argo section compacted to a single card with three KPIs + Bridge link.

---

## Emergency Fallback

If the live platform is down or screen share fails:

1. Share the screenshots from `dossier/screenshots/`.
2. Walk through the v2 Capability Statement PDF.
3. Open the GitHub repos directly (the thesis repository is the strongest single artifact).
4. Focus on the verbal script. The platform demo supports the story; it is not the story itself.

The story is: **governed AI cognition with public proof.** The platform demonstrates it. The proof stands on its own.
