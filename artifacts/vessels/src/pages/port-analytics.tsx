import {
  Anchor,
  ArrowDown,
  ArrowUp,
  Globe,
  Package,
} from 'lucide-react';

interface Port {
  name: string;
  country: string;
  code: string;
  status: 'operational' | 'congested' | 'restricted';
  vessels: number;
  avgWaitTime: string;
  throughput: string;
  berthOccupancy: number;
  cargoVolume: string;
  efficiency: number;
}

const ports: Port[] = [
  {
    name: 'Port of Rotterdam',
    country: 'Netherlands',
    code: 'NLRTM',
    status: 'operational',
    vessels: 42,
    avgWaitTime: '4.2h',
    throughput: '14.5M TEU',
    berthOccupancy: 78,
    cargoVolume: '437M tons',
    efficiency: 94,
  },
  {
    name: 'Port of Singapore',
    country: 'Singapore',
    code: 'SGSIN',
    status: 'congested',
    vessels: 67,
    avgWaitTime: '8.1h',
    throughput: '37.2M TEU',
    berthOccupancy: 95,
    cargoVolume: '582M tons',
    efficiency: 88,
  },
  {
    name: 'Port of Shanghai',
    country: 'China',
    code: 'CNSHA',
    status: 'operational',
    vessels: 54,
    avgWaitTime: '5.8h',
    throughput: '47.3M TEU',
    berthOccupancy: 82,
    cargoVolume: '620M tons',
    efficiency: 91,
  },
  {
    name: 'Port of Los Angeles',
    country: 'USA',
    code: 'USLAX',
    status: 'operational',
    vessels: 31,
    avgWaitTime: '3.4h',
    throughput: '9.9M TEU',
    berthOccupancy: 72,
    cargoVolume: '198M tons',
    efficiency: 96,
  },
  {
    name: 'Port of Hamburg',
    country: 'Germany',
    code: 'DEHAM',
    status: 'restricted',
    vessels: 28,
    avgWaitTime: '6.2h',
    throughput: '8.7M TEU',
    berthOccupancy: 68,
    cargoVolume: '126M tons',
    efficiency: 85,
  },
  {
    name: 'Port of Dubai',
    country: 'UAE',
    code: 'AEJEA',
    status: 'operational',
    vessels: 38,
    avgWaitTime: '3.1h',
    throughput: '15.4M TEU',
    berthOccupancy: 74,
    cargoVolume: '312M tons',
    efficiency: 97,
  },
];

const statusColors: Record<string, string> = {
  operational: 'bg-emerald-500/10 text-emerald-400',
  congested: 'bg-amber-500/10 text-amber-400',
  restricted: 'bg-red-500/10 text-red-400',
};

const cargoTypes = [
  { type: 'Containers', volume: '42%', trend: 'up', change: '+3.2%' },
  { type: 'Dry Bulk', volume: '28%', trend: 'up', change: '+1.8%' },
  { type: 'Liquid Bulk', volume: '18%', trend: 'down', change: '-0.5%' },
  { type: 'Break Bulk', volume: '8%', trend: 'up', change: '+0.7%' },
  { type: 'RoRo', volume: '4%', trend: 'up', change: '+2.1%' },
];

export default function PortAnalytics() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Anchor className="w-6 h-6 text-primary" /> Port Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Berth utilization, dwell time, and cargo throughput across global port networks
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Monitored Ports</div>
          <div className="text-2xl font-display font-bold">{ports.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Total SEXTANT in Port</div>
          <div className="text-2xl font-display font-bold">
            {ports.reduce((a, p) => a + p.vessels, 0)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Avg Wait Time</div>
          <div className="text-2xl font-display font-bold">
            {(ports.reduce((a, p) => a + parseFloat(p.avgWaitTime), 0) / ports.length).toFixed(1)}h
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground mb-1">Avg Efficiency</div>
          <div className="text-2xl font-display font-bold text-emerald-400">
            {Math.round(ports.reduce((a, p) => a + p.efficiency, 0) / ports.length)}%
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" /> Global Port Status
          </h2>
        </div>
        <div className="divide-y divide-border">
          {ports.map((port) => (
            <div key={port.code} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{port.code}</span>
                  <span className="text-sm font-semibold">{port.name}</span>
                  <span className="text-xs text-muted-foreground">{port.country}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[port.status]}`}
                  >
                    {port.status}
                  </span>
                </div>
                <span className="text-sm font-medium">{port.vessels} vessels</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Wait Time:</span>{' '}
                  <span className="font-medium">{port.avgWaitTime}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Throughput:</span>{' '}
                  <span className="font-medium">{port.throughput}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cargo:</span>{' '}
                  <span className="font-medium">{port.cargoVolume}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Berth:</span>
                  <span
                    className={`font-medium ml-1 ${port.berthOccupancy > 90 ? 'text-red-400' : port.berthOccupancy > 75 ? 'text-amber-400' : 'text-emerald-400'}`}
                  >
                    {port.berthOccupancy}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Efficiency:</span>{' '}
                  <span className="font-medium text-emerald-400">{port.efficiency}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-400" /> Cargo Distribution
        </h2>
        <div className="space-y-3">
          {cargoTypes.map((cargo) => (
            <div key={cargo.type} className="flex items-center gap-4">
              <span className="text-sm w-28">{cargo.type}</span>
              <div className="flex-1 bg-muted rounded-full h-3">
                <div className="bg-primary h-3 rounded-full" style={{ width: cargo.volume }} />
              </div>
              <span className="text-sm font-mono w-12 text-right">{cargo.volume}</span>
              <span
                className={`text-xs flex items-center gap-1 w-16 ${cargo.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {cargo.trend === 'up' ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {cargo.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
