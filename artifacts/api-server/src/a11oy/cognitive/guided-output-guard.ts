import { randomUUID } from 'node:crypto';
import { newId } from './types.js';
import type { GuardResult, GuardRejection, GuardRule, OutputConstraints } from './types.js';

const LIMITS = {
  JSON_SCHEMA_MAX_BYTES: 256 * 1024,
  NESTING_MAX_DEPTH: 64,
  REGEX_MAX_BYTES: 32 * 1024,
  GRAMMAR_MAX_BYTES: 64 * 1024,
  WHITESPACE_MAX_BYTES: 1024,
} as const;

function byteLength(s: string): number {
  return Buffer.byteLength(s, 'utf8');
}

function jsonNestingDepth(obj: unknown, depth = 0): number {
  if (depth > LIMITS.NESTING_MAX_DEPTH + 5) return depth;
  if (Array.isArray(obj)) {
    return obj.length === 0 ? depth : Math.max(...obj.map((v) => jsonNestingDepth(v, depth + 1)));
  }
  if (obj !== null && typeof obj === 'object') {
    const vals = Object.values(obj as Record<string, unknown>);
    return vals.length === 0 ? depth : Math.max(...vals.map((v) => jsonNestingDepth(v, depth + 1)));
  }
  return depth;
}

function redactSnippet(raw: string, maxLen = 120): string {
  const trimmed = raw.slice(0, maxLen);
  return trimmed.replace(/["']([^"']{8,})['"]/g, '"[REDACTED]"');
}

export function checkOutputConstraints(
  constraints: OutputConstraints,
  context: { requestId?: string; tenantId: string; domain?: string },
): GuardResult {
  const rejections: GuardRejection[] = [];

  if (constraints.jsonSchema !== undefined) {
    const schemaStr =
      typeof constraints.jsonSchema === 'string'
        ? constraints.jsonSchema
        : JSON.stringify(constraints.jsonSchema);

    const schemaBytes = byteLength(schemaStr);
    if (schemaBytes > LIMITS.JSON_SCHEMA_MAX_BYTES) {
      rejections.push({
        rejectionId: newId('grj'),
        guardRule: 'json_schema_too_large',
        violatedLimit: `json_schema_max_bytes=${LIMITS.JSON_SCHEMA_MAX_BYTES}`,
        actualSize: schemaBytes,
        maxAllowed: LIMITS.JSON_SCHEMA_MAX_BYTES,
        redactedSnippet: redactSnippet(schemaStr),
      });
    } else {
      const depth = jsonNestingDepth(constraints.jsonSchema);
      if (depth > LIMITS.NESTING_MAX_DEPTH) {
        rejections.push({
          rejectionId: newId('grj'),
          guardRule: 'nesting_too_deep',
          violatedLimit: `nesting_max_depth=${LIMITS.NESTING_MAX_DEPTH}`,
          actualSize: depth,
          maxAllowed: LIMITS.NESTING_MAX_DEPTH,
          redactedSnippet: redactSnippet(schemaStr),
        });
      }
    }
  }

  if (constraints.regex !== undefined) {
    const regexBytes = byteLength(constraints.regex);
    if (regexBytes > LIMITS.REGEX_MAX_BYTES) {
      rejections.push({
        rejectionId: newId('grj'),
        guardRule: 'regex_too_large',
        violatedLimit: `regex_max_bytes=${LIMITS.REGEX_MAX_BYTES}`,
        actualSize: regexBytes,
        maxAllowed: LIMITS.REGEX_MAX_BYTES,
        redactedSnippet: redactSnippet(constraints.regex),
      });
    }
  }

  if (constraints.grammar !== undefined) {
    const grammarBytes = byteLength(constraints.grammar);
    if (grammarBytes > LIMITS.GRAMMAR_MAX_BYTES) {
      rejections.push({
        rejectionId: newId('grj'),
        guardRule: 'grammar_too_large',
        violatedLimit: `grammar_max_bytes=${LIMITS.GRAMMAR_MAX_BYTES}`,
        actualSize: grammarBytes,
        maxAllowed: LIMITS.GRAMMAR_MAX_BYTES,
        redactedSnippet: redactSnippet(constraints.grammar),
      });
    }
  }

  if (constraints.whitespacePattern !== undefined) {
    const wpBytes = byteLength(constraints.whitespacePattern);
    if (wpBytes > LIMITS.WHITESPACE_MAX_BYTES) {
      rejections.push({
        rejectionId: newId('grj'),
        guardRule: 'whitespace_pattern_too_large',
        violatedLimit: `whitespace_max_bytes=${LIMITS.WHITESPACE_MAX_BYTES}`,
        actualSize: wpBytes,
        maxAllowed: LIMITS.WHITESPACE_MAX_BYTES,
        redactedSnippet: redactSnippet(constraints.whitespacePattern),
      });
    }
  }

  return {
    passed: rejections.length === 0,
    rejections,
  };
}

export { LIMITS as GUARD_LIMITS };
