import { Link } from "wouter";
import { ArrowRight, Terminal, Cpu, Shield, Workflow, Layers, Zap, Share2 } from "lucide-react";
import { m } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans selection:bg-[#4B8BDB]/30">
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#080c14]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#4B8BDB] to-blue-600 text-white shadow-lg shadow-[#4B8BDB]/20">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            Alloy Platform
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-md hover:bg-slate-200 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4B8BDB]/10 border border-[#4B8BDB]/20 text-[#4B8BDB] text-xs font-semibold uppercase tracking-wider mb-8">
              <Zap size={14} /> The Intelligence Fabric
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
              Command your company's <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
                compound intelligence.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Alloy is the high-performance operational core for modern enterprises. Chat with data, orchestrate autonomous agents, and build complex workflows without writing code.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/sign-up" className="inline-flex items-center gap-2 bg-[#4B8BDB] hover:bg-[#3A7AC9] text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-[#4B8BDB]/20">
                Start Building <ArrowRight size={18} />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg font-medium transition-all">
                Explore Platform
              </a>
            </div>
          </m.div>
        </section>

        {/* App Preview Graphic */}
        <section className="max-w-6xl mx-auto px-6 mb-32">
          <m.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-xl border border-white/10 bg-[#0d121c] shadow-2xl overflow-hidden"
          >
            <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-[#0a0e17]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
            </div>
            <div className="aspect-[16/9] bg-gradient-to-br from-[#0d121c] to-[#080c14] relative overflow-hidden flex items-center justify-center">
              {/* Abstract code/node visualization */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4B8BDB 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
              <div className="relative z-10 text-slate-500 font-mono text-sm">
                System online. Agents active. Workflows executing.
              </div>
            </div>
          </m.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Engineered for operators.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to automate your most complex business processes, packaged in a beautifully dense interface.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Terminal className="text-[#4B8BDB]" />}
              title="Copilot Chat"
              desc="Interact with your enterprise data natively. Attach files, analyze tables, and execute tasks via conversational interface."
            />
            <FeatureCard 
              icon={<Cpu className="text-[#4B8BDB]" />}
              title="Agent Studio"
              desc="Build, configure, and deploy specialized AI agents. Give them tools, set boundaries, and watch them work."
            />
            <FeatureCard 
              icon={<Workflow className="text-[#4B8BDB]" />}
              title="Workflow Builder"
              desc="Visual canvas for chaining agents, logic, and API calls into durable execution graphs."
            />
            <FeatureCard 
              icon={<Layers className="text-[#4B8BDB]" />}
              title="Multimodal Analysis"
              desc="Upload massive datasets, documents, and images for deep, cross-format intelligence extraction."
            />
            <FeatureCard 
              icon={<Shield className="text-[#4B8BDB]" />}
              title="Governance & Audit"
              desc="Enterprise-grade policy enforcement, human-in-the-loop approvals, and comprehensive audit logs."
            />
            <FeatureCard 
              icon={<Share2 className="text-[#4B8BDB]" />}
              title="Connector Hub"
              desc="Integrate instantly with Slack, GitHub, Salesforce, Notion, and dozens of other enterprise tools."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-[#0a0e17] py-12 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} SZL Holdings. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-xl hover:bg-white/[0.04] hover:border-white/10 transition-all group">
      <div className="h-12 w-12 rounded-lg bg-[#4B8BDB]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
