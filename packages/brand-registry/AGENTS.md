# AGENTS — packages/brand-registry

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the brand registry package.

## What This Is

`packages/brand-registry` is the canonical brand vocabulary registry and lint guard for the SZL Holdings platform. It defines approved and banned phrases, product names, and copy conventions. The lint script `scripts/lint-copy.sh` uses this registry to block non-compliant copy.

## This Package Is a Gate

The brand registry is an enforced gate, not a style guide. CI runs `scripts/lint-copy.sh` against all marketing copy and product UI strings. Violations block merge.

## Canonical Vocabulary

| Use | Do not use |
|-----|-----------|
| "governed intelligence" | "AI magic", "automagically" |
| "evidence-backed" | "black box AI" |
| "traceable autonomy" | "fully autonomous", "sentient" |
| "human-confirmed" | "thinks for itself" |
| "policy-gated" | any claim of fully autonomous execution |
| "calibrated confidence" | "certain", "guaranteed" |

## Product Name Rules

- **Lyte** (planned flagship) — not "Lyte Command Center"
- **Vessels** — not "Fleet Intelligence" or "AIS Platform"
- **Terra** — not "Property Intelligence Platform"
- **CORTEX** — the mobile app brand name; not "SZL Mobile"
- **Alloy** — the execution fabric; not "workflow engine" in user-facing copy
- **Carlota Jo** — always two words, always with "Jo"

## Rules for This Package

- Do not modify `banned_phrases` without founder review. Adding a banned phrase affects all CI checks immediately.
- Do not remove a banned phrase that is already in CI. If you think a phrase should be allowed, discuss first.
- New product names must be added to the approved list before they appear in any UI copy.
