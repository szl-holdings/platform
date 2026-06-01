/**
 * Drift detector: compares the current sync's schema and volume to the
 * recorded baseline (first successful sync) and flags meaningful changes.
 */

import type { DriftReport, SyncResult } from './types';

export interface DriftBaseline {
  connectorId: string;
  recordCount: number;
  fieldNames: string[];
  capturedAt: string;
}

export interface DriftThresholds {
  volumeWarn: number;
  volumeCritical: number;
}

export const DEFAULT_THRESHOLDS: DriftThresholds = {
  volumeWarn: 0.25,
  volumeCritical: 0.5,
};

export function captureFields(records: unknown[]): string[] {
  const fields = new Set<string>();
  for (const r of records) {
    if (r && typeof r === 'object') {
      for (const k of Object.keys(r as Record<string, unknown>)) fields.add(k);
    }
  }
  return Array.from(fields).sort();
}

export function detectDrift(
  connectorId: string,
  records: unknown[],
  baseline: DriftBaseline | null,
  thresholds: DriftThresholds = DEFAULT_THRESHOLDS,
): DriftReport {
  const currentFields = captureFields(records);
  const currentCount = records.length;

  if (!baseline) {
    return {
      connectorId,
      baselineRecordCount: null,
      currentRecordCount: currentCount,
      volumeDrift: 0,
      schemaDrift: 0,
      addedFields: [],
      removedFields: [],
      severity: 'none',
      threshold: thresholds,
    };
  }

  const baseFieldSet = new Set(baseline.fieldNames);
  const currFieldSet = new Set(currentFields);
  const addedFields = currentFields.filter((f) => !baseFieldSet.has(f));
  const removedFields = baseline.fieldNames.filter((f) => !currFieldSet.has(f));
  const schemaDrift = addedFields.length + removedFields.length;

  const volumeDrift =
    baseline.recordCount === 0
      ? currentCount > 0
        ? 1
        : 0
      : Math.abs(currentCount - baseline.recordCount) / baseline.recordCount;

  let severity: DriftReport['severity'] = 'none';
  if (schemaDrift > 0) severity = removedFields.length > 0 ? 'critical' : 'warn';
  if (volumeDrift >= thresholds.volumeCritical) severity = 'critical';
  else if (volumeDrift >= thresholds.volumeWarn && severity === 'none') severity = 'warn';
  else if (volumeDrift > 0 && severity === 'none') severity = 'info';

  return {
    connectorId,
    baselineRecordCount: baseline.recordCount,
    currentRecordCount: currentCount,
    volumeDrift: Number(volumeDrift.toFixed(4)),
    schemaDrift,
    addedFields,
    removedFields,
    severity,
    threshold: thresholds,
  };
}

export function shouldEscalate(result: SyncResult): boolean {
  if (result.status === 'dead-letter') return true;
  if (result.drift && (result.drift.severity === 'critical' || result.drift.severity === 'warn')) {
    return true;
  }
  return false;
}
