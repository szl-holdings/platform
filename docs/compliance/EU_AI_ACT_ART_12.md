# EU AI Act Articles 9-15 — Evidence Map

**Status:** Technical gap analysis
**Assessment date:** 2026-07-25
**Owner:** Engineering / Governance
**Legal posture:** This document is not legal advice, a high-risk classification,
a conformity assessment, or a declaration of compliance.

## Timing correction

The original Frontier brief stated that Annex III high-risk obligations would
become enforceable on 2 August 2026. That statement is no longer current.
The European Commission's page updated 24 July 2026 says that, following the
AI Omnibus, rules for systems in specified high-risk areas apply from
**2 December 2027**, while rules for high-risk systems integrated into regulated
products apply from **2 August 2028**. Other AI Act provisions retain different
application dates.

Authoritative references:

- [European Commission — AI Act implementation timeline](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
- [Regulation (EU) 2024/1689 — official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)

SZL has not made a legal determination that any deployed SZL system is an
Annex III high-risk AI system. The `high_risk` and `annex_iii_category` receipt
fields must be set by an accountable classification process; they must not be
inferred from marketing, a product name, or the existence of governance code.

## Status rules

- **SATISFIED** — the complete obligation is implemented for the assessed
  system and backed by current, deployment-specific evidence.
- **PARTIAL** — useful controls or evidence exist, but the complete obligation
  or its deployment coverage is not demonstrated.
- **NOT ADDRESSED** — no relevant implemented control or evidence was found.

The status is an engineering evidence assessment, not a legal conclusion.

## Articles 9-15

| Article | Obligation summary | Status | Evidence found | What remains |
|---|---|---|---|---|
| 9 | Risk-management system across the AI-system lifecycle | **PARTIAL** | Policy validators and hard stops exist in `packages/codex-kernel/src/validators.ts` and `packages/codex-kernel/src/kernel.ts`; risk registers and incident procedures exist under `docs/operations/`. | Approve a per-system AI risk-management process; document intended purpose and reasonably foreseeable misuse; assign owners; connect risk treatment, residual-risk acceptance, testing, production monitoring, and change control for every system classified high-risk. |
| 10 | Data and data-governance controls for training, validation, and test data | **PARTIAL** | Evidence provenance, tenant controls, retention rules, and domain profiles exist under `packages/aef-*` and `docs/aef/`. | Produce a controlled data-governance dossier for each relevant model/system: provenance, collection choices, preparation, representativeness, bias examination, data gaps, data-quality acceptance criteria, and deployment-specific evidence. Current repository-wide controls do not prove this for a high-risk system. |
| 11 | Technical documentation sufficient to assess conformity | **PARTIAL** | Architecture, system-card schemas, risk-report schemas, public-claim doctrine, proof packets, and source inventory are tracked in this repository. | Create and maintain a versioned, per-system technical file aligned to the applicable legal requirements and Annex IV. Existing general documentation is not a complete high-risk-system technical file. |
| **12** | **Automatic record-keeping and traceability over the system lifetime** | **PARTIAL** | Codex-Kernel automatically records state transitions and rejects replay tampering; receipt schema v2 adds explicit runtime regulatory mappings; `a11oy article12 --export` creates a signed, time-bounded evidence archive and refuses an export when a selected receipt lacks a Rekor inclusion proof; the public verifier contains DSSE verification logic. | Demonstrate that every relevant production path emits a genuinely signed receipt into one governed chain; verify cross-service parent links; enforce the declared retention class; retain required logs for the legally applicable period; validate restore/replay against production evidence; and complete accountable high-risk classification. A schema field is not retention enforcement, and archive signing is not proof that every contained receipt was validly emitted. |
| 13 | Transparency and information to deployers | **PARTIAL** | Evidence-tier and public-claim doctrines, structured receipt fields, verification reports, and documented limitations provide useful deployer information. | Publish deployment-specific instructions covering capabilities, limitations, expected input, accuracy/robustness characteristics, human-oversight measures, log interpretation, maintenance, and known risks. General product documentation is insufficient. |
| 14 | Effective human oversight | **PARTIAL** | Approval events, approval status, `human_gate_required`, rejection, and blocked execution are represented in `packages/codex-kernel/src/types.ts` and enforced in `packages/codex-kernel/src/kernel.ts`. The Article 12 export includes oversight events. | Define deployment-specific oversight roles, competence, authority, staffing, monitoring interfaces, override/stop procedures, automation-bias mitigations, and evidence that a rejected or unapproved action cannot execute across every relevant runtime. |
| 15 | Accuracy, robustness, and cybersecurity | **PARTIAL** | CI, property tests, security scans, incident runbooks, telemetry, and hard-stop validators exist. | Set and approve deployment-specific accuracy and robustness metrics; test against foreseeable errors and adversarial conditions; establish monitored thresholds and rollback criteria; close security findings; and retain current evidence for the system version under assessment. |

No row is marked **SATISFIED** because the repository does not contain enough
current, deployment-specific evidence to support that claim.

## Article 12 technical path

```text
runtime event
  -> mesh receipt v2 with regulatory mapping
  -> DSSE signature and Rekor inclusion proof
  -> parent-linked receipt chain
  -> time-bounded Article 12 export
  -> signed manifest + offline checksum verifier
```

Implemented evidence:

- `packages/anatomy-contracts/schema/mesh-receipt.v2.json`
- `packages/anatomy-contracts/schema/regulatory-mapping.v1.json`
- `packages/codex-kernel/src/replay.ts`
- `packages/a11oy-cli/src/article12.ts`
- `apps/verify-api/verify_engine.py`

The export command is:

```bash
a11oy article12 --export \
  --from 2026-07-01 \
  --to 2026-07-31 \
  --input ./article12-source.json \
  --signing-key ./article12-ed25519-private.pem \
  --output ./article12-2026-07.tar
```

`--input` may also come from `A11OY_ARTICLE12_SOURCE`, and the signing key may
come from `A11OY_ARTICLE12_SIGNING_KEY`. The source must contain:

- `receipts`
- `chainProof`
- `rekorInclusionProofs`
- `humanOversightEvents`
- `denialLog`

The command filters receipts to Article 12 and the inclusive time range,
requires one Rekor proof per selected receipt, filters oversight/denial events
to the same range, signs the manifest with Ed25519, and writes an uncompressed
tar archive. `VERIFY.md` and `verify.mjs` inside the archive provide offline
package verification without an SZL service.

## Exit criteria for SATISFIED

Article 12 may move from **PARTIAL** only when all of the following evidence is
attached for the specific assessed system and deployment:

1. Accountable AI Act role and risk classification.
2. Production trace proving automatic receipt emission for all relevant events.
3. Valid receipt-level DSSE signatures and Rekor inclusion proofs.
4. Parent-link verification across every relevant service boundary.
5. Enforced retention and tested restore for the applicable legal period.
6. Byte-identical replay or a documented reason why deterministic replay is not
   an applicable property of a particular event.
7. Independent review of the evidence package and its limitations.
