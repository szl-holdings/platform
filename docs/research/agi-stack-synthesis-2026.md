# AGI Stack Synthesis & Integration Map — 2026

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Status:** DOCTRINE-PASS · Source of truth for the ROSIE / A11oy / Sentra / Amaru evolution tasks (May 2026)
**Scope:** Thirteen external research artefacts distilled into SZL primitives — *no upstream code is copied; every idea is re-expressed against our own ontology, doctrine, and receipts.*

---

## How to read this document

Downstream task agents (ROSIE Graph Planner, A11oy UniRec, Sentra Detector Council, Amaru schema-grounded extraction) consume this doc section-by-section. The contract per repo:

1. **Thesis** — one paragraph, plain English.
2. **Core primitives** — 2–4 algorithmic / data-shape ideas worth re-expressing.
3. **Closest SZL module** — what already exists, and whether we *extend* or *add a sibling*.
4. **Target artifact(s)** — where the re-expression lands.
5. **What we build** — concrete, file-level hooks, written so the downstream task can start cutting code.
6. **Doctrine V6 compliance** — which pillar (Governed Autonomy / Evidence-First / Policy-Aware / Operational Ontology) and what *receipt* the integration emits.

The cross-cutting **Warhacker mapping** and the **Doctrine V6 receipts ledger** at the end tie the per-repo entries together.

The thirteen artefacts covered, by upstream owner:

- **ulab-uiuc** — UniRec, KnowledgeExtraction, GraphPlanner, AGI-survey, MARBLE, Time-R1, SeeingEye (7)
- **consciousness-lab** — ctm-ai (1)
- **sotopia-lab** — sotopia-rl (1)
- **standardgalactic** — memnet, research-projects (umbrella sketch index), antivenom (3)
- **Cross-cutting frame** — Warhacker problem map (the thirteenth artefact: not a repo but the demand surface that everything below must satisfy).

---

## 1. ulab-uiuc / UniRec

**Thesis.** A unified recommender that treats *items, queries, and rationales* as a single embedding space, so retrieval, ranking, and explanation collapse into one model rather than three stitched pipelines. The novelty is the rationale channel: every recommended item ships with a structured justification vector that downstream evaluators can score.

**Core primitives.**
1. **Tri-tower encoder** — `(user_ctx, item, rationale)` projected into a shared metric space; cosine in that space is the ranking signal.
2. **Rationale-as-first-class-output** — the rationale embedding is supervised, not generated as side text.
3. **Calibration via paired preference deltas** — pairwise loss over `(preferred, deferred)` pairs trained from human approvals, not ratings.

**Closest SZL module.** `lib/ai-engine/src/retrieval/` + `lib/ai-engine/src/rag-vector-store.ts`. We have retrieval and ranking but no rationale channel.
**Action:** **add a sibling** package `packages/unirec-fabric` (do not extend rag-vector-store — keep retrieval thin) that produces `(itemRef, rationaleVector, confidence)` triples and writes them through `szl-receipts`.

**Target artifact(s).** **A11oy** (primary — recommendation panels and the Brand Orchestration "next-best-action" surface), **ROSIE** (secondary — recommended interventions in the Decision Theater).

**What we build.**
- `packages/unirec-fabric/src/tri-tower.ts` — interfaces only; backbone is the existing `alloy-model-gateway`. No new model weights.
- `packages/unirec-fabric/src/rationale-channel.ts` — supervised projection that consumes the existing `agentRouting[]` trajectory (`lib/ai-engine/src/flywheel/trajectory-store.ts`) as preference pairs (golden vs. filtered_out).
- `artifacts/a11oy/src/panels/RecommendationCard.tsx` — surface that *always* renders the rationale vector's top-3 contributing axes alongside the recommendation.
- API: `POST /api/unirec/recommend` in `artifacts/api-server` returning `{ items[], rationaleReceiptId }`.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First.
- **Receipt:** `unirec.recommendation.v1` — fields: `query`, `items[].rationaleAxes[]`, `confidence`, `goldenRunsUsedAsFewShot[]`. Linked to the golden-run trajectory hashes from `trajectory-store`. Emitted before the recommendation is rendered, not after. No recommendation without a receipt.

---

## 2. ulab-uiuc / KnowledgeExtraction

