import { ContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { NewsletterSubscribe } from '@szl-holdings/shared-ui/newsletter-subscribe';
import { cn } from '@szl-holdings/shared-ui/utils';
import { AtelierSpaceEmbed } from '../components/AtelierSpaceEmbed';
import { CounselGovernancePanels } from '../components/GovernancePanels';
import {
  AlertTriangle,
  Anchor,
  ArrowRight,
  Briefcase,
  ChevronRight,
  Clock,
  FileText,
  Gavel,
  Network,
  Scale,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Operations', href: '#operations' },
  { label: 'Doctrine', href: '#doctrine' },
  { label: 'Outcomes', href: '#outcomes' },
];

const PILLARS = [
  {
    icon: Briefcase,
    code: 'MTR.01',
    title: 'Matter Command',
    body: 'Every active matter on one surface — phase, exposure, owner, and the next decision the GC actually has to make this week.',
  },
  {
    icon: Clock,
    code: 'OBL.02',
    title: 'Obligation Timeline',
    body: 'Contractual and regulatory deadlines mapped against ownership, dependencies, and the real consequence of missing them.',
  },
  {
    icon: Network,
    code: 'DEP.03',
    title: 'Dependency Graph',
    body: 'Cross-matter dependencies — counterparties, contracts, obligations that move together — rendered as a graph, not a spreadsheet.',
  },
  {
    icon: AlertTriangle,
    code: 'EXP.04',
    title: 'Risk Exposure Desk',
    body: 'Quantified legal exposure per matter and per business unit. Dollarized, attributable, and tied to a decision owner.',
  },
  {
    icon: FileText,
    code: 'DOC.05',
    title: 'Document Review',
    body: 'Policy-gated AI review for diligence, contracts, and discovery. Every redline carries a model trace and a human approval.',
  },
  {
    icon: ShieldCheck,
    code: 'CHN.06',
    title: 'Proof Chain',
    body: 'Privilege-aware audit chain from intake through filing. Every assertion attestable to the people who must answer for it.',
  },
];

const SIGNAL_FEED = [
  { code: 'EXP-01', label: 'Project Halcyon · counter-warranty draft due in 4 days · $3.2M exposure', t: '00:01', tone: 'critical' },
  { code: 'OBL',    label: 'Indigo IP injunction filing · GC sign-off requested', t: '00:03', tone: 'high' },
  { code: 'NEG',    label: 'Aurora supply contract · counter-redline ready · 48h SLA', t: '00:07', tone: 'med' },
  { code: 'PRV',    label: 'Privilege boundary enforced · 12 documents quarantined', t: '00:11', tone: 'med' },
  { code: 'CLR',    label: 'Meridian mediation packet sealed · evidence chain verified', t: '00:14', tone: 'ok' },
];

const TONE_DOT: Record<string, string> = {
  critical: '#b85450',
  high: '#d4a853',
  med: '#c9b787',
  ok: '#5a8a6e',
};

const PROOF_STAGES = [
  { code: '01', label: 'Signal' },
  { code: '02', label: 'Context' },
  { code: '03', label: 'Recommendation' },
  { code: '04', label: 'Simulation' },
  { code: '05', label: 'Policy' },
  { code: '06', label: 'Execution' },
  { code: '07', label: 'Proof' },
];

const READINESS = [
  { k: 'Matters under command',     v: '26',   sub: 'across 4 business units' },
  { k: 'Obligations in next 30d',   v: '12',   sub: 'with owner + consequence' },
  { k: 'Tracked legal exposure',    v: '$6.4M', sub: 'dollarized, attributable' },
  { k: 'Privilege chain integrity', v: '100%', sub: 'continuously attested' },
];

const PROVENANCE = [
  { k: 'Λ floor',           v: '0.90' },
  { k: 'Moral grounding',   v: '0.95' },
  { k: 'Measurability',     v: '0.95' },
  { k: 'Λ axes',            v: '9 · AND' },
  { k: 'Replays',           v: '5 · byte-identical' },
  { k: 'DOI ledger',        v: '13 entries' },
  { k: 'Ingestion',         v: 'PUBLIC_ONLY' },
];

function useReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (reduce) {
      els.forEach((e) => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function MatterField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let af = 0;
    let t = 0;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      c.width = c.offsetWidth * dpr;
      c.height = c.offsetHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    const nodes = Array.from({ length: 14 }, (_, i) => ({
      x: 0.1 + (i % 5) * 0.2 + (Math.random() - 0.5) * 0.05,
      y: 0.15 + Math.floor(i / 5) * 0.3 + (Math.random() - 0.5) * 0.05,
      p: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      if (document.hidden) {
        af = requestAnimationFrame(draw);
        return;
      }
      t += 0.005;
      const w = c.offsetWidth;
      const h = c.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      // edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = (a.x - b.x) * w;
          const dy = (a.y - b.y) * h;
          const d = Math.hypot(dx, dy);
          if (d < 220) {
            const o = (1 - d / 220) * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.strokeStyle = `rgba(201,183,135,${o})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      // nodes
      for (const n of nodes) {
        const pulse = 0.5 + Math.sin(t * 2 + n.p) * 0.5;
        ctx.beginPath();
        ctx.arc(n.x * w, n.y * h, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,183,135,${0.35 + pulse * 0.45})`;
        ctx.fill();
      }
      af = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(af);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden
    />
  );
}

export default function CounselLandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  useReveal();

  return (
    <div className="min-h-screen text-[#f5f5f5] antialiased" style={{ background: '#0a0a0a' }}>
      <style>{`
        .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .display { font-family: 'Space Grotesk', system-ui, sans-serif; }
        .editorial { font-family: 'Space Grotesk', Georgia, serif; }
        .corner-frame { position: relative; }
        .corner-frame::before, .corner-frame::after,
        .corner-frame > .cf-tl, .corner-frame > .cf-br {
          content: ''; position: absolute; width: 10px; height: 10px;
          border-color: rgba(201,183,135,0.45); border-style: solid; pointer-events: none;
        }
        .corner-frame::before { top: 0; left: 0; border-width: 1px 0 0 1px; }
        .corner-frame::after  { bottom: 0; right: 0; border-width: 0 1px 1px 0; }
        .corner-frame > .cf-tl { top: 0; right: 0; border-width: 1px 1px 0 0; }
        .corner-frame > .cf-br { bottom: 0; left: 0; border-width: 0 0 1px 1px; }
        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
        }
        .ticker-row:hover { background: rgba(201,183,135,0.025); }
        .cream-section { background: #f1ece2; color: #1a1814; }
        .cream-section .rule { background: rgba(26,24,20,0.12); }
        .dropcap::first-letter {
          font-family: 'Space Grotesk', Georgia, serif;
          font-size: 4.2rem; line-height: 0.85; float: left;
          padding: 0.2rem 0.65rem 0 0; font-weight: 300; color: #6b5d3e;
        }
        @keyframes pulseDot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .live-dot { animation: pulseDot 2.2s ease-in-out infinite; }
        .reveal { opacity: 0; transform: translateY(14px); transition: opacity .9s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1); }
        .reveal.in { opacity: 1; transform: translateY(0); }
        .reveal-d1 { transition-delay: .06s; }
        .reveal-d2 { transition-delay: .12s; }
        .reveal-d3 { transition-delay: .18s; }
        .reveal-d4 { transition-delay: .24s; }
        @media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; transition: none; } }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-white/[0.04]" style={{ background: 'rgba(10,10,10,0.78)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 inline-flex items-center justify-center rounded border border-[#c9b787]/40 mono text-[9px] text-[#c9b787]">C</span>
            <span className="text-[13px] font-medium tracking-tight">Counsel</span>
            <span className="mono text-[10px] text-[#555] ml-2">/ legal matter command</span>
          </div>
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-[12px] text-[#888] hover:text-[#c9b787] transition-colors">{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setDemoOpen(true)} className="hidden sm:inline-flex text-[12px] text-[#888] hover:text-[#c9b787] transition-colors px-3 py-1.5">
              Request demo
            </button>
            <Link href="/dashboard">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded bg-[#c9b787] text-[#0a0a0a] hover:bg-[#d6c69a] transition-colors cursor-pointer">
                Open command <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none"><MatterField /></div>
        <div className="absolute top-20 left-6 hidden lg:flex flex-col gap-1 mono text-[10px] text-[#444]">
          <span>JURISDICTION · GLOBAL</span>
          <span>PRIVILEGE · ENFORCED</span>
          <span>POSTURE · ACTIVE</span>
        </div>
        <div className="absolute top-20 right-6 hidden lg:flex flex-col items-end gap-1 mono text-[10px] text-[#444]">
          <span>NODE · COUNSEL-01</span>
          <span>EPOCH · 2026.Q2</span>
          <span className="flex items-center gap-1.5">
            <span className="live-dot inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#5a8a6e', boxShadow: '0 0 6px #5a8a6e' }} />
            LIVE · RT
          </span>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-32 text-center">
          <div className="reveal inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#c9b787]/15 bg-[#c9b787]/[0.04] mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9b787] live-dot" />
            <span className="mono text-[10px] tracking-[0.2em] text-[#c9b787] uppercase">Legal Matter Command · Series A</span>
          </div>

          <h1 className="reveal reveal-d1 display text-[clamp(2.6rem,6vw,5.2rem)] font-light leading-[1.02] tracking-[-0.035em] mb-7">
            Matters, obligations, exposure —<br />
            <span style={{ background: 'linear-gradient(120deg,#f5f5f5 20%,#c9b787 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              under one chain of custody.
            </span>
          </h1>

          <p className="reveal reveal-d2 text-[17px] leading-relaxed text-[#9a9a9a] max-w-xl mx-auto mb-12">
            Counsel is the command surface for general counsel and legal ops. Policy-gated AI review,
            obligation mapping, exposure desk, and proof-chain delivery — one platform, one privilege boundary.
          </p>

          <div className="reveal reveal-d3 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/dashboard">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium rounded-md cursor-pointer bg-[#c9b787] text-[#0a0a0a] hover:bg-[#d6c69a] transition-colors">
                Open matter command <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <button onClick={() => setDemoOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-[#c9b787] border border-[#c9b787]/25 rounded-md hover:bg-[#c9b787]/[0.05] transition-colors">
              Request investor walkthrough
            </button>
          </div>

          <div className="reveal reveal-d4 mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05] rounded-md overflow-hidden max-w-3xl mx-auto">
            {READINESS.map((r) => (
              <div key={r.k} className="px-4 py-5 text-left" style={{ background: '#0a0a0a' }}>
                <p className="display text-[26px] font-light text-[#f5f5f5] tracking-tight">{r.v}</p>
                <p className="text-[11px] text-[#9a9a9a] mt-1.5">{r.k}</p>
                <p className="mono text-[9px] text-[#555] mt-1.5 uppercase tracking-wider">{r.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="border-t border-white/[0.05] px-6 py-28">
        <div className="max-w-6xl mx-auto">
          <div className="reveal flex items-end justify-between mb-14 flex-wrap gap-6">
            <div className="max-w-xl">
              <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">PLATFORM · 06 PILLARS</p>
              <h2 className="display text-[40px] font-light leading-tight tracking-tight">
                The matter management category, retired.
              </h2>
            </div>
            <p className="text-[14px] text-[#888] max-w-sm leading-relaxed">
              Counsel carries every matter through to the obligation it creates, the exposure it represents,
              and the decision that has to land before the next deadline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05]">
            {PILLARS.map((p, i) => (
              <div key={p.code} className={`reveal reveal-d${(i % 4) + 1} relative p-7 group transition-colors hover:bg-[#0e0e0e]`} style={{ background: '#0a0a0a' }}>
                <div className="flex items-center justify-between mb-5">
                  <p.icon className="w-4 h-4 text-[#c9b787]/70 group-hover:text-[#c9b787] transition-colors" />
                  <span className="mono text-[9px] tracking-[0.2em] text-[#555] uppercase">{p.code}</span>
                </div>
                <h3 className="display text-[18px] font-medium text-[#f5f5f5] mb-2.5 tracking-tight">{p.title}</h3>
                <p className="text-[13px] leading-relaxed text-[#888]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPERATIONS */}
      <section id="operations" className="border-t border-white/[0.05] px-6 py-28">
        <div className="max-w-4xl mx-auto">
          <div className="reveal text-center mb-12">
            <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">OPERATIONS · LIVE</p>
            <h2 className="display text-[36px] font-light leading-tight tracking-tight">Every matter becomes a decision.</h2>
            <p className="text-[14px] text-[#888] max-w-md mx-auto mt-4 leading-relaxed">
              The decision stream is the operating record of the practice — every triage, every redline, every
              filing — time-stamped and attestable.
            </p>
          </div>

          <div className="reveal corner-frame rounded-md overflow-hidden" style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="cf-tl" /><span className="cf-br" />
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: '#5a8a6e', boxShadow: '0 0 6px #5a8a6e' }} />
                <span className="mono text-[10px] tracking-[0.2em] uppercase text-[#888]">Decision Stream</span>
              </div>
              <span className="mono text-[10px] text-[#555]">privilege · enforced</span>
            </div>
            {SIGNAL_FEED.map((s) => (
              <div key={s.code + s.t} className="ticker-row flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.025] last:border-b-0 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TONE_DOT[s.tone] }} />
                <span className="mono text-[10px] tracking-wider text-[#666] w-14 shrink-0">{s.code}</span>
                <span className="text-[13px] text-[#c8c8c8] flex-1">{s.label}</span>
                <span className="mono text-[10px] text-[#555] shrink-0">+{s.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF CHAIN */}
      <section className="border-t border-white/[0.05] px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="reveal text-center mb-12">
            <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">PROOF CHAIN · 07 STAGES</p>
            <h2 className="display text-[28px] font-light leading-tight tracking-tight">
              From signal to filing, with provenance at every step.
            </h2>
          </div>
          <div className="reveal grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-white/[0.04]">
            {PROOF_STAGES.map((s) => (
              <div key={s.code} className="px-4 py-6 flex flex-col items-start gap-2" style={{ background: '#0a0a0a' }}>
                <span className="mono text-[9px] text-[#666] tracking-widest">{s.code}</span>
                <span className="text-[13px] text-[#c8c8c8]">{s.label}</span>
                <span className="w-6 h-px bg-[#c9b787]/30" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCTRINE */}
      <section id="doctrine" className="cream-section px-6 py-32 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <p className="reveal mono text-[10px] tracking-[0.2em] uppercase mb-8" style={{ color: '#6b5d3e' }}>
            Doctrine · A note from the founders
          </p>
          <h2 className="reveal reveal-d1 editorial text-[40px] md:text-[52px] font-light leading-[1.08] tracking-[-0.02em] mb-10" style={{ color: '#1a1814' }}>
            A legal department's job is not<br />
            <span style={{ color: '#6b5d3e' }}>to remember. It is to decide.</span>
          </h2>
          <div className="reveal rule h-px w-16 mb-10" />
          <p className="reveal reveal-d2 dropcap editorial text-[17px] leading-[1.7] mb-6" style={{ color: '#1a1814' }}>
            Counsel was built around a simple conviction: that the next decade of in-house legal is not
            won by another matter database, another e-billing module, or another generative redline tool.
            It is won by collapsing the distance between an obligation and a defensible action — and by
            making every action attestable to the people who must answer for it in court, in audit, and in
            the boardroom.
          </p>
          <p className="reveal reveal-d3 editorial text-[17px] leading-[1.7] mb-6" style={{ color: '#1a1814' }}>
            Every Counsel surface — matter command, obligation timeline, dependency graph, exposure desk,
            document review — runs under one orchestration layer with privilege-aware governance. Every
            autonomous action carries a proof packet: what was seen, what was decided, by which model,
            against which policy, and which human approved it.
          </p>
          <p className="reveal reveal-d4 editorial text-[17px] leading-[1.7]" style={{ color: '#1a1814' }}>
            We did not build a tool. We built a chain of custody for legal judgment, and it runs in
            production, today.
          </p>
          <div className="mt-12 flex items-center gap-3">
            <span className="w-8 h-px" style={{ background: '#6b5d3e' }} />
            <span className="mono text-[10px] tracking-[0.2em] uppercase" style={{ color: '#6b5d3e' }}>SZL Holdings · 2026</span>
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section id="outcomes" className="border-t border-white/[0.05] px-6 py-28">
        <div className="max-w-5xl mx-auto">
          <div className="reveal text-center mb-14">
            <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">OUTCOMES · IN PRODUCTION</p>
            <h2 className="display text-[36px] font-light leading-tight tracking-tight">
              Defensible numbers, not vendor claims.
            </h2>
          </div>
          <div className="reveal grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05]">
            {[
              { v: '38%', k: 'Cycle time reduction',  sub: 'matter intake to first decision' },
              { v: '$4.1M', k: 'Exposure neutralised', sub: 'last 4 quarters · attested' },
              { v: '94%',  k: 'Obligation hit rate',   sub: 'across active deadlines' },
              { v: '0',    k: 'Privilege incidents',   sub: 'since deployment' },
            ].map((o) => (
              <div key={o.k} className="p-7" style={{ background: '#0a0a0a' }}>
                <p className="display text-[34px] font-light text-[#c9b787] tracking-tight">{o.v}</p>
                <p className="text-[12px] text-[#c8c8c8] mt-2">{o.k}</p>
                <p className="mono text-[9px] text-[#555] mt-2 uppercase tracking-wider">{o.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROVENANCE — covenant kernel */}
      <section className="border-t border-white/[0.05] px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="reveal flex items-center justify-between mb-8 flex-wrap gap-3">
            <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase">PROVENANCE · COVENANT KERNEL</p>
            <span className="mono text-[10px] text-[#555]">payload · 2026-05-15</span>
          </div>
          <div className="reveal grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-white/[0.04]">
            {PROVENANCE.map((p) => (
              <div key={p.k} className="px-4 py-5" style={{ background: '#0a0a0a' }}>
                <p className="mono text-[10px] text-[#666] uppercase tracking-wider">{p.k}</p>
                <p className="display text-[15px] font-light text-[#c9b787] mt-2 tracking-tight">{p.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.05] px-6 py-32 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="reveal mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-6">SCHEDULE</p>
          <h2 className="reveal reveal-d1 display text-[40px] font-light leading-tight tracking-tight mb-6">
            See the command surface.
          </h2>
          <p className="reveal reveal-d2 text-[15px] text-[#888] mb-10 leading-relaxed">
            A 30-minute walkthrough with the operators who built Counsel. We will run a live triage against
            your matters and show you the proof packet behind every decision.
          </p>
          <div className="reveal reveal-d3 flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => setDemoOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-md bg-[#c9b787] text-[#0a0a0a] hover:bg-[#d6c69a] transition-colors">
              Schedule walkthrough <ChevronRight className="w-4 h-4" />
            </button>
            <Link href="/dashboard">
              <span className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium text-[#c8c8c8] border border-white/[0.08] rounded-md hover:border-[#c9b787]/30 hover:text-[#c9b787] transition-colors cursor-pointer">
                Open command
              </span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.04] px-6 py-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <Scale className="w-3.5 h-3.5 text-[#c9b787]/60" />
            <span className="text-[12px] text-[#888]">Counsel</span>
            <span className="mono text-[10px] text-[#555]">/ by SZL Holdings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gavel className="w-3 h-3 text-[#c9b787]/40" />
            <span className="mono text-[10px] text-[#555] tracking-wider uppercase">Privilege-aware · A11oy-orchestrated</span>
          </div>
        </div>
      </footer>

      <CounselGovernancePanels />

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="counsel"
        subtitle="Counsel · Legal Matter Command"
      />
    </div>
  );
}
