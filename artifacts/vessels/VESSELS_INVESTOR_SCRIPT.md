# Vessels — Investor Walkthrough Script

8 steps, ~7 minutes, fresh database. The script doubles as the spec for
`tests/e2e/investor-walkthrough.spec.ts`.

Pre-flight (do once before the room):
- `pnpm --filter @workspace/api-server seed:vessels:investor` plants one
  vessel with a sanctions hit, one anomaly above 0.7, one overdue
  maintenance item, and 90 days of risk-score history.
- Confirm the api-server, the vessels web artifact, and the a11oy
  artifact are all green in workflows.

---

## 1. Landing → enter the platform (45s)

Open `/vessels/`. Read the one-line thesis aloud: *"Vessels is the
operator surface for ocean-going risk — sanctions, anomalies, voyage
economics — with a receipt for every decision."* Click **Enter
platform**. Land on the Fleet List.

Investor takeaway: this is operational, not marketing.

## 2. Fleet List → pick a real vessel (30s)

Sort by composite Λ risk descending. Top row is `MV TAMAR EXPRESS`
(seeded). Click into it.

Investor takeaway: the ordering reflects a single composite score, not
ad-hoc filters.

## 3. Vessel Detail → real data on first paint (45s)

KPI strip shows IMO, MMSI, vessel type, current lat/lng, current speed,
heading. All values render in tabular-num monospace and pull live from
the API — no placeholders. Point at the **Recent A11oy decisions** panel
on the right rail: empty for now, we'll fill it in step 5.

Investor takeaway: every number on the page is a real number from a
real persisted table.

## 4. Route Anomaly Engine → live anomaly feed (1m)

Click the **Anomalies** tab. SSE feed renders the seeded anomaly at the
top with severity 0.82, type `route_deviation`. Click it. Evidence panel
populates with the AIS track that triggered the detection. Show the
`// AMARU_HOOK: third_eye_pattern` marker in the developer-tools view
(or just mention it) — this is the attach point for the brain runtime
once #5176 lands.

Investor takeaway: detections persist across restarts and the brain
integration has a marked seam.

## 5. Open A11oy workcell → cross-product handoff (1m)

Click **Open A11oy workcell**. The page hands off to the A11oy artifact
with the anomaly context as the payload. A workcell appears with the
maritime-routing template. Navigate back to Vessels. The **Recent A11oy
decisions** panel on the Vessel Detail page now lists the workcell with
a link back into A11oy.

Investor takeaway: the platform is one fabric, not a folder of disjoint
apps.

## 6. Risk Scoring → recompute live with "show the math" (1m 30s)

Open the **Risk Scoring** tab. Big number: composite Λ score 0.71. Per-
driver bar chart shows sanctions (0.9 × weight), AIS-anomaly (0.82 ×
weight), maintenance-overdue (0.4 × weight), PSC (0.2 × weight), route-
deviation (0.65 × weight). Click the **Show the math** affordance next
to the composite number. The Λ weighted geometric mean expands inline
with the live inputs, the weights, and the receipt ID of the most
recent compute. Click **Recompute now**. The composite ticks (400ms
ease), the 90-day trend line gains a new point, and a new row appears
in the page-footer receipt strip.

Investor takeaway: the math is auditable in-page and every compute
emits a receipt.

## 7. Bunkering → real quote on real prices (1m)

Open the **Bunkering** tab. Map shows the seeded bunker stations
(Singapore, Rotterdam, Fujairah, Houston, Antwerp, Hong Kong, Panama,
Gibraltar) with live prices. Pick Fujairah. Click **Get quote**. Modal
shows total cost USD, ETA hours from current AIS position, voyage delay
hours, margin impact, and a recommendation. The recommendation uses the
same Λ operator weighing cost vs delay vs availability — open the
**Show the math** affordance to prove it.

Investor takeaway: pricing and recommendation are real, not canned.

## 8. Sanctions Screening → block + automatic A11oy handoff (1m)

Open the **Sanctions Screening** tab. Trigger a screen on the seeded
vessel. OFAC status badge flips to **HIT**. The A11oy handoff fires
automatically because the policy threshold tripped. Navigate back to
the Vessel Detail page. The **Recent A11oy decisions** panel now lists
two workcells: the anomaly review from step 5, and the sanctions block
from this step. Each has its own receipt.

Investor takeaway: governance is automatic — the operator never has to
remember to escalate.

---

## Closing line

*"Every number you saw is from a persisted table. Every decision left a
receipt. The math is in-page, not in a slide. That's the bar."*