**Thesis.** Schema-grounded extraction: given a target schema, the extractor binds spans of source text to schema fields with explicit *unbound-field* and *conflicting-evidence* markers. The contribution is not the extraction itself but the negative space — gaps and conflicts are first-class outputs, not silent absences.

**Core primitives.**
1. **Schema-conditioned decoding** — the schema is part of the prompt context AND the validator.
2. **Gap and conflict markers** — `{field: null, reason: "no-source-span"}` / `{field: X, conflictWith: [span_a, span_b]}` survive into the output.
3. **Provenance per field** — every extracted value carries its source span hash, not just the whole document hash.

**Closest SZL module.** `packages/langextract-bridge`. It already does bridge-to-langextract; what's missing is the *gap / conflict* surface and per-field provenance hashing.
**Action:** **extend** `langextract-bridge` (do not fork) — add a `schema-grounded-extract.ts` entry point that wraps the existing extractor and post-processes into the gap/conflict envelope.

**Target artifact(s).** **Amaru** (primary — the sync-envelope ingestion path is the obvious consumer), **Sentra** (secondary — incident report ingestion benefits from explicit conflict markers).

**What we build.**
- `packages/langextract-bridge/src/schema-grounded-extract.ts` — typed `extract<T>(text, schema): SchemaGroundedResult<T>` with `gaps[]` and `conflicts[]`.
- `packages/langextract-bridge/src/span-provenance.ts` — SHA-256 of `(documentHash, startByte, endByte, normalisedText)` per field.
- Amaru hook: `artifacts/conduit/src/server/ingest-pipeline.ts` calls the new extractor and writes gaps as explicit envelope rows (not dropped).
- Sentra hook: `packages/anomaly-fabric/src/incident-extractor.ts` becomes a thin wrapper over the schema-grounded extractor.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First.
- **Receipt:** `extraction.schema-grounded.v1` — fields: `schemaRef`, `extracted{}`, `gaps[]`, `conflicts[]`, `spanProvenance{}`. The presence of a non-empty `gaps[]` is *not* a failure condition; silently dropping a field would be. This is the "no mock theater" principle applied to extraction.

---

## 3. ulab-uiuc / GraphPlanner

**Thesis.** Plans are DAGs over typed actions, not linear chains. A planner that reasons over a graph can detect *cycles*, *unmet preconditions*, and *parallelisable sub-plans* before execution — and can hand the graph to a human reviewer as a single artefact instead of a thread of text.

**Core primitives.**
1. **Typed action nodes** — every node has a precondition set, an effect set, and an actor type.
2. **Precondition closure** — the planner refuses to emit a plan whose preconditions are not reachable from the initial state.
3. **Parallel-vs-serial inference** — the DAG topology yields a critical path automatically; non-critical branches run in parallel.

**Closest SZL module.** `packages/planner` (exists, but is currently linear) and `lib/ai-engine/src/plan-lock.ts` (existing lock mechanism).
**Action:** **extend** `packages/planner` with a `graph-planner.ts` mode. Keep the linear planner as the default for simple flows; gate the graph planner behind `plan.kind === "dag"`.

**Target artifact(s).** **ROSIE** (primary — the Decision Theater is the natural place for DAG plans; drone-oversight, satellite-ground, and trajectory-viz are all multi-actor parallel plans).

**What we build.**
- `packages/planner/src/graph-planner.ts` — `planDag(goal, initialState, actions): PlanDag` with precondition-closure check.
- `packages/planner/src/preconditions.ts` — typed checker; throws `UnreachablePreconditionError` rather than returning a partial plan.
- ROSIE surface: `artifacts/rosie/src/components/PlanGraph.tsx` — react-flow visual of the DAG with critical path highlighted.
- Wire into `plan-lock`: a DAG plan locks per-node, not per-plan, so parallel branches can execute under independent approval gates.

**Doctrine V6 compliance.**
- **Pillar:** Governed Autonomy.
- **Receipt:** `plan.dag.v1` — fields: `nodes[]`, `edges[]`, `criticalPath[]`, `unmetPreconditions[]`, `parallelBranches[][]`. Every node also emits its own per-node receipt at execution (`plan.dag.node.executed.v1`) chained to the parent plan's `planId`.

---

## 4. ulab-uiuc / AGI-survey

**Thesis.** A taxonomy of "what counts as AGI capability" decomposed into measurable axes (autonomy, generality, reliability, recoverability, oversight-friendliness). The contribution is the *axis decomposition* itself, not any individual measurement — it gives downstream evaluators a fixed coordinate system to score against.

