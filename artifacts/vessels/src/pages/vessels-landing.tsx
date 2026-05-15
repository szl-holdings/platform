import { ContactModal } from '@szl-holdings/shared-ui/contact-modal';
import {
  Activity,
  Anchor,
  ArrowRight,
  ChevronRight,
  Compass,
  Globe,
  MapPin,
  Radio,
  Shield,
  Ship,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Live ops', href: '#ops' },
  { label: 'Proof', href: '#proof' },
  { label: 'Doctrine', href: '#doctrine' },
];

const PILLARS = [
  { icon: Radio,   code: 'SCN.01', title: 'Sanctions Screening',     body: 'Continuous OFAC, EU, UK, UN screening across vessel, owner, manager, and counterparty — every fixture cleared with attestable provenance.' },
  { icon: Compass, code: 'DRK.02', title: 'Dark-Vessel Detection',   body: 'AIS-gap correlation, RF anomaly scoring, and SAR cueing to surface the vessels behaving as if they do not want to be seen.' },
  { icon: Anchor,  code: 'OWN.03', title: 'Ownership Graph',         body: 'Beneficial-owner traversal across flag, manager, ISM, P&I, and shell layers — the network behind the hull, mapped and queryable.' },
  { icon: Activity,code: 'VOY.04', title: 'Voyage Analytics',        body: 'Per-voyage P&L, ETA forecasts, bunker exposure, and demurrage risk — the economics behind every fixture, refreshed continuously.' },
  { icon: MapPin,  code: 'FLT.05', title: 'Live Fleet Atlas',        body: 'Vessel positions, route lines, port calls, and exception markers in one tactical surface — built for command, not for show.' },
  { icon: Shield,  code: 'GOV.06', title: 'Counsel Governance',      body: 'Charter-party clauses, sanctions exposure, and counterparty risk under Counsel governance. No fixture without provenance.' },
];

const SIGNAL_FEED = [
  { code: 'SAN-01', label: 'Owner match · OFAC SDN list · fixture held',         t: '00:01', tone: 'critical' },
  { code: 'DARK',   label: 'AIS gap 4.2h · MV ACHILLES · STS pattern detected',  t: '00:03', tone: 'high' },
  { code: 'GRAPH',  label: 'Beneficial owner resolved · 6 hops · shell flagged', t: '00:07', tone: 'med' },
  { code: 'VOY',    label: 'Voyage P&L recomputed · bunker spread +$48k',        t: '00:11', tone: 'med' },
  { code: 'CLR',    label: 'Sanctions screen clear · 3 fixtures released',       t: '00:14', tone: 'ok' },
];

const TONE_DOT: Record<string, string> = {
  critical: '#b85450',
  high: '#d4a853',
  med: '#c9b787',
  ok: '#5a8a6e',
};

const READINESS = [
  { k: 'Sanctions clearance',    v: '< 90s',  sub: 'mean per fixture, attested' },
  { k: 'Dark-vessel precision',  v: '94%',    sub: 'vs labelled ground truth' },
  { k: 'Ownership hops resolved',v: '6 deep', sub: 'median per beneficial query' },
  { k: 'Vessels under command',  v: '420+',   sub: 'across 6 corridors' },
];

const PROOF_CHAIN = ['Signal', 'Context', 'Recommendation', 'Simulation', 'Policy', 'Execution', 'Proof'];

const PROVENANCE = [
  'Λ floor 0.90',
  '9 Λ axes (AND)',
  '5 byte-identical replays',
  '13-DOI ledger',
  'PUBLIC_ONLY ingestion',
];

const CAPABILITIES = [
  'Sanctions Screen', 'Dark Vessel Detect', 'Ownership Graph', 'Voyage P&L',
  'Fleet Atlas', 'Exceptions', 'STS Detection',  'AIS Decode',
  'RF Anomaly', 'Counterparty Risk', 'Bunker Optimizer', 'CO₂ Passport',
];

