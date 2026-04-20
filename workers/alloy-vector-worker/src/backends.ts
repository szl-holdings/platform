export type BackendKind = "local-cpu" | "external-http" | "future-gpu" | "future-azure";

export interface EmbedInput {
  chunkId: string;
  text: string;
  modelRef: string;
  profileId: string;
  inputType: "query" | "passage";
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
    v[i % dims] = (v[i % dims]! + (text.charCodeAt(i) / 255) * 2 - 1);
  }
  return cosineNormalize(v);
}

export class LocalCpuBackend implements EmbeddingBackend {
  readonly kind: BackendKind = "local-cpu";
  readonly modelRef: string;
  readonly dimensions: number;

  constructor(opts: { modelRef?: string; dimensions?: number } = {}) {
    this.modelRef = opts.modelRef ?? "aef-embed-cpu-v1";
    this.dimensions = opts.dimensions ?? 768;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async embed(inputs: EmbedInput[]): Promise<EmbedOutput[]> {
    return inputs.map((input) => {
      const start = Date.now();
      const prefix = input.inputType === "query" ? "query: " : "passage: ";
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

export class ExternalHttpBackend implements EmbeddingBackend {
  readonly kind: BackendKind = "external-http";
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
    this.modelRef = opts.modelRef ?? "external-embed-v1";
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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ inputs }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`ExternalHttpBackend responded ${response.status}: ${await response.text()}`);
    }

    const data = await response.json() as { outputs: EmbedOutput[] };
    return data.outputs;
  }
}

export class FutureGpuBackend implements EmbeddingBackend {
  readonly kind: BackendKind = "future-gpu";
  readonly modelRef: string;
  readonly dimensions: number;

  constructor(opts: { modelRef?: string; dimensions?: number } = {}) {
    this.modelRef = opts.modelRef ?? "aef-gpu-embed-v1";
    this.dimensions = opts.dimensions ?? 768;
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async embed(_inputs: EmbedInput[]): Promise<EmbedOutput[]> {
    throw new Error("FutureGpuBackend is not yet available in this environment. Run on GPU-enabled infrastructure to enable.");
  }
}

export class FutureAzureBackend implements EmbeddingBackend {
  readonly kind: BackendKind = "future-azure";
  readonly modelRef: string;
  readonly dimensions: number;

  constructor(opts: { modelRef?: string; dimensions?: number } = {}) {
    this.modelRef = opts.modelRef ?? "azure-ada-002";
    this.dimensions = opts.dimensions ?? 1536;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["AZURE_OPENAI_API_KEY"] && process.env["AZURE_OPENAI_ENDPOINT"]);
  }

  async embed(_inputs: EmbedInput[]): Promise<EmbedOutput[]> {
    throw new Error("FutureAzureBackend requires AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT environment variables.");
  }
}

export function createDefaultBackend(): EmbeddingBackend {
  const backendEnv = process.env["AEF_EMBED_BACKEND"] ?? "local-cpu";

  if (backendEnv === "external-http") {
    const endpoint = process.env["AEF_EMBED_ENDPOINT"] ?? "";
    const apiKey = process.env["AEF_EMBED_API_KEY"] ?? "";
    if (!endpoint) throw new Error("AEF_EMBED_ENDPOINT is required for external-http backend");
    return new ExternalHttpBackend({ endpoint, apiKey });
  }

  if (backendEnv === "future-gpu") return new FutureGpuBackend();
  if (backendEnv === "future-azure") return new FutureAzureBackend();

  return new LocalCpuBackend();
}
