import { ElevenLabsConnectorAdapter } from './adapters/elevenlabs-adapter.js';
import { GroqConnectorAdapter } from './adapters/groq-adapter.js';
import { HoneyHiveConnectorAdapter } from './adapters/honeyhive-adapter.js';
import { HuggingFaceConnectorAdapter } from './adapters/huggingface-adapter.js';
import { JiraConnectorAdapter } from './adapters/jira-adapter.js';
import { PagerDutyConnectorAdapter } from './adapters/pagerduty-adapter.js';
import { SalesforceConnectorAdapter } from './adapters/salesforce-adapter.js';
import { SlackConnectorAdapter } from './adapters/slack-adapter.js';
import { connectorRegistry } from './connector-registry.js';

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

  const _configured = connectorRegistry.getConfigured().map((c) => c.displayName);
}

export type {
  ConnectorAdapter,
  ConnectorAuthConfig,
  ConnectorHealthStatus,
  ConnectorToolDefinition,
} from './connector-interface.js';
export { ConnectorError } from './connector-interface.js';
export { connectorRegistry } from './connector-registry.js';
