/**
 * Telemetry Coverage Tests
 *
 * These tests enumerate ALL required telemetry surfaces and verify that the
 * telemetry-standards package exports attribute keys and span names for each.
 *
 * A test failure here means a required observability contract has been removed
 * or renamed. The CI will block the merge until the standard is restored.
 *
 * Required surfaces per task spec:
 *   - page_load
 *   - api_call
 *   - worker_jobs
 *   - connector_syncs
 *   - model/tool calls (gen_ai)
 *   - agent_runs
 *   - approvals
 *   - feedback (operator comments, run grades)
 *   - token_usage
 */

import { atlas, atlasEventBus } from '@szl-holdings/business-events';
import { beforeEach, describe, expect, it } from 'vitest';
import { ATLAS_EVENT_CLASS, BUSINESS_ATTRS } from './business/index.js';
import { type AgentHandoffContract, type AgentPolicyGateContract, type AgentRunContract, type GenAIAgentStepContract, type GenAIModelCallContract, type GenAIRetrievalContract, type GenAIToolCallContract, AGENT_RUN_ATTRS, GENAI_ATTRS, GENAI_OPERATION, GENAI_SYSTEM } from './genai/index.js';
import { HTTP_ATTRS, SPAN_NAMES, SZL_ATTRS } from './http/index.js';

// ---------------------------------------------------------------------------
// 1. HTTP / Page Load surface
// ---------------------------------------------------------------------------

