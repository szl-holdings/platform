/**
 * @szl/substrate — Compiler Unit Tests
 *
 * Tests for the policy-shaped graph compiler including:
 * - Rejection cases (high-risk side effects without approval gates)
 * - Happy-path compilation
 * - Cycle detection
 * - Unknown dependency detection
 * - Hash stability
 */

import { compile, SubstrateCompilerError } from './compiler.js';
import {
  ApprovalGate as ApprovalGateFactory,
  Decide,
  defineBudget,
  definePolicy,
  Reason,
  Retrieve,
  ToolCall,
  Verify,
} from './stage-primitives.js';
import type { WorkflowDefinition } from './types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeWorkflow(overrides: Partial<WorkflowDefinition> = {}): WorkflowDefinition {
  return {
    id: 'test-workflow',
    name: 'Test Workflow',
    version: '1.0.0',
    stages: [Reason({ id: 'reason', name: 'Reason' })],
    policy: definePolicy({ id: 'test-policy', name: 'Test Policy' }),
    budget: defineBudget(),
    tags: {},
    ...overrides,
  };
}

// ─── Compiler Rejection Cases ─────────────────────────────────────────────────

function testHighRiskWithoutGate(): void {
  let threw = false;
  try {
    compile(
      makeWorkflow({
        stages: [
          Reason({ id: 'reason', name: 'Reason' }),
          Decide({
            id: 'decide',
            name: 'Decide',
            dependsOn: ['reason'],
            sideEffects: ['financial'],
            highRiskSideEffects: ['financial'],
          }),
        ],
      }),
    );
  } catch (err) {
    if (err instanceof SubstrateCompilerError) {
      threw = true;
      const hasViolation = err.violations.some(
        (v) => v.includes('decide') && v.includes('financial'),
      );
      if (!hasViolation) {
        throw new Error("Expected violation message to mention 'decide' and 'financial'");
      }
    } else {
      throw err;
    }
  }
  if (!threw)
    throw new Error('Expected SubstrateCompilerError for high-risk side effect without gate');
}

function testHighRiskWithGate(): void {
  const graph = compile(
    makeWorkflow({
      stages: [
        Reason({ id: 'reason', name: 'Reason' }),
        Verify({ id: 'verify', name: 'Verify', dependsOn: ['reason'] }),
        ApprovalGateFactory({ id: 'gate', name: 'Gate', dependsOn: ['verify'] }),
        Decide({
          id: 'decide',
          name: 'Decide',
          dependsOn: ['gate'],
          sideEffects: ['financial'],
          highRiskSideEffects: ['financial'],
        }),
      ],
    }),
  );

  if (!graph.nodes.has('decide')) throw new Error("Expected 'decide' node in compiled graph");
  const decideNode = graph.nodes.get('decide')!;
  if (!decideNode.hasApprovalGateAncestor) {
    throw new Error("Expected 'decide' to have approval gate ancestor");
  }
}

function testCycleDetection(): void {
  let threw = false;
  try {
    compile(
      makeWorkflow({
        stages: [
          Reason({ id: 'a', name: 'A', dependsOn: ['b'] }),
          Reason({ id: 'b', name: 'B', dependsOn: ['a'] }),
        ],
      }),
    );
  } catch (err) {
    if (err instanceof SubstrateCompilerError) {
      threw = true;
    } else {
      throw err;
    }
  }
  if (!threw) throw new Error('Expected SubstrateCompilerError for cycle');
}

function testUnknownDependency(): void {
  let threw = false;
  try {
    compile(
      makeWorkflow({
        stages: [Reason({ id: 'a', name: 'A', dependsOn: ['nonexistent'] })],
      }),
    );
  } catch (err) {
    if (err instanceof SubstrateCompilerError) {
      threw = true;
    } else {
      throw err;
    }
  }
  if (!threw) throw new Error('Expected SubstrateCompilerError for unknown dependency');
}

function testDuplicateStageIds(): void {
  let threw = false;
  try {
    compile(
      makeWorkflow({
        stages: [Reason({ id: 'a', name: 'A' }), Reason({ id: 'a', name: 'A-duplicate' })],
      }),
    );
  } catch (err) {
    if (err instanceof SubstrateCompilerError) {
      threw = true;
    } else {
      throw err;
    }
  }
  if (!threw) throw new Error('Expected SubstrateCompilerError for duplicate stage IDs');
}

function testToolCallWithSideEffectWithoutGate(): void {
  let threw = false;
  try {
    compile(
      makeWorkflow({
        stages: [
          Reason({ id: 'reason', name: 'Reason' }),
          ToolCall({
            id: 'tool',
            name: 'Tool',
            toolId: 'delete-record',
            dependsOn: ['reason'],
            sideEffects: ['deletion'],
          }),
        ],
      }),
    );
  } catch (err) {
    if (err instanceof SubstrateCompilerError) {
      threw = true;
    } else {
      throw err;
    }
  }
  if (!threw)
    throw new Error('Expected SubstrateCompilerError for ToolCall with deletion side effect');
}

