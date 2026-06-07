import { describe, expect, it, vi } from 'vitest';
import {
  type CompiledRuleIR,
  compilePolicy,
  compilePolicyWithLLM,
  DEFAULT_LLM_THRESHOLD,
  type LLMAssistFn,
  type LLMAssistResult,
  mergeWithLLMResult,
} from './compiler.js';

// Phrasing that the deterministic parser cannot classify (no effect verb,
// no amount keywords, no role) — guaranteed to fall under the LLM threshold.
const AMBIGUOUS_INPUT = 'the counterparty situation should be handled appropriately';

const CRISP_INPUT = 'Block all payouts over $500,000 without two finance approvers.';

describe('compilePolicyWithLLM', () => {
  it('matches compilePolicy when no LLM is provided', async () => {
    const sync = compilePolicy(CRISP_INPUT, 'pol_x', 0);
    const async_ = await compilePolicyWithLLM(CRISP_INPUT, null, {
      policyId: 'pol_x',
      existingVersion: 0,
    });
    expect(async_.ir.rules.length).toBe(sync.ir.rules.length);
    expect(async_.ir.rules[0]?.effect).toBe(sync.ir.rules[0]?.effect);
    expect(async_.ir.rules[0]?.llmAssisted).toBeUndefined();
  });

  it('invokes the LLM only for rules below the threshold', async () => {
    const llm = vi.fn<LLMAssistFn>(async (sentence) => ({
      effect: 'block',
      conditions: [{ field: 'counterparty.watchlist', operator: 'eq', value: true }],
      requiredApproverRole: 'compliance_officer',
      reason: `LLM repaired: ${sentence}`,
      confidence: 0.92,
    }));

    const result = await compilePolicyWithLLM(`${CRISP_INPUT}\n${AMBIGUOUS_INPUT}.`, llm);

    // The crisp sentence should NOT have invoked the model.
    // Exactly one ambiguous sentence should have.
    expect(llm).toHaveBeenCalledTimes(1);
    const ambiguousRule = result.ir.rules.find((r) => r.llmAssisted);
    expect(ambiguousRule).toBeDefined();
    expect(ambiguousRule?.effect).toBe('block');
    expect(ambiguousRule?.confidence).toBeGreaterThanOrEqual(
      ambiguousRule?.deterministicConfidence ?? 0,
    );
    expect(ambiguousRule?.llmConfidence).toBeCloseTo(0.92, 2);
    expect(ambiguousRule?.conditions).toEqual([
      { field: 'counterparty.watchlist', operator: 'eq', value: true },
    ]);
    expect(result.ir.parseWarnings.some((w) => w.includes('LLM assistance'))).toBe(true);
  });

  it('falls back to deterministic when the LLM returns null', async () => {
    const llm = vi.fn<LLMAssistFn>(async () => null);
    const result = await compilePolicyWithLLM(`${AMBIGUOUS_INPUT}.`, llm);
    expect(llm).toHaveBeenCalled();
    const rule = result.ir.rules[0]!;
    expect(rule.llmAssisted).toBeUndefined();
    expect(
      rule.warnings.some((w) => w.toLowerCase().includes('llm fallback returned no result')),
    ).toBe(true);
  });

  it('captures and surfaces LLM errors as warnings', async () => {
    const llm = vi.fn<LLMAssistFn>(async () => {
      throw new Error('upstream timeout');
    });
    const result = await compilePolicyWithLLM(`${AMBIGUOUS_INPUT}.`, llm);
    const rule = result.ir.rules[0]!;
    expect(rule.llmAssisted).toBeUndefined();
    expect(rule.warnings.some((w) => w.includes('upstream timeout'))).toBe(true);
  });

  it('uses a custom llmThreshold', async () => {
    const llm = vi.fn<LLMAssistFn>(async () => ({ effect: 'allow', confidence: 0.99 }));
    // With threshold 0.99 even crisp rules get LLM-assisted.
    await compilePolicyWithLLM(CRISP_INPUT, llm, { llmThreshold: 0.99 });
    expect(llm).toHaveBeenCalled();
  });

  it('uses the documented default threshold', () => {
    expect(DEFAULT_LLM_THRESHOLD).toBe(0.7);
  });
});

describe('mergeWithLLMResult', () => {
  const base: CompiledRuleIR = {
    description: 'no payment should go through if the counterparty is flagged',
    effect: 'require_approval',
    conditions: [],
    reason: 'deterministic',
    priority: 50,
    confidence: 0.4,
    warnings: ['No specific approver role identified'],
  };

  it('only overrides fields the LLM returned', () => {
    const merged = mergeWithLLMResult(base, {
      effect: 'block',
      confidence: 0.85,
    });
    expect(merged.effect).toBe('block');
    expect(merged.reason).toBe('deterministic'); // untouched
    expect(merged.priority).toBe(50);
    expect(merged.deterministicConfidence).toBe(0.4);
    expect(merged.llmConfidence).toBe(0.85);
    expect(merged.confidence).toBe(0.85);
    expect(merged.llmAssisted).toBe(true);
  });

  it('never decreases confidence below the deterministic value', () => {
    const merged = mergeWithLLMResult({ ...base, confidence: 0.6 }, { confidence: 0.2 });
    expect(merged.confidence).toBe(0.6);
  });

  it('clamps an out-of-range LLM confidence', () => {
    const merged = mergeWithLLMResult(base, { confidence: 5 });
    expect(merged.llmConfidence).toBe(1);
  });

  it('appends LLM notes as warnings', () => {
    const merged = mergeWithLLMResult(base, {
      notes: "Interpreted 'watchlist' as a counterparty attribute.",
    } as LLMAssistResult);
    expect(merged.warnings.some((w) => w.startsWith('LLM note:'))).toBe(true);
  });
});