**Core primitives.**
1. **Five capability axes** — autonomy, generality, reliability, recoverability, oversight-friendliness.
2. **Per-axis qualitative-to-quantitative ladder** — each axis has 5 named tiers (e.g. autonomy: assistive / supervised / governed / delegated / sovereign).
3. **Composite refuses to average** — the survey position is that capability cannot be summarised as a single number; the vector itself is the rating.

**Closest SZL module.** `packages/agi-forecast` and `packages/payload/raw/_files/agi_v5/recon/agi_forecast.md`. We already track field-level forecasting; what's missing is the per-artifact axis vector.
**Action:** **extend** `packages/agi-forecast` with an `axis-vector.ts` module. Do not collapse to a single composite.

**Target artifact(s).** All artifacts (cross-cutting). Each artifact reports its own axis vector to the agi-forecast ledger.

**What we build.**
- `packages/agi-forecast/src/axis-vector.ts` — `AxisVector = { autonomy: Tier, generality: Tier, reliability: Tier, recoverability: Tier, oversightFriendliness: Tier }` plus `RatingReceipt` shape.
- Each artifact ships a `selfRate(): AxisVector` reporter; the agi-forecast ledger aggregates per release tag.
- Public-claims registry hook: any marketing surface that quotes an axis tier must link to its `RatingReceipt`.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First.
- **Receipt:** `agi.axis-rating.v1` — fields: `artifact`, `releaseTag`, `axisVector{}`, `evidenceLinks[]`. Rating without `evidenceLinks[]` is rejected at receipt write time. *No unattributed capability claims.*

---

## 5. ulab-uiuc / MARBLE

**Thesis.** A benchmark suite for multi-agent reasoning that scores agents on *coordination cost*, not just task success — i.e. how much communication, how many redundant tool calls, how many conflicting writes. The single most useful idea is treating coordination as a measurable resource.

**Core primitives.**
1. **Coordination cost metric** — `(messages_exchanged * coord_weight) + (conflicting_writes * conflict_weight)`.
2. **Adversarial multi-agent scenarios** — at least one agent is given a private goal misaligned with the team.
3. **Replay-based judging** — runs are stored as trajectories; judgement is post-hoc and reproducible.

**Closest SZL module.** `packages/ouroboros-bench` (existing benchmark harness) and the `trajectory-store` already captures the right primitives.
**Action:** **extend** `ouroboros-bench` with a `marble-bench.ts` profile.

**Target artifact(s).** **ROSIE** (primary — multi-agent orchestration is its core surface). Used as a regression bench, not a runtime feature.

**What we build.**
- `packages/ouroboros-bench/src/marble-bench.ts` — `runMarbleProfile(agents, scenario): BenchResult` consuming existing `trajectory-store` records as the run log.
- `packages/ouroboros-bench/src/coordination-cost.ts` — the cost metric, computed from trajectory `agentRouting[]` and `toolCalls[]`.
- ROSIE adversarial scenario: one rogue agent whose private goal contradicts the team goal — tests whether the Covenant Policy blocks the contradiction.

**Doctrine V6 compliance.**
- **Pillar:** Governed Autonomy.
- **Receipt:** `bench.marble.v1` — fields: `scenarioId`, `agents[]`, `coordinationCost`, `conflictingWrites[]`, `policyDenialsObserved[]`. Stored alongside the trajectory hashes for offline audit.

---

## 6. ulab-uiuc / Time-R1

**Thesis.** A timing-aware reasoning model that treats *when* an event occurs as a first-class feature — not as a metadata tag on a token. The contribution is the time-conditioned attention pattern: the model can ask "what changed in the last 90 minutes?" without re-reading the entire history.

**Core primitives.**
1. **Time-bucketed attention** — attention windows are temporal, not positional.
2. **Drift score per bucket** — each bucket emits a scalar that says "this window differs from the recent baseline."
3. **Causal time priors** — the model penalises ordering violations (effect-before-cause) structurally.

**Closest SZL module.** `packages/anomaly-fabric` and `packages/forecast-fabric`. We have anomaly scoring but not the per-bucket drift score with the causal prior.
**Action:** **extend** `packages/anomaly-fabric` with a `time-r1-scoring.ts` that ingests existing series and produces bucket-drift scores. Also surface in `forecast-fabric` as a feature input.

