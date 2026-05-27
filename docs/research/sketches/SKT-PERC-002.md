---
id: SKT-PERC-002
title: Peak detection as cross-domain primitive
disposition: productionised
source: docs/research/perception-bio-synthesis-2026.md §3, §7
package: '@workspace/anomaly-fabric (peak-detector, ranked-candidates)'
receipt-class: peak.detection.v1, peak.classification.v1
---

# SKT-PERC-002 — Peak detection as cross-domain primitive

The MsdialWorkbench peak detector lifts cleanly to **any** event-shaped
scalar surface — AIS trajectories, log windows, metric surfaces — not
just LC-MS data. The cross-domain re-expression is the multi-factor
score (`α·prominence + β·snRatio − γ·shape_residual`) and the
ranked-candidate output shape (never collapse to one label without
`cutoffChosenBy`).

Distinct from AGI-§6 Time-R1 drift: drift describes baseline shift,
peaks describe event-shaped excursions. Both detectors live in the
same package neighbourhood, neither replaces the other.

**Disposition rationale.** `productionised` once Vessels + Sentra
consume the extension in their integration tasks.
