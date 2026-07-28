# Proof Packet — MCP hardware-attestation admission

**Workcell:** FRONTIER-ATTESTATION-ADMISSION-2026-07-28  
**Repository:** `szl-holdings/platform`  
**Branch:** `agent/frontier-attestation-admission-20260728`  
**Evidence state:** implementation `VERIFIED`; live hardware evidence `UNAVAILABLE`

## Plan

Implement the missing relying-party admission boundary between vendor-backed
hardware verification and governed MCP tool execution. The boundary must:

1. fail closed for configured action-risk classes;
2. cryptographically verify signed Attestation Results;
3. bind each result to the exact governed action and one-use capability;
4. appraise workload, issuer, verifier, measurement, and reference-policy
   values against pinned local configuration;
5. enforce freshness, bounded lifetime, and replay protection;
6. carry the verified result into signed before/after/blocked receipts; and
7. preserve the truth boundary that software fixtures are not hardware proof.

## Patch

- Added `packages/mcp-governor/src/attestation.ts`:
  - canonical `szl.attestation-result/v1` claims;
  - Ed25519, ECDSA P-256, and RSA-PSS SHA-384 signatures;
  - 256-bit action/capability challenge derivation;
  - bounded token parsing and claim validation;
  - issuer, action, actor, tenant, workload, verifier, reference measurement,
    and reference-policy appraisal;
  - freshness and lifetime enforcement.
- Extended `McpGovernor` with:
  - constructor-time fail-closed configuration validation;
  - risk-selective attestation requirements;
  - caller-stable action ID enforcement;
  - independent one-use attestation replay storage;
  - signed receipt propagation.
- Added public exports and package subpath `@szl/mcp-governor/attestation`.
- Added 9 attestation-focused tests, bringing the package total from 24 to 33.
- Documented the RATS Verifier/Relying Party boundary and vendor routes.
- Updated `docs/operations/known-gaps.md` without closing DSLSA-004: the
  admission implementation is present, but a real hardware-backed run remains
  required.

## Verification

| Command | Result |
|---|---|
| `pnpm --filter @szl/mcp-governor lint:ci` | `PASS` — 8 files checked, 0 findings |
| `pnpm --filter @szl/mcp-governor typecheck` | `PASS` |
| `pnpm --filter @szl/mcp-governor test` | `PASS` — 33/33 |
| `pnpm --filter @szl/mcp-governor build` | `PASS` |
| root `pnpm lint` | `PASS` — 0 errors; pre-existing warnings remain |
| `pnpm docs:claims-check` | `PASS` — 26/26 |
| `pnpm brand:check` | `PASS` |
| `git diff --check` | `PASS` |
| root `pnpm typecheck` before patch | `BASELINE FAIL` — unrelated workspace packages lacked local dependency links |
| root `pnpm typecheck` after patch | `BASELINE FAIL` — same environment class; target package typecheck remains green |
| `pnpm verify:claims:strict` | `BASELINE FAIL` — tracked script requires absent `launch/FINAL_ABILITY_SCORECARD.csv` |

No routes or UI surfaces changed, so `pnpm qa:routes` and screenshot capture do
not apply.

## Negative controls

The tests machine-check denial for:

- missing attestation result;
- missing caller-stable action ID;
- invalid reference measurement;
- stale result;
- expired result;
- action/capability challenge mismatch;
- replayed result; and
- incomplete admission configuration.

Receipt tampering with the admitted measurement invalidates the receipt
signature.

## Standards and vendor references

- IETF RFC 9334, Remote ATtestation procedureS Architecture
- IETF RFC 9711, Entity Attestation Token
- NVIDIA Remote Attestation Service
- AMD SEV-SNP attestation and VCEK verification model
- Intel Trust Authority / Intel DCAP TDX attestation
- Trusted Computing Group TPM 2.0 quote specifications

## Truth boundary

The unit tests use generated software keys and synthetic measurements. They
verify code behavior only. No NVIDIA GPU, AMD SEV-SNP VM, Intel TDX trust
domain, or TPM 2.0 device was available to this workcell. Consequently:

- the admission implementation is `VERIFIED`;
- a hardware-attested execution remains `UNAVAILABLE`;
- D4 is not established; and
- no `MEASURED` hardware claim is authorized by this packet.
