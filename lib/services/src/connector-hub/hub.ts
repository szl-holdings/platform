import { ElevenLabsConnector } from './connectors/elevenlabs.js';
import { FalAiConnector } from './connectors/fal-ai.js';
import { GroqConnector } from './connectors/groq.js';
import { HoneyhiveConnector } from './connectors/honeyhive.js';
import { HuggingFaceConnector } from './connectors/huggingface.js';
import { JiraConnector } from './connectors/jira.js';
import { PagerDutyConnector } from './connectors/pagerduty.js';
import { SalesforceConnector } from './connectors/salesforce.js';
import { SiemConnector } from './connectors/siem.js';
import { SlackConnector } from './connectors/slack.js';
import type { ToolConnector } from './framework.js';
import type {
  ConnectorHealth,
  ConnectorHubSnapshot,
  ConnectorRegistryEntry,
  ConnectorResult,
} from './types.js';

export class ConnectorHub {
  private readonly connectors = new Map<string, ToolConnector>();

  constructor() {
    this.register(new JiraConnector());
    this.register(new PagerDutyConnector());
    this.register(new SlackConnector());
    this.register(new SalesforceConnector());
    this.register(new SiemConnector());
    this.register(new GroqConnector());
    this.register(new FalAiConnector());
    this.register(new HoneyhiveConnector());
    this.register(new HuggingFaceConnector());
    this.register(new ElevenLabsConnector());
  }

  register(connector: ToolConnector): void {
    this.connectors.set(connector.id, connector);
  }

  getConnector(connectorId: string): ToolConnector | undefined {
    return this.connectors.get(connectorId);
  }

  listConnectors(): ToolConnector[] {
    return [...this.connectors.values()];
  }

  getRegistry(): ConnectorRegistryEntry[] {
    return this.listConnectors().map((c) => c.getRegistryEntry());
  }

  getRegistryEntry(connectorId: string): ConnectorRegistryEntry | undefined {
    return this.connectors.get(connectorId)?.getRegistryEntry();
  }

  discoverCapabilities(query?: {
    category?: string;
    tags?: string[];
    requiresAuth?: boolean;
    connectorId?: string;
  }): Array<ConnectorRegistryEntry & { connectorId: string }> {
    let connectors = this.listConnectors();

    if (query?.connectorId) {
      connectors = connectors.filter((c) => c.id === query.connectorId);
    }

    if (query?.category) {
      connectors = connectors.filter((c) => c.category === query.category);
    }

    return connectors
      .map((c) => {
        let capabilities = c.capabilities;

        if (query?.tags && query.tags.length > 0) {
          capabilities = capabilities.filter((cap) =>
            cap.tags?.some((t) => query.tags?.includes(t)),
          );
        }

        if (query?.requiresAuth !== undefined) {
          capabilities = capabilities.filter((cap) => cap.requiresAuth === query.requiresAuth);
        }

        return {
          ...c.getRegistryEntry(),
          connectorId: c.id,
          capabilities,
        };
      })
      .filter((entry) => entry.capabilities.length > 0);
  }

  async execute(
    connectorId: string,
    capabilityId: string,
    params: Record<string, unknown>,
  ): Promise<ConnectorResult> {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      return {
        success: false,
        connectorId,
        capability: capabilityId,
        data: null,
        error: `Connector '${connectorId}' not found in registry`,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        fromCache: false,
        rateLimited: false,
      };
    }
    return connector.execute(capabilityId, params);
  }

  async healthCheck(connectorId?: string): Promise<ConnectorHealth | ConnectorHealth[]> {
    if (connectorId) {
      const connector = this.connectors.get(connectorId);
      if (!connector) throw new Error(`Connector '${connectorId}' not found`);
      return connector.healthCheck();
    }
    return Promise.all(this.listConnectors().map((c) => c.healthCheck()));
  }

  async getSnapshot(): Promise<ConnectorHubSnapshot> {
    const healths = await Promise.all(this.listConnectors().map((c) => c.healthCheck()));
    const counts = { healthy: 0, degraded: 0, down: 0, unconfigured: 0, disabled: 0 };
    for (const h of healths) {
      counts[h.status] = (counts[h.status] ?? 0) + 1;
    }
    return {
      timestamp: new Date().toISOString(),
      totalConnectors: healths.length,
      ...counts,
      connectors: healths,
    };
  }

  setConnectorEnabled(connectorId: string, enabled: boolean): boolean {
    const connector = this.connectors.get(connectorId);
    if (!connector) return false;
    connector.setEnabled(enabled);
    return true;
  }

  getAgentToolList(): Array<{
    connectorId: string;
    capabilityId: string;
    name: string;
    description: string;
    parameters: unknown;
  }> {
    const tools: Array<{
      connectorId: string;
      capabilityId: string;
      name: string;
      description: string;
      parameters: unknown;
    }> = [];
    for (const connector of this.listConnectors()) {
      for (const cap of connector.capabilities) {
        tools.push({
          connectorId: connector.id,
          capabilityId: cap.id,
          name: `${connector.id}__${cap.id}`,
          description: `[${connector.name}] ${cap.description}`,
          parameters: {
            type: 'object',
            properties: Object.fromEntries(
              cap.parameters.map((p) => [
                p.name,
                { type: p.type, description: p.description, ...(p.enum ? { enum: p.enum } : {}) },
              ]),
            ),
            required: cap.parameters.filter((p) => p.required).map((p) => p.name),
          },
        });
      }
    }
    return tools;
  }
}

export const connectorHub = new ConnectorHub();
