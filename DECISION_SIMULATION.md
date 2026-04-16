# Decision Simulation — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026

---

## Overview

The Monte Carlo simulation engine is one of the five platform primitives. It enables operators to see not just *what to do* but *what could happen if they do it* — with confidence intervals, sensitivity rankings, and scenario comparisons.

This is the platform's answer to "trust the AI." Instead of asking operators to accept recommendations on faith, the simulation engine shows them the range of possible outcomes and which variables matter most.

---

## How It Works

### 1. Scenario Definition

A scenario is a structured model with:
- **Input variables** — each with a probability distribution (e.g., fuel price: LogNormal(μ=4.2, σ=0.3))
- **DSL expressions** — formulas that combine inputs into outputs (e.g., `total_cost = fuel_cost + port_fees + charter_rate * days`)
- **Output metrics** — the values operators care about (e.g., expected profit, break-even probability)

### 2. Simulation Execution

The engine runs thousands of trials (default: 10,000). Each trial:
1. Samples random values from each input distribution
2. Evaluates the DSL expressions with the sampled values
3. Records the output metrics

### 3. Results

After all trials complete, the engine produces:
- **Percentile results** — P5, P10, P25, P50 (median), P75, P90, P95
- **Expected value** — mean across all trials
- **Standard deviation** — measure of outcome spread
- **Probability of threshold** — e.g., "72% probability that ROI exceeds 15%"
- **Sensitivity ranking** — which input variables have the most impact on the output

### 4. Sensitivity Analysis

The "tornado" analysis ranks input variables by their impact on the output metric. This tells operators: *if you can only control one thing, control this*.

```
Variable               Impact on Expected Profit
──────────────────────────────────────────────────
Charter rate           ████████████████████  High
Fuel price             ██████████████        Medium-High
Port fees              ████████              Medium
Insurance premium      ████                  Low
Weather delays         ██                    Low
```

---

## Domain Scenarios

### Aegis: Cyber Risk Assessment

**Scenario:** `AEGIS_CYBER_RISK`

Models the expected financial loss from a security incident given current controls, threat landscape, and organizational exposure.

| Input Variable | Distribution | Source |
|---------------|-------------|--------|
| Attack probability | Beta(α, β) based on threat intel | STIX/TAXII feeds |
| Control effectiveness | Triangular(min, mode, max) | SOC assessment |
| Data exposure scope | Discrete (partial, full, critical) | Asset inventory |
| Recovery time | LogNormal(μ, σ) | Historical incidents |
| Regulatory fine risk | Uniform(min, max) | Jurisdiction + data type |

**Output:** Expected annual loss, worst-case (P95) loss, break-even on control investment.

**Where it surfaces:** Aegis risk dashboard, Lyte action queue (when recommending security investments).

---

### Vessels: Voyage Cost Projection

**Scenario:** `VESSELS_VOYAGE_COST`

Models total voyage cost with uncertainty in fuel prices, port fees, charter rates, and weather delays.

| Input Variable | Distribution | Source |
|---------------|-------------|--------|
| Fuel price ($/mt) | LogNormal based on Brent crude | Market data feeds |
| Port charges | Normal with port-specific parameters | Historical port data |
| Charter rate | LogNormal with seasonal adjustment | Baltic Exchange |
| Weather delays (days) | Poisson(λ) by route | NOAA marine weather |
| Insurance premium | Fixed or Triangular by hull value | Marine insurance tables |

**Output:** Expected voyage cost, P90 cost, break-even freight rate, sensitivity to fuel.

**Where it surfaces:** Vessels voyage P&L page, Lyte action queue (when evaluating charter decisions).

---

### Terra: Deal Return Projection

**Scenario:** `TERRA_DEAL_RETURN`

Models expected ROI on a distressed property acquisition with uncertainty in renovation costs, market appreciation, and holding period.

| Input Variable | Distribution | Source |
|---------------|-------------|--------|
| Acquisition price | Fixed (known) | Deal pipeline |
| Renovation cost | Triangular(optimistic, likely, pessimistic) | Contractor estimates |
| Market appreciation | Normal(μ, σ) by neighborhood | NYC market data |
| Holding period (months) | Discrete(6, 12, 18, 24) | Strategy |
| Rental income | Normal with vacancy adjustment | Comparable rents |
| Financing cost | Fixed or distribution by rate environment | Market rates |

**Output:** Expected IRR, probability of loss, break-even holding period, sensitivity to renovation cost.

**Where it surfaces:** Terra deal detail page, Lyte action queue (when recommending acquisition decisions).

---

### PRISM Counsel: Settlement Range

**Scenario:** `PRISM_SETTLEMENT_RANGE`

Models likely settlement range for a legal matter given case strength, jurisdiction characteristics, and opposing counsel behavior.

| Input Variable | Distribution | Source |
|---------------|-------------|--------|
| Case strength score | Beta distribution | AI assessment + attorney rating |
| Jurisdiction multiplier | Discrete by venue | Historical venue data |
| Opposing counsel aggressiveness | Ordinal (1-5) | Matter intelligence |
| Economic damages | LogNormal | Client documentation |
| Non-economic factors | Triangular | Attorney judgment |

