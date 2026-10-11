# Ovis evaluation dependency security refresh — 2026-10-11

`workcell_id`: `OVIS-EVAL-SECURITY-REFRESH-20261011`

## Trigger

Platform pull request #920 first published exact head
`1d8438e0384b02196d32989ca7d20939e3c11f6b`. GitHub dependency review and
Trivy rejected the newly added service lock because Transformers `5.3.0` fell
inside three HIGH advisory ranges. No suppression or vulnerability allowlist
was added.

## Reviewed advisory evidence

GitHub's reviewed global-advisory API was queried on 2026-10-11. It reported
these relevant ranges:

| Advisory | CVE | Affected Transformers range | First patched release recorded by GitHub |
|---|---|---|---|
| `GHSA-fgcw-684q-jj6r` | `CVE-2026-5241` | `< 5.5.0` | `5.5.0` |
| `GHSA-x9r9-c232-4q39` | `CVE-2026-80047` | `>= 4.49.0, <= 5.8.1` | Unlisted; reviewed range ends at `5.8.1` |
| `GHSA-xrqw-3rrv-vx5w` | `CVE-2026-9856` | `< 5.10.0` | `5.10.0` |

The same query returned no reviewed HIGH Transformers advisory whose affected
range includes `5.19.0`. This is bounded advisory evidence, not a complete
vulnerability-free claim.

## Remediation

- The exact optional dependency, canonical manifest, current evaluation guide,
  and runtime fail-closed version constant now bind Transformers `5.19.0`.
- Runtime identity advances from `1.0.1` to `1.0.2`.
- Lock regeneration updates Tokenizers from `0.22.2` to `0.23.3` and
  Transformers from `5.3.0` to `5.19.0` without changing the pinned
  Accelerate, Torch, or Qwen Omni Utils identities.
- The refreshed `services/substrate-py-workers/uv.lock` SHA-256 is
  `ab81d23b5db9ef8a476f7448493c8b0750a65fcd3f0bb6af3281e8cc83b8da0c`,
  and the canonical manifest binds that digest.
- No scanner exception, ignored CVE, mutable version range, remote-code trust,
  network-enabled media path, or production-promotion path was introduced.

## Verification

| Command or check | Result |
|---|---|
| `uv lock --check --project services/substrate-py-workers` | Exit 0; the committed lock is current. |
| locked Ovis-extra sync dry run | Exit 0; the exact GPU dependency graph resolves without installing it. |
| locked development sync plus the complete substrate worker suite | Exit 0; every collected service-local case passed. |
| isolated Transformers import | Exit 0; version `5.19.0`, `AutoProcessor`, and `Qwen2_5OmniForConditionalGeneration` imported without Torch installation or checkpoint access. |
| public-surface, local-truth, truth-schema, allowlist, and claim-drift gates | Exit 0 after synchronizing the canonical workflow count. |
| dependency review and Trivy | Must rerun on the successor remote head; local source does not assert their hosted conclusion. |

## Remaining boundary

The environment still blocks `api.osv.dev`, so the complete locked graph has
not received an OSV audit here. The GitHub advisory observation covers reviewed
Transformers advisories only. Ovis remains `EVALUATION_HOLD` with
`productionServingAllowed=false`; no GPU closure was installed, no checkpoint
was downloaded, and no image, hardware, performance, quality, or qualification
receipt was produced. The deployment and model holds in the integration proof
remain unchanged.

`recorded_at`: `2026-10-11T07:15:34Z`

`recorded_by`: Codex (`/root`)
