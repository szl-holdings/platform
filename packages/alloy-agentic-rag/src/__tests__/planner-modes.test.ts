/**
 * Unit tests for dual planner mode (ReAct vs CoT-decompose).
 */
import { describe, it, expect } from 'vitest';
import { buildPlan } from '../planner-modes.js';

const BASE_INPUT = {
  query: 'What is the current threat posture for our maritime operations?',
  specialists: ['knowledge-agent', 'web-research-agent', 'cloud-ops-agent'],
};

describe('buildPlan — planner mode switching', () => {
  describe('ReAct mode', () => {
    it('produces a plan with plannerMode=react', () => {
      const { plan } = buildPlan('react', BASE_INPUT);
      expect(plan.plannerMode).toBe('react');
    });

    it('includes think, act (per specialist), observe, and generate steps', () => {
      const { plan } = buildPlan('react', BASE_INPUT);
      const phases = plan.steps.map((s) => s.metadata?.['phase']);
      expect(phases).toContain('think');
      expect(phases).toContain('act');
      expect(phases).toContain('observe');
      expect(phases).toContain('generate');
    });

    it('has one act step per specialist', () => {
      const { plan } = buildPlan('react', BASE_INPUT);
      const actSteps = plan.steps.filter((s) => s.metadata?.['phase'] === 'act');
      expect(actSteps).toHaveLength(BASE_INPUT.specialists.length);
    });

    it('emits thoughts', () => {
      const { thoughts } = buildPlan('react', BASE_INPUT);
      expect(thoughts.length).toBeGreaterThan(0);
      expect(thoughts.some((t) => t.includes('[ReAct]'))).toBe(true);
    });

    it('each act step has a specialistAgent field', () => {
      const { plan } = buildPlan('react', BASE_INPUT);
      const actSteps = plan.steps.filter((s) => s.metadata?.['phase'] === 'act');
      for (const step of actSteps) {
        expect(step.specialistAgent).toBeTruthy();
      }
    });
  });

  describe('CoT-decompose mode', () => {
    it('produces a plan with plannerMode=cot-decompose', () => {
      const { plan } = buildPlan('cot-decompose', BASE_INPUT);
      expect(plan.plannerMode).toBe('cot-decompose');
    });

    it('includes decompose, execute (per specialist), merge, and generate steps', () => {
      const { plan } = buildPlan('cot-decompose', BASE_INPUT);
      const phases = plan.steps.map((s) => s.metadata?.['phase']);
      expect(phases).toContain('decompose');
      expect(phases).toContain('execute');
      expect(phases).toContain('merge');
      expect(phases).toContain('generate');
    });

    it('specialist steps are tagged as parallel', () => {
      const { plan } = buildPlan('cot-decompose', BASE_INPUT);
      const execSteps = plan.steps.filter((s) => s.metadata?.['phase'] === 'execute');
      expect(execSteps.every((s) => s.metadata?.['parallel'] === true)).toBe(true);
    });

    it('emits thoughts', () => {
      const { thoughts } = buildPlan('cot-decompose', BASE_INPUT);
      expect(thoughts.length).toBeGreaterThan(0);
      expect(thoughts.some((t) => t.includes('[CoT]'))).toBe(true);
    });
  });

  describe('Common plan shape', () => {
    it('both modes produce the same PlanGraph structure', () => {
      const react = buildPlan('react', BASE_INPUT).plan;
      const cot = buildPlan('cot-decompose', BASE_INPUT).plan;

      for (const plan of [react, cot]) {
        expect(plan.planId).toBeTruthy();
        expect(plan.objective).toBe(BASE_INPUT.query);
        expect(Array.isArray(plan.steps)).toBe(true);
        expect(Array.isArray(plan.executionOrder)).toBe(true);
        expect(typeof plan.estimatedCostUsd).toBe('number');
        expect(typeof plan.confidence).toBe('number');
        expect(plan.createdAt).toBeTruthy();
      }
    });

    it('executionOrder contains all stepIds', () => {
      for (const mode of ['react', 'cot-decompose'] as const) {
        const { plan } = buildPlan(mode, BASE_INPUT);
        const stepIds = new Set(plan.steps.map((s) => s.stepId));
        for (const id of plan.executionOrder) {
          expect(stepIds.has(id)).toBe(true);
        }
      }
    });

    it('generate step always depends on the merge/observe step', () => {
      for (const mode of ['react', 'cot-decompose'] as const) {
        const { plan } = buildPlan(mode, BASE_INPUT);
        const generateStep = plan.steps.find((s) => s.metadata?.['phase'] === 'generate');
        expect(generateStep).toBeDefined();
        expect(generateStep?.dependencies.length).toBeGreaterThan(0);
      }
    });
  });
});
