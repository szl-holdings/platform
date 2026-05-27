# SCADA / Adaptive-Polling synthesis 2026

**Status:** seventh entry in the SZL synthesis-ledger series
**Source paper:** Nazari, Ens, Bevin, MacDonald, Aly. *An Adaptive Cloud-Integrated SCADA Platform with Embedded Fault Classification for Intelligent Smart Grids*, Dalhousie University / Sun Kissed Energy (2025). PDF at `attached_assets/file_BBE50750-CCEA-4BEF-BE72-DA8787E8C31A_1779914834403.pdf`.
**Sibling synthesis docs:**
- `docs/research/agi-stack-synthesis-2026.md`
- `docs/research/perception-bio-synthesis-2026.md`
- `docs/research/electrodynamics-synthesis-2026.md`
- `docs/research/sparse-attention-synthesis-2026.md`
- `.agents/memory/ising-synthesis-2026.md`
- `.agents/memory/memo-reflection-kit-absorption.md`

This document is **synthesis, not implementation.** Evolution tasks (one per shared package, one per receipt class) read from this doc.

---

## 1. Frontier-fit decision

A synthesis is admitted to SZL only if it removes a gap that current SZL surface cannot close on its own. The honest gate:

| Paper contribution | Already in SZL? | Frontier gap? |
|---|---|---|
| Cloud-API SCADA aggregation (REST → Django → Postgres) | Generic web pattern, not SZL-novel | NO |
| Role-based access control + TLS 1.3 + token auth | Standard. SZL has this through ouroboros + clerk-auth | NO |
| Isolation-Forest anomaly detection | Generic ML, not in SZL receipts | **YES** — score `s(x)` is not receipt-emittable today |
| XGBoost fault classification with precision/recall bounds | Generic ML, not in SZL receipts | **YES** — classifier-quality bounds are not Λ-gate-witnessable today |
| LSTM 168h-lookback day-ahead forecast with RMSE/MAPE bounds | Not in SZL | **YES** — forecast-quality witness is the missing primitive for any predictive control path |
| **Adaptive polling with exponential backoff under rate-limit pressure (eq 1)** | **Not in any SZL surface** | **YES — this is the strongest absorption** |
| Multi-vendor telemetry register fusion (Modbus + CANbus → unified schema) | Amaru does convergence, not register-level vendor fusion | **YES** — Amaru can absorb this as a sub-primitive |
| 5-layer SCADA architecture (hardware → API middleware → app → scheduler → UI) | Generic system design | NO |
| OWASP-ZAP / Burp / sqlmap penetration validation as a receipt-class | Sentra has security receipts, not SCADA-penetration receipts | **YES (weak)** — narrow surface |

**Frontier-fit verdict:** PASS. Five real absorptions, the strongest of which (governed adaptive polling) is a missing Λ-axis affecting **every artifact that polls an external feed** (ROSIE → market & threat feeds, Vessels → AIS, Sentra → CVE/CTI feeds, A11oy → upstream brand telemetry, Amaru → multi-source convergence). This is genuinely cross-cutting.

---

## 2. The five new primitives

### 2.1 Governed Adaptive Poller (GAP) — the headline absorption

The paper's eq(1):
```
T_poll(t+1) = min(T_max, T_poll(t) · α)   if Δ_data(t) < θ_low      (back off — quiet feed)
T_poll(t+1) = max(T_min, T_poll(t) / β)   if Δ_data(t) > θ_high     (accelerate — active feed)
T_poll(t+1) = T_poll(t)                    otherwise                 (hold)

α = 1.5   β = 2.0   T_min = 5 min   T_max = 30 min
θ_low = 0.1 kWh   θ_high = 1.0 kWh   (domain-specific thresholds)
```

Reported gains: **94% bandwidth reduction** in quiet periods, **98.7% data availability** in active periods, rate-limit-violation rate dropped from **23% (fixed-polling baseline) to 0.3%**.

**SZL absorption form:** the formula is domain-agnostic. Replace `kWh` with any L¹ data-change-rate norm `‖x_t − x_{t-1}‖₁` on the feed's tensor. Replace the API rate-limit with the upstream provider's published or measured rate cap.

**New shared package:** `packages/poll-kit` (`@szl-holdings/poll-kit`)
- `AdaptivePoller<TFeed>` class: takes `(rateLimit, dataChangeRateFn, minMaxBounds, alphaBeta)`, returns a stream of `PollDecision` records.
- `PollDecisionReceipt`: serialized poll-decision envelope, hash-chained to the prior decision.
- `RateLimitWitness`: independent witness of "we did not exceed N calls/hour in the prior window" — cosign-blob-signable.

