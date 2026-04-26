import { PulseBriefingPanel } from '@szl-holdings/shared-ui/pulse-briefing-panel';
import { AnimatePresence, m } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Brain,
  Cpu,
  Eye,
  GitCommit,
  Globe,
  Layers,
  Lock,
  Network,
  Signal,
  Zap,
} from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import {
  AGENT_TYPES,
  AgentNeuralMesh,
  AppDetailPanel,
  ConstellationView,
  CrossDomainIntelFlow,
  DomainHealthGrid,
  GitTicker,
  ParticleField,
  PLATFORM_APPS,
  ThroughputChart,
} from './pulse-components';

const MetricCard = memo(function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  suffix,
  delay,
}: {
  label: string;
  value: number;
  icon: typeof Cpu;
  color: string;
  trend: string;
  suffix?: string;
  delay: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4 }}
      className="rounded-lg p-3 group cursor-default"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <ArrowUpRight
          className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color }}
        />
      </div>
      <div
        className="text-xl font-bold tabular-nums tracking-tight"
        style={{ color: 'rgba(255,255,255,0.85)' }}
      >
        {value.toLocaleString()}
        {suffix}
      </div>
      <div className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </div>
      <div className="text-[9px] mt-1" style={{ color: `${color}90` }}>
        {trend}
      </div>
    </m.div>
  );
});

export default function PulsePage() {
  const [time, setTime] = useState(new Date());
  const [selectedApp, setSelectedApp] = useState<(typeof PLATFORM_APPS)[0] | null>(null);
  const [totalEvents, setTotalEvents] = useState(847);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(
      () => setTotalEvents((prev) => prev + Math.floor(Math.random() * 3)),
      2000,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen relative" style={{ background: '#070a10' }}>
      <ParticleField />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
                <div
                  className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping"
                  style={{ background: '#10b981', opacity: 0.4 }}
                />
              </div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                Platform Pulse
              </h1>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(212,160,84,0.2), rgba(212,160,84,0.08))',
                  color: '#d4a054',
                  border: '1px solid rgba(212,160,84,0.2)',
                }}
              >
                LIVE
              </span>
            </div>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Real-time ecosystem intelligence — {PLATFORM_APPS.length} apps · {AGENT_TYPES.length}{' '}
              agents · {totalEvents.toLocaleString()} signals
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div
                className="text-[9px] uppercase tracking-[0.15em] font-medium"
                style={{ color: 'rgba(255,255,255,0.18)' }}
              >
                Uptime
              </div>
              <div className="text-lg font-bold tabular-nums" style={{ color: '#10b981' }}>
                99.97%
              </div>
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="text-right">
              <div
                className="text-[9px] uppercase tracking-[0.15em] font-medium"
                style={{ color: 'rgba(255,255,255,0.18)' }}
              >
                UTC
              </div>
              <div
                className="text-lg font-bold tabular-nums"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                {time.toUTCString().slice(17, 25)}
              </div>
            </div>
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg overflow-hidden mb-5 p-3"
          style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Signal Throughput
              </span>
            </div>
            <span className="text-[10px] tabular-nums font-medium" style={{ color: '#d4a054' }}>
              {totalEvents.toLocaleString()} / hr
            </span>
          </div>
          <ThroughputChart />
        </m.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <MetricCard
            label="Applications"
            value={16}
            icon={Layers}
            color="#d4a054"
            trend="All operational"
            delay={0}
          />
          <MetricCard
            label="DB Tables"
            value={446}
            icon={Cpu}
            color="#3b82f6"
            trend="+12 this week"
            delay={80}
          />
          <MetricCard
            label="API Endpoints"
            value={1618}
            suffix="+"
            icon={Globe}
            color="#06b6d4"
            trend="+47 this sprint"
            delay={160}
          />
          <MetricCard
            label="Active Agents"
            value={12}
            icon={Brain}
            color="#8b5cf6"
            trend="Neural mesh online"
            delay={240}
          />
          <MetricCard
            label="Signals / hr"
            value={totalEvents}
            icon={Signal}
            color="#f59e0b"
            trend="+23% throughput"
            delay={320}
          />
          <MetricCard
            label="Domains"
            value={9}
            icon={Eye}
            color="#10b981"
            trend="Full coverage"
            delay={400}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <PulseBriefingPanel domain="executive" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <m.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 rounded-lg p-4"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h2
              className="text-[13px] font-semibold mb-3 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <Network className="w-4 h-4" style={{ color: '#d4a054' }} />
              Ecosystem Constellation
            </h2>
            <ConstellationView onSelectApp={setSelectedApp} />
            <AnimatePresence>
              {selectedApp && (
                <AppDetailPanel app={selectedApp} onClose={() => setSelectedApp(null)} />
              )}
            </AnimatePresence>
          </m.div>

          <m.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-lg p-4"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h2
              className="text-[13px] font-semibold mb-3 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <Brain className="w-4 h-4" style={{ color: '#8b5cf6' }} />
              Agent Neural Mesh
              <span
                className="ml-auto text-[9px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}
              >
                {AGENT_TYPES.length} active
              </span>
            </h2>
            <AgentNeuralMesh />
          </m.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg p-4"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h2
              className="text-[13px] font-semibold mb-3 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <GitCommit className="w-4 h-4" style={{ color: '#d4a054' }} />
              Recent Commits
            </h2>
            <GitTicker />
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-lg p-4"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h2
              className="text-[13px] font-semibold mb-3 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <Zap className="w-4 h-4" style={{ color: '#06b6d4' }} />
              Cross-Domain Intel Flow
            </h2>
            <CrossDomainIntelFlow />
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg p-4"
            style={{
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <h2
              className="text-[13px] font-semibold mb-3 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              <Activity className="w-4 h-4" style={{ color: '#10b981' }} />
              Domain Health
            </h2>
            <DomainHealthGrid />
          </m.div>
        </div>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-lg p-4 mb-6"
          style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Platform Architecture
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'TypeScript', value: '5.9', color: '#3b82f6' },
              { label: 'Node.js', value: '24', color: '#10b981' },
              { label: 'React', value: '19', color: '#06b6d4' },
              { label: 'PostgreSQL', value: '16', color: '#8b5cf6' },
              { label: 'Express', value: '5', color: '#f59e0b' },
              { label: 'Drizzle', value: 'ORM', color: '#d4a054' },
              { label: 'Vite', value: '7.3', color: '#ec4899' },
              { label: 'Expo', value: '53', color: '#64748b' },
            ].map((tech) => (
              <div
                key={tech.label}
                className="text-center py-2 rounded-md"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="text-sm font-bold tabular-nums" style={{ color: tech.color }}>
                  {tech.value}
                </div>
                <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {tech.label}
                </div>
              </div>
            ))}
          </div>
        </m.div>

        <div className="text-center py-4">
          <p
            className="text-[9px] uppercase tracking-[0.25em]"
            style={{ color: 'rgba(255,255,255,0.08)' }}
          >
            SZL Holdings — Platform Pulse — Real-Time Ecosystem Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
