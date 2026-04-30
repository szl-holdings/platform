
import {
  Activity,
  AlertTriangle,
  Anchor,
  BarChart3,
  Clock,
  RefreshCw,
  Ship,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

interface BerthSlot {
  id: string;
  name: string;
  status: 'occupied' | 'available' | 'maintenance' | 'reserved';
  vessel?: string;
  eta?: string;
  etd?: string;
  cargo?: string;
}

interface PortData {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: string;
  status: 'critical' | 'congested' | 'moderate' | 'normal';
  vessels_anchored: number;
  vessels_waiting: number;
  avg_wait_hours: number;
  berths_total: number;
  berths_occupied: number;
  throughput_teu: number;
  throughput_change: number;
  top_cargo: string;
  congestion_index: number;
  berths: BerthSlot[];
}

const PORTS: PortData[] = [
  {
    id: 'sgp',
    name: 'Port of Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    region: 'Asia Pacific',
    status: 'congested',
    vessels_anchored: 78,
    vessels_waiting: 34,
    avg_wait_hours: 52,
    berths_total: 67,
    berths_occupied: 61,
    throughput_teu: 3842000,
    throughput_change: -4.2,
    top_cargo: 'Electronics / Chemicals',
    congestion_index: 84,
    berths: [
      {
        id: 'B1',
        name: 'Berth 1 — Tanker',
        status: 'occupied',
        vessel: 'CHEM STAR',
        eta: '-',
        etd: '04 Apr 06:00',
        cargo: 'Chemicals',
      },
      {
        id: 'B2',
        name: 'Berth 2 — Container',
        status: 'occupied',
        vessel: 'EVER GIVEN III',
        eta: '-',
        etd: '05 Apr 14:00',
        cargo: 'General',
      },
      {
        id: 'B3',
        name: 'Berth 3 — Container',
        status: 'reserved',
        vessel: 'MSC ELARA',
        eta: '04 Apr 18:00',
        cargo: 'Mixed',
      },
      { id: 'B4', name: 'Berth 4 — Bulk', status: 'maintenance' },
      { id: 'B5', name: 'Berth 5 — Container', status: 'available' },
    ],
  },
  {
    id: 'sha',
    name: 'Shanghai Port',
    country: 'China',
    countryCode: 'CN',
    region: 'Asia Pacific',
    status: 'critical',
    vessels_anchored: 134,
    vessels_waiting: 67,
    avg_wait_hours: 96,
    berths_total: 125,
    berths_occupied: 121,
    throughput_teu: 7820000,
    throughput_change: -8.1,
    top_cargo: 'Consumer Goods / Electronics',
    congestion_index: 97,
    berths: [
      {
        id: 'B1',
        name: 'Yangshan Deep Water 1',
        status: 'occupied',
        vessel: 'COSCO UNIVERSE',
        eta: '-',
        etd: '06 Apr 08:00',
        cargo: 'Electronics',
      },
      {
        id: 'B2',
        name: 'Yangshan Deep Water 2',
        status: 'occupied',
        vessel: 'EVER ACE',
        eta: '-',
        etd: '04 Apr 22:00',
        cargo: 'Mixed',
      },
      {
        id: 'B3',
        name: 'Yangshan Deep Water 3',
        status: 'occupied',
        vessel: 'ONE APUS II',
        eta: '-',
        etd: '07 Apr 12:00',
        cargo: 'Consumer',
      },
    ],
  },
  {
    id: 'rot',
    name: 'Port of Rotterdam',
    country: 'Netherlands',
    countryCode: 'NL',
    region: 'Europe',
    status: 'moderate',
    vessels_anchored: 23,
    vessels_waiting: 8,
    avg_wait_hours: 18,
    berths_total: 89,
    berths_occupied: 54,
    throughput_teu: 1940000,
    throughput_change: 2.4,
    top_cargo: 'Energy / Chemicals',
    congestion_index: 42,
    berths: [
      {
        id: 'B1',
        name: 'ECT Delta 1',
        status: 'occupied',
        vessel: 'MAERSK NAVIGATOR',
        cargo: 'Containers',
      },
      { id: 'B2', name: 'ECT Delta 2', status: 'available' },
      {
        id: 'B3',
        name: 'Maasvlakte Oil — 1',
        status: 'occupied',
        vessel: 'AMANI',
        cargo: 'Crude Oil',
      },
      { id: 'B4', name: 'Maasvlakte Oil — 2', status: 'available' },
    ],
  },
  {
    id: 'lax',
    name: 'Port of Los Angeles',
    country: 'United States',
    countryCode: 'US',
    region: 'North America',
    status: 'moderate',
    vessels_anchored: 18,
    vessels_waiting: 11,
    avg_wait_hours: 24,
    berths_total: 43,
    berths_occupied: 34,
    throughput_teu: 1120000,
    throughput_change: 5.6,
    top_cargo: 'Retail / Auto',
    congestion_index: 56,
    berths: [
      {
        id: 'B1',
        name: 'Yusen Terminal B1',
        status: 'occupied',
        vessel: 'NYK ROMULUS',
        cargo: 'Auto',
      },
      { id: 'B2', name: 'TraPac B1', status: 'occupied', vessel: 'COSCO GLORY', cargo: 'Retail' },
      { id: 'B3', name: 'APMT Pier 400', status: 'available' },
    ],
  },
  {
    id: 'dxb',
    name: 'Jebel Ali Port',
    country: 'UAE',
    countryCode: 'AE',
    region: 'Middle East',
    status: 'normal',
    vessels_anchored: 12,
    vessels_waiting: 4,
    avg_wait_hours: 8,
    berths_total: 67,
    berths_occupied: 38,
    throughput_teu: 1480000,
    throughput_change: 8.3,
    top_cargo: 'Oil Products / Re-exports',
    congestion_index: 27,
    berths: [
      {
        id: 'B1',
        name: 'DP World Terminal 1',
        status: 'occupied',
        vessel: 'MSC ELARA',
        cargo: 'Mixed',
      },
      { id: 'B2', name: 'DP World Terminal 2', status: 'available' },
      {
        id: 'B3',
        name: 'Oil Terminal 1',
        status: 'occupied',
        vessel: 'AL KARAANA',
        cargo: 'Oil Products',
      },
    ],
  },
  {
    id: 'ham',
    name: 'Port of Hamburg',
    country: 'Germany',
    countryCode: 'DE',
    region: 'Europe',
    status: 'normal',
    vessels_anchored: 9,
    vessels_waiting: 3,
    avg_wait_hours: 6,
    berths_total: 52,
    berths_occupied: 29,
    throughput_teu: 990000,
    throughput_change: 1.1,
    top_cargo: 'Chemicals / Machinery',
    congestion_index: 18,
    berths: [
      {
        id: 'B1',
        name: 'HHLA CTA — 1',
        status: 'occupied',
        vessel: 'ANTARES VOYAGER',
        cargo: 'Machinery',
      },
      { id: 'B2', name: 'HHLA CTA — 2', status: 'available' },
    ],
  },
];

const STATUS_CONFIG = {
  critical: {
    label: 'Critical Congestion',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.25)',
  },
  congested: {
    label: 'Congested',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.25)',
  },
  moderate: {
    label: 'Moderate Delays',
    color: '#eab308',
    bg: 'rgba(234,179,8,0.1)',
    border: 'rgba(234,179,8,0.25)',
  },
  normal: {
    label: 'Normal',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.25)',
  },
};

