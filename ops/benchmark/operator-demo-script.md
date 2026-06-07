# Operator Demo Script

**Last updated:** April 2026
**Purpose:** Step-by-step script for demonstrating the governed decision loop to investors and enterprise buyers

---

## Pre-Demo Setup

- Decision Theater tab open in Core Command
- Signal feed clear (or showing normal-state signals)
- Monte Carlo ready (warm start)
- Browser: full-screen, dark mode

---

## Demo Script (5 Minutes)

### Opening (30 seconds)

> "Let me show you what governed decision infrastructure looks like in practice. This is a live system — not a mockup. Every signal you're about to see goes through the same nine-step loop that production decisions follow."

### Step 1: Signal (30 seconds)

> "A signal just arrived from our defense intelligence pack, Aegis. An intrusion detection sensor at the Port of Rotterdam has flagged unauthorized SSH access on an OT network controller."

**Point out:**
- Source attribution (sensor ID, domain tag)
- Severity badge (critical)
- Correlation ID (links this to everything that follows)

### Step 2: Context (30 seconds)

> "Simultaneously, our maritime pack, Vessels, detected an AIS anomaly — a cargo vessel went dark near the approach channel. The platform's correlation engine linked these two signals automatically."

**Point out:**
- Cross-domain correlation (Aegis + Vessels)
- Confidence score (87%)
- Evidence links (temporal overlap, geographic proximity, threat feed match)

### Step 3: Recommendation (30 seconds)

> "The AI Agent Gateway generated a governed recommendation — with full source attribution. Model ID, confidence score, and the four specific data sources it cited."

**Point out:**
- Confidence bar (82%)
- Source attribution panel (4 cited sources)
- Recommended actions (specific, domain-aware)

### Step 4: Simulation (45 seconds)

> "Before anyone acts on this, the platform runs a Monte Carlo simulation. Five thousand iterations of the voyage cost scenario — using real distribution parameters. Here are the results."

**Point out:**
- Distribution chart (not a static number — a probability distribution)
- Percentile bands (P5 through P95)
- Sensitivity analysis (which inputs have the most impact)
- Simulation duration (milliseconds, not minutes)

### Step 5: Policy (30 seconds)

> "Now the Covenant Policy Engine evaluates whether this action is authorized. It checks the operator's roles, the resource domain, and the registered policies."

**Point out:**
- Policy verdict (ALLOW/DENY)
- Matched policies (named, versioned)
- Simulation trace (what-if analysis)

### Step 6: Execution (30 seconds)

> "The approved action executes. Every step is instrumented — who executed it, how long it took, what system was responsible."

**Point out:**
- Step-by-step execution log
- Executor attribution (human vs. agent vs. system)
- Duration per step

### Step 7: Proof (30 seconds)

> "The Proof Chain captures an immutable record. SHA-256 hash of the AI prompt. Source class. Review state. Every detail needed for audit or legal discovery."

**Point out:**
- Proof Chain ID
- SHA-256 prompt hash
- Source attribution (model, provider, confidence)
- Review and export safety states

### Step 8: Outcome (30 seconds)

> "Finally, the Outcome Graph records what actually happened — and compares it to what we predicted. Predicted cost versus actual cost. Predicted timeline versus actual timeline."

**Point out:**
- Variance metrics (actual vs. predicted)
- Decision status (accepted/rejected)
- Outcome result (achieved/not achieved)

### Step 9: Learning (15 seconds)

> "The system learns. These outcomes feed back into confidence calibration, refining future predictions. This is a closed loop — not an open-ended recommendation engine."

### Closing (30 seconds)

> "Nine steps. Full attribution at every step. Immutable proof. Quantitative outcome tracking. This is what governed decision infrastructure looks like. No other platform instruments the complete signal-to-outcome chain with governance at every step."

---

## Common Questions and Responses

| Question | Response |
|----------|----------|
| "Is this real data?" | "The scenario is representative, but the primitives are real. PrismEventBus, CovenantPolicyEngine, and the Monte Carlo engine are running live in the browser. The simulation ran 5,000 real iterations." |
| "How is this different from Palantir?" | "Palantir governs data access — who can see what. We govern decision execution — who approved what, based on what evidence, with what expected outcome." |
| "What if the AI is wrong?" | "That's exactly what the Outcome Graph solves. When a recommendation leads to a bad outcome, the confidence calibration adjusts. The system gets better over time." |
| "Can this work in my domain?" | "The nine-step loop is domain-agnostic. We add domain packs for specific intelligence — Aegis for defense, Vessels for maritime, Terra for real estate. The governance infrastructure is shared." |