describe('Telemetry coverage — HTTP / Page Load surface', () => {
  it('HTTP_ATTRS covers all required HTTP attributes', () => {
    expect(HTTP_ATTRS.METHOD).toBeDefined();
    expect(HTTP_ATTRS.STATUS_CODE).toBeDefined();
    expect(HTTP_ATTRS.URL).toBeDefined();
    expect(HTTP_ATTRS.ROUTE).toBeDefined();
  });

  it('AGENT_RUN_ATTRS covers page load attributes', () => {
    expect(AGENT_RUN_ATTRS.PAGE_LOAD_PATH).toBeDefined();
    expect(AGENT_RUN_ATTRS.PAGE_LOAD_LATENCY_MS).toBeDefined();
    expect(AGENT_RUN_ATTRS.API_CALL_PATH).toBeDefined();
    expect(AGENT_RUN_ATTRS.API_CALL_METHOD).toBeDefined();
    expect(AGENT_RUN_ATTRS.API_CALL_STATUS).toBeDefined();
    expect(AGENT_RUN_ATTRS.API_CALL_LATENCY_MS).toBeDefined();
  });

  it('SPAN_NAMES covers HTTP request span names', () => {
    expect(SPAN_NAMES.HTTP_REQUEST).toBeDefined();
    expect(SPAN_NAMES.HTTP_CLIENT).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 2. API surface
// ---------------------------------------------------------------------------

describe('Telemetry coverage — API call surface', () => {
  it('SZL_ATTRS covers correlation and service attribution', () => {
    expect(SZL_ATTRS.CORRELATION_ID).toBeDefined();
    expect(SZL_ATTRS.REQUEST_ID).toBeDefined();
    expect(SZL_ATTRS.TENANT_ID).toBeDefined();
    expect(SZL_ATTRS.SERVICE_NAME).toBeDefined();
    expect(SZL_ATTRS.DURATION_MS).toBeDefined();
  });

  it('SPAN_NAMES covers DB and cache span names (worker-adjacent)', () => {
    expect(SPAN_NAMES.DB_QUERY).toBeDefined();
    expect(SPAN_NAMES.DB_TRANSACTION).toBeDefined();
    expect(SPAN_NAMES.CACHE_GET).toBeDefined();
    expect(SPAN_NAMES.CACHE_SET).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 3. Worker Jobs surface
// ---------------------------------------------------------------------------

describe('Telemetry coverage — Worker Job surface', () => {
  it('SPAN_NAMES covers job and queue span names', () => {
    expect(SPAN_NAMES.JOB_RUN).toBeDefined();
    expect(SPAN_NAMES.QUEUE_PUBLISH).toBeDefined();
    expect(SPAN_NAMES.QUEUE_CONSUME).toBeDefined();
  });

  it('SZL_ATTRS covers job attribution', () => {
    expect(SZL_ATTRS.JOB_ID).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 4. Connector Sync surface
// ---------------------------------------------------------------------------

describe('Telemetry coverage — Connector Sync surface', () => {
  it('BUSINESS_ATTRS covers connector/transaction identity', () => {
    expect(BUSINESS_ATTRS.DOMAIN).toBeDefined();
    expect(BUSINESS_ATTRS.TENANT_ID).toBeDefined();
    expect(BUSINESS_ATTRS.WORKFLOW_ID).toBeDefined();
    expect(BUSINESS_ATTRS.CORRELATION_ID).toBeDefined();
  });

  it('ATLAS_EVENT_CLASS covers transaction lifecycle events', () => {
    expect(ATLAS_EVENT_CLASS.TRANSACTION_STARTED).toBeDefined();
    expect(ATLAS_EVENT_CLASS.TRANSACTION_COMPLETED).toBeDefined();
    expect(ATLAS_EVENT_CLASS.TRANSACTION_FAILED).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 5. Model / Tool Call surface (GenAI)
// ---------------------------------------------------------------------------

describe('Telemetry coverage — Model / Tool Call surface', () => {
  it('GENAI_ATTRS covers all required model call attributes', () => {
    // Core LLM identification
    expect(GENAI_ATTRS.SYSTEM).toBeDefined();
    expect(GENAI_ATTRS.OPERATION_NAME).toBeDefined();
    expect(GENAI_ATTRS.REQUEST_MODEL).toBeDefined();
    expect(GENAI_ATTRS.RESPONSE_MODEL).toBeDefined();
  });

  it('GENAI_ATTRS covers token usage attributes', () => {
    expect(GENAI_ATTRS.USAGE_INPUT_TOKENS).toBeDefined();
    expect(GENAI_ATTRS.USAGE_OUTPUT_TOKENS).toBeDefined();
    expect(GENAI_ATTRS.PROMPT_TOKENS).toBeDefined();
    expect(GENAI_ATTRS.COMPLETION_TOKENS).toBeDefined();
    expect(GENAI_ATTRS.TOTAL_TOKENS).toBeDefined();
  });

  it('GENAI_ATTRS covers tool call attributes', () => {
    expect(GENAI_ATTRS.TOOL_CALL_ID).toBeDefined();
    expect(GENAI_ATTRS.TOOL_NAME).toBeDefined();
    expect(GENAI_ATTRS.TOOL_CALL_TYPE).toBeDefined();
    expect(GENAI_ATTRS.TOOL_RISK_LEVEL).toBeDefined();
    expect(GENAI_ATTRS.TOOL_POLICY_APPLIED).toBeDefined();
    expect(GENAI_ATTRS.TOOL_APPROVAL_REQUIRED).toBeDefined();
  });

  it('GENAI_ATTRS covers cost estimation', () => {
    expect(GENAI_ATTRS.COST_ESTIMATE_USD).toBeDefined();
  });

  it('GENAI_OPERATION covers all operation types', () => {
    const requiredOps = ['CHAT', 'AGENT_STEP', 'TOOL_CALL', 'RETRIEVAL', 'EMBEDDINGS'] as const;
    for (const op of requiredOps) {
      expect(GENAI_OPERATION[op]).toBeDefined();
    }
  });

  it('GENAI_SYSTEM covers major AI providers', () => {
    expect(GENAI_SYSTEM.OPENAI).toBeDefined();
    expect(GENAI_SYSTEM.ANTHROPIC).toBeDefined();
  });

  it('SPAN_NAMES covers agent invoke span', () => {
    expect(SPAN_NAMES.AGENT_INVOKE).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 6. Agent Run surface
// ---------------------------------------------------------------------------

describe('Telemetry coverage — Agent Run surface', () => {
  it('AGENT_RUN_ATTRS covers core run identity', () => {
    expect(AGENT_RUN_ATTRS.RUN_ID).toBeDefined();
    expect(AGENT_RUN_ATTRS.RUN_OBJECTIVE).toBeDefined();
    expect(AGENT_RUN_ATTRS.RUN_OUTCOME).toBeDefined();
    expect(AGENT_RUN_ATTRS.RUN_AUTONOMY_MODE).toBeDefined();
    expect(AGENT_RUN_ATTRS.RUN_DOMAIN).toBeDefined();
  });

  it('AGENT_RUN_ATTRS covers run cost and latency', () => {
    expect(AGENT_RUN_ATTRS.RUN_LATENCY_MS).toBeDefined();
    expect(AGENT_RUN_ATTRS.RUN_COST_USD).toBeDefined();
    expect(AGENT_RUN_ATTRS.RUN_TOTAL_TOKENS).toBeDefined();
  });

  it('AGENT_RUN_ATTRS covers run telemetry counters', () => {
    expect(AGENT_RUN_ATTRS.RUN_TOOL_CALL_COUNT).toBeDefined();
    expect(AGENT_RUN_ATTRS.RUN_EVIDENCE_COUNT).toBeDefined();
    expect(AGENT_RUN_ATTRS.RUN_POLICY_GATE_COUNT).toBeDefined();
    expect(AGENT_RUN_ATTRS.RUN_RETRY_COUNT).toBeDefined();
  });

  it('AGENT_RUN_ATTRS covers failure and handoff fields', () => {
    expect(AGENT_RUN_ATTRS.RUN_HAS_FAILURE).toBeDefined();
    expect(AGENT_RUN_ATTRS.RUN_FAILURE_POINT).toBeDefined();
    expect(AGENT_RUN_ATTRS.RUN_HUMAN_HANDOFF).toBeDefined();
  });

  it('AGENT_RUN_ATTRS covers user and session attribution', () => {
    expect(AGENT_RUN_ATTRS.RUN_USER_ID).toBeDefined();
    expect(AGENT_RUN_ATTRS.RUN_SESSION_ID).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 7. Approval surface
// ---------------------------------------------------------------------------

describe('Telemetry coverage — Approval surface', () => {
  it('GENAI_ATTRS covers approval attributes', () => {
    expect(GENAI_ATTRS.DECISION_ID).toBeDefined();
    expect(GENAI_ATTRS.DECISION_TYPE).toBeDefined();
    expect(GENAI_ATTRS.APPROVAL_LEVEL).toBeDefined();
    expect(GENAI_ATTRS.APPROVAL_DELAY_MS).toBeDefined();
    expect(GENAI_ATTRS.APPROVAL_OUTCOME).toBeDefined();
  });

  it('AGENT_RUN_ATTRS covers approval count', () => {
    expect(AGENT_RUN_ATTRS.RUN_APPROVAL_COUNT).toBeDefined();
  });

  it('ATLAS_EVENT_CLASS covers action approval events', () => {
    expect(ATLAS_EVENT_CLASS.ACTION_APPROVED).toBeDefined();
    expect(ATLAS_EVENT_CLASS.ACTION_EXECUTED).toBeDefined();
    expect(ATLAS_EVENT_CLASS.ACTION_FAILED).toBeDefined();
  });

  it('AGENT_RUN_ATTRS covers policy gate decision attributes', () => {
    expect(AGENT_RUN_ATTRS.POLICY_GATE_ID).toBeDefined();
    expect(AGENT_RUN_ATTRS.POLICY_GATE_DECISION).toBeDefined();
    expect(AGENT_RUN_ATTRS.POLICY_GATE_REASON).toBeDefined();
    expect(AGENT_RUN_ATTRS.POLICY_GATE_TIER).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 8. Feedback (operator comments, run grades, handoffs)
// ---------------------------------------------------------------------------

describe('Telemetry coverage — Feedback / Operator surface', () => {
  it('AGENT_RUN_ATTRS covers evidence access attributes', () => {
    expect(AGENT_RUN_ATTRS.EVIDENCE_ID).toBeDefined();
    expect(AGENT_RUN_ATTRS.EVIDENCE_SOURCE).toBeDefined();
    expect(AGENT_RUN_ATTRS.EVIDENCE_KIND).toBeDefined();
    expect(AGENT_RUN_ATTRS.EVIDENCE_CONFIDENCE).toBeDefined();
    expect(AGENT_RUN_ATTRS.EVIDENCE_ENTITY_ID).toBeDefined();
  });

  it('AGENT_RUN_ATTRS covers handoff type and reason', () => {
    expect(AGENT_RUN_ATTRS.HANDOFF_TYPE).toBeDefined();
    expect(AGENT_RUN_ATTRS.HANDOFF_TO).toBeDefined();
    expect(AGENT_RUN_ATTRS.HANDOFF_REASON).toBeDefined();
  });

  it('BUSINESS_ATTRS covers recommendation metadata', () => {
    expect(BUSINESS_ATTRS.RECOMMENDATION_ID).toBeDefined();
    expect(BUSINESS_ATTRS.RECOMMENDATION_TYPE).toBeDefined();
    expect(BUSINESS_ATTRS.RECOMMENDATION_CONFIDENCE).toBeDefined();
    expect(BUSINESS_ATTRS.RECOMMENDATION_MODEL_ID).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 9. Token Usage surface
// ---------------------------------------------------------------------------

describe('Telemetry coverage — Token Usage surface', () => {
  it('GENAI_ATTRS exports all token usage keys', () => {
    const tokenKeys = [
      GENAI_ATTRS.USAGE_INPUT_TOKENS,
      GENAI_ATTRS.USAGE_OUTPUT_TOKENS,
      GENAI_ATTRS.PROMPT_TOKENS,
      GENAI_ATTRS.COMPLETION_TOKENS,
      GENAI_ATTRS.TOTAL_TOKENS,
    ];
    for (const key of tokenKeys) {
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    }
  });

  it('AGENT_RUN_ATTRS.RUN_TOTAL_TOKENS is a non-empty string key', () => {
    expect(typeof AGENT_RUN_ATTRS.RUN_TOTAL_TOKENS).toBe('string');
    expect(AGENT_RUN_ATTRS.RUN_TOTAL_TOKENS.length).toBeGreaterThan(0);
  });

  it('BUSINESS_ATTRS covers action cost attribution', () => {
    expect(BUSINESS_ATTRS.ACTION_DURATION_MS).toBeDefined();
    expect(BUSINESS_ATTRS.VALUE_AMOUNT).toBeDefined();
    expect(BUSINESS_ATTRS.VALUE_CURRENCY).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 10. Eval / Regression surface
// ---------------------------------------------------------------------------

describe('Telemetry coverage — Eval / Regression surface', () => {
  it('AGENT_RUN_ATTRS covers eval suite attributes', () => {
    expect(AGENT_RUN_ATTRS.EVAL_SUITE_ID).toBeDefined();
    expect(AGENT_RUN_ATTRS.EVAL_RUN_ID).toBeDefined();
    expect(AGENT_RUN_ATTRS.EVAL_PASS_RATE).toBeDefined();
    expect(AGENT_RUN_ATTRS.EVAL_AVG_SCORE).toBeDefined();
    expect(AGENT_RUN_ATTRS.EVAL_HAS_REGRESSION).toBeDefined();
  });

  it('ATLAS_EVENT_CLASS covers recommendation and risk events', () => {
    expect(ATLAS_EVENT_CLASS.RECOMMENDATION_GENERATED).toBeDefined();
    expect(ATLAS_EVENT_CLASS.RISK_DETECTED).toBeDefined();
    expect(ATLAS_EVENT_CLASS.POLICY_VIOLATION).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 11. Workflow spans
// ---------------------------------------------------------------------------

describe('Telemetry coverage — Workflow span names', () => {
  it('SPAN_NAMES covers workflow lifecycle spans', () => {
    expect(SPAN_NAMES.WORKFLOW_START).toBeDefined();
    expect(SPAN_NAMES.WORKFLOW_STEP).toBeDefined();
    expect(SPAN_NAMES.WORKFLOW_COMPLETE).toBeDefined();
  });

  it('SPAN_NAMES covers auth spans', () => {
    expect(SPAN_NAMES.AUTH_VERIFY).toBeDefined();
    expect(SPAN_NAMES.AUTH_TOKEN_REFRESH).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 12. Retrieval / RAG surface
// ---------------------------------------------------------------------------

describe('Telemetry coverage — Retrieval / RAG surface', () => {
  it('GENAI_ATTRS covers retrieval attributes', () => {
    expect(GENAI_ATTRS.RETRIEVAL_ENGINE).toBeDefined();
    expect(GENAI_ATTRS.RETRIEVAL_QUERY).toBeDefined();
    expect(GENAI_ATTRS.RETRIEVAL_CHUNKS_RETRIEVED).toBeDefined();
    expect(GENAI_ATTRS.RETRIEVAL_CHUNKS_USED).toBeDefined();
    expect(GENAI_ATTRS.RETRIEVAL_TOP_SCORE).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 13. Completeness meta-test — attribute map is non-trivial
// ---------------------------------------------------------------------------

describe('Telemetry coverage — attribute map completeness', () => {
  it('GENAI_ATTRS has at least 30 entries (no silent truncation)', () => {
    expect(Object.keys(GENAI_ATTRS).length).toBeGreaterThanOrEqual(30);
  });

  it('AGENT_RUN_ATTRS has at least 30 entries (no silent truncation)', () => {
    expect(Object.keys(AGENT_RUN_ATTRS).length).toBeGreaterThanOrEqual(30);
  });

  it('BUSINESS_ATTRS has at least 20 entries (no silent truncation)', () => {
    expect(Object.keys(BUSINESS_ATTRS).length).toBeGreaterThanOrEqual(20);
  });

  it('all attribute values are non-empty strings', () => {
    const allAttrs = {
      ...GENAI_ATTRS,
      ...BUSINESS_ATTRS,
      ...HTTP_ATTRS,
      ...SZL_ATTRS,
      ...AGENT_RUN_ATTRS,
    };
    for (const [k, v] of Object.entries(allAttrs)) {
      expect(typeof v, `Attribute key ${k} should be a string`).toBe('string');
      expect((v as string).length, `Attribute key ${k} should be non-empty`).toBeGreaterThan(0);
    }
  });

  it('SPAN_NAMES has at least 10 distinct span names (no silent truncation)', () => {
    const names = Object.values(SPAN_NAMES);
    expect(names.length).toBeGreaterThanOrEqual(10);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

// ---------------------------------------------------------------------------
// 14. Contract-shape validation — required telemetry surface objects
//
// Each test below constructs a minimal concrete object satisfying a typed
// telemetry contract interface and asserts the required fields are present
// with correct types.  A TypeScript compilation failure in this section means
// the contract interface changed and callers must be updated.
// ---------------------------------------------------------------------------

describe('Telemetry coverage — GenAI model call contract shape', () => {
  it('GenAIModelCallContract requires core LLM identity and token fields', () => {
    const evt: GenAIModelCallContract = {
      traceId: 'trace-001',
      system: GENAI_SYSTEM.ANTHROPIC,
      operationName: GENAI_OPERATION.CHAT,
      requestModel: 'claude-3-5-haiku',
      promptTokens: 512,
      completionTokens: 256,
      totalTokens: 768,
      latencyMs: 1200,
      status: 'ok',
      timestamp: Date.now(),
    };

    expect(typeof evt.traceId).toBe('string');
    expect(typeof evt.system).toBe('string');
    expect(typeof evt.operationName).toBe('string');
    expect(typeof evt.requestModel).toBe('string');
    expect(typeof evt.promptTokens).toBe('number');
    expect(typeof evt.completionTokens).toBe('number');
    expect(typeof evt.totalTokens).toBe('number');
    expect(typeof evt.latencyMs).toBe('number');
    expect(evt.status).toBe('ok');
    expect(typeof evt.timestamp).toBe('number');
  });

  it('GenAIModelCallContract optional cost field is typed correctly when supplied', () => {
    const evt: GenAIModelCallContract = {
      traceId: 'trace-002',
      system: GENAI_SYSTEM.OPENAI,
      operationName: GENAI_OPERATION.CHAT,
      requestModel: 'gpt-4o',
      promptTokens: 1024,
      completionTokens: 512,
      totalTokens: 1536,
      costEstimateUsd: 0.0023,
      latencyMs: 800,
      status: 'ok',
      timestamp: Date.now(),
    };

    expect(typeof evt.costEstimateUsd).toBe('number');
    expect(evt.costEstimateUsd).toBeGreaterThan(0);
  });
});

describe('Telemetry coverage — GenAI tool call contract shape', () => {
  it('GenAIToolCallContract requires tool identity, input, latency, and status', () => {
    const evt: GenAIToolCallContract = {
      traceId: 'trace-003',
      toolName: 'ais-fetch',
      toolInput: { mmsi: '123456789' },
      latencyMs: 340,
      status: 'ok',
      timestamp: Date.now(),
    };

    expect(typeof evt.toolName).toBe('string');
    expect(typeof evt.toolInput).toBe('object');
    expect(typeof evt.latencyMs).toBe('number');
    expect(evt.status).toBe('ok');
  });

  it('GenAIToolCallContract surfaces risk and approval fields', () => {
    const evt: GenAIToolCallContract = {
      traceId: 'trace-004',
      toolName: 'vessel-diverts',
      toolInput: { vesselId: 'mv-atlas', newRoute: 'Cape Finisterre' },
      latencyMs: 120,
      status: 'ok',
      riskLevel: 'high',
      approvalRequired: true,
      policyApplied: 'maritime-divert-policy',
      timestamp: Date.now(),
    };

    expect(evt.riskLevel).toBe('high');
    expect(evt.approvalRequired).toBe(true);
    expect(typeof evt.policyApplied).toBe('string');
  });
});

describe('Telemetry coverage — GenAI agent step contract shape', () => {
  it('GenAIAgentStepContract requires agent identity, step index, and outcome', () => {
    const evt: GenAIAgentStepContract = {
      traceId: 'trace-005',
      agentId: 'vessels-agent-v2',
      agentDomain: 'maritime',
      stepIndex: 0,
      stepType: 'think',
      latencyMs: 200,
      status: 'ok',
      timestamp: Date.now(),
    };

    expect(typeof evt.agentId).toBe('string');
    expect(typeof evt.agentDomain).toBe('string');
    expect(typeof evt.stepIndex).toBe('number');
    expect(evt.stepType).toBe('think');
    expect(evt.status).toBe('ok');
  });
});

describe('Telemetry coverage — GenAI retrieval contract shape', () => {
  it('GenAIRetrievalContract requires query, engine, chunk counts, and latency', () => {
    const evt: GenAIRetrievalContract = {
      traceId: 'trace-006',
      query: 'vessel MMSI 123456789 route history',
      engine: 'pgvector',
      chunksRetrieved: 20,
      chunksUsed: 5,
      latencyMs: 85,
      status: 'ok',
      timestamp: Date.now(),
    };

    expect(typeof evt.query).toBe('string');
    expect(typeof evt.engine).toBe('string');
    expect(typeof evt.chunksRetrieved).toBe('number');
    expect(typeof evt.chunksUsed).toBe('number');
    expect(evt.status).toBe('ok');
  });
});

describe('Telemetry coverage — Agent run contract shape', () => {
  it('AgentRunContract requires run identity, domain, autonomy mode, and outcome', () => {
    const evt: AgentRunContract = {
      traceId: 'trace-007',
      runId: 'run-abc-001',
      agentId: 'vessels-agent-v2',
      domain: 'maritime',
      objective: 'Evaluate optimal reroute for MV Albatross',
      autonomyMode: 'supervised',
      outcome: 'success',
      latencyMs: 4200,
      timestamp: Date.now(),
    };

    expect(typeof evt.runId).toBe('string');
    expect(typeof evt.agentId).toBe('string');
    expect(typeof evt.domain).toBe('string');
    expect(typeof evt.objective).toBe('string');
    expect(evt.autonomyMode).toBe('supervised');
    expect(evt.outcome).toBe('success');
    expect(typeof evt.latencyMs).toBe('number');
  });

  it('AgentRunContract surfaces governance telemetry counters', () => {
    const evt: AgentRunContract = {
      traceId: 'trace-008',
      runId: 'run-abc-002',
      agentId: 'vessels-agent-v2',
      domain: 'maritime',
      objective: 'Emergency divert assessment',
      autonomyMode: 'supervised',
      outcome: 'blocked',
      latencyMs: 1800,
      policyGateCount: 2,
      approvalCount: 1,
      evidenceCount: 5,
      toolCallCount: 8,
      hasFailure: false,
      timestamp: Date.now(),
    };

    expect(typeof evt.policyGateCount).toBe('number');
    expect(typeof evt.approvalCount).toBe('number');
    expect(typeof evt.evidenceCount).toBe('number');
    expect(evt.outcome).toBe('blocked');
  });
});

describe('Telemetry coverage — Policy gate and handoff contract shapes', () => {
  it('AgentPolicyGateContract requires run identity, policy identity, and decision', () => {
    const evt: AgentPolicyGateContract = {
      traceId: 'trace-009',
      runId: 'run-abc-001',
      policyId: 'maritime-divert-policy',
      decision: 'require_approval',
      tier: 'action',
      reason: 'High-risk divert requires captain sign-off',
      timestamp: Date.now(),
    };

    expect(typeof evt.policyId).toBe('string');
    expect(evt.decision).toBe('require_approval');
    expect(typeof evt.tier).toBe('string');
  });

  it('AgentHandoffContract requires run identity, handoff type, and target', () => {
    const evt: AgentHandoffContract = {
      traceId: 'trace-010',
      runId: 'run-abc-001',
      handoffType: 'human',
      handoffTo: 'captain@szl.holdings',
      reason: 'Regulatory override required for port exclusion',
      priority: 'high',
      timestamp: Date.now(),
    };

    expect(evt.handoffType).toBe('human');
    expect(typeof evt.handoffTo).toBe('string');
    expect(evt.priority).toBe('high');
  });
});

describe('Telemetry coverage — attribute key naming convention', () => {
  it('all GENAI_ATTRS keys follow dot-notation naming (gen_ai.* or agent.*)', () => {
    for (const value of Object.values(GENAI_ATTRS)) {
      expect(
        (value as string).includes('.'),
        `GENAI_ATTRS value '${value}' should use dot-notation naming`,
      ).toBe(true);
    }
  });

  it('all AGENT_RUN_ATTRS keys follow dot-notation naming (agent.* or app.*)', () => {
    for (const value of Object.values(AGENT_RUN_ATTRS)) {
      expect(
        (value as string).includes('.'),
        `AGENT_RUN_ATTRS value '${value}' should use dot-notation naming`,
      ).toBe(true);
    }
  });

  it('all BUSINESS_ATTRS keys follow dot-notation naming (business.*)', () => {
    for (const value of Object.values(BUSINESS_ATTRS)) {
      expect(
        (value as string).includes('.'),
        `BUSINESS_ATTRS value '${value}' should use dot-notation naming`,
      ).toBe(true);
    }
  });

  it('all HTTP_ATTRS keys follow dot-notation naming', () => {
    for (const value of Object.values(HTTP_ATTRS)) {
      expect(
        (value as string).includes('.'),
        `HTTP_ATTRS value '${value}' should use dot-notation naming`,
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Runtime telemetry — atlasEventBus in-memory span validation
//
// These tests exercise the event bus directly (no DB / external services).
// They prove that emitted events carry correct proof-chain fields and that
// the in-memory buffer can be queried and cleared between test runs.
// ---------------------------------------------------------------------------

describe('atlasEventBus — runtime span validation', () => {
  beforeEach(() => {
    atlasEventBus.clear();
  });

  it('buffer is empty after clear()', () => {
    atlasEventBus.emit({
      eventId: 'test-123',
      eventClass: 'action.executed',
      domain: 'maritime',
      timestamp: Date.now(),
      schemaVersion: '1.0',
      actionId: 'a1',
      actionType: 'reroute',
      durationMs: 42,
    });
    atlasEventBus.clear();
    expect(atlasEventBus.getBuffer()).toHaveLength(0);
  });

  it('emitted event appears in getBuffer()', () => {
    atlas.actionExecuted({
      domain: 'maritime',
      actionId: 'exec-001',
      actionType: 'vessel.reroute',
      durationMs: 200,
      resultSummary: 'Reroute complete',
    });
    const buf = atlasEventBus.getBuffer();
    expect(buf).toHaveLength(1);
    expect(buf[0].eventClass).toBe('action.executed');
  });

  it('emitted event carries required base fields', () => {
    atlas.actionExecuted({
      domain: 'maritime',
      actionId: 'exec-002',
      actionType: 'vessel.hold',
      durationMs: 100,
    });
    const [ev] = atlasEventBus.getBuffer();
    expect(ev.eventId).toBeTruthy();
    expect(ev.timestamp).toBeGreaterThan(0);
    expect(ev.schemaVersion).toBe('1.0');
    expect(ev.domain).toBe('maritime');
  });

  it('getByClass() returns only matching event class', () => {
    atlas.actionApproved({
      domain: 'maritime',
      actionId: 'app-001',
      actionType: 'reroute',
      approvalLevel: 'auto',
    });
    atlas.actionExecuted({
      domain: 'maritime',
      actionId: 'exec-003',
      actionType: 'reroute',
      durationMs: 55,
    });
    const approvals = atlasEventBus.getByClass('action.approved');
    expect(approvals).toHaveLength(1);
    expect(approvals[0].eventClass).toBe('action.approved');
  });

  it('getByDomain() returns only events for the specified domain', () => {
    atlas.riskDetected({ domain: 'maritime', riskType: 'storm' });
    atlas.riskDetected({ domain: 'legal', riskType: 'compliance-gap' });
    const maritime = atlasEventBus.getByDomain('maritime');
    expect(maritime.length).toBeGreaterThanOrEqual(1);
    for (const ev of maritime) expect(ev.domain).toBe('maritime');
  });

  it('countByClass() aggregates event counts correctly', () => {
    atlas.riskDetected({ domain: 'maritime', riskType: 'storm' });
    atlas.riskDetected({ domain: 'maritime', riskType: 'piracy' });
    atlas.actionExecuted({
      domain: 'maritime',
      actionId: 'x',
      actionType: 'y',
      durationMs: 1,
    });
    const counts = atlasEventBus.countByClass();
    expect(counts['business.risk.detected']).toBe(2);
    expect(counts['action.executed']).toBe(1);
  });

  it('recommendation.generated event carries confidence and modelId', () => {
    atlas.recommendationGenerated({
      domain: 'maritime',
      recommendationType: 'vessel.reroute',
      confidence: 0.93,
      modelId: 'gpt-4o',
      reasoningSummary: 'Storm avoidance.',
    });
    const recs = atlasEventBus.getByClass('recommendation.generated');
    expect(recs).toHaveLength(1);
    const rec = recs[0] as Extract<
      (typeof recs)[number],
      { eventClass: 'recommendation.generated' }
    >;
    expect(rec.confidence).toBe(0.93);
    expect(rec.modelId).toBe('gpt-4o');
  });

  it('policy.violation.detected event carries policyId and violationType', () => {
    atlas.policyViolation({
      domain: 'maritime',
      policyId: 'pol-maritime-001',
      policyName: 'Vessel Speed Limit',
      violationType: 'speed.exceeded',
    });
    const violations = atlasEventBus.getByClass('policy.violation.detected');
    expect(violations).toHaveLength(1);
    const v = violations[0] as Extract<
      (typeof violations)[number],
      { eventClass: 'policy.violation.detected' }
    >;
    expect(v.policyId).toBe('pol-maritime-001');
    expect(v.violationType).toBe('speed.exceeded');
  });

  it('action.failed event carries rollbackPerformed flag', () => {
    atlas.actionFailed({
      domain: 'maritime',
      actionId: 'fail-001',
      actionType: 'vessel.reroute',
      durationMs: 500,
      errorCode: 'CONN_TIMEOUT',
      rollbackPerformed: true,
    });
    const failures = atlasEventBus.getByClass('action.failed');
    expect(failures).toHaveLength(1);
    const f = failures[0] as Extract<(typeof failures)[number], { eventClass: 'action.failed' }>;
    expect(f.rollbackPerformed).toBe(true);
    expect(f.errorCode).toBe('CONN_TIMEOUT');
  });

  it('multiple emissions from different spans are isolated by clear()', () => {
    atlas.actionExecuted({
      domain: 'maritime',
      actionId: 'span-a',
      actionType: 'test',
      durationMs: 1,
    });
    expect(atlasEventBus.getBuffer()).toHaveLength(1);
    atlasEventBus.clear();
    atlas.actionExecuted({
      domain: 'maritime',
      actionId: 'span-b',
      actionType: 'test',
      durationMs: 1,
    });
    const buf = atlasEventBus.getBuffer();
    expect(buf).toHaveLength(1);
    expect((buf[0] as { actionId?: string }).actionId).toBe('span-b');
  });
});
