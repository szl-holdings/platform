export type BackendKind =
  | 'local-cpu'
  | 'deterministic-cpu'
  | 'external-http'
  | 'future-gpu'
  | 'future-azure';

export interface EmbedInput {
  chunkId: string;
  text: string;
  modelRef: string;
  profileId: string;
  inputType: 'query' | 'passage';
}

export interface EmbedOutput {
  chunkId: string;
  vector: number[];
  dimensions: number;
  modelRef: string;
  tokenCount: number;
  latencyMs: number;
}

export interface EmbeddingBackend {
  readonly kind: BackendKind;
  readonly modelRef: string;
  readonly dimensions: number;
  embed(inputs: EmbedInput[]): Promise<EmbedOutput[]>;
  isAvailable(): Promise<boolean>;
}

function cosineNormalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

function deterministicEmbed(text: string, dims: number): number[] {
  const v = new Array<number>(dims).fill(0);
  for (let i = 0; i < text.length; i++) {
    v[i % dims] = v[i % dims]! + (text.charCodeAt(i) / 255) * 2 - 1;
  }
  return cosineNormalize(v);
}

/**
 * DeterministicCpuBackend produces stable, hash-derived vectors. The vectors
 * carry no semantic signal and are intended only for offline tests, dimension
 * shape checks, and seed data where real embeddings are unavailable.
 */
export class DeterministicCpuBackend implements EmbeddingBackend {
  readonly kind: BackendKind = 'deterministic-cpu';
  readonly modelRef: string;
  readonly dimensions: number;

  constructor(opts: { modelRef?: string; dimensions?: number } = {}) {
    this.modelRef = opts.modelRef ?? 'aef-deterministic-cpu-v1';
    this.dimensions = opts.dimensions ?? 768;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async embed(inputs: EmbedInput[]): Promise<EmbedOutput[]> {
    return inputs.map((input) => {
      const start = Date.now();
      const prefix = input.inputType === 'query' ? 'query: ' : 'passage: ';
      const vector = deterministicEmbed(prefix + input.text, this.dimensions);
      return {
        chunkId: input.chunkId,
        vector,
        dimensions: this.dimensions,
        modelRef: this.modelRef,
        tokenCount: Math.ceil(input.text.split(/\s+/).length * 1.3),
        latencyMs: Date.now() - start,
      };
    });
  }
}

/**
 * LocalCpuBackend runs a real sentence-transformer ONNX model on the CPU using
 * onnxruntime-node (via @huggingface/transformers). Defaults to the
 * `Xenova/all-MiniLM-L6-v2` model which produces L2-normalised 384-dim
 * embeddings suitable for cosine-similarity retrieval.
 *
 * The model is downloaded from the Hugging Face Hub on first use and cached on
 * disk under `${cacheDir}` (defaults to `~/.cache/huggingface` via the
 * transformers.js library). All inference runs CPU-only — no GPU dependency.
 */
export class LocalCpuBackend implements EmbeddingBackend {
  readonly kind: BackendKind = 'local-cpu';
  readonly modelRef: string;
  readonly dimensions: number;
  private readonly hfModelId: string;
  private readonly quantized: boolean;
  private readonly cacheDir: string | undefined;
  private extractorPromise: Promise<unknown> | null = null;

  constructor(
    opts: {
      modelRef?: string;
      dimensions?: number;
      hfModelId?: string;
      quantized?: boolean;
      cacheDir?: string;
    } = {},
  ) {
    this.hfModelId = opts.hfModelId ?? 'Xenova/all-MiniLM-L6-v2';
    this.modelRef = opts.modelRef ?? this.hfModelId;
    this.dimensions = opts.dimensions ?? 384;
    this.quantized = opts.quantized ?? true;
    this.cacheDir = opts.cacheDir;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.getExtractor();
      return true;
    } catch {
      return false;
    }
  }

  private async getExtractor(): Promise<
    (
      texts: string[],
      opts: { pooling: 'mean'; normalize: boolean },
    ) => Promise<{ data: Float32Array; dims: number[] }>
  > {
    if (!this.extractorPromise) {
      this.extractorPromise = (async () => {
        const tf = await import('@huggingface/transformers');
        const env = (tf as { env: Record<string, unknown> }).env;
        const cacheDir = this.cacheDir;
        if (cacheDir) {
          env['cacheDir'] = cacheDir;
        }
        env['allowLocalModels'] = true;
        env['allowRemoteModels'] = true;
        const pipeline = (
          tf as { pipeline: (task: string, model: string, opts?: unknown) => Promise<unknown> }
        ).pipeline;
        return pipeline('feature-extraction', this.hfModelId, {
          dtype: this.quantized ? 'q8' : 'fp32',
        });
      })();
    }
    const extractor = (await this.extractorPromise) as unknown as (
      texts: string[],
      opts: { pooling: 'mean'; normalize: boolean },
    ) => Promise<{ data: Float32Array; dims: number[] }>;
    return extractor;
  }

