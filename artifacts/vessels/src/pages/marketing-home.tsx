import { AnimatedCounter } from '@szl-holdings/shared-ui/animated-counter';
import { ContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { NewsletterSubscribe } from '@szl-holdings/shared-ui/newsletter-subscribe';
import { motion as m, } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  Globe,
  Lock,
  Navigation,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { MarketingFooter } from '@/components/MarketingFooter';
import { MarketingNav } from '@/components/MarketingNav';
import { metricDisplay, VESSELS_UPTIME_SLA } from '@/lib/claims';

function OceanCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animFrame: number;
    let time = 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const vessels = [
      { x: 0.15, y: 0.35, speed: 0.0003, heading: 0.7, name: 'MV Horizon' },
      { x: 0.32, y: 0.55, speed: 0.0002, heading: -0.4, name: 'MT Pacific Star' },
      { x: 0.52, y: 0.22, speed: 0.0004, heading: 0.3, name: 'MV Atlas' },
      { x: 0.68, y: 0.48, speed: 0.0001, heading: -0.8, name: 'MT Endeavour' },
      { x: 0.82, y: 0.3, speed: 0.0003, heading: 0.5, name: 'MV Polaris' },
      { x: 0.45, y: 0.65, speed: 0.0002, heading: -0.2, name: 'MT Sovereign' },
      { x: 0.75, y: 0.62, speed: 0.0003, heading: 0.6, name: 'MV Nordic' },
    ];

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const draw = () => {
      if (document.hidden) {
        animFrame = requestAnimationFrame(draw);
        return;
      }
      time += 0.004;
      ctx.clearRect(0, 0, w(), h());

      for (let y = 0; y < h(); y += 50) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(201,183,135,${0.015 + Math.sin(time + y * 0.01) * 0.008})`;
        ctx.lineWidth = 0.5;
        for (let x = 0; x < w(); x += 3) {
          const wave =
            Math.sin(x * 0.006 + time * 1.2 + y * 0.008) * 4 + Math.sin(x * 0.01 + time * 0.8) * 2;
          if (x === 0) ctx.moveTo(x, y + wave);
          else ctx.lineTo(x, y + wave);
        }
        ctx.stroke();
      }

      const grd = ctx.createRadialGradient(
        w() * 0.5,
        h() * 0.3,
        0,
        w() * 0.5,
        h() * 0.3,
        w() * 0.6,
      );
      grd.addColorStop(0, 'rgba(201,183,135,0.03)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w(), h());

      vessels.forEach((v, i) => {
        const vx = v.x * w() + Math.sin(time * 0.5 + i * 2) * 8;
        const vy = v.y * h() + Math.cos(time * 0.3 + i * 1.5) * 6;
        const pulse = Math.sin(time * 2 + i * 1.3) * 0.3 + 0.7;

        ctx.beginPath();
        ctx.arc(vx, vy, 12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,183,135,${0.04 * pulse})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(vx, vy, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,183,135,${0.08 * pulse})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(vx, vy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,183,135,${0.7 * pulse})`;
        ctx.fill();

        if (i < vessels.length - 1) {
          const nvx = vessels[i + 1].x * w() + Math.sin(time * 0.5 + (i + 1) * 2) * 8;
          const nvy = vessels[i + 1].y * h() + Math.cos(time * 0.3 + (i + 1) * 1.5) * 6;
          ctx.beginPath();
          ctx.moveTo(vx, vy);
          ctx.lineTo(nvx, nvy);
          ctx.strokeStyle = `rgba(201,183,135,${0.03 * pulse})`;
          ctx.setLineDash([2, 6]);
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

function LiveFleetPanel() {
  const rows = [
    {
      vessel: 'MV Horizon',
      flag: 'SG',
      status: 'underway',
      eta: '14h 22m',
      route: 'Singapore → Rotterdam',
      risk: 'low',
    },
    {
      vessel: 'MT Pacific Star',
      flag: 'GR',
      status: 'underway',
      eta: '3d 8h',
      route: 'Houston → Fujairah',
      risk: 'med',
    },
    {
      vessel: 'MV Atlas',
      flag: 'NO',
      status: 'at port',
      eta: '—',
      route: 'Antwerp (berth 7)',
      risk: 'low',
    },
    {
      vessel: 'MT Endeavour',
      flag: 'PA',
      status: 'underway',
      eta: '22h 45m',
      route: 'Jebel Ali → Mumbai',
      risk: 'low',
    },
    {
      vessel: 'MV Nordic',
      flag: 'DK',
      status: 'anchored',
      eta: '6h 10m',
      route: 'Waiting: Suez Canal',
      risk: 'high',
    },
  ];
  return (
    <m.div
      initial={{ y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="mt-12 lg:mt-16 max-w-5xl mx-auto"
    >
      <div className="rounded-xl border border-white/[0.06] bg-[#111111]/80 backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
            <span className="text-[11px] font-medium text-[#5e5e5e] tracking-wide uppercase">
              Live Fleet — 214 SEXTANT Tracked
            </span>
          </div>
          <span className="text-[10px] text-[#5e5e5e] font-mono">Updated 12s ago</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-5 py-2.5 text-[10px] font-semibold text-[#5e5e5e] tracking-wider uppercase">
                  Vessel
                </th>
                <th className="px-4 py-2.5 text-[10px] font-semibold text-[#5e5e5e] tracking-wider uppercase hidden sm:table-cell">
                  Route
                </th>
                <th className="px-4 py-2.5 text-[10px] font-semibold text-[#5e5e5e] tracking-wider uppercase">
                  Status
                </th>
                <th className="px-4 py-2.5 text-[10px] font-semibold text-[#5e5e5e] tracking-wider uppercase hidden md:table-cell">
                  ETA
                </th>
                <th className="px-4 py-2.5 text-[10px] font-semibold text-[#5e5e5e] tracking-wider uppercase hidden lg:table-cell">
                  Risk
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <m.tr
                  key={r.vessel}
                  initial={{}}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                  className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] text-[#5e5e5e] font-mono">{r.flag}</span>
                      <span className="text-[13px] font-medium text-[#f5f5f5]">{r.vessel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#8a8a8a] hidden sm:table-cell">
                    {r.route}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                        r.status === 'underway'
                          ? 'text-[#8a8a8a]'
                          : r.status === 'at port'
                            ? 'text-[#5e5e5e]'
                            : 'text-[#c9b787]'
                      }`}
                    >
                      <span
                        className={`w-1 h-1 rounded-full ${
                          r.status === 'underway'
                            ? 'bg-[#c9b787]'
                            : r.status === 'at port'
                              ? 'bg-sky-400'
                              : 'bg-[#c9b787]'
                        }`}
                      />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#8a8a8a] font-mono hidden md:table-cell">
                    {r.eta}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span
                      className={`text-[10px] font-semibold tracking-wider uppercase ${
                        r.risk === 'low'
                          ? 'text-[#8a8a8a]'
                          : r.risk === 'med'
                            ? 'text-[#c9b787]'
                            : 'text-[#8a8a8a]'
                      }`}
                    >
                      {r.risk}
                    </span>
                  </td>
                </m.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </m.div>
  );
}

const capabilities = [
  {
    icon: Globe,
    title: 'Fleet Command',
    desc: 'Live positions, ETAs, port data, and voyage tracking in one unified operational view.',
    tag: 'Core',
  },
  {
    icon: AlertTriangle,
    title: 'Exception Center',
    desc: 'Prioritized alerts with business context, severity scoring, and one-click response actions.',
    tag: 'Intelligence',
  },
  {
    icon: DollarSign,
    title: 'Voyage Economics',
    desc: 'Revenue, bunker cost, TCE, and margin per voyage — updated in real time.',
    tag: 'Commercial',
  },
  {
    icon: Shield,
    title: 'Sanctions Screening',
    desc: 'Automated OFAC/EU screening, dark activity detection, and continuous monitoring.',
    tag: 'Compliance',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    desc: 'Utilization trends, delay root cause, and corridor profitability dashboards.',
    tag: 'Analytics',
  },
  {
    icon: Navigation,
    title: 'Route Intelligence',
    desc: 'Weather-adjusted routing, canal queue times, and corridor benchmarking.',
    tag: 'Planning',
  },
];

const useCases = [
  {
    role: 'Fleet Executives',
    headline: 'Portfolio visibility. Not status updates.',
    desc: 'Margins, exception exposure, fleet utilization, and board-ready metrics — assembled automatically.',
    icon: TrendingUp,
    metrics: ['Fleet P&L', 'Exception exposure', 'Utilization trends'],
  },
  {
    role: 'Operations',
    headline: 'Triage what matters. Before it escalates.',
    desc: 'ETA deviation, port congestion, weather risk — one interface with full operational context.',
    icon: Eye,
    metrics: ['ETA accuracy', 'Exception queue', 'Port delays'],
  },
  {
    role: 'Commercial',
    headline: 'Negotiate from data. Not from memory.',
    desc: 'Charter performance, TCE benchmarking, and route profitability per voyage and corridor.',
    icon: DollarSign,
    metrics: ['TCE analysis', 'Route margins', 'Charter benchmarks'],
  },
];

export default function MarketingHomePage() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] overflow-x-hidden">
      <MarketingNav />

      <section className="relative pt-28 pb-6 sm:pt-32 sm:pb-8 lg:pt-36 lg:pb-10 overflow-hidden">
        <OceanCanvas />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6">
          <m.div
            initial={{}}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9b787]" />
            <span className="text-[11px] font-semibold text-[#c9b787] tracking-[0.12em] uppercase">
              Maritime Intelligence Platform
            </span>
          </m.div>

          <div className="max-w-4xl">
            <m.h1
              initial={{ y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.2rem] font-bold leading-[1.08] tracking-tight mb-5"
            >
              Fleet operations.{' '}
              <span className="text-[#c9b787]">
                Decided faster.
              </span>
            </m.h1>

            <m.p
              initial={{ y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[15px] sm:text-base text-[#8a8a8a] max-w-xl leading-relaxed mb-8"
            >
              Positions, voyage economics, compliance, and exception management — one command
              platform for maritime operators who need answers, not dashboards.
            </m.p>

            <m.div
              initial={{ y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start gap-3"
            >
              <a href="./dashboard?demo=true">
                <button className="flex items-center gap-2 px-7 py-3.5 bg-[#c9b787] hover:bg-[#d4c494] text-[#050c17] font-semibold text-[13px] tracking-wide transition-all duration-200">
                  Enter Fleet Command <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </a>
              <Link href="/demo">
                <button className="flex items-center gap-2 px-7 py-3.5 border border-white/[0.08] hover:border-white/[0.12] text-[#8a8a8a] hover:text-[#e0e0e0] font-medium text-[13px] transition-all duration-200">
                  Request a demo <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </m.div>
          </div>

          <LiveFleetPanel />
        </div>
      </section>

      <section className="border-y border-white/[0.05] bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-6 sm:py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: 214, suffix: '+', label: 'SEXTANT tracked' },
            { value: 84, suffix: '%', label: 'On-time arrival rate' },
            { value: 47, label: 'Countries covered' },
            { value: 99, suffix: '.97%', label: 'Platform uptime' },
          ].map((k, i) => (
            <m.div
              key={k.label}
              initial={{ y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center sm:text-left"
            >
              <p className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] mb-0.5 font-mono tracking-tight">
                <AnimatedCounter value={k.value} suffix={k.suffix} />
              </p>
              <p className="text-[11px] text-[#5e5e5e] tracking-wide">{k.label}</p>
            </m.div>
          ))}
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <m.div
            initial={{ y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-[#c9b787]/40" />
              <span className="text-[11px] font-semibold text-[#c9b787] tracking-[0.12em] uppercase">
                Capabilities
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#f5f5f5] mb-3 tracking-tight">
              Every layer of fleet intelligence.
            </h2>
            <p className="text-[14px] text-[#8a8a8a] max-w-lg">
              From vessel positions to voyage margins. Everything your operations team needs to
              decide faster.
            </p>
          </m.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.03] rounded-lg overflow-hidden">
            {capabilities.map((c, i) => (
              <m.div
                key={c.title}
                initial={{ y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#0a0a0a] p-7 sm:p-8 group hover:bg-[#111111] transition-colors duration-300"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:border-[#c9b787]/20 transition-colors">
                    <c.icon className="w-[18px] h-[18px] text-[#c9b787]" />
                  </div>
                  <span className="text-[9px] font-semibold text-[#5e5e5e] tracking-[0.1em] uppercase mt-1">
                    {c.tag}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-[#f5f5f5] mb-2">{c.title}</h3>
                <p className="text-[12.5px] text-[#8a8a8a] leading-relaxed">{c.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <m.div
            initial={{ y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-[#c9b787]/40" />
              <span className="text-[11px] font-semibold text-[#c9b787] tracking-[0.12em] uppercase">
                Built for
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#f5f5f5] tracking-tight">
              Who runs on SEXTANT.
            </h2>
          </m.div>

          <div className="grid md:grid-cols-3 gap-5">
            {useCases.map((u, i) => (
              <m.div
                key={u.role}
                initial={{ y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="border border-white/[0.05] hover:border-white/[0.06] p-7 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <u.icon className="w-4 h-4 text-[#c9b787]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#c9b787] uppercase tracking-[0.1em]">
                    {u.role}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-[#f5f5f5] mb-2.5 leading-snug">
                  {u.headline}
                </h3>
                <p className="text-[12.5px] text-[#8a8a8a] leading-relaxed mb-5">{u.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {u.metrics.map((m) => (
                    <span
                      key={m}
                      className="text-[10px] text-[#5e5e5e] border border-white/[0.05] px-2.5 py-1 font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 border-t border-white/[0.04] bg-[#0a0a0a]/50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <m.div
              initial={{ y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-px bg-[#c9b787]/40" />
                <span className="text-[11px] font-semibold text-[#c9b787] tracking-[0.12em] uppercase">
                  Platform
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] mb-3 tracking-tight">
                Command-grade infrastructure.
              </h2>
              <p className="text-[13px] text-[#8a8a8a] mb-8 max-w-md leading-relaxed">
                Built for maritime operators who need reliable, secure, always-on intelligence.
              </p>

              <div className="space-y-5">
                {[
                  {
                    icon: Zap,
                    label: 'Real-time AIS ingestion (live + simulated)',
                    desc: 'Sub-minute vessel positions with 90-day historical replay and anomaly detection. Public AIS feeds (Digitraffic, BarentsWatch) where available; simulated positions used in demo dashboards and where commercial feeds are not yet contracted.',
                  },
                  {
                    icon: Lock,
                    label: 'Enterprise security',
                    desc: 'SOC 2 Type II. End-to-end encryption. Role-based access control. Full audit logging.',
                  },
                  {
                    icon: Activity,
                    label: 'API-first architecture',
                    desc: 'REST and webhook APIs for every data point. Integrate with your existing stack.',
                  },
                  {
                    icon: Clock,
                    label: metricDisplay(VESSELS_UPTIME_SLA),
                    desc: 'Multi-region deployment with automatic failover and zero-downtime updates.',
                  },
                ].map((item, i) => (
                  <m.div
                    key={item.label}
                    initial={{ x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-4"
                  >
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                      <item.icon className="w-3.5 h-3.5 text-[#c9b787]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#f5f5f5] mb-0.5">{item.label}</p>
                      <p className="text-[12px] text-[#8a8a8a] leading-relaxed">{item.desc}</p>
                    </div>
                  </m.div>
                ))}
              </div>
            </m.div>

            <m.div
              initial={{ y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="border border-white/[0.05] bg-[#111111]/60 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-semibold text-[#5e5e5e] tracking-[0.1em] uppercase">
                  Fleet Snapshot · Simulated
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
                  <span className="text-[10px] text-[#c9b787] font-medium">Demo data</span>
                </div>
              </div>
              <div className="space-y-0">
                {[
                  { label: 'Active vessels', value: '214' },
                  { label: 'Voyages in progress', value: '89' },
                  { label: 'Open exceptions', value: '12' },
                  { label: 'Ports monitored', value: '340+' },
                  { label: 'Data points / day', value: '4.2M' },
                  { label: 'Avg exception resolution', value: '3.2h' },
                ].map((item, _i) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-3.5 border-b border-white/[0.04] last:border-0"
                  >
                    <span className="text-[12px] text-[#8a8a8a]">{item.label}</span>
                    <span className="text-[14px] font-mono font-semibold text-[#f5f5f5]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </m.div>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1140px] mx-auto px-5 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase mb-3 text-[#c9b787]">
              Platform Walkthrough
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#f5f5f5] mb-3 tracking-tight">
              How SEXTANT works in practice
            </h2>
            <p className="text-[#8a8a8a] text-[14px] max-w-xl mx-auto">
              From AIS connection to full fleet intelligence in under 15 minutes.
            </p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute left-[39px] top-0 bottom-0 w-px bg-sky-500/[0.04]" />
            <div className="space-y-10">
              {[
                {
                  step: '01',
                  title: 'Connect your AIS feed',
                  body: 'SEXTANT ingests AIS data from public feeds (Digitraffic, BarentsWatch) or your existing provider. Demo dashboards use simulated AIS data where commercial feeds are not contracted. Historical voyage data loads automatically. Fleet roster builds from your existing records in minutes.',
                  tag: 'Setup',
                },
                {
                  step: '02',
                  title: 'Fleet intelligence activates immediately',
                  body: 'Your vessel map populates with live positions, route overlays, and anomaly indicators. Dark period detection, route deviation alerts, and chokepoint congestion data activate without configuration.',
                  tag: 'Intelligence',
                },
                {
                  step: '03',
                  title: 'Risk scoring identifies exceptions',
                  body: 'Every vessel in your fleet receives a composite risk score combining AIS behaviour, sanctions screening, cyber exposure, and weather risk. High-risk vessels surface to the top of your command view.',
                  tag: 'Risk',
                },
                {
                  step: '04',
                  title: 'Helmsman contextualizes every exception',
                  body: "The Helmsman AI copilot answers questions about any vessel or voyage — in plain language. 'Why is MT Pacific Star scoring high?' gets a structured answer with evidence, not a data dump.",
                  tag: 'Intelligence',
                },
                {
                  step: '05',
                  title: 'Alerts route to the right team',
                  body: 'Exceptions route to port operations, compliance, or security based on type and severity. Every alert carries full context — vessel history, voyage details, risk factors — for immediate action.',
                  tag: 'Execution',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-8 md:gap-10">
                  <div className="flex-shrink-0 w-20 text-right">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-[11px] font-bold bg-[#c9b787]/10 text-[#c9b787] border border-[#c9b787]/20">
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-1 pb-10 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[16px] font-semibold text-[#f5f5f5]">{item.title}</h3>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#c9b787]/8 text-[#c9b787] border border-[#c9b787]/10">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[13.5px] leading-relaxed text-[#8a8a8a]">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <m.div
            initial={{ y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[#f5f5f5] mb-4 tracking-tight">
              See SEXTANT{' '}
              <span className="bg-gradient-to-r text-[#c9b787]">
                in action.
              </span>
            </h2>
            <p className="text-[#8a8a8a] text-[14px] mb-8 max-w-md mx-auto leading-relaxed">
              A private walkthrough tailored to your fleet, routes, and operational priorities.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="./dashboard?demo=true">
                <button className="px-8 py-3.5 bg-[#c9b787] hover:bg-[#d4c494] text-[#050c17] font-semibold text-[13px] transition-all duration-200">
                  Enter Fleet Command Demo
                </button>
              </a>
              <button
                onClick={() => setDemoOpen(true)}
                className="px-6 py-3.5 text-[13px] text-[#5e5e5e] hover:text-[#8a8a8a] transition-colors font-medium"
              >
                Request a private demo <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </m.div>
        </div>
      </section>

      <section className="py-20 sm:py-24 border-t border-white/[0.04] bg-[#0a0a0a]">
        <div className="max-w-2xl mx-auto px-5 sm:px-6">
          <m.div
            initial={{ y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <NewsletterSubscribe
              utmSource="vessels"
              variant="inline"
              heading="Intelligence briefings from SZL Command"
              subheading="Insights on governed AI, maritime intelligence, and operational decision-making — straight from the founding team."
            />
          </m.div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.25em', color: '#5e5e5e', marginBottom: 20, textTransform: 'uppercase' as const }}>
            Part of the SZL Holdings ecosystem
          </p>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#f5f5f5', marginBottom: 14, fontFamily: 'var(--font-display, system-ui)' }}>
            Orchestrated by <span style={{ color: '#c9b787' }}>a11oy</span>
          </p>
          <p style={{ fontSize: 13, color: '#8a8a8a', lineHeight: 1.8, maxWidth: 520, margin: '0 auto' }}>
            Every decision in SEXTANT follows the same governed path — Signal, Context, Recommendation, Simulation, Policy, Execution, Proof, Outcome. The same proof chain. The same attribution. The same governance.
          </p>
        </div>
      </section>

      <MarketingFooter />

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="vessels"
        subtitle="SEXTANT — Maritime Fleet Intelligence"
      />
    </div>
  );
}
