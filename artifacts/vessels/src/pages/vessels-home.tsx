import { motion as m } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Anchor,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Navigation,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFleetExceptions, useVesselsDashboard } from '@/hooks/use-vessels-data';
import {
  metricDisplay,
  VESSELS_COUNT,
  VESSELS_DARK_DETECTION_LEAD,
  VESSELS_UPTIME_SLA,
} from '@/lib/claims';

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'Demo', href: '#demo' },
];

const kpis = [
  { value: metricDisplay(VESSELS_COUNT), label: 'Vessels tracked' },
  { value: '< 90s', label: 'Alert response time' },
  { value: metricDisplay(VESSELS_UPTIME_SLA), label: 'Platform uptime' },
  { value: '180+', label: 'Ports monitored' },
];

const capabilities = [
  {
    title: 'Real-time fleet tracking',
    description:
      'Position, heading, speed, and status for every vessel in your fleet — updated continuously across global shipping lanes.',
  },
  {
    title: 'Route visibility',
    description:
      'Monitor planned vs. actual routes with deviation alerts and estimated arrival recalculation.',
  },
  {
    title: 'Fleet coordination',
    description:
      'Centralised command view across multi-vessel operations, cargo states, and port scheduling.',
  },
  {
    title: 'Anomaly detection',
    description:
      'Automated identification of irregular behaviour: AIS spoofing, unexpected stops, route deviations, and dark-vessel activity.',
  },
  {
    title: 'Operational reporting',
    description:
      'Structured reports on fleet performance, compliance, voyage efficiency, and emissions — export-ready for regulators and boards.',
  },
  {
    title: 'Weather intelligence',
    description:
      'Integrated maritime weather overlays to support safe routing decisions and weather-related risk assessment.',
  },
];

const useCases = [
  {
    audience: 'Fleet operators',
    description:
      'Full situational awareness across your entire fleet. Reduce voyage incidents, coordinate cargo, and manage deviations before they escalate.',
  },
  {
    audience: 'Voyage oversight',
    description:
      'End-to-end voyage visibility from departure to arrival, with automated milestone tracking and ETA updates.',
  },
  {
    audience: 'Compliance teams',
    description:
      'Audit-ready records of routes, positions, and incidents. Built for IMO, SOLAS, and port authority requirements.',
  },
  {
    audience: 'Executive visibility',
    description:
      'High-level fleet performance dashboards for leadership — without the operational noise.',
  },
];

const LIVE_ALERTS = [
  {
    id: 'ALT-001',
    severity: 'critical',
    msg: 'AIS dark — 72h silence near STS zone',
    vessel: 'MV NORDVIK',
    time: '2m ago',
  },
  {
    id: 'ALT-002',
    severity: 'warn',
    msg: 'Route deviation — 38nm off planned track',
    vessel: 'MT ARKTIKA',
    time: '14m ago',
  },
  {
    id: 'ALT-003',
    severity: 'info',
    msg: 'Port arrival confirmed — Rotterdam T7',
    vessel: 'CV STELLARIS',
    time: '31m ago',
  },
  {
    id: 'ALT-004',
    severity: 'warn',
    msg: 'Speed anomaly — 4.2kts below optimal',
    vessel: 'MV CAPE DAWN',
    time: '47m ago',
  },
];

const FLEET_VESSELS = [
  { name: 'MV NORDVIK', type: 'Bulk Carrier', status: 'dark', x: 0.18, y: 0.38, heading: 42 },
  { name: 'MT ARKTIKA', type: 'Tanker', status: 'warn', x: 0.35, y: 0.52, heading: 115 },
  { name: 'CV STELLARIS', type: 'Container', status: 'ok', x: 0.62, y: 0.41, heading: 270 },
  { name: 'MV CAPE DAWN', type: 'Bulk Carrier', status: 'warn', x: 0.72, y: 0.62, heading: 195 },
  { name: 'LNG BOREAS', type: 'LNG Carrier', status: 'ok', x: 0.48, y: 0.29, heading: 88 },
  { name: 'MV SOLANO', type: 'Container', status: 'ok', x: 0.83, y: 0.44, heading: 310 },
  { name: 'MT PACIFIC ISLE', type: 'Tanker', status: 'ok', x: 0.26, y: 0.68, heading: 55 },
  { name: 'CV AURORA BAY', type: 'Container', status: 'ok', x: 0.55, y: 0.58, heading: 222 },
];

