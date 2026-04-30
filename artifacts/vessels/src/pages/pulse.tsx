import {
  ParticleField,
  PulseEventFeed,
  PulseFlowDiagram,
  PulseHeader,
  PulseHealthGrid,
  PulseMetricCard,
  PulseTechStack,
  PulseThroughputChart,
} from '@szl-holdings/shared-ui/pulse';
import { PulseBriefingPanel } from '@szl-holdings/shared-ui/pulse-briefing-panel';
import { motion as m } from 'framer-motion';
import {
  Activity,
  Anchor,
  BarChart3,
  Compass,
  Gauge,
  Map,
  Navigation,
  Package,
  Ship,
  Waves,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const AGENTS = [
  { name: 'Fleet Navigator', domain: 'fleet' },
  { name: 'Route Optimizer', domain: 'routing' },
  { name: 'Cargo Tracker', domain: 'cargo' },
  { name: 'Port Intel', domain: 'ports' },
  { name: 'Risk Monitor', domain: 'risk' },
];

const EVENT_TYPES = [
  {
    type: 'route_deviation',
    messages: [
      'Vessel MSC Aurora: 2.3nm deviation detected',
      'Route adjusted for weather system',
      'ETA recalculated: +4h for MV Pacific',
    ],
  },
  {
    type: 'port_update',
    messages: [
      'Singapore: congestion index 73%',
      'Rotterdam berth 7 available',
      'LA/LB: vessel queue at 12 ships',
    ],
  },
  {
    type: 'cargo_status',
    messages: [
      'Container MSKU4829: cleared customs',
      'Reefer unit temp alert resolved',
      'Bulk cargo loading: 78% complete',
    ],
  },
  {
    type: 'weather_alert',
    messages: [
      'Tropical storm warning: South China Sea',
      'Fog advisory: English Channel',
      'Sea state 6: Bay of Biscay',
    ],
  },
  {
    type: 'compliance_check',
    messages: [
      'IMO 2020 fuel compliance verified',
      'ISPS code audit passed',
      'Ballast water exchange logged',
    ],
  },
];

function VesselMap() {
  const [vessels, setVessels] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 360 + 20,
      y: Math.random() * 130 + 20,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.2,
      name: [
        'MSC Aurora',
        'MV Pacific',
        'SS Meridian',
        'MV Atlas',
        'MT Horizon',
        'MV Compass',
        'SS Trident',
        'MV Echo',
      ][i],
      status: Math.random() > 0.2 ? 'transit' : 'port',
    })),
  );
  useEffect(() => {
    const t = setInterval(() => {
      setVessels((prev) =>
        prev.map((v) => ({
          ...v,
          x: v.status === 'port' ? v.x : Math.max(10, Math.min(390, v.x + v.dx)),
          y: v.status === 'port' ? v.y : Math.max(10, Math.min(160, v.y + v.dy)),
        })),
      );
    }, 100);
    return () => clearInterval(t);
  }, []);
  return (
    <svg viewBox="0 0 400 170" className="w-full h-40">
      <rect width="400" height="170" fill="rgba(6,182,212,0.03)" rx="4" />
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1="0"
          y1={i * 42 + 42}
          x2="400"
          y2={i * 42 + 42}
          stroke="rgba(6,182,212,0.06)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
      ))}
      {vessels.map((v) => (
        <g key={v.id}>
          <circle
            cx={v.x}
            cy={v.y}
            r={v.status === 'port' ? 5 : 4}
            fill={v.status === 'port' ? 'rgba(16,185,129,0.3)' : 'rgba(6,182,212,0.3)'}
            stroke={v.status === 'port' ? '#10b981' : '#06b6d4'}
            strokeWidth="1"
          />
          {v.status === 'transit' && (
            <circle
              cx={v.x}
              cy={v.y}
              r="4"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="0.5"
              opacity="0.3"
            >
              <animate attributeName="r" values="4;10;4" dur="3s" repeatCount="indefinite" />
              <animate
                attributeName="opacity"
                values="0.3;0;0.3"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          )}
          <text
            x={v.x}
            y={v.y - 8}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize="5"
            fontFamily="system-ui"
          >
            {v.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function VesselsPulse() {
  const [cargoVolume, setCargoVolume] = useState(4283);
  useEffect(() => {
    const t = setInterval(() => setCargoVolume((p) => p + Math.floor(Math.random() * 5)), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-screen relative" style={{ background: '#070a10' }}>
      <ParticleField accentColor="#06b6d4" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <PulseHeader
          title="Fleet Intelligence"
          subtitle={`Maritime operations — ${cargoVolume.toLocaleString()} TEU in transit · 8 vessels tracked`}
          accentColor="#06b6d4"
        />
        <div style={{ marginBottom: 20 }}>
          <PulseBriefingPanel domain="maritime" />
        </div>
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg overflow-hidden mb-5 p-3"
          style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" style={{ color: '#06b6d4' }} />
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Cargo Throughput
              </span>
            </div>
            <span className="text-[10px] tabular-nums font-medium" style={{ color: '#06b6d4' }}>
              {cargoVolume.toLocaleString()} TEU
            </span>
          </div>
          <PulseThroughputChart color="#06b6d4" />
        </m.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <PulseMetricCard
            label="Active Vessels"
            value={8}
            icon={Ship}
            color="#06b6d4"
            trend="All reporting"
            delay={0}
          />
          <PulseMetricCard
            label="Routes Active"
            value={12}
            icon={Navigation}
            color="#3b82f6"
            trend="3 high-risk"
            delay={80}
          />
          <PulseMetricCard
            label="Cargo TEU"
            value={cargoVolume}
            icon={Package}
            color="#10b981"
            trend="+12% throughput"
            delay={160}
          />
          <PulseMetricCard
            label="Port Calls"
            value={34}
            icon={Anchor}
            color="#f59e0b"
            trend="6 pending"
            delay={240}
          />
          <PulseMetricCard
            label="Sea State Avg"
            value={3}
            suffix="/9"
            icon={Waves}
            color="#8b5cf6"
            trend="Moderate seas"
            delay={320}
          />
          <PulseMetricCard
            label="Fuel Efficiency"
            value={94}
            suffix="%"
            icon={Gauge}
            color="#d4a054"
            trend="+2% this week"
            delay={400}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
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
              <Map className="w-4 h-4" style={{ color: '#06b6d4' }} /> Fleet Tracker
            </h2>
            <VesselMap />
          </m.div>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
              <Compass className="w-4 h-4" style={{ color: '#06b6d4' }} /> Maritime Event Stream
            </h2>
            <PulseEventFeed agents={AGENTS} eventTypes={EVENT_TYPES} />
          </m.div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
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
              <Anchor className="w-4 h-4" style={{ color: '#06b6d4' }} /> Supply Chain Flow
            </h2>
            <PulseFlowDiagram
              flows={[
                {
                  from: 'AIS',
                  to: 'Fleet',
                  type: 'Position Reports',
                  color: '#06b6d4',
                  intensity: 5,
                },
                {
                  from: 'Weather',
                  to: 'Route',
                  type: 'Storm Avoidance',
                  color: '#f59e0b',
                  intensity: 3,
                },
                {
                  from: 'Port',
                  to: 'Cargo',
                  type: 'Berth Allocation',
                  color: '#10b981',
                  intensity: 4,
                },
                {
                  from: 'Risk',
                  to: 'Ops',
                  type: 'Insurance Updates',
                  color: '#ef4444',
                  intensity: 2,
                },
                {
                  from: 'Fleet',
                  to: 'Exec',
                  type: 'Performance Reports',
                  color: '#d4a054',
                  intensity: 3,
                },
              ]}
            />
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
              <Activity className="w-4 h-4" style={{ color: '#10b981' }} /> Fleet Health
            </h2>
            <PulseHealthGrid
              items={[
                { name: 'Engine Systems', load: 34, color: '#06b6d4' },
                { name: 'Navigation', load: 22, color: '#3b82f6' },
                { name: 'Cargo Integrity', load: 15, color: '#10b981' },
                { name: 'Hull Sensors', load: 41, color: '#f59e0b' },
                { name: 'Fuel Systems', load: 56, color: '#d4a054' },
                { name: 'Communications', load: 28, color: '#8b5cf6' },
                { name: 'HVAC/Reefer', load: 63, color: '#ec4899' },
                { name: 'Safety Systems', load: 18, color: '#ef4444' },
              ]}
            />
          </m.div>
        </div>
        <div className="mt-5">
          <PulseTechStack
            items={[
              { label: 'AIS Feed', value: 'Live', color: '#06b6d4' },
              { label: 'Routes', value: '12', color: '#3b82f6' },
              { label: 'Ports', value: '47', color: '#10b981' },
              { label: 'Containers', value: '4.2K', color: '#f59e0b' },
              { label: 'IMO Comp', value: '100%', color: '#d4a054' },
              { label: 'Crew', value: '284', color: '#8b5cf6' },
              { label: 'Weather', value: '24/7', color: '#ec4899' },
              { label: 'Fuel', value: 'VLSFO', color: 'var(--gi-text-muted)' },
            ]}
            title="Fleet Architecture"
          />
        </div>
        <div className="text-center py-4 mt-4">
          <p
            className="text-[9px] uppercase tracking-[0.25em]"
            style={{ color: 'rgba(255,255,255,0.08)' }}
          >
            Vessels — Fleet Command Intelligence — Maritime Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
