# `@szl/mcp-governor`

Prototype governance primitives designed for fail-closed MCP tool execution.

The package is designed to supply:

- model-independent Ed25519 capability tokens scoped to an actor, tenant,
  tool set, risk ceiling, validity window, and one-use token ID;
- a canonical governed-action envelope that carries argument digests rather
  than raw secrets;
- a policy-evaluation path designed to convert evaluator errors or malformed
  decisions into blocks while allowing policy to inspect raw arguments;
- signed `before` and `after` receipts around state-changing effects;
- signed `blocked` receipts for denied actions;
- a governor-owned tool executor that receives only the tool name and immutable
  canonical argument snapshot; `run` does not accept per-request execution
  closures;
- a read-only invariant that forbids a `read_only` action from claiming a state
  mutation; and
- a replaceable replay store for multi-instance deployments and an expiring
  in-memory prototype default; and
- an optional, fail-closed hardware-attestation admission gate for selected
  action-risk classes.

Arguments are canonicalized once into an immutable in-process snapshot shared
by the policy evaluator and governor-owned tool executor. Receipts persist only
the snapshot's SHA-256 digest, never the argument payload.

`private: false` makes the workspace package publication-ready. Verify the
exact package version at the public registry before claiming that an external
npm publication occurred.

## Hardware-attestation admission

The governor can act as a Remote ATtestation procedureS (RATS) relying party.
It accepts a compact, signed `szl.attestation-result/v1` token from a configured
Verifier and appraises that result against local reference values before policy
evaluation or tool execution.

An admitted result is bound to:

- the action ID, actor, tenant, tool, risk, state-mutation flag, and canonical
  argument digest through a 256-bit challenge;
- the one-use capability token ID and nonce when a capability is present;
- a configured attestation type, verifier, workload identity, issuer,
  measurement, and reference-policy digest;
- a bounded verification time and expiry window; and
- a one-use result ID through a separate replay store.

The supported normalized verifier routes are NVIDIA NRAS, AMD SEV-SNP VCEK,
Intel Trust Authority or Intel DCAP for TDX, and TPM 2.0 quote verification.
The result token can use Ed25519 (`EdDSA`), P-256 (`ES256`), or RSA-PSS with
SHA-384 (`PS384`). A missing token, unavailable verifier configuration,
untrusted issuer, invalid signature, stale result, challenge mismatch,
unrecognized measurement, policy mismatch, or replay blocks the action and
produces a signed blocked receipt.

```ts
const governor = new McpGovernor({
  // Existing policy, capability, executor, receipt, and clock configuration.
  ...baseConfig,
  attestation: {
    requiredRisks: ['high', 'critical'],
    references: [
      {
        attestationType: 'nvidia-cc',
        verifier: 'nvidia-nras',
        workloadId: 'approved-inference-workload',
        issuers: ['https://configured-verifier.example'],
        measurements: ['sha384:<approved measurement>'],
        referencePolicyDigests: ['sha256:<approved appraisal policy>'],
      },
    ],
    publicKeyResolver: resolvePinnedVerifierKey,
    replayStore: durableAttestationReplayStore,
    maxResultAgeSeconds: 120,
    maxTokenLifetimeSeconds: 300,
    allowedClockSkewSeconds: 5,
  },
});
```

This package deliberately consumes normalized Attestation Results rather than
claiming to verify vendor-specific raw Evidence itself. The configured Verifier
must perform the hardware-specific cryptographic appraisal and sign the
normalized result; the governor independently verifies that signature and
applies its relying-party reference policy. This separation follows the RATS
Verifier/Relying Party model and keeps vendor evidence parsing out of the tool
execution process.

The unit tests use generated software keys and synthetic claim values to test
denial and binding behavior. They are not hardware evidence. A deployment must
observe a real vendor-backed result before labeling any execution
hardware-verified or `MEASURED`.

Primary references:

- [IETF RFC 9334 — RATS Architecture](https://www.rfc-editor.org/rfc/rfc9334.html)
- [IETF RFC 9711 — Entity Attestation Token](https://www.rfc-editor.org/rfc/rfc9711.html)
- [NVIDIA Remote Attestation Service](https://docs.nvidia.com/attestation/cloud-services/latest/nras/nras_introduction.html)
- [AMD SEV-SNP attestation overview](https://docs.amd.com/api/khub/documents/~uAtQszeypAVVEk_B91Ojg/content)
- [Intel Trust Authority attestation tokens](https://docs.trustauthority.intel.com/main/articles/articles/ita/concept-attestation-tokens.html)
- [Trusted Computing Group TPM 2.0 specifications](https://trustedcomputinggroup.org/work-groups/trusted-platform-module/)
