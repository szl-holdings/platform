import { ContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { cn } from '@szl-holdings/shared-ui/utils';
import { AtelierSpaceEmbed } from '../components/AtelierSpaceEmbed';
import {
  ArrowRight,
  Bot,
  Brain,
  Crosshair,
  Database,
  Eye,
  FileText,
  GitBranch,
  Globe,
  Layers,
  Lock,
  Network,
  RotateCcw,
  Scale,
  Shield,
  ShieldCheck,
  Swords,
  Target,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

const PLATFORM_PILLARS = [
  {
    icon: Shield,
    title: 'SOC Operations',
    desc: 'Agentic SOC, deception grids, forensic timelines, identity threat detection — unified in a single command surface.',
    count: '13 modules',
  },
  {
    icon: Brain,
    title: 'Threat Intelligence',
    desc: 'MITRE ATT&CK mapping, kill chain analysis, adversary profiling, STIX/TAXII feeds, and predictive intelligence.',
    count: '14 modules',
  },
  {
    icon: Workflow,
    title: 'Response & Automation',
    desc: 'SOAR playbooks, XDR workbench, response orchestration, and watchlist-driven automated containment.',
    count: '6 modules',
  },
  {
    icon: Swords,
    title: 'War Room & Exercises',
    desc: 'Citadel war room, purple team operations, scenario library, and chaos engineering drills for live readiness.',
    count: '6 modules',
  },
  {
    icon: Layers,
    title: 'Digital Twin & ATLAS',
    desc: 'Threat twin modeling, worldline correlation, incident replay, and the ATLAS threat mesh runtime.',
    count: '4 modules',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance & Risk',
    desc: 'Zero trust scorecards, audit chain, vulnerability lifecycle, executive risk views, and continuous governance.',
    count: '13 modules',
  },
  {
    icon: Network,
    title: 'Agent Mesh',
    desc: 'Autonomous agent topology, mesh drift detection, containment rules, and connector orchestration.',
    count: '5 modules',
  },
  {
    icon: Globe,
    title: 'Governance & Research',
    desc: 'Enterprise governance, federated learning, intel experiments, trust analytics, and executive reporting.',
    count: '16 modules',
  },
];

const SIGNAL_ITEMS = [
  { time: '2 min ago', text: 'Lateral movement detected in prod-finance-vpc', severity: 'critical' as const },
  { time: '4 min ago', text: 'MFA bypass attempt on CFO identity — session revoked', severity: 'high' as const },
  { time: '8 min ago', text: 'SOAR playbook auto-contained ransomware dropper', severity: 'medium' as const },
  { time: '12 min ago', text: 'Zero trust policy drift resolved across 4 endpoints', severity: 'resolved' as const },
];

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-[#b85450]',
  high: 'bg-[#d4a853]',
  medium: 'bg-[#c9b787]',
  resolved: 'bg-[#5a8a6e]',
};

const CAPABILITIES = [
  { icon: Bot, label: 'Agentic SOC' },
  { icon: Crosshair, label: 'Threat Hunting' },
  { icon: Target, label: 'MITRE ATT&CK' },
  { icon: Lock, label: 'Zero Trust' },
  { icon: Terminal, label: 'XDR Workbench' },
  { icon: RotateCcw, label: 'Incident Replay' },
  { icon: Database, label: 'STIX / TAXII' },
  { icon: Eye, label: 'Deception Grid' },
  { icon: Scale, label: 'Compliance' },
  { icon: FileText, label: 'Audit Chain' },
  { icon: GitBranch, label: 'Attack Paths' },
  { icon: Zap, label: 'Chaos Drills' },
];

export default function SentraLandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen text-[#f5f5f5] overflow-x-hidden antialiased" style={{ background: '#0a0a0a' }}>
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 hero-glow" style={{ width: '800px', height: '800px' }} />
        </div>

        <div className="relative z-10 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(201,183,135,0.15)] bg-[rgba(201,183,135,0.04)] mb-10">
            <div className="w-4 h-4 rounded flex items-center justify-center border border-[rgba(201,183,135,0.3)]" style={{ background: 'rgba(201,183,135,0.08)' }}>
              <span className="font-mono text-[7px] font-bold text-[#c9b787]">A</span>
            </div>
            <span className="text-[11px] tracking-wide text-[#8a8a8a] font-mono">
              Orchestrated by a11oy
            </span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-display font-semibold leading-[1.08] tracking-[-0.03em] mb-6">
            <span className="gradient-text">Cyber resilience,</span>{' '}
            <span className="text-[#555]">unified.</span>
          </h1>

          <p className="text-[17px] leading-relaxed text-[#8a8a8a] max-w-xl mx-auto mb-12">
            Sentra brings SOC operations, threat intelligence, compliance, and incident response into a single
            command surface — 80+ modules powered by the a11oy orchestration layer.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer bg-[#c9b787] text-[#0a0a0a] hover:bg-[#a89868]">
                Open platform
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <button
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#8a8a8a] border border-[rgba(255,255,255,0.08)] rounded-lg hover:bg-[rgba(255,255,255,0.03)] hover:text-[#c9b787] hover:border-[rgba(201,183,135,0.2)] transition-colors"
            >
              Request demo
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 border-t border-[rgba(255,255,255,0.04)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="label-mono mb-4">Platform</p>
            <h2 className="text-3xl font-display font-semibold tracking-tight mb-4">
              <span className="text-[#f5f5f5]">Everything security teams need.</span>
              <br />
              <span className="text-[#555]">Nothing they don't.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[rgba(255,255,255,0.04)] rounded-2xl overflow-hidden">
            {PLATFORM_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="p-7 hover:bg-[rgba(201,183,135,0.02)] transition-colors group"
                style={{ background: '#0a0a0a' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <pillar.icon className="w-5 h-5 text-[#555] group-hover:text-[#c9b787] transition-colors" />
                  <span className="label-mono">
                    {pillar.count}
                  </span>
                </div>
                <h3 className="text-[15px] font-medium text-[#f5f5f5] mb-2">{pillar.title}</h3>
                <p className="text-[13px] leading-relaxed text-[#666]">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 border-t border-[rgba(255,255,255,0.04)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="label-mono mb-4">Live signal</p>
            <h2 className="text-3xl font-display font-semibold tracking-tight text-[#f5f5f5]">
              Every alert becomes a decision.
            </h2>
          </div>

          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.04)] glass-panel">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5a8a6e] animate-pulse" style={{ boxShadow: '0 0 6px rgba(90,138,110,0.5)' }} />
                <span className="text-[11px] font-mono tracking-wider text-[#666] uppercase">
                  Decision Stream
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#444]">us-east-1</span>
            </div>
            <div className="divide-y divide-[rgba(255,255,255,0.03)]">
              {SIGNAL_ITEMS.map((item) => (
                <div key={item.text} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', SEVERITY_DOT[item.severity])} />
                  <span className="text-[13px] text-[#8a8a8a] flex-1">{item.text}</span>
                  <span className="text-[11px] text-[#444] shrink-0 font-mono">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 border-t border-[rgba(255,255,255,0.04)]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="label-mono mb-4">Capabilities</p>
          <h2 className="text-3xl font-display font-semibold tracking-tight text-[#f5f5f5] mb-12">
            Built for the modern SOC.
          </h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.label}
                className="flex flex-col items-center gap-2.5 py-4 px-3 rounded-lg border border-[rgba(255,255,255,0.04)] hover:border-[rgba(201,183,135,0.2)] hover:bg-[rgba(201,183,135,0.02)] transition-all group"
              >
                <cap.icon className="w-4 h-4 text-[#555] group-hover:text-[#c9b787] transition-colors" />
                <span className="text-[11px] text-[#666] group-hover:text-[#8a8a8a] transition-colors">{cap.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 border-t border-[rgba(255,255,255,0.04)]">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] p-8 md:p-12" style={{ background: '#0e0e0e' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[rgba(201,183,135,0.3)]" style={{ background: 'rgba(201,183,135,0.08)' }}>
                <span className="font-mono text-[10px] font-bold text-[#c9b787]">A</span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-[#f5f5f5]">a11oy Orchestration Layer</p>
                <p className="text-[11px] text-[#666]">Powering every Sentra module</p>
              </div>
            </div>

            <p className="text-[14px] leading-relaxed text-[#8a8a8a] mb-8">
              Every module in Sentra is orchestrated by a11oy — the governance-aware AI layer that enforces
              policy boundaries, routes decisions through approval chains, and ensures every autonomous action
              has an auditable provenance trail. a11oy connects Sentra to the broader SZL Holdings ecosystem:
              Counsel for legal matters, Vessels for maritime intelligence, and Terra for asset exposure.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Modules', value: '80+' },
                { label: 'Agents online', value: '12' },
                { label: 'Integrations', value: '24' },
                { label: 'Ecosystems', value: '6' },
              ].map((stat) => (
                <div key={stat.label} className="text-center py-3 rounded-lg border border-[rgba(255,255,255,0.04)]" style={{ background: '#121212' }}>
                  <p className="text-lg font-display font-semibold text-[#c9b787]">{stat.value}</p>
                  <p className="label-mono mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 border-t border-[rgba(255,255,255,0.04)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-400/70 mb-4">
              Live: Cyber Threat Triage Agent
            </p>
            <h2 className="text-3xl font-display font-semibold tracking-tight text-[#f5f5f5] mb-4">
              Governed containment in seconds.
            </h2>
            <p className="text-[15px] text-[#8a8a8a] max-w-xl mx-auto">
              Every triage run carries a proof packet — CVE enrichment, SIEM correlation, and policy
              attestation, all captured before containment executes.
            </p>
          </div>
          <AtelierSpaceEmbed />
        </div>
      </section>

      <section className="px-6 py-24 border-t border-[rgba(255,255,255,0.04)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-display font-semibold tracking-tight text-[#f5f5f5] mb-4">
            Ready to unify your security operations?
          </h2>
          <p className="text-[15px] text-[#8a8a8a] mb-8">
            See how Sentra brings every signal, every decision, and every compliance requirement into one surface.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <span className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer bg-[#c9b787] text-[#0a0a0a] hover:bg-[#a89868]">
                Open platform
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <button
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-[#8a8a8a] border border-[rgba(255,255,255,0.08)] rounded-lg hover:bg-[rgba(255,255,255,0.03)] hover:text-[#c9b787] hover:border-[rgba(201,183,135,0.2)] transition-colors"
            >
              Request demo
            </button>
          </div>
        </div>
      </section>

      <footer className="px-6 py-12 border-t border-[rgba(255,255,255,0.04)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-[#c9b787] opacity-40" />
            <span className="text-[13px] font-medium text-[#666]">Sentra</span>
            <span className="text-[11px] text-[#444] ml-1">by SZL Holdings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded flex items-center justify-center border border-[rgba(201,183,135,0.2)]">
              <span className="font-mono text-[5px] font-bold text-[#c9b787] opacity-50">A</span>
            </div>
            <span className="text-[10px] text-[#444]">Orchestrated by a11oy</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-4 pt-4 border-t border-[rgba(255,255,255,0.03)]">
          <p className="text-[10px] text-[#333] font-mono tracking-wide text-center">
            Provenance: Sentra absorbed Aegis (cyber/defense intelligence) — all former Aegis capabilities now live here.
          </p>
        </div>
      </footer>

      <ContactModal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        title="Request a Sentra Demo"
        subtitle="See how Sentra unifies your security operations."
        product="sentra"
      />
    </div>
  );
}