**New Λ-axis** (axis 10, extending the 9-axis Lutar Invariant):
```
λ₁₀ = bandwidth-pressure-tension
    = (calls_used_in_window / rate_limit) × max(0, θ_low - Δ_data(t)) × (T_poll(t) / T_max)
```
Reads as "we are polling fast on a quiet feed near our rate cap" — i.e. cost-spent on negative-evidence. The deny-by-default rule: admission gate refuses to issue another poll if λ₁₀ exceeds the configured ceiling. This makes the bandwidth-saving rigorous (the 94% number becomes provable per-deployment, not anecdotal).

**Honest caveat & uniqueness note:** adding a 10th axis requires extending the lutar-lean uniqueness proof (`packages/lean-formulas/Egyptian.lean` and `Invariant.lean`). The current proof discharges 9-axis uniqueness; adding axis 10 is a new lemma, not a re-derivation. **Do not ship `sense.poll.v1` to a Λ-gate that still claims 9-axis uniqueness** — the doctrine-v6 scanner will (correctly) flag the drift. Sequence: (1) extend lean proof, (2) cut new lutar-lean release with `λ₁₀` lemma green, (3) then admit the new axis to the runtime gate.

### 2.2 Anomaly-Score Witness

Isolation-Forest score from the paper:
```
S(x, n) = 2^(−E(h(x)) / C(n))
C(n)    = 2·H(n−1) − 2(n−1)/n           where H(k) = harmonic number
```
Threshold: alert if `s(x) > 0.7` for 3 consecutive intervals.

**SZL absorption form:**
- `sense.anomaly.v1` receipt class — emitted by any artifact running an Isolation-Forest (or equivalent unsupervised outlier detector) over a telemetry feed.
- Envelope fields: `featureVectorHash`, `score`, `threshold`, `consecutiveAboveCount`, `treeEnsembleHash`, `contaminationFactor`, `normalizationCFn` (so `C(n)` is reproducible bit-identically across replays).
- **Privacy invariant:** raw feature vectors NEVER cross the membrane. Only the hash + score. Mirror the perception-loop privacy rule (memory: `a11oy-perception-reviewer-wiring.md`) — enforce in a serialization test that `featureVector` bytes never appear in the envelope.

### 2.3 Classifier-Quality Bound (XGBoost)

Paper reports XGBoost on 2,400 labeled samples: **97.2% accuracy, 96.1% precision, 98.4% recall**.

**SZL absorption form:**
- `sense.classification.v1` receipt class — fault/intent/threat classification with attested model-quality bounds.
- Envelope fields: `modelHash`, `labelSpaceHash`, `precision`, `recall`, `accuracy`, `f1`, `evaluationSampleCount`, `evaluationSetHash`, `decision`, `confidence`.
- **Contradiction-probe (per sparse-attention synthesis lesson):** if observed live-traffic confidence distribution drifts beyond JSD threshold from the evaluation-set distribution, escalate to a human-reviewed receipt class. Do not silently accept that the classifier still meets its published bound.

### 2.4 Forecast-Quality Bound (LSTM)

Paper reports LSTM (128/64/32 stacked, dropout 0.2, Adam, 180-day training) at **RMSE 0.47 kWh and MAPE 5.2% on next-day aggregated generation**, beating ARIMA's 6–10% MAPE.

**SZL absorption form:**
- `sense.forecast.v1` receipt class — any time-series forecast with attested error bounds.
- Envelope fields: `modelHash`, `inputWindowHash` (the 168h lookback), `exogenousFeatureHash`, `forecastHorizon`, `rmse_validation`, `mape_validation`, `trainingDatasetHash`, `forecastVector`, `confidenceInterval`.
- **Distribution-shift guard:** the paper itself flags that forecast accuracy degrades under weather conditions not represented in training. The receipt MUST embed a `inputDistributionDistance` field — JSD between current input window and the training-set window distribution. Downstream consumers receive a quantified staleness signal, not a silent silent-failure.

### 2.5 Telemetry-Fusion Witness

Multi-vendor fusion (Modbus RTU + CANbus → unified register schema) reported at <1% MAE across power/voltage/current/energy/SOC.

**SZL absorption form into Amaru:**
- `sense.fusion.v1` receipt class — declares "I aggregated these N upstream sources into this unified schema with this measured fidelity vs. reference."
- Envelope fields: `sourceHashes[]`, `unifiedSchemaHash`, `referenceSourceHash`, `mae`, `mapeByMetric`, `rmseByMetric`, `samplesEvaluated`.
- Amaru already does convergence (memory: existing Amaru artifact `convergent multi-source data sync`). This adds the *fidelity-attestation* layer — convergence WITH a measured-against-reference receipt, not just "we merged the streams."

