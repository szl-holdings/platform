export interface ConnectionCheckResult {
  success: boolean;
  message: string;
  latencyMs: number;
}

export interface FieldDescriptor {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  updateable?: boolean;
}

export interface ObjectDescriptor {
  name: string;
  label: string;
  description: string;
}

export interface ReadBatchResult {
  rows: Array<Record<string, unknown>>;
  cursor?: string | null;
  hasMore: boolean;
}

export interface WriteBatchRowResult {
  rowIndex: number;
  success: boolean;
  errorMessage?: string;
  responseData?: Record<string, unknown>;
}

export interface WriteBatchResult {
  rowResults: WriteBatchRowResult[];
  successCount: number;
  failureCount: number;
}

export interface SourceConnector {
  type: string;
  checkConnection(config: Record<string, unknown>): Promise<ConnectionCheckResult>;
  discover(config: Record<string, unknown>): Promise<{ fields: FieldDescriptor[] }>;
  previewRows(config: Record<string, unknown>, limit?: number): Promise<{ fields: string[]; rows: Array<Record<string, unknown>>; totalRows: number }>;
  readBatch(config: Record<string, unknown>, options: {
    batchSize: number;
    cursor?: string | null;
    fullRefresh?: boolean;
  }): Promise<ReadBatchResult>;
  readRowById?(config: Record<string, unknown>, primaryKey: string, primaryKeyValue: string): Promise<Record<string, unknown> | null>;
}

export interface DestinationConnector {
  type: string;
  maxRequestsPerSecond?: number;
  checkConnection(credentials: Record<string, unknown>): Promise<ConnectionCheckResult>;
  discover(credentials: Record<string, unknown>): Promise<{ objects: ObjectDescriptor[]; fields: Record<string, FieldDescriptor[]> }>;
  writeBatch(credentials: Record<string, unknown>, objectType: string, records: Array<Record<string, unknown>>): Promise<WriteBatchResult>;
}
