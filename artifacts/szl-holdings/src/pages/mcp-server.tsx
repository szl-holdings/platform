import { useState } from "react";
import { m } from "framer-motion";
import {
  Server, Globe, Shield, Zap, Code2, Database, Layers, ArrowRight,
  Terminal, Lock, ChevronRight, Copy, Check, Network, Brain, Cpu,
  GitBranch, ExternalLink, Activity,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
    </button>
  );
}

function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  return (
    <div className="relative rounded-lg bg-[#0a0f1a] border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] font-mono text-white/30 uppercase ml-2">{language}</span>
      </div>
      <CopyButton text={code} />
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-sky-100/80">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const CAPABILITIES = [
  {
    icon: Database,
    title: "Ontology Access",
    desc: "Query the full Alloy ontology — entities, relationships, and properties across all five domains via structured tool calls.",
    accent: "#3b82f6",
  },
  {
    icon: Brain,
    title: "Agent Orchestration",
    desc: "External AI agents delegate sub-tasks to domain-specific Alloy agents (Maritime Intel, Threat Analyst, Deal Scorer) through MCP tool invocations.",
    accent: "#8b5cf6",
  },
  {
    icon: Shield,
    title: "Zero-Trust Context",
    desc: "Every tool call is scoped by JWT claims, role-based access, and data classification labels. No broad access — only what the agent's principal is authorized to see.",
    accent: "#10b981",
  },
  {
    icon: Activity,
    title: "Streaming Signals",
    desc: "Subscribe to real-time event streams — threat alerts, vessel anomalies, deal stage changes, compliance findings — via Server-Sent Events through MCP resources.",
    accent: "#f59e0b",
  },
  {
    icon: Network,
    title: "Cross-Domain Fusion",
    desc: "A single MCP session can traverse all five verticals. Ask about a vessel's beneficial owner, their property holdings, pending litigation, and cyber exposure — in one context window.",
    accent: "#ec4899",
  },
  {
    icon: Layers,
    title: "Prompt Templates",
    desc: "Pre-built prompt templates for common workflows — due diligence, threat briefings, fleet optimization, compliance audits — so any LLM can reason over Alloy data immediately.",
    accent: "#06b6d4",
  },
];

const TOOLS_SPEC = [
  { name: "alloy.ontology.query", desc: "Execute structured queries against the Alloy knowledge graph", params: "domain, entityType, filters, depth" },
  { name: "alloy.agent.invoke", desc: "Delegate a task to a domain-specific Alloy agent", params: "agentId, task, context, responseFormat" },
  { name: "alloy.signal.subscribe", desc: "Subscribe to real-time signal streams with filters", params: "signalTypes[], domains[], severity, format" },
  { name: "alloy.entity.resolve", desc: "Resolve an entity across domains (vessel → owner → property → litigation)", params: "entityId, traverseDepth, includeScores" },
  { name: "alloy.report.generate", desc: "Generate analyst-grade reports from multi-domain data", params: "reportType, entities[], timeRange, classification" },
  { name: "alloy.compliance.check", desc: "Run compliance checks against regulatory frameworks", params: "framework, scope, entities[], depth" },
];

const ARCHITECTURE_LAYERS = [
  { label: "External AI Agents", sublabel: "Claude, GPT, Gemini, Custom LLMs", icon: Brain, color: "#8b5cf6" },
  { label: "MCP Transport Layer", sublabel: "SSE / stdio / WebSocket", icon: Globe, color: "#3b82f6" },
  { label: "Alloy Auth Gateway", sublabel: "JWT + RBAC + Classification", icon: Lock, color: "#10b981" },
  { label: "Tool Router", sublabel: "6 tool endpoints, rate limiting", icon: GitBranch, color: "#f59e0b" },
  { label: "Alloy Ontology Core", sublabel: "5-domain knowledge graph", icon: Database, color: "#ec4899" },
];

const EXAMPLE_QUERY = `import { Client } from "@modelcontextprotocol/sdk/client";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/sse";

const transport = new SSEClientTransport(
  new URL("https://mcp.alloy.szl.dev/sse"),
  { headers: { Authorization: \`Bearer \${ALLOY_API_KEY}\` } }
);

const client = new Client({ name: "my-agent", version: "1.0" });
await client.connect(transport);

// Query vessels with anomaly scores > 80
const result = await client.callTool({
  name: "alloy.ontology.query",
  arguments: {
    domain: "maritime",
    entityType: "vessel",
    filters: { anomalyScore: { $gt: 80 } },
    depth: 2,  // include beneficial owners
  },
});

// Cross-domain entity resolution
const entity = await client.callTool({
  name: "alloy.entity.resolve",
  arguments: {
    entityId: "vessel:imo-9434761",
    traverseDepth: 3,
    includeScores: true,
  },
});
// Returns: vessel → owner → property holdings → active litigation`;

const EXAMPLE_PROMPT = `// Register a prompt template for threat briefings
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "threat-briefing",
      description: "Generate a daily threat briefing across cyber + maritime",
      arguments: [
        { name: "timeRange", description: "e.g. '24h', '7d'", required: true },
        { name: "severity", description: "min severity: low|medium|high|critical" },
      ],
    },
    {
      name: "due-diligence",
      description: "Run cross-domain due diligence on an entity",
      arguments: [
        { name: "entityName", description: "Company or vessel name", required: true },
        { name: "domains", description: "Comma-separated: maritime,realestate,legal,cyber" },
      ],
    },
  ],
}));`;