const BERTH_STATUS_CONFIG = {
  occupied: { color: '#f97316', label: 'Occupied' },
  available: { color: '#22c55e', label: 'Available' },
  maintenance: { color: 'var(--gi-text-muted)', label: 'Maintenance' },
  reserved: { color: '#a78bfa', label: 'Reserved' },
};

function CongestionBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold w-6 text-right" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function _BerthAvailability({ berths }: { berths: BerthSlot[] }) {
  return (
    <div className="flex items-center gap-1">
      {berths.map((b) => {
        const cfg = BERTH_STATUS_CONFIG[b.status];
        return (
          <div
            key={b.id}
            className="w-3 h-5 rounded-sm"
            title={`${b.name}: ${cfg.label}${b.vessel ? ` — ${b.vessel}` : ''}`}
            style={{ background: `${cfg.color}40`, border: `1px solid ${cfg.color}50` }}
          />
        );
      })}
    </div>
  );
}

export default function PortCongestionPage() {
  const [selectedPort, setSelectedPort] = useState<PortData | null>(PORTS[0]);
  const [filterRegion, _setFilterRegion] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const _regions = ['all', ...Array.from(new Set(PORTS.map((p) => p.region)))];

  const filtered = PORTS.filter((p) => {
    const matchRegion = filterRegion === 'all' || p.region === filterRegion;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchRegion && matchStatus;
  });

  const criticalCount = PORTS.filter((p) => p.status === 'critical').length;
  const congestedCount = PORTS.filter((p) => p.status === 'congested').length;
  const avgWait = Math.round(PORTS.reduce((s, p) => s + p.avg_wait_hours, 0) / PORTS.length);
  const totalWaiting = PORTS.reduce((s, p) => s + p.vessels_waiting, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#040c1a]">
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: 'rgba(56,189,248,0.1)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(56,189,248,0.1)' }}
          >
            <Anchor className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sky-50">Port Congestion Monitor</h1>
            <p className="text-[10px] text-sky-400/40">
              Global port queue · berth availability · wait time estimates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded border text-[10px]"
            style={{
              borderColor: 'rgba(56,189,248,0.15)',
              color: '#38bdf8',
              background: 'rgba(56,189,248,0.06)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Live AIS Data
          </div>
          <button className="p-1.5 rounded hover:bg-sky-500/10 text-sky-400/40 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div
        className="px-6 py-3 border-b grid grid-cols-4 gap-4 shrink-0"
        style={{ borderColor: 'rgba(56,189,248,0.06)' }}
      >
        {[
          { label: 'Ports Critical', value: criticalCount, icon: AlertTriangle, color: '#ef4444' },
          { label: 'Ports Congested', value: congestedCount, icon: Activity, color: '#f97316' },
          { label: 'Vessels Waiting', value: totalWaiting, icon: Ship, color: '#38bdf8' },
          { label: 'Avg Wait Time', value: `${avgWait}h`, icon: Clock, color: '#a78bfa' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ borderColor: `${color}15`, background: `${color}06` }}
          >
            <Icon className="w-4 h-4 shrink-0" style={{ color }} />
            <div>
              <p className="text-[9px] text-sky-400/40">{label}</p>
              <p className="text-lg font-bold text-sky-50 font-mono">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Port List */}
        <div
          className="w-[360px] shrink-0 border-r flex flex-col overflow-hidden"
          style={{ borderColor: 'rgba(56,189,248,0.08)' }}
        >
          {/* Filters */}
          <div
            className="p-3 space-y-2 border-b shrink-0"
            style={{ borderColor: 'rgba(56,189,248,0.06)' }}
          >
            <div className="flex items-center gap-1 flex-wrap">
              {['all', 'critical', 'congested', 'moderate', 'normal'].map((s) => {
                const cfg = s !== 'all' ? STATUS_CONFIG[s as keyof typeof STATUS_CONFIG] : null;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className="px-2 py-0.5 rounded text-[9px] font-medium border transition-all"
                    style={{
                      borderColor:
                        filterStatus === s && cfg ? cfg.border : 'rgba(255,255,255,0.08)',
                      color:
                        filterStatus === s ? (cfg ? cfg.color : '#fff') : 'rgba(255,255,255,0.3)',
                      background: filterStatus === s && cfg ? cfg.bg : 'transparent',
                    }}
                  >
                    {s === 'all' ? 'All' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((port) => {
              const cfg = STATUS_CONFIG[port.status];
              const isSelected = selectedPort?.id === port.id;
              const berthUtil = Math.round((port.berths_occupied / port.berths_total) * 100);
              return (
                <button
                  key={port.id}
                  onClick={() => setSelectedPort(port)}
                  className="w-full text-left p-4 border-b transition-all"
                  style={{
                    borderColor: 'rgba(255,255,255,0.04)',
                    background: isSelected ? `${cfg.bg}` : 'transparent',
                    borderLeft: isSelected ? `2px solid ${cfg.color}` : '2px solid transparent',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-bold text-sky-50">{port.name}</span>
                        <span className="text-[9px] text-sky-400/30">{port.countryCode}</span>
                      </div>
                      <span className="text-[9px] text-sky-400/40">{port.region}</span>
                    </div>
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-bold border"
                      style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2 text-[9px]">
                    <div>
                      <span className="text-sky-400/30">Waiting</span>
                      <p className="font-bold text-sky-100">{port.vessels_waiting}</p>
                    </div>
                    <div>
                      <span className="text-sky-400/30">Avg Wait</span>
                      <p className="font-bold text-sky-100">{port.avg_wait_hours}h</p>
                    </div>
                    <div>
                      <span className="text-sky-400/30">Berths</span>
                      <p className="font-bold text-sky-100">{berthUtil}% full</p>
                    </div>
                  </div>
                  <CongestionBar value={port.congestion_index} color={cfg.color} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Port Detail */}
        {selectedPort &&
          (() => {
            const cfg = STATUS_CONFIG[selectedPort.status];
            const berthUtil = Math.round(
              (selectedPort.berths_occupied / selectedPort.berths_total) * 100,
            );
            return (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Port Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-bold text-sky-50">{selectedPort.name}</h2>
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-bold border"
                        style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-sky-400/40">
                      {selectedPort.country} · {selectedPort.region} · Primary cargo:{' '}
                      {selectedPort.top_cargo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-sky-400/30">Congestion Index</p>
                    <p className="text-3xl font-black font-mono" style={{ color: cfg.color }}>
                      {selectedPort.congestion_index}
                    </p>
                    <p className="text-[9px] text-sky-400/30">/ 100</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      label: 'Vessels at Anchor',
                      value: selectedPort.vessels_anchored,
                      icon: Anchor,
                      color: '#38bdf8',
                    },
                    {
                      label: 'Vessels Waiting',
                      value: selectedPort.vessels_waiting,
                      icon: Ship,
                      color: '#f97316',
                    },
                    {
                      label: 'Avg Wait Time',
                      value: `${selectedPort.avg_wait_hours}h`,
                      icon: Clock,
                      color: '#a78bfa',
                    },
                    {
                      label: 'Monthly TEU',
                      value: `${(selectedPort.throughput_teu / 1000000).toFixed(2)}M`,
                      icon: BarChart3,
                      color: '#34d399',
                    },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3 border"
                      style={{ borderColor: `${color}15`, background: `${color}06` }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3" style={{ color }} />
                        <span className="text-[9px] text-sky-400/30">{label}</span>
                      </div>
                      <p className="text-lg font-bold text-sky-50 font-mono">{value}</p>
                      {label === 'Monthly TEU' && (
                        <div className="flex items-center gap-1 mt-1">
                          {selectedPort.throughput_change >= 0 ? (
                            <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-2.5 h-2.5 text-red-400" />
                          )}
                          <span
                            className="text-[9px]"
                            style={{
                              color: selectedPort.throughput_change >= 0 ? '#34d399' : '#ef4444',
                            }}
                          >
                            {selectedPort.throughput_change >= 0 ? '+' : ''}
                            {selectedPort.throughput_change}% MoM
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Berth Availability */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: 'rgba(56,189,248,0.1)',
                    background: 'rgba(56,189,248,0.03)',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-sky-50 flex items-center gap-2">
                      <Anchor className="w-3.5 h-3.5 text-sky-400" /> Berth Availability
                    </h3>
                    <div className="flex items-center gap-3 text-[9px] text-sky-400/40">
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-sm inline-block"
                          style={{ background: 'rgba(249,115,22,0.4)' }}
                        />{' '}
                        Occupied
                      </span>
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-sm inline-block"
                          style={{ background: 'rgba(34,197,94,0.4)' }}
                        />{' '}
                        Available
                      </span>
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-sm inline-block"
                          style={{ background: 'rgba(167,139,250,0.4)' }}
                        />{' '}
                        Reserved
                      </span>
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-sm inline-block"
                          style={{ background: 'rgba(100,116,139,0.4)' }}
                        />{' '}
                        Maintenance
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-sky-400/50">Utilization</span>
                      <span style={{ color: cfg.color }}>
                        {berthUtil}% ({selectedPort.berths_occupied}/{selectedPort.berths_total})
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${berthUtil}%`, background: cfg.color }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedPort.berths.map((berth) => {
                      const bCfg = BERTH_STATUS_CONFIG[berth.status];
                      return (
                        <div
                          key={berth.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg border"
                          style={{ borderColor: `${bCfg.color}15`, background: `${bCfg.color}05` }}
                        >
                          <div
                            className="w-2 h-6 rounded-full shrink-0"
                            style={{ background: `${bCfg.color}50` }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium text-sky-100">{berth.name}</p>
                            {berth.vessel && (
                              <p className="text-[9px] text-sky-400/50 flex items-center gap-1">
                                <Ship className="w-2.5 h-2.5" /> {berth.vessel}
                                {berth.cargo && (
                                  <span className="ml-2 text-sky-400/30">· {berth.cargo}</span>
                                )}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-bold" style={{ color: bCfg.color }}>
                              {bCfg.label.toUpperCase()}
                            </span>
                            {berth.etd && (
                              <p className="text-[8px] text-sky-400/30">ETD {berth.etd}</p>
                            )}
                            {berth.eta && (
                              <p className="text-[8px] text-sky-400/30">ETA {berth.eta}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Waiting Queue */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: 'rgba(56,189,248,0.1)',
                    background: 'rgba(56,189,248,0.02)',
                  }}
                >
                  <h3 className="text-xs font-bold text-sky-50 mb-3 flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5 text-sky-400" /> Anchorage Queue —{' '}
                    {selectedPort.vessels_anchored} vessels waiting
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: 'MERIDIAN PIONEER', type: 'Container', wait: 72, priority: 'high' },
                      {
                        name: 'PACIFIC EMERALD',
                        type: 'Bulk Carrier',
                        wait: 54,
                        priority: 'normal',
                      },
                      {
                        name: 'CHEM STAR III',
                        type: 'Chemical Tanker',
                        wait: 38,
                        priority: 'normal',
                      },
                      { name: 'AL QASIM', type: 'Crude Oil', wait: 24, priority: 'high' },
                      { name: 'GLORY OF SEAS', type: 'Container', wait: 18, priority: 'low' },
                    ].map((vessel, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2.5 rounded-lg border"
                        style={{
                          borderColor: 'rgba(56,189,248,0.08)',
                          background: 'rgba(56,189,248,0.03)',
                        }}
                      >
                        <span className="text-[10px] font-mono text-sky-400/30 w-4">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-sky-100">{vessel.name}</p>
                          <p className="text-[9px] text-sky-400/40">{vessel.type}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-sky-400/30" />
                          <span
                            className="text-[10px] font-mono"
                            style={{
                              color:
                                vessel.wait > 48
                                  ? '#ef4444'
                                  : vessel.wait > 24
                                    ? '#f97316'
                                    : '#22c55e',
                            }}
                          >
                            {vessel.wait}h
                          </span>
                        </div>
                      </div>
                    ))}
                    {selectedPort.vessels_waiting > 5 && (
                      <p className="text-[9px] text-sky-400/30 text-center pt-1">
                        +{selectedPort.vessels_waiting - 5} more vessels in queue
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
