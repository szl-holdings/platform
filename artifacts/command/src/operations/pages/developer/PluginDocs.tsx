import { Bell, Box, Database, Layers, Puzzle } from 'lucide-react';

export default function PluginDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Plugin System</h1>
        <p className="text-text-secondary">
          Extend the SZL Holdings platform with custom widgets, data sources, and alert rules. The
          plugin architecture provides a defined interface for third-party integrations.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            icon: Box,
            title: 'Widgets',
            desc: "Custom dashboard widgets that render in any app's dashboard",
            color: 'text-info',
          },
          {
            icon: Database,
            title: 'Data Sources',
            desc: 'Add new data feeds and external data integrations',
            color: 'text-success',
          },
          {
            icon: Bell,
            title: 'Alert Rules',
            desc: 'Custom alerting conditions and automated response actions',
            color: 'text-warning',
          },
        ].map((cap) => (
          <div key={cap.title} className="p-4 bg-surface rounded-xl border border-border">
            <cap.icon className={`w-5 h-5 ${cap.color} mb-2`} />
            <h3 className="font-medium text-sm mb-1">{cap.title}</h3>
            <p className="text-xs text-text-secondary">{cap.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Plugin Manifest</h2>
        <p className="text-text-secondary text-sm">
          Every plugin declares a manifest describing its identity and capabilities:
        </p>
        <pre>
          <code>{`import { definePlugin } from "@szl-holdings/sdk/plugins";

const myPlugin = definePlugin({
  manifest: {
    id: "my-org.custom-monitor",
    name: "Custom Monitor",
    version: "1.0.0",
    description: "Custom monitoring dashboard for external services",
    author: "My Organization",
    domains: ["analytics", "infrastructure"],
    capabilities: ["widget", "data-source", "alert-rule"],
  },

  widgets: [
    {
      id: "external-uptime",
      title: "External Service Uptime",
      description: "Real-time uptime monitoring for external APIs",
      component: "ExternalUptimeWidget",
      defaultSize: { width: 4, height: 3 },
      domains: ["analytics", "infrastructure"],
      configSchema: {
        type: "object",
        properties: {
          serviceUrl: { type: "string" },
          checkInterval: { type: "number", default: 60 },
        },
      },
    },
  ],

  dataSources: [
    {
      id: "external-metrics",
      name: "External Metrics Feed",
      description: "Pulls metrics from external monitoring APIs",
      fetchFn: "fetchExternalMetrics",
      refreshInterval: 30000,
      schema: {
        type: "object",
        properties: {
          uptime: { type: "number" },
          latency: { type: "number" },
          errorRate: { type: "number" },
        },
      },
    },
  ],

  alertRules: [
    {
      id: "external-latency-spike",
      name: "External Latency Spike",
      description: "Fires when external service latency exceeds threshold",
      domain: "infrastructure",
      conditions: [
        { field: "latency", operator: "gt", value: 500 },
      ],
      actions: [
        {
          type: "webhook",
          config: { url: "https://your-app.com/alerts" },
        },
        {
          type: "notification",
          config: { channel: "security", severity: "warning" },
        },
      ],
    },
  ],

  async initialize(context) {
    console.log("Plugin initialized with domain:", context.currentDomain);
    // Access the API via context.fetch
    const health = await context.fetch("GET", "/api/health");
    console.log("Platform health:", health);
  },

  async destroy() {
    console.log("Plugin cleaned up");
  },
});`}</code>
        </pre>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Plugin Registry</h2>
        <p className="text-text-secondary text-sm">
          Register and manage plugins using the central registry:
        </p>
        <pre>
          <code>{`import { pluginRegistry } from "@szl-holdings/sdk/plugins";

// Set the plugin context (API access, current domain, etc.)
pluginRegistry.setContext({
  apiBaseUrl: "https://szlholdings.com",
  apiKey: "szl_your_key",
  currentDomain: "analytics",
  fetch: async (method, path, options) => {
    // Your fetch implementation
  },
});

// Register a plugin
await pluginRegistry.register(myPlugin);

// Query registered capabilities
const widgets = pluginRegistry.getWidgets("analytics");
const dataSources = pluginRegistry.getDataSources();
const alertRules = pluginRegistry.getAlertRules("infrastructure");

// List all registered plugins
const allPlugins = pluginRegistry.listPlugins();

// Unregister when done
await pluginRegistry.unregister("my-org.custom-monitor");`}</code>
        </pre>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Plugin Capabilities</h2>

        <div className="space-y-4">
          <div className="p-4 bg-surface-elevated rounded-lg">
            <h3 className="font-medium text-sm flex items-center gap-2 mb-2">
              <Box className="w-4 h-4 text-info" /> Widget Interface
            </h3>
            <pre>
              <code>{`interface WidgetDefinition {
  id: string;              // Unique widget identifier
  title: string;           // Display name
  description: string;     // What the widget shows
  component: string;       // React component name
  defaultSize: {           // Grid units
    width: number;
    height: number;
  };
  configSchema?: object;   // JSON Schema for widget config
  domains: string[];       // Applicable domains ("*" for all)
}`}</code>
            </pre>
          </div>

          <div className="p-4 bg-surface-elevated rounded-lg">
            <h3 className="font-medium text-sm flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-success" /> Data Source Interface
            </h3>
            <pre>
              <code>{`interface DataSourceDefinition {
  id: string;              // Unique data source identifier
  name: string;            // Display name
  description: string;     // What data it provides
  fetchFn: string;         // Function name to call
  refreshInterval?: number;// Auto-refresh in ms
  schema?: object;         // JSON Schema for returned data
}`}</code>
            </pre>
          </div>

          <div className="p-4 bg-surface-elevated rounded-lg">
            <h3 className="font-medium text-sm flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-warning" /> Alert Rule Interface
            </h3>
            <pre>
              <code>{`interface AlertRuleDefinition {
  id: string;              // Unique alert rule identifier
  name: string;            // Rule display name
  description: string;     // What it monitors
  domain: string;          // Target domain ("*" for all)
  conditions: [{           // Conditions to trigger
    field: string;
    operator: "gt" | "lt" | "eq" | "neq" | "contains" | "regex";
    value: string | number | boolean;
  }];
  actions: [{              // Actions to take
    type: "webhook" | "email" | "notification" | "custom";
    config: Record<string, unknown>;
  }];
}`}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-accent/20 p-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent" />
          Available Domains
        </h2>
        <p className="text-text-secondary text-sm mb-4">
          Plugins can target one or more domains. Use <code className="text-accent">"*"</code> to
          apply to all domains.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            'security',
            'analytics',
            'maritime',
            'finance',
            'ai',
            'platform',
            'infrastructure',
            'observability',
          ].map((domain) => (
            <div key={domain} className="px-3 py-2 bg-surface-elevated rounded-lg text-center">
              <code className="text-xs text-accent font-mono">{domain}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