export default function MCPServerPage() {
  usePageMeta({ title: "Alloy MCP Server — SZL Holdings", description: "Connect any AI agent to the Alloy ontology via Model Context Protocol" });

  return (
    <div className="min-h-screen bg-[#060a12] text-white">
      <SiteNav />

      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-500/8 via-purple-500/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <m.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
            <m.div variants={fadeUp} className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center">
                <Server className="w-5 h-5 text-blue-400" />
              </div>
              <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300 tracking-wide">
                MODEL CONTEXT PROTOCOL
              </div>
            </m.div>
            <m.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
                Alloy MCP Server
              </span>
            </m.h1>
            <m.p variants={fadeUp} className="text-lg md:text-xl text-white/50 max-w-2xl leading-relaxed mb-8">
              Give any AI agent — Claude, GPT, Gemini, or your own — direct access to the Alloy
              ontology across five industries. One protocol, one connection, unlimited intelligence.
            </m.p>
            <m.div variants={fadeUp} className="flex flex-wrap gap-4">
              <a href="#quickstart" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                <Terminal className="w-4 h-4" /> Quick Start
              </a>
              <a href="#tools" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.08] text-white/80 font-medium transition-colors">
                <Code2 className="w-4 h-4" /> View API Reference
              </a>
            </m.div>
          </m.div>
        </div>
      </section>

      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
            <m.div variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Architecture</h2>
              <p className="text-white/40 max-w-xl mx-auto">Five-layer architecture from external agent to ontology core</p>
            </m.div>
            <m.div variants={fadeUp} className="max-w-xl mx-auto space-y-0">
              {ARCHITECTURE_LAYERS.map((layer, i) => (
                <div key={layer.label}>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${layer.color}15`, border: `1px solid ${layer.color}30` }}>
                      <layer.icon className="w-5 h-5" style={{ color: layer.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white/90">{layer.label}</div>
                      <div className="text-xs text-white/35">{layer.sublabel}</div>
                    </div>
                    <div className="text-[10px] font-mono text-white/20 tabular-nums">L{i + 1}</div>
                  </div>
                  {i < ARCHITECTURE_LAYERS.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-px h-4 bg-gradient-to-b from-white/10 to-white/5" />
                    </div>
                  )}
                </div>
              ))}
            </m.div>
          </m.div>
        </div>
      </section>

      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
            <m.div variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Capabilities</h2>
              <p className="text-white/40 max-w-xl mx-auto">Everything an external agent can do through the Alloy MCP interface</p>
            </m.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CAPABILITIES.map((cap) => (
                <m.div key={cap.title} variants={fadeUp} className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all group">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: `${cap.accent}12`, border: `1px solid ${cap.accent}25` }}>
                    <cap.icon className="w-5 h-5" style={{ color: cap.accent }} />
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-white/90">{cap.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{cap.desc}</p>
                </m.div>
              ))}
            </div>
          </m.div>
        </div>
      </section>

      <section id="tools" className="py-20 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
            <m.div variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Tool Specification</h2>
              <p className="text-white/40 max-w-xl mx-auto">Six MCP tools expose the full power of the Alloy platform</p>
            </m.div>
            <m.div variants={fadeUp} className="space-y-3">
              {TOOLS_SPEC.map((tool) => (
                <div key={tool.name} className="flex items-start gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                  <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Cpu className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-blue-300 mb-1">{tool.name}</div>
                    <div className="text-sm text-white/50 mb-2">{tool.desc}</div>
                    <div className="text-xs text-white/25 font-mono">params: {tool.params}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/15 shrink-0 mt-1" />
                </div>
              ))}
            </m.div>
          </m.div>
        </div>
      </section>

      <section id="quickstart" className="py-20 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
            <m.div variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Quick Start</h2>
              <p className="text-white/40 max-w-xl mx-auto">Connect to Alloy in under 10 lines of code</p>
            </m.div>
            <m.div variants={fadeUp} className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">1</div>
                  <span className="text-sm font-medium text-white/70">Connect & Query the Ontology</span>
                </div>
                <CodeBlock code={EXAMPLE_QUERY} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-400">2</div>
                  <span className="text-sm font-medium text-white/70">Register Prompt Templates</span>
                </div>
                <CodeBlock code={EXAMPLE_PROMPT} />
              </div>
            </m.div>
          </m.div>
        </div>
      </section>

      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
            <m.h2 variants={fadeUp} className="text-3xl font-bold mb-4">
              One protocol. Five industries. Unlimited intelligence.
            </m.h2>
            <m.p variants={fadeUp} className="text-white/40 max-w-lg mx-auto mb-8">
              The Alloy MCP Server is the bridge between the world's AI agents and the deepest
              cross-domain intelligence graph ever built.
            </m.p>
            <m.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
              <a href={`${import.meta.env.BASE_URL}docs`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.08] text-white/80 font-medium transition-colors">
                <Code2 className="w-4 h-4" /> Full API Docs <ArrowRight className="w-4 h-4" />
              </a>
              <a href={`${import.meta.env.BASE_URL}contact`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                <Zap className="w-4 h-4" /> Request Access
              </a>
            </m.div>
          </m.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
