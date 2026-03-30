import { ArrowRight, Zap, Network, GitBranch, FileText, CheckCircle } from "lucide-react";
import { cn } from "./lib/utils";

const CAPABILITIES = [
  {
    step: "01",
    name: "Signal Ingestion",
    desc: "Cross-platform data acquisition from operational, financial, and environmental sources. Every data type, one pipeline.",
    color: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400",
  },
  {
    step: "02",
    name: "Workflow Orchestration",
    desc: "Multi-step process sequencing with conditional logic, dependency resolution, and human approval gates at every consequential step.",
    color: "border-violet-500/20 bg-violet-500/5 text-violet-400",
  },
  {
    step: "03",
    name: "Action Routing",
    desc: "Intelligent distribution of tasks, alerts, and recommendations to the right person, system, or workflow queue at the right time.",
    color: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  },
  {
    step: "04",
    name: "Output Generation",
    desc: "Structured reports, narrative intelligence, decision briefs, and automated workflows produced from raw signal — without manual effort.",
    color: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  },
  {
    step: "05",
    name: "Human Approval Gates",
    desc: "Built-in governance checkpoints that keep humans in the loop on high-stakes decisions. Explainable, auditable, and overrideable by design.",
    color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  },
];

const PLATFORMS_POWERED = [
  { name: "Lyte", role: "Business Observability", color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5", href: "/lyte-command-center/" },
  { name: "Vessels", role: "Maritime Command", color: "text-blue-400 border-blue-500/20 bg-blue-500/5", href: "/vessels/" },
  { name: "Carlota Jo", role: "Premium Services", color: "text-amber-400 border-amber-500/20 bg-amber-500/5", href: "/carlota-jo/" },
];

const ARCHITECTURE_LAYERS = [
  { label: "Data Layer", items: ["Operational signals", "Financial data", "Environmental feeds", "Third-party integrations"] },
  { label: "Orchestration Layer", items: ["Workflow engine", "Conditional routing", "Priority queuing", "Dependency resolution"] },
  { label: "Intelligence Layer", items: ["Signal correlation", "Narrative generation", "Anomaly detection", "Action recommendation"] },
  { label: "Governance Layer", items: ["Human approval gates", "Audit trail", "Explainability model", "Override controls"] },
];

export function AlloyLanding() {
  return (
    <div className="min-h-screen bg-[#050914] text-white overflow-x-hidden">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Alloy</span>
          <span className="text-[11px] text-white/30 ml-1">by SZL Holdings</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-white/50 hover:text-white transition-colors">SZL Holdings</a>
          <a href="/alloy/chat" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/15 transition-colors">
            Open Alloy <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <main>
        <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/4 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-[11px] text-cyan-400 font-mono mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Core Systems & Orchestration · SZL Holdings
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 tracking-tight">
              The intelligence layer
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                behind every platform.
              </span>
            </h1>

            <p className="text-lg text-white/50 max-w-2xl mx-auto mb-4 leading-relaxed">
              Alloy is not a product you buy. It is the operating infrastructure that makes every SZL platform credible — shared signal ingestion, workflow orchestration, action routing, output generation, and human approval gates.
            </p>
            <p className="text-sm text-white/30 max-w-xl mx-auto mb-10">
              Lyte, Vessels, and Carlota Jo all run on Alloy.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a href="/alloy/chat" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-[#050914] font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
                Open Alloy Command <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => document.getElementById("architecture")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white/70 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                View Architecture
              </button>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-white/5 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">What Alloy Does</p>
              <h2 className="text-3xl font-bold text-white mb-3">Five core capabilities. One operating layer.</h2>
              <p className="text-white/40 text-sm max-w-xl mx-auto">Every platform in the SZL ecosystem draws on the same five-component infrastructure. Shared development cost. Shared reliability standard. Shared governance model.</p>
            </div>

            <div className="space-y-3">
              {CAPABILITIES.map((cap) => (
                <div key={cap.step} className={cn("rounded-xl p-5 border flex items-start gap-5", cap.color)}>
                  <div className="font-mono text-[10px] uppercase tracking-widest shrink-0 pt-0.5 w-8 opacity-60">{cap.step}</div>
                  <div>
                    <h3 className="font-semibold text-[13px] text-white mb-1.5">{cap.name}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-white/5 px-6 bg-white/[0.01]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">Powered by Alloy</p>
              <h2 className="text-3xl font-bold text-white mb-3">Three platforms. One engine.</h2>
              <p className="text-white/40 text-sm max-w-xl mx-auto">Every SZL platform uses Alloy's orchestration infrastructure. Different command surfaces, same operating standard.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLATFORMS_POWERED.map((p) => (
                <a key={p.name} href={p.href} className={cn("rounded-xl p-6 border hover:opacity-90 transition-opacity block", p.color)}>
                  <h3 className="font-bold text-lg text-white mb-1">{p.name}</h3>
                  <p className="text-xs text-white/50 mb-4">{p.role}</p>
                  <div className="flex items-center gap-1 text-xs font-medium opacity-70">
                    Explore {p.name} <ArrowRight className="w-3 h-3" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="architecture" className="py-20 border-t border-white/5 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">Architecture</p>
              <h2 className="text-3xl font-bold text-white mb-3">Four layers. Zero black boxes.</h2>
              <p className="text-white/40 text-sm max-w-xl mx-auto">Every component of the Alloy architecture is designed to be explainable, auditable, and overrideable. No layer is opaque. Every output carries provenance.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ARCHITECTURE_LAYERS.map((layer, i) => (
                <div key={layer.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="font-mono text-[10px] text-white/30 mb-3 uppercase tracking-widest">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="font-semibold text-sm text-white mb-3">{layer.label}</h3>
                  <ul className="space-y-2">
                    {layer.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[11px] text-white/40">
                        <CheckCircle className="w-3 h-3 text-cyan-400/50 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-white/5 px-6 bg-white/[0.01]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">Why It Matters</p>
              <h2 className="text-3xl font-bold text-white mb-4">The infrastructure advantage.</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              {[
                { metric: "40%", label: "Infrastructure cost reduction", note: "vs standalone platforms" },
                { metric: "5", label: "Capability modules", note: "Shared across all platforms" },
                { metric: "100%", label: "Audit trail coverage", note: "Every action, every decision" },
              ].map((stat) => (
                <div key={stat.metric} className="text-center rounded-xl border border-white/5 bg-white/[0.02] p-5">
                  <p className="text-3xl font-bold text-cyan-400 mb-1">{stat.metric}</p>
                  <p className="text-xs text-white/50 mb-0.5">{stat.label}</p>
                  <p className="text-[10px] text-white/25 font-mono">{stat.note}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-xl mx-auto">
                The next generation of enterprise software will not be built on better dashboards. It will be built on command systems — platforms that see what is happening, understand why it matters, and surface what to do next. Alloy is the infrastructure that makes that possible.
              </p>
              <p className="text-[11px] text-white/25 font-mono">— Stephen Lutar, Founder, SZL Holdings</p>
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-white/5 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-3">Explore the full command system.</h2>
            <p className="text-white/40 text-sm mb-8">Access Alloy's multi-agent command center, knowledge base, and real-time feeds.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a href="/alloy/chat" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-[#050914] font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
                Open Alloy Command <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/" className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white/70 text-sm font-medium hover:bg-white/5 transition-colors">
                SZL Holdings <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Alloy</span>
            <span className="text-[11px] text-white/25">by SZL Holdings</span>
          </div>
          <p className="text-[11px] text-white/25">&copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px] text-white/30">
            <a href="/lyte-command-center/" className="hover:text-white/60 transition-colors">Lyte</a>
            <a href="/vessels/" className="hover:text-white/60 transition-colors">Vessels</a>
            <a href="/carlota-jo/" className="hover:text-white/60 transition-colors">Carlota Jo</a>
            <a href="/" className="hover:text-white/60 transition-colors">SZL Holdings</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
