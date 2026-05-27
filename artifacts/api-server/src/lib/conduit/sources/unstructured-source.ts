/**
 * Unstructured source connector — turns a free-text document (configured
 * inline via `documentText`) into schema-grounded rows using
 * @workspace/langextract-bridge. Gaps and conflicts are surfaced as
 * structured rows (one row per gap/conflict) so they show up in the sync
 * run's row table — never silently dropped.
 *
 * Doctrine V6: every readBatch emits an `extraction.schema-grounded.v1`
 * receipt; the receipt hash is attached to the rows' `_receipt` field so
 * `conduitSyncRunRowsTable` carries replay provenance.
 *
 * Config (sourceMeta):
 *   {
 *     documentText: string,
 *     schema: { schemaRef, fields: FieldSchema[] },
 *     hits?: ExtractionHit[]   // optional pre-computed; otherwise we use
 *                              // a deterministic regex-driven extractor
 *                              // so the connector works end-to-end without
 *                              // the python sidecar.
 *   }
 */

import { createHash } from 'node:crypto';
import {
  groundExtractionAgainstSchema,
  type DocumentSchema,
  type ExtractionHit,
} from '@workspace/langextract-bridge';
import type {
  SourceConnector,
  ConnectionCheckResult,
  FieldDescriptor,
  ReadBatchResult,
} from '../connector-protocol';

interface UnstructuredConfig {
  documentText?: string;
  /** Raw document bytes (base64). Supported MIME: text/html, text/plain. */
  documentBytesB64?: string;
  documentMime?: string;
  schema?: DocumentSchema;
  hits?: ExtractionHit[];
}

function parseConfig(config: Record<string, unknown>): UnstructuredConfig {
  return {
    documentText: typeof config.documentText === 'string' ? config.documentText : undefined,
    documentBytesB64: typeof config.documentBytesB64 === 'string' ? config.documentBytesB64 : undefined,
    documentMime: typeof config.documentMime === 'string' ? config.documentMime : undefined,
    schema: (config.schema as DocumentSchema | undefined),
    hits: Array.isArray(config.hits) ? (config.hits as ExtractionHit[]) : undefined,
  };
}

/**
 * Document ingestion adapter: turn raw bytes + MIME into plain text.
 * - text/html → strip <script>/<style>, then tags; collapse whitespace.
 * - text/plain (default) → utf8 decode as-is.
 * PDF is intentionally out of scope here — a future adapter can dispatch
 * to packages/document-intelligence without changing this contract.
 */
function bytesToText(b64: string, mime?: string): string {
  const buf = Buffer.from(b64, 'base64');
  const raw = buf.toString('utf8');
  const m = (mime ?? 'text/plain').toLowerCase();
  if (m.includes('html')) {
    return raw
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(p|div|li|tr|h[1-6]|section|article|br)\s*>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }
  return raw;
}

function resolveDocumentText(cfg: UnstructuredConfig): string | undefined {
  if (cfg.documentText) return cfg.documentText;
  if (cfg.documentBytesB64) return bytesToText(cfg.documentBytesB64, cfg.documentMime);
  return undefined;
}

/**
 * Fallback deterministic extractor: for each field name, look for "name: value"
 * or "name = value" style anchors. Strict, no LLM — this exists so the
 * connector can run end-to-end without a python sidecar and still produce
 * grounded SpanProvenance.
 */
function regexExtract(documentText: string, schema: DocumentSchema): ExtractionHit[] {
  const hits: ExtractionHit[] = [];
  for (const field of schema.fields) {
    // Stop at newline or semicolon; allow commas (so "24,180" survives).
    const re = new RegExp(`${field.name.replace(/_/g, '[ _-]?')}\\s*[:=]\\s*([^\\n;]+)`, 'i');
    const m = documentText.match(re);
    if (!m || m.index === undefined) continue;
    const value = m[1].trim();
    const startChar = m.index + m[0].indexOf(value);
    hits.push({
      class: field.name,
      text: value,
      startChar,
      endChar: startChar + value.length,
      attributes: { confidence: '0.9' },
    });
  }
  return hits;
}

