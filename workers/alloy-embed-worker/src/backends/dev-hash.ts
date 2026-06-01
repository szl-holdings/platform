/**
 * DevHashEmbeddingBackend
 *
 * A TypeScript-native, deterministic embedding backend for local development
 * and smoke testing. Requires no external service, no model download, and no GPU.
 *
 * Strategy: SHA-256(text + round) → pack as float32 → repeat until dim floats →
 *   L2-normalize. Identical inputs always produce identical unit vectors.
 *
 * To swap in a real model, replace DevHashEmbeddingBackend with
 * CpuLocalEmbeddingBackend (which calls the substrate-py-workers FastAPI endpoint)
 * or ExternalHttpEmbeddingBackend (which calls any HTTP inference service).
 */

import { createHash } from 'node:crypto';
import type {
  EmbeddingBackend,
  EmbeddingBackendDescriptor,
  RawEmbedRequest,
  RawEmbedResponse,
} from './interface.js';

const DEFAULT_DIM = 384;

function hashEmbed(text: string, dim: number = DEFAULT_DIM): number[] {
  const floats: number[] = [];
  let round = 0;

  while (floats.length < dim) {
    const digest = createHash('sha256')
      .update(text)
      .update(round.toString(16).padStart(8, '0'))
      .digest();

    for (let j = 0; j <= digest.length - 4; j += 4) {
      const bits =
        (digest[j]! << 24) |
        ((digest[j + 1]! << 16) & 0xff0000) |
        ((digest[j + 2]! << 8) & 0xff00) |
        (digest[j + 3]! & 0xff);
      const view = Buffer.alloc(4);
      view.writeInt32BE(bits, 0);
      floats.push(view.readFloatBE(0));
    }
    round++;
  }

  const raw = floats.slice(0, dim);

  const norm = Math.sqrt(raw.reduce((acc, v) => acc + v * v, 0));
  if (norm === 0) return new Array(dim).fill(1 / Math.sqrt(dim));
  return raw.map((v) => v / norm);
}

export class DevHashEmbeddingBackend implements EmbeddingBackend {
  readonly descriptor: EmbeddingBackendDescriptor = {
    backendId: 'dev-hash',
    kind: 'cpu-local',
    displayName: 'DevHash (deterministic, no model required)',
    supportedModels: ['aef-dev-hash', '*'],
    maxTokens: 512,
    defaultPooling: 'mean',
    defaultTruncation: 'truncate',
  };

  readonly dimensions = DEFAULT_DIM;

  async embed(request: RawEmbedRequest): Promise<RawEmbedResponse> {
    const { texts } = request;

    const tokenCounts = texts.map((t) => Math.max(1, Math.ceil(t.length / 4)));
    const vectors = texts.map((text) => hashEmbed(text, this.dimensions));

    return {
      vectors,
      model: request.model ?? 'aef-dev-hash',
      dimensions: this.dimensions,
      tokenCounts,
    };
  }

  async health(): Promise<{ healthy: boolean; latencyMs?: number; detail?: string }> {
    return { healthy: true, detail: "DevHash backend is always healthy" };
  }
}
