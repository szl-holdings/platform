import { useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { Skeleton } from '@szl-holdings/shared-ui/ui/skeleton';
import { cn } from '@szl-holdings/shared-ui/utils';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Monitor,
  Printer,
  RefreshCw,
  Search,
  Server,
  Shield,
  Smartphone,
  Wifi,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Device {
  id: number;
  deviceId: string;
  hostname: string;
  clientName: string;
  type: 'server' | 'workstation' | 'network' | 'printer' | 'mobile' | 'firewall';
  os: string;
  ipAddress: string;
  site: string;
  status: 'online' | 'warning' | 'critical' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  alerts: number;
  patchesPending: number;
  threats: number;
  lastSeen: string;
}

interface DevicesResponse {
  devices: Device[];
  total: number;
}

const typeIcons: Record<string, typeof Server> = {
  server: Server,
  workstation: Monitor,
  network: Wifi,
  printer: Printer,
  mobile: Smartphone,
  firewall: Shield,
};

const statusConfig = {
  online: { color: 'text-[#c9b787] bg-[#c9b787]/10', icon: CheckCircle2, label: 'Online' },
  warning: { color: 'text-[#c9b787] bg-[#c9b787]/10', icon: AlertTriangle, label: 'Warning' },
  critical: { color: 'text-[#f5f5f5] bg-[#f5f5f5]/10', icon: XCircle, label: 'Critical' },
  offline: { color: 'text-zinc-400 bg-zinc-500/10', icon: XCircle, label: 'Offline' },
};

function formatLastSeen(lastSeen: string): string {
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function UsageBar({
  value,
  label,
  thresholds,
}: {
  value: number;
  label: string;
  thresholds?: { warn: number; crit: number };
}) {
  const warn = thresholds?.warn ?? 75;
  const crit = thresholds?.crit ?? 90;
  const color = value >= crit ? 'bg-[#f5f5f5]' : value >= warn ? 'bg-[#c9b787]' : 'bg-[#c9b787]';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono text-muted-foreground">{value}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function DeviceCard({ device, index }: { device: Device; index: number }) {
  const TypeIcon = typeIcons[device.type] || Server;
  const status = statusConfig[device.status as keyof typeof statusConfig] || statusConfig.offline;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.5) }}
      className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn('w-10 h-10 rounded-lg flex items-center justify-center', status.color)}
          >
            <TypeIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground font-mono group-hover:text-primary transition-colors">
              {device.hostname}
            </p>
            <p className="text-xs text-muted-foreground">{device.os || 'Unknown OS'}</p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            status.color,
          )}
        >
          <StatusIcon className="w-3 h-3" /> {status.label}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{device.clientName}</span>
          <span className="text-muted-foreground">{device.site}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-mono">{device.ipAddress}</span>
          <span className="text-muted-foreground">{formatLastSeen(device.lastSeen)}</span>
        </div>
      </div>

      {device.status !== 'offline' && (
        <div className="space-y-2 pt-3 border-t border-border/30">
          <UsageBar value={device.cpu} label="CPU" />
          <UsageBar value={device.memory} label="Memory" />
          <UsageBar value={device.disk} label="Disk" thresholds={{ warn: 80, crit: 90 }} />
        </div>
      )}

      {device.alerts > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-[#f5f5f5]" />
          <span className="text-xs font-semibold text-[#f5f5f5]">
            {device.alerts} active alert{device.alerts > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function DevicesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'client' | 'type'>('client');

  const { data, isLoading, refetch } = useStandardQuery<DevicesResponse>({
    queryKey: ['msp-devices'],
    queryFn: () => apiFetch<DevicesResponse>('/msp/devices?limit=200'),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const allDevices = data?.devices ?? [];

  const filtered = allDevices
    .filter(
      (d) =>
        d.hostname.toLowerCase().includes(search.toLowerCase()) ||
        (d.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.ipAddress || '').includes(search),
    )
    .filter((d) => typeFilter === 'all' || d.type === typeFilter)
    .filter((d) => statusFilter === 'all' || d.status === statusFilter);

  const grouped =
    groupBy === 'none'
      ? { All: filtered }
      : filtered.reduce(
          (acc, d) => {
            const key = groupBy === 'client' ? d.clientName || 'Unknown' : d.type;
            if (!acc[key]) acc[key] = [];
            acc[key].push(d);
            return acc;
          },
          {} as Record<string, Device[]>,
        );

  const online = allDevices.filter((d) => d.status === 'online').length;
  const warning = allDevices.filter((d) => d.status === 'warning').length;
  const critical = allDevices.filter((d) => d.status === 'critical').length;
  const offline = allDevices.filter((d) => d.status === 'offline').length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Device Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Endpoint health, resource utilization, and patch compliance across managed devices
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          : [
              { label: 'Online', value: online, color: 'text-[#c9b787]', icon: CheckCircle2 },
              { label: 'Warning', value: warning, color: 'text-[#c9b787]', icon: AlertTriangle },
              { label: 'Critical', value: critical, color: 'text-[#f5f5f5]', icon: XCircle },
              { label: 'Offline', value: offline, color: 'text-zinc-400', icon: Activity },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <stat.icon className={cn('w-4 h-4', stat.color)} />
                </div>
                <p className={cn('text-3xl font-display font-bold mt-2', stat.color)}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by hostname, client, or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {['all', 'server', 'workstation', 'network', 'firewall', 'printer', 'mobile'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                typeFilter === t
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {['all', 'online', 'warning', 'critical', 'offline'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">Group:</span>
          {(['none', 'client', 'type'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                groupBy === g
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              {g === 'none' ? 'None' : g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        Object.entries(grouped).map(([group, groupDevices]) => (
          <div key={group}>
            {groupBy !== 'none' && (
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-foreground capitalize">{group}</h2>
                <span className="text-xs text-muted-foreground">({groupDevices.length})</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupDevices.map((device, i) => (
                <DeviceCard key={device.id} device={device} index={i} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
