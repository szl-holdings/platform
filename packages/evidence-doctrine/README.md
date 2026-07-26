# Evidence Doctrine

Status: **DRAFT / NOT EXTERNALLY PUBLISHED**

This Apache-2.0 reference package defines Decision-SLSA (D-SLSA), a fail-closed
maturity model for evidence attached to governed decisions. It is designed to
make the difference between a recorded decision, a signed record, a replayable
record, and hardware-attested execution mechanically visible.

This directory is staged inside the SZL Holdings platform monorepo. The intended
standalone public repository and Zenodo concept DOI `10.5281/zenodo.19944926`
have **not** been created or deposited by this change. Do not cite that DOI as a
published artifact until the deposit is independently verified.

## Levels

| Level | Cumulative requirements |
|---|---|
| D0 | The supplied evidence does not satisfy D1. |
| D1 | Records identify decision inputs, the policy applied, and the output. |
| D2 | D1 plus a verified signature and verified tamper evidence. |
| D3 | D2 plus a verified third-party transparency log, byte-identical replay, and offline verification. |
| D4 | D3 plus verified hardware-attested execution, a formally specified policy, and a machine-checked denial. |

Levels are cumulative. An unverified or absent requirement stops advancement at
the preceding level. A signature by itself cannot imply D2, D3, or D4.

## Run

```text
pnpm --filter @szl-holdings/evidence-doctrine test
pnpm --filter @szl-holdings/evidence-doctrine typecheck
```

The TypeScript and Python references implement the same requirement names and
monotonic grading rule. They accept explicit `VERIFIED`, `UNVERIFIED`, and
`ABSENT` states; truthy values and marketing labels are not accepted as proof.

## Lambda case-study boundary

The included guard encodes Lambda uniqueness as **Conjecture 1**: open, gray,
and not machine-checked. It rejects a green, proved, or machine-checked
representation. Theorem U is conditional on its declared premises and does not
close Conjecture 1.

See [the draft specification](specs/DSLSA-v14.md) and the
[conservative self-assessment](docs/SZL_SELF_ASSESSMENT.md).
