# Vessels — Investor Walkthrough Script

A 9-step demo that walks an investor through the Vessels artifact in ~12 minutes. Every step references a real route, a real persisted table, and (where relevant) a Λ-receipt hash you can verify on screen.

Pre-flight (do once before the room):
- `pnpm --filter @workspace/api-server seed:vessels:investor` plants one
  vessel with a sanctions hit, one anomaly above 0.7, one overdue
  maintenance item, and 90 days of risk-score history.
- Confirm the api-server, the vessels web artifact, and the a11oy
  artifact are all green in workflows.
- `pnpm dev` against `artifacts/vessels`. The script assumes the operator dashboard (`/dashboard`).

---

## 1. Landing & Command Overview (90s)

Open `/vessels/`. Read the one-line thesis aloud: *"Vessels is the
operator surface for ocean-going risk — sanctions, anomalies, voyage
economics — with a receipt for every decision."* Click **Enter
platform**. Land on the Command Overview (`/dashboard`).

Lead with "this is what a maritime risk operator sees at 06:00 UTC." Point at the KPI strip — fleet count, open exceptions, sanctions exposure, average Λ. Numbers come from `/api/vessels` and `/api/vessels/formula/risk-history/*`.

Investor takeaway: this is operational, not marketing. Every number on this screen has a receipt.

## 2. Fleet List & Behavioural Risk Scoring (90s)

Sort by composite Λ risk descending. Top row is `MV TAMAR EXPRESS` (seeded). Click into it or navigate to `/risk-scoring`.

Show the radar — six axes, one accent. Pick the top-risk vessel (Λ ≈ 0.9). Click **Show the math**. The Sheet opens, expression renders verbatim:

```
Λ = clamp( severity · likelihood · valueAtRisk / cap , 0, 1 )
```

Point at the Λ-receipt hash in the footer. Tagline: **"the formula is the product, not the chart."**

## 3. Vessel Detail & 90-day Λ history (60s)

KPI strip shows IMO, MMSI, vessel type, current lat/lng, current speed, heading. All values render in tabular-num monospace and pull live from the API — no placeholders.

The line chart pulls from `vessels_risk_history` (table) via `/api/vessels/formula/risk-history/:vesselId`. The chart renders real numerics on first paint.

Investor takeaway: every number on the page is a real number from a real persisted table. Each row carries the receipt hash that produced it.

## 4. Run a live recompute (60s)

Click the **Show the math** affordance next to the composite number. The Λ weighted geometric mean expands inline with the live inputs, the weights, and the receipt ID of the most recent compute.

POST `/api/vessels/formula/risk-recompute` from the in-page **Recompute now** button. The composite ticks (400ms ease), the 90-day trend line gains a new point, and a new row appears in the page-footer receipt strip.

Investor takeaway: the math is auditable in-page and every compute emits a receipt.

## 5. Route Anomaly Engine & A11oy Handoff (1.5m)

Click the **Anomalies** tab or navigate to `/route-anomaly-engine`. SSE feed renders the seeded anomaly at the top with severity 0.82, type `route_deviation`. Click it. Evidence panel populates with the AIS track that triggered the detection. Show the `// AMARU_HOOK: third_eye_pattern` marker in the developer-tools view — this is the attach point for the brain runtime.

Note the **A11oy handoff ID** chip — every anomaly above the 0.7 threshold fires `crossProductHandoff` and the ID is persisted in the `vessels_anomaly_detections` table next to the receipt hash.

Tagline: **"the moment a detection clears 0.7, it's no longer just Vessels' problem — it's an A11oy workcell."**

## 6. Open A11oy workcell — cross-product handoff (1m)

Click **Open A11oy workcell**. The page hands off to the A11oy artifact with the anomaly context as the payload. A workcell appears with the maritime-routing template. Navigate back to Vessels. The **Recent A11oy decisions** panel on the Vessel Detail page now lists the workcell with a link back into A11oy.

Investor takeaway: the platform is one fabric, not a folder of disjoint apps.

## 7. Voyage Calculator + Monte Carlo (120s)

Navigate to `/voyage-calculator`. Pick VLCC + Ras Tanura → Rotterdam. Submit. Show the deterministic P&L (revenue, costs, TCE, break-even freight).

Then click **Run Monte Carlo (2,000 iterations)** — calls `/api/vessels/formula/voyage-monte-carlo`. p10 / p50 / p90 land on screen. Click **Show the math** on the p50 — Sheet renders the Gaussian sampling formula. The calculation lands in `vessels_voyage_calculations` with its receipt.

## 8. Bunkering & Sanctions Screening (1.5m)

Navigate to `/bunkering`. Map shows the seeded bunker stations (Singapore, Rotterdam, Fujairah, etc.) with live prices, wait times, and quality scores. Investor takeaway: **"this is operational data, not a brochure."**

Navigate to `/sanctions-screening`. Trigger a screen on the seeded vessel. OFAC status badge flips to **HIT**. The A11oy handoff fires automatically because the policy threshold tripped. Show the ownership network graph in the **Sanctions Chain Explorer**.

## 9. Receipt inspector & closing (90s)

Open the receipt drawer (top-right). Show the most recent N receipts from the `vessels-formula-thesis` chain — each linked to its predecessor via `prevHash`. Pick one, expand, show:
- formula id (e.g. `normalizedRiskScore`)
- inputs hash + result hash
- sequence number
- `selfHash` and `prevHash`

Closing line: *"Every number you saw is from a persisted table. Every decision left a receipt. The math is in-page, not in a slide. That's the bar."*

---

## What to NOT click

- `/cortex/*` deep tabs — they have great content but they branch the narrative.
- Anything tagged `// AMARU_HOOK:` — deferred behind that marker.
- The warm-gold redesign surfaces (still landing under #5096).

## If something breaks

- If a chart is empty: hit the recompute / detect button on the page — both routes seed shape on first call.
- If a receipt hash is missing: the in-memory ReceiptChain resets on server restart. Run any compute endpoint once to re-bootstrap the chain.
- If a page 404s: check that `vessels-formula-thesis` is registered in `artifacts/api-server/src/routes/groups/vessels.ts`.
