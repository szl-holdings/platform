# README Patches — SLSA L1 → L2

**Task:** Wire D + DSSE Cosign Real Signing
**Date:** 2026-06-01
**Author / Signer:** Yachay (Perplexity Computer Agent)
**Tooling rule:** GitHub writes via **gh CLI** (user `stephenlutar2-hash`) · ADDITIVE · Doctrine v11 LOCKED numbers preserved

---

## 1. Summary

The SLSA self-claim in repository READMEs (and supporting prose) was bumped **L1 → L2**, backed by the evidence in `SLSA_L1_TO_L2_BUMP.md` (signed provenance + a real CI-generated SLSA v1.0 provenance bundle in GitHub release assets). No other doctrine numbers were touched.

---

## 2. Commits (per repo, via gh CLI)

| Repo | README commit(s) | Notes |
| ---- | ---------------- | ----- |
| `szl-holdings/a11oy` | `fa13ee6b` | SLSA L1 → L2 |
| `szl-holdings/amaru` | `a04e0362` | SLSA L1 → L2 |
| `szl-holdings/sentra` | `127996bd` (+ prose `1d8d6dbe`) | SLSA L1 → L2 |
| `szl-holdings/killinchu` | `17039ad4` (+ prose `6db6ec2a`) | SLSA L1 → L2 |
| `szl-holdings/rosie` | `721814f1` | SLSA L1 → L2 |
| `szl-holdings/vessels` | `b76ebf89` | SLSA L1 → L2 |
| `szl-holdings/platform` | **PR #277** | Branch-protected — patch via PR, not direct push |

PR link: `https://github.com/szl-holdings/platform/pull/277`

---

## 3. Verification Key Published

`cosign.pub` is published at the org default community-health repo so the signed provenance/signatures can be verified by anyone:

`https://github.com/szl-holdings/.github/blob/main/cosign.pub`

- Confirmed byte-identical to the local `.secret/cosign.pub`.
- Fingerprint (server-reported, sha256): `a4d73120c312d94bdd6cbdfa6f3d629cfff4b85e7addde5f9c3fd4c02341eb30`.
- Keyid: `szlholdings-cosign`.

---

## 4. Patch Content (substance)

Each README's provenance/security section was edited to:
- State **SLSA Build Level 2** (was L1).
- Link the verification key: `szl-holdings/.github/cosign.pub`.
- Reference signed DSSE provenance and the cosign `verify-blob` path.
- Keep the **honest L2 (NOT L3)** framing.

LOCKED numbers preserved verbatim wherever they appear: 749 declarations / 14 unique axioms / 163 sorries, 13-axis `yuyay_v3`, replay `bacf5443…631fc5`, Λ = Conjecture 1 (NOT theorem).

---

## 5. Honesty Statement

The only self-claim changed in any README is SLSA L1 → L2, and only with the explicit evidence documented in `SLSA_L1_TO_L2_BUMP.md`. The branch-protected `platform` repo was handled via PR (not forced), respecting repo governance.

— Signed: **Yachay**, Perplexity Computer Agent · 2026-06-01