export const unstructuredSource: SourceConnector = {
  type: 'unstructured',

  async checkConnection(rawConfig: Record<string, unknown>): Promise<ConnectionCheckResult> {
    const start = Date.now();
    const cfg = parseConfig(rawConfig);
    const text = resolveDocumentText(cfg);
    if (!text || !cfg.schema?.fields?.length) {
      return {
        success: false,
        message: 'unstructured source requires sourceMeta.{documentText|documentBytesB64+documentMime} and sourceMeta.schema.fields',
        latencyMs: Date.now() - start,
      };
    }
    return {
      success: true,
      message: `unstructured source ready · schema=${cfg.schema.schemaRef} · ${cfg.schema.fields.length} field(s)`,
      latencyMs: Date.now() - start,
    };
  },

  async discover(rawConfig: Record<string, unknown>): Promise<{ fields: FieldDescriptor[] }> {
    const cfg = parseConfig(rawConfig);
    const fields: FieldDescriptor[] = (cfg.schema?.fields ?? []).map((f) => ({
      name: f.name,
      label: f.name,
      type: f.type,
      required: f.required,
    }));
    // Doctrine V6: gaps and conflicts are first-class outputs — they get
    // their own discoverable fields so the destination side can map them
    // explicitly (e.g. to a quarantine table or an approvals queue).
    fields.push(
      { name: '_gap_field', label: 'Gap · field', type: 'string' },
      { name: '_gap_reason', label: 'Gap · reason', type: 'string' },
      { name: '_conflict_field', label: 'Conflict · field', type: 'string' },
      { name: '_conflict_candidates', label: 'Conflict · candidate JSON', type: 'string' },
      { name: '_receipt_kind', label: 'Receipt · kind', type: 'string' },
      { name: '_receipt_hash', label: 'Receipt · hash', type: 'string' },
    );
    return { fields };
  },

  async previewRows(
    rawConfig: Record<string, unknown>,
    limit = 10,
  ): Promise<{ fields: string[]; rows: Array<Record<string, unknown>>; totalRows: number }> {
    const result = await this.readBatch(rawConfig, { batchSize: limit });
    const fieldSet = new Set<string>();
    for (const row of result.rows) for (const k of Object.keys(row)) fieldSet.add(k);
    return { fields: [...fieldSet], rows: result.rows.slice(0, limit), totalRows: result.rows.length };
  },

  async readBatch(rawConfig: Record<string, unknown>): Promise<ReadBatchResult> {
    const cfg = parseConfig(rawConfig);
    const documentText = resolveDocumentText(cfg);
    if (!documentText || !cfg.schema) {
      throw new Error('unstructured source requires (documentText | documentBytesB64) and schema');
    }
    const hits = cfg.hits ?? regexExtract(documentText, cfg.schema);
    const grounded = groundExtractionAgainstSchema(documentText, cfg.schema, hits);

    // One row per extracted field, plus one row per gap, plus one row per
    // conflict — gaps/conflicts are persisted alongside successes.
    const rows: Array<Record<string, unknown>> = [];

    const receiptStamp = {
      _receipt_kind: grounded.receipt.kind,
      _receipt_hash: grounded.receipt.receiptHash,
      _document_hash: grounded.documentHash,
      _schema_ref: grounded.schemaRef,
    };

    for (const e of grounded.extracted) {
      rows.push({
        ...receiptStamp,
        _row_kind: 'extracted',
        field: e.field,
        value: e.value,
        confidence: e.confidence,
        _span_hash: e.spanProvenance.spanHash,
        _span_start: e.spanProvenance.startByte,
        _span_end: e.spanProvenance.endByte,
      });
    }
    for (const g of grounded.gaps) {
      rows.push({
        ...receiptStamp,
        _row_kind: 'gap',
        _gap_field: g.field,
        _gap_reason: g.reason,
      });
    }
    for (const c of grounded.conflicts) {
      rows.push({
        ...receiptStamp,
        _row_kind: 'conflict',
        _conflict_field: c.field,
        _conflict_candidates: JSON.stringify(c.candidates.map((cand) => ({
          value: cand.value,
          confidence: cand.confidence,
          spanHash: cand.spanProvenance.spanHash,
        }))),
      });
    }

    // The cursor is the receipt hash — re-running with identical inputs is
    // a no-op (byte-identical replay).
    return { rows, cursor: grounded.receipt.receiptHash, hasMore: false };
  },
};

/**
 * Public helper for tests and the /conduit/unstructured/dry-run route:
 * returns the grounded result + a stable invocation id (sha256 of
 * documentText + schemaRef) for replay verification.
 */
export function dryRunUnstructured(documentText: string, schema: DocumentSchema, hits?: ExtractionHit[]) {
  const effectiveHits = hits ?? regexExtract(documentText, schema);
  const grounded = groundExtractionAgainstSchema(documentText, schema, effectiveHits);
  const invocationId = createHash('sha256')
    .update(`${documentText}|${schema.schemaRef}`, 'utf8')
    .digest('hex')
    .slice(0, 16);
  return { invocationId, grounded };
}
