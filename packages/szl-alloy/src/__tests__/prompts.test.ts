import { describe, expect, it } from 'vitest';
import { promptEvaluator, promptRegistry } from '@szl-holdings/prompt-registry';
import {
  getKernel,
  getKernelsForVertical,
  listKernels,
  renderKernel,
  seedKernels,
} from '../prompts/index.js';

describe('Alloy Codex — Prompt Kernel Library', () => {
  describe('listKernels()', () => {
    it('returns all 16 seeded kernels (registry-backed active filter)', () => {
      const kernels = listKernels();
      expect(kernels).toHaveLength(16);
    });

    it('each kernel has required top-level fields', () => {
      for (const kernel of listKernels()) {
        expect(kernel.id).toBeTruthy();
        expect(kernel.version).toMatch(/^\d+\.\d+\.\d+$/);
        expect(kernel.name).toBeTruthy();
        expect(kernel.description).toBeTruthy();
        expect(kernel.pattern).toBeTruthy();
        expect(kernel.domain).toBeTruthy();
        expect(kernel.verticals).toBeInstanceOf(Array);
        expect(kernel.verticals.length).toBeGreaterThan(0);
        expect(kernel.tags).toBeInstanceOf(Array);
        expect(kernel.systemPrompt).toBeTruthy();
        expect(kernel.template).toContain('{{');
        expect(kernel.modelHints).toBeTruthy();
      }
    });

    it('each kernel has a valid codex block', () => {
      for (const kernel of listKernels()) {
        const { codex } = kernel;
        expect(codex.role).toBeTruthy();
        expect(codex.contract).toBeTruthy();
        expect(codex.inputSchema).toBeInstanceOf(Array);
        expect(codex.outputSchema).toBeInstanceOf(Array);
        expect(codex.evaluationRubric).toBeInstanceOf(Array);
        expect(codex.refusalPolicy).toBeTruthy();
        expect(codex.examples).toBeInstanceOf(Array);
      }
    });

    it('evaluation rubric weights sum to ≤1.0 per kernel', () => {
      for (const kernel of listKernels()) {
        const totalWeight = kernel.codex.evaluationRubric.reduce(
          (sum, c) => sum + c.weight,
          0,
        );
        expect(totalWeight).toBeLessThanOrEqual(1.01);
      }
    });

    it('each rubric criterion has a passing threshold between 0 and 1', () => {
      for (const kernel of listKernels()) {
        for (const criterion of kernel.codex.evaluationRubric) {
          expect(criterion.passingThreshold).toBeGreaterThanOrEqual(0);
          expect(criterion.passingThreshold).toBeLessThanOrEqual(1);
        }
      }
    });

    it('filters by domain', () => {
      const intelligence = listKernels({ domain: 'intelligence' });
      expect(intelligence.length).toBeGreaterThan(0);
      for (const k of intelligence) {
        expect(k.domain).toBe('intelligence');
      }
    });

    it('filters by vertical', () => {
      const sentraKernels = listKernels({ vertical: 'sentra' });
      expect(sentraKernels.length).toBeGreaterThan(0);
      for (const k of sentraKernels) {
        expect(k.verticals).toContain('sentra');
      }
    });

    it('filters by tag', () => {
      const taggedKernels = listKernels({ tags: ['citations'] });
      expect(taggedKernels.length).toBeGreaterThan(0);
      for (const k of taggedKernels) {
        expect(k.tags).toContain('citations');
      }
    });

    it('only includes kernels with an active registry version', () => {
      seedKernels();
      for (const kernel of listKernels()) {
        const regId = `alloy.kernel.${kernel.id}`;
        const activeVersion = promptRegistry.getActiveVersion(regId);
        expect(activeVersion, `Kernel ${kernel.id} should have active registry version`).toBeTruthy();
        expect(activeVersion?.status).toBe('active');
      }
    });
  });

  describe('getKernel()', () => {
    it('retrieves the research-and-cite kernel by id (from active registry version)', () => {
      const kernel = getKernel('research-and-cite');
      expect(kernel.id).toBe('research-and-cite');
      expect(kernel.pattern).toBe('research-and-cite');
      expect(kernel.template).toContain('{{topic}}');
    });

    it('retrieves the decision-intelligence kernel by id', () => {
      const kernel = getKernel('decision-intelligence');
      expect(kernel.id).toBe('decision-intelligence');
      expect(kernel.verticals).toContain('lyte-command-center');
    });

    it('retrieves the maritime-risk-brief kernel by id', () => {
      const kernel = getKernel('maritime-risk-brief');
      expect(kernel.verticals).toContain('vessels');
    });

    it('loads a kernel with explicit semver version (registry version resolution)', () => {
      const kernel = getKernel('research-and-cite', '1.0.0');
      expect(kernel.id).toBe('research-and-cite');
      expect(kernel.version).toBe('1.0.0');
      expect(kernel.template).toContain('{{topic}}');
    });

    it('loads threat-intel-briefing at version 1.0.0 from registry', () => {
      const kernel = getKernel('threat-intel-briefing', '1.0.0');
      expect(kernel.id).toBe('threat-intel-briefing');
      expect(kernel.domain).toBe('cybersecurity');
    });

    it('throws for an unknown kernel id', () => {
      expect(() => getKernel('nonexistent-kernel')).toThrow(
        /Kernel 'nonexistent-kernel' not found/,
      );
    });

    it('throws for an unknown version', () => {
      expect(() => getKernel('research-and-cite', '9.0.0')).toThrow(
        /version '9\.0\.0'/,
      );
    });

    it('template from registry matches in-memory kernel template', () => {
      const kernel = getKernel('executive-briefing');
      const regId = `alloy.kernel.executive-briefing`;
      const activeVersion = promptRegistry.getActiveVersion(regId);
      expect(kernel.template).toBe(activeVersion?.template);
    });
  });

  describe('getKernelsForVertical()', () => {
    const VERTICALS = [
      'sentra',
      'counsel',
      'terra',
      'vessels',
      'pulse',
      'lyte-command-center',
      'command',
      'aegis',
      'carlota-jo',
      'szl-holdings',
    ];

    it('returns at least one kernel for each SZL vertical', () => {
      for (const v of VERTICALS) {
        const kernels = getKernelsForVertical(v);
        expect(kernels.length, `No kernels for vertical: ${v}`).toBeGreaterThan(0);
      }
    });

    it('returns empty array for unknown vertical', () => {
      expect(getKernelsForVertical('nonexistent-vertical')).toHaveLength(0);
    });
  });

  describe('renderKernel()', () => {
    it('renders research-and-cite with required variables', () => {
      const result = renderKernel('research-and-cite', {
        topic: 'APT-41 Q1 2026 infrastructure',
        sources: '[{"title":"Test","url":"https://example.com","excerpt":"test excerpt"}]',
      });

      expect(result.kernelId).toBe('research-and-cite');
      expect(result.version).toBe('1.0.0');
      expect(result.rendered).toContain('APT-41 Q1 2026 infrastructure');
      expect(result.systemPrompt).toBeTruthy();
      expect(result.modelHints).toBeTruthy();
      expect(result.codex).toBeTruthy();
    });

    it('renders decision-intelligence with all required vars', () => {
      const result = renderKernel('decision-intelligence', {
        question: 'Should we expand into APAC?',
        stakeholder: 'CEO',
        constraints: 'Budget < $5M',
        deadline: '2026-Q3',
        options: 'A: Organic growth, B: Acquisition',
        evidence: 'Market research report 2026',
      });

      expect(result.rendered).toContain('APAC');
      expect(result.rendered).toContain('CEO');
    });

    it('throws when required variables are missing', () => {
      expect(() =>
        renderKernel('research-and-cite', { topic: 'Test' }),
      ).toThrow(/missing required variables.*sources/i);
    });

    it('includes modelHints with temperature and maxTokens when defined', () => {
      const result = renderKernel('research-and-cite', {
        topic: 'Test',
        sources: '[]',
      });
      expect(result.modelHints.temperature).toBeDefined();
      expect(result.modelHints.maxTokens).toBeDefined();
    });
  });

  describe('Prompt Registry — Evaluator Suite', () => {
    it('runs eval suite for research-and-cite kernel using few-shot example output', async () => {
      seedKernels();
      const kernelId = 'research-and-cite';
      const registryId = `alloy.kernel.${kernelId}`;
      const kernel = getKernel(kernelId);
      const example = kernel.codex.examples[0]!;

      const rubricKeywords = kernel.codex.evaluationRubric.flatMap((c) => c.keywords);

      const suite = promptEvaluator.createSuite({
        id: `alloy-eval-${kernelId}`,
        promptId: registryId,
        description: `Eval suite for Alloy kernel: ${kernel.name}`,
        cases: [
          {
            id: 'ex-001',
            promptId: registryId,
            input: example.input as Record<string, unknown>,
            expectedOutput: example.output,
            expectedKeywords: rubricKeywords.slice(0, 5),
          },
        ],
      });

      expect(suite.id).toBe(`alloy-eval-${kernelId}`);

      const activeVersion = promptRegistry.getActiveVersion(registryId)!;
      const report = await promptEvaluator.run(
        registryId,
        activeVersion.versionId,
        suite.id,
        async (_rendered, _input) => ({
          output: example.output,
          latencyMs: 50,
        }),
      );

      expect(report.promptId).toBe(registryId);
      expect(report.totalCases).toBe(1);
      expect(report.passRate).toBeGreaterThanOrEqual(0);
      expect(report.avgScore).toBeGreaterThan(0);

      const updatedVersion = promptRegistry.getActiveVersion(registryId)!;
      expect(updatedVersion.evalMetadata).toBeTruthy();
      expect(updatedVersion.evalMetadata?.evalSuite).toBe(`alloy-eval-${kernelId}`);
      expect(updatedVersion.evalMetadata?.sampleCount).toBe(1);
    });

    it('runs eval suite for threat-intel-briefing kernel and validates eval metadata written back', async () => {
      seedKernels();
      const kernelId = 'threat-intel-briefing';
      const registryId = `alloy.kernel.${kernelId}`;
      const kernel = getKernel(kernelId);
      const example = kernel.codex.examples[0]!;

      const suite = promptEvaluator.createSuite({
        id: `alloy-eval-${kernelId}`,
        promptId: registryId,
        description: `Eval suite for ${kernel.name}`,
        cases: [
          {
            id: 'ex-001',
            promptId: registryId,
            input: example.input as Record<string, unknown>,
            expectedKeywords: ['MITRE', 'ATT&CK', 'CVE', 'threat', 'actor'],
          },
        ],
      });

      const activeVersion = promptRegistry.getActiveVersion(registryId)!;
      const report = await promptEvaluator.run(
        registryId,
        activeVersion.versionId,
        suite.id,
        async () => ({ output: example.output, latencyMs: 30 }),
      );

      expect(report.failedCases + report.passedCases).toBe(report.totalCases);
      expect(promptRegistry.getActiveVersion(registryId)?.evalMetadata?.lastEvalAt).toBeTruthy();
    });

    it('eval report structure matches EvalReport schema', async () => {
      seedKernels();
      const registryId = 'alloy.kernel.decision-intelligence';
      const kernel = getKernel('decision-intelligence');
      const example = kernel.codex.examples[0]!;

      const suite = promptEvaluator.createSuite({
        id: 'alloy-eval-decision-intelligence-schema',
        promptId: registryId,
        description: 'Schema validation eval',
        cases: [
          {
            id: 'schema-01',
            promptId: registryId,
            input: example.input as Record<string, unknown>,
            expectedKeywords: ['decision', 'recommendation', 'confidence'],
          },
        ],
      });

      const activeVersion = promptRegistry.getActiveVersion(registryId)!;
      const report = await promptEvaluator.run(
        registryId,
        activeVersion.versionId,
        suite.id,
        async () => ({ output: example.output, latencyMs: 45 }),
      );

      expect(report).toMatchObject({
        promptId: registryId,
        versionId: activeVersion.versionId,
        suiteId: 'alloy-eval-decision-intelligence-schema',
        totalCases: 1,
        results: expect.arrayContaining([
          expect.objectContaining({ caseId: 'schema-01', latencyMs: expect.any(Number) }),
        ]),
      });
    });
  });

  describe('Kernel integrity checks', () => {
    it('all kernel ids are unique', () => {
      const ids = listKernels().map((k) => k.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('all kernel createdAt values are valid ISO dates', () => {
      for (const kernel of listKernels()) {
        const d = new Date(kernel.createdAt);
        expect(d.getTime()).not.toBeNaN();
      }
    });

    it('all refusal policies have non-empty triggers and messages', () => {
      for (const kernel of listKernels()) {
        const { refusalPolicy } = kernel.codex;
        expect(refusalPolicy.triggers.length).toBeGreaterThan(0);
        expect(refusalPolicy.refusalMessage).toBeTruthy();
      }
    });

    it('all kernels have at least one few-shot example', () => {
      for (const kernel of listKernels()) {
        expect(
          kernel.codex.examples.length,
          `Kernel '${kernel.id}' has no examples`,
        ).toBeGreaterThan(0);
      }
    });

    it('registry has a definition for every kernel', () => {
      for (const kernel of listKernels()) {
        const regId = `alloy.kernel.${kernel.id}`;
        const def = promptRegistry.get(regId);
        expect(def, `Registry missing definition for kernel '${kernel.id}'`).toBeTruthy();
        expect(def?.activeVersionId).not.toBeNull();
      }
    });
  });
});
