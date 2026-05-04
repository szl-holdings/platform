import { describe, it, expect } from 'vitest';
import { checkOutputConstraints, GUARD_LIMITS } from '../guided-output-guard.js';

const CTX = { tenantId: 'tenant-guard-test', requestId: 'req-g001' };

describe('GuidedOutputGuard', () => {
  it('passes valid, small JSON schema', () => {
    const result = checkOutputConstraints(
      {
        jsonSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
          },
        },
      },
      CTX,
    );
    expect(result.passed).toBe(true);
    expect(result.rejections).toHaveLength(0);
  });

  it('rejects JSON schema exceeding 256KB', () => {
    const hugeSchema = { type: 'object', properties: {} as Record<string, unknown> };
    for (let i = 0; i < 5000; i++) {
      hugeSchema.properties[`field_${i}_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`] = {
        type: 'string',
        description: 'A very long field description that takes up lots of space in the schema',
      };
    }
    const result = checkOutputConstraints({ jsonSchema: hugeSchema }, CTX);
    expect(result.passed).toBe(false);
    expect(result.rejections[0]?.guardRule).toBe('json_schema_too_large');
    expect(result.rejections[0]?.maxAllowed).toBe(GUARD_LIMITS.JSON_SCHEMA_MAX_BYTES);
  });

  it('rejects JSON schema with nesting deeper than 64', () => {
    let nested: Record<string, unknown> = { type: 'string' };
    for (let i = 0; i < 70; i++) {
      nested = { type: 'object', properties: { child: nested } };
    }
    const result = checkOutputConstraints({ jsonSchema: nested }, CTX);
    expect(result.passed).toBe(false);
    expect(result.rejections[0]?.guardRule).toBe('nesting_too_deep');
    expect(result.rejections[0]?.maxAllowed).toBe(GUARD_LIMITS.NESTING_MAX_DEPTH);
  });

  it('rejects regex exceeding 32KB', () => {
    const largeRegex = 'a'.repeat(GUARD_LIMITS.REGEX_MAX_BYTES + 100);
    const result = checkOutputConstraints({ regex: largeRegex }, CTX);
    expect(result.passed).toBe(false);
    expect(result.rejections[0]?.guardRule).toBe('regex_too_large');
  });

  it('rejects grammar exceeding 64KB', () => {
    const largeGrammar = 'rule ::= ' + '"a" '.repeat(GUARD_LIMITS.GRAMMAR_MAX_BYTES / 4);
    const result = checkOutputConstraints({ grammar: largeGrammar }, CTX);
    expect(result.passed).toBe(false);
    expect(result.rejections[0]?.guardRule).toBe('grammar_too_large');
  });

  it('rejects whitespace pattern exceeding 1KB', () => {
    const bigWhitespace = ' '.repeat(GUARD_LIMITS.WHITESPACE_MAX_BYTES + 10);
    const result = checkOutputConstraints({ whitespacePattern: bigWhitespace }, CTX);
    expect(result.passed).toBe(false);
    expect(result.rejections[0]?.guardRule).toBe('whitespace_pattern_too_large');
  });

  it('collects multiple violations in one pass', () => {
    const largeRegex = 'x'.repeat(GUARD_LIMITS.REGEX_MAX_BYTES + 1);
    const bigWhitespace = ' '.repeat(GUARD_LIMITS.WHITESPACE_MAX_BYTES + 1);
    const result = checkOutputConstraints(
      { regex: largeRegex, whitespacePattern: bigWhitespace },
      CTX,
    );
    expect(result.passed).toBe(false);
    expect(result.rejections.length).toBe(2);
    const rules = result.rejections.map((r) => r.guardRule);
    expect(rules).toContain('regex_too_large');
    expect(rules).toContain('whitespace_pattern_too_large');
  });

  it('passes constraints when all inputs are within limits', () => {
    const result = checkOutputConstraints(
      {
        regex: '^[a-z]+$',
        grammar: 'root ::= "hello"',
        whitespacePattern: '  ',
      },
      CTX,
    );
    expect(result.passed).toBe(true);
    expect(result.rejections).toHaveLength(0);
  });
});