function testExecutionOrder(): void {
  const graph = compile(
    makeWorkflow({
      stages: [
        Retrieve({ id: 'retrieve', name: 'Retrieve' }),
        Reason({ id: 'reason', name: 'Reason', dependsOn: ['retrieve'] }),
        Verify({ id: 'verify', name: 'Verify', dependsOn: ['reason'] }),
        ApprovalGateFactory({ id: 'gate', name: 'Gate', dependsOn: ['verify'] }),
        Decide({ id: 'decide', name: 'Decide', dependsOn: ['gate'] }),
      ],
    }),
  );

  const order = graph.executionOrder;
  const retrieveIdx = order.indexOf('retrieve');
  const reasonIdx = order.indexOf('reason');
  const verifyIdx = order.indexOf('verify');
  const gateIdx = order.indexOf('gate');
  const decideIdx = order.indexOf('decide');

  if (retrieveIdx >= reasonIdx) throw new Error('retrieve must come before reason');
  if (reasonIdx >= verifyIdx) throw new Error('reason must come before verify');
  if (verifyIdx >= gateIdx) throw new Error('verify must come before gate');
  if (gateIdx >= decideIdx) throw new Error('gate must come before decide');
}

function testWarningsForMissingVerify(): void {
  const graph = compile(
    makeWorkflow({
      stages: [Reason({ id: 'reason', name: 'Reason' })],
    }),
  );
  const hasWarning = graph.warnings.some((w) => w.includes('Verify'));
  if (!hasWarning) throw new Error('Expected warning about missing Verify stage');
}

// ─── Budget Router Tests ──────────────────────────────────────────────────────

async function testBudgetRouterAccept(): Promise<void> {
  const { routeByBudget: routeFn } = await import('./budget-router.js');
  const budget = {
    escalateAt: 0.5,
    requireHumanBelow: 0.3,
    minFinalConfidence: 0.4,
    escalationModelAdapterId: 'strong',
    verifierAdapterId: 'verifier',
  };
  const stage = Reason({ id: 's', name: 'S' });
  const mockRun = {
    runId: 'r1',
    workflowId: 'w1',
    workflowName: 'W',
    mode: 'live' as const,
    status: 'running' as const,
    stageResults: [],
    input: {},
    startedAt: '',
    traceId: 't1',
    metadata: {},
  };

  const decision = routeFn(0.75, stage, budget, mockRun);
  if (decision.action !== 'accept') throw new Error('Expected accept for 0.75 confidence');

  const escalateModel = routeFn(0.4, stage, budget, mockRun);
  if (escalateModel.action !== 'escalate-model')
    throw new Error('Expected escalate-model for 0.4 confidence');

  const escalateHuman = routeFn(0.2, stage, budget, mockRun);
  if (escalateHuman.action !== 'escalate-human')
    throw new Error('Expected escalate-human for 0.2 confidence');
}

// ─── Hash Stability Test ──────────────────────────────────────────────────────

async function testHashStability(): Promise<void> {
  const { hashValue, computeBundleHash } = await import('./journal.js');

  const val = { foo: 'bar', baz: 42 };
  const h1 = hashValue(val);
  const h2 = hashValue(val);
  if (h1 !== h2) throw new Error('hashValue must be deterministic');

  // computeBundleHash excludes runId by design so replay hashes are run-agnostic
  const bundle1 = computeBundleHash({
    stageId: 's1',
    inputHash: 'aaa',
    outputHash: 'bbb',
    confidence: 0.8,
  });
  const bundle2 = computeBundleHash({
    stageId: 's1',
    inputHash: 'aaa',
    outputHash: 'bbb',
    confidence: 0.8,
  });
  if (bundle1 !== bundle2) throw new Error('computeBundleHash must be deterministic');

  const bundle3 = computeBundleHash({
    stageId: 's1',
    inputHash: 'aaa',
    outputHash: 'ccc',
    confidence: 0.8,
  });
  if (bundle1 === bundle3) throw new Error('Different inputs must produce different hashes');
}

// ─── Test Runner ──────────────────────────────────────────────────────────────

export async function runCompilerTests(): Promise<void> {

  testHighRiskWithoutGate();
  testHighRiskWithGate();
  testCycleDetection();
  testUnknownDependency();
  testDuplicateStageIds();
  testToolCallWithSideEffectWithoutGate();
  testExecutionOrder();
  testWarningsForMissingVerify();
  await testBudgetRouterAccept();
  await testHashStability();
}

// Auto-run in Node.js
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('compiler.test.ts')) {
  runCompilerTests().catch(console.error);
}

// ─── Vitest Integration ───────────────────────────────────────────────────────

import { describe, it } from 'vitest';

describe('@szl/substrate Compiler', () => {
  it('runs all compiler and budget-router unit tests', async () => {
    await runCompilerTests();
  });
});
