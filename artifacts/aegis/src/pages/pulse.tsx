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
  AlertTriangle,
  BarChart3,
  Bug,
  Crosshair,
  Eye,
  Fingerprint,
  Lock,
  Radar,
  Shield,
  Skull,
  Target,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const AGENTS = [
  { name: 'Sentinel SOC', domain: 'soc' },
  { name: 'Threat Hunter', domain: 'threat-intel' },
  { name: 'Compliance Bot', domain: 'governance' },
  { name: 'Incident Responder', domain: 'response' },
  { name: 'Vuln Scanner', domain: 'vulnerability' },
  { name: 'MSP Watchdog', domain: 'msp' },
];

const EVENT_TYPES = [
  {
    type: 'threat_detected',
    messages: [
      'C2 beacon pattern identified',
      'Lateral movement attempt blocked',
      'Phishing payload quarantined',
    ],
  },
  {
    type: 'ioc_matched',
    messages: [
      'IOC hash matched: SHA256 db4f…',
      'IP blacklist hit: 185.x.x.x',
      'Domain reputation: malicious',
    ],
  },
  {
    type: 'compliance_scan',
    messages: ['SOC2 control verified', 'NIST CSF gap identified', 'PCI-DSS scan passed'],
  },
  {
    type: 'vulnerability_found',
    messages: [
      'CVE-2026-0142 patched',
      'Critical vuln: RCE in edge proxy',
      'Zero-day advisory processed',
    ],
  },
  {
    type: 'incident_created',
    messages: [
      'P1 incident: unauthorized access',
      'P2 alert: anomalous egress',
      'P3 notice: failed login burst',
    ],
  },
  {
    type: 'mitre_coverage',
    messages: ['T1566 coverage: 94%', 'ATT&CK matrix updated', 'Detection rule deployed for T1059'],
  },
];

