export interface SystemHealth {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'down';
  checks: {
    name: string;
    category: string;
    status: 'healthy' | 'degraded' | 'down';
    latencyMs: number | null;
    details: string;
  }[];
  summary: { total: number; healthy: number; degraded: number; down: number };
}

export interface AdminOverview {
  timestamp: string;
  system: {
    uptime: number;
    nodeVersion: string;
    memoryUsage: { heapUsed: number; heapTotal: number; rss: number };
    platform: string;
  };
  database: { status: string; latency: number; connections: number; maxConnections: number };
  storage: { status: string; usedBytes: number; totalBytes: number };
  counts: {
    apps: number;
    activeApps: number;
    connectors: number;
    liveConnectors: number;
    users: number;
    activeUsers: number;
  };
}

export interface JobStats {
  stats?: { total: number; completed: number; failed: number; running: number; pending: number };
  jobs?: {
    id: string;
    type: string;
    status: string;
    startedAt: string;
    completedAt?: string;
    error?: string;
  }[];
}

export interface SeedValidation {
  overallStatus: string;
  summary: { total: number; passed: number; failed: number; errors: number };
  results: {
    table: string;
    description: string;
    status: string;
    actual: number;
    expected: number;
  }[];
}

export interface ConnectorSummary {
  connectors: { name: string; status: string; category: string; lastSync: string | null }[];
  summary: {
    total: number;
    liveConfigured: number;
    mockedDemoMode: number;
    manualRequired: number;
  };
}

export interface FeedIngestionView {
  feedId: string;
  feedName: string;
  status: string;
  enabled: boolean;
  consecutiveFailures: number;
  avgPollDurationMs: number;
  lastSuccessAt: string | null;
  lastIngestedAt: string | null;
  totalEntitiesCreated: number;
  totalEntitiesMerged: number;
  recentPolls: Array<{
    pollAt: string;
    entitiesCreated: number;
    entitiesMerged: number;
    entitiesUpserted: number;
    relationshipsCreated: number;
  }>;
}

export interface FeedHealth {
  timestamp: string;
  summary: {
    totalFeeds: number;
    healthy: number;
    degraded: number;
    down: number;
    totalEntitiesCreated: number;
    totalEntitiesMerged: number;
  };
  feeds: FeedIngestionView[];
}

export interface RmmHealth {
  overallStatus: string;
  providers: {
    total: number;
    active: number;
    error: number;
    list: Array<{
      id: number;
      name: string;
      provider: string;
      status: string;
      lastSyncAt: string | null;
      deviceCount: number | null;
    }>;
  };
  devices: {
    total: number;
    online: number;
    warning: number;
    critical: number;
    offline: number;
    avgCpu: number;
    avgMemory: number;
    avgDisk: number;
    totalAlerts: number;
  };
  healing: { pendingApprovals: number; stats: Record<string, number> };
}

export interface CacheBusStatus {
  timestamp: string;
  connected: boolean;
  started: boolean;
  channel: string;
  reconnectAttempts: number;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  lastReconnectAttemptAt: string | null;
  nextReconnectAt: string | null;
  lastError: string | null;
}

export type TabKey = 'overview' | 'health' | 'jobs' | 'connectors' | 'seed' | 'feeds' | 'errors' | 'infrastructure';
