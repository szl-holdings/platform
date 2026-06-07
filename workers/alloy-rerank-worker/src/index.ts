export { CrossEncoderHttpRerankBackend } from './backends/cross-encoder-http.js';
export { DeterministicFallbackRerankBackend } from './backends/fallback.js';
export type {
  RawRerankRequest,
  RawRerankResponse,
  RawRerankResult,
  RerankBackend,
  RerankBackendDescriptor,
} from './backends/interface.js';

import { CrossEncoderHttpRerankBackend } from './backends/cross-encoder-http.js';
import { DeterministicFallbackRerankBackend } from './backends/fallback.js';
import type { RawRerankRequest, RawRerankResponse, RerankBackend } from './backends/interface.js';

let _primaryBackend: RerankBackend | undefined;
let _fallbackBackend: RerankBackend | undefined;

export function getDefaultRerankWorker(): { primary: RerankBackend; fallback: RerankBackend } {
  if (!_primaryBackend || !_fallbackBackend) {
    _primaryBackend = new CrossEncoderHttpRerankBackend();
    _fallbackBackend = new DeterministicFallbackRerankBackend();
  }
  return { primary: _primaryBackend, fallback: _fallbackBackend };
}

export async function rerankCandidates(
  req: RawRerankRequest,
  options: { useFallback?: boolean } = {},
): Promise<RawRerankResponse> {
  const { primary, fallback } = getDefaultRerankWorker();
  const backend = options.useFallback ? fallback : primary;

  try {
    return await backend.rerank(req);
  } catch (err) {
    if (options.useFallback) throw err;

    const fallbackResult = await fallback.rerank(req);
    return {
      ...fallbackResult,
      model: `${fallbackResult.model}+fallback-from-error`,
    };
  }
}