interface DemoAlert {
  id: string;
  severity: string;
  msg: string;
  vessel: string;
  time: string;
}

function FleetCommandVisual({
  alerts = LIVE_ALERTS,
  vesselCount = FLEET_VESSELS.length,
}: {
  alerts?: DemoAlert[];
  vesselCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animFrame: number;
    let time = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      if (document.hidden) {
        animFrame = requestAnimationFrame(draw);
        return;
      }
      time += 0.01;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      // Ocean gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(4,12,24,0)');
      grad.addColorStop(1, 'rgba(4,12,24,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Grid lines (lat/lon style)
      ctx.strokeStyle = 'rgba(14,165,233,0.05)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 8; i++) {
        const x = (w / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let i = 0; i <= 5; i++) {
        const y = (h / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // Draw routes
      const routePairs = [
        [0, 1],
        [2, 5],
        [3, 4],
        [6, 7],
      ];
      routePairs.forEach(([a, b]) => {
        const v1 = FLEET_VESSELS[a],
          v2 = FLEET_VESSELS[b];
        const x1 = v1.x * w,
          y1 = v1.y * h,
          x2 = v2.x * w,
          y2 = v2.y * h;
        ctx.beginPath();
        ctx.setLineDash([4, 8]);
        ctx.strokeStyle = 'rgba(14,165,233,0.12)';
        ctx.lineWidth = 1;
        ctx.moveTo(x1, y1);
        const cx = (x1 + x2) / 2 + (Math.random() * 0 - 0);
        const cy = (y1 + y2) / 2 - 20;
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      // Draw vessels
      FLEET_VESSELS.forEach((v, i) => {
        const x = v.x * w,
          y = v.y * h;
        const pulse = Math.sin(time * 2 + i * 1.2) * 0.5 + 0.5;
        const color = v.status === 'dark' ? '#ef4444' : v.status === 'warn' ? '#f59e0b' : '#22d3ee';
        // Pulse ring
        ctx.beginPath();
        ctx.arc(x, y, 7 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.12 + pulse * 0.08;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Vessel dot
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        // Heading indicator
        const radians = (v.heading - 90) * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(radians) * 10, y + Math.sin(radians) * 10);
        ctx.strokeStyle = `${color}88`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
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
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: '#040c18' }}
      />
      {/* Fleet status overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
        <div className="bg-[#060e1a]/90 border border-sky-500/15 rounded px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-semibold text-emerald-400/80 tracking-widest uppercase">
              FLEET LIVE
            </span>
          </div>
          <div className="text-[10px] text-sky-400/60 font-mono">
            {vesselCount} vessels · {alerts.filter((a) => a.severity === 'critical').length}{' '}
            critical
          </div>
        </div>
        <div className="bg-[#060e1a]/90 border border-sky-500/15 rounded px-3 py-2 backdrop-blur-sm">
          <div className="text-[9px] font-mono text-sky-400/40 mb-0.5">AIS FEED</div>
          <div className="text-[10px] font-semibold text-sky-300/70">
            LIVE · {new Date().toUTCString().slice(17, 25)} UTC
          </div>
        </div>
      </div>
      {/* Alert feed */}
      <div className="absolute bottom-3 left-3 right-3 space-y-1 pointer-events-none">
        {alerts.slice(0, 3).map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 bg-[#060e1a]/90 border border-sky-500/10 rounded px-3 py-1.5 backdrop-blur-sm"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.severity === 'critical' ? 'bg-red-400 animate-pulse' : a.severity === 'warn' ? 'bg-amber-400' : 'bg-emerald-400'}`}
            />
            <span className="text-[9px] font-mono text-sky-400/50 flex-shrink-0">{a.id}</span>
            <span className="text-[10px] text-sky-300/70 flex-1 truncate">{a.msg}</span>
            <span className="text-[9px] text-sky-400/35 flex-shrink-0 font-mono">
              {a.vessel.split(' ')[1] ?? a.vessel}
            </span>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="absolute top-3 right-3 pointer-events-none" style={{ display: 'none' }} />
    </div>
  );
}

function LiveFleetCommandVisual() {
  const { fleetExceptions } = useFleetExceptions({ status: 'active' });
  const { data: dashboard } = useVesselsDashboard();

  const liveAlerts: DemoAlert[] = fleetExceptions.slice(0, 4).map((e, i) => ({
    id: `ALT-${String(i + 1).padStart(3, '0')}`,
    severity: ((): 'critical' | 'warn' | 'info' => {
      if (e.severity === 'critical' || e.severity === 'high') return 'critical';
      if (e.severity === 'watch') return 'warn';
      return 'info';
    })(),
    msg: e.title ?? 'Fleet exception detected',
    vessel: e.vesselName ?? 'Unknown vessel',
    time: e.detectedAt
      ? `${Math.max(1, Math.round((Date.now() - new Date(e.detectedAt).getTime()) / 60000))}m ago`
      : '—',
  }));

  const alerts = liveAlerts.length > 0 ? liveAlerts : LIVE_ALERTS;
  const vesselCount = dashboard?.summary?.totalVessels ?? FLEET_VESSELS.length;

  return <FleetCommandVisual alerts={alerts} vesselCount={vesselCount} />;
}

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  return (
    <m.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#060e1a]/97 backdrop-blur-md border-b border-sky-500/10' : 'bg-transparent'
      }`}
      onScroll={() => setScrolled(window.scrollY > 32)}
    >
      <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
        <a href="/vessels/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
            <span
              className="text-sky-400 font-bold text-[11px]"
              style={{ fontFamily: 'system-ui' }}
            >
              V
            </span>
          </div>
          <span className="font-semibold text-[14px] text-sky-50 tracking-tight">Vessels</span>
        </a>
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sky-300/50 text-[13px] font-medium hover:text-sky-100 transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#demo"
            className="flex items-center gap-1.5 px-4 py-2 rounded text-[13px] font-semibold text-sky-950 bg-sky-400 hover:bg-sky-300 transition-colors duration-200"
          >
            Request a private demo
            <ChevronRight size={13} />
          </a>
          <a
            href="/vessels/fleet"
            className="text-sky-300/50 text-[13px] font-medium hover:text-sky-100 transition-colors"
          >
            Sign in
          </a>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-sky-300/60 hover:text-sky-100 transition-colors"
        >
          <span className="sr-only">Menu</span>
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-4 h-0.5 bg-current" />
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-[#060e1a]/97 border-b border-sky-500/10 px-6 py-5 flex flex-col gap-4">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="text-sky-300/60 text-[15px] font-medium hover:text-sky-100 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#demo"
            onClick={() => setMobileOpen(false)}
            className="mt-1 px-5 py-3 rounded text-[13px] font-semibold text-sky-950 text-center bg-sky-400"
          >
            Request a private demo
          </a>
        </div>
      )}
    </m.nav>
  );
}

export default function VesselsHome() {
  return (
    <div className="min-h-screen bg-[#040c18] text-sky-50">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-[60px] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.07)_0%,transparent_65%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-sky-500/10" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-7"
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 text-sky-400/80 text-[11px] font-medium tracking-[0.08em] uppercase">
              Maritime Intelligence Platform
            </span>
          </m.div>
          <m.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.07] tracking-[-0.02em] text-sky-50 mb-6"
          >
            Command your fleet.
            <br />
            <span className="text-sky-400">See everything.</span>
          </m.h1>
          <m.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-sky-300/60 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Vessels gives fleet operators, compliance teams, and executive leadership a single,
            authoritative picture of maritime operations — in real time.
          </m.p>
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.48 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a
              href="#demo"
              className="group flex items-center gap-2 px-6 py-3 rounded text-[13.5px] font-semibold text-sky-950 bg-sky-400 hover:bg-sky-300 transition-colors duration-200 shadow-sm"
            >
              Request a private demo
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform duration-200"
              />
            </a>
            <a
              href="/vessels/fleet"
              className="flex items-center gap-2 px-6 py-3 rounded text-[13.5px] font-medium text-sky-300/60 border border-sky-500/20 hover:border-sky-500/40 hover:text-sky-200 transition-all duration-200"
            >
              Access the platform
            </a>
          </m.div>

          {/* Fleet command visual */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-16 rounded-xl border border-sky-500/15 overflow-hidden max-w-3xl mx-auto"
            style={{ height: '320px' }}
          >
            <LiveFleetCommandVisual />
          </m.div>
        </div>
      </section>

      {/* KPI Strip */}
      <section className="border-y border-sky-500/10 bg-[#060e1a]/50">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-sky-500/10 rounded-lg overflow-hidden">
            {kpis.map((k, i) => (
              <m.div
                key={k.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="bg-[#060e1a] px-6 py-6 text-center"
              >
                <p className="text-[1.75rem] font-bold text-sky-300 tracking-tight mb-1">
                  {k.value}
                </p>
                <p className="text-sky-400/40 text-[11.5px] font-medium">{k.label}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <m.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55 }}
            className="mb-12"
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-sky-400/50 mb-3">
              Platform
            </p>
            <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-sky-50 leading-[1.15]">
              Built for maritime operations
            </h2>
            <p className="text-sky-300/50 text-base mt-3 max-w-lg leading-relaxed">
              Every capability was designed with fleet operators, compliance officers, and executive
              teams in mind.
            </p>
          </m.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((c, i) => (
              <m.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="p-5 rounded-xl border border-sky-500/10 bg-[#060e1a]/60 hover:border-sky-500/20 transition-colors duration-250"
              >
                <h3 className="text-[14.5px] font-semibold text-sky-100 mb-2 tracking-tight">
                  {c.title}
                </h3>
                <p className="text-sky-400/50 text-[13px] leading-relaxed">{c.description}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Walkthrough */}
      <section id="platform" className="py-20 lg:py-28 border-t border-sky-500/10">
        <div className="max-w-6xl mx-auto px-6">
          <m.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55 }}
            className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center"
          >
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-sky-400/50 mb-4">
                How it works
              </p>
              <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-sky-50 leading-[1.15] mb-5">
                From signal to decision
              </h2>
              <p className="text-sky-300/55 text-base leading-relaxed mb-6">
                Vessels ingests AIS data, weather feeds, port schedules, and cargo records into a
                unified operational picture. Teams get the context they need to act — not a feed of
                unprocessed signals.
              </p>
              <div className="space-y-4">
                {[
                  'Live AIS position tracking and historical trail',
                  'Automated deviation and anomaly alerts',
                  'Fleet cards with vessel status, cargo, and ETA',
                  'Integrated weather and routing overlays',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400/60 mt-1.5 shrink-0" />
                    <p className="text-sky-300/60 text-[13.5px] leading-relaxed">{f}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-sky-500/15 overflow-hidden h-80">
              <LiveFleetCommandVisual />
            </div>
          </m.div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-20 lg:py-28 border-t border-sky-500/10 bg-[#060e1a]/40">
        <div className="max-w-6xl mx-auto px-6">
          <m.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55 }}
            className="mb-12"
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-sky-400/50 mb-3">
              Use Cases
            </p>
            <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-sky-50 leading-[1.15]">
              Who Vessels serves
            </h2>
          </m.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {useCases.map((u, i) => (
              <m.div
                key={u.audience}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="p-6 rounded-xl border border-sky-500/10 bg-[#060e1a]/60"
              >
                <h3 className="text-[15px] font-semibold text-sky-100 mb-2 tracking-tight">
                  {u.audience}
                </h3>
                <p className="text-sky-400/50 text-[13.5px] leading-relaxed">{u.description}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Enterprise */}
      <section className="py-20 lg:py-28 border-t border-sky-500/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20">
            <m.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55 }}
            >
              <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-sky-400/50 mb-4">
                Architecture
              </p>
              <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-sky-50 leading-[1.15] mb-5">
                Enterprise-grade from the ground up
              </h2>
              <p className="text-sky-300/55 text-base leading-relaxed">
                Vessels is built for the organisations that operate global fleets — where downtime,
                data errors, and security failures are not acceptable outcomes.
              </p>
            </m.div>
            <div className="space-y-0 divide-y divide-sky-500/10">
              {[
                {
                  title: 'End-to-end encryption',
                  description:
                    'All data in transit and at rest is encrypted to enterprise standards.',
                },
                {
                  title: 'Role-based access control',
                  description:
                    'Granular permissions for exec, ops, compliance, and maintenance roles.',
                },
                {
                  title: 'Audit trails',
                  description: 'Full record of system actions, alerts, and configuration changes.',
                },
                {
                  title: metricDisplay(VESSELS_UPTIME_SLA),
                  description: 'Built on resilient infrastructure with redundant data ingestion.',
                },
              ].map((f, i) => (
                <m.div
                  key={f.title}
                  initial={{ opacity: 0, x: 14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="py-5"
                >
                  <h3 className="text-[14px] font-semibold text-sky-100 mb-1.5">{f.title}</h3>
                  <p className="text-sky-400/50 text-[13px] leading-relaxed">{f.description}</p>
                </m.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Proof Reinforcement */}
      <section className="py-16 lg:py-20 border-t border-sky-500/10">
        <div className="max-w-5xl mx-auto px-6">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-sky-400/50 mb-3">
              Documented Outcomes
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-sky-50 tracking-tight">
              Results from production deployments
            </h2>
            <p className="text-sky-300/50 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
              Not projections. Specific, documented outcomes from Vessels operating in live maritime
              environments.
            </p>
          </m.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                metric: metricDisplay(VESSELS_DARK_DETECTION_LEAD),
                label: 'Pre-designation lead time',
                detail: 'AIS-dark vessel activity flagged before formal OFAC listing',
                accent: '#3b82f6',
              },
              {
                metric: '94%',
                label: 'Confidence score',
                detail: 'Security AI v4 behavioral signature accuracy on pre-designation case',
                accent: '#0ea5e9',
              },
              {
                metric: metricDisplay(VESSELS_COUNT),
                label: 'Vessels monitored',
                detail: 'Continuous autonomous intelligence across global maritime corridors',
                accent: '#38bdf8',
              },
              {
                metric: '0',
                label: 'Compliance breaches',
                detail: 'Fleet operators cleared exposure window before formal designation',
                accent: '#22d3ee',
              },
              {
                metric: '< 2h',
                label: 'P&I notification time',
                detail: 'From autonomous alert to insurer notification — same monitoring cycle',
                accent: '#67e8f9',
              },
              {
                metric: '72h',
                label: 'Dark period detected',
                detail: 'Near known STS transfer zone, part of 90-day behavioral pattern',
                accent: '#a5f3fc',
              },
            ].map((item, i) => (
              <m.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-xl p-5 border border-sky-500/12 bg-sky-500/4 hover:border-sky-500/20 transition-colors duration-200"
              >
                <div className="text-2xl font-bold mb-1" style={{ color: item.accent }}>
                  {item.metric}
                </div>
                <div className="text-[13px] font-semibold text-sky-100 mb-1.5">{item.label}</div>
                <div className="text-[12px] text-sky-400/50 leading-relaxed">{item.detail}</div>
              </m.div>
            ))}
          </div>
          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-6 text-center"
          >
            <a
              href="/szl-holdings/case-studies"
              className="text-[12px] text-sky-400/50 hover:text-sky-300/70 transition-colors inline-flex items-center gap-1.5"
            >
              Read full case study: 34-Day Pre-Designation Lead on AIS-Dark Vessel Activity
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </m.div>
        </div>
      </section>

      {/* Demo CTA */}
      <section id="demo" className="py-20 lg:py-28 border-t border-sky-500/10 bg-[#060e1a]/60">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-sky-400/50 mb-4">
              Get access
            </p>
            <h2 className="text-[1.875rem] sm:text-[2.5rem] font-bold tracking-tight text-sky-50 leading-[1.12] mb-5">
              Request a private walkthrough
            </h2>
            <p className="text-sky-300/55 text-base leading-relaxed mb-8 max-w-md mx-auto">
              We work with a limited number of fleet operators at any time. Contact us to arrange a
              private walkthrough of the platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="mailto:demo@vessels.io"
                className="group flex items-center gap-2 px-7 py-3.5 rounded text-[13.5px] font-semibold text-sky-950 bg-sky-400 hover:bg-sky-300 transition-colors duration-200 shadow-sm"
              >
                Request a private walkthrough
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </a>
            </div>
          </m.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-sky-500/10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
              <span className="text-sky-400 font-bold text-[10px]">V</span>
            </div>
            <span className="font-semibold text-[13px] text-sky-300/70 tracking-tight">
              Vessels
            </span>
            <span className="text-sky-400/25 text-[12px]">
              — Part of the SZL Holdings ecosystem
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="/vessels/fleet"
              className="text-sky-400/40 text-[12px] hover:text-sky-300/70 transition-colors"
            >
              Platform
            </a>
            <a
              href="/szl-holdings/"
              className="text-sky-400/40 text-[12px] hover:text-sky-300/70 transition-colors"
            >
              SZL Holdings
            </a>
            <span className="text-sky-400/25 text-[12px]">
              &copy; {new Date().getFullYear()} Vessels
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
