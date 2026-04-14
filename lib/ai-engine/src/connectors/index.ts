import { connectorRegistry } from "./connector-registry.js";
import { JiraConnectorAdapter } from "./adapters/jira-adapter.js";
import { SlackConnectorAdapter } from "./adapters/slack-adapter.js";
import { PagerDutyConnectorAdapter } from "./adapters/pagerduty-adapter.js";
import { GroqConnectorAdapter } from "./adapters/groq-adapter.js";
import { ElevenLabsConnectorAdapter } from "./adapters/elevenlabs-adapter.js";
import { HuggingFaceConnectorAdapter } from "./adapters/huggingface-adapter.js";
import { HoneyHiveConnectorAdapter } from "./adapters/honeyhive-adapter.js";
import { SalesforceConnectorAdapter } from "./adapters/salesforce-adapter.js";

let initialized = false;

export function initializeConnectors(): void {
  if (initialized) return;
  initialized = true;

  connectorRegistry.register(new JiraConnectorAdapter());
  connectorRegistry.register(new SlackConnectorAdapter());
  connectorRegistry.register(new PagerDutyConnectorAdapter());
  connectorRegistry.register(new GroqConnectorAdapter());
  connectorRegistry.register(new ElevenLabsConnectorAdapter());
  connectorRegistry.register(new HuggingFaceConnectorAdapter());
  connectorRegistry.register(new HoneyHiveConnectorAdapter());
  connectorRegistry.register(new SalesforceConnectorAdapter());

  const configured = connectorRegistry.getConfigured().map(c => c.displayName);
  console.log(`[connectors] Initialized ${connectorRegistry.getAll().length} connectors. Configured: ${configured.join(", ") || "none (API keys needed)"}`);
}

export { connectorRegistry } from "./connector-registry.js";
export type { ConnectorAdapter, ConnectorAuthConfig, ConnectorHealthStatus, ConnectorToolDefinition } from "./connector-interface.js";
export { ConnectorError } from "./connector-interface.js";
