import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { EvalRunResult } from '../types.js';

export function formatEvalResultAsJson(result: EvalRunResult): string {
  return JSON.stringify(result, null, 2);
}

export function writeEvalResultJson(result: EvalRunResult, filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, formatEvalResultAsJson(result), 'utf8');
}
