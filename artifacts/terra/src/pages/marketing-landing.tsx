import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowRight,
  Building2,
  Activity,
  BarChart3,
  Eye,
  Layers,
  Network,
  Shield,
  TrendingUp,
} from 'lucide-react';

const GOLD = '#b8943c';
const GOLD_LIGHT = '#c9b787';
const OBSIDIAN = '#080b0d';

function GenerativeMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;
    let frame = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < 60; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      });
    }

    const draw = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const alpha = (1 - dist / 200) * 0.08;
            ctx.strokeStyle = `rgba(184, 148, 60, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const pulse = (Math.sin(frame * 0.02 + n.x * 0.01) + 1) / 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.5 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(184, 148, 60, ${0.15 + pulse * 0.15})`;
        ctx.fill();
      }

      const gridSize = 80;
      ctx.strokeStyle = 'rgba(184, 148, 60, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.6 }}
    />
  );
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const CAPABILITIES = [
  {
    icon: Eye,
    title: 'Distress Intelligence',
    desc: 'Pre-foreclosure tracking, lis pendens filings, auction calendars, and tax lien discovery across all five NYC boroughs. AI-scored opportunity ranking.',
  },
  {
    icon: Network,
    title: 'Ownership Resolution',
    desc: 'LLC unmasking and entity resolution to identify beneficial owners. Cross-reference debt maturity, hold duration, and off-market propensity.',
  },
  {
    icon: Activity,
    title: 'Deal Pipeline',
    desc: 'Stage-gated acquisition workflow with probability-weighted values, velocity metrics, and days-in-stage tracking across your entire book.',
  },
  {
    icon: BarChart3,
    title: 'Market Intelligence',
    desc: 'Submarket heat mapping, comparable sales pricing, absorption analytics, and market cycle positioning — updated continuously.',
  },
  {
    icon: Layers,
    title: 'ATLAS Spatial Runtime',
    desc: 'Property digital twins with AVM sync, drift monitoring, submarket pressure overlays, and spatial memory across 36 months of market data.',
  },
  {
    icon: Shield,
    title: 'Governed Intelligence',
    desc: 'Every insight is traceable. Data provenance, confidence scoring, and audit trails — built for institutional-grade decision-making.',
  },
];