---

## 3. Receipt classes summary (five new)

| Class | Emitted by | Replaces today's | New ground covered |
|---|---|---|---|
| `sense.poll.v1` | any external-feed poller | nothing (raw `fetch` calls) | bandwidth governance under λ₁₀ |
| `sense.anomaly.v1` | unsupervised outlier detector | nothing | model-attested anomaly score + threshold + privacy-by-hash |
| `sense.classification.v1` | supervised classifier | nothing | precision/recall/f1 carried with the decision |
| `sense.forecast.v1` | any time-series forecaster | nothing | RMSE/MAPE + distribution-shift distance |
| `sense.fusion.v1` | Amaru convergence stage | partial — Amaru emits convergence but no fidelity bound | measured-against-reference fidelity attestation |

All five envelopes carry the existing `Proof Chain` hash-chain field (`prev`), the existing `lambda` axis vector (now 10-element), and the cosign blob `.sig` signing identity-regex slot.

---

## 4. Warhacker × SCADA matrix (cross-artifact integration map)

For each existing SZL artifact, which of the five new primitives ships first:

| Artifact | First absorption | Why |
|---|---|---|
| Vessels | `sense.poll.v1` over the AIS feed; `sense.anomaly.v1` over per-vessel kinematic outliers | AIS is rate-limited; vessel-deviation is the headline use case |
| ROSIE | `sense.poll.v1` over upstream market/intel feeds; `sense.forecast.v1` for governed-decision foresight | ROSIE is the governed-decision fabric — forecasts must come with bounds |
| Sentra | `sense.poll.v1` over CVE/CTI feeds; `sense.classification.v1` for threat-category attribution | both already implied by Sentra's existing surface — receipts make them auditable |
| A11oy | `sense.fusion.v1` over multi-source brand telemetry | A11oy already mixes sources (peak-detector + reviewer-presence per existing memory) — fidelity bound is the missing receipt |
| Amaru | `sense.fusion.v1` (primary) + `sense.poll.v1` for each upstream | Amaru IS convergence — fusion-fidelity attestation is its raison d'être |
| api-server | hosts all five receipt-class verifiers as routes (`/sense/poll`, `/sense/anomaly`, …) | mirrors how `/perception/*` and `/electrodynamics/*` are hosted today |

---

## 5. Doctrine receipts (where the existing SZL doctrine binds the new primitives)

- **Λ-gate uniqueness** — 9-axis → 10-axis extension. Discharge in `packages/lean-formulas/Invariant.lean`; cut `lutar-lean v0.2.0`; only THEN admit `λ₁₀` to runtime.
- **Proof Chain** — every `sense.*.v1` receipt carries `prev` hash, bit-identical replay testable.
- **9-step governance loop** — `sense.*.v1` receipts populate step 1 (signal) and step 8 (proof). Step 4 (simulation) can consume `sense.forecast.v1` for "what would the forecast have said before the policy was applied?"
- **KS-18 contextuality witness** — every `sense.*.v1` receipt enters the same O(1) contextuality test as existing receipts. (Memory `ks18-contextuality-witness.md` indexing rule still binds.)
- **Doctrine v6 scanner exemptions** — adding new receipt classes does NOT need EXCLUDE_PATH_PREFIXES; the scanner reads forbidden-list from payload mirrors, so payload-mirror update is part of the receipt-class rollout (memory: `inca-rename-2026-05-27.md` two-scanner-gotcha rule applies).
- **Bekenstein bound** — the LSTM forecast vector and the XGBoost class-probability vector both have finite bit-budget; envelope serialization MUST enforce the existing `maxReceiptBytes` ceiling. Forecast horizons that would exceed the budget are truncated with an explicit `truncatedAt` field, NOT silently dropped (parity with `ising-synthesis-2026.md` cascade-gate rule).

---

## 6. Honesty contract (per `putnam-harness-honesty.md` pattern)

For every `sense.*.v1` receipt, six rules must be enforced in code (not docstring):

