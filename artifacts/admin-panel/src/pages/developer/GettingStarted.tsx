import { ArrowRight, Key, Webhook, Code2, Shield, Zap, Globe } from "lucide-react";

interface Props {
  onNavigate: (page: string) => void;
}

export default function GettingStarted({ onNavigate }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome to the SZL Holdings API</h1>
        <p className="text-text-secondary text-lg">Build powerful integrations with our security, analytics, maritime, AI, and infrastructure APIs.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          { icon: Key, title: "1. Get Your API Key", desc: "Generate scoped API keys for authentication", page: "api-keys", color: "text-accent" },
          { icon: Code2, title: "2. Explore the API", desc: "Interactive documentation with live request sandbox", page: "explorer", color: "text-info" },
          { icon: Webhook, title: "3. Set Up Webhooks", desc: "Real-time event notifications for your app", page: "webhooks", color: "text-success" },
          { icon: Zap, title: "4. Install the SDK", desc: "Type-safe TypeScript client with retry logic", page: "sdk", color: "text-warning" },
        ].map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className="p-5 bg-surface rounded-xl border border-border hover:border-border-bright transition-all text-left group"
          >
            <item.icon className={`w-6 h-6 ${item.color} mb-3`} />
            <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">{item.title}</h3>
            <p className="text-sm text-text-secondary">{item.desc}</p>
            <ArrowRight className="w-4 h-4 text-text-muted mt-3 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">API Domains</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { icon: Shield, name: "Security", desc: "ROSIE, Aegis, Firestorm — threat detection, compliance, red team simulations", color: "bg-tag-security/15 text-tag-security", apps: ["ROSIE", "Aegis", "Firestorm"] },
            { icon: Globe, name: "Analytics", desc: "Beacon, Lyte — decision analytics, metrics, observability", color: "bg-tag-analytics/15 text-tag-analytics", apps: ["Beacon", "Lyte"] },
            { icon: Globe, name: "Maritime", desc: "Vessels — fleet tracking, voyage management, maritime intelligence", color: "bg-tag-maritime/15 text-tag-maritime", apps: ["Vessels"] },
            { icon: Zap, name: "AI / ML", desc: "Nimbus, INCA, DreamEra — predictive AI, intelligence, creative", color: "bg-tag-ai/15 text-tag-ai", apps: ["Nimbus", "INCA", "DreamEra"] },
            { icon: Globe, name: "Infrastructure", desc: "Zeus, AlloyScape — topology, workflows, deployment", color: "bg-tag-infrastructure/15 text-tag-infrastructure", apps: ["Zeus", "AlloyScape"] },
            { icon: Globe, name: "Platform", desc: "Auth, CMS, ecosystem health, extensions", color: "bg-tag-platform/15 text-tag-platform", apps: ["Core Platform"] },
          ].map((domain) => (
            <div key={domain.name} className="p-4 bg-surface rounded-xl border border-border">
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${domain.color} mb-3`}>
                <domain.icon className="w-3 h-3" />
                {domain.name}
              </div>
              <p className="text-sm text-text-secondary mb-2">{domain.desc}</p>
              <div className="flex flex-wrap gap-1">
                {domain.apps.map((app) => (
                  <span key={app} className="px-2 py-0.5 bg-surface-elevated rounded text-xs text-text-muted">{app}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary mb-2">Install the SDK:</p>
            <pre><code className="text-accent">npm install @szl-holdings/sdk</code></pre>
          </div>
          <div>
            <p className="text-sm text-text-secondary mb-2">Initialize the client:</p>
            <pre><code>{`import { SZLClient } from "@szl-holdings/sdk";

const client = new SZLClient({
  baseUrl: "https://szlholdings.com",
  apiKey: "szl_your_api_key_here",
});

// Check platform health
const health = await client.platform.health();
console.log(health);

// Get security threats
const threats = await client.security.getRosieThreats();

// Access analytics
const metrics = await client.analytics.getBeaconMetrics();`}</code></pre>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Authentication</h2>
        <p className="text-text-secondary mb-4">The API supports two authentication methods:</p>
        <div className="space-y-3">
          <div className="flex gap-3 p-3 bg-surface-elevated rounded-lg">
            <Key className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">API Key</h4>
              <p className="text-xs text-text-secondary mt-1">Pass your key via the <code className="text-accent">X-API-Key</code> header. Ideal for server-to-server integrations.</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-surface-elevated rounded-lg">
            <Shield className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">Bearer Token</h4>
              <p className="text-xs text-text-secondary mt-1">Use <code className="text-accent">Authorization: Bearer &lt;token&gt;</code> from the login endpoint. Ideal for user-facing apps.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-accent/20 p-6">
        <h2 className="text-xl font-semibold mb-2">Rate Limits</h2>
        <p className="text-text-secondary text-sm mb-3">Default limits apply to all API keys. Custom limits can be set per key.</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">200</p>
            <p className="text-xs text-text-muted">requests/min (global)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">20</p>
            <p className="text-xs text-text-muted">auth attempts/15min</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">60</p>
            <p className="text-xs text-text-muted">write ops/min</p>
          </div>
        </div>
      </div>
    </div>
  );
}
