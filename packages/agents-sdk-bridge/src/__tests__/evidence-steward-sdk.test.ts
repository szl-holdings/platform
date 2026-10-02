import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertEvidenceStewardToolSet,
  createEvidenceStewardAgent,
  createEvidenceStewardTools,
  EVIDENCE_STEWARD_TOOL_NAMES,
} from '../evidence-steward-sdk.js';

vi.mock('@openai/agents', async (importOriginal) => {
  const sdk = await importOriginal<typeof import('@openai/agents')>();
  return {
    ...sdk,
    Runner: class ForbiddenRunner {
      constructor() {
        throw new Error('RUNNER_FORBIDDEN_IN_SOURCE_ONLY_TEST');
      }
    },
  };
});

vi.mock('../tool-adapter.js', () => ({
  SzlToolAdapter: class ForbiddenGenericAdapter {
    constructor() {
      throw new Error('GENERIC_TOOL_ADAPTER_FORBIDDEN');
    }
  },
  adaptToolManifest: () => {
    throw new Error('GENERIC_TOOL_ADAPTER_FORBIDDEN');
  },
}));

function makeSteward() {
  const steward = {
    modelIds: ['SZLHOLDINGS/alpha-model', 'SZLHOLDINGS/beta-model'],
    listCatalog: vi.fn(() => ({ ids: ['SZLHOLDINGS/alpha-model', 'SZLHOLDINGS/beta-model'] })),
    inspectAsset: vi.fn(() => ({ asset_id: 'SZLHOLDINGS/alpha-model' })),
    assessEvidenceGaps: vi.fn(() => ({ gaps: [] })),
    proposeNextStep: vi.fn(() => ({ execution: 'NOT_CONFIGURED' })),
  };
  return steward;
}

