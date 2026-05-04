import type { MCPServerRegistration, MCPCapabilityQuery, MCPCapabilityResult } from './types.js';

export class MCPDiscoveryRegistry {
  private servers = new Map<string, MCPServerRegistration>();

  register(registration: MCPServerRegistration): void {
    this.servers.set(registration.serverId, {
      ...registration,
      registeredAt: new Date().toISOString(),
    });
  }

  unregister(serverId: string): boolean {
    return this.servers.delete(serverId);
  }

  heartbeat(serverId: string): boolean {
    const server = this.servers.get(serverId);
    if (!server) return false;
    server.lastHeartbeat = new Date().toISOString();
    server.healthStatus = 'healthy';
    return true;
  }

  markDegraded(serverId: string, reason?: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.healthStatus = 'degraded';
    }
  }

  queryCapabilities(query: MCPCapabilityQuery): MCPCapabilityResult[] {
    const results: MCPCapabilityResult[] = [];

    for (const server of this.servers.values()) {
      if (server.healthStatus === 'unreachable') continue;

      if (query.preferredTransport && server.transport !== query.preferredTransport) continue;

      const matched = query.requiredCapabilities.filter(c => server.capabilities.includes(c));
      if (matched.length === 0) continue;

      const baseLatency = server.transport === 'stdio' ? 10 : 45;
      const healthMultiplier = server.healthStatus === 'degraded' ? 2.5 : 1;
      const estimatedLatency = Math.round(baseLatency * healthMultiplier);

      if (query.maxLatencyMs && estimatedLatency > query.maxLatencyMs) continue;

      results.push({
        serverId: server.serverId,
        matchedCapabilities: matched,
        availableTools: [...server.tools],
        estimatedLatencyMs: estimatedLatency,
        healthStatus: server.healthStatus,
      });
    }

    return results.sort((a, b) => b.matchedCapabilities.length - a.matchedCapabilities.length);
  }

  discoverToolsForAgent(allowedTools: string[]): MCPCapabilityResult[] {
    const results: MCPCapabilityResult[] = [];

    for (const server of this.servers.values()) {
      if (server.healthStatus === 'unreachable') continue;

      const matchedTools = server.tools.filter(t => allowedTools.includes(t));
      if (matchedTools.length === 0) continue;

      results.push({
        serverId: server.serverId,
        matchedCapabilities: [...server.capabilities],
        availableTools: matchedTools,
        estimatedLatencyMs: server.transport === 'stdio' ? 10 : 45,
        healthStatus: server.healthStatus,
      });
    }

    return results;
  }

  listServers(): MCPServerRegistration[] {
    return Array.from(this.servers.values());
  }

  getServer(serverId: string): MCPServerRegistration | undefined {
    return this.servers.get(serverId);
  }

  healthCheck(): { total: number; healthy: number; degraded: number; unreachable: number } {
    let healthy = 0, degraded = 0, unreachable = 0;
    for (const server of this.servers.values()) {
      if (server.healthStatus === 'healthy') healthy++;
      else if (server.healthStatus === 'degraded') degraded++;
      else unreachable++;
    }
    return { total: this.servers.size, healthy, degraded, unreachable };
  }
}

export const defaultMCPRegistry = new MCPDiscoveryRegistry();

defaultMCPRegistry.register({
  serverId: 'substrate-gateway',
  url: 'http://localhost:3100/mcp',
  transport: 'sse',
  capabilities: ['signal_reading', 'domain_lookup', 'document_access', 'financial_data'],
  tools: ['signal_reader', 'domain_lookup', 'document_reader', 'financial_reader', 'context_pack_builder'],
  healthStatus: 'healthy',
  lastHeartbeat: new Date().toISOString(),
  registeredAt: new Date().toISOString(),
});

defaultMCPRegistry.register({
  serverId: 'perplexity-mcp',
  url: 'http://localhost:3101/mcp',
  transport: 'sse',
  capabilities: ['real_time_search', 'citation_verification', 'web_research'],
  tools: ['signal_reader', 'document_reader'],
  healthStatus: 'healthy',
  lastHeartbeat: new Date().toISOString(),
  registeredAt: new Date().toISOString(),
});

defaultMCPRegistry.register({
  serverId: 'governance-mcp',
  url: 'http://localhost:3102/mcp',
  transport: 'sse',
  capabilities: ['policy_checking', 'covenant_validation', 'proof_ledger', 'sanctions_screening'],
  tools: ['policy_checker', 'covenant_guard', 'proof_ledger_writer', 'sanctions_checker'],
  healthStatus: 'healthy',
  lastHeartbeat: new Date().toISOString(),
  registeredAt: new Date().toISOString(),
});
