# FOUNDER_TOUR.md — a11oy as the One Front Door

A 10-step walkthrough for the founder (and for showing Greene, customers, and judges).
Everything below is **live** on the a11oy Brand Orchestration Layer at
`https://szlholdings-a11oy.hf.space`. Open the tabs in order; each is one click from the
nav bar or from the Hub index.

> Doctrine v12 (PURIQ). LOCKED numbers appear verbatim in every tab footer:
> **749 declarations · 14 axioms (15 raw, 1 dup) · 163 sorries (112 baseline + 51 Putnam) ·
> 13-axis yuyay_v3 · lutar-v18.0.0 @ c7c0ba17 · SLSA L1 (honest) · Khipu signature =
> DSSE/cosign PLACEHOLDER.**

---

### Step 1 — `/hub` · The one front door
Open **`/hub`**. This is the founder's single pane: a grid of every tab plus a one-line
description of each, and a machine-readable manifest at `/api/a11oy/v1/hub/manifest`
(Khipu-receipted). The pitch line: *"Every cross-cutting concern across the SZL stack has
a place here — you never have to remember which Space holds which truth."* From here you
can reach the orchestrator chat (`/a11oy.code`) and the audit DAG (`/audit`).

### Step 2 — `/a11oy.code` · Talk to the orchestrator
Click **`/a11oy.code`** (shipped by the sibling orchestrator build, commit `f1e76d01`). This
is the conversational unified-LLM router with tool-calling, SQLite memory, the PURIQ gate,
and Khipu receipts. The story for the room: *"a11oy isn't a static dashboard — you can ask
it to do things, and every action it takes is receipted."* The hub does not duplicate it;
it simply links to it as the brain's voice.

### Step 3 — `/docs` & `/pricing` · The customer-facing front
Open **`/docs`** then **`/pricing`**. Docs is the customer documentation index; Pricing
shows the honest commercial ladder — **Demo (free; Greene-network / academic) → Builder
(Stripe) → Professional → Enterprise (contract) → DoD (IDIQ)** — with honor-system
metering. The line to use: *"We can sell tomorrow morning; the surface is real, and the
metering is honest, not theatrical."* (Note: the canonical Swagger API explorer moved to
`/api/docs` so the branded Docs tab can own `/docs`.)

### Step 4 — `/api-keys` & `/sdk` · How a customer actually integrates
Open **`/api-keys`** (issuance, scopes, rotation, cosign tamper-evidence) and **`/sdk`**
(Python + TypeScript SDK references and install). For a technical buyer or judge: *"Here's
the key, here's the import, here's the call — minutes to first receipt."* The SDK samples
trace back to the `customer_surface` deliverables (`SDK_SPEC_PYTHON_TS.md`).

### Step 5 — `/status` & `/observability` · Is it up, and can I see it?
Open **`/status`** (per-flagship live status feed) then **`/observability`** (the single
pane: uptime, latency, Khipu DAG depth, Yuyay distribution, HUKLLA firings). This answers
the gap report's #2 "single-pane /dashboard/everything" ask directly. The line: *"One screen
tells you the whole stack's health and the governance signal behind it."* Backed by the
`resilience_observability` deliverables (circuit breakers, degradation paths).

### Step 6 — `/security` · Honest posture, counted out loud
Open **`/security`**. This is the traffic-light scorecard from
`CURRENT_SECURITY_POSTURE.md`: **strong governance/provenance substrate (Lean-proved Λ
gate, DSSE receipts, Khipu Merkle DAG) on a weak web edge (wildcard CORS, no headers, no
auth) with an incomplete signing story (1/6 bundles signed, SLSA L1).** The cosign public
fingerprint `1f00187d…0e3dbc7` and the RFC-9116 VDP are shown. The line judges respect:
*"We tell you exactly where we're weak — the security-headers patch is authored and staged,
not silently force-applied, because force-applying a strict CSP would regress the SPA."*

### Step 7 — `/compliance` · The certification path, no fibs
Open **`/compliance`**. Honest checkboxes: **SOC 2 / FedRAMP / DoD IL5 / CMMC are all
PRE-WORK — none certified.** Each shows blockers and the enabler. The headline enabler:
*"Deploying inside UDS Core inherits the IL5-targeted boundary (Keycloak SSO, Istio mTLS),
which is the clean path."* This is the difference between a credible roadmap and vaporware.

### Step 8 — `/cued-engagement` · Yachay-Dome: the brain, not the trigger
Open **`/cued-engagement`** and pull the sample target package from
`/api/a11oy/v1/hub/cue/sample`. Walk the **one-way evidentiary handoff**: a signed package
with track + 4-color classification + MIL-STD-2525 SIDC + predicted impact + recommended
(non-binding) tier + ATAK CoT XML + full Body-of-Evidence — **and no actuation token.** The
`Dome(a)∈[0,1]` legal gate zeroes utility on jam/spoof/hack/kinetic. The signature line for
the room: ***"We are the brain, not the trigger. The Title-10/50 customer pulls the trigger;
we hand them court-admissible evidence."***

### Step 9 — `/counter-uas` & `/uds` · The drone flag, instilled
Open **`/counter-uas`** (the founder's "drone flag"): the DoD Group 1–5 table, threat tiers
T0–T4, and the explicit legal/cyber boundary — *passively sense, identify, track, predict,
warn, cue = allowed; jam/spoof/hack/intercept = forbidden (47 USC §333/§302a, Title 10/50,
CFAA).* Then **`/uds`**: the American-made supply-chain allies map — Chainguard, Anchore
(Syft/Grype), Sigstore (Cosign/Fulcio/Rekor), in-toto, SLSA, **Defense Unicorns** (Zarf /
UDS Core, who demoed updating an air-gapped drone under EW attack). The line: *"The drone
story is now first-class in the hub — detection doctrine and the deployment ecosystem in
two clicks."*

### Step 10 — `/audit` & `/gap-report` · The Greene trick, and radical honesty
Finish on **`/audit`** — the Khipu DAG visualizer across all flagships: the live receipt
graph behind every claim, the move that wins technical-credibility rooms ("don't trust the
slide, walk the graph"). Then **`/gap-report`** — the founder-facing heatmap
(GREEN/AMBER/RED per organ) and the honest "this-week top 5." Closing line: ***"a11oy doesn't
just show you what works — it shows you, in one place, exactly what doesn't yet, with
receipts. That honesty is the moat."***

---

## How to run the tour safely on the day
The Space is under active multi-agent development. **Right before the tour**, re-assert the
hub wiring and re-confirm (idempotent, preserves all sibling work):
```bash
python3 a11oy_hub_integration/rebase_push_a11oy_hub.py
curl -s -o /dev/null -w "%{http_code}\n" https://szlholdings-a11oy.hf.space/hub        # 200
curl -s https://szlholdings-a11oy.hf.space/api/a11oy/v1/hub/manifest | head -c 120     # khipu_receipt
```

*Signed: Yachay · Co-author: Perplexity Computer Agent · Doctrine v12 (PURIQ) additive.*
