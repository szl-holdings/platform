---
id: SKT-PERC-003
title: Sequence-pipeline as ingest substrate
disposition: productionised
source: docs/research/perception-bio-synthesis-2026.md §2, §7
package: '@szl-holdings/sequence-pipeline'
receipt-class: pipeline.stage.v1, pipeline.tabulated-statistic.v1
---

# SKT-PERC-003 — Sequence-pipeline as ingest substrate

The CRISPResso2 staged-pipeline shape (read-quality-filter → alignment
→ edit-classification → allele-frequency → statistical-test) lifts to
**any** multi-stage ingest. The package generalises it to a typed
`StagedPipeline.run(input, stages)` with one hashed artefact per stage
and a terminal tabulated statistic with CI columns.

Composes with AGI-§2 schema-grounded extraction: schema-grounded
extraction is a valid *first stage* of a sequence-pipeline. The
dependent extraction task should expose this composition in
`packages/sequence-pipeline/src/stages/schema-grounded.ts` when the
AGI side lands.

**Disposition rationale.** `productionised` once Amaru + Sentra
integration tasks consume the pipeline in their ingest paths.
