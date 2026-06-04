import type {
  EmbeddingBackend,
  EmbeddingBackendDescriptor,
  RawEmbedRequest,
  RawEmbedResponse,
} from './interface.js';

export class AzureEmbeddingBackendStub implements EmbeddingBackend {
  readonly descriptor: EmbeddingBackendDescriptor = {
    backendId: 'azure',
    displayName:
      'Azure OpenAI Embeddings (stub — set AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_KEY to wire)',
    kind: 'azure',
    supportedModels: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'],
    maxTokens: 8191,
    defaultPooling: 'mean',
    defaultTruncation: 'reject',
  };

  async embed(_req: RawEmbedRequest): Promise<RawEmbedResponse> {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_KEY;

    if (!endpoint || !apiKey) {
      throw new Error(
        'AzureEmbeddingBackendStub: AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY must be set to use the Azure backend. ' +
          'Set those env vars and replace this stub with a production-ready Azure client.',
      );
    }

    throw new Error(
      'AzureEmbeddingBackendStub: Azure OpenAI backend is stubbed. ' +
        'Implement this backend using the @azure/openai SDK and the AzureKeyCredential.',
    );
  }

  async health(): Promise<{ healthy: boolean; latencyMs?: number; detail?: string }> {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    return {
      healthy: false,
      detail: endpoint
        ? 'Azure backend stub — implement with @azure/openai SDK'
        : 'Azure backend stub — AZURE_OPENAI_ENDPOINT not set',
    };
  }
}
