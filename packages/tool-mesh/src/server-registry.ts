import { globalCollector } from '@workspace/cognitive-observability';

export type ServerConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface McpServerEntry {
  serverId: string;
  name: string;
  description: string;
  capabilitiesSummary: string;
  endpoint: string;
  status: ServerConnectionStatus;
  connectedAt?: number;
  disconnectedAt?: number;
  error?: string;
}

export interface ServerSearchResult {
  serverId: string;
  name: string;
  description: string;
  capabilitiesSummary: string;
  status: ServerConnectionStatus;
}

export interface ServerRegistryOptions {
  onConnect?: (entry: McpServerEntry) => Promise<void>;
  onDisconnect?: (entry: McpServerEntry) => Promise<void>;
}

export class McpServerRegistry {
  private readonly servers = new Map<string, McpServerEntry>();
  private readonly options: ServerRegistryOptions;

  constructor(options: ServerRegistryOptions = {}) {
    this.options = options;
  }

  register(
    entry: Omit<McpServerEntry, 'status' | 'connectedAt' | 'disconnectedAt' | 'error'>,
  ): void {
    this.servers.set(entry.serverId, {
      ...entry,
      status: 'disconnected',
    });
  }

  unregisterServer(serverId: string): boolean {
    return this.servers.delete(serverId);
  }

  getServer(serverId: string): McpServerEntry | undefined {
    return this.servers.get(serverId);
  }

  listServers(): McpServerEntry[] {
    return Array.from(this.servers.values());
  }

  searchServers(query: string, limit = 10): ServerSearchResult[] {
    const queryLower = query.toLowerCase();
    const tokens = queryLower.split(/\s+/).filter(Boolean);

    const scored = Array.from(this.servers.values())
      .map((entry) => {
        const text =
          `${entry.name} ${entry.description} ${entry.capabilitiesSummary}`.toLowerCase();
        const score = tokens.filter((t) => text.includes(t)).length;
        return { entry, score };
      })
      .filter((x) => x.score > 0 || tokens.length === 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ entry }) => ({
      serverId: entry.serverId,
      name: entry.name,
      description: entry.description,
      capabilitiesSummary: entry.capabilitiesSummary,
      status: entry.status,
    }));
  }

  async enableServer(serverId: string): Promise<{ success: boolean; error?: string }> {
    const entry = this.servers.get(serverId);
    if (!entry) {
      return { success: false, error: `Server '${serverId}' not found in registry` };
    }
    if (entry.status === 'connected') {
      return { success: true };
    }

    entry.status = 'connecting';
    const t0 = Date.now();

    try {
      if (this.options.onConnect) {
        await this.options.onConnect(entry);
      }
      entry.status = 'connected';
      entry.connectedAt = Date.now();
      entry.error = undefined;

      globalCollector.recordKnown('latency_ms', Date.now() - t0, {
        phase: 'server_connect',
        serverId,
        success: 'true',
      });

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      entry.status = 'error';
      entry.error = message;

      globalCollector.recordKnown('tool_error_rate', 1, {
        phase: 'server_connect',
        serverId,
        error: message.slice(0, 80),
      });

      return { success: false, error: message };
    }
  }

  async disableServer(serverId: string): Promise<{ success: boolean; error?: string }> {
    const entry = this.servers.get(serverId);
    if (!entry) {
      return { success: false, error: `Server '${serverId}' not found in registry` };
    }
    if (entry.status === 'disconnected') {
      return { success: true };
    }

    const t0 = Date.now();
    try {
      if (this.options.onDisconnect) {
        await this.options.onDisconnect(entry);
      }
      entry.status = 'disconnected';
      entry.disconnectedAt = Date.now();

      globalCollector.recordKnown('latency_ms', Date.now() - t0, {
        phase: 'server_disconnect',
        serverId,
        success: 'true',
      });

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      entry.error = message;

      globalCollector.recordKnown('tool_error_rate', 1, {
        phase: 'server_disconnect',
        serverId,
        error: message.slice(0, 80),
      });

      return { success: false, error: message };
    }
  }

  getConnectedServers(): McpServerEntry[] {
    return Array.from(this.servers.values()).filter((s) => s.status === 'connected');
  }
}

export const defaultServerRegistry = new McpServerRegistry();
