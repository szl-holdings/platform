import { aboutSzlParagraph, brand, copyrightLine } from '@szl-holdings/brand-registry';
import { motion as m } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  ChevronRight,
  Eye,
  Flame,
  Layers,
  Lock,
  Shield,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { AEGIS_MITRE_COVERAGE, metricDisplay } from '../lib/claims';

const threatFeed = [
  {
    type: 'Critical',
    title: 'Lateral movement detected — domain controller pivot attempt',
    source: 'XDR · Endpoint',
    time: '2 min ago',
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
  },
  {
    type: 'High',
    title: 'Anomalous credential dumping via LSASS process injection',
    source: 'Identity Threat · AD',
    time: '8 min ago',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
  {
    type: 'Medium',
    title: 'Suspicious outbound C2 beacon pattern on port 443',
    source: 'NDR · Network',
    time: '23 min ago',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    type: 'High',
    title: 'Privilege escalation via service account misuse',
    source: 'Identity Threat · Entra ID',
    time: '41 min ago',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
];

const capabilities = [
  {
    icon: Activity,
    title: 'SOC Command Center',
    desc: 'Unified operational view with real-time alert triage, incident tracking, and automated escalation workflows.',
  },
  {
    icon: Target,
    title: 'MITRE ATT&CK Mapping',
    desc: 'Full-spectrum coverage visualization across tactics and techniques. Identify gaps before adversaries do.',
  },
  {
    icon: Eye,
    title: 'XDR Console',
    desc: 'Cross-domain detection and response across endpoint, network, identity, and cloud — in one pane.',
  },
  {
    icon: Brain,
    title: 'Threat Hunting',
    desc: 'Hypothesis-driven hunting with behavioral analytics, IOC correlation, and adversary TTP libraries.',
  },
  {
    icon: Lock,
    title: 'Identity Threat Detection',
    desc: 'Real-time monitoring of credential abuse, privilege escalation, and lateral movement across Active Directory and Entra ID.',
  },
  {
    icon: Layers,
    title: 'Forensics Timeline',
    desc: 'Reconstruct attack chains with nanosecond-precision event correlation and visual timeline analysis.',
  },
];

const stats = [
  { value: '< 4min', label: 'Mean time to detect' },
  { value: '99.7%', label: 'ATT&CK coverage' },
  { value: '2.1M', label: 'Events processed / day' },
  { value: '< 12min', label: 'Mean time to respond' },
];

const useCases = [
  {
    role: 'SOC Analysts',
    headline: 'Triage faster. Escalate smarter.',
    desc: 'Automated alert enrichment, severity scoring, and playbook-driven response — so analysts focus on real threats, not noise.',
  },
  {
    role: 'Threat Hunters',
    headline: 'Hunt with context, not guesswork.',
    desc: 'Behavioral baselines, adversary emulation data, and cross-domain telemetry for hypothesis-driven investigations.',
  },
  {
    role: 'CISOs & Security Leaders',
    headline: 'Board-ready posture in real time.',
    desc: 'Executive risk dashboards, compliance readiness scoring, and trend analysis — from MITRE coverage to vendor risk.',
  },
];

function ThreatParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animFrame: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const pts: Array<{ x: number; y: number; vx: number; vy: number; r: number; o: number }> = [];
    for (let i = 0; i < 60; i++) {
      pts.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.4,
        o: Math.random() * 0.3 + 0.05,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x,
            dy = pts[i].y - pts[j].y,
            d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(239,68,68,${0.06 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239,68,68,${pts[i].o})`;
        ctx.fill();
      }
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
      className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
    />
  );
}

function LiveCounter({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration]);
  return <>{count.toLocaleString()}</>;
}

export default function AegisMarketingHome() {
  return (
    <div className="min-h-screen bg-[#0a0608] text-gray-100 overflow-x-hidden">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-red-500/10 bg-[#0a0608]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">PARAGON</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Platform', 'Capabilities', 'Use Cases', 'Security', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-[13px] text-gray-400 hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[13px] text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/demo"
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-[13px] font-semibold rounded-lg transition-all"
            >
              Request demo <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      <section
        className="relative flex items-center justify-center pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20 overflow-hidden"
        style={{ minHeight: 'min(85vh, 760px)' }}
      >
        <ThreatParticles />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,rgba(239,68,68,0.08)_0%,transparent_70%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[11px] font-semibold text-red-400/80 tracking-[0.1em] uppercase">
              Cyber Defense Platform
            </span>
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
          >
            Stop breaches.{' '}
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
              Before they start.
            </span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Unified XDR, threat detection, and SOC automation. One platform.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/demo">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all text-[14px] shadow-lg shadow-red-500/20">
                Schedule a threat briefing <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/8 border border-white/10 text-gray-300 font-medium rounded-xl transition-all text-[14px]">
                Open SOC dashboard <Shield className="w-4 h-4" />
              </button>
            </Link>
          </m.div>
        </div>
      </section>

      <section className="border-y border-red-500/10 bg-[#0c0a0a]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((s, i) => (
            <m.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="text-center"
            >
              <p className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-1">
                {s.value}
              </p>
              <p className="text-[11px] sm:text-[12px] text-gray-500">{s.label}</p>
            </m.div>
          ))}
        </div>
      </section>

      <section id="platform" className="py-16 sm:py-24 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold text-red-400/60 tracking-[0.15em] uppercase mb-3">
              Live Threat Feed
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Real threats. Real time.
            </h2>
            <p className="text-gray-500 text-[14px] max-w-xl mx-auto">
              Continuous event correlation and triage across your attack surface.
            </p>
          </div>
          <div className="space-y-3">
            {threatFeed.map((t, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.12 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-[#110e0e]/80 border border-white/5 rounded-xl p-4"
              >
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap w-fit ${t.color}`}
                >
                  {t.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-200 leading-snug">{t.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{t.source}</p>
                </div>
                <span className="text-[10px] text-gray-600 shrink-0">{t.time}</span>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section id="capabilities" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[11px] font-semibold text-red-400/60 tracking-[0.15em] uppercase mb-3">
              Capabilities
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Full-spectrum cyber defense
            </h2>
            <p className="text-gray-500 text-[14px] sm:text-[15px] max-w-2xl mx-auto">
              Every layer of your security operation, unified.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {capabilities.map((c, i) => (
              <m.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group bg-[#110e0e]/60 border border-white/5 hover:border-red-500/20 rounded-xl p-5 sm:p-6 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/10 flex items-center justify-center mb-4">
                  <c.icon className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{c.title}</h3>
                <p className="text-gray-500 text-[13px] leading-relaxed">{c.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="py-16 sm:py-24 border-t border-white/5 bg-[#0c0a0a]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold text-red-400/60 tracking-[0.15em] uppercase mb-3">
              Built For
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Every role in the SOC
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {useCases.map((u, i) => (
              <m.div
                key={u.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-white/5 hover:border-red-500/15 rounded-xl p-6 sm:p-7 transition-all duration-300 bg-[#110e0e]/40"
              >
                <p className="text-[10px] font-bold text-red-400/70 uppercase tracking-[0.15em] mb-3">
                  {u.role}
                </p>
                <h3 className="text-[17px] font-bold text-white mb-3 leading-snug">{u.headline}</h3>
                <p className="text-gray-500 text-[13px] leading-relaxed">{u.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold text-red-400/60 tracking-[0.15em] uppercase mb-3">
              Coverage
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              MITRE ATT&CK — mapped and measured
            </h2>
            <p className="text-gray-500 text-[14px] max-w-2xl mx-auto">
              Every detection rule mapped to ATT&CK techniques. Real-time coverage visibility.
            </p>
            <p className="text-[12px] text-red-400/70 font-mono mt-3">
              {metricDisplay(AEGIS_MITRE_COVERAGE)}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
            {[
              'Initial Access',
              'Execution',
              'Persistence',
              'Privilege Escalation',
              'Defense Evasion',
              'Credential Access',
              'Discovery',
              'Lateral Movement',
              'Collection',
              'Exfiltration',
              'Command & Control',
              'Impact',
              'Reconnaissance',
              'Resource Development',
            ].map((tactic, i) => (
              <m.div
                key={tactic}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="bg-gradient-to-b from-red-500/8 to-transparent border border-red-500/10 rounded-lg p-3 text-center"
              >
                <p className="text-[10px] font-semibold text-red-400/80 leading-tight">{tactic}</p>
                <p className="text-[18px] font-bold text-white mt-1">
                  {Math.floor(85 + Math.random() * 14)}%
                </p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 border-t border-white/5 bg-[#0c0a0a]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[11px] font-semibold text-red-400/60 tracking-[0.15em] uppercase mb-4">
                Enterprise Grade
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                Security that secures itself
              </h2>
              <div className="space-y-4">
                {[
                  {
                    label: 'SOC 2 Type II compliant',
                    desc: 'Annual audits with continuous monitoring controls.',
                  },
                  {
                    label: 'Multi-tenant isolation',
                    desc: 'Complete data and compute separation between environments.',
                  },
                  {
                    label: 'Zero-trust architecture',
                    desc: 'Every request authenticated, authorized, and encrypted.',
                  },
                  {
                    label: 'Role-based access control',
                    desc: 'Granular permissions across every module and data set.',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <Shield className="w-2.5 h-2.5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-white">{item.label}</p>
                      <p className="text-[12px] text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#110e0e] border border-white/5 rounded-2xl p-6 sm:p-8">
              <div className="text-center mb-6">
                <p className="text-[11px] font-semibold text-gray-500 tracking-[0.1em] uppercase mb-2">
                  Platform Telemetry
                </p>
              </div>
              <div className="space-y-5">
                {[
                  { label: 'Events ingested today', value: '2,147,832' },
                  { label: 'Active detection rules', value: '1,247' },
                  { label: 'Automated responses', value: '89' },
                  { label: 'Mean detection time', value: '3.8 min' },
                  { label: 'Open incidents', value: '7' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-[13px] text-gray-400">{item.label}</span>
                    <span className="text-[14px] font-mono font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Your adversaries don't wait.{' '}
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Neither should you.
              </span>
            </h2>
            <p className="text-gray-500 text-[15px] mb-10 max-w-xl mx-auto leading-relaxed">
              Schedule a private threat briefing with the Aegis team. We'll assess your current
              posture and show you what you're missing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/demo">
                <button className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all text-[15px] shadow-lg shadow-red-500/20">
                  Schedule a threat briefing
                </button>
              </Link>
              <Link href="/">
                <button className="w-full sm:w-auto px-8 py-4 text-[14px] text-gray-400 hover:text-white transition-colors font-medium">
                  Explore the platform <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </Link>
            </div>
          </m.div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-[14px]">PARAGON</span>
              </div>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                {brand.products.find((p) => p.id === 'aegis')?.oneLiner ??
                  'Unified defense & intelligence command.'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-4">
                Platform
              </p>
              <div className="space-y-2.5">
                {['SOC Overview', 'XDR Console', 'Threat Hunting', 'MITRE ATT&CK'].map((l) => (
                  <p
                    key={l}
                    className="text-[13px] text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {l}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-4">
                Company
              </p>
              <div className="space-y-2.5">
                {['About', 'Security', 'Compliance', 'Contact'].map((l) => (
                  <p
                    key={l}
                    className="text-[13px] text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {l}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-4">
                Ecosystem
              </p>
              <div className="space-y-2.5">
                {[
                  { name: 'SZL Holdings', href: '/szl-holdings/' },
                  { name: 'SEXTANT', href: '/vessels/' },
                  { name: 'KORA', href: '/command/operations/' },
                  { name: 'DOMAINE', href: '/terra/' },
                  { name: 'Carlota Jo', href: '/carlota-jo/' },
                ].map((l) => (
                  <a
                    key={l.name}
                    href={l.href}
                    className="block text-[13px] text-gray-500 hover:text-white transition-colors"
                  >
                    {l.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed mb-6 max-w-[540px] text-gray-600">
            {aboutSzlParagraph()}
          </p>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-gray-600">{copyrightLine()}</p>
            <div className="flex gap-6">
              <a
                href="https://x.com/szlholdings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
              >
                X
              </a>
              <a
                href="https://linkedin.com/company/szlholdings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
              >
                LinkedIn
              </a>
              {['Privacy', 'Terms', 'Security'].map((l) => (
                <span
                  key={l}
                  className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
