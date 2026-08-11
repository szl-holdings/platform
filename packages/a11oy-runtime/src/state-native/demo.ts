import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { digestObject } from './canonical.js';
import { CognitiveEpochManager } from './epoch-manager.js';
import { AlloyKernelRuntime, kernelRequestDigest } from './kernel-runtime.js';
import { verifyKernelExecutionReceipt } from './receipt.js';
import { ReasoningVault } from './reasoning-vault.js';
import { AlloyStateBus } from './state-bus.js';
import { InMemoryStateTransportAdapter } from './transport.js';
import type { KernelExecutionRequest } from './types.js';

export interface StateNativeDemoResult {
  readonly status: 'OPERATIONAL_REFERENCE';
  readonly networkCalls: 0;
  readonly epochId: string;
  readonly inputCapsuleId: string;
  readonly outputCapsuleId: string;
  readonly outputDigest: string;
  readonly receiptId: string;
  readonly receiptDigest: string;
  readonly receiptVerified: true;
  readonly transportReceiptDigest: string;
  readonly reasoningVaultState: 'SHREDDED';
  readonly result: Readonly<Record<string, unknown>>;
  readonly boundary: string;
}

export async function runStateNativeDemo(): Promise<StateNativeDemoResult> {
  const stateKey = randomBytes(32);
  const vaultKey = randomBytes(32);
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const receipts: unknown[] = [];
  const epochId = 'epoch_demo_2026_08_11';
  const policyDigest = digestObject({ policy: 'demo-default-allow', version: 1 });
  const schemaDigest = digestObject({ schema: 'szl.demo-context/v1' });
  const compatibility = {
    schemaDigest,
    policyDigest,
    cognitiveEpoch: epochId,
  };

  const stateBus = new AlloyStateBus({ masterKey: stateKey });
  const epochManager = new CognitiveEpochManager();
  const vault = new ReasoningVault({ masterKey: vaultKey, maxEntryBytes: 4096 });

  try {
    epochManager.prepare({
      epochId,
      tenantId: 'tenant_demo',
      route: 'demo.context',
      modelId: 'szl-governed-reference',
      modelRevision: '2026-08-11',
      engineId: 'alloy-kernel-runtime',
      engineVersion: '0.1.0',
      tokenizerDigest: digestObject({ tokenizer: 'not-applicable' }),
      layoutDigest: digestObject({ layout: 'structured-json' }),
      adapterSetDigest: digestObject({ adapters: [] }),
      verifierSetDigest: digestObject({ verifiers: ['demo-output-shape'] }),
      promptBundleDigest: digestObject({ promptBundle: 'demo' }),
      policyDigest,
      toolManifestDigest: digestObject({ tools: [] }),
      createdAt: new Date().toISOString(),
    });
    epochManager.validate(epochId, [
      { name: 'policy-bound', passed: true, detail: 'Exact policy digest is present.' },
      { name: 'verifier-bound', passed: true, detail: 'Output verifier is registered.' },
    ]);
    epochManager.activate(epochId);

    const input = await stateBus.put({
      tenantId: 'tenant_demo',
      sessionId: 'session_demo',
      stateType: 'prompt',
      portability: 'P4',
      payload: Buffer.from(JSON.stringify({ objective: 'prove reusable governed state' })),
      compatibility,
      governance: {
        sensitivity: 'internal',
        retentionClass: 'session',
        reusePolicy: 'same_session',
        evidenceTier: 'MEASURED',
      },
      provenance: { sourceActionId: 'action_demo_seed', parentCapsuleIds: [] },
      idempotencyKey: 'demo-input',
    });

    const runtime = new AlloyKernelRuntime({
      stateBus,
      epochManager,
      config: {
        receiptSigner: { keyId: 'demo-ed25519', privateKey },
        receiptWriter: async (receipt) => {
          receipts.push(receipt);
        },
      },
    });

    runtime.register({
      kernelId: 'demo.context.normalize',
      version: '1.0.0',
      kind: 'context_build',
      route: 'demo.context',
      requiresVerification: true,
      execute: async (kernelInput) => {
        const source = JSON.parse(Buffer.from(kernelInput.capsules[0]?.payload ?? []).toString('utf8')) as {
          objective: string;
        };
        return [
          {
            stateType: 'structured_memory',
            portability: 'P4',
            payload: Buffer.from(
              JSON.stringify({
                objective: source.objective,
                normalized: true,
                evidence: 'state-in-state-out-with-receipt',
              }),
            ),
          },
        ];
      },
      verify: async (output) => {
        const parsed = JSON.parse(Buffer.from(output[0]?.payload ?? []).toString('utf8')) as {
          normalized?: boolean;
        };
        return {
          passed: parsed.normalized === true,
          reason: parsed.normalized === true ? 'Output shape and invariant verified.' : 'Output invariant failed.',
          evidenceDigests: [digestObject(parsed)],
        };
      },
    });

    const requestWithoutDigest: KernelExecutionRequest = {
      authorization: {
        envelope: {
          schema: 'szl.governed-action/v1',
          actionId: 'action_demo_runtime',
          toolName: 'demo.context.normalize',
          actorId: 'operator_demo',
          tenantId: 'tenant_demo',
          risk: 'low',
          mutatesState: true,
          requestedAt: new Date().toISOString(),
          argsDigest: '',
        },
        decision: { effect: 'allow', reason: 'Demo policy permits this bounded local execution.' },
        allowedSensitivities: ['internal'],
      },
      kernelId: 'demo.context.normalize',
      tenantId: 'tenant_demo',
      sessionId: 'session_demo',
      inputCapsuleIds: [input.capsuleId],
      inputCompatibility: compatibility,
      parameters: { mode: 'deterministic' },
      budget: {
        maxRuntimeMs: 2_000,
        maxInputBytes: 16_384,
        maxOutputBytes: 16_384,
        maxStateWrites: 1,
      },
      epochId,
      idempotencyKey: 'demo-kernel-run',
    };
    const request: KernelExecutionRequest = {
      ...requestWithoutDigest,
      authorization: {
        ...requestWithoutDigest.authorization,
        envelope: {
          ...requestWithoutDigest.authorization.envelope,
          argsDigest: kernelRequestDigest(requestWithoutDigest),
        },
      },
    };

    const execution = await runtime.execute(request);
    const output = execution.outputs[0];
    if (!output || !verifyKernelExecutionReceipt(execution.receipt, publicKey)) {
      throw new Error('Demo receipt verification failed.');
    }
    const readback = await stateBus.get(output.capsuleId, {
      tenantId: 'tenant_demo',
      sessionId: 'session_demo',
      actionId: 'action_demo_runtime',
      compatibility,
      allowedSensitivities: ['internal'],
    });

    const transport = new InMemoryStateTransportAdapter('demo-local-transport');
    const transfer = await stateBus.exportTo(
      output.capsuleId,
      {
        tenantId: 'tenant_demo',
        sessionId: 'session_demo',
        actionId: 'action_demo_runtime',
        compatibility,
        allowedSensitivities: ['internal'],
      },
      transport,
    );

    const vaultEntry = vault.store({
      tenantId: 'tenant_demo',
      sessionId: 'session_demo',
      modelId: 'upstream-provider-reference',
      modelRevision: 'pinned-demo-revision',
      cognitiveEpoch: epochId,
      providerRequestId: 'provider_request_demo',
      payload: Buffer.from('opaque-provider-continuity-state'),
      ttlMs: 60_000,
      idempotencyKey: 'demo-reasoning-state',
    });
    vault.checkout({
      entryId: vaultEntry.entryId,
      tenantId: 'tenant_demo',
      sessionId: 'session_demo',
      modelId: 'upstream-provider-reference',
      modelRevision: 'pinned-demo-revision',
      cognitiveEpoch: epochId,
    });
    vault.complete(vaultEntry.entryId, 'tenant_demo');
    const shredded = vault.cryptoShred(vaultEntry.entryId, 'tenant_demo', 'Demo teardown.');

    return Object.freeze({
      status: 'OPERATIONAL_REFERENCE',
      networkCalls: 0,
      epochId,
      inputCapsuleId: input.capsuleId,
      outputCapsuleId: output.capsuleId,
      outputDigest: output.contentDigest,
      receiptId: execution.receipt.receiptId,
      receiptDigest: execution.receipt.receiptDigest,
      receiptVerified: true,
      transportReceiptDigest: transfer.receiptDigest,
      reasoningVaultState: shredded.state as 'SHREDDED',
      result: Object.freeze(
        JSON.parse(Buffer.from(readback.payload).toString('utf8')) as Record<string, unknown>,
      ),
      boundary:
        'Local deterministic reference runtime only; no production deployment, external model inference, or Mooncake transport is claimed.',
    });
  } finally {
    stateBus.dispose();
    vault.dispose();
    stateKey.fill(0);
    vaultKey.fill(0);
    receipts.length = 0;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStateNativeDemo()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
