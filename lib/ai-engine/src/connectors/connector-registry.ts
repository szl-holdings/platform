import type { ConnectorAdapter, ConnectorHealthStatus } from './connector-interface.js';

class ConnectorRegistry {
  private connectors = new Map<string, ConnectorAdapter>();
  private healthCache = new Map<string, { status: ConnectorHealthStatus; cachedAt: number }>();
  private HEALTH_CACHE_TTL_MS = 60000;

  register(adapter: ConnectorAdapter): void {
    this.connectors.set(adapter.connectorId, adapter);
  }

  get(connectorId: string): ConnectorAdapter | null {
    return this.connectors.get(connectorId) ?? null;
  }

  getAll(): ConnectorAdapter[] {
    return Array.from(this.connectors.values());
  }

  getByCategory(category: string): ConnectorAdapter[] {
    return this.getAll().filter((c) => c.category === category);
  }

  getConfigured(): ConnectorAdapter[] {
    return this.getAll().filter((c) => c.isConfigured());
  }

  async checkHealth(connectorId: string): Promise<ConnectorHealthStatus> {
    const cached = this.healthCache.get(connectorId);
    if (cached && Date.now() - cached.cachedAt < this.HEALTH_CACHE_TTL_MS) {
      return cached.status;
    }

    const adapter = this.get(connectorId);
    if (!adapter) {
      return {
        healthy: false,
        lastChecked: new Date().toISOString(),
        error: 'Connector not found',
      };
    }

    const status = await adapter.healthCheck();
    this.healthCache.set(connectorId, { status, cachedAt: Date.now() });
    return status;
  }

  async checkAllHealth(): Promise<Record<string, ConnectorHealthStatus>> {
    const results: Record<string, ConnectorHealthStatus> = {};
    await Promise.all(
      this.getAll().map(async (connector) => {
        results[connector.connectorId] = await this.checkHealth(connector.connectorId);
      }),
    );
    return results;
  }

  async execute(connectorId: string, toolName: string, input: unknown): Promise<unknown> {
    const adapter = this.get(connectorId);
    if (!adapter) throw new Error(`Connector not found: ${connectorId}`);
    if (!adapter.isConfigured())
      throw new Error(`Connector ${connectorId} is not configured (missing API keys)`);
    return adapter.execute(toolName, input);
  }

  getSummary(): Array<{
    connectorId: string;
    displayName: string;
    category: string;
    vendor: string;
    configured: boolean;
    toolCount: number;
    tools: string[];
  }> {
    return this.getAll().map((c) => ({
      connectorId: c.connectorId,
      displayName: c.displayName,
      category: c.category,
      vendor: c.vendor,
      configured: c.isConfigured(),
      toolCount: c.tools.length,
      tools: c.tools.map((t) => t.name),
    }));
  }
}

export const connectorRegistry = new ConnectorRegistry();
