import type {
  EmbeddingBackend,
  EmbeddingBackendDescriptor,
  RawEmbedRequest,
  RawEmbedResponse,
} from './interface.js';

export class GpuEmbeddingBackendStub implements EmbeddingBackend {
  readonly descriptor: EmbeddingBackendDescriptor = {
    backendId: 'gpu',
    displayName: 'GPU Backend (stub — not yet wired)',
    kind: 'gpu',
    supportedModels: [],
    maxTokens: 8192,
    defaultPooling: 'cls',
    defaultTruncation: 'reject',
  };

  async embed(_req: RawEmbedRequest): Promise<RawEmbedResponse> {
    throw new Error(
      'GpuEmbeddingBackendStub: GPU backend is not yet implemented. ' +
        'Implement this backend by providing a real GPU inference endpoint and wiring it via ExternalHttpEmbeddingBackend or a direct CUDA bridge.',
    );
  }

  async health(): Promise<{ healthy: boolean; latencyMs?: number; detail?: string }> {
    return { healthy: false, detail: 'GPU backend stub — not yet wired' };
  }
}