1. **No silent fallback on failed model load.** If the model hash doesn't match what was attested in the receipt, the gate refuses — does not return "score: null."
2. **No retroactive threshold tuning.** `threshold` is bound at receipt-emit time; downstream may not recompute "would-have-tripped" with a different threshold and claim it was a true positive.
3. **No backfilled evaluation set.** `evaluationSetHash` MUST predate `decision` timestamp; receipts that fail this temporal check are rejected.
4. **No distribution-shift suppression.** `inputDistributionDistance` (for forecast) and `confidenceDistributionJSD` (for classifier) are MANDATORY fields, not optional.
5. **No private-data leakage.** Raw feature vectors NEVER appear in the envelope; only their content-addressed hash. Enforced by serialization test.
6. **No backdated rate-limit window.** `sense.poll.v1` envelopes carry the exact UTC ms window-start; rate-limit witnesses are computed over closed windows, never "rolling" windows that can be re-aligned post-hoc to hide a violation.

Lifting any of these six rules to make a benchmark look better is the failure mode.

---

## 7. Honest limits this synthesis does NOT promise

- **The paper validated 12 residential PV sites over 90 days.** Generalization to Vessels/ROSIE/Sentra feeds is structurally sound (the formulas are domain-agnostic) but the absolute numbers (94% bandwidth reduction, 97.2% accuracy, 5.2% MAPE) do NOT transfer. Each downstream artifact must re-measure on its own feed and emit its own attested bound. **Do not cite the paper's numbers as SZL numbers in any external comms.**
- **Adaptive-polling collapse mode.** Per the paper's own discussion, vendor cloud APIs constrain telemetry frequency. If the upstream rate cap drops mid-window (provider-side), eq(1) will keep accelerating until it hits T_min, then re-violate the new lower cap. The SZL implementation MUST poll the published rate-limit header on each response and reduce its internal cap in lock-step — eq(1) alone is not robust to provider-side cap changes.
- **LSTM training-distribution staleness.** The paper trains on 180 days. After deployment, training-vs-live drift accumulates. `sense.forecast.v1` receipts must carry a `trainingSetMaxTimestamp` field so consumers see how old the model is.
- **No active control.** The paper is monitoring-only. SZL's existing 9-step loop covers execution (step 7), but `sense.*.v1` receipts are step-1/step-8 signals — they do NOT close a control loop without an explicit policy-gate path. Do not advertise SCADA absorption as "we now do active grid control."

---

## 8. What this synthesis intentionally leaves OUT

- **Solar-domain-specific feature engineering.** The 12 temporal features in §V-A of the paper (string current imbalance, irradiance-normalized efficiency, etc.) are PV-installation-specific. SZL absorbs the *score formula* and the *threshold-with-consecutive-window rule*, not the feature engineering.
- **Django/Postgres deployment specifics.** SZL has its own runtime (ouroboros + api-server + per-artifact Vite). The paper's Django/Supabase/Azure stack does not transfer.
- **Penetration-test vectors as receipts.** The paper's 287 OWASP test vectors are validation-stage artifacts, not runtime receipts. Sentra already has a `security-validation.v1`-class surface; do not duplicate.

---

## 9. Rollout sequence (for downstream evolution tasks — do NOT do in this synthesis pass)

1. Extend `packages/lean-formulas/Invariant.lean` for 10-axis uniqueness. Cut `lutar-lean v0.2.0`.
2. Create `packages/poll-kit` with `AdaptivePoller` + `sense.poll.v1` schema. Tests: rate-limit-violation = 0 under randomized adversarial feed.
3. Create `packages/sense-kit` with `sense.anomaly.v1` / `sense.classification.v1` / `sense.forecast.v1` schemas. Honesty-contract tests baked in.
4. Wire `sense.fusion.v1` into Amaru's existing convergence stage.
5. Add `/sense/*` route family to api-server. CSRF-exempt + globalAuthEnforcer-loopback-bypass + route-level shared secret (per memory `api-server-loopback-sidecars.md` — all three gates or cascade failure).
6. Per-artifact first-absorption per §4 Warhacker×SCADA matrix.
7. Doctrine-v6 scanner payload-mirror update for new receipt class names (per `inca-rename-2026-05-27.md` two-scanner gotcha).
8. Emit one Zenodo paper at the v0.3.0 cut — "Adaptive Λ-Polling: a 10-axis governance extension for governed external-feed integration."

---

## 10. Provenance

- Source paper: see header.
- Synthesis written: 2026-05-27.
- Author of synthesis: SZL Holdings, against the established 6-prior-synthesis pattern (AGI / perception-bio / electrodynamics / sparse-attention / ising / memo-reflection).
- Frontier-fit verdict: PASS (5 absorptions, 1 cross-cutting).
- Build status when written: workflows stopped (user requested standby — paper-absorption phase, no runtime restarts).