**Output:** Expected settlement, P10/P90 range, probability of exceeding demand, sensitivity to case strength.

**Where it surfaces:** PRISM Counsel matter detail, forecast page, Lyte action queue (when evaluating settlement offers).

---

## Calibration

The Monte Carlo engine improves over time through closed-loop calibration:

1. **Simulation runs** before a decision is made
2. **Outcome Graph** records the actual result after the decision executes
3. **`calibrate()`** adjusts distribution parameters based on the gap between prediction and reality
4. **Future simulations** use calibrated parameters

This creates a flywheel: the more decisions the platform processes, the more accurate the simulations become.

---

## Where Simulation Surfaces in the Product

| Surface | What Users See |
|---------|---------------|
| **Lyte Action Queue** | Recommendation cards include simulation summary: expected outcome, confidence interval, top sensitivity drivers |
| **Domain Detail Pages** | Full simulation results with tornado charts and scenario comparisons |
| **CORTEX Mobile** | Simplified simulation summary on approval cards — expected outcome and key risk |
| **Alloy Governance Audit** | Simulation parameters and results recorded as evidence in the proof chain |
| **Investor Reports** | Portfolio-level risk aggregation from domain-specific simulations |

---

## Simulation Cockpit UI

The `SimulationCockpit` component in `lib/shared-ui` surfaces all simulation capabilities as an operator-facing decision cockpit. It is not a chart widget — it is a full decision interface.

### What Operators See

**Scenario Ranges tab:**
- Best / base / worst outcomes on a visual range bar
- Colour-coded: red (worst) → amber (base) → green (best)
- Per-metric breakdown: net profit, duration, cost, probability
- Confidence interval indicator
- Cost-of-waiting analysis — "every day of delay costs $8,500"
- Recommendation with strength indicator (strong / moderate / weak)

**Sensitivity Drivers tab:**
- Tornado chart showing which input variables have the highest impact
- Direction indicator: positive (increases outcome) / negative (decreases outcome)
- Ranked by absolute impact magnitude

**Scenario Comparison tab:**
- Side-by-side comparison of all scenarios
- Delta vs baseline clearly marked
- Single click to switch active scenario
- Tag labels: Preferred · Low Risk · High Upside · Baseline

**Predicted vs Actual tab:**
- Tracks past simulation predictions against realized outcomes
- Delta percentage shows model calibration accuracy
- Builds operator confidence over time — "the model predicted $180K, we achieved $204K"

### Usage

```tsx
import { SimulationCockpit } from "@szl-holdings/shared-ui";

<SimulationCockpit
  title="Voyage P&L Decision Cockpit"
  description="MV Pacific Star — Rotterdam to Singapore"
  scenarios={[
    {
      id: "direct-route",
      label: "Direct Route",
      tag: "preferred",
      probability: 0.45,
      primaryMetric: { best: 340000, base: 218000, worst: 82000, format: "currency", unit: "$" },
      sensitivityDrivers: [
        { id: "freight_rate", label: "Freight Rate (BDI)", impact: 0.55, direction: "positive" },
        { id: "bunker_price", label: "Bunker Price", impact: -0.38, direction: "negative" },
      ],
      costOfWaiting: { perDay: 8500, description: "Daily demurrage + opportunity cost" },
      recommendation: "Proceed if sanctions clearance confirmed within 48h.",
      recommendationStrength: "strong",
    },
  ]}
  primaryMetricLabel="Net Voyage Profit"
  iterationsRun={10000}
  confidenceLevel={0.90}
  predictedVsActual={pastOutcomes}
/>
```

### Integration Points

| Domain | Page | Simulation Type |
|--------|------|----------------|
| Aegis | `/aegis/trust-provenance` (Decision Cockpit tab) | Incident response scenario analysis |
| Terra | `/terra/trust-provenance` (Deal Simulation tab) | Deal ROI and IRR simulation |
| Vessels | `/vessels/trust-provenance` (Voyage Cockpit tab) | Voyage P&L scenario analysis |

### Compact Variant

For embedding in dashboards and cards without full cockpit experience:

```tsx
<SimulationCockpitCompact
  scenarios={scenarios}
  primaryMetricLabel="Expected Value"
  accentColor="#8b7ac8"
/>
```

---

## Related Documents

| Document | Path |
|----------|------|
| Platform primitives | [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) |
| Proof and policy model | [PROOF_AND_POLICY_MODEL.md](PROOF_AND_POLICY_MODEL.md) |
| Trust center index | [TRUST_CENTER_INDEX.md](TRUST_CENTER_INDEX.md) |
| Category positioning | [CATEGORY_POSITIONING.md](CATEGORY_POSITIONING.md) |
| System overview | [SYSTEM-OVERVIEW.md](SYSTEM-OVERVIEW.md) |
