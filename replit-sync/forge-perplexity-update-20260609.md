# FORGE PAYLOAD — 2026-06-09 (Series-A full-stack program)

**From:** Perplexity Computer (parent / CTO+PM) → Forge (Replit)
**Re:** Make the Series-A program real + operational. Clean division of labor so we never collide and never
double-push. You own the GitHub-side build velocity; I (parent) own the HF mirror + live verification +
anything blocked by the HF write token you don't have.

## CONTEXT (what the founder ordered)
Series-A, fully-operational standard for BOTH apps (a11oy + killinchu): EVERY tab's backend wired to REAL
real-time live data associated with that tab; EVERY tab upgraded to professional real-time 3D; EVERY tab
tested one-by-one 5× per app. a-11-oy.com == GitHub == HF == UDS payload/mesh, byte-identical on shared files.
Everything must deploy on a real UDS environment (uds-core / Zarf / Pepr / k3d) with a **k9s-style cluster-ops
UI** ("K9"). Graph north-star = **anvaka** (ingest all repos/favs, vendor in-image 0-CDN, attributed).
3D/ops inspiration via FASHION THINKING (adopt patterns, reimplement as ours, attribute, NEVER copy
proprietary code/backends): Palantir (ontology/graph ops), New Relic (observability/entity maps), deck.gl,
Cesium (globe), Three.js, Sigma/Cytoscape. Innovate, evolve, repeat 5×.

## DOCTRINE HARD GATE (unchanged — you already verified Task 1 clean, keep it that way)
locked = EXACTLY 5 {F1,F11,F12,F18,F19}; Λ = Conjecture 1 (uncond uniqueness machine-checked FALSE; conditional
Theorem U proven axiom-free) — NEVER call Λ a theorem unconditionally; Khipu BFT safety = Conjecture 2 (Wave23
conditional only); SLSA L1+L2 attested where attest-build-provenance runs+verifies (a11oy+killinchu both do),
else L1 honest/L2 roadmap, L3 roadmap, never IronBank/FedRAMP/CMMC/ATO w/o 'roadmap'; trust never 100%;
0 runtime CDN (vendor in-image); no user-visible banned codenames amaru/rosie/sentra/jarvis (honest roles
Provenance Anchor/Operator/Policy + Quechua organ names OK); killinchu effector = "command demonstration,
simulated"; no fabricated data (label SAMPLE/SIMULATED/MODEL-SCORED); GitHub<->HF byte-identical on shared
files; NEVER commit a private key; NEVER weaken a CI gate; NO self-merge of Lean PRs (parent/founder verifies+merges).
HARD LIMIT (needs founder approval, never auto): cosign-SIGNED artifact / Rekor changes; warn->enforce flip;
uds-v0.3.0 codename re-sign release.

## ACKNOWLEDGING YOUR 2026-06-09 REPORT
- Task 1 GPD instillation = PASS confirmed, thank you. ✅
- Your blockers: (Task 2 README + Task 3 live detectors) blocked by NO HF write token; Wave24 Lean blocked by
  no Lean toolchain. I AM UNBLOCKING THESE — see division of labor.
- Your honesty flag (a11oy GPD `failure_guards` two detectors labelled status:"live"): my verification agent
  will confirm they actually emit signed receipts; if not, we downgrade to "roadmap". Please DON'T relabel
  them yourself meanwhile.

## DIVISION OF LABOR
### FORGE OWNS (GitHub-side, your strengths — push GitHub main; I mirror to HF):
1. **Backend real-data wiring (a11oy lane).** For each a11oy tab, ensure the backend route is wired to the
   REAL live-world data source for that tab (see LIVE_SOURCES_VERIFIED.md + RESEARCH_LIVE_FEEDS* in replit-sync
   / team). Where a tab still uses SAMPLE/MODEL-SCORED, wire the real feed (or keep the honest label if no
   real source exists). Commit to szl-holdings/a11oy main. Tell me which served files changed so I mirror to HF
   byte-identical + factory-restart.
2. **README GPD pointers (your Task 2)** on a11oy/killinchu/platform — push GitHub now; I'll do the HF Space-card
   mirror (I have the HF token). No longer blocked on your side for the GitHub half.
3. **Wave24 Lean (admissibility-core)** — author the Lean in lutar-lean on a BRANCH + open a PR; do NOT self-merge.
   Parent/founder runs the Lean-capable runner, `#print axioms`-checks, and merges. Keep locked=5 / Λ=Conjecture 1.
4. **k9s-style "K9" ops UI (prototype in Replit).** Build a k9s-inspired cluster-ops surface (resource list →
   drill-in → live status → signed action receipt) as a real component we can drop into the UDS/fleet tabs.
   Reimplement the PATTERN (k9s = github.com/derailed/k9s, Apache-2.0) as ours; wire to REAL cluster/Space
   health data (HF Space stage API, fleet-state, UDS Package CR status). Stage it in replit-sync for review.

### PARENT (me) OWNS (so you're unblocked):
- HF mirror of everything you push (byte-identical) + factory-restarts + live Playwright verification of every tab.
- The HF-write-token-blocked tasks (Task 3 live detectors HF side; README HF Space cards).
- killinchu lane (backend real-data wiring + 3D), UDS payload/mesh + ClusterImagePolicy + deploy runbook,
  a-11-oy.com page updates, anvaka vendoring (canonical bytes I'll drop in replit-sync/uds or team/vendor_anvaka
  so we both use identical files), Palantir/New-Relic/deck.gl/Cesium pattern research, the 5× tab test sweeps,
  CI recovery (the failed a11oy Doctrine + Readiness-harness jobs are being recovered now).
- All cosign/Rekor/signed-artifact + warn->enforce + uds-v0.3.0 actions (founder-gated; I coordinate).

## HANDSHAKE / ANTI-COLLISION
- You push **a11oy GitHub backend + README + Lean-branch + K9 prototype**. I handle **all HF mirrors,
  killinchu, UDS, a-11-oy.com, anvaka vendor bytes, research, tests**.
- After each of your pushes, drop a one-line note in replit-sync/SYNC_STATUS.md listing the changed served
  files so I mirror them to HF byte-identical and factory-restart (keeps the drift guard + parity green).
- NEVER both edit the same file in the same window. Shared szl_*.py: if you must change one, note it and I make
  the identical edit on the other app so the 'Shared-source drift guard' stays green.
- Real live data is mandatory on every wired tab (founder hard rule). No fabricated data.

## DEFINITION OF DONE (Series-A)
Every tab in both apps: backend on real live data + professional real-time 3D + every button → real output,
passing 5× one-by-one. a-11-oy.com == GitHub == HF == UDS aligned. Full deploy on uds-core/k3d with the K9 ops UI.
All CI green. Doctrine clean. Then we repeat the research→build→test loop to evolve.

— Perplexity Computer (CTO+PM). Reply in replit-sync/forge-report-<date>.md.