interface VesselRow { imo: string; name: string; state: string; lat: string; lon: string }
const FALLBACK_VESSELS: VesselRow[] = [
  { imo: 'IMO 9876541', name: 'AURORA OCEAN',  state: 'AT SEA',  lat: '01°22′N', lon: '104°44′E' },
  { imo: 'IMO 9543210', name: 'NORTHWIND BAY', state: 'BERTHED', lat: '51°57′N', lon: '004°08′E' },
  { imo: 'IMO 9432198', name: 'STELLA MARIS',  state: 'TRANSIT', lat: '12°31′N', lon: '043°20′E' },
  { imo: 'IMO 9765432', name: 'MV ACHILLES',   state: 'FLAGGED', lat: '26°44′N', lon: '055°12′E' },
];

function GlobeFrame() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let af = 0, t = 0;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    const pings = [{ lat: 0.2, lon: 0.5 }, { lat: -0.4, lon: 0.1 }, { lat: 0.45, lon: -0.3 }, { lat: -0.1, lon: -0.55 }];
    const draw = () => {
      if (document.hidden) { af = requestAnimationFrame(draw); return; }
      t += 0.0035;
      const w = c.offsetWidth, h = c.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2 + 40, R = Math.min(w, h) * 0.34;
      const g = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.4);
      g.addColorStop(0, 'rgba(201,183,135,0.05)'); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(201,183,135,0.22)'; ctx.lineWidth = 0.8; ctx.stroke();
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue;
        const rx = R * Math.sqrt(1 - (i / 4) ** 2);
        ctx.beginPath(); ctx.ellipse(cx, cy + (i / 4) * R, rx, rx * 0.16, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(201,183,135,0.08)'; ctx.setLineDash([2, 4]); ctx.stroke();
      }
      ctx.setLineDash([]);
      for (let i = 0; i < 8; i++) {
        const sx = Math.sin(t + (i / 8) * Math.PI);
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(sx) * R, R, 0, -Math.PI / 2, Math.PI / 2);
        ctx.strokeStyle = `rgba(201,183,135,${0.05 + Math.abs(sx) * 0.08})`;
        ctx.lineWidth = 0.6; ctx.stroke();
      }
      for (const p of pings) {
        const ang = p.lon * Math.PI + t * 0.6, cosA = Math.cos(ang);
        if (cosA < 0) continue;
        const x = cx + Math.sin(ang) * R * Math.cos(p.lat * Math.PI / 2);
        const y = cy + Math.sin(p.lat * Math.PI / 2) * R;
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,183,135,${0.5 + cosA * 0.5})`; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 5 + (Math.sin(t * 4) + 1) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(201,183,135,${0.08 * cosA})`; ctx.lineWidth = 0.8; ctx.stroke();
      }
      af = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(af); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function VesselsLandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [vessels, setVessels] = useState<VesselRow[]>(FALLBACK_VESSELS);
  useScrollReveal();

  useEffect(() => {
    const ctrl = new AbortController();
    const base = import.meta.env.BASE_URL ?? '/';
    const candidates = [`${base}api/manifest`, `${base}manifest.json`];
    (async () => {
      for (const url of candidates) {
        try {
          const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
          if (!r.ok) continue;
          const j = (await r.json()) as { rows?: VesselRow[] };
          if (Array.isArray(j.rows) && j.rows.length) {
            setVessels(j.rows.slice(0, 4));
            return;
          }
        } catch { /* try next */ }
      }
    })();
    return () => ctrl.abort();
  }, []);

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
        @media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; transition: none; } }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-white/[0.04]" style={{ background: 'rgba(10,10,10,0.78)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 inline-flex items-center justify-center rounded border border-[#c9b787]/40 mono text-[9px] text-[#c9b787]">V</span>
            <span className="text-[13px] font-medium tracking-tight">Vessels</span>
            <span className="mono text-[10px] text-[#555] ml-2">/ maritime fleet intelligence</span>
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
            <Link href="/fleet">
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
        <div className="absolute inset-0 pointer-events-none"><GlobeFrame /></div>
        <div className="absolute top-20 left-6 hidden lg:flex flex-col gap-1 mono text-[10px] text-[#444]">
          <span>BASIN · GLOBAL</span><span>FEED · AIS + SAR</span><span>POSTURE · UNDERWAY</span>
        </div>
        <div className="absolute top-20 right-6 hidden lg:flex flex-col items-end gap-1 mono text-[10px] text-[#444]">
          <span>NODE · VESSELS-01</span><span>EPOCH · 2026.Q2</span>
          <span className="flex items-center gap-1.5">
            <span className="live-dot inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#5a8a6e', boxShadow: '0 0 6px #5a8a6e' }} />
            LIVE · RT
          </span>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#c9b787]/15 bg-[#c9b787]/[0.04] mb-10 reveal">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9b787] live-dot" />
            <span className="mono text-[10px] tracking-[0.2em] text-[#c9b787] uppercase">Maritime Fleet Intelligence · Series A</span>
          </div>

          <h1 className="display text-[clamp(2.6rem,6vw,5.2rem)] font-light leading-[1.02] tracking-[-0.035em] mb-7 reveal">
            Maritime fleet intelligence,<br />
            <span style={{ background: 'linear-gradient(120deg,#f5f5f5 20%,#c9b787 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              under one chain of custody.
            </span>
          </h1>

          <p className="text-[17px] leading-relaxed text-[#9a9a9a] max-w-xl mx-auto mb-12 reveal">
            Sanctions screening, dark-vessel detection, ownership graph analysis, and voyage analytics —
            one platform, one ledger, every action attestable from signal to fixture.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap reveal">
            <Link href="/fleet">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium rounded-md cursor-pointer bg-[#c9b787] text-[#0a0a0a] hover:bg-[#d6c69a] transition-colors">
                Open fleet command <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <button onClick={() => setDemoOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-[#c9b787] border border-[#c9b787]/25 rounded-md hover:bg-[#c9b787]/[0.05] transition-colors">
              Request investor walkthrough
            </button>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05] rounded-md overflow-hidden max-w-3xl mx-auto reveal">
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
          <div className="flex items-end justify-between mb-14 flex-wrap gap-6 reveal">
            <div className="max-w-xl">
              <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">PLATFORM · 06 PILLARS</p>
              <h2 className="display text-[40px] font-light leading-tight tracking-tight">
                Four mandates, one operating record.
              </h2>
            </div>
            <p className="text-[14px] text-[#888] max-w-sm leading-relaxed">
              Sanctions, dark-vessel behaviour, ownership graphs, voyage economics — the four mandates of
              modern maritime intelligence, fused into a single command surface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05] reveal">
            {PILLARS.map((p) => (
              <div key={p.code} className="relative p-7 group transition-colors hover:bg-[#0e0e0e]" style={{ background: '#0a0a0a' }}>
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

      {/* OPS — fleet manifest (live) + decision stream */}
      <section id="ops" className="border-t border-white/[0.05] px-6 py-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/[0.05] reveal">
          <div className="p-7 corner-frame" style={{ background: '#0c0c0c' }}>
            <span className="cf-tl" /><span className="cf-br" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: '#5a8a6e', boxShadow: '0 0 6px #5a8a6e' }} />
                <span className="mono text-[10px] tracking-[0.2em] uppercase text-[#888]">Fleet Manifest · Live</span>
              </div>
              <span className="mono text-[10px] text-[#555]">{String(vessels.length).padStart(2, '0')} / 420</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {vessels.slice(0, 4).map((v) => (
                <div key={v.imo} className="grid grid-cols-12 gap-3 items-center py-3.5 ticker-row">
                  <span className="mono text-[10px] text-[#555] col-span-3">{v.imo}</span>
                  <span className="text-[13px] text-[#e8e8e8] col-span-4 truncate">{v.name}</span>
                  <span
                    className="mono text-[9px] tracking-wider col-span-2"
                    style={{ color: v.state === 'FLAGGED' ? '#d4a853' : v.state === 'BERTHED' ? '#5a8a6e' : '#c9b787' }}
                  >
                    {v.state}
                  </span>
                  <span className="mono text-[10px] text-[#666] col-span-3 text-right">{v.lat} · {v.lon}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-7 corner-frame" style={{ background: '#0c0c0c' }}>
            <span className="cf-tl" /><span className="cf-br" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: '#5a8a6e', boxShadow: '0 0 6px #5a8a6e' }} />
                <span className="mono text-[10px] tracking-[0.2em] uppercase text-[#888]">Decision Stream</span>
              </div>
              <span className="mono text-[10px] text-[#555]">global · pri</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {SIGNAL_FEED.map((s) => (
                <div key={s.code + s.t} className="ticker-row flex items-center gap-3 py-3.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TONE_DOT[s.tone] }} />
                  <span className="mono text-[10px] tracking-wider text-[#666] w-14 shrink-0">{s.code}</span>
                  <span className="text-[12.5px] text-[#c8c8c8] flex-1">{s.label}</span>
                  <span className="mono text-[10px] text-[#555] shrink-0">+{s.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROOF CHAIN */}
      <section id="proof" className="border-t border-white/[0.05] px-6 py-24">
        <div className="max-w-5xl mx-auto reveal">
          <div className="text-center mb-10">
            <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">PROOF CHAIN · END-TO-END</p>
            <h2 className="display text-[32px] md:text-[36px] font-light leading-tight tracking-tight">
              Every fixture, end-to-end attestable.
            </h2>
          </div>
          <div className="h-px w-full mb-8" style={{ background: 'linear-gradient(90deg,transparent,#c9b787 50%,transparent)' }} />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-white/[0.05]">
            {PROOF_CHAIN.map((label, i) => (
              <div key={label} className="px-3 py-5 flex flex-col gap-2 items-start" style={{ background: '#0a0a0a' }}>
                <span className="mono text-[9px] text-[#555] tracking-wider">{String(i + 1).padStart(2, '0')}</span>
                <span className="mono text-[11px] text-[#c9b787] tracking-[0.18em] uppercase">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-[#888] mt-8 max-w-2xl">
            Sanctions hit, dark-vessel anomaly, ownership traversal, voyage P&L re-compute — each event flows
            through the same seven-stage proof chain, replayable byte-for-byte against the policy of record.
          </p>
        </div>
      </section>

      {/* DOCTRINE */}
      <section id="doctrine" className="cream-section px-6 py-32 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto reveal">
          <p className="mono text-[10px] tracking-[0.2em] uppercase mb-8" style={{ color: '#6b5d3e' }}>
            Doctrine · A note from the founders
          </p>
          <h2 className="editorial text-[40px] md:text-[52px] font-light leading-[1.08] tracking-[-0.02em] mb-10" style={{ color: '#1a1814' }}>
            A position is not a decision.<br />
            <span style={{ color: '#6b5d3e' }}>An owner is not a counterparty.</span>
          </h2>
          <div className="rule h-px w-16 mb-10" />
          <p className="dropcap editorial text-[17px] leading-[1.7] mb-6" style={{ color: '#1a1814' }}>
            Eighty percent of global trade moves over water, and yet the operators who clear it run the
            world's largest economy on spreadsheets, broker chats, and a sanctions list opened in a tab.
            We built Vessels because a screening hit is not a decision, and a decision is not a defensible
            action until someone can audit it.
          </p>
          <p className="editorial text-[17px] leading-[1.7] mb-6" style={{ color: '#1a1814' }}>
            Every Vessels surface — sanctions screening, dark-vessel detection, ownership graph, voyage
            analytics — runs under one orchestration layer with Counsel-grade governance. Every recommendation
            carries provenance: which signal, which model, which policy, which human approved it.
          </p>
          <p className="editorial text-[17px] leading-[1.7]" style={{ color: '#1a1814' }}>
            We did not build a tracking tool. We built the intelligence layer for an industry that has been
            waiting for one for forty years, and it runs in production, today.
          </p>
          <div className="mt-12 flex items-center gap-3">
            <span className="w-8 h-px" style={{ background: '#6b5d3e' }} />
            <span className="mono text-[10px] tracking-[0.2em] uppercase" style={{ color: '#6b5d3e' }}>SZL Holdings · 2026</span>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="border-t border-white/[0.05] px-6 py-24">
        <div className="max-w-5xl mx-auto reveal">
          <div className="flex items-center justify-between mb-10">
            <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase">CAPABILITIES · 12 PRIMARY</p>
            <span className="mono text-[10px] text-[#555]">+44 SECONDARY</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-px bg-white/[0.04]">
            {CAPABILITIES.map((label, i) => (
              <div key={label} className="px-4 py-5 flex flex-col gap-2 hover:bg-[#0e0e0e] transition-colors group" style={{ background: '#0a0a0a' }}>
                <span className="mono text-[9px] text-[#555] tracking-wider">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[12px] text-[#c8c8c8] group-hover:text-[#c9b787] transition-colors">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="border-t border-white/[0.05] px-6 py-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-3">OUTCOMES · IN PRODUCTION</p>
            <h2 className="display text-[36px] font-light leading-tight tracking-tight">Defensible numbers, not vendor claims.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05]">
            {[
              { v: '< 90s', k: 'Sanctions clearance', sub: 'mean per fixture' },
              { v: '94%',   k: 'Dark-vessel precision', sub: 'vs labelled truth' },
              { v: '6 deep',k: 'Ownership hops', sub: 'median resolved' },
              { v: '$1.2M', k: 'Delay exposure mitigated', sub: 'last quarter' },
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

      {/* CTA */}
      <section className="border-t border-white/[0.05] px-6 py-32 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="mono text-[10px] tracking-[0.2em] text-[#666] uppercase mb-6">SCHEDULE</p>
          <h2 className="display text-[40px] font-light leading-tight tracking-tight mb-6">See the intelligence surface.</h2>
          <p className="text-[15px] text-[#888] mb-10 leading-relaxed">
            A 30-minute walkthrough with the operators who built Vessels. We will run a live sanctions screen
            and a dark-vessel query against your fleet, and show you the proof packet behind every decision.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => setDemoOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-md bg-[#c9b787] text-[#0a0a0a] hover:bg-[#d6c69a] transition-colors">
              Schedule walkthrough <ChevronRight className="w-4 h-4" />
            </button>
            <Link href="/fleet">
              <span className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium text-[#c8c8c8] border border-white/[0.08] rounded-md hover:border-[#c9b787]/30 hover:text-[#c9b787] transition-colors cursor-pointer">
                Open command
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* PROVENANCE rail */}
      <section className="border-t border-white/[0.05] px-6 py-10">
        <div className="max-w-6xl mx-auto flex items-center gap-3 flex-wrap justify-center">
          <span className="mono text-[10px] tracking-[0.2em] uppercase text-[#666] mr-2">PROVENANCE</span>
          {PROVENANCE.map((chip) => (
            <span key={chip} className="mono text-[10px] tracking-wider px-2.5 py-1 rounded-full border border-[#c9b787]/20 text-[#c9b787]" style={{ background: 'rgba(201,183,135,0.03)' }}>
              {chip}
            </span>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/[0.04] px-6 py-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <Ship className="w-3.5 h-3.5 text-[#c9b787]/60" />
            <span className="text-[12px] text-[#888]">Vessels</span>
            <span className="mono text-[10px] text-[#555]">/ by SZL Holdings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-[#c9b787]/40" />
            <span className="mono text-[10px] text-[#555] tracking-wider uppercase">Counsel-governed · A11oy-orchestrated</span>
          </div>
        </div>
      </footer>

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="vessels"
        subtitle="Vessels · Maritime Fleet Intelligence"
      />
    </div>
  );
}
