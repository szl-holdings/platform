/**
 * Schema-grounded extraction (KnowledgeExtraction primitive).
 *
 * Wraps the existing langextract extractor so that *gaps* (fields with no
 * source span) and *conflicts* (fields with two or more incompatible spans)
 * survive into the output as first-class records — never dropped silently.
 *
 * Every extracted value carries a per-field span provenance hash, so a
 * downstream consumer can replay or audit exactly which byte range of the
 * source document produced the value.
 *
 * Doctrine V6 receipt: `extraction.schema-grounded.v1`.
 */

import { createHash } from 'node:crypto';
import type { ExtractionHit } from './cache.js';
import { buildSpanProvenance, hashDocument, type SpanProvenance } from './span-provenance.js';

export interface FieldSchema {
  readonly name: string;
  readonly type: 'string' | 'number' | 'date' | 'enum' | 'boolean';
  readonly required: boolean;
  /** When type='enum', the allowed values. Mismatch becomes a conflict. */
  readonly enumValues?: ReadonlyArray<string>;
  /** Human description used for extractor prompt grounding. */
  readonly description?: string;
}

export interface DocumentSchema {
  readonly schemaRef: string;
  readonly fields: ReadonlyArray<FieldSchema>;
}

export interface ExtractedField<T = unknown> {
  readonly field: string;
  readonly value: T;
  readonly confidence: number;
  readonly spanProvenance: SpanProvenance;
}

export interface FieldGap {
  readonly field: string;
  readonly reason: 'no-source-span' | 'low-confidence' | 'type-mismatch';
  readonly detail?: string;
}

export interface FieldConflict {
  readonly field: string;
  readonly candidates: ReadonlyArray<{
    readonly value: unknown;
    readonly spanProvenance: SpanProvenance;
    readonly confidence: number;
  }>;
}

export interface SchemaGroundedResult {
  readonly schemaRef: string;
  readonly documentHash: string;
  readonly extracted: ReadonlyArray<ExtractedField>;
  readonly gaps: ReadonlyArray<FieldGap>;
  readonly conflicts: ReadonlyArray<FieldConflict>;
  readonly receipt: {
    readonly kind: 'extraction.schema-grounded.v1';
    readonly producedAt: string;
    readonly receiptHash: string;
  };
}

const MIN_CONFIDENCE = 0.4;

function coerce(value: string, type: FieldSchema['type']): { ok: true; value: unknown } | { ok: false } {
  switch (type) {
    case 'string':
      return { ok: true, value };
    case 'number': {
      const n = Number(value.replace(/[,\s$]/g, ''));
      return Number.isFinite(n) ? { ok: true, value: n } : { ok: false };
    }
    case 'date': {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? { ok: false } : { ok: true, value: d.toISOString() };
    }
    case 'boolean': {
      const v = value.trim().toLowerCase();
      if (['true', 'yes', 'y', '1'].includes(v)) return { ok: true, value: true };
      if (['false', 'no', 'n', '0'].includes(v)) return { ok: true, value: false };
      return { ok: false };
    }
    case 'enum':
      return { ok: true, value };
  }
}

/**
 * Post-process raw extraction hits against a target schema. Pure function;
 * deterministic; no I/O.
 */
export function groundExtractionAgainstSchema(
  documentText: string,
  schema: DocumentSchema,
  hits: ReadonlyArray<ExtractionHit>,
): SchemaGroundedResult {
  const documentHash = hashDocument(documentText);
  const byField = new Map<string, Array<{ hit: ExtractionHit; confidence: number }>>();
  for (const hit of hits) {
    const confidence = Number(hit.attributes?.confidence ?? '0.7');
    const bucket = byField.get(hit.class) ?? [];
    bucket.push({ hit, confidence });
    byField.set(hit.class, bucket);
  }

  const extracted: ExtractedField[] = [];
  const gaps: FieldGap[] = [];
  const conflicts: FieldConflict[] = [];

  for (const field of schema.fields) {
    const candidates = byField.get(field.name) ?? [];
    if (candidates.length === 0) {
      if (field.required) {
        gaps.push({ field: field.name, reason: 'no-source-span' });
      }
      continue;
    }

    const coerced = candidates.map((c) => {
      const result = coerce(c.hit.text, field.type);
      const span = buildSpanProvenance(documentHash, c.hit.startChar, c.hit.endChar, c.hit.text);
      return { ...c, coerced: result, span };
    });

    const valid = coerced.filter((c) => c.coerced.ok && c.confidence >= MIN_CONFIDENCE);
    if (valid.length === 0) {
      const reason = coerced.some((c) => !c.coerced.ok) ? 'type-mismatch' : 'low-confidence';
      gaps.push({
        field: field.name,
        reason,
        detail: `${candidates.length} candidate(s) rejected`,
      });
      continue;
    }

    // Enum policing: a value outside enumValues is itself a conflict.
    if (field.type === 'enum' && field.enumValues) {
      const inEnum = valid.filter((c) => field.enumValues!.includes(String((c.coerced as { value: unknown }).value)));
      if (inEnum.length === 0) {
        conflicts.push({
          field: field.name,
          candidates: valid.map((c) => ({
            value: (c.coerced as { value: unknown }).value,
            spanProvenance: c.span,
            confidence: c.confidence,
          })),
        });
        continue;
      }
    }

    const uniqueValues = new Set(valid.map((c) => JSON.stringify((c.coerced as { value: unknown }).value)));
    if (uniqueValues.size > 1) {
      conflicts.push({
        field: field.name,
        candidates: valid.map((c) => ({
          value: (c.coerced as { value: unknown }).value,
          spanProvenance: c.span,
          confidence: c.confidence,
        })),
      });
      continue;
    }

    const best = valid.reduce((a, b) => (a.confidence >= b.confidence ? a : b));
    extracted.push({
      field: field.name,
      value: (best.coerced as { value: unknown }).value,
      confidence: best.confidence,
      spanProvenance: best.span,
    });
  }

  const producedAt = new Date().toISOString();
  const receiptCanonical = JSON.stringify({
    schemaRef: schema.schemaRef,
    documentHash,
    extracted: extracted.map((e) => ({ field: e.field, value: e.value, spanHash: e.spanProvenance.spanHash })),
    gaps: gaps.map((g) => ({ field: g.field, reason: g.reason })),
    conflicts: conflicts.map((c) => ({ field: c.field, n: c.candidates.length })),
  });
  const receiptHash = createHash('sha256').update(receiptCanonical, 'utf8').digest('hex');

  return {
    schemaRef: schema.schemaRef,
    documentHash,
    extracted,
    gaps,
    conflicts,
    receipt: {
      kind: 'extraction.schema-grounded.v1',
      producedAt,
      receiptHash,
    },
  };
}
