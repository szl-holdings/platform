# Perception & Bio-Stack Synthesis — 2026

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Status:** DOCTRINE-PASS · Companion to `agi-stack-synthesis-2026.md` (Task #5500)
**Scope:** Seven external artefacts under `github.com/standardgalactic` distilled into SZL primitives. No upstream source is copied; every primitive is re-expressed against AMI v2, Lutar Lambda (Cleanliness / Horizon / Resonance / Reconciliation), the Ising/WebGPU solver, Ouroboros Λ-receipts, SZL Doctrine V6, the Amaru sync envelope, and the Sentra remediation stages.

This document is the single source of truth for the seven dependent integration tasks (perception/bio primitives in packages, A11oy reviewer flow, ROSIE planner+drone-oversight, Sentra Detector Council, Amaru ingest+episodic recall, Vessels sim-physics, api-server contracts). Each of those tasks consumes its section here and stops short at the file-level "what we build" hooks.

---

## How to read this document

Per-repo contract (identical shape to `agi-stack-synthesis-2026.md`):

1. **Thesis** — one paragraph, plain English.
2. **Core primitives** — 2–4 algorithmic / data-shape ideas worth re-expressing, with formulas or data shapes where they exist upstream.
3. **Closest SZL module** — what already exists; whether we **extend** or **add a sibling**.
4. **Target artifact(s)** — where the re-expression lands.
5. **What we build** — concrete, file-level hooks the downstream task can start cutting against.
6. **Doctrine V6 compliance** — which pillar (Governed Autonomy / Evidence-First / Policy-Aware / Operational Ontology) and what receipt class the integration emits.

The cross-cutting **Warhacker × Perception mapping**, the **delta-only** notes for `research-projects` and `standardgalactic`, and the **Doctrine V6 receipts ledger** at the end tie the per-repo entries together.

---

## Open follow-up clarifications

Items where upstream intent is ambiguous enough that the dependent extraction tasks should pause and ask before porting:

- **`spherepop` scoring** — the upstream loop awards combo multipliers on chained pops, but the multiplier curve is empirical, not derived. The integration task must decide whether to keep the empirical curve as a "frozen fixture" or to re-derive it inside the Ising solver as an emergent payoff function. The synthesis below assumes the latter; flag this if a maintainer disagrees.
- **`human` iris/emotion sub-modules** — the upstream library ships these as opt-in. Reviewer-presence use cases (A11oy) need iris only for liveness; Sentra operator-loop anomaly needs body+hand. Confirm which submodules are in scope per integration before bundle ships, as the WASM weight footprint is non-trivial.
- **`CRISPResso2` allele-frequency outputs** — upstream emits both *quantified-fraction* and *quantified-count* columns; the former is what we want for evidence ledger normalisation. Confirm before mapping.
- **`MsdialWorkbench` peak-area vs. peak-height** — different downstream consumers (statistics vs. visualisation) prefer different normalisations. We standardise on peak-area for the receipt class but visualise peak-height; flag if a maintainer disagrees.
- **`kitbash` UV-unwrap inheritance** — the upstream pattern composes meshes but does not always re-bake UVs. For OpenUSD export we need a deterministic UV strategy; flag if the integration task hits a re-bake decision.

---

## 1. standardgalactic / human (Human.js)

**Thesis.** A browser-native perception substrate that runs face, body (pose), hand, iris, gesture, and emotion detection on a single shared video pipeline, with all models WebGL/WebGPU-accelerated and a uniform `Result` schema across detectors. The contribution worth re-expressing is not the models themselves — those are off-the-shelf BlazeFace / BlazePose / Affectnet-style heads — but the **single-pipeline-multi-head architecture** and the **per-frame structured result envelope**: every detector emits boxes, keypoints, confidences, and class labels against the *same frame hash*, so downstream consumers correlate across modalities without re-running inference. Crucially for our doctrine, every detection arrives with a confidence and a bounding shape — never as a free-text caption.

**Core primitives.**
1. **Shared frame pipeline** — one decoded frame → N detector heads → one structured result. Frame is hashed once; every head's output references that hash.
2. **Uniform `Result` envelope** — `{ face[], body[], hand[], gesture[], object[], person[], performance{} }`. Every per-detection record carries `score ∈ [0,1]`, `box: [x,y,w,h]` in normalised coords, `keypoints[]` (when applicable), and the head's model version.
3. **Liveness checks** — iris movement + blink + head-pose deltas across frames give a `livenessConfidence` that distinguishes a real operator from a static image or video replay.
4. **Per-frame budget** — detectors can be disabled per-tick to hit a frame budget; the envelope explicitly records which heads ran and which were skipped, so absence-of-data is distinguishable from absence-of-target.

**Closest SZL module.** None directly. `packages/seeing-eye` (proposed in §7 of the AGI synthesis) handles *generic* visual grounding from agent vision; Human.js is a *specialised* multi-head detector for the **operator-loop** (reviewer presence) and **scene-actor** (drone POV) classes. The two are siblings, not the same package.
**Action:** **add a sibling** package `packages/perception-loop` that wraps a Web-Worker-friendly pipeline, exposing one `detect(frame, heads[]): PerceptionEnvelope` call. Do not depend on Human.js source; re-express the envelope shape and call a thin runtime adapter that can swap detectors (TF.js, ONNX-Web, or future WebGPU backends) without changing the envelope.

**Target artifact(s).** **A11oy** (primary — reviewer-presence: who is at the keyboard during a high-autonomy approval, with what attention state), **Sentra** (primary — operator-loop anomaly: is the analyst at the console during an incident response, or did they walk away mid-action?), **ROSIE Mobile** (secondary — drone-side scene actors), **ROSIE** (secondary — Decision Theater operator presence telemetry).

**What we build.**
- `packages/perception-loop/src/envelope.ts` — typed `PerceptionEnvelope` with `frameHash`, `ranHeads[]`, `skippedHeads[]`, `face[]`, `body[]`, `hand[]`, `gesture[]`, `liveness{}`, `budgetMs`. Every nested record carries `score`, `box`, `keypoints[]?`, `modelVersion`.
- `packages/perception-loop/src/pipeline.ts` — `detect(frame, heads[], budgetMs): PerceptionEnvelope`. Worker-friendly; no DOM access in the core.
- `packages/perception-loop/src/liveness.ts` — multi-frame state machine that turns blinks + iris motion + head-pose deltas into `livenessConfidence ∈ [0,1]` with explicit `livenessReasons[]`.
- A11oy hook: `artifacts/a11oy/src/runtime/reviewer-presence.ts` consumes the envelope on the approval-gate critical path; an approval that crosses the autonomy-tier threshold without a `livenessConfidence ≥ θ_reviewer` is blocked at the policy gate.
- Sentra hook: `packages/sentra-detector-sdk/src/operator-loop-detector.ts` ingests the envelope as a Sentra `EvidenceSignal` and feeds the Detector Council — "operator absent during stage advance" is its own remediation-blocking detector.
- ROSIE-Mobile hook: `artifacts/rosie-mobile/` records perception envelopes from the drone POV at fixed intervals and posts them to the evidence ledger as scene-context attachments.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First + Policy-Aware Actions (reviewer-presence is a policy input, not just telemetry).
- **Receipt:** `perception.envelope.v1` — fields: `frameHash`, `ranHeads[]`, `skippedHeads[]`, `livenessConfidence`, `detectionsSummary{ counts }`, `budgetMs`, `consumerArtifact`. A high-autonomy approval that lacks a recent (Δt ≤ τ_freshness) perception envelope is rejected at gate evaluation — symmetric with the "no plan without a receipt" rule in `plan.dag.v1`.

---

## 2. standardgalactic / CRISPResso2

**Thesis.** A structured, statistically-rigorous pipeline for analysing pooled-amplicon sequencing data around CRISPR edit sites. The contribution worth re-expressing is the **pipeline-as-evidence-ledger shape**: every stage (read trim, alignment, edit-call, allele-frequency tabulation, statistical test) emits a typed artefact with its inputs, its parameters, and its outputs hashed together, so any downstream claim ("edit efficiency = 0.42") can be walked back to the exact reads that produced it. This is the same principle as Λ-receipts, but applied to a domain where reproducibility is regulatory.

**Core primitives.**
1. **Staged pipeline with per-stage artefact** — read-quality-filter → alignment → edit-classification → allele-frequency → statistical-test, each with a hashed `(inputs, params, outputs)` triple.
2. **Allele-frequency table as the canonical statistic** — `{allele: string, count: int, fraction: float, ciLower: float, ciUpper: float}`; CIs are mandatory, not optional.
3. **Negative-space markers** — "unmodified reference" is its own allele row, with its own fraction and CI; absence of editing is reported, not inferred from missing rows.
4. **Reproducibility envelope** — the run records the tool version, the reference sequence hash, the guide sequence, and the parameter set; identical envelopes are required to identical statistics.

**Closest SZL module.** `packages/evidence-ledger` + `packages/aef-evidence-ledger` (substrate for per-stage hashed artefacts) and `packages/szl-receipts` (the receipt envelope itself). What's missing is a **sequence-style pipeline schema** — a typed contract for "this is a multi-stage, statistically-tabulated, CI-bearing pipeline" that is currently re-implemented ad-hoc per ingest in Amaru.
**Action:** **add a sibling** package `packages/sequence-pipeline` that wraps `evidence-ledger` with a `StagedPipeline<TStage extends string>` runner. The runner emits `pipeline.stage.v1` and a terminal `pipeline.tabulated-statistic.v1` receipt. CRISPResso2 is the inspiration but the package is generic — any sequence-style ingest (genomic, AIS-track segments, log-event windows) consumes it.

**Target artifact(s).** **Amaru** (primary — sync-envelope ingestion benefits from the staged-pipeline shape immediately), **Sentra** (secondary — incident-timeline reconstruction is structurally a sequence pipeline).

**What we build.**
- `packages/sequence-pipeline/src/staged.ts` — `StagedPipeline.run(input, stages[]): PipelineResult` with one hashed artefact per stage and a terminal tabulated statistic.
- `packages/sequence-pipeline/src/tabulated-statistic.ts` — typed `TabulatedRow = { label, count, fraction, ciLower, ciUpper, isNegativeSpace: boolean }`. The `isNegativeSpace` flag enforces the CRISPResso2 lesson: absence is a row, never a missing row.
- `packages/sequence-pipeline/src/wilson-ci.ts` — Wilson score interval for proportions; no external dep. (Re-uses the `packages/lambda-math` numerical kernel.)
- Amaru hook: `artifacts/conduit/src/server/ingest-pipeline.ts` is refactored to run through `StagedPipeline` so each ingest emits the per-stage receipt chain instead of a single end-of-ingest record.
- Sentra hook: `packages/sentra-detector-sdk/src/incident-timeline.ts` becomes a `StagedPipeline` whose stages are detection → triage → containment → remediation → verification, each emitting its own hashed artefact for post-incident audit.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First.
- **Receipt classes:** `pipeline.stage.v1` (one per stage, chained by `parentPipelineId` + `stageOrdinal`) and `pipeline.tabulated-statistic.v1` (terminal, with mandatory CI columns and explicit negative-space rows). A pipeline that emits a tabulated statistic without CI bounds is rejected at receipt write — the CRISPResso2 lesson re-expressed: *no claim without an interval*.

---

## 3. standardgalactic / MsdialWorkbench

**Thesis.** A workbench for liquid- and gas-chromatography mass-spectrometry that turns a raw 2-D `(retention-time, m/z, intensity)` surface into a tabulated peak list with quality scores, isotope clustering, and library-match hypotheses. The contribution worth re-expressing is the **peak detector → peak score → match hypothesis → confidence-ranked candidate list** flow: at no point does the workbench commit to a single answer; every peak carries a *ranked list* of identifications with per-hypothesis confidences, and the operator chooses the cutoff. This is the structural antidote to "the system silently picked one answer" — a category of failure Sentra explicitly targets.

**Core primitives.**
1. **2-D peak detection over `(x, intensity)` surfaces** — local-max finder with prominence + width gating; emits `{ xCenter, height, width, prominence, snRatio }`.
2. **Peak-score function** — quality is a multi-factor scalar (`α·prominence + β·SN − γ·shape_residual`), not a thresholded boolean.
3. **Ranked-hypothesis output** — every peak gets `Candidate[] = [{label, libraryRef, matchScore, mzDelta, retentionDelta}]`, sorted by `matchScore`, never collapsed to a single label by default.
4. **Batch-processing UI affordances** — the workbench treats N runs as a first-class batch with cross-run alignment and propagated annotations; "this peak in run 12 is the same compound as run 3's peak" is a typed link, not a free-text annotation.

**Closest SZL module.** `packages/anomaly-fabric` (peak/anomaly scoring substrate) + `packages/forecast-fabric` (series-feature surfaces). We have anomaly *scores* but no **ranked-candidate-list** output shape and no **batch-alignment** primitive.
**Action:** **extend** `packages/anomaly-fabric` with two modules — `peak-detector.ts` (the 2-D detector + multi-factor score) and `ranked-candidates.ts` (the never-collapse-to-one output shape) — and **extend** `packages/forecast-fabric` with `batch-alignment.ts` for cross-run series matching.

**Target artifact(s).** **Vessels** (primary — AIS-trajectory peak segments and cross-vessel batch alignment is structurally identical to LC-MS batch processing), **Sentra** (primary — alert peaks over a metric surface, with ranked-hypothesis incident classes), **ROSIE** (secondary — trajectory-viz peak inspector for the Decision Theater).

**What we build.**
- `packages/anomaly-fabric/src/peak-detector.ts` — `detectPeaks(surface, opts): Peak[]` with `prominence`, `width`, `snRatio`, `score`. Pure numeric; no dataset assumptions.
- `packages/anomaly-fabric/src/ranked-candidates.ts` — `RankedCandidates<TLabel>` with mandatory `confidenceCutoff` field; consumers may not collapse to a single label without writing the cutoff into the receipt.
- `packages/forecast-fabric/src/batch-alignment.ts` — cross-run series alignment with typed cross-run links (`alignedTo: { runId, peakId, residual }`).
- Vessels hook: `artifacts/vessels/src/lib/trajectory-peaks.ts` consumes `detectPeaks` over per-vessel speed/heading series and surfaces them as a "what changed" panel.
- Vessels-Pitch hook: `artifacts/vessels-pitch/` uses the same peak detector as the *demo* layer so the pitch surface and the live product share one math kernel.
- Sentra hook: `packages/sentra-detector-sdk/src/alert-peak-classifier.ts` returns `RankedCandidates<IncidentClass>` to the Detector Council; the council's arbitration (§8 of AGI synthesis) consumes the ranked list, never a pre-collapsed label.
- ROSIE hook: `artifacts/rosie/src/components/TrajectoryPeakInspector.tsx` — react surface that renders the ranked-candidate list and forces the operator to select a cutoff before any action is committed.

**Doctrine V6 compliance.**
- **Pillar:** Governed Autonomy + Evidence-First.
- **Receipt:** `peak.detection.v1` (per detected peak; `score` components are itemised, not just the composite) and `peak.classification.v1` (`rankedCandidates[]` + `confidenceCutoff` + `cutoffChosenBy: { actor, rationale }`). The cutoff actor + rationale is mandatory; a system that collapses a ranked list to a single label without writing who/why is rejected at receipt write — the MsdialWorkbench lesson re-expressed.

---

## 4. standardgalactic / spherepop

**Thesis.** A small interactive game/simulator whose loop — spawn coloured spheres, settle them under simple Verlet/impulse physics, detect connected clusters of the same colour, "pop" them with an effect, score by cluster size — is a clean, isolated reference implementation of three primitives we need elsewhere: **lightweight sim physics**, **connected-component detection on a spatial graph**, and **particle/visual-effect emission tied to an event**. None of these are novel in isolation; the contribution worth re-expressing is the *minimal, dependency-free* combination — a kernel small enough to run inside a React surface, a WebGPU shader, or a video artefact without dragging a full game engine in.

**Core primitives.**
1. **Verlet-style sim step** — `position += (position - prevPosition) + acceleration·dt²`; trivially stable with explicit damping. Collision via positional correction (project apart along the contact normal).
2. **Same-label connected-component detection** — union-find over spheres whose centre distance ≤ `r₁ + r₂ + ε` AND `label_i === label_j`. Returns cluster IDs and sizes.
3. **Cluster-event → particle-emitter contract** — `onClusterEvent({ clusterId, members[], centroid, size }) → ParticleEmission[]`. Particle emission is a separable concern from the physics step.
4. **Scoring as a pure function of cluster history** — score is `Σ f(clusterSize_t)`; if `f` is monotone-non-decreasing in size, the loop is incentive-compatible with "merge to bigger clusters before popping."

**Closest SZL module.** None directly. The closest *pattern* is `packages/lambda-math` (numerical kernels) for the sim step and `artifacts/conduit` for cluster detection on graphs of *evidence*. Neither hosts the visual-effects emitter contract.
**Action:** **add a sibling** package `packages/sim-kit` housing the three primitives as independent modules. Each is independently usable: Vessels uses the sim step and the cluster detector, Vessels-Pitch + ROSIE use the particle-emitter contract for trajectory-viz, video artefacts use the whole bundle for demonstration scenes.

**Target artifact(s).** **Vessels** (primary — port-cluster + vessel-collision animation), **Vessels-Pitch** (primary — investor-demo physics surface), **ROSIE** (secondary — Decision Theater event-marker particles), **video-js artefacts** (secondary — explainer animations).

**What we build.**
- `packages/sim-kit/src/verlet-step.ts` — `step(particles, dt, opts): Particle[]`. Pure function; no engine state.
- `packages/sim-kit/src/cluster-detect.ts` — `detectClusters(particles, opts): Cluster[]` via union-find with the `label + radius` predicate.
- `packages/sim-kit/src/emitter-contract.ts` — typed `ClusterEvent` and `ParticleEmission` shapes; no implementation, just the contract so React + Canvas + WebGPU consumers share one event shape.
- `packages/sim-kit/src/scoring.ts` — `score(history, f): number` with a monotonicity self-check that throws if `f` violates the incentive-compatibility property.
- Vessels hook: `artifacts/vessels/src/lib/port-cluster-sim.ts` runs the sim step + cluster detect over vessels-near-port; the cluster events feed the existing alert panel.
- Vessels-Pitch hook: `artifacts/vessels-pitch/` uses `verlet-step` + `cluster-detect` + the particle emitter to render a live "vessels-arriving-at-Dorian-LPG-terminal" scene driven by real AIS data, not canned animation.
- ROSIE hook: `artifacts/rosie/src/components/DecisionTheaterParticles.tsx` consumes the emitter contract to spawn particles on receipt-write events.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First (for the cluster-event linkage to underlying data) + Operational Ontology (cluster definition is a typed ontology object, not a UI artefact).
- **Receipt:** `cluster.event.v1` — fields: `clusterId`, `members[]` (each `members[i]` references the underlying entity, not just a render token), `centroid`, `size`, `triggeredBy`. Particle emissions are *cosmetic* and do not emit receipts; the cluster event that drives them is the receipt-bearing object. *Cosmetic effects never become evidence.* — explicit anti-pattern the receipt boundary enforces.

---

## 5. standardgalactic / kitbash

**Thesis.** Procedural composition of 3-D scenes by *combinatorial assembly* of parameterised parts — wheels onto chassis, antennas onto hulls, modules onto rigs — with deterministic seeds so the same seed reproduces the same scene. The contribution worth re-expressing is the **part-graph as the authoring object**: a scene is a typed DAG of `(partId, transform, child-slot-bindings)` nodes, not a baked mesh. The downstream pipeline (USD/glTF export, instance counting, bill-of-materials) reads the graph; the renderer reads a flattened mesh derived from it.

**Core primitives.**
1. **Part library with named child slots** — a `Part` declares its mesh, its attachment frame, and zero-or-more named slots (`{slotId, allowedPartTags[], localTransform}`).
2. **Composition DAG** — a scene node is `{partId, transform, slotBindings: Record<slotId, ChildNode[]>}`. Composition is recursive; the DAG is acyclic by construction (slot bindings are children, not back-edges).
3. **Deterministic seed → DAG** — given a seed and a library, the generator emits the same DAG every time. The seed is part of the export envelope.
4. **Derived BOM** — the DAG flattens to `{partId: count}`; consumers (procurement, license-checking, cost) read the BOM, not the mesh.

**Closest SZL module.** `packages/openusd-export`. We already export USD; what's missing is the **authoring shape** (the part-graph) that *generates* what we export. Today the exporter consumes hand-authored geometry.
**Action:** **add a sibling** package `packages/procedural-kit` that produces a typed part-graph; **extend** `packages/openusd-export` with a `from-part-graph.ts` adapter so the graph round-trips to USD. The split keeps the procedural authoring concern out of the USD exporter, which stays a pure renderer of typed inputs.

**Target artifact(s).** **Vessels** (primary — fleet/terminal scene composition for the Decision Theater 3-D view), **Vessels-Pitch** (primary — investor-grade scene composition), **ROSIE** (secondary — Decision Theater 3-D actor placement), **Amaru** (secondary — visualised sync-envelope topology as a procedural scene).

**What we build.**
- `packages/procedural-kit/src/part.ts` — typed `Part` with `meshRef`, `attachmentFrame`, `slots[]`.
- `packages/procedural-kit/src/composition.ts` — `Scene = SceneNode`, `SceneNode = { partId, transform, slotBindings }`. DAG-only by construction (slot binding type forces children, not back-edges).
- `packages/procedural-kit/src/seed-generator.ts` — `generate(seed, library, constraints): Scene`. Deterministic.
- `packages/procedural-kit/src/bom.ts` — `bomOf(scene): Record<partId, number>`.
- `packages/openusd-export/src/from-part-graph.ts` — adapter that consumes a `Scene` and emits a USD stage. UV strategy is documented and deterministic (see open follow-up clarification on UV inheritance).
- Vessels hook: `artifacts/vessels/src/lib/terminal-scene.ts` builds a procedural Dorian-LPG terminal scene from a seed; the BOM feeds the existing "what is on-site" panel.
- Vessels-Pitch hook: every pitch surface scene is procedurally generated from a named seed, so the investor demo is reproducible and version-controlled rather than a fragile hand-export.

**Doctrine V6 compliance.**
- **Pillar:** Operational Ontology (the part-graph IS the ontology of the rendered scene).
- **Receipt:** `scene.composed.v1` — fields: `seed`, `libraryRef`, `sceneHash`, `bom{}`, `partGraphHash`. The `partGraphHash` lets any later USD export be proven to derive from a specific authored graph. Visual surfaces that reference a procedural scene without the receipt are blocked at the doctrine scanner — the kitbash lesson re-expressed: *no scene without its seed*.

---

## 6. standardgalactic / standardgalactic (profile / meta repo) — DELTA-ONLY

**Thesis.** GitHub profile / meta repo: README, pinned-repo curation, cross-links. **Not a system.** Treated here because the synthesis must cover it; no overlap with the AGI synthesis profile-level material applies.

**Delta vs. `agi-stack-synthesis-2026.md`.** The AGI synthesis did not address profile-level surfaces at all. The only thing worth recording is:

- **Cross-link surface as a doctrine signal.** The profile is where the *external* world reaches the perception/bio stack. The doctrine consequence is that any badge, link, or claim on the profile must point to a verifiable receipt — same rule as the public-claims registry already enforced for marketing surfaces under `agi.axis-rating.v1`.

**Action.** No package, no artifact. A documentation-only note: when we (later) cross-link to our published synthesis docs, the link target must be a stable receipt hash, not a moving `HEAD`. Tracked as a future follow-up at `docs/research/sketches/SKT-PERC-PROFILE-LINK.md` (to be created when the cross-link actually goes live; out of scope here).

**Doctrine V6 compliance.** Pillar: Evidence-First (meta). No runtime receipt.

---

## 7. standardgalactic / research-projects — DELTA-ONLY

The AGI synthesis (§11) covered `research-projects` as an *umbrella sketch index* and proposed the `docs/research/sketches/SKT-####` ID scheme + the `disposition:` frontmatter convention. That work stands. This synthesis records **only the perception/bio deltas** that the AGI synthesis did not.

**Deltas worth indexing under perception/bio sketches.**

1. **`SKT-PERC-001` — operator-loop liveness as an approval-gate input.** Treat reviewer-presence (§1) as a first-class policy input, not telemetry. Disposition: `try-again` (depends on §1 landing in the perception-loop package). The novel angle vs. the AGI synthesis is that liveness becomes a *blocking* signal in the autonomy-tier gate, where the AGI synthesis only treated approval as a transcript-judging concern (§9 sotopia-judge).
2. **`SKT-PERC-002` — peak detection as cross-domain primitive.** The §3 MsdialWorkbench primitive lifts to AIS trajectories, log windows, and metric surfaces. AGI synthesis Time-R1 (§6) covers temporal *drift*; peak-detector covers *event-shaped* signals. Distinct primitives, same package neighbourhood. Disposition: `productionised` once §3 lands.
3. **`SKT-PERC-003` — sequence-pipeline as ingest substrate.** The §2 CRISPResso2 primitive lifts to *any* multi-stage ingest. AGI synthesis §2 (KnowledgeExtraction) covered the *single-shot* schema-grounded extraction; sequence-pipeline covers the *multi-stage* one. They compose: schema-grounded extraction is the first stage of a sequence-pipeline. Disposition: `productionised` once §2 lands.
4. **`SKT-PERC-004` — procedural-kit as ontology surface.** The §5 kitbash primitive turns scenes into typed ontology objects. The AGI synthesis did not address scene authoring at all. Disposition: `try-again` after Vessels-Pitch consumes it once.
5. **`SKT-PERC-005` — sim-kit as a kernel-not-engine.** The §4 spherepop primitive is a *minimal* sim kernel. The AGI synthesis did not address simulation primitives. Disposition: `productionised` once §4 lands.

**Action.** The downstream "Extract perception/bio primitives into shared packages" task should also create the five `SKT-PERC-###` sketch files under `docs/research/sketches/` with the dispositions above. Do **not** create them here — this synthesis is the spec, not the implementation.

**Doctrine V6 compliance.** Pillar: Evidence-First (meta-applied; every adoption is traceable to a sketch). No runtime receipt.

---

## 8. Warhacker × Perception Mapping

The Warhacker problem map names five demand lanes: **satellite-ground**, **deployment-health-screening**, **drone-AI-oversight**, **trajectory-viz**, **AI-at-the-tactical-edge**. Each row below is *which perception/bio repo idea benefits which lane, owned by which artifact, shipped in which UDS bundle*. Bundles named here are the existing `*-uds` artifacts (`a11oy-uds`, `sentra-uds`, `amaru-uds`) plus the new bundles the dependent tasks will create as needed.

| Warhacker lane | Repo source | Re-expressed primitive | Owning artifact | UDS bundle |
|---|---|---|---|---|
| **Satellite ground** | MsdialWorkbench (§3) | Peak-detection over satellite-pass scalar surfaces + ranked-candidate event classes | ROSIE | rosie-uds (future) |
| **Satellite ground** | CRISPResso2 (§2) | Sequence-pipeline for multi-pass satellite ingest with per-stage receipts and CI-bounded tabulated statistics | Amaru | amaru-uds |
| **Deployment health screening** | human (§1) | Reviewer-presence + liveness as a blocking input on deployment-approval autonomy gate | A11oy | a11oy-uds |
| **Deployment health screening** | CRISPResso2 (§2) | Health-screening *as* a sequence-pipeline: pre-flight check → smoke → soak → cutover → verify, with per-stage receipts | Sentra | sentra-uds |
| **Drone AI oversight** | human (§1) | Scene-actor detection envelopes on drone POV, stamped into the evidence ledger | ROSIE Mobile | rosie-mobile-uds (future) |
| **Drone AI oversight** | MsdialWorkbench (§3) | Ranked-candidate classification for drone-side anomaly classes — no auto-collapse to one label | Sentra | sentra-uds |
| **Drone AI oversight** | spherepop (§4) | Cluster detection over nearby actors (drones, vessels, ground entities) to surface formation events | ROSIE | rosie-uds (future) |
| **Trajectory viz** | spherepop (§4) | Verlet sim step + cluster-event particle emitter for live trajectory animation, driven by real data | Vessels + Vessels-Pitch | vessels-uds (future) |
| **Trajectory viz** | MsdialWorkbench (§3) | Peak-inspector React surface forcing operator cutoff selection before action commit | ROSIE | rosie-uds (future) |
| **Trajectory viz** | kitbash (§5) | Procedural terminal / port / fleet scene composition with deterministic seeds for reproducible demos | Vessels-Pitch | vessels-uds (future) |
| **AI at the tactical edge** | human (§1) | Operator-loop perception envelope on the edge node itself; gates high-autonomy edge actions on local liveness | Sentra | sentra-uds |
| **AI at the tactical edge** | spherepop (§4) | Sim-kit cluster detect runs on-edge with no engine dep, suitable for resource-constrained runtimes | ROSIE Mobile | rosie-mobile-uds (future) |
| **AI at the tactical edge** | CRISPResso2 (§2) | Per-stage receipt chain works offline; chain ships back when connectivity returns, preserving evidence-first under intermittent comms | Amaru | amaru-uds |
| **All lanes** | research-projects (§7) — delta sketches | The five `SKT-PERC-###` IDs above are referenced from PRs that land any of the above | (all artifacts) | n/a (docs) |
| **All lanes** | standardgalactic profile (§6) | Cross-link discipline: external links resolve to receipt hashes, not moving HEAD | (docs only) | n/a |

The five Warhacker lanes × seven repos do not all intersect; the gaps in the table above are intentional — for example, kitbash does not contribute to deployment-health-screening, and CRISPResso2 does not contribute to trajectory-viz.

---

## 9. Doctrine V6 Receipts Ledger (this synthesis)

The integrations defined in §1–§5 introduce the following receipt classes. All names are reserved against the existing `szl-receipts` namespace; the dependent extraction task is responsible for registering them and writing JSON Schemas under `packages/szl-receipts/schemas/`.

| Receipt class | Source § | Pillar | Mandatory fields |
|---|---|---|---|
| `perception.envelope.v1` | §1 Human.js | Evidence-First + Policy-Aware | `frameHash`, `ranHeads[]`, `skippedHeads[]`, `livenessConfidence`, `detectionsSummary{}`, `budgetMs`, `consumerArtifact` |
| `pipeline.stage.v1` | §2 CRISPResso2 | Evidence-First | `parentPipelineId`, `stageOrdinal`, `stageName`, `inputsHash`, `paramsHash`, `outputsHash`, `tooling{}` |
| `pipeline.tabulated-statistic.v1` | §2 CRISPResso2 | Evidence-First | `parentPipelineId`, `rows[] (each with ciLower, ciUpper, isNegativeSpace)`, `methodRef` |
| `peak.detection.v1` | §3 MsdialWorkbench | Evidence-First | `surfaceRef`, `peaks[] (each with itemised score components)`, `detectorVersion` |
| `peak.classification.v1` | §3 MsdialWorkbench | Governed Autonomy + Evidence-First | `peakRef`, `rankedCandidates[]`, `confidenceCutoff`, `cutoffChosenBy{ actor, rationale }` |
| `cluster.event.v1` | §4 spherepop | Evidence-First + Operational Ontology | `clusterId`, `members[] (entity refs, not render tokens)`, `centroid`, `size`, `triggeredBy` |
| `scene.composed.v1` | §5 kitbash | Operational Ontology | `seed`, `libraryRef`, `sceneHash`, `bom{}`, `partGraphHash` |

**Compliance enforcement rules introduced by this synthesis (each becomes a doctrine-scanner check in the dependent extraction task):**

1. **No collapse without provenance.** `peak.classification.v1` writes require `cutoffChosenBy.rationale`; a system that emits a single label without rationale is rejected at receipt write.
2. **No claim without an interval.** `pipeline.tabulated-statistic.v1` rows require `ciLower` and `ciUpper`; rows with `null` CIs are rejected.
3. **Absence is a row.** `pipeline.tabulated-statistic.v1` validates that at least one row has `isNegativeSpace === true` when the schema declares a negative-space label.
4. **No scene without seed.** Visual surfaces that reference a procedural scene must link to a `scene.composed.v1` receipt; doctrine scanner flags surfaces that import a part-graph without the receipt.
5. **No high-autonomy approval without recent perception.** A11oy policy gate that crosses tier T_review requires a `perception.envelope.v1` with `Δt ≤ τ_freshness` and `livenessConfidence ≥ θ_reviewer`.
6. **Cosmetic effects never become evidence.** Particle emissions from §4's emitter contract are explicitly *not* receipt-bearing; the cluster event that drives them is. Scanner check: no `*.particle*` source file may import `szl-receipts`.

---

## 10. Cross-reference to the AGI synthesis

This document is the perception/bio sibling to `agi-stack-synthesis-2026.md`. Composition rules:

- **§1 perception-loop** is to operator-presence what **AGI-§7 seeing-eye** is to agent-vision: same evidence-first shape, different consumer surface. Both can co-exist in the same artifact; an A11oy session can emit both a `vision.seeing-eye.v1` (about an image the agent reasoned over) and a `perception.envelope.v1` (about the reviewer at the keyboard).
- **§2 sequence-pipeline** *composes with* **AGI-§2 schema-grounded extraction**: the latter is a valid first stage of the former. The dependent extraction task should expose this composition explicitly in `packages/sequence-pipeline/src/stages/schema-grounded.ts`.
- **§3 peak-detector** is *distinct from* **AGI-§6 Time-R1 drift**: drift scores describe *baseline shift*, peaks describe *event-shaped excursions*. The dependent extraction tasks must keep them as separate detector classes; do not collapse to one "anomaly" surface.
- **§4 sim-kit** is *orthogonal to* the AGI synthesis (no overlap). Pure new primitive.
- **§5 procedural-kit** is *orthogonal to* the AGI synthesis (no overlap). Pure new primitive.
- **§6 profile + §7 delta sketches** are explicitly *delta-only* relative to AGI-§11 (research-projects umbrella).

---

*Synthesis closed 2026-05-27. Re-open if a new repo enters the `standardgalactic` perception/bio surface, or if a Warhacker lane shifts demand into a gap not covered above.*
