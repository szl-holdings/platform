import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeCacheKey,
  type ExtractionHit,
  type ExtractionRequest,
  type ExtractionResult,
} from './cache.js';

export type { ExtractionExample, ExtractionHit, ExtractionRequest, ExtractionResult } from './cache.js';
export { computeCacheKey } from './cache.js';
export {
  groundExtractionAgainstSchema,
  type DocumentSchema,
  type FieldSchema,
  type ExtractedField,
  type FieldGap,
  type FieldConflict,
  type SchemaGroundedResult,
} from './schema-grounded-extract.js';
export {
  buildSpanProvenance,
  hashDocument,
  normaliseSpanText,
  type SpanProvenance,
} from './span-provenance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PYTHON_SIDECAR = resolve(__dirname, 'python', 'extract.py');

export interface ExtractOptions {
  readonly cacheDir: string;
  readonly mode?: 'cache-only' | 'live';
  readonly python?: string;
  readonly timeoutMs?: number;
}

export class LangExtractCacheMissError extends Error {
  constructor(public readonly cacheKey: string) {
    super(
      `langextract-bridge: cache miss for key ${cacheKey}. ` +
        `Run with mode='live' (and LANGEXTRACT_API_KEY) to populate the cache, ` +
        `then re-run cache-only for deterministic replay.`,
    );
    this.name = 'LangExtractCacheMissError';
  }
}

export async function extract(
  request: ExtractionRequest,
  options: ExtractOptions,
): Promise<ExtractionResult> {
  const cacheKey = computeCacheKey(request);
  const cachePath = join(options.cacheDir, `${cacheKey}.json`);

  if (existsSync(cachePath)) {
    const raw = await readFile(cachePath, 'utf8');
    const cached = JSON.parse(raw) as ExtractionResult;
    if (cached.cacheKey !== cacheKey) {
      throw new Error(
        `langextract-bridge: cache file ${cachePath} has key ${cached.cacheKey} but expected ${cacheKey} (corrupted)`,
      );
    }
    return cached;
  }

  if ((options.mode ?? 'cache-only') === 'cache-only') {
    throw new LangExtractCacheMissError(cacheKey);
  }

  const hits = await runPythonSidecar(request, {
    python: options.python ?? process.env.LANGEXTRACT_PYTHON ?? 'python3',
    timeoutMs: options.timeoutMs ?? 60_000,
  });

  const result: ExtractionResult = {
    request,
    hits,
    cacheKey,
    producedAt: new Date().toISOString(),
  };

  await mkdir(options.cacheDir, { recursive: true });
  await writeFile(cachePath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}

interface SidecarOptions {
  readonly python: string;
  readonly timeoutMs: number;
}

function runPythonSidecar(
  request: ExtractionRequest,
  opts: SidecarOptions,
): Promise<ReadonlyArray<ExtractionHit>> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(opts.python, [PYTHON_SIDECAR], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      rejectPromise(new Error(`langextract-bridge: python sidecar timed out after ${opts.timeoutMs}ms`));
    }, opts.timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      rejectPromise(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        rejectPromise(
          new Error(
            `langextract-bridge: python sidecar exited ${code}. stderr: ${stderr.slice(0, 2000)}`,
          ),
        );
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as { hits: ReadonlyArray<ExtractionHit> };
        resolvePromise(parsed.hits);
      } catch (e) {
        rejectPromise(
          new Error(
            `langextract-bridge: failed to parse sidecar output. err=${String(e)} stdout=${stdout.slice(0, 2000)}`,
          ),
        );
      }
    });

    child.stdin.write(JSON.stringify(request));
    child.stdin.end();
  });
}
