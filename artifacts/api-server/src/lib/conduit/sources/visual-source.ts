/**
 * Visual source connector — turns a frame (configured inline as base64
 * `frameBytesB64`) plus a list of bbox-grounded detections into rows
 * using @workspace/seeing-eye. Doctrine V6: every readBatch emits a
 * `vision.seeing-eye.v1` receipt whose hash is stamped on every row.
 *
 * Config (sourceMeta):
 *   {
 *     schemaRef: string,
 *     labels: string[],          // expected vocabulary
 *     frameBytesB64: string,     // base64-encoded frame bytes
 *     detections: Array<{ label, bbox:[x,y,w,h], confidence? }>
 *   }
 *
 * Each detection becomes one row. Every label in `labels` not present
 * in detections becomes a `not_detected` row — never silently dropped.
 */

import { createHash } from 'node:crypto';
import {
  groundVisualClaims,
  UngroundedVisualClaimError,
  type RawDetection,
} from '@workspace/seeing-eye';
import type {
  SourceConnector,
  ConnectionCheckResult,
  FieldDescriptor,
  ReadBatchResult,
} from '../connector-protocol';

interface VisualConfig {
  schemaRef?: string;
  labels?: string[];
  frameBytesB64?: string;
  detections?: RawDetection[];
}

function parseConfig(raw: Record<string, unknown>): VisualConfig {
  return {
    schemaRef: typeof raw.schemaRef === 'string' ? raw.schemaRef : undefined,
    labels: Array.isArray(raw.labels) ? (raw.labels as string[]) : undefined,
    frameBytesB64: typeof raw.frameBytesB64 === 'string' ? raw.frameBytesB64 : undefined,
    detections: Array.isArray(raw.detections) ? (raw.detections as RawDetection[]) : [],
  };
}

export const visualSource: SourceConnector = {
  type: 'visual',

  async checkConnection(rawConfig): Promise<ConnectionCheckResult> {
    const start = Date.now();
    const cfg = parseConfig(rawConfig);
    if (!cfg.schemaRef || !cfg.labels?.length || !cfg.frameBytesB64) {
      return {
        success: false,
        message: 'visual source requires schemaRef, labels[], frameBytesB64',
        latencyMs: Date.now() - start,
      };
    }
    return {
      success: true,
      message: `visual source ready · ${cfg.labels.length} label(s) · schema=${cfg.schemaRef}`,
      latencyMs: Date.now() - start,
    };
  },

  async discover(rawConfig): Promise<{ fields: FieldDescriptor[] }> {
    const cfg = parseConfig(rawConfig);
    return {
      fields: [
        { name: '_row_kind', label: 'Row kind (detection|not_detected)', type: 'string' },
        { name: 'label', label: 'Label', type: 'string' },
        { name: 'bbox_x', label: 'Bbox · x', type: 'number' },
        { name: 'bbox_y', label: 'Bbox · y', type: 'number' },
        { name: 'bbox_w', label: 'Bbox · w', type: 'number' },
        { name: 'bbox_h', label: 'Bbox · h', type: 'number' },
        { name: 'confidence', label: 'Confidence', type: 'number' },
        { name: '_frame_hash', label: 'Frame hash (sha256)', type: 'string' },
        { name: '_perceptual_hash', label: 'Perceptual hash', type: 'string' },
        { name: '_schema_ref', label: 'Schema ref', type: 'string', required: !!cfg.schemaRef },
        { name: '_receipt_kind', label: 'Receipt · kind', type: 'string' },
        { name: '_receipt_hash', label: 'Receipt · hash', type: 'string' },
      ],
    };
  },

  async previewRows(rawConfig, limit = 10) {
    const result = await this.readBatch(rawConfig, { batchSize: limit });
    const fieldSet = new Set<string>();
    for (const row of result.rows) for (const k of Object.keys(row)) fieldSet.add(k);
    return { fields: [...fieldSet], rows: result.rows.slice(0, limit), totalRows: result.rows.length };
  },

  async readBatch(rawConfig, options): Promise<ReadBatchResult> {
    const cfg = parseConfig(rawConfig);
    if (!cfg.schemaRef || !cfg.labels?.length || !cfg.frameBytesB64) {
      throw new Error('visual source requires schemaRef, labels[], frameBytesB64');
    }
    const frameBytes = Uint8Array.from(Buffer.from(cfg.frameBytesB64, 'base64'));
    let grounded;
    try {
      grounded = groundVisualClaims(
        { schemaRef: cfg.schemaRef, labels: cfg.labels },
        frameBytes,
        cfg.detections ?? [],
      );
    } catch (err) {
      if (err instanceof UngroundedVisualClaimError) {
        // Surface as a row, not a silent drop — every "ungrounded" detection
        // becomes a quarantine row keyed by the offending label.
        const receiptHash = createHash('sha256').update(`ungrounded|${cfg.schemaRef}`, 'utf8').digest('hex');
        return {
          rows: [{
            _row_kind: 'ungrounded',
            label: (err as UngroundedVisualClaimError).label ?? 'unknown',
            _schema_ref: cfg.schemaRef,
            _receipt_kind: 'vision.seeing-eye.v1',
            _receipt_hash: receiptHash,
            _error: err.message,
          }],
          cursor: receiptHash,
          hasMore: false,
        };
      }
      throw err;
    }

    const stamp = {
      _frame_hash: grounded.frameHash,
      _perceptual_hash: grounded.perceptualHash,
      _schema_ref: grounded.schemaRef,
      _receipt_kind: grounded.receipt.kind,
      _receipt_hash: grounded.receipt.receiptHash,
    };

    const rows: Array<Record<string, unknown>> = [];
    for (const d of grounded.detections) {
      rows.push({
        ...stamp,
        _row_kind: 'detection',
        label: d.label,
        bbox_x: d.bbox[0],
        bbox_y: d.bbox[1],
        bbox_w: d.bbox[2],
        bbox_h: d.bbox[3],
        confidence: d.confidence,
      });
    }
    for (const label of grounded.notDetected) {
      rows.push({ ...stamp, _row_kind: 'not_detected', label });
    }

    const sliced = options?.batchSize && options.batchSize > 0 ? rows.slice(0, options.batchSize) : rows;
    return { rows: sliced, cursor: grounded.receipt.receiptHash, hasMore: false };
  },
};