**Target artifact(s).** **Sentra** (primary — anomaly scoring is the obvious win), **ROSIE** (secondary — Time-R1 drift scores feed the Decision Theater's "what changed" panel).

**What we build.**
- `packages/anomaly-fabric/src/time-r1-scoring.ts` — `scoreBuckets(series, window): BucketDrift[]`.
- `packages/forecast-fabric/src/features/time-r1-drift.ts` — exposes drift as a feature column for downstream forecasters.
- Sentra surface: anomaly cards display the drift score alongside the raw value; clicking the score opens the bucket inspector.
- Causal-prior check: refuse to score a series whose timestamps are non-monotonic without an explicit override.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First.
- **Receipt:** `anomaly.time-r1.v1` — fields: `seriesRef`, `bucketWindow`, `driftScore`, `baselineRef`, `causalPriorViolations[]`.

---

## 7. ulab-uiuc / SeeingEye

**Thesis.** Visual grounding for agents: the model emits not just "I see a vessel" but `{label: "vessel", bbox: [...], confidence: 0.83, sourceFrameHash: ...}`. The contribution is that the bounding box and source-frame hash are mandatory — un-grounded visual claims are rejected at the schema layer.

**Core primitives.**
1. **Mandatory bounding-box + frame hash** — no caption without a box and a frame ref.
2. **Confidence-per-detection** — not per-image; each detection has its own confidence.
3. **Negative claims** — explicit `notDetected: [labels]` for asked-about-but-absent objects.

**Closest SZL module.** None directly. `packages/langextract-bridge` is the closest *idea* (schema-grounded extraction from text); SeeingEye is its visual counterpart.
**Action:** **add a sibling** package `packages/seeing-eye` that mirrors langextract-bridge's contract for images / frames.

**Target artifact(s).** **Amaru** (primary — visual ingest into the sync envelope), **ROSIE** (secondary — drone-oversight and satellite-ground both need grounded visual claims).

**What we build.**
- `packages/seeing-eye/src/visual-extract.ts` — `extract(frame, schema): VisualGroundedResult` with `detections[]`, `notDetected[]`, `frameHash`.
- `packages/seeing-eye/src/frame-provenance.ts` — SHA-256 of normalised frame bytes; survives JPEG re-encoding via a perceptual hash sibling field.
- Amaru hook: `artifacts/conduit/src/server/visual-ingest.ts` accepts frames and routes through seeing-eye before envelope write.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First.
- **Receipt:** `vision.seeing-eye.v1` — fields: `frameHash`, `detections[]`, `notDetected[]`, `perceptualHash`. A visual claim without a frame hash is rejected at receipt write.

---

## 8. consciousness-lab / ctm-ai (Consciousness Turing Machine)

**Thesis.** A broadcast model of agent state: multiple specialist modules run in parallel, but only one wins access to the "global workspace" at a time, and that broadcast is the agent's coherent next step. The contribution is the explicit *arbitration loop* — winner-takes-broadcast with a logged rationale.

**Core primitives.**
1. **Parallel specialist modules** producing candidate broadcasts.
2. **Arbitration step** — one wins, the others' candidates are logged as suppressed alternatives.
3. **Broadcast loop** — the winning broadcast is fed back to all modules as their next input.

**Closest SZL module.** `lib/ai-engine/src/consciousness/` (we already have `cognitive-workspace.ts`, `inner-monologue.ts`, `metacognitive-monitor.ts`). What's missing is the *suppressed alternatives* log and the explicit arbitration receipt.
**Action:** **extend** `lib/ai-engine/src/consciousness/` with a `ctm-loop.ts` arbitration step. Do not rewrite the existing workspace; add the loop on top.

**Target artifact(s).** **ROSIE** (primary — the orchestrator's "what is the agent thinking" panel), **Sentra** (secondary — same loop drives Detector Council arbitration).

**What we build.**
- `lib/ai-engine/src/consciousness/ctm-loop.ts` — `arbitrate(candidates): { winner, suppressed[], rationale }`.
- ROSIE surface: a "Broadcast" panel showing the winner *and* the suppressed alternatives, so operators see what almost happened.
- Sentra wiring: Detector Council uses the arbitration loop to pick the dominant detection; suppressed detections are still logged (not dropped) for post-incident review.

**Doctrine V6 compliance.**
- **Pillar:** Governed Autonomy + Evidence-First.
- **Receipt:** `consciousness.broadcast.v1` — fields: `winner`, `suppressed[]`, `arbitrationRationale`, `loopIteration`. The presence of `suppressed[]` is the audit trail for "what the system almost did" — directly addresses the "no unattributed entries" voice rule.

---

## 9. sotopia-lab / sotopia-rl

**Thesis.** RL-trained social agents in scripted interpersonal scenarios with a *third-party judge* model. The contribution is the judge separation: the judge is not the actor and not the trainer; it scores outcomes against social norms (politeness, honesty, goal-reaching) independent of the policy that produced them.

**Core primitives.**
1. **Three-role separation** — actor, environment, judge.
2. **Multi-dimensional social reward** — politeness × honesty × goal-reach × policy-compliance, not a scalar.
3. **Scenario-as-data** — scripted scenarios are reproducible test sets.

**Closest SZL module.** `packages/aef-evals` and `lib/ai-engine/src/governance/`. We have eval scaffolding but no third-party judge separation for *approval-style* interactions.
**Action:** **add a sibling** under aef-evals: `packages/aef-evals/src/sotopia-judge.ts` (do not extend the existing scoring — keep the judge structurally separate, which is the entire point).

**Target artifact(s).** **A11oy** (primary — approval workflows are interpersonal scenarios; the judge model scores whether the approval interaction was honest and compliant).

**What we build.**
- `packages/aef-evals/src/sotopia-judge.ts` — `judge(transcript, norms): SocialReward`.
- `packages/aef-evals/src/scenarios/` — directory of scripted approval scenarios.
- A11oy hook: every approval session can be replayed against the judge in shadow mode; mismatches surface as approval-quality alerts.

**Doctrine V6 compliance.**
- **Pillar:** Policy-Aware Actions.
- **Receipt:** `approval.judge.v1` — fields: `sessionId`, `transcriptHash`, `socialReward{}`, `policyCompliance`, `norms[]`. The judge is identified by its own model + version hash, never by "the system."

---

## 10. standardgalactic / memnet

**Thesis.** An associative + episodic memory net where recall is by *content similarity* AND *temporal adjacency*. The contribution is the dual-index: episodes are stored once but retrievable along two orthogonal axes, and the recall path itself is part of the returned record.

**Core primitives.**
1. **Dual index** — content vector + temporal bucket.
2. **Recall path logging** — what was retrieved, in what order, via which index.
3. **Episodic consolidation** — recent episodes age into compressed summaries with pointers back to the raw episode.

**Closest SZL module.** `lib/ai-engine/src/memory/` (exists). We have a memory store but not the dual-index recall-path logging.
**Action:** **extend** `lib/ai-engine/src/memory/` with `memnet-recall.ts` and `episodic-consolidation.ts`. Existing store is the substrate; add the recall path and consolidation on top.

**Target artifact(s).** **A11oy** (primary — recommendations benefit from episodic recall of past similar approvals), **Amaru** (secondary — sync envelope replay uses episodic recall for "what did we see last time at this entity?").

**What we build.**
- `lib/ai-engine/src/memory/memnet-recall.ts` — `recall(query, recency): { items[], recallPath{} }`.
- `lib/ai-engine/src/memory/episodic-consolidation.ts` — periodic summariser; emits a consolidation receipt every N episodes.
- A11oy wiring: the UniRec rationale channel (§1) can cite recalled episodes by reference.

**Doctrine V6 compliance.**
- **Pillar:** Operational Ontology.
- **Receipt:** `memory.recall.v1` — fields: `query`, `items[]`, `recallPath{ contentMatches[], temporalMatches[] }`, `consolidationRefs[]`. The recall path is the audit trail for "why did the system surface this memory?"

---

## 11. standardgalactic / research-projects (umbrella sketch index)

**Thesis.** Not a single system — it is a catalogue of method sketches (interpretability probes, training tricks, eval ideas, agent micro-architectures). The contribution is the *index itself*: a curated set of "things worth trying once" with stable IDs.

**Core primitives.**
1. **Stable sketch IDs** — every idea has an identifier, even if it never ships.
2. **Try-once / try-again disposition** — each sketch is tagged with whether it warrants more investigation.
3. **Cross-reference graph** — sketches reference each other by ID.

**Closest SZL module.** None — this is a *meta* asset. The right home is documentation under `docs/research/sketches/` (the existing `docs/research/` directory).
**Action:** **add a documentation tree**, not a package. Curated sketch IDs become the language we use to discuss "we should also try X" without fragmenting it into ad-hoc PR comments.

**Target artifact(s).** None directly — this is engineering discipline, not a product surface.

**What we build.**
- `docs/research/sketches/README.md` — the index, with stable `SKT-####` IDs.
- One file per sketch we adopt from research-projects, with a `disposition:` frontmatter field (`try-once`, `try-again`, `productionised`, `rejected`).
- Lint rule (future, not in this task): commit messages that introduce a new behaviour should reference at least one sketch ID or open a new one.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First (meta-applied — every adoption can be traced to a sketch with a clear disposition).
- **Receipt:** none at runtime. The sketch index is a documentation receipt: the doctrine principle that *no idea ships without a recorded provenance* applies to the engineering process itself.

---

## 12. standardgalactic / antivenom

**Thesis.** A defensive catalogue: jailbreak prompts, adversarial inputs, poisoning patterns, and the *countermeasures* (input filters, output gates, training-time scrubbers) for each. The contribution is pairing every known attack with its specific antidote, not a generic safety filter.

**Core primitives.**
1. **Attack–countermeasure pairs** — every entry is `{attack: pattern, antidote: filter, severity: tier}`.
2. **Layered application** — input gate, mid-decode gate, output gate; each antidote declares which layer it lives at.
3. **Adversarial mutation index** — the catalogue tracks known variants of each attack, so new variants can be matched to a parent family.

**Closest SZL module.** `packages/aef-policy-guard`, `packages/policy-guard`, `packages/ouroboros-guardrails`. We have guardrails but no attack/antidote pair index.
**Action:** **add a sibling** package `packages/antivenom-fabric` that the existing guards *consult*, rather than rewriting the guards. Keep the catalogue separate from the enforcement path.

**Target artifact(s).** **Sentra** (primary — adversarial input class belongs in the Cyber Resilience Command), **A11oy** (secondary — AMI gating: antivenom decisions feed the AMI v2 formula's policy term).

**What we build.**
- `packages/antivenom-fabric/src/catalogue.ts` — typed `AttackEntry[]` with `attackPattern`, `antidote`, `severity`, `layer`, `mutationFamily`.
- `packages/antivenom-fabric/src/match.ts` — `match(input): { matches[], suggestedAntidotes[] }`.
- Sentra hook: every detected match emits a `sentra.antivenom-match.v1` receipt and routes to the remediation stages.
- A11oy AMI gating: a match elevates the AMI v2 "moral grounding" axis penalty before the approval gate fires; the approval cannot pass with an unresolved high-severity match.

**Doctrine V6 compliance.**
- **Pillar:** Policy-Aware Actions.
- **Receipt:** `antivenom.match.v1` — fields: `inputHash`, `matches[]`, `appliedAntidotes[]`, `severity`, `mutationFamily`, `layer`. Suppressed (unapplied) antidotes are also logged so "what we chose not to filter" is auditable.

---

## 13. Warhacker problem surface (cross-cutting map)

The thirteenth artefact is not a research repo — it is the **demand surface** that the other twelve must satisfy. Warhacker (Defense Unicorns, 16–19 June 2026, San Diego — see `docs/proposals/defense-unicorns/_sources/warhacker.html`) defines five problem categories. Each must be answered by a *named artifact*, shipped in a *named UDS bundle*, drawing on specific repo ideas above.

| # | Warhacker problem | Repo ideas that apply | Owning artifact | UDS bundle | Receipt class |
|---|---|---|---|---|---|
| 1 | **Satellite ground processing** — turning raw downlink into actionable signals at the edge. | KnowledgeExtraction (§2 — schema-grounded ingest), Time-R1 (§6 — drift on telemetry), SeeingEye (§7 — imagery grounding). | **Amaru** (ingest) + **Sentra** (anomaly). | `szl-mesh` (existing) — extend with Amaru `visual-ingest` and Sentra `time-r1-scoring` enabled by default. | `extraction.schema-grounded.v1`, `anomaly.time-r1.v1`, `vision.seeing-eye.v1`. |
| 2 | **Deployment health screening** — pre-shipment posture checks on the bundle and its contents. | antivenom (§12 — adversarial input class), AGI-survey (§4 — axis vector for the bundle's agent contents), MARBLE (§5 — coordination-cost regression bench). | **Sentra** (posture API) + **A11oy** (release gating). | `szl-mesh` — Sentra posture API is already in the bundle; antivenom catalogue ships alongside. | `sentra.antivenom-match.v1`, `agi.axis-rating.v1`, `bench.marble.v1`. |
| 3 | **Drone AI oversight** — keeping a human in the loop for autonomous drone decisions. | GraphPlanner (§3 — DAG plans with per-node approval), ctm-ai (§8 — broadcast + suppressed alternatives), sotopia-rl (§9 — third-party judge for the human-in-the-loop interaction). | **ROSIE** (primary) + **ROSIE Mobile** (operator-side approval surface). | New: `szl-rosie-oversight` (sibling bundle to szl-mesh; not in scope of this task to ship — listed for the downstream ROSIE task). | `plan.dag.v1`, `consciousness.broadcast.v1`, `approval.judge.v1`. |
| 4 | **Trajectory visualisation** — rendering and exploring multi-actor trajectories with confidence and uncertainty. | GraphPlanner (§3 — DAG topology IS the trajectory), memnet (§10 — episodic recall of past similar trajectories), Time-R1 (§6 — drift along trajectory points). | **ROSIE** (Decision Theater trajectory panel). | `szl-rosie-oversight` (same bundle as #3). | `plan.dag.v1`, `memory.recall.v1`, `anomaly.time-r1.v1`. |
| 5 | **AI at the tactical edge** — running governed agents on disconnected / intermittent links. | UniRec (§1 — local-first recommendation with rationale), antivenom (§12 — local input gating without a round-trip), memnet (§10 — episodic consolidation reduces local memory footprint), ctm-ai (§8 — arbitration that yields a single broadcast suitable for low-bandwidth links). | **A11oy** (primary — A11oy.UDS bundle is already the offline-first path). | `szl-mesh` (existing A11oy package) — extend with `unirec-fabric` and `antivenom-fabric` enabled by default. | `unirec.recommendation.v1`, `antivenom.match.v1`, `memory.recall.v1`, `consciousness.broadcast.v1`. |

**Cross-cutting rule.** No Warhacker demo step may quote a metric or render a recommendation without the corresponding receipt class above being emitted and verifiable from the bundle's proof ledger PVC (see `docs/proposals/defense-unicorns/szl-holdings/uds-mesh/README.md` §5 "A11oy proof ledger"). This is the "no mock theater" principle applied to the demo itself.

---

## Doctrine V6 receipts ledger (summary)

Every integration above emits a receipt class. The full set, indexed by pillar:

**Governed Autonomy**
- `plan.dag.v1` — §3 GraphPlanner. Per-node child: `plan.dag.node.executed.v1`.
- `bench.marble.v1` — §5 MARBLE bench results.
- `consciousness.broadcast.v1` — §8 CTM arbitration with suppressed alternatives.

**Evidence-First**
- `unirec.recommendation.v1` — §1 UniRec with rationale channel.
- `extraction.schema-grounded.v1` — §2 KnowledgeExtraction with gaps and conflicts.
- `agi.axis-rating.v1` — §4 AGI-survey axis vector.
- `anomaly.time-r1.v1` — §6 Time-R1 bucket drift.
- `vision.seeing-eye.v1` — §7 SeeingEye visual grounding.

**Policy-Aware Actions**
- `approval.judge.v1` — §9 sotopia-rl third-party judge.
- `antivenom.match.v1` — §12 antivenom attack/antidote.

**Operational Ontology**
- `memory.recall.v1` — §10 memnet dual-index recall with path log.

(§11 research-projects emits no runtime receipt — it lives at the documentation layer.)

---

## What this document is not

- It is not the implementation. Code lives in the four dependent tasks (ROSIE / A11oy / Sentra / Amaru evolution).
- It is not a vendor list. No upstream code is imported; every primitive above is re-expressed against our existing packages.
- It is not exhaustive. Each upstream repo has more ideas than survive distillation; only the 2–4 primitives per repo that *fit our doctrine* are listed. The remainder live as `SKT-####` entries under §11 if and when they are picked up.

---

*This synthesis is the source of truth for the four queued evolution tasks. Update this document — not the downstream tasks — when a new primitive is adopted or a receipt class is added.*
