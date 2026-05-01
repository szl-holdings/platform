import { cefExportAdapter, type SentraFinding } from './adapters/cef-export';
import { sentinelAsimAdapter } from './adapters/sentinel-asim-export';
import { chronicleUdmAdapter } from './adapters/chronicle-udm-export';

export type SiemExportAdapterId = 'splunk-cef' | 'sentinel-asim' | 'chronicle-udm';

export interface SiemExportAdapter {
  id: SiemExportAdapterId;
  displayName: string;
  description: string;
  configSchema: { shape: Record<string, unknown> };
  validate(config: Record<string, unknown>): { ok: true } | { ok: false; errors: string[] };
  testConnection(
    config: Record<string, unknown>,
  ): Promise<{ ok: true } | { ok: false; error: string }>;
  export(
    config: Record<string, unknown>,
    findings: SentraFinding[],
  ): Promise<{ exported: number; failed: number; errors: string[] }>;
}

const exportAdapters: Map<string, SiemExportAdapter> = new Map();

exportAdapters.set(cefExportAdapter.id, cefExportAdapter as SiemExportAdapter);
exportAdapters.set(sentinelAsimAdapter.id, sentinelAsimAdapter as SiemExportAdapter);
exportAdapters.set(chronicleUdmAdapter.id, chronicleUdmAdapter as SiemExportAdapter);

export function getExportAdapter(id: string): SiemExportAdapter | undefined {
  return exportAdapters.get(id);
}

export function listExportAdapters(): SiemExportAdapter[] {
  return Array.from(exportAdapters.values());
}

export type { SentraFinding };