export default function TerraMarketingLanding() {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: OBSIDIAN,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center transition-all duration-400 ${scrolled ? 'border-b' : ''}`}
        style={{
          background: scrolled ? 'rgba(8,11,13,0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderColor: 'rgba(184,148,60,0.08)',
        }}
      >
        <div className="max-w-[1100px] mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-lg"
              style={{
                background: 'rgba(184,148,60,0.08)',
                border: '1px solid rgba(184,148,60,0.15)',
              }}
            >
              <Building2 size={13} style={{ color: GOLD_LIGHT }} />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">Terra</span>
            <span
              className="hidden sm:inline text-[9px] tracking-[0.14em] uppercase ml-1"
              style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}
            >
              Real Estate Intelligence
            </span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-[12px] font-semibold px-5 py-1.5 rounded-lg transition-all"
            style={{ background: GOLD, color: OBSIDIAN }}
          >
            Enter Platform
          </button>
        </div>
      </nav>

      <section className="relative pt-36 sm:pt-48 pb-28 sm:pb-36">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <GenerativeMesh />
          <div
            className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(184,148,60,0.04) 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative max-w-[1100px] mx-auto px-6">
          <Reveal>
            <p
              className="text-[10px] font-semibold tracking-[0.25em] uppercase mb-8 font-mono"
              style={{ color: GOLD_LIGHT }}
            >
              SZL Holdings &middot; Real Estate Intelligence
            </p>
          </Reveal>

          <Reveal delay={100}>
            <h1
              className="max-w-[820px] leading-[1.05] tracking-[-0.025em] text-white"
              style={{
                fontSize: 'clamp(2.8rem, 6vw, 4.6rem)',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontWeight: 400,
              }}
            >
              The intelligence surface for{' '}
              <span style={{ color: GOLD_LIGHT, fontStyle: 'italic' }}>
                serious real estate.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p
              className="text-[17px] sm:text-[19px] leading-[1.85] max-w-[580px] mt-8 mb-12"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Terra gives investors, brokers, and portfolio teams a single operating surface
              — from distressed property discovery through ownership analysis, pipeline
              management, and deal execution. NYC and NYS, live.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-wrap gap-3 mb-20">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2.5 text-[13px] font-semibold px-7 py-3.5 rounded-lg transition-all hover:opacity-90"
                style={{ background: GOLD, color: OBSIDIAN }}
              >
                Enter Platform <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate('/distress-engine')}
                className="inline-flex items-center gap-2 text-[13px] font-medium px-7 py-3.5 rounded-lg transition-all hover:border-white/20"
                style={{
                  color: 'rgba(255,255,255,0.55)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                View Distress Engine →
              </button>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden"
              style={{ background: 'rgba(184,148,60,0.06)' }}
            >
              {[
                { value: '1,025+', label: 'Distress properties tracked' },
                { value: '$4.8B', label: 'Pipeline value monitored' },
                { value: '5', label: 'NYC boroughs covered' },
                { value: '12', label: 'Intelligence modules' },
              ].map((s) => (
                <div key={s.label} className="py-5 px-5" style={{ background: OBSIDIAN }}>
                  <span
                    className="text-[22px] font-bold font-mono block"
                    style={{ color: GOLD_LIGHT }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="text-[10px] tracking-[0.04em] uppercase mt-1 block"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative py-24 sm:py-32 px-6">
        <div className="max-w-[720px] mx-auto">
          <Reveal>
            <p
              className="text-[10px] font-semibold tracking-[0.25em] uppercase mb-6 font-mono"
              style={{ color: GOLD_LIGHT }}
            >
              The thesis
            </p>
            <h2
              className="text-[clamp(1.6rem,3.5vw,2.6rem)] leading-[1.15] tracking-tight text-white mb-8"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontWeight: 400,
              }}
            >
              Information asymmetry wins deals.
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <div
              className="text-[16px] leading-[2] space-y-6"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              <p>
                The brokers and investors who consistently win in NYC real estate{' '}
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>see distress signals first</span>,
                understand{' '}
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  ownership structures fastest
                </span>
                , and close deals with{' '}
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  more context than anyone else in the room
                </span>.
              </p>
              <p>
                Terra replaces the 14 browser tabs, three paid data services, and two hours of
                morning research that stand between you and your first actionable lead of
                the day.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative py-24 sm:py-32 px-6">
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <p
              className="text-[10px] font-semibold tracking-[0.25em] uppercase mb-4 font-mono"
              style={{ color: GOLD_LIGHT }}
            >
              Intelligence Modules
            </p>
            <h2
              className="text-[clamp(1.5rem,3vw,2.2rem)] leading-[1.15] tracking-tight text-white mb-12"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontWeight: 400,
              }}
            >
              Built for how serious operators actually work.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAPABILITIES.map((cap, i) => (
              <Reveal key={cap.title} delay={i * 60}>
                <div
                  className="rounded-xl p-6 h-full transition-all hover:border-white/10"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      background: 'rgba(184,148,60,0.08)',
                      border: '1px solid rgba(184,148,60,0.12)',
                    }}
                  >
                    <cap.icon size={15} style={{ color: GOLD_LIGHT }} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{cap.title}</h3>
                  <p
                    className="text-[13px] leading-[1.7]"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {cap.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 sm:py-32 px-6">
        <div className="max-w-[720px] mx-auto">
          <Reveal>
            <div
              className="rounded-xl p-8 text-center"
              style={{
                background: 'rgba(184,148,60,0.04)',
                border: '1px solid rgba(184,148,60,0.08)',
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <TrendingUp size={16} style={{ color: GOLD_LIGHT }} />
                <span
                  className="text-[10px] font-semibold tracking-[0.2em] uppercase font-mono"
                  style={{ color: GOLD_LIGHT }}
                >
                  A11oy Signal Mesh
                </span>
              </div>
              <h3
                className="text-[clamp(1.2rem,2.5vw,1.6rem)] leading-[1.2] tracking-tight text-white mb-4"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontWeight: 400,
                }}
              >
                Real estate doesn&rsquo;t exist in isolation.
              </h3>
              <p
                className="text-[14px] leading-[1.8] mb-6"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Terra operates within A11oy&rsquo;s governed intelligence fabric. Maritime delays
                from Vessels trigger logistics clause alerts. Cyber posture changes from Sentra
                affect insured property values. Lease expiry clusters surface in Counsel. Every
                lane is connected.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 text-[13px] font-semibold px-6 py-3 rounded-lg transition-all hover:opacity-90"
                style={{ background: GOLD, color: OBSIDIAN }}
              >
                See It Live <ArrowRight size={14} />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <footer
        className="py-12 px-6 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.04)' }}
      >
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={12} style={{ color: GOLD_LIGHT }} />
            <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Terra &middot; SZL Holdings
            </span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>
            &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