function MitreHeatmap() {
  const tactics = [
    'Recon',
    'Resource Dev',
    'Init Access',
    'Execution',
    'Persist',
    'Priv Esc',
    'Defense Evasion',
    'Cred Access',
    'Discovery',
    'Lat Move',
    'Collection',
    'Exfil',
    'C2',
    'Impact',
  ];
  const [coverage, setCoverage] = useState(() =>
    tactics.map(() => Math.floor(Math.random() * 40 + 60)),
  );
  useEffect(() => {
    const t = setInterval(
      () =>
        setCoverage((prev) =>
          prev.map((v) => Math.max(50, Math.min(100, v + Math.floor((Math.random() - 0.4) * 5)))),
        ),
      4000,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div className="grid grid-cols-7 gap-1">
      {tactics.map((t, i) => {
        const v = coverage[i];
        const r = v > 90 ? 0 : v > 75 ? 30 : v > 60 ? 60 : 100;
        const g = v > 90 ? 180 : v > 75 ? 140 : v > 60 ? 100 : 40;
        const b = v > 90 ? 80 : v > 75 ? 30 : v > 60 ? 20 : 20;
        return (
          <m.div
            key={t}
            className="rounded px-1 py-2 text-center"
            whileHover={{ scale: 1.05 }}
            style={{
              background: `rgba(${r},${g},${b},0.2)`,
              border: `1px solid rgba(${r},${g},${b},0.3)`,
            }}
          >
            <div className="text-[8px] font-bold truncate" style={{ color: `rgb(${r},${g},${b})` }}>
              {t}
            </div>
            <div
              className="text-[11px] font-bold tabular-nums mt-1"
              style={{ color: `rgb(${r},${g},${b})` }}
            >
              {v}%
            </div>
          </m.div>
        );
      })}
    </div>
  );
}

function ThreatRadar() {
  const [threats, setThreats] = useState<
    { angle: number; dist: number; severity: string; id: string }[]
  >([]);
  useEffect(() => {
    const t = setInterval(() => {
      setThreats((prev) => {
        const next = prev.filter((t) => Date.now() - parseInt(t.id) < 8000);
        if (next.length < 6) {
          next.push({
            angle: Math.random() * 360,
            dist: Math.random() * 0.8 + 0.1,
            severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
            id: Date.now().toString(),
          });
        }
        return next;
      });
    }, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto">
      {[30, 60, 90].map((r) => (
        <circle
          key={r}
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="rgba(59,130,246,0.08)"
          strokeWidth="1"
        />
      ))}
      <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(59,130,246,0.06)" strokeWidth="0.5" />
      <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(59,130,246,0.06)" strokeWidth="0.5" />
      <line x1="100" y1="100" x2="190" y2="100" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 100 100"
          to="360 100 100"
          dur="6s"
          repeatCount="indefinite"
        />
      </line>
      {threats.map((t) => {
        const rad = (t.angle * Math.PI) / 180;
        const x = 100 + Math.cos(rad) * t.dist * 90;
        const y = 100 + Math.sin(rad) * t.dist * 90;
        const color =
          t.severity === 'high' ? '#ef4444' : t.severity === 'medium' ? '#f59e0b' : '#3b82f6';
        return (
          <g key={t.id}>
            <circle cx={x} cy={y} r="3" fill={color} opacity="0.8">
              <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
      <circle
        cx="100"
        cy="100"
        r="6"
        fill="rgba(59,130,246,0.2)"
        stroke="#3b82f6"
        strokeWidth="1"
      />
    </svg>
  );
}

export default function AegisPulse() {
  const [totalThreats, setTotalThreats] = useState(2847);
  useEffect(() => {
    const t = setInterval(() => setTotalThreats((p) => p + Math.floor(Math.random() * 3)), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen relative" style={{ background: '#070a10' }}>
      <ParticleField accentColor="#3b82f6" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <PulseHeader
          title="Aegis Threat Pulse"
          subtitle={`SOC operations — ${totalThreats.toLocaleString()} threats processed · 6 defense agents active`}
          accentColor="#3b82f6"
        />
        <div style={{ marginBottom: 20 }}>
          <PulseBriefingPanel domain="security" />
        </div>

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
              <BarChart3 className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Threat Ingestion Rate
              </span>
            </div>
            <span className="text-[10px] tabular-nums font-medium" style={{ color: '#3b82f6' }}>
              {totalThreats.toLocaleString()} / hr
            </span>
          </div>
          <PulseThroughputChart color="#3b82f6" />
        </m.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <PulseMetricCard
            label="Active Threats"
            value={23}
            icon={Skull}
            color="#ef4444"
            trend="−3 from baseline"
            delay={0}
          />
          <PulseMetricCard
            label="Incidents Open"
            value={7}
            icon={AlertTriangle}
            color="#f97316"
            trend="2 P1, 5 P2"
            delay={80}
          />
          <PulseMetricCard
            label="IOCs Tracked"
            value={14892}
            icon={Fingerprint}
            color="#3b82f6"
            trend="+127 today"
            delay={160}
          />
          <PulseMetricCard
            label="MITRE Coverage"
            value={91}
            suffix="%"
            icon={Target}
            color="#10b981"
            trend="+2% this month"
            delay={240}
          />
          <PulseMetricCard
            label="Mean TTR"
            value={14}
            suffix="min"
            icon={Activity}
            color="#06b6d4"
            trend="−4 min improvement"
            delay={320}
          />
          <PulseMetricCard
            label="Assets Protected"
            value={3847}
            icon={Shield}
            color="#8b5cf6"
            trend="All monitored"
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
              <Radar className="w-4 h-4" style={{ color: '#3b82f6' }} /> Threat Radar
            </h2>
            <ThreatRadar />
            <p className="text-[9px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Live threat proximity map
            </p>
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
              <Eye className="w-4 h-4" style={{ color: '#ef4444' }} /> SOC Event Stream
              <span
                className="ml-auto text-[9px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}
              >
                6 agents
              </span>
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
              <Target className="w-4 h-4" style={{ color: '#10b981' }} /> MITRE ATT&CK Coverage
            </h2>
            <MitreHeatmap />
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
              <Shield className="w-4 h-4" style={{ color: '#3b82f6' }} /> Defense Intel Flow
            </h2>
            <PulseFlowDiagram
              flows={[
                { from: 'SIEM', to: 'SOC', type: 'Alert Triage', color: '#3b82f6', intensity: 4 },
                {
                  from: 'Threat',
                  to: 'Hunt',
                  type: 'IOC Enrichment',
                  color: '#ef4444',
                  intensity: 3,
                },
                {
                  from: 'Vuln',
                  to: 'Patch',
                  type: 'Remediation Queue',
                  color: '#f59e0b',
                  intensity: 2,
                },
                { from: 'GRC', to: 'Exec', type: 'Risk Reporting', color: '#10b981', intensity: 5 },
                {
                  from: 'MSP',
                  to: 'NOC',
                  type: 'Client Monitoring',
                  color: '#8b5cf6',
                  intensity: 3,
                },
              ]}
            />
          </m.div>
        </div>

        <PulseHealthGrid
          items={[
            { name: 'SIEM Pipeline', load: 67, color: '#3b82f6' },
            { name: 'EDR Coverage', load: 94, color: '#10b981' },
            { name: 'Firewall Rules', load: 45, color: '#f59e0b' },
            { name: 'DNS Filtering', load: 38, color: '#06b6d4' },
            { name: 'Email Security', load: 52, color: '#8b5cf6' },
            { name: 'SOAR Playbooks', load: 73, color: '#ec4899' },
            { name: 'Threat Intel', load: 61, color: '#ef4444' },
            { name: 'Audit Logs', load: 29, color: '#d4a054' },
          ]}
        />

        <div className="mt-5">
          <PulseTechStack
            items={[
              { label: 'SIEM', value: 'Elastic', color: '#3b82f6' },
              { label: 'EDR', value: 'Active', color: '#10b981' },
              { label: 'SOAR', value: 'Alloy', color: '#d4a054' },
              { label: 'Threat Intel', value: 'MISP', color: '#ef4444' },
              { label: 'GRC', value: 'Aegis', color: '#8b5cf6' },
              { label: 'MSP', value: 'Multi', color: '#64748b' },
              { label: 'Zero Trust', value: 'Active', color: '#06b6d4' },
              { label: 'Detection', value: 'ML', color: '#f59e0b' },
            ]}
            title="Security Stack"
          />
        </div>

        <div className="text-center py-4 mt-4">
          <p
            className="text-[9px] uppercase tracking-[0.25em]"
            style={{ color: 'rgba(255,255,255,0.08)' }}
          >
            Aegis — Unified Defense & Intelligence Command — Threat Pulse
          </p>
        </div>
      </div>
    </div>
  );
}
