import { Link } from "wouter";
import { ArrowRight, Key, Webhook, Code2, Shield, Zap, Globe, BookMarked } from "lucide-react";

export default function GettingStarted() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2 mb-2"><BookMarked className="w-5 h-5 text-primary" />Welcome to the SZL Holdings API</h1>
        <p className="text-muted-foreground">Build powerful integrations with our security, analytics, maritime, AI, and infrastructure APIs.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          { icon: Key, title: "1. Get Your API Key", desc: "Generate scoped API keys for authentication", href: "/developer/api-keys", color: "text-primary" },
          { icon: Code2, title: "2. Explore the API", desc: "Interactive documentation with live request sandbox", href: "/developer/api-explorer", color: "text-blue-400" },
          { icon: Webhook, title: "3. Set Up Webhooks", desc: "Real-time event notifications for your app", href: "/developer/webhooks", color: "text-emerald-400" },
          { icon: Zap, title: "4. Install the SDK", desc: "Type-safe TypeScript client with retry logic", href: "/developer/sdk-guide", color: "text-amber-400" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="p-5 bg-card rounded-xl border border-border hover:border-primary/30 transition-all cursor-pointer group">
              <item.icon className={`w-6 h-6 ${item.color} mb-3`} />
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
              <ArrowRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-base font-display font-semibold mb-4">API Domains</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { icon: Shield, name: "Security", desc: "Firestorm — threat detection, compliance, red team simulations", color: "text-red-400 bg-red-500/10" },
            { icon: Globe, name: "Analytics", desc: "Lyte — decision analytics, metrics, observability", color: "text-blue-400 bg-blue-500/10" },
            { icon: Globe, name: "Maritime", desc: "Vessels — fleet tracking, voyage management, maritime intelligence", color: "text-cyan-400 bg-cyan-500/10" },
            { icon: Zap, name: "AI / ML", desc: "INCA, Dreamscape — predictive AI, intelligence, creative", color: "text-violet-400 bg-violet-500/10" },
            { icon: Globe, name: "Real Estate", desc: "Terra — portfolio intelligence, climate risk, property analytics", color: "text-emerald-400 bg-emerald-500/10" },
            { icon: Globe, name: "Platform", desc: "Auth, CMS, ecosystem health, extensions", color: "text-amber-400 bg-amber-500/10" },
          ].map((domain) => (
            <div key={domain.name} className="p-4 bg-card rounded-xl border border-border">
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${domain.color} mb-3`}>
                <domain.icon className="w-3 h-3" />
                {domain.name}
              </div>
              <p className="text-sm text-muted-foreground">{domain.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-base font-display font-semibold mb-4">Quick Start</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Install the SDK:</p>
            <pre className="bg-muted rounded-lg p-3 text-sm overflow-x-auto"><code className="text-primary">npm install @szl-holdings/sdk</code></pre>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Initialize the client:</p>
            <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto font-mono"><code>{`import { SZLClient } from "@szl-holdings/sdk";

const client = new SZLClient({
  baseUrl: "https://szlholdings.com",
  apiKey: "szl_your_api_key_here",
});

// Check platform health
const health = await client.platform.health();

// Get security threats
const threats = await client.security.getFirestormThreats();

// Access analytics
const metrics = await client.analytics.getLyteMetrics();`}</code></pre>
          </div>
        </div>
      </div>
    </div>
  );
}
