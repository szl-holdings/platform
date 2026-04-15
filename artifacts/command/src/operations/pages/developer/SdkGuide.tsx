import { Package, Terminal, Zap, RefreshCw, Shield, Globe } from "lucide-react";

export default function SdkGuide() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">TypeScript SDK</h1>
        <p className="text-text-secondary">The official <code className="text-accent">@szl-holdings/sdk</code> package provides type-safe access to every API domain with built-in retry logic, error handling, and WebSocket support.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: Zap, title: "Type Safe", desc: "Full TypeScript types for all requests, responses, and errors" },
          { icon: RefreshCw, title: "Auto Retry", desc: "Exponential backoff on 429s and 5xx errors with configurable retries" },
          { icon: Shield, title: "Dual Auth", desc: "API key and Bearer token authentication out of the box" },
        ].map((f) => (
          <div key={f.title} className="p-4 bg-surface rounded-xl border border-border">
            <f.icon className="w-5 h-5 text-accent mb-2" />
            <h3 className="font-medium text-sm mb-1">{f.title}</h3>
            <p className="text-xs text-text-secondary">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Installation</h2>
        <pre><code className="text-accent">npm install @szl-holdings/sdk</code></pre>
        <p className="text-sm text-text-muted">Or if you're working within the SZL Holdings monorepo:</p>
        <pre><code className="text-accent">{`"@szl-holdings/sdk": "workspace:*"`}</code></pre>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Client Initialization</h2>
        <pre><code>{`import { SZLClient } from "@szl-holdings/sdk";

// Using API key authentication
const client = new SZLClient({
  baseUrl: "https://szlholdings.com",
  apiKey: "szl_your_api_key_here",
  timeout: 30000,  // 30s default
  retries: 3,      // retry on 429/5xx
  onError: (error) => {
    console.error(\`API Error: \${error.code} — \${error.message}\`);
  },
});

// Or using Bearer token
const client = new SZLClient({
  baseUrl: "https://szlholdings.com",
  bearerToken: "your_session_token",
});`}</code></pre>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
        <h2 className="text-xl font-semibold">Domain Clients</h2>
        <p className="text-text-secondary text-sm">The SDK organizes endpoints into domain-specific clients:</p>

        {[
          {
            name: "Security",
            icon: Shield,
            color: "text-tag-security",
            code: `// ROSIE threat detection
const threats = await client.security.getAegisThreats();

// Aegis compliance
const compliance = await client.security.getAegisCompliance();

// Firestorm simulations
const scenarios = await client.security.getFirestormScenarios();`,
          },
          {
            name: "Analytics",
            icon: Globe,
            color: "text-tag-analytics",
            code: `// Beacon decision analytics
const metrics = await client.analytics.getBeaconMetrics();
const projects = await client.analytics.getBeaconProjects();

// Lyte observability
const services = await client.analytics.getLyteServices();
const alerts = await client.analytics.getLyteAlerts();`,
          },
          {
            name: "Maritime",
            icon: Globe,
            color: "text-tag-maritime",
            code: `// Vessels fleet management
const fleet = await client.maritime.getFleet();
const voyages = await client.maritime.getVoyages();
const alerts = await client.maritime.getAlerts();`,
          },
          {
            name: "AI / ML",
            icon: Zap,
            color: "text-tag-ai",
            code: `// Alloy signal queue
const signals = await client.alloy.getSignals();

// INCA intelligence
const campaigns = await client.ai.getIncaCampaigns();`,
          },
          {
            name: "Infrastructure",
            icon: Globe,
            color: "text-tag-infrastructure",
            code: `// Zeus topology
const topology = await client.infrastructure.getZeusTopology();

// Alloy workflow templates
const templates = await client.infrastructure.getAlloyWorkflowTemplates();`,
          },
          {
            name: "Developer",
            icon: Package,
            color: "text-tag-developer",
            code: `// Manage API keys
const keys = await client.developer.listApiKeys();
const newKey = await client.developer.createApiKey({
  name: "Production App",
  scopes: ["security", "analytics"],
  permissions: "read",
});

// Manage webhooks
const webhooks = await client.developer.listWebhooks();
await client.developer.createWebhook({
  url: "https://my-app.com/webhook",
  events: ["aegis.threat.detected", "beacon.metric.breached"],
});`,
          },
        ].map((domain) => (
          <div key={domain.name}>
            <h3 className={`font-medium flex items-center gap-2 mb-2 ${domain.color}`}>
              <domain.icon className="w-4 h-4" />
              client.{domain.name.toLowerCase().replace(/ \/ /g, "").replace(/ /g, "")}
            </h3>
            <pre><code>{domain.code}</code></pre>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">WebSocket Streaming</h2>
        <p className="text-text-secondary text-sm">Connect to real-time events using the WebSocket client:</p>
        <pre><code>{`import { SZLWebSocket } from "@szl-holdings/sdk";

const ws = new SZLWebSocket({
  url: "wss://szlholdings.com/ws",
  reconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
});

ws.connect();

// Listen for specific event types
ws.on("cms:content-update", (message) => {
  console.log("Content updated:", message.payload);
});

// Listen for all events
ws.onAny((type, data) => {
  console.log(\`Event: \${type}\`, data);
});

// Send messages
ws.send("subscribe", { channels: ["security", "analytics"] });

// Cleanup
ws.close();`}</code></pre>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Error Handling</h2>
        <pre><code>{`import type { ApiError } from "@szl-holdings/sdk";

try {
  const data = await client.security.getAegisThreats();
} catch (error) {
  const apiError = error as ApiError;
  console.error(\`
    Status: \${apiError.status}
    Code:   \${apiError.code}
    Message:\${apiError.message}
    Request:\${apiError.requestId}
  \`);

  if (apiError.status === 429) {
    // Rate limited — SDK auto-retries, but you can handle manually
  }
  if (apiError.status === 401) {
    // Token expired — refresh and retry
  }
}`}</code></pre>
      </div>
    </div>
  );
}
