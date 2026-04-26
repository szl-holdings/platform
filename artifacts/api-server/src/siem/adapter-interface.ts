import type { z } from 'zod';

export interface NormalizedAlert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  description: string;
  asset?: string;
  rawPayload?: unknown;
  detectedAt: string;
}

export interface SiemConnectionConfig {
  [key: string]: string | number | boolean | undefined;
}

export interface SiemAdapterMeta {
  id: string;
  displayName: string;
  description: string;
  configSchema: z.ZodObject<z.ZodRawShape>;
}

export interface SiemAdapter extends SiemAdapterMeta {
  validate(config: SiemConnectionConfig): { ok: true } | { ok: false; errors: string[] };
  testConnection(
    config: SiemConnectionConfig,
  ): Promise<{ ok: true; sample: NormalizedAlert[] } | { ok: false; error: string }>;
  start(connectionId: string, config: SiemConnectionConfig, onAlert: (alert: NormalizedAlert) => void): void;
  stop(connectionId: string): void;
}