  async embed(inputs: EmbedInput[]): Promise<EmbedOutput[]> {
    if (inputs.length === 0) return [];
    const start = Date.now();
    const extractor = await this.getExtractor();

    const texts = inputs.map((i) => {
      const prefix = i.inputType === 'query' ? 'query: ' : 'passage: ';
      return prefix + i.text;
    });

    const tensor = await extractor(texts, { pooling: 'mean', normalize: true });
    const flat = tensor.data;
    const [batch, dims] = tensor.dims as [number, number];
    if (batch !== inputs.length) {
      throw new Error(`LocalCpuBackend: expected ${inputs.length} embeddings, got ${batch}`);
    }
    if (dims !== this.dimensions) {
      throw new Error(
        `LocalCpuBackend: model returned ${dims}-d vectors but backend was configured for ${this.dimensions}-d`,
      );
    }

    const elapsed = Date.now() - start;
    const perItemLatency = Math.max(1, Math.round(elapsed / inputs.length));

    return inputs.map((input, idx) => {
      const offset = idx * dims;
      const vector = Array.from(flat.subarray(offset, offset + dims));
      return {
        chunkId: input.chunkId,
        vector,
        dimensions: dims,
        modelRef: this.modelRef,
        tokenCount: Math.ceil(input.text.length / 4),
        latencyMs: perItemLatency,
      };
    });
  }
}

export class ExternalHttpBackend implements EmbeddingBackend {
  readonly kind: BackendKind = 'external-http';
  readonly modelRef: string;
  readonly dimensions: number;
  private readonly endpoint: string;
  private readonly apiKey: string;

  constructor(opts: {
    endpoint: string;
    apiKey: string;
    modelRef?: string;
    dimensions?: number;
  }) {
    this.endpoint = opts.endpoint;
    this.apiKey = opts.apiKey;
    this.modelRef = opts.modelRef ?? 'external-embed-v1';
    this.dimensions = opts.dimensions ?? 1536;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const r = await fetch(`${this.endpoint}/health`, { signal: AbortSignal.timeout(3_000) });
      return r.ok;
    } catch {
      return false;
    }
  }

  async embed(inputs: EmbedInput[]): Promise<EmbedOutput[]> {
    const response = await fetch(`${this.endpoint}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ inputs }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`ExternalHttpBackend responded ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as { outputs: EmbedOutput[] };
    return data.outputs;
  }
}

export class FutureGpuBackend implements EmbeddingBackend {
  readonly kind: BackendKind = 'future-gpu';
  readonly modelRef: string;
  readonly dimensions: number;

  constructor(opts: { modelRef?: string; dimensions?: number } = {}) {
    this.modelRef = opts.modelRef ?? 'aef-gpu-embed-v1';
    this.dimensions = opts.dimensions ?? 768;
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async embed(_inputs: EmbedInput[]): Promise<EmbedOutput[]> {
    throw new Error(
      'FutureGpuBackend is not yet available in this environment. Run on GPU-enabled infrastructure to enable.',
    );
  }
}

export class FutureAzureBackend implements EmbeddingBackend {
  readonly kind: BackendKind = 'future-azure';
  readonly modelRef: string;
  readonly dimensions: number;

  constructor(opts: { modelRef?: string; dimensions?: number } = {}) {
    this.modelRef = opts.modelRef ?? 'azure-ada-002';
    this.dimensions = opts.dimensions ?? 1536;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env['AZURE_OPENAI_API_KEY'] && process.env['AZURE_OPENAI_ENDPOINT']);
  }

  async embed(_inputs: EmbedInput[]): Promise<EmbedOutput[]> {
    throw new Error(
      'FutureAzureBackend requires AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT environment variables.',
    );
  }
}

export function createDefaultBackend(): EmbeddingBackend {
  const backendEnv = process.env['AEF_EMBED_BACKEND'] ?? 'local-cpu';

  if (backendEnv === 'external-http') {
    const endpoint = process.env['AEF_EMBED_ENDPOINT'] ?? '';
    const apiKey = process.env['AEF_EMBED_API_KEY'] ?? '';
    if (!endpoint) throw new Error('AEF_EMBED_ENDPOINT is required for external-http backend');
    return new ExternalHttpBackend({ endpoint, apiKey });
  }

  if (backendEnv === 'future-gpu') return new FutureGpuBackend();
  if (backendEnv === 'future-azure') return new FutureAzureBackend();
  if (backendEnv === 'deterministic-cpu') return new DeterministicCpuBackend();

  return new LocalCpuBackend();
}
