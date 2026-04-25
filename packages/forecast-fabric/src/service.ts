import type {
  AdapterRegistry,
  ForecastHeadRegistry,
  ForecastInput,
  ForecastOutput,
  HeadDefinition,
  HeadName,
  Lane,
  ModelAdapter,
} from './types.js';
import { ForecastInputSchema } from './types.js';
import { AdapterRegistryImpl, SafeDefaultAdapter } from './adapters.js';

export class HeadRegistryImpl implements ForecastHeadRegistry {
  private readonly heads = new Map<HeadName, HeadDefinition>();

  register(head: HeadDefinition): void {
    this.heads.set(head.name, head);
  }

  get(name: HeadName): HeadDefinition | undefined {
    return this.heads.get(name);
  }

  list(): HeadDefinition[] {
    return Array.from(this.heads.values());
  }

  listByLane(lane: Lane): HeadDefinition[] {
    return this.list().filter((h) => h.lane === lane);
  }
}

export class ForecastService {
  private readonly headRegistry: HeadRegistryImpl;
  private readonly adapterRegistry: AdapterRegistryImpl;

  constructor(opts?: {
    headRegistry?: HeadRegistryImpl;
    adapterRegistry?: AdapterRegistryImpl;
  }) {
    this.headRegistry = opts?.headRegistry ?? new HeadRegistryImpl();
    this.adapterRegistry = opts?.adapterRegistry ?? new AdapterRegistryImpl();
  }

  registerHead(head: HeadDefinition): void {
    this.headRegistry.register(head);
  }

  registerAdapter(adapter: ModelAdapter): void {
    this.adapterRegistry.register(adapter);
  }

  async forecast(rawInput: unknown): Promise<ForecastOutput> {
    const input = ForecastInputSchema.parse(rawInput);
    const head = this.headRegistry.get(input.headName);
    if (!head) {
      throw new Error(`No head registered for: ${input.headName}`);
    }
    const adapter =
      this.adapterRegistry.get(head.defaultAdapterId) ??
      this.adapterRegistry.get(SafeDefaultAdapter.id);
    if (!adapter) {
      throw new Error(`No adapter found for head: ${input.headName}`);
    }
    return adapter.invoke(input, head);
  }

  async forecastLane(lane: Lane, contextOverride?: Record<string, unknown>): Promise<ForecastOutput[]> {
    const heads = this.headRegistry.listByLane(lane);
    return Promise.all(
      heads.map((head) =>
        this.forecast({
          headName: head.name,
          context: contextOverride ?? {},
          requestedHorizons: head.horizons,
        }),
      ),
    );
  }

  listHeads(lane?: Lane): HeadDefinition[] {
    return lane ? this.headRegistry.listByLane(lane) : this.headRegistry.list();
  }

  listAdapters(): ReturnType<AdapterRegistry['list']> {
    return this.adapterRegistry.list();
  }
}

export const globalForecastService = new ForecastService();
