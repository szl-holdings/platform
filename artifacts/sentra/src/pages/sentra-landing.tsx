import { ContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { PANEL_FACTS, DOI_LEDGER_COUNT } from '@szl-holdings/szl-doctrine';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SentraGovernancePanels } from '../components/GovernancePanels';
import { Link } from 'wouter';

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Operations', href: '#operations' },
  { label: 'Proof Chain', href: '#proof-chain' },
  { label: 'Doctrine', href: '#doctrine' },
  { label: 'Provenance', href: '#provenance' },
];

const PILLARS = [
  {
    code: 'TM.01',
    title: 'Threat Modeling',
    body: 'Adversary, asset, and kill-chain reasoning compiled into a living model. Every hypothesis is named, scored against the 9 Λ axes, and replayable.',
    trace: 'canonical · "threat modeling"',
  },
  {
    code: 'PD.02',
    title: 'Posture Drift Detection',
    body: 'Continuous comparison of declared posture vs. observed posture across endpoints, identities, and policy. Drift is a measurable distance, not a feeling.',
    trace: 'canonical · "posture drift detection"',
  },
  {
    code: 'IR.03',
    title: 'Incident Response',
    body: 'Triage, containment, and recovery executed under named playbooks. Every decision is bound to the operator, the model, and the policy that authorized it.',
    trace: 'canonical · "incident response"',
  },
  {
    code: 'PG.04',
    title: 'Policy-Gated Remediation',
    body: 'No autonomous action ships without a covenant gate: moralGrounding ≥ 0.95, measurabilityHonesty ≥ 0.95, conjunctive Λ floor 0.90 across 9 axes.',
    trace: 'canonical · "policy-gated remediation"',
  },
];

const SIGNAL_FEED = [
  { code: 'TM-Λ', label: 'Threat model rev · 9-axis Λ score 0.94 · accepted', t: '00:01', tone: 'ok' },
  { code: 'DRIFT', label: 'Posture drift · prod-identity · 4 controls reconciled', t: '00:03', tone: 'med' },
  { code: 'IR-01', label: 'Incident contained · lateral movement · operator approved', t: '00:06', tone: 'critical' },
  { code: 'GATE',  label: 'Remediation gated · moralGrounding 0.93 · held for review', t: '00:09', tone: 'high' },
  { code: 'AUDIT', label: 'Replay verified byte-identical · run 4 of 5 · ledger sealed', t: '00:14', tone: 'ok' },
];

const TONE_DOT: Record<string, string> = {
  critical: '#b85450',
  high: '#d4a853',
  med: '#c9b787',
  ok: '#5a8a6e',
};

const PROOF_CHAIN = [
  { n: '01', k: 'SIGNAL', d: 'telemetry, identity, posture' },
  { n: '02', k: 'CONTEXT', d: 'asset graph + threat model' },
  { n: '03', k: 'RECOMMENDATION', d: 'reasoned action candidates' },
  { n: '04', k: 'SIMULATION', d: 'blast-radius rehearsal' },
  { n: '05', k: 'POLICY', d: '9-axis Λ conjunctive gate' },
  { n: '06', k: 'EXECUTION', d: 'operator-bound action' },
  { n: '07', k: 'PROOF', d: 'byte-identical replay + DOI' },
];

const COVENANT = [
  { v: '0.90', k: 'Λ floor', sub: '9 axes · conjunctive AND' },
  { v: '0.95', k: 'moralGrounding floor', sub: 'covenant kernel · V6' },
  { v: '0.95', k: 'measurabilityHonesty floor', sub: 'no unmeasured claim' },
  { v: '5 / 5', k: 'byte-identical replays', sub: 'required per release' },
  { v: String(DOI_LEDGER_COUNT), k: 'DOI ledger entries', sub: 'public · citable' },
  { v: PANEL_FACTS.reposCountText, k: 'repos under audit', sub: 'szl-holdings org' },
  { v: 'PUBLIC_ONLY', k: 'ingestion policy', sub: 'no private corpora' },
  { v: 'V6', k: 'doctrine version', sub: 'replay-root sealed' },
];

function useReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function OrbitalField() {
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
    const orbits = [
      { r: 180, a: 0, s: 0.0014, w: 1.0, o: 0.55 },
      { r: 240, a: 1.2, s: -0.0009, w: 0.6, o: 0.35 },
      { r: 320, a: 0.4, s: 0.0006, w: 0.5, o: 0.22 },
      { r: 400, a: 2.1, s: -0.0004, w: 0.4, o: 0.14 },
    ];
    const draw = () => {
      if (document.hidden) {
        af = requestAnimationFrame(draw);
        return;
      }
      t += 1;
      const w = c.offsetWidth;
      const h = c.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2 + 40;
      for (const o of orbits) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, o.r, o.r * 0.32, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(201,183,135,${o.o * 0.18})`;
        ctx.lineWidth = o.w;
        ctx.setLineDash([2, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        const ang = o.a + t * o.s;
        const px = cx + Math.cos(ang) * o.r;
        const py = cy + Math.sin(ang) * o.r * 0.32;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,183,135,${0.85 * o.o})`;
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

export default function SentraLandingPage() {
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
          font-size: 4.2rem;
          line-height: 0.85;
          float: left;
          padding: 0.2rem 0.65rem 0 0;
          font-weight: 300;
          color: #6b5d3e;
        }
        @keyframes pulseDot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .live-dot { animation: pulseDot 2.2s ease-in-out infinite; }
        .reveal { opacity: 0; transform: translateY(14px); transition: opacity .9s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1); }
        .reveal.in { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1; transform: none; transition: none; }
        }
      `}</style>

      {/* MISSION TOPBAR */}
      <header className="sticky top-0 z-40 border-b border-white/[0.04]" style={{ background: 'rgba(10,10,10,0.78)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 inline-flex items-center justify-center rounded border border-[#c9b787]/40 mono text-[9px] text-[#c9b787]">S</span>
            <span className="text-[13px] font-medium tracking-tight">Sentra</span>
            <span className="mono text-[10px] text-[#555] ml-2">/ cyber resilience command</span>
          </div>
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-[12px] text-[#888] hover:text-[#c9b787] transition-colors">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDemoOpen(true)}
              className="hidden sm:inline-flex text-[12px] text-[#888] hover:text-[#c9b787] transition-colors px-3 py-1.5"
            >
              Request demo
            </button>
            <Link href="/dashboard">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded bg-[#c9b787] text-[#0a0a0a] hover:bg-[#d6c69a] transition-colors cursor-pointer">
                Open platform <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      <a
        href="/rosie/warhacker#lane-5"
        data-testid="warhacker-tile-sentra"
        className="mx-6 md:mx-10 flex items-center justify-between gap-4 flex-wrap px-5 py-3 rounded border border-[#c9b787]/30 bg-gradient-to-r from-[#c9b787]/10 to-transparent text-[#e6e6e6] no-underline"
      >
        <div className="flex items-center gap-3">
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-[#c9b787]">⚑ WARHACKER · LANE 5</span>
          <span className="text-[13px]">
            Sentra Edge Adversary Drill — antivenom catches poisoned input at the tactical edge inside the rosie-uds + sentra-uds bundles.
          </span>
        </div>
        <span className="text-[12px] text-[#888]">open hub →</span>
      </a>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none"><OrbitalField /></div>
        <div className="absolute top-20 left-6 hidden lg:flex flex-col gap-1 mono text-[10px] text-[#444]">
          <span>SECTOR · CYBER RESILIENCE</span>
          <span>INGESTION · PUBLIC_ONLY</span>
          <span>DOCTRINE · V6</span>
        </div>
        <div className="absolute top-20 right-6 hidden lg:flex flex-col items-end gap-1 mono text-[10px] text-[#444]">
          <span>NODE · SENTRA-01</span>
          <span>EPOCH · 2026.Q2</span>
          <span className="flex items-center gap-1.5">
            <span className="live-dot inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#5a8a6e', boxShadow: '0 0 6px #5a8a6e' }} />
            LIVE · RT
          </span>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#c9b787]/15 bg-[#c9b787]/[0.04] mb-10 reveal">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9b787] live-dot" />
            <span className="mono text-[10px] tracking-[0.2em] text-[#c9b787] uppercase">Cyber Resilience Command · Series A</span>
          </div>

          <h1 className="display text-[clamp(2.6rem,6vw,5.2rem)] font-light leading-[1.02] tracking-[-0.035em] mb-7 reveal">
            Threat modeling.<br />
            Posture drift.<br />
            <span style={{ background: 'linear-gradient(120deg,#f5f5f5 20%,#c9b787 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Policy-gated response.
            </span>
          </h1>

          <p className="text-[16px] leading-relaxed text-[#9a9a9a] max-w-xl mx-auto mb-12 reveal">
            Sentra is the cyber resilience command surface: threat modeling, posture drift detection,
            incident response, and policy-gated remediation — every action carries a full audit trail.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap reveal">
            <Link href="/dashboard">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium rounded-md cursor-pointer bg-[#c9b787] text-[#0a0a0a] hover:bg-[#d6c69a] transition-colors">
                Open command surface <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <button
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-[#c9b787] border border-[#c9b787]/25 rounded-md hover:bg-[#c9b787]/[0.05] transition-colors"
            >
              Request investor walkthrough
            </button>
          </div>

          {/* PROVENANCE micro-rail */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05] rounded-md overflow-hidden max-w-3xl mx-auto reveal">
            {COVENANT.slice(0, 4).map((r) => (
              <div key={r.k} className="px-4 py-5 text-left" style={{ background: '#0a0a0a' }}>
                <p className="display text-[22px] font-light text-[#f5f5f5] tracking-tight">{r.v}</p>
                <p className="text-[11px] text-[#c8c8c8] mt-1.5">{r.k}</p>
                <p className="mono text-[9px] text-[#666] mt-1.5 uppercase tracking-wider">{r.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM — 4 pillars from canonical sentence */}
      <section id="platform" className="border-t border-white/[0.05] px-6 py-28">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-14 flex-wrap gap-6 reveal">
            <div className="max-w-xl">
              <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">PLATFORM · 04 PILLARS</p>
              <h2 className="display text-[40px] font-light leading-tight tracking-tight">
                One sentence. Four pillars. One audit trail.
              </h2>
            </div>
            <p className="text-[14px] text-[#888] max-w-sm leading-relaxed">
              Each pillar maps verbatim to the canonical Sentra description. Nothing is added; nothing is hidden.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.05]">
            {PILLARS.map((p) => (
              <div key={p.code} className="reveal relative p-7 transition-colors hover:bg-[#0e0e0e]" style={{ background: '#0a0a0a' }}>
                <div className="flex items-center justify-between mb-5">
                  <span className="mono text-[10px] tracking-[0.2em] text-[#c9b787] uppercase">{p.code}</span>
                  <span className="mono text-[9px] tracking-[0.2em] text-[#555] uppercase">{p.trace}</span>
                </div>
                <h3 className="display text-[20px] font-medium text-[#f5f5f5] mb-3 tracking-tight">{p.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-[#c8c8c8]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPERATIONS — live decision stream */}
      <section id="operations" className="border-t border-white/[0.05] px-6 py-28">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 reveal">
            <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">OPERATIONS · LIVE</p>
            <h2 className="display text-[36px] font-light leading-tight tracking-tight">Every signal becomes an attestable action.</h2>
            <p className="text-[14px] text-[#888] max-w-md mx-auto mt-4 leading-relaxed">
              The decision stream is the operating record of Sentra: model revisions, posture drift,
              incident containment, and gated remediation — each row sealable to the ledger.
            </p>
          </div>

          <div className="reveal corner-frame rounded-md overflow-hidden" style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="cf-tl" /><span className="cf-br" />
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: '#5a8a6e', boxShadow: '0 0 6px #5a8a6e' }} />
                <span className="mono text-[10px] tracking-[0.2em] uppercase text-[#888]">Decision Stream</span>
              </div>
              <span className="mono text-[10px] text-[#555]">covenant · v6</span>
            </div>
            {SIGNAL_FEED.map((s) => (
              <div key={s.code + s.t} className="ticker-row flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.025] last:border-b-0 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TONE_DOT[s.tone] }} />
                <span className="mono text-[10px] tracking-wider text-[#666] w-16 shrink-0">{s.code}</span>
                <span className="text-[13px] text-[#c8c8c8] flex-1">{s.label}</span>
                <span className="mono text-[10px] text-[#555] shrink-0">+{s.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF CHAIN */}
      <section id="proof-chain" className="border-t border-white/[0.05] px-6 py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">PROOF CHAIN · 07 STAGES</p>
            <h2 className="display text-[36px] font-light leading-tight tracking-tight">From signal to byte-identical proof.</h2>
            <p className="text-[14px] text-[#888] max-w-lg mx-auto mt-4 leading-relaxed">
              No autonomous action exits the platform without traversing all seven stages.
              The chain is conjunctive: a single failed gate halts execution.
            </p>
          </div>

          <div className="reveal">
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #c9b787 30%, #c9b787 70%, transparent)' }} />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-px bg-white/[0.04] mt-px">
              {PROOF_CHAIN.map((s, i) => (
                <div key={s.k} className="p-5 flex flex-col gap-2" style={{ background: '#0a0a0a' }}>
                  <div className="flex items-center justify-between">
                    <span className="mono text-[9px] text-[#555] tracking-wider">{s.n}</span>
                    {i < PROOF_CHAIN.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-[#444]" aria-hidden />
                    )}
                  </div>
                  <span className="mono text-[11px] tracking-[0.15em] text-[#c9b787] uppercase">{s.k}</span>
                  <span className="text-[11px] text-[#888] leading-snug">{s.d}</span>
                </div>
              ))}
            </div>
            <div className="h-px w-full mt-px" style={{ background: 'linear-gradient(90deg, transparent, #c9b787 30%, #c9b787 70%, transparent)' }} />
          </div>

          <p className="mono text-[10px] text-[#555] text-center mt-6 tracking-wider uppercase">
            stage 05 · Λ ≥ 0.90 across 9 axes · moralGrounding ≥ 0.95 · measurabilityHonesty ≥ 0.95
          </p>
        </div>
      </section>

      {/* DOCTRINE — cream */}
      <section id="doctrine" className="cream-section px-6 py-32 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto reveal">
          <p className="mono text-[10px] tracking-[0.2em] uppercase mb-8" style={{ color: '#6b5d3e' }}>
            Doctrine V6 · A note from the founders
          </p>
          <h2 className="editorial text-[40px] md:text-[52px] font-light leading-[1.08] tracking-[-0.02em] mb-10" style={{ color: '#1a1814' }}>
            Security teams have plenty of tools.<br />
            <span style={{ color: '#6b5d3e' }}>What they need is a covenant.</span>
          </h2>
          <div className="rule h-px w-16 mb-10" />
          <p className="dropcap editorial text-[17px] leading-[1.7] mb-6" style={{ color: '#1a1814' }}>
            Sentra is built around a single conviction: that the next decade of cyber defense is not
            won by adding another dashboard, another model, or another vendor. It is won by collapsing
            the distance between a signal and a defensible action — and by binding every action to a
            covenant kernel that cannot be quietly waived.
          </p>
          <p className="editorial text-[17px] leading-[1.7] mb-6" style={{ color: '#1a1814' }}>
            Every Sentra surface — threat modeling, posture drift detection, incident response,
            policy-gated remediation — runs against the same kernel: nine Λ axes joined under
            conjunctive AND with floor 0.90, moralGrounding ≥ 0.95, measurabilityHonesty ≥ 0.95.
            A single failing axis halts execution. There is no override path that escapes the ledger.
          </p>
          <p className="editorial text-[17px] leading-[1.7]" style={{ color: '#1a1814' }}>
            We do not ship a release until five byte-identical replays land against the same
            replay-root. The audit trail is not a feature. It is the product.
          </p>
          <div className="mt-12 flex items-center gap-3">
            <span className="w-8 h-px" style={{ background: '#6b5d3e' }} />
            <span className="mono text-[10px] tracking-[0.2em] uppercase" style={{ color: '#6b5d3e' }}>
              SZL Holdings · Lutar, Stephen P. · ORCID 0009-0001-0110-4173
            </span>
          </div>
        </div>
      </section>

      {/* PROVENANCE — covenant kernel rail */}
      <section id="provenance" className="border-t border-white/[0.05] px-6 py-28">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-14 flex-wrap gap-6 reveal">
            <div className="max-w-xl">
              <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">PROVENANCE · COVENANT KERNEL</p>
              <h2 className="display text-[36px] font-light leading-tight tracking-tight">
                The numbers we will be measured against.
              </h2>
            </div>
            <p className="text-[14px] text-[#888] max-w-sm leading-relaxed">
              Drawn directly from Doctrine V6 and the SZL Holdings replay-root. Verifiable against
              the public payload, not the marketing deck.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05]">
            {COVENANT.map((o) => (
              <div key={o.k} className="reveal p-6" style={{ background: '#0a0a0a' }}>
                <p className="display text-[26px] font-light text-[#c9b787] tracking-tight">{o.v}</p>
                <p className="text-[12px] text-[#c8c8c8] mt-2">{o.k}</p>
                <p className="mono text-[9px] text-[#666] mt-2 uppercase tracking-wider">{o.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-between flex-wrap gap-3">
            <span className="mono text-[10px] text-[#555] tracking-wider uppercase">
              replay-root · 1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b
            </span>
            <span className="mono text-[10px] text-[#555] tracking-wider uppercase">
              license · Apache-2.0 · MIT · BSD-3-Clause · CC-BY-4.0
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.05] px-6 py-32 text-center">
        <div className="max-w-2xl mx-auto reveal">
          <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-6">SCHEDULE</p>
          <h2 className="display text-[40px] font-light leading-tight tracking-tight mb-6">
            See the command surface.
          </h2>
          <p className="text-[15px] text-[#888] mb-10 leading-relaxed">
            A 30-minute walkthrough with the operators who built Sentra. We will run a live triage
            against your stack and show you the proof packet behind every gated action.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-md bg-[#c9b787] text-[#0a0a0a] hover:bg-[#d6c69a] transition-colors"
            >
              Schedule walkthrough <ChevronRight className="w-4 h-4" />
            </button>
            <Link href="/dashboard">
              <span className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium text-[#c8c8c8] border border-white/[0.08] rounded-md hover:border-[#c9b787]/30 hover:text-[#c9b787] transition-colors cursor-pointer">
                Open platform
              </span>
            </Link>
          </div>
        </div>
      </section>

      <SentraGovernancePanels />

      {/* FOOTER */}
      <footer className="border-t border-white/[0.04] px-6 py-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 inline-flex items-center justify-center rounded border border-[#c9b787]/40 mono text-[9px] text-[#c9b787]">S</span>
            <span className="text-[12px] text-[#888]">Sentra</span>
            <span className="mono text-[10px] text-[#555]">/ by SZL Holdings · Doctrine V6</span>
          </div>
          <span className="mono text-[10px] text-[#555] tracking-wider uppercase">{PANEL_FACTS.ingestionPolicyText} · {PANEL_FACTS.reposCountText} repos · {DOI_LEDGER_COUNT} DOI</span>
        </div>
      </footer>

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="sentra"
        subtitle="Sentra · Cyber Resilience Command"
      />
    </div>
  );
}
