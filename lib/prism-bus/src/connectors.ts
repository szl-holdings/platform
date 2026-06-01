import type { PrismDomain } from './context.js';

export type PrismConnectorStatus =
  | 'connected'
  | 'disconnected'
  | 'degraded'
  | 'error'
  | 'unconfigured';

export interface PrismConnectorConfig {
  id: string;
  name: string;
  description?: string;
  type: 'data' | 'ai' | 'messaging' | 'storage' | 'identity' | 'external_api';
  transport: 'http' | 'grpc' | 'ws' | 'mcp' | 'native';
  domains: PrismDomain[];
  requiresAuth: boolean;
  credentials?: Record<string, string>;
  isNative?: boolean;
}

export interface PrismConnectorState {
  id: string;
  status: PrismConnectorStatus;
  lastPingAt?: number;
  latencyMs?: number;
  errorMessage?: string;
  capabilities: string[];
}

export interface PrismToolDescriptor {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, { type: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
  domains: PrismDomain[];
  approvalClass: 'observe_only' | 'propose_only' | 'approval_required' | 'approved_execute';
  connectorId?: string;
  tags?: string[];
}

export interface PrismResourceDescriptor {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  domains: PrismDomain[];
  connectorId?: string;
}

export interface PrismPromptTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  variables: string[];
  domains: PrismDomain[];
  tags?: string[];
}

export class PrismConnectorRegistry {
  private connectors = new Map<string, PrismConnectorConfig>();
  private states = new Map<string, PrismConnectorState>();
  private tools = new Map<string, PrismToolDescriptor>();
  private resources = new Map<string, PrismResourceDescriptor>();
  private prompts = new Map<string, PrismPromptTemplate>();

  registerConnector(
    config: PrismConnectorConfig,
    initialStatus: PrismConnectorStatus = 'disconnected',
  ): void {
    this.connectors.set(config.id, config);
    this.states.set(config.id, {
      id: config.id,
      status: initialStatus,
      capabilities: [],
    });
  }

  updateConnectorState(id: string, state: Partial<PrismConnectorState>): void {
    const existing = this.states.get(id);
    if (existing) {
      this.states.set(id, { ...existing, ...state, id });
    }
  }

  registerTool(tool: PrismToolDescriptor): void {
    this.tools.set(tool.name, tool);
  }

  registerResource(resource: PrismResourceDescriptor): void {
    this.resources.set(resource.uri, resource);
  }

  registerPrompt(prompt: PrismPromptTemplate): void {
    this.prompts.set(prompt.id, prompt);
  }

  getConnector(id: string): PrismConnectorConfig | undefined {
    return this.connectors.get(id);
  }

  getConnectorState(id: string): PrismConnectorState | undefined {
    return this.states.get(id);
  }

  getConnectorsForDomain(domain: PrismDomain): PrismConnectorConfig[] {
    return Array.from(this.connectors.values()).filter(
      (c) => c.domains.includes(domain) || c.domains.length === 0,
    );
  }

  getToolsForDomain(domain: PrismDomain): PrismToolDescriptor[] {
    return Array.from(this.tools.values()).filter(
      (t) => t.domains.includes(domain) || t.domains.includes('global' as PrismDomain),
    );
  }

  getTool(name: string): PrismToolDescriptor | undefined {
    return this.tools.get(name);
  }

  getAllConnectors(): PrismConnectorConfig[] {
    return Array.from(this.connectors.values());
  }

  getAllStates(): PrismConnectorState[] {
    return Array.from(this.states.values());
  }

  getAllTools(): PrismToolDescriptor[] {
    return Array.from(this.tools.values());
  }

  getHealthSummary(): {
    total: number;
    connected: number;
    degraded: number;
    error: number;
    disconnected: number;
  } {
    const states = this.getAllStates();
    return {
      total: states.length,
      connected: states.filter((s) => s.status === 'connected').length,
      degraded: states.filter((s) => s.status === 'degraded').length,
      error: states.filter((s) => s.status === 'error').length,
      disconnected: states.filter((s) => s.status === 'disconnected' || s.status === 'unconfigured')
        .length,
    };
  }
}

export const prismConnectorRegistry = new PrismConnectorRegistry();