function asSteward(steward: ReturnType<typeof makeSteward>) {
  return steward as unknown as Parameters<typeof createEvidenceStewardTools>[0];
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SZL Evidence Steward SDK tools', () => {
  it('exposes exactly four strict Responses function schemas with required bounded fields', () => {
    const tools = createEvidenceStewardTools(asSteward(makeSteward()));

    expect(tools.map((entry) => entry.name)).toEqual([...EVIDENCE_STEWARD_TOOL_NAMES]);
    for (const entry of tools) {
      expect(entry.type).toBe('function');
      expect(entry.strict).toBe(true);
      expect(entry.parameters.type).toBe('object');
      expect(entry.parameters.additionalProperties).toBe(false);
      expect([...entry.parameters.required].sort()).toEqual(
        Object.keys(entry.parameters.properties).sort(),
      );
    }

    expect(tools[0].parameters).toEqual({
      type: 'object',
      properties: {
        asset_type: { type: 'string', enum: ['models'] },
        limit: { type: 'integer', enum: [5, 10, 25] },
      },
      required: ['asset_type', 'limit'],
      additionalProperties: false,
    });
    for (const entry of tools.slice(1)) {
      expect(entry.parameters).toEqual({
        type: 'object',
        properties: {
          asset_id: {
            type: 'string',
            enum: ['SZLHOLDINGS/alpha-model', 'SZLHOLDINGS/beta-model'],
          },
        },
        required: ['asset_id'],
        additionalProperties: false,
      });
    }
  });

  it('rejects missing and extra tool definitions before agent exposure', () => {
    const steward = asSteward(makeSteward());
    const tools = createEvidenceStewardTools(steward);

    expect(() => assertEvidenceStewardToolSet(tools.slice(1))).toThrow(
      'EVIDENCE_STEWARD_TOOL_SET_INCOMPLETE',
    );
    expect(() => assertEvidenceStewardToolSet([...tools, tools[0]])).toThrow(
      'EVIDENCE_STEWARD_TOOL_SET_INCOMPLETE',
    );
    expect(() => assertEvidenceStewardToolSet([{ ...tools[0], strict: false }, ...tools.slice(1)])).toThrow(
      'EVIDENCE_STEWARD_TOOL_SCHEMA_INVALID:list_catalog',
    );

    const agent = createEvidenceStewardAgent(steward);
    expect(agent.tools.map((entry) => entry.name)).toEqual([...EVIDENCE_STEWARD_TOOL_NAMES]);
    expect(agent.handoffs).toEqual([]);
    expect(agent.mcpServers).toEqual([]);
  });

  it('rejects an unbounded, unsorted, or duplicate catalog before constructing tools', () => {
    for (const modelIds of [
      [],
      ['SZLHOLDINGS/beta-model', 'SZLHOLDINGS/alpha-model'],
      ['SZLHOLDINGS/alpha-model', 'SZLHOLDINGS/alpha-model'],
      Array.from({ length: 51 }, (_, index) => `SZLHOLDINGS/model-${String(index).padStart(2, '0')}`),
    ]) {
      const steward = { ...makeSteward(), modelIds };
      expect(() => createEvidenceStewardTools(asSteward(steward))).toThrow(
        'INVALID_BOUNDED_CATALOG',
      );
    }
  });

  it('rejects URL, path, and oversized model IDs before exposing a schema', () => {
    for (const assetId of [
      'https://example.com/model',
      'SZLHOLDINGS/../unsafe',
      `SZLHOLDINGS/${'x'.repeat(101)}`,
    ]) {
      const steward = { ...makeSteward(), modelIds: [assetId] };
      expect(() => createEvidenceStewardTools(asSteward(steward))).toThrow(
        'INVALID_BOUNDED_CATALOG',
      );
    }
  });

  it('requires all four backing steward methods before exposing tools or an Agent', () => {
    for (const method of [
      'listCatalog',
      'inspectAsset',
      'assessEvidenceGaps',
      'proposeNextStep',
    ] as const) {
      const incomplete = makeSteward();
      Reflect.deleteProperty(incomplete, method);
      const steward = incomplete as unknown as Parameters<typeof createEvidenceStewardTools>[0];
      expect(() => createEvidenceStewardTools(steward)).toThrow(
        'EVIDENCE_STEWARD_METHOD_SET_INCOMPLETE',
      );
      expect(() => createEvidenceStewardAgent(steward)).toThrow(
        'EVIDENCE_STEWARD_METHOD_SET_INCOMPLETE',
      );
    }
  });

  it('rejects extra fields, missing fields, and values outside the exposed enums at invocation', async () => {
    const steward = makeSteward();
    const tools = createEvidenceStewardTools(asSteward(steward));
    const context = {} as Parameters<(typeof tools)[number]['invoke']>[0];

    await expect(
      tools[0].invoke(context, '{"asset_type":"models","limit":5,"url":"https://example.com"}'),
    ).rejects.toThrow('INVALID_TOOL_ARGUMENTS');
    await expect(tools[0].invoke(context, '{"asset_type":"models"}')).rejects.toThrow(
      'INVALID_TOOL_ARGUMENTS',
    );
    await expect(tools[0].invoke(context, '{"asset_type":"models","limit":100}')).rejects.toThrow(
      'INVALID_TOOL_ARGUMENTS',
    );
    await expect(tools[0].invoke(context, '{')).rejects.toThrow();
    for (const entry of tools.slice(1)) {
      await expect(
        entry.invoke(context, '{"asset_id":"SZLHOLDINGS/alpha-model","shell":"echo unsafe"}'),
      ).rejects.toThrow('INVALID_TOOL_ARGUMENTS');
      await expect(entry.invoke(context, '{"asset_id":"unknown-model"}')).rejects.toThrow(
        'UNBOUND_ASSET_ID',
      );
    }

    expect(steward.listCatalog).not.toHaveBeenCalled();
    expect(steward.inspectAsset).not.toHaveBeenCalled();
    expect(steward.assessEvidenceGaps).not.toHaveBeenCalled();
    expect(steward.proposeNextStep).not.toHaveBeenCalled();
  });

  it('runs allowed read-only handlers without Runner or network access', async () => {
    const network = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('NETWORK_FORBIDDEN_IN_SOURCE_ONLY_TEST');
    });
    const steward = makeSteward();
    const tools = createEvidenceStewardTools(asSteward(steward));
    const context = {} as Parameters<(typeof tools)[number]['invoke']>[0];
    const agent = createEvidenceStewardAgent(asSteward(steward));

    expect(agent.tools.map((entry) => entry.name)).toEqual([...EVIDENCE_STEWARD_TOOL_NAMES]);

    expect(await tools[0].invoke(context, '{"asset_type":"models","limit":5}')).toBe(
      JSON.stringify({ ids: ['SZLHOLDINGS/alpha-model', 'SZLHOLDINGS/beta-model'] }),
    );
    expect(await tools[1].invoke(context, '{"asset_id":"SZLHOLDINGS/alpha-model"}')).toBe(
      JSON.stringify({ asset_id: 'SZLHOLDINGS/alpha-model' }),
    );
    expect(await tools[2].invoke(context, '{"asset_id":"SZLHOLDINGS/alpha-model"}')).toBe(
      JSON.stringify({ gaps: [] }),
    );
    expect(await tools[3].invoke(context, '{"asset_id":"SZLHOLDINGS/alpha-model"}')).toBe(
      JSON.stringify({ execution: 'NOT_CONFIGURED' }),
    );

    expect(steward.listCatalog).toHaveBeenCalledWith({ asset_type: 'models', limit: 5 });
    expect(steward.inspectAsset).toHaveBeenCalledWith({ asset_id: 'SZLHOLDINGS/alpha-model' });
    expect(steward.assessEvidenceGaps).toHaveBeenCalledWith({ asset_id: 'SZLHOLDINGS/alpha-model' });
    expect(steward.proposeNextStep).toHaveBeenCalledWith({ asset_id: 'SZLHOLDINGS/alpha-model' });
    expect(network).not.toHaveBeenCalled();
  });
});
