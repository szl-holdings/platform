# Alloy Meridian — Architecture Overview

## What Is Alloy Meridian?

Alloy Meridian is the cognitive agentic business observability and forecasting layer for the SZL Holdings platform. It is the intelligence core that connects all domain signals, routes inference requests to the best available model, runs competing forecast models against business metrics, and enforces governed decision-making.

Meridian is the "why" and "what next" layer. Domain packs (Vessels, Terra, Aegis, Counsel) provide operational data. Meridian synthesizes it into decisions.

---

## Architecture Components

### 1. Model Router (`services/model-router.ts`)

Provider-abstracted routing across 8 model lanes:

| Lane | Purpose | Primary Model |
|---|---|---|
| `strategy` | Deep reasoning, strategic analysis | DeepSeek-R1 |
| `fast-ops` | High-throughput ops tasks | DeepSeek-V4-Flash |
| `coding` | Code generation & review | Qwen3-Coder-Next |
| `forecasting` | Time-series business forecasting | Chronos-2 |
| `retrieval` | Embedding & semantic search | BGE-M3 |
| `speech` | ASR & TTS | Whisper Large v3 |
| `vision` | Document OCR & visual understanding | GLM-OCR |
| `creative` | Image & media generation | FLUX.1 |

The router reads API keys from environment variables at request time. If no key is present, it returns the primary model with `mode: "mock"`. No secrets are ever hardcoded.

### 2. Agent Constellation (`services/meridian/agent-constellation.ts`)

Seven governed agents with typed configurations:

| Agent | Lane | Approval Class | Role |
|---|---|---|---|
| `signal-cartographer` | fast-ops | auto | Builds the signal graph, scores Signal Debt |
| `forecast-council` | forecasting | auto | Runs the forecast tournament |
| `deepseek-strategist` | strategy | review | Multi-step strategic analysis |
| `operator-swarm` | fast-ops | review | Reads external tools, proposes mutations |
| `voice-of-business` | strategy | auto | Translates signals into executive briefings |
| `brand-imagination-engine` | creative | review | Brand-aligned content and media |
| `governance-sentinel` | strategy | admin_only | Doctrine enforcement, audit review |

Agents **may** draft, analyze, forecast, and propose. Agents **may not** send external messages, spend money, change access, delete data, or deploy without explicit human approval.

### 3. Forecast Council (`services/meridian/forecast-council.ts`)

Runs 5 competing time-series models against 8 business metrics:

**Models**: Chronos-2, TimesFM, Kronos, Timer, Lag-Llama

**Metrics**: Revenue pipeline velocity, delivery risk, incident likelihood, customer demand, cash runway, engineering throughput, market timing, platform adoption

Each session produces:
- Per-model forecasts with 80% and 95% uncertainty bands
- Backtest quality scores (MASE, CRPS, coverage rate, sharpness)
- Tournament rankings by calibrated quality
- Weighted ensemble consensus forecast

### 4. Signal Graph (`services/meridian/signal-graph.ts`)

Maps signals from GitHub, Replit, CI, issues, incidents, meetings, analytics, payments, docs, and customers into a typed business graph. Computes **Signal Debt** scores:

- **Stale**: Signal not refreshed within threshold
- **Missing**: Expected signal not present
- **Contradictory**: Signal conflicts with another source
- **Low confidence**: Signal confidence below 0.7

### 5. Novel Mechanics

#### Decision Weather (`services/meridian/decision-weather.ts`)
Probability forecasts for delivery delay, customer churn, cost overrun, incident, and opportunity conversion over 7/14/30-day windows. Analogous to a weather forecast for business risk.

#### Counterfactual Ledger (`services/meridian/counterfactual-ledger.ts`)
For each recommendation, records 4 projection paths: do_nothing, delay_30d, delegate, execute_now. Each includes expected outcome, impact score, risk delta, confidence, and rollback path.

#### Business Flight Recorder (`services/meridian/flight-recorder.ts`)
Tamper-evident audit log of all model calls, forecasts, tool actions, approvals, outcomes, and rollbacks.

#### Founder Intent Vector (`services/meridian/founder-intent.ts`)
Governed strategy memory: mission, doctrines, risk tolerances, timing preferences, prohibited actions, and decision principles. The supreme authority for governance checks.

### 6. MCP Governance (`services/meridian/mcp-registry.ts`)

Tracks activation status of 8 external MCP servers. Enforces:
- Read-first policy for all external MCP access
- Approval requirement for all write/delete/send/publish/payment/permission operations
- Full audit trail via Flight Recorder

---

## API Endpoints

All endpoints are at `/api/meridian/*`. See `alloy.meridian.commands.md` for the full command reference.

---

## UI

The Meridian Intelligence UI is available at `/meridian-intelligence` in the SZL Holdings dashboard. It surfaces:
- Decision Weather (tabbed, all 5 event types)
- Forecast Tournament (global rankings + per-metric sessions)
- Signal Debt dashboard
- Business Flight Recorder
- Agent Constellation health
- MCP Registry activation status
- Governance Audit (Founder Intent Vector)

The geospatial Meridian page (globe) remains at `/meridian`.

---

## SZL Doctrine Alignment

Meridian is built on SZL doctrine:
- Evidence-backed decisions (sources + confidence on every recommendation)
- Explicit platform state (no hidden state transitions)
- Audit trails (every operation in Flight Recorder)
- Human confirmation (no external mutations without approval)
- Rollback paths (required before execution approval)
