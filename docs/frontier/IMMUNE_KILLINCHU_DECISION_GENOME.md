# Immune + Killinchu Decision Genome Frontier

Status: `MODELED` design direction with additive implementation slices.

## Product boundary

Immune is the governed reasoning and adaptation plane. Killinchu is the
constrained incident-command and action plane. Neither system may infer that
an HTTP response, a vendor claim, a model score, or a signed-but-incomplete
record is production proof.

The shared Decision Genome links:

`observation -> normalization -> fusion -> recommendation -> authorization or denial -> execution -> outcome`

Every transition carries exact source identity, freshness, rights, uncertainty,
policy version, subject digest, predecessor digests, actor, and evidence label.

## Transferable lessons

- Palantir models operational objects and authorized actions through a semantic
  layer, with human review and controlled deployment.
- Anduril models entities and task lifecycles with provenance, source time,
  uncertainty, liveness, and local-first operation.
- Bricklayer AI describes specialist security agents assembled into governed
  procedures rather than one unrestricted general agent.
- Microsoft Dynamic Threat Detection demonstrates planner-executor separation,
  supporting and refuting evidence, schema validation, bounded retries, and
  fail-closed handling.
- Open defensive ecosystems such as OpenCTI, MISP, Sigma, MITRE CALDERA,
  Atomic Red Team, CAGE, CybORG++, in-toto, Sigstore, OCSF, Stone Soup, PX4,
  Gazebo, and Open MCT provide legal study paths subject to their exact licenses.

Public documentation does not grant permission to copy proprietary algorithms,
patented claims, restrictive SDKs, datasets, weights, or private implementation
details. Vendor-reported performance remains vendor-reported.

## Kernel sequence

1. Provenance-Causal Truth Kernel.
2. Immuno-Conformal Danger Gate.
3. Causal Mechanism Shift and Root-Cause Kernel.
4. Spectral Immune Segmentation Kernel.
5. Safe Active-Inference Response Kernel behind a hard safety shield.
6. Byzantine Immune Swarm Kernel in CAGE/CybORG defensive sandboxes.

The first Immune slice implements a deterministic shadow gate:

`risk = .25 novelty + .30 danger + .20 baseline + .15 causal + .10 propagation`

When at least 20 calibration scores exist:

`p = (1 + count(calibration_score >= risk)) / (n + 1)`

Missing provenance, stale evidence, and insufficient calibration downgrade the
result. Hard policy signals cannot be canceled by benign context. Outputs are
recommendations only and remain `MODELED`.

## Operational Killinchu sequence

1. Project every existing tab into one incident object.
2. Show source state, freshness, affected endpoints, priority, next allowed
   action, approval boundary, and receipt lineage.
3. Permit automatic execution only after a separately verified, signed,
   expiring authorization lease exists.
4. Begin with read-only probes and receipt export. Add reversible actions only
   after simulation, rollback, and control-barrier evidence exist.
5. Keep destructive actions and hack-back outside the system.

## Next measurable frontiers

- Publish conformance vectors for the Decision Genome contract.
- Add cryptographic lease verification against trusted identity roots.
- Add time-, topology-, site-, and device-held-out calibration benchmarks.
- Measure false alerts per asset-day, detection delay, analyst workload,
  authorization violations, rollback count, and false-green count.
- Build an Immune Gym for DDIL operation, spoofed sensors, stale twins,
  Byzantine nodes, revocation, operator overload, and exact-source replay.
- Add rights-preserving coalition adapters with field-level purpose, retention,
  classification, and license enforcement.

## Primary public sources

- Palantir Ontology: https://www.palantir.com/docs/foundry/ontology/overview
- Anduril entity model: https://developer.anduril.com/guides/entities/overview
- U.S. Army NGC2 common data baseline:
  https://www.army.mil/article-amp/293409/army_and_industry_align_on_common_data_baseline_as_next_generation_command_and_control_moves_from_prototyping_to_delivery
- CAGE Challenge 4: https://cage-challenge.github.io/cage-challenge-4/
- CybORG++: https://github.com/alan-turing-institute/CybORG_plus_plus
- Dendritic Cell Algorithm: https://arxiv.org/abs/1006.5008
- Adaptive Artificial Immune Networks: https://arxiv.org/abs/2402.07714
- CADES conformal anomaly detection:
  https://proceedings.mlr.press/v267/zhang25dn.html
- SLSA provenance: https://slsa.dev/spec/v1.2/provenance
- W3C PROV-O: https://www.w3.org/TR/prov-o/
