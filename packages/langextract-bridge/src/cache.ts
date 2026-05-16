import { createHash } from 'node:crypto';

export interface ExtractionExample {
  readonly text: string;
  readonly extractions: ReadonlyArray<{
    readonly class: string;
    readonly text: string;
    readonly attributes?: Readonly<Record<string, string>>;
  }>;
}

export interface ExtractionRequest {
  readonly model: string;
  readonly promptDescription: string;
  readonly examples: ReadonlyArray<ExtractionExample>;
  readonly sourceText: string;
}

export interface ExtractionHit {
  readonly class: string;
  readonly text: string;
  readonly startChar: number;
  readonly endChar: number;
  readonly attributes: Readonly<Record<string, string>>;
}

export interface ExtractionResult {
  readonly request: ExtractionRequest;
  readonly hits: ReadonlyArray<ExtractionHit>;
  readonly cacheKey: string;
  readonly producedAt: string;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

export function computeCacheKey(request: ExtractionRequest): string {
  const canonical = stableStringify({
    model: request.model,
    promptDescription: request.promptDescription,
    examples: request.examples,
    sourceText: request.sourceText,
  });
  return createHash('sha256').update(canonical).digest('hex');
}
