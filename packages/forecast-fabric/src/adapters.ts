import {
  type ForecastInput,
  type ForecastOutput,
  type HeadDefinition,
  type ModelAdapter,
  ForecastOutputSchema,
} from './types.js';

function nowIso(): string {
  return new Date().toISOString();
}

function buildSafeDefault(input: ForecastInput, head: HeadDefinition): ForecastOutput {
  const intervals = (input.requestedHorizons ?? ['7d', '30d', '90d']).map((horizon, i) => {
    const base = 0.5 + i * 0.05;
    return {
      point: parseFloat(base.toFixed(4)),
      lower: parseFloat((base - 0.15).toFixed(4)),
      upper: parseFloat((base + 0.15).toFixed(4)),
      confidence: 0.8,
      horizon,
      unit: 'score',
    };
  });

  const output: ForecastOutput = {
    headName: head.name,
    lane: head.lane,
    label: head.label,
    intervals,
    provenance: {
      headName: head.name,
      modelId: `safe-default-${head.name}`,
      modelVersion: '0.1.0',
      adapterId: 'safe-default',
      generatedAt: nowIso(),
    },
    signals: input.context,
    alertThreshold: head.alertThreshold,
    thresholdBreached:
      head.alertThreshold !== undefined
        ? intervals.some((iv) => iv.upper > (head.alertThreshold ?? Infinity))
        : undefined,
  };

  return ForecastOutputSchema.parse(output);
}

export const SafeDefaultAdapter: ModelAdapter = {
  id: 'safe-default',
  name: 'Safe Default (Statistical Baseline)',
  async invoke(input: ForecastInput, head: HeadDefinition): Promise<ForecastOutput> {
    return buildSafeDefault(input, head);
  },
};

export class AdapterRegistryImpl {
  private readonly adapters = new Map<string, ModelAdapter>();

  constructor() {
    this.register(SafeDefaultAdapter);
  }

  register(adapter: ModelAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): ModelAdapter | undefined {
    return this.adapters.get(id);
  }

  list(): ModelAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const globalAdapterRegistry = new AdapterRegistryImpl();
